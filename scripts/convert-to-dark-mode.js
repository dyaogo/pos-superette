const fs = require('fs');
const path = require('path');

const conversions = {
  "background: 'white'": "background: 'var(--color-surface)'",
  'background: "white"': 'background: "var(--color-surface)"',
  "background: '#ffffff'": "background: 'var(--color-surface)'",
  "background: '#fff'": "background: 'var(--color-surface)'",
  
  "background: '#f9fafb'": "background: 'var(--color-surface-hover)'",
  "background: '#f8fafc'": "background: 'var(--color-surface-hover)'",
  "background: '#f5f5f5'": "background: 'var(--color-bg)'",
  
  "color: '#111827'": "color: 'var(--color-text-primary)'",
  "color: '#1f2937'": "color: 'var(--color-text-primary)'",
  "color: '#0f172a'": "color: 'var(--color-text-primary)'",
  
  "color: '#6b7280'": "color: 'var(--color-text-secondary)'",
  "color: '#9ca3af'": "color: 'var(--color-text-muted)'",
  
  "border: '1px solid #e5e7eb'": "border: '1px solid var(--color-border)'",
  "border: '1px solid #d1d5db'": "border: '1px solid var(--color-border)'",
};

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const [oldValue, newValue] of Object.entries(conversions)) {
    if (content.includes(oldValue)) {
      content = content.split(oldValue).join(newValue);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filePath}`);
    return true;
  }
  return false;
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalConverted = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      totalConverted += scanDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      if (convertFile(filePath)) {
        totalConverted++;
      }
    }
  });

  return totalConverted;
}

console.log('🔄 Conversion en cours...\n');
const pagesConverted = scanDirectory('./pages');
const componentsConverted = scanDirectory('./components');
console.log(`\n✅ Total: ${pagesConverted + componentsConverted} fichiers convertis`);