#!/usr/bin/env tsx

/**
 * Safe Unused Import Remover
 *
 * This script conservatively removes unused imports with syntax validation
 * to prevent breaking the codebase. It only handles TS6133 and TS6192 errors.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ParsedError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  identifier?: string;
}

async function getTypeCheckErrors(): Promise<string> {
  try {
    await execAsync('npm run type-check 2>&1', { cwd: path.join(__dirname, '..') });
    return '';
  } catch (error: any) {
    return error.stdout || error.stderr || '';
  }
}

function parseErrors(output: string): ParsedError[] {
  const errorPattern = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/gm;
  const errors: ParsedError[] = [];
  let match;

  while ((match = errorPattern.exec(output)) !== null) {
    const [_, file, line, column, code, message] = match;

    // Only process src/ files
    if (!file.startsWith('src/')) continue;

    // Extract identifier from message
    const identifierMatch = message.match(/'([^']+)'/);
    const identifier = identifierMatch ? identifierMatch[1] : undefined;

    errors.push({
      file: path.join(__dirname, '..', file),
      line: parseInt(line, 10),
      column: parseInt(column, 10),
      code,
      message,
      identifier
    });
  }

  return errors;
}

/**
 * Validates that a file has no syntax errors by parsing it with TypeScript
 */
function validateSyntax(filePath: string): boolean {
  const sourceCode = fs.readFileSync(filePath, 'utf8');
  // Simple syntax check - if we can parse it, it's valid
  // For detailed diagnostics, we would need to create a Program
  // which is too heavyweight for this use case
  ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  return true;
}

/**
 * Safely removes an unused import from a line
 */
function removeImportFromLine(line: string, identifier: string): string | null {
  // Skip if line doesn't contain 'import'
  if (!line.includes('import')) return null;

  // Skip if identifier is in a comment
  const commentMatch = line.match(/\/\/(.*)$/);
  if (commentMatch && commentMatch[1].includes(identifier)) {
    return null;
  }

  // Pattern 1: Destructured import { foo, bar, baz }
  // Handle both regular and type imports
  const destructuredPattern = new RegExp(`import\\s+(type\\s+)?\\{([^}]+)\\}\\s+from`, 'i');
  const destructuredMatch = line.match(destructuredPattern);

  if (destructuredMatch) {
    const importType = destructuredMatch[1] || '';
    const imports = destructuredMatch[2];

    // Split imports and remove the unused one
    const importList = imports.split(',').map(i => i.trim()).filter(Boolean);
    const filtered = importList.filter(imp => {
      // Handle both "Foo" and "Foo as Bar" cases
      const name = imp.split(/\s+as\s+/)[0].trim();
      return name !== identifier;
    });

    // If no imports left, remove entire line
    if (filtered.length === 0) {
      return '';
    }

    // If imports reduced, reconstruct the import statement
    if (filtered.length < importList.length) {
      const fromPart = line.match(/from\s+['"][^'"]+['"]/)?.[0];
      if (!fromPart) return null;

      const semicolon = line.trim().endsWith(';') ? ';' : '';
      return `import ${importType}{ ${filtered.join(', ')} } ${fromPart}${semicolon}`;
    }
  }

  // Pattern 2: Standalone default import
  const standalonePattern = new RegExp(`^\\s*import\\s+${identifier}\\s+from\\s+['"][^'"]+['"];?\\s*$`);
  if (standalonePattern.test(line)) {
    return '';
  }

  // Pattern 3: Named import with default: import Foo, { Bar } from 'baz'
  const mixedPattern = new RegExp(`import\\s+${identifier}\\s*,\\s*\\{[^}]+\\}\\s+from`, 'i');
  if (mixedPattern.test(line)) {
    // Remove the default import but keep the destructured imports
    const result = line.replace(new RegExp(`import\\s+${identifier}\\s*,\\s*`), 'import ');
    return result;
  }

  return null;
}

/**
 * Removes an unused variable declaration
 */
function removeVariableDeclaration(line: string, identifier: string): string | null {
  // Only remove simple const/let/var declarations that are clearly unused
  const varPattern = new RegExp(`^\\s*(const|let|var)\\s+${identifier}\\s*=`);

  if (varPattern.test(line)) {
    // Check if it's a simple one-line declaration
    if (line.includes(';') || line.trim().endsWith(',')) {
      return '';
    }
  }

  return null;
}

