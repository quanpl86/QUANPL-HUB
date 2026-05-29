const scratchblocks = require('scratchblocks');
const doc = scratchblocks.parse("di chuyển (10) bước\nđợi đến khi < >\nthay đổi hiệu ứng [màu v]\n", { languages: ['en', 'vi'] });
const svg = scratchblocks.render(doc, { style: 'scratch3' });
console.log(svg.outerHTML);
