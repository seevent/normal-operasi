const fs = require('fs');
const file = 'src/components/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetImport = "from 'lucide-react';";
if (code.includes(targetImport)) {
  code = code.replace(
    /import \{([^}]+)\} from 'lucide-react';/,
    (match, p1) => {
      let imports = p1.split(',').map(s => s.trim());
      if (!imports.includes('Database')) imports.push('Database');
      if (!imports.includes('RotateCcw')) imports.push('RotateCcw');
      return `import { ${imports.join(', ')} } from 'lucide-react';`;
    }
  );
  fs.writeFileSync(file, code, 'utf8');
  console.log('Added missing lucide-react imports');
} else {
  console.log('Could not find lucide-react imports');
}
