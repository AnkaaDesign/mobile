#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to process a single file
function fixUnusedImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Find all imports
    const importRegex = /^import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+)|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/gm;
    const imports = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const namedImports = match[1]; // { A, B, C }
      const defaultImport = match[2]; // React
      const namespaceImport = match[3]; // * as Something
      const from = match[4];

      if (namedImports) {
        const names = namedImports.split(',').map(n => {
          const parts = n.trim().split(/\s+as\s+/);
          return parts[parts.length - 1].trim();
        });

        imports.push({
          line: match[0],
          names,
          type: 'named'
        });
      } else if (defaultImport) {
        imports.push({
          line: match[0],
          names: [defaultImport],
          type: 'default'
        });
      } else if (namespaceImport) {
        imports.push({
          line: match[0],
          names: [namespaceImport],
          type: 'namespace'
        });
      }
    }

    // Check which imports are actually used
    imports.forEach(imp => {
      const unusedNames = [];

      imp.names.forEach(name => {
        // Skip React as it's often implicitly used
        if (name === 'React') return;

        // Create a regex to find usage (not in import statements)
        const usageRegex = new RegExp(`\\b${name}\\b`, 'g');
        const contentWithoutImports = content.replace(/^import\s+.+$/gm, '');

        if (!usageRegex.test(contentWithoutImports)) {
          unusedNames.push(name);
        }
      });

      // If all names in an import are unused, remove the entire import
      if (unusedNames.length === imp.names.length && imp.names.length > 0) {
        content = content.replace(imp.line + '\n', '');
        modified = true;
        console.log(`  Removed unused import: ${imp.line.substring(0, 50)}...`);
      } else if (unusedNames.length > 0 && imp.type === 'named') {
        // Remove only the unused named imports
        let newLine = imp.line;
        unusedNames.forEach(name => {
          // Handle "as" aliases
          const patterns = [
            new RegExp(`\\s*${name}\\s*,`, 'g'),
            new RegExp(`,\\s*${name}\\s*`, 'g'),
            new RegExp(`\\s*\\w+\\s+as\\s+${name}\\s*,`, 'g'),
            new RegExp(`,\\s*\\w+\\s+as\\s+${name}\\s*`, 'g')
          ];

          patterns.forEach(pattern => {
            newLine = newLine.replace(pattern, match => {
              return match.includes(',') ? ',' : '';
            });
          });
        });

        // Clean up any double commas or leading/trailing commas
        newLine = newLine.replace(/\{,/, '{').replace(/,\}/, '}').replace(/,,+/g, ',');

        if (newLine !== imp.line) {
          content = content.replace(imp.line, newLine);
          modified = true;
          console.log(`  Cleaned import: ${newLine.substring(0, 50)}...`);
        }
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Get all TypeScript/React files
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main execution
console.log('Starting to fix unused imports...\n');

const srcPath = path.join(__dirname, 'src');
const files = getAllFiles(srcPath);
let modifiedCount = 0;

files.forEach(file => {
  if (fixUnusedImportsInFile(file)) {
    modifiedCount++;
  }
});

console.log(`\nCompleted! Modified ${modifiedCount} files.`);