import { listNotebooks } from '../mcp-client.js';

async function main() {
    try {
        const result = await listNotebooks();
        const text = result.content[0].text;
        const notebooks = JSON.parse(text);
        
        console.log(`--- DANH SÁCH 34 NOTEBOOKS CON BOT TÌM THẤY ---`);
        notebooks.forEach((nb, i) => {
            console.log(`${i + 1}. ${nb.name} (ID: ${nb.id})`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Lỗi:', err);
        process.exit(1);
    }
}

main();
