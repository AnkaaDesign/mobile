#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing broken import statements...\n');

// Find all TypeScript/TSX files in src
const findFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });

  return results;
};

const files = findFiles(path.join(__dirname, '..', 'src'));
let fixedCount = 0;

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');

  // Remove lines that start with whitespace followed by "from"
  // These are broken import statements
  const fixed = content.split('\n').filter(line => {
    const isBrokenImport = /^\s+from\s+['"]/.test(line);
    return !isBrokenImport;
  }).join('\n');

  if (fixed !== content) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    fixedCount++;
    console.log(`✅ Fixed: ${path.relative(path.join(__dirname, '..'), filePath)}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files processed: ${files.length}`);
console.log(`   Files fixed: ${fixedCount}`);
console.log(`\n✨ Done!`);
