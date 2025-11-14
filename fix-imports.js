#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files with relative imports to hooks, constants, or utils
console.log('Finding files with relative imports...');
const grepResult = execSync(
  `grep -rl "from ['\\"]\\.\\..*/(hooks\\|constants\\|utils)" src/`,
  { encoding: 'utf-8', cwd: '/Users/kennedycampos/Documents/repositories/mobile' }
).trim();

const files = grepResult.split('\n').filter(Boolean);
console.log(`Found ${files.length} files to fix`);

let totalReplacements = 0;

files.forEach((file) => {
  const filePath = path.join('/Users/kennedycampos/Documents/repositories/mobile', file);
  console.log(`\nProcessing: ${file}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  let replacements = 0;

  // Replace relative imports for hooks
  const hooksRegex = /from ['"](\.\.\/)+(hooks[^'"]*)['"]/g;
  content = content.replace(hooksRegex, (match, dots, hookPath) => {
    replacements++;
    return `from "@/${hookPath}"`;
  });

  // Replace relative imports for constants
  const constantsRegex = /from ['"](\.\.\/)+(constants[^'"]*)['"]/g;
  content = content.replace(constantsRegex, (match, dots, constPath) => {
    replacements++;
    return `from "@/${constPath}"`;
  });

  // Replace relative imports for utils
  const utilsRegex = /from ['"](\.\.\/)+(utils[^'"]*)['"]/g;
  content = content.replace(utilsRegex, (match, dots, utilPath) => {
    replacements++;
    return `from "@/${utilPath}"`;
  });

  if (replacements > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✓ Made ${replacements} replacement(s)`);
    totalReplacements += replacements;
  }
});

console.log(`\n✓ Complete! Made ${totalReplacements} total replacements across ${files.length} files`);
