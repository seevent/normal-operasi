const fs = require('fs'); 
const lines = fs.readFileSync('src/components/App.tsx', 'utf8').split(/\r?\n/); 
const start = lines.findIndex(l => l.includes("if (activeTab === 'cam') {")); 
console.log(lines.slice(start + 30, start + 60).join('\n'));
