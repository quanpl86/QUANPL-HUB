import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs-extra';
import mcp from './mcp-client.js';
import { addSyncLog } from './logger.js';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

const STORAGE_ROOT = process.env.STORAGE_PATH 
  ? path.resolve(process.env.STORAGE_PATH, 'notebooks')
  : path.resolve('/Users/mac/Downloads/QUAN-PL-HUB/storage/notebooks');

const MAPPING_FILE = process.env.MAPPING_FILE 
  ? path.resolve(process.env.MAPPING_FILE)
  : path.resolve(path.dirname(STORAGE_ROOT), 'mapping.json');

interface NotebookMapping {
  [folderName: string]: { notebook_id: string; name: string };
}

let mappings: NotebookMapping = {};

/** Load mapping */
async function loadMappings() {
  try {
    if (await fs.pathExists(MAPPING_FILE)) {
      mappings = await fs.readJson(MAPPING_FILE);
    } else {
      mappings = {};
      await fs.writeJson(MAPPING_FILE, mappings, { spaces: 2 });
    }
  } catch (err) {
    logger.error({ err }, '[Neural Sync] Failed to load mappings');
    mappings = {};
  }
}

/** Save mapping */
export async function saveMapping(folderName: string, notebookId: string, name: string) {
  mappings[folderName] = { notebook_id: notebookId, name };
  await fs.writeJson(MAPPING_FILE, mappings, { spaces: 2 });
  await fs.ensureDir(path.join(STORAGE_ROOT, folderName));
  logger.info(`[Neural Sync] Saved mapping: ${folderName} → ${notebookId}`);
}

/** Prune old mappings */
export async function pruneMappings(validNotebookIds: string[]) {
  await loadMappings();
  const newMappings: NotebookMapping = {};
  let prunedCount = 0;

  for (const [folder, data] of Object.entries(mappings)) {
    if (validNotebookIds.includes(data.notebook_id)) {
      newMappings[folder] = data;
    } else {
      prunedCount++;
    }
  }

  mappings = newMappings;
  await fs.writeJson(MAPPING_FILE, mappings, { spaces: 2 });
  logger.info(`[Neural Sync] 🧹 Pruned ${prunedCount} old mappings`);
  return prunedCount;
}

/** Start File Watcher */
export async function startNeuralSync() {
  await loadMappings();
  logger.info(`[Neural Sync] 🧠 Watching folder: ${STORAGE_ROOT}`);

  const watcher = chokidar.watch(STORAGE_ROOT, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 1500, pollInterval: 100 }
  });

  watcher.on('add', async (filePath) => {
    const relativePath = path.relative(STORAGE_ROOT, filePath);
    const parts = relativePath.split(path.sep);
    if (parts.length < 2) return;

    const folderName = parts[0];
    const fileName = parts[parts.length - 1];
    const mapping = mappings[folderName];

    if (!mapping) {
      addSyncLog(`⚠️ No mapping found for folder: ${folderName}`, 'warn');
      return;
    }

    addSyncLog(`📤 New file detected: ${fileName} → ${mapping.name}`, 'info');

    try {
      await mcp.manageSources(mapping.notebook_id, 'add', [{
        type: 'file',
        path: filePath,
        title: fileName
      }]);
      addSyncLog(`✅ Uploaded: ${fileName}`, 'success');
    } catch (error: any) {
      logger.error({ error: error.message, file: fileName }, 'Upload failed');
      addSyncLog(`❌ Upload failed ${fileName}: ${error.message}`, 'error');
    }
  });

  logger.info(`[Neural Sync] ✅ Watcher is running...`);
}

export default { startNeuralSync, saveMapping, pruneMappings };
