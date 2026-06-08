const fs = require('fs'); 
const lines = fs.readFileSync('src/components/App.tsx', 'utf8').split(/\r?\n/); 
const start = lines.findIndex(l => l.includes("activeTab === 'kalibrasi'")); 
console.log(lines.slice(start, start + 30).join('\n'));
