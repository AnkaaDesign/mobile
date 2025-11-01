#!/usr/bin/env node

/**
 * Automated script to remove unused imports from TypeScript files
 * Based on TS6133 errors from type-check output
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Running TypeScript type-check to find unused imports...\n');

// Run type-check and capture output
let typeCheckOutput;
try {
  execSync('npm run type-check 2>&1', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    stdio: 'pipe'
  });
} catch (error) {
  typeCheckOutput = error.stdout || error.stderr || '';
}

// Parse TS6133 errors (unused imports/variables)
const unusedPattern = /^(.+?)\((\d+),(\d+)\): error TS6133: '(.+?)' is declared but its value is never read\.$/gm;
const errors = [];

let match;
while ((match = unusedPattern.exec(typeCheckOutput)) !== null) {
  const [_, filePath, line, col, identifier] = match;

  // Only process src files, not node_modules
  if (filePath.startsWith('src/')) {
    errors.push({
      file: path.join(__dirname, '..', filePath),
      line: parseInt(line, 10),
      identifier
    });
  }
}

console.log(`Found ${errors.length} unused imports/variables in src/ files\n`);

// Group by file
const fileGroups = {};
errors.forEach(error => {
  if (!fileGroups[error.file]) {
    fileGroups[error.file] = [];
  }
  fileGroups[error.file].push(error);
});

let fixedFiles = 0;
let removedCount = 0;

// Process each file
Object.entries(fileGroups).forEach(([filePath, fileErrors]) => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let modified = false;

  // Sort errors by line number (descending) to avoid line number shifts
  const sortedErrors = fileErrors.sort((a, b) => b.line - a.line);

  sortedErrors.forEach(({ identifier, line }) => {
    // Pattern 1: Remove from destructured import
    // import { foo, bar, baz } from 'module'
    const destructuredPattern = new RegExp(
      `(import\\s*{[^}]*?)\\b${identifier}\\b\\s*,?\\s*([^}]*?})`,
      'gm'
    );

    if (destructuredPattern.test(content)) {
      content = content.replace(destructuredPattern, (match, before, after) => {
        // Remove the identifier and clean up commas
        let cleaned = match.replace(new RegExp(`\\b${identifier}\\b\\s*,?\\s*`), '');
        cleaned = cleaned.replace(/{\s*,/, '{'); // Remove leading comma
        cleaned = cleaned.replace(/,\s*}/, '}'); // Remove trailing comma
        cleaned = cleaned.replace(/,\s*,/g, ','); // Remove double commas

        // If empty import, remove entire line
        if (cleaned.match(/{\s*}/)) {
          return '';
        }

        return cleaned;
      });
      modified = true;
      removedCount++;
      return;
    }

    // Pattern 2: Remove standalone import
    // import foo from 'module'
    const standalonePattern = new RegExp(
      `^import\\s+${identifier}\\s+from\\s+['"][^'"]+['"];?\\s*$`,
      'gm'
    );

    if (standalonePattern.test(content)) {
      content = content.replace(standalonePattern, '');
      modified = true;
      removedCount++;
      return;
    }

    // Pattern 3: Remove from type import
    // import type { Foo, Bar } from 'module'
    const typeDestructuredPattern = new RegExp(
      `(import\\s+type\\s*{[^}]*?)\\b${identifier}\\b\\s*,?\\s*([^}]*?})`,
      'gm'
    );

    if (typeDestructuredPattern.test(content)) {
      content = content.replace(typeDestructuredPattern, (match, before, after) => {
        let cleaned = match.replace(new RegExp(`\\b${identifier}\\b\\s*,?\\s*`), '');
        cleaned = cleaned.replace(/{\s*,/, '{');
        cleaned = cleaned.replace(/,\s*}/, '}');
        cleaned = cleaned.replace(/,\s*,/g, ',');

        if (cleaned.match(/{\s*}/)) {
          return '';
        }

        return cleaned;
      });
      modified = true;
      removedCount++;
      return;
    }

    // Pattern 4: Remove unused const/let/var declarations
    const declarationPattern = new RegExp(
      `^\\s*(const|let|var)\\s+${identifier}\\s*=.+?;?\\s*$`,
      'gm'
    );

    if (declarationPattern.test(content)) {
      content = content.replace(declarationPattern, '');
      modified = true;
      removedCount++;
    }
  });

  // Clean up empty lines (max 2 consecutive)
  content = content.replace(/\n\n\n+/g, '\n\n');

  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedFiles++;
    console.log(`✅ Fixed: ${path.relative(path.join(__dirname, '..'), filePath)} (${fileErrors.length} removals)`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files processed: ${Object.keys(fileGroups).length}`);
console.log(`   Files modified: ${fixedFiles}`);
console.log(`   Imports/variables removed: ${removedCount}`);
console.log(`\n✨ Running type-check again to verify...\n`);

// Run type-check again
try {
  execSync('npm run type-check 2>&1', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    stdio: 'inherit'
  });
} catch (error) {
  console.log('\n⚠️  Some errors remain. Run npm run type-check to see details.');
  process.exit(1);
}
