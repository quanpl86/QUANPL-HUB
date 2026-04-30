import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs-extra';
import mcp from './mcp-client.js';
import { addSyncLog } from './logger.js';

const STORAGE_ROOT = path.resolve('/Users/mac/Downloads/QUAN-PL-HUB/storage/notebooks');
const MAPPING_FILE = path.resolve('/Users/mac/Downloads/QUAN-PL-HUB/storage/mapping.json');

interface NotebookMapping {
    [folderName: string]: {
        notebook_id: string;
        name: string;
    };
}

let mappings: NotebookMapping = {};

/**
 * Tải dữ liệu Mapping từ file
 */
async function loadMappings() {
    if (await fs.pathExists(MAPPING_FILE)) {
        mappings = await fs.readJson(MAPPING_FILE);
    } else {
        mappings = {};
        await fs.writeJson(MAPPING_FILE, mappings, { spaces: 2 });
    }
}

/**
 * Lưu dữ liệu Mapping vào file
 */
export async function saveMapping(folderName: string, notebookId: string, name: string) {
    mappings[folderName] = { notebook_id: notebookId, name };
    await fs.writeJson(MAPPING_FILE, mappings, { spaces: 2 });
    
    // Đảm bảo thư mục tồn tại
    const folderPath = path.join(STORAGE_ROOT, folderName);
    await fs.ensureDir(folderPath);
}

/**
 * Khởi động File Watcher
 */
export async function startNeuralSync() {
    await loadMappings();
    console.log(`[Neural Sync] 🧠 Khởi động giám sát: ${STORAGE_ROOT}`);

    const watcher = chokidar.watch(STORAGE_ROOT, {
        ignored: /(^|[\/\\])\../, // Bỏ qua file ẩn
        persistent: true,
        ignoreInitial: true // Không sync đợt đầu khi mới bật
    });

    watcher.on('add', async (filePath) => {
        const relativePath = path.relative(STORAGE_ROOT, filePath);
        const parts = relativePath.split(path.sep);
        
        if (parts.length < 2) return; // Không nằm trong folder notebook

        const folderName = parts[0];
        const fileName = parts[1];
        const mapping = mappings[folderName];

        if (!mapping) {
            addSyncLog(`⚠️ Không tìm thấy mapping cho thư mục: ${folderName}`, 'error');
            return;
        }

        addSyncLog(`📤 Phát hiện file mới: ${fileName} -> Notebook: ${mapping.name}`, 'info');
        
        try {
            // Sử dụng manageSources với action 'add' để đẩy file lên
            // Đây là tool ổn định nhất, mô phỏng thao tác trên trình duyệt
            const uploadResult = await mcp.manageSources(mapping.notebook_id, 'add', [{ 
                type: 'file', 
                path: filePath,
                title: fileName 
            }]);
            addSyncLog(`✅ Đã upload thành công: ${fileName}`, 'success');
        } catch (error: any) {
            addSyncLog(`❌ Lỗi đồng bộ ${fileName}: ${error.message}`, 'error');
        }
    });

    console.log(`[Neural Sync] ✅ Đang rình rập file...`);
}

export default {
    startNeuralSync,
    saveMapping
};
