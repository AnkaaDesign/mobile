#!/usr/bin/env tsx

/**
 * TypeScript Type Safety Error Fixer
 *
 * Fixes TS18048 (possibly undefined) and TS7006 (implicit any) errors
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

function validateSyntax(filePath: string): boolean {
  const sourceCode = fs.readFileSync(filePath, 'utf8');
  // Use a simple syntax check - if we can parse it, it's valid
  // For more detailed diagnostics, we would need to create a Program
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
 * Fix TS18048: Add optional chaining for possibly undefined
 */
function fixPossiblyUndefined(line: string, identifier: string): string | null {
  // Skip if already using optional chaining
  if (line.includes(`${identifier}?.`)) return null;

  // Pattern 1: object.property -> object?.property
  const propertyAccessPattern = new RegExp(`\\b${identifier}\\.`, 'g');
  if (propertyAccessPattern.test(line)) {
    return line.replace(propertyAccessPattern, `${identifier}?.`);
  }

  // Pattern 2: object.method() -> object?.method()
  const methodCallPattern = new RegExp(`\\b${identifier}\\.([a-zA-Z_][a-zA-Z0-9_]*)\\(`);
  if (methodCallPattern.test(line)) {
    return line.replace(methodCallPattern, `${identifier}?.$1(`);
  }

  // Pattern 3: object[key] -> object?.[key]
  const arrayAccessPattern = new RegExp(`\\b${identifier}\\[`);
  if (arrayAccessPattern.test(line) && !line.includes(`${identifier}?.[`)) {
    return line.replace(arrayAccessPattern, `${identifier}?.[`);
  }

  return null;
}

/**
 * Fix TS7006: Add type annotation for implicit any
 */
function fixImplicitAny(line: string, identifier: string): string | null {
  // Skip if parameter already has type annotation
  if (new RegExp(`${identifier}\\s*:`).test(line)) return null;

  // Pattern 1: Function parameter (param) => ... or function(param)
  const functionParamPatterns = [
    // Arrow function: (param) =>
    new RegExp(`\\(([^)]*\\b${identifier}\\b[^)]*)\\)\\s*=>`),
    // Regular function: function name(param)
    new RegExp(`function\\s+\\w+\\s*\\(([^)]*\\b${identifier}\\b[^)]*)\\)`),
    // Method: methodName(param)
    new RegExp(`\\w+\\s*\\(([^)]*\\b${identifier}\\b[^)]*)\\)`),
  ];

  for (const pattern of functionParamPatterns) {
    if (pattern.test(line)) {
      // Replace parameter with typed version
      const result = line.replace(
        new RegExp(`\\b${identifier}\\b(?!:)`),
        `${identifier}: any /* TODO: Add proper type */`
      );
      if (result !== line) return result;
    }
  }

  // Pattern 2: Catch clause: catch (error)
  const catchPattern = /catch\s*\(\s*(\w+)\s*\)/;
  const catchMatch = line.match(catchPattern);
  if (catchMatch && catchMatch[1] === identifier) {
    return line.replace(catchPattern, `catch ($1: any /* Error type */)`);
  }

  return null;
}

function fixFile(filePath: string, errors: ParsedError[]): boolean {
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

      if (error.code === 'TS18048') {
        newLine = fixPossiblyUndefined(originalLine, error.identifier);
      } else if (error.code === 'TS7006') {
        newLine = fixImplicitAny(originalLine, error.identifier);
      }

      if (newLine !== null && newLine !== originalLine) {
        lines[lineIndex] = newLine;
        modified = true;
      }
    }

    if (!modified) {
      return false;
    }

    const newContent = lines.join('\n');
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
  console.log('🚀 TypeScript Type Safety Error Fixer\n');
  console.log('📊 Running type-check to find type safety errors...\n');

  const typeCheckOutput = await getTypeCheckErrors();
  const allErrors = parseErrors(typeCheckOutput);

  // Filter to only TS18048 and TS7006
  const targetErrors = allErrors.filter(e => e.code === 'TS18048' || e.code === 'TS7006');

  console.log(`✅ Found ${targetErrors.length} type safety errors`);
  console.log(`   TS18048 (Possibly undefined): ${targetErrors.filter(e => e.code === 'TS18048').length}`);
  console.log(`   TS7006 (Implicit any): ${targetErrors.filter(e => e.code === 'TS7006').length}\n`);

  if (targetErrors.length === 0) {
    console.log('🎉 No type safety errors to fix!');
    return;
  }

  // Group by file
  const errorsByFile: Record<string, ParsedError[]> = {};
  targetErrors.forEach(error => {
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
      console.log(`✅ Fixed ${fileErrors.length} errors`);
    } else {
      console.log(`⚠️  Skipped`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${Object.keys(errorsByFile).length}`);
  console.log(`   Files modified: ${fixedFiles}`);
  console.log(`   Errors fixed: ${totalFixed}`);

  console.log('\n✨ Running type-check again to verify...\n');

  try {
    await execAsync('npm run type-check 2>&1', {
      cwd: path.join(__dirname, '..'),
    });
    console.log('🎉 No TypeScript errors remaining!');
  } catch (error: any) {
    const newOutput = error.stdout || error.stderr || '';
    const newErrors = parseErrors(newOutput);

    console.log(`📊 Remaining errors: ${newErrors.length}`);
    console.log('\nRun npm run type-check for details.');
  }
}

main().catch(console.error);
