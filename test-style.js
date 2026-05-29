const fs = require('fs');
const content = fs.readFileSync('node_modules/scratchblocks/build/scratchblocks.min.es.js', 'utf8');
const idMatch = content.match(/id\s*=\s*['"]scratchblocks-style['"]/);
console.log("ID match:", idMatch);
const appendMatch = content.match(/appendChild/g);
console.log("Append matches:", appendMatch ? appendMatch.length : 0);
