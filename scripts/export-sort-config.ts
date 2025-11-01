#!/usr/bin/env tsx

/**
 * Export SortConfig Types
 *
 * Automatically adds export to SortConfig type declarations that are missing it
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const filesToFix = [
  'src/components/administration/employee/list/employee-table.tsx',
  'src/components/administration/notification/list/notification-table.tsx',
  'src/components/inventory/borrow/list/borrow-table.tsx',
  'src/components/inventory/ppe/list/ppe-table.tsx',
  'src/components/inventory/supplier/list/supplier-table.tsx',
  'src/components/inventory/activity/list/activity-table.tsx',
  'src/components/inventory/order/schedule/order-schedule-table.tsx',
  'src/components/inventory/order/list/order-table.tsx',
  'src/components/inventory/item/category/list/category-table.tsx',
  'src/components/inventory/item/list/item-table.tsx',
  'src/components/inventory/item/brand/list/brand-table.tsx',
  'src/components/production/garage/list/garage-table.tsx',
  'src/components/production/observation/list/observation-table.tsx',
  'src/components/production/cutting/list/cutting-plan-table.tsx',
  'src/components/human-resources/warning/list/warning-table.tsx',
  'src/components/human-resources/position/list/position-table.tsx',
  'src/components/human-resources/ppe/schedule/list/ppe-schedule-table.tsx',
  'src/components/human-resources/ppe/list/ppe-table.tsx',
  'src/components/human-resources/ppe/size/list/ppe-size-table.tsx',
  'src/components/human-resources/performance-level/list/performance-level-table.tsx',
  'src/components/administration/monitoring/metric/list/metric-table.tsx',
];

function exportSortConfig(filePath: string): boolean {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return false;
  }

  const originalContent = fs.readFileSync(fullPath, 'utf8');
  let modified = originalContent;

  // Check if file already has SortConfig re-export
  if (/^export.*SortConfig/m.test(modified)) {
    return false; // Already exported
  }

  // Check if file imports SortConfig from somewhere else
  const importMatch = modified.match(/import.*type.*\{[^}]*SortConfig[^}]*\}.*from\s+["']([^"']+)["']/);

  if (importMatch) {
    // File imports SortConfig from another module, add re-export at the end
    const importPath = importMatch[1];

    // Add re-export before the last line (usually empty or displayName)
    const exportStatement = `\n// Re-export SortConfig for consumer components\nexport type { SortConfig } from "${importPath}";\n`;

    // Check if file already has this export
    if (!modified.includes('export type { SortConfig }') && !modified.includes('export { SortConfig }')) {
      modified = modified.trimEnd() + exportStatement;
    }
  }
  // Check if file defines its own SortConfig
  else if (/^interface SortConfig/m.test(modified) && !/^export interface SortConfig/m.test(modified)) {
    modified = modified.replace(/^interface SortConfig/gm, 'export interface SortConfig');
  }
  else if (/^type SortConfig/m.test(modified) && !/^export type SortConfig/m.test(modified)) {
    modified = modified.replace(/^type SortConfig/gm, 'export type SortConfig');
  }

  if (modified !== originalContent) {
    fs.writeFileSync(fullPath, modified, 'utf8');
    return true;
  }

  return false;
}

async function main() {
  console.log('🚀 Exporting SortConfig Types\n');

  let fixed = 0;
  let alreadyExported = 0;
  let notFound = 0;

  for (const file of filesToFix) {
    process.stdout.write(`Processing ${file}... `);

    const result = exportSortConfig(file);

    if (result === true) {
      fixed++;
      console.log('✅ Exported');
    } else if (fs.existsSync(path.join(__dirname, '..', file))) {
      alreadyExported++;
      console.log('⏭️  Already exported');
    } else {
      notFound++;
      console.log('⚠️  Not found');
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files fixed: ${fixed}`);
  console.log(`   Already exported: ${alreadyExported}`);
  console.log(`   Not found: ${notFound}`);

  console.log('\n✨ Running type-check to verify...\n');

  try {
    await execAsync('npm run type-check 2>&1', {
      cwd: path.join(__dirname, '..'),
    });
    console.log('🎉 No TypeScript errors remaining!');
  } catch (error: any) {
    const output = error.stdout || error.stderr || '';
    const sortConfigErrors = (output.match(/TS2459.*SortConfig/g) || []).length;

    if (sortConfigErrors === 0) {
      console.log('✅ All SortConfig export errors fixed!');
      console.log('\nOther TypeScript errors remain. Run npm run type-check for details.');
    } else {
      console.log(`⚠️  ${sortConfigErrors} SortConfig export errors still remain.`);
    }
  }
}

main().catch(console.error);
