const fs = require('fs');
let content = fs.readFileSync('src/app/utility-hub/scratchblocks/page.tsx', 'utf8');

const appendText = `
        /* Chỉnh màu nền và viền các ô input - PHẢI ĐẶT Ở CUỐI CÙNG ĐỂ KHÔNG BỊ OVERRIDE */
        .sb3-input-number, .sb3-input-string { fill: #ffffff !important; stroke: rgba(0,0,0,0.15) !important; stroke-width: 1px !important; }
`;

const insertIndex = content.indexOf('      `;\n      styleEl.textContent = cssText;');
if (insertIndex !== -1) {
    content = content.substring(0, insertIndex) + appendText + content.substring(insertIndex);
    fs.writeFileSync('src/app/utility-hub/scratchblocks/page.tsx', content);
    console.log("Appended successfully");
} else {
    console.log("Could not find insert point");
}
