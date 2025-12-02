#!/usr/bin/env python3
"""
Systematic TypeScript error fixer for mobile app
Fixes common patterns found in the build output
"""

import re
import os
from pathlib import Path
from collections import defaultdict

# Base directory
BASE_DIR = Path("/home/kennedy/Documents/repositories/mobile/src")

# Read error log
ERROR_FILE = Path("/home/kennedy/Documents/repositories/mobile/build-errors-full.txt")

def parse_errors():
    """Parse the error file and categorize errors"""
    errors = []
    with open(ERROR_FILE, 'r') as f:
        for line in f:
            # Match error pattern: filename(line,col): error TSXXXX: message
            match = re.match(r'(.*?)\((\d+),(\d+)\): error (TS\d+): (.*)', line)
            if match:
                filename, line_num, col, error_code, message = match.groups()
                errors.append({
                    'file': filename,
                    'line': int(line_num),
                    'col': int(col),
                    'code': error_code,
                    'message': message
                })
    return errors

def fix_unused_imports(errors):
    """Fix TS6133 errors - unused variables and imports"""
    files_to_fix = defaultdict(list)

    for error in errors:
        if error['code'] == 'TS6133':
            # Extract variable name from message like "'React' is declared but its value is never read."
            match = re.search(r"'([^']+)' is declared but", error['message'])
            if match:
                var_name = match.group(1)
                files_to_fix[error['file']].append({
                    'line': error['line'],
                    'var': var_name
                })

    fixed_count = 0
    for filepath, unused_vars in files_to_fix.items():
        full_path = Path("/home/kennedy/Documents/repositories/mobile") / filepath
        if not full_path.exists():
            continue

        try:
            with open(full_path, 'r') as f:
                lines = f.readlines()

            # Sort by line number in reverse to maintain line numbers while removing
            unused_vars.sort(key=lambda x: x['line'], reverse=True)

            modified = False
            for item in unused_vars:
                line_idx = item['line'] - 1
                var_name = item['var']

                if line_idx >= len(lines):
                    continue

                line = lines[line_idx]

                # Handle import removals
                if 'import' in line:
                    # Remove single unused import from multi-import statement
                    # e.g., "import { Foo, Bar } from 'baz'" -> "import { Bar } from 'baz'"
                    if '{' in line and '}' in line:
                        # Extract imports
                        import_match = re.search(r'\{([^}]+)\}', line)
                        if import_match:
                            imports = [i.strip() for i in import_match.group(1).split(',')]
                            if var_name in imports:
                                imports.remove(var_name)
                                if imports:
                                    # Rebuild import statement
                                    new_imports = ', '.join(imports)
                                    new_line = re.sub(r'\{[^}]+\}', f'{{ {new_imports} }}', line)
                                    lines[line_idx] = new_line
                                    modified = True
                                    fixed_count += 1
                                else:
                                    # Remove entire import line if empty
                                    lines[line_idx] = ''
                                    modified = True
                                    fixed_count += 1
                    # Remove entire default import
                    elif re.search(rf'import\s+{re.escape(var_name)}\s+from', line):
                        lines[line_idx] = ''
                        modified = True
                        fixed_count += 1

                # Handle unused const/let/var declarations
                elif re.search(rf'\b(const|let|var)\s+({re.escape(var_name)})\b', line):
                    # Check if it's a destructuring assignment with other vars
                    if '{' in line or '[' in line:
                        # Complex case - skip for now
                        pass
                    else:
                        # Simple case - comment it out
                        lines[line_idx] = '// ' + line
                        modified = True
                        fixed_count += 1

            if modified:
                with open(full_path, 'w') as f:
                    f.writelines(lines)

        except Exception as e:
            print(f"Error fixing {filepath}: {e}")

    return fixed_count

def main():
    print("Parsing errors...")
    errors = parse_errors()
    print(f"Found {len(errors)} errors")

    # Categorize errors
    error_counts = defaultdict(int)
    for error in errors:
        error_counts[error['code']] += 1

    print("\nError breakdown:")
    for code, count in sorted(error_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {code}: {count}")

    print("\nFixing unused imports and variables (TS6133)...")
    fixed = fix_unused_imports(errors)
    print(f"Fixed {fixed} unused import/variable errors")

    print("\nDone! Re-run type-check to see remaining errors.")

if __name__ == '__main__':
    main()
