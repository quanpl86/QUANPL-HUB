const fs = require('fs');
let content = fs.readFileSync('src/app/utility-hub/scratchblocks/page.tsx', 'utf8');

const newCSS = `      const cssText = \`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700&display=swap');

        /* Font Override cho CodeKitten */
        .sb3-label, .sb3-literal-number, .sb3-literal-string, .sb3-literal-dropdown, .sb3-literal-number-dropdown, .sb3-comment-label {
          font-family: 'Quicksand', 'Nunito', sans-serif !important;
          font-weight: 700 !important;
        }

        /* Chỉnh màu chữ các ô input */
        .sb3-literal-number, .sb3-literal-string { fill: #575e75 !important; }
        .sb3-literal-dropdown, .sb3-literal-number-dropdown { fill: #ffffff !important; }

        /* Motion */
        .sb3-motion { fill: \${CODEKITTEN_COLORS['#4c97ff']} !important; stroke: \${CODEKITTEN_COLORS['#3373cc']} !important; }
        .sb3-motion-alt { fill: \${CODEKITTEN_COLORS['#4280d7']} !important; }
        .sb3-motion-dark { fill: \${CODEKITTEN_COLORS['#3373cc']} !important; }

        /* Looks */
        .sb3-looks { fill: \${CODEKITTEN_COLORS['#9966ff']} !important; stroke: \${CODEKITTEN_COLORS['#774dcb']} !important; }
        .sb3-looks-alt { fill: \${CODEKITTEN_COLORS['#855cd6']} !important; }
        .sb3-looks-dark { fill: \${CODEKITTEN_COLORS['#774dcb']} !important; }

        /* Sound */
        .sb3-sound { fill: \${CODEKITTEN_COLORS['#cf63cf']} !important; stroke: \${CODEKITTEN_COLORS['#bd42bd']} !important; }
        .sb3-sound-alt { fill: \${CODEKITTEN_COLORS['#c94fc9']} !important; }
        .sb3-sound-dark { fill: \${CODEKITTEN_COLORS['#bd42bd']} !important; }

        /* Events */
        .sb3-events { fill: \${CODEKITTEN_COLORS['#ffbf00']} !important; stroke: \${CODEKITTEN_COLORS['#cc9900']} !important; }
        .sb3-events-alt { fill: \${CODEKITTEN_COLORS['#e6ac00']} !important; }
        .sb3-events-dark { fill: \${CODEKITTEN_COLORS['#cc9900']} !important; }

        /* Control */
        .sb3-control { fill: \${CODEKITTEN_COLORS['#ffab19']} !important; stroke: \${CODEKITTEN_COLORS['#cf8b17']} !important; }
        .sb3-control-alt { fill: \${CODEKITTEN_COLORS['#ec9c13']} !important; }
        .sb3-control-dark { fill: \${CODEKITTEN_COLORS['#cf8b17']} !important; }

        /* Sensing */
        .sb3-sensing { fill: \${CODEKITTEN_COLORS['#5cb1d6']} !important; stroke: \${CODEKITTEN_COLORS['#2e8eb8']} !important; }
        .sb3-sensing-alt { fill: \${CODEKITTEN_COLORS['#47a8d1']} !important; }
        .sb3-sensing-dark { fill: \${CODEKITTEN_COLORS['#2e8eb8']} !important; }

        /* Operators */
        .sb3-operators { fill: \${CODEKITTEN_COLORS['#59c059']} !important; stroke: \${CODEKITTEN_COLORS['#389438']} !important; }
        .sb3-operators-alt { fill: \${CODEKITTEN_COLORS['#46b946']} !important; }
        .sb3-operators-dark { fill: \${CODEKITTEN_COLORS['#389438']} !important; }

        /* Variables */
        .sb3-variables { fill: \${CODEKITTEN_COLORS['#ff8c1a']} !important; stroke: \${CODEKITTEN_COLORS['#db6e00']} !important; }
        .sb3-variables-alt { fill: \${CODEKITTEN_COLORS['#ff8000']} !important; }
        .sb3-variables-dark { fill: \${CODEKITTEN_COLORS['#db6e00']} !important; }

        /* List */
        .sb3-list { fill: \${CODEKITTEN_COLORS['#ff661a'] || '#F4901E'} !important; stroke: \${CODEKITTEN_COLORS['#e64d00'] || '#C26A0A'} !important; }
        .sb3-list-alt { fill: \${CODEKITTEN_COLORS['#ff5500'] || '#DB7C12'} !important; }
        .sb3-list-dark { fill: \${CODEKITTEN_COLORS['#e64d00'] || '#C26A0A'} !important; }

        /* Custom / My Blocks */
        .sb3-custom { fill: \${CODEKITTEN_COLORS['#ff6680']} !important; stroke: \${CODEKITTEN_COLORS['#ff3355']} !important; }
        .sb3-custom-alt { fill: \${CODEKITTEN_COLORS['#ff4d6a']} !important; }
        .sb3-custom-dark { fill: \${CODEKITTEN_COLORS['#ff3355']} !important; }
      \`;`;

const startIndex = content.indexOf('const cssText = `');
const endIndex = content.indexOf('`;', startIndex) + 2;

content = content.substring(0, startIndex) + newCSS + content.substring(endIndex);
fs.writeFileSync('src/app/utility-hub/scratchblocks/page.tsx', content);
console.log("Replaced");
