const fs = require('fs');
let content = fs.readFileSync('src/app/utility-hub/scratchblocks/page.tsx', 'utf8');

// Fix syntax error
content = content.replace('vâ\ninterface ChatMessage', 'interface ChatMessage');

// Extract the input background CSS
const inputBgRegex = /\/\* Chỉnh màu nền và viền các ô input \*\/\s*\.sb3-input-number,\s*\.sb3-input-string\s*\{\s*fill:\s*#ffffff\s*!important;\s*stroke:\s*#d1d1d1\s*!important;\s*stroke-width:\s*1px\s*!important;\s*\}/;

const inputBgMatch = content.match(inputBgRegex);
if (inputBgMatch) {
    // Remove it from its current position
    content = content.replace(inputBgMatch[0], '');
    
    // Insert it right before the closing backtick of cssText
    const endCssIndex = content.indexOf('      `;\n      styleEl.textContent = cssText;');
    if (endCssIndex !== -1) {
        content = content.substring(0, endCssIndex) + 
                  '\n        ' + inputBgMatch[0] + '\n' +
                  content.substring(endIndex);
    }
}
fs.writeFileSync('src/app/utility-hub/scratchblocks/page.tsx', content);
console.log("Fixed syntax error and moved input CSS to bottom.");
