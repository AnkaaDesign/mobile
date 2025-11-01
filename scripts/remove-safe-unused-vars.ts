#!/usr/bin/env tsx

/**
 * Safe Unused Variable Remover
 *
 * Removes unused variables that are safe to remove:
 * - Unused destructured properties from hooks (but keeps the rest)
 * - Unused function return values
 * - Avoids removing: debug variables, error handlers, state setters
 */

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

// Variables that should NOT be removed even if unused
const PROTECTED_NAMES = new Set([
  'isDark',
  'insets',
  'router',
  'navigation',
  'error',
  'isError',
  'isLoading',
  'loading',
  'refreshing',
  'isFetching',
  'isRefetching',
  'isFetchingNextPage',
]);

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

    if (!file.startsWith('src/')) continue;

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

function validateSyntax(filePath: string): boolean {
  try {
    const sourceCode = fs.readFileSync(filePath, 'utf8');
    // Basic syntax check - ensure balanced braces
    const openBraces = (sourceCode.match(/{/g) || []).length;
    const closeBraces = (sourceCode.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function isSafeToRemove(identifier: string, line: string): boolean {
  // Don't remove protected names
  if (PROTECTED_NAMES.has(identifier)) {
    return false;
  }

  // Don't remove if it's in a console.log or console.error
  if (line.includes('console.log') || line.includes('console.error') || line.includes('console.warn')) {
    return false;
  }

  // Don't remove if it's a state setter (e.g., setFoo, handleFoo)
  if (identifier.startsWith('set') || identifier.startsWith('handle')) {
    return false;
  }

  // Don't remove if it looks like an event handler prop (e.g., onClick, onPress)
  if (identifier.startsWith('on')) {
    return false;
  }

  // Don't remove if it's in a comment
  if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
    return false;
  }

  return true;
}

function removeUnusedVariable(line: string, identifier: string): string | null {
  // Pattern 1: Destructured variable in the middle { foo, bar, baz }
  const destructuredMiddlePattern = new RegExp(`,\\s*${identifier}\\s*,`, 'g');
  if (destructuredMiddlePattern.test(line)) {
    return line.replace(destructuredMiddlePattern, ',');
  }

  // Pattern 2: Destructured variable at the start { foo, bar }
  const destructuredStartPattern = new RegExp(`{\\s*${identifier}\\s*,`, 'g');
  if (destructuredStartPattern.test(line)) {
    return line.replace(destructuredStartPattern, '{');
  }

  // Pattern 3: Destructured variable at the end { foo, bar }
  const destructuredEndPattern = new RegExp(`,\\s*${identifier}\\s*}`, 'g');
  if (destructuredEndPattern.test(line)) {
    return line.replace(destructuredEndPattern, '}');
  }

  // Pattern 4: Only variable in destructuring { foo } = ...
  const destructuredOnlyPattern = new RegExp(`{\\s*${identifier}\\s*}\\s*=`, 'g');
  if (destructuredOnlyPattern.test(line)) {
    // Remove entire line
    return '';
  }

  // Pattern 5: Simple const/let/var declaration
  const simpleVarPattern = new RegExp(`^\\s*(const|let|var)\\s+${identifier}\\s*=`);
  if (simpleVarPattern.test(line)) {
    return '';
  }

  return null;
}

function fixFile(filePath: string, errors: ParsedError[]): boolean {
  const originalContent = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  try {
    let lines = originalContent.split('\n');
    const sortedErrors = errors.sort((a, b) => b.line - a.line);

    for (const error of sortedErrors) {
      if (!error.identifier) continue;

      const lineIndex = error.line - 1;
      const originalLine = lines[lineIndex];

      if (!originalLine) continue;
      if (!isSafeToRemove(error.identifier, originalLine)) continue;

      const newLine = removeUnusedVariable(originalLine, error.identifier);

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

    fs.writeFileSync(filePath, newContent, 'utf8');

    if (!validateSyntax(filePath)) {
      console.log(`  ⚠️  Syntax validation failed, rolling back...`);
      fs.writeFileSync(filePath, originalContent, 'utf8');
      return false;
    }

    return true;
  } catch (error) {
    console.error(`  ❌ Error: ${error}`);
    fs.writeFileSync(filePath, originalContent, 'utf8');
    return false;
  }
}

async function main() {
  console.log('🚀 Safe Unused Variable Remover\n');
  console.log('📊 Running type-check...\n');

  const typeCheckOutput = await getTypeCheckErrors();
  const allErrors = parseErrors(typeCheckOutput);

  const unusedErrors = allErrors.filter(e => e.code === 'TS6133' || e.code === 'TS6192');

  console.log(`✅ Found ${unusedErrors.length} unused variable errors\n`);

  if (unusedErrors.length === 0) {
    console.log('🎉 No unused variables to remove!');
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

  for (const [file, fileErrors] of Object.entries(errorsByFile)) {
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    process.stdout.write(`Processing ${relativePath}... `);

    const fixed = fixFile(file, fileErrors);

    if (fixed) {
      fixedFiles++;
      totalFixed += fileErrors.length;
      console.log(`✅ Fixed ${fileErrors.length} vars`);
    } else {
      console.log(`⏭️  Skipped`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${Object.keys(errorsByFile).length}`);
  console.log(`   Files modified: ${fixedFiles}`);
  console.log(`   Variables removed: ${totalFixed}`);

  console.log('\n✨ Running type-check to verify...\n');

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
    console.log(`   Unused variables: ${newUnusedCount}`);
    console.log(`   Other errors: ${newErrors.length - newUnusedCount}`);
  }
}

main().catch(console.error);
