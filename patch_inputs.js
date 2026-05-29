const fs = require('fs');
let content = fs.readFileSync('src/app/utility-hub/scratchblocks/page.tsx', 'utf8');

const replacement = `
        /* Chỉnh màu nền và viền các ô input */
        .sb3-input-number, .sb3-input-string { fill: #ffffff !important; stroke: #d1d1d1 !important; stroke-width: 1px !important; }
        
        /* Chỉnh màu chữ các ô input */
        .sb3-literal-number, .sb3-literal-string { fill: #575e75 !important; }
        .sb3-literal-dropdown, .sb3-literal-number-dropdown { fill: #ffffff !important; }
`;

content = content.replace('        /* Chỉnh màu chữ các ô input */\n        .sb3-literal-number, .sb3-literal-string { fill: #575e75 !important; }\n        .sb3-literal-dropdown, .sb3-literal-number-dropdown { fill: #ffffff !important; }', replacement.trim());
fs.writeFileSync('src/app/utility-hub/scratchblocks/page.tsx', content);