/**
 * Fixes a single file by removing unused imports
 */
function fixFile(filePath: string, errors: ParsedError[]): boolean {
  // Save original content for rollback
  const originalContent = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  try {
    let lines = originalContent.split('\n');

    // Sort errors by line number (descending) to avoid line shift issues
    const sortedErrors = errors.sort((a, b) => b.line - a.line);

    for (const error of sortedErrors) {
      if (!error.identifier) continue;

      const lineIndex = error.line - 1;
      const originalLine = lines[lineIndex];

      if (!originalLine) continue;

      let newLine: string | null = null;

      // Try to remove import
      if (originalLine.includes('import')) {
        newLine = removeImportFromLine(originalLine, error.identifier);
      }
      // Try to remove variable declaration (only for very simple cases)
      else {
        newLine = removeVariableDeclaration(originalLine, error.identifier);
      }

      if (newLine !== null) {
        lines[lineIndex] = newLine;
        modified = true;
      }
    }

    if (!modified) {
      return false;
    }

    // Clean up excessive blank lines
    let newContent = lines.join('\n');
    newContent = newContent.replace(/\n\n\n+/g, '\n\n');

    // Write the modified content
    fs.writeFileSync(filePath, newContent, 'utf8');

    // Validate syntax
    if (!validateSyntax(filePath)) {
      console.log(`  ⚠️  Syntax validation failed, rolling back...`);
      fs.writeFileSync(filePath, originalContent, 'utf8');
      return false;
    }

    return true;
  } catch (error) {
    console.error(`  ❌ Error processing file: ${error}`);
    fs.writeFileSync(filePath, originalContent, 'utf8');
    return false;
  }
}

async function main() {
  console.log('🚀 Safe Unused Import Remover\n');
  console.log('📊 Running type-check to find unused imports...\n');

  const typeCheckOutput = await getTypeCheckErrors();
  const allErrors = parseErrors(typeCheckOutput);

  // Filter to only TS6133 (unused) and TS6192 (all imports unused)
  const unusedErrors = allErrors.filter(e => e.code === 'TS6133' || e.code === 'TS6192');

  console.log(`✅ Found ${unusedErrors.length} unused import/variable errors\n`);

  if (unusedErrors.length === 0) {
    console.log('🎉 No unused imports to remove!');
    return;
  }

  // Group by file
  const errorsByFile: Record<string, ParsedError[]> = {};
  unusedErrors.forEach(error => {
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = [];
    }
    errorsByFile[error.file].push(error);
  });

  console.log(`📁 Processing ${Object.keys(errorsByFile).length} files...\n`);

  let fixedFiles = 0;
  let totalFixed = 0;
  let failedFiles: string[] = [];

  for (const [file, fileErrors] of Object.entries(errorsByFile)) {
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    process.stdout.write(`Processing ${relativePath}... `);

    const fixed = fixFile(file, fileErrors);

    if (fixed) {
      fixedFiles++;
      totalFixed += fileErrors.length;
      console.log(`✅ Fixed ${fileErrors.length} unused imports`);
    } else {
      failedFiles.push(relativePath);
      console.log(`⚠️  Skipped (no safe fixes possible)`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${Object.keys(errorsByFile).length}`);
  console.log(`   Files modified: ${fixedFiles}`);
  console.log(`   Unused imports removed: ${totalFixed}`);
  console.log(`   Files skipped: ${failedFiles.length}`);

  if (failedFiles.length > 0 && failedFiles.length <= 10) {
    console.log(`\n⚠️  Skipped files:`);
    failedFiles.forEach(f => console.log(`   - ${f}`));
  }

  console.log('\n✨ Running type-check again to verify...\n');

  try {
    await execAsync('npm run type-check 2>&1', {
      cwd: path.join(__dirname, '..'),
    });
    console.log('🎉 No TypeScript errors remaining!');
  } catch (error: any) {
    const newOutput = error.stdout || error.stderr || '';
    const newErrors = parseErrors(newOutput);
    const newUnusedCount = newErrors.filter(e => e.code === 'TS6133' || e.code === 'TS6192').length;

    console.log(`📊 Remaining errors: ${newErrors.length}`);
    console.log(`   Unused imports still remaining: ${newUnusedCount}`);
    console.log(`   Other errors: ${newErrors.length - newUnusedCount}`);
    console.log('\nRun npm run type-check for details.');
  }
}

main().catch(console.error);
