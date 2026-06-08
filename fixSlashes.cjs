const fs = require('fs');
let src = fs.readFileSync('src/components/App.tsx', 'utf8');
src = src.replace(/\\`/g, '`');
src = src.replace(/\\\$/g, '$');
fs.writeFileSync('src/components/App.tsx', src, 'utf8');
