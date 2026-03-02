/**
 * Script to replace all router.back() calls with goBack() from useNavigationHistory
 * in screen files under src/app/(tabs)/
 *
 * Run: node scripts/fix-router-back.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('src/app/(tabs)');

// Find all .tsx files with router.back() under (tabs)
function findFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath));
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('router.back()') && !content.includes('useNavigationHistory')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function transformFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Step 1: Add useNavigationHistory import
  // Find a good place to insert it - after existing context imports or after expo-router import
  const importLine = 'import { useNavigationHistory } from "@/contexts/navigation-history-context";';

  // Try to add after an existing @/contexts import
  const contextImportMatch = content.match(/import .+ from ["']@\/contexts\/[^"']+["'];?\n/g);
  if (contextImportMatch) {
    const lastContextImport = contextImportMatch[contextImportMatch.length - 1];
    content = content.replace(lastContextImport, lastContextImport + importLine + '\n');
  } else {
    // Try after @/hooks import
    const hooksImportMatch = content.match(/import .+ from ["']@\/hooks[^"']*["'];?\n/g);
    if (hooksImportMatch) {
      const lastHooksImport = hooksImportMatch[hooksImportMatch.length - 1];
      content = content.replace(lastHooksImport, lastHooksImport + importLine + '\n');
    } else {
      // Try after expo-router import
      const expoRouterMatch = content.match(/import .+ from ["']expo-router["'];?\n/);
      if (expoRouterMatch) {
        content = content.replace(expoRouterMatch[0], expoRouterMatch[0] + importLine + '\n');
      } else {
        // Fallback: add after the first import
        const firstImport = content.match(/import .+ from ["'][^"']+["'];?\n/);
        if (firstImport) {
          content = content.replace(firstImport[0], firstImport[0] + importLine + '\n');
        }
      }
    }
  }

  // Step 2: Add const { goBack } = useNavigationHistory() inside the component
  // Find the component function and add after first hook call or after opening {

  // Strategy: Find "export default function" or the main function component,
  // then find the first const/let/var line (likely hooks) and insert after it

  // Find patterns like "const router = useRouter();" or "const { id } = useLocalSearchParams"
  // and add our hook declaration after
  const hookPatterns = [
    /const router = useRouter\(\);?\n/,
    /const \{ [^}]+ \} = useRouter\(\);?\n/,
    /const router = useRouter\(\);?\s*\n/,
  ];

  let inserted = false;
  for (const pattern of hookPatterns) {
    const match = content.match(pattern);
    if (match) {
      content = content.replace(match[0], match[0] + '  const { goBack } = useNavigationHistory();\n');
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    // Try after useLocalSearchParams
    const searchParamsMatch = content.match(/const \{[^}]+\} = useLocalSearchParams[^;]*;?\n/);
    if (searchParamsMatch) {
      content = content.replace(searchParamsMatch[0], searchParamsMatch[0] + '  const { goBack } = useNavigationHistory();\n');
      inserted = true;
    }
  }

  if (!inserted) {
    // Try after useTheme
    const themeMatch = content.match(/const \{[^}]+\} = useTheme\(\);?\n/);
    if (themeMatch) {
      content = content.replace(themeMatch[0], themeMatch[0] + '  const { goBack } = useNavigationHistory();\n');
      inserted = true;
    }
  }

  if (!inserted) {
    // Last resort: find the first useState call and insert before it
    const useStateMatch = content.match(/  const \[[^\]]+\] = useState/);
    if (useStateMatch) {
      content = content.replace(useStateMatch[0], '  const { goBack } = useNavigationHistory();\n' + useStateMatch[0]);
      inserted = true;
    }
  }

  // Step 3: Replace all router.back() with goBack()
  content = content.replace(/router\.back\(\)/g, 'goBack()');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

// Special case: files with inner components that need the hook in the inner component
function hasInnerComponent(content) {
  // Check if there's a pattern like "function SomethingInner()" after the export
  return /export default function \w+\([^)]*\)\s*\{[\s\S]*?function \w+Inner\(/m.test(content);
}

const files = findFiles(ROOT);
console.log(`Found ${files.length} files to fix\n`);

let fixed = 0;
let failed = [];

for (const file of files) {
  const relPath = path.relative('.', file);
  try {
    const content = fs.readFileSync(file, 'utf-8');

    // Skip files with complex inner component patterns - handle manually
    if (hasInnerComponent(content)) {
      console.log(`⚠️  MANUAL: ${relPath} (has inner component)`);
      failed.push(relPath);
      continue;
    }

    const success = transformFile(file);
    if (success) {
      // Verify the result
      const result = fs.readFileSync(file, 'utf-8');
      const hasImport = result.includes('useNavigationHistory');
      const hasHook = result.includes('const { goBack } = useNavigationHistory()');
      const noRouterBack = !result.includes('router.back()');

      if (hasImport && hasHook && noRouterBack) {
        console.log(`✅ ${relPath}`);
        fixed++;
      } else {
        console.log(`⚠️  PARTIAL: ${relPath} (import:${hasImport}, hook:${hasHook}, clean:${noRouterBack})`);
        failed.push(relPath);
      }
    } else {
      console.log(`⏭️  SKIP: ${relPath} (no changes needed)`);
    }
  } catch (err) {
    console.log(`❌ ERROR: ${relPath}: ${err.message}`);
    failed.push(relPath);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Fixed: ${fixed}`);
console.log(`Need manual fix: ${failed.length}`);
if (failed.length > 0) {
  console.log(`\nFiles needing manual attention:`);
  failed.forEach(f => console.log(`  - ${f}`));
}
