# MASTER FIX PLAN - Mobile Application Code Cleanup

**Date:** November 2, 2025
**Project:** Mobile Application (React Native + Expo)
**Repository:** /Users/kennedycampos/Documents/repositories/mobile

---

## EXECUTIVE SUMMARY

This document synthesizes analysis across the mobile application codebase and identifies critical issues that need immediate attention. The analysis reveals **systemic inconsistencies** in component architecture, particularly around column visibility management, causing code duplication and maintenance challenges.

### Key Findings:
- **CRITICAL:** Duplicate `getDefaultVisibleColumns` implementations across 58+ files
- **HIGH:** Inconsistent import patterns between `column-visibility-manager` and drawer components
- **MEDIUM:** Mix of old and new column visibility patterns (-v2 files exist)
- **LOW:** Minor naming inconsistencies in files

---

## ISSUE CATEGORIZATION

### CRITICAL (Blocking Functionality) 🔴

#### C1. Duplicate `getDefaultVisibleColumns` Function
**Severity:** CRITICAL
**Impact:** Code duplication, maintenance nightmare, inconsistent default columns
**Files Affected:** 58+ files

**Problem:**
The `getDefaultVisibleColumns()` function is duplicated in two places:
1. In `column-visibility-manager.ts` files (e.g., `/src/components/production/task/list/column-visibility-manager.ts`)
2. In `*-column-visibility-drawer.tsx` files (e.g., `/src/components/production/task/list/task-column-visibility-drawer.tsx`)

**Evidence:**
```typescript
// File 1: column-visibility-manager.ts
export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "name",
    "serialNumber",
    "remainingTime"
  ]);
}

// File 2: task-column-visibility-drawer.tsx
export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "name",
    "serialNumber",
    "remainingTime"
  ]);
}
```

**Root Cause:**
- Mixed architecture patterns - some files use manager files, others export directly from drawer
- No clear single source of truth for column defaults
- Pages import from either source randomly

**Affected Areas:**
- Production: tasks, service orders, observations, trucks, airbrushing, cutting plans
- Inventory: items, orders, suppliers, borrowing, activities, PPE
- HR: warnings, positions
- Administration: customers, employees, sectors, users

---

### HIGH (Major UX Issues) 🟠

#### H1. Inconsistent Import Patterns
**Severity:** HIGH
**Impact:** Developer confusion, potential runtime errors
**Files Affected:** 50+ page files

**Problem:**
Pages import `getDefaultVisibleColumns` from inconsistent locations:

```typescript
// Pattern A: Import from manager file
import { getDefaultVisibleColumns } from "@/components/production/task/list/column-visibility-manager";

// Pattern B: Import from drawer file
import { getDefaultVisibleColumns } from "@/components/production/task/list/task-column-visibility-drawer";
```

**Example Confusion:**
`/src/app/(tabs)/producao/cronograma/listar.tsx` imports from drawer, but the drawer imports the function from task-table which references the manager file.

**Impact:**
- Circular dependency risk
- Unclear which is the authoritative source
- Makes refactoring dangerous

---

#### H2. Legacy -v2 Files Not Removed
**Severity:** HIGH
**Impact:** Confusion, possible use of wrong version
**Files Affected:** 10+ files

**Problem:**
Multiple `-v2` suffixed files exist suggesting migration incomplete:
- `activity-column-visibility-drawer-v2.tsx`
- `truck-column-visibility-drawer-v2.tsx`
- `supplier-column-visibility-drawer-v2.tsx`
- `order-column-visibility-drawer-v2.tsx`
- `service-order-column-visibility-drawer-v2.tsx`
- `warning/list/column-visibility-drawer-v2.tsx`

**Questions:**
- Are v2 files the new standard or old experimental?
- Are v1 files still in use?
- Should v2 replace v1 or vice versa?

---

#### H3. Inconsistent Column Visibility Architecture
**Severity:** HIGH
**Impact:** Maintenance complexity, unclear patterns

**Problem:**
Three different patterns observed:

**Pattern A: Manager + Drawer + Table** (Most complete)
```
column-visibility-manager.ts  → exports getDefaultVisibleColumns()
*-column-visibility-drawer.tsx → drawer UI component
*-table.tsx                    → table component
```

**Pattern B: Drawer Only** (Simpler but duplicates logic)
```
*-column-visibility-drawer.tsx → exports getDefaultVisibleColumns() + drawer UI
*-table.tsx                    → table component
```

**Pattern C: Generic Drawer** (New standardized approach?)
```
Uses ColumnVisibilityDrawerContent from @/components/ui/column-visibility-drawer
Imports getDefaultVisibleColumns from drawer or manager
```

**Recommended Pattern:**
Use Pattern C with a single manager file per entity.

---

### MEDIUM (Inconsistencies) 🟡

#### M1. Column Visibility Drawer Content Inconsistency
**Severity:** MEDIUM
**Impact:** Maintenance burden, inconsistent UX

**Problem:**
Some pages use custom drawer components while newer pages use the generic `ColumnVisibilityDrawerContent`:

**Old Pattern:**
```typescript
import { TaskColumnVisibilityDrawer } from "@/components/production/task/list/task-column-visibility-drawer";
```

**New Pattern:**
```typescript
import { ColumnVisibilityDrawerContent } from "@/components/ui/column-visibility-drawer";
```

**Example (New Pattern):**
`/src/app/(tabs)/producao/cronograma/listar.tsx` successfully uses the new pattern:
```typescript
openColumnDrawer(() => (
  <ColumnVisibilityDrawerContent
    columns={allColumns}
    visibleColumns={new Set(visibleColumnKeys)}
    onVisibilityChange={handleColumnsChange}
    defaultColumns={getDefaultVisibleColumns()}
  />
));
```

**Action Required:**
Migrate all pages to use `ColumnVisibilityDrawerContent` from `@/components/ui/column-visibility-drawer`.

---

#### M2. Import Path from task-table.tsx
**Severity:** MEDIUM
**Impact:** Confusing import chain

**Problem:**
`task-table.tsx` imports from manager:
```typescript
import { getDefaultVisibleColumns } from "./column-visibility-manager";
```

But pages import from drawer:
```typescript
import { getDefaultVisibleColumns } from "@/components/production/task/list/task-column-visibility-drawer";
```

And the drawer file ALSO exports `getDefaultVisibleColumns`.

**Result:**
Two different code paths to get the same function.

---

#### M3. Missing index.ts Files
**Severity:** MEDIUM
**Impact:** Inconsistent import patterns

**Problem:**
Most component folders lack proper `index.ts` barrel exports, leading to verbose imports:

**Current:**
```typescript
import { getDefaultVisibleColumns } from "@/components/production/task/list/task-column-visibility-drawer";
```

**Better:**
```typescript
import { getDefaultVisibleColumns } from "@/components/production/task/list";
```

---

### LOW (Minor Polish) 🟢

#### L1. File Naming Inconsistency
**Severity:** LOW
**Impact:** Developer experience

**Problem:**
Mix of naming patterns:
- `column-visibility-manager.ts` vs `column-visibility-manager.tsx`
- Some use full names: `task-column-visibility-drawer.tsx`
- Others abbreviated: `column-visibility-drawer.tsx`

**Recommendation:**
Standardize on:
- `{entity}-column-manager.ts` for logic
- `{entity}-column-drawer.tsx` for UI (if custom needed)
- Otherwise use generic UI drawer

---

#### L2. Missing TypeScript Extensions
**Severity:** LOW
**Impact:** Type safety could be improved

**Observation:**
Some column manager files use `.ts` extension when they could benefit from stricter typing with `.tsx` if they export React components.

---

## EXECUTION PLAN

### Phase 1: Architecture Standardization (CRITICAL)
**Goal:** Establish single source of truth for column management
**Timeline:** 2-3 hours

#### Step 1.1: Audit Current State
- [ ] List all `column-visibility-manager.*` files
- [ ] List all `*-column-visibility-drawer.*` files
- [ ] List all pages using column visibility
- [ ] Map which pattern each uses
- [ ] Identify which files export `getDefaultVisibleColumns`

#### Step 1.2: Create Standard Pattern
- [ ] Choose Pattern C (Generic Drawer + Manager) as standard
- [ ] Update `/src/components/ui/column-visibility-drawer.tsx` if needed
- [ ] Document the standard pattern in README

#### Step 1.3: Consolidate Manager Files
**For each entity (task, customer, order, etc.):**
- [ ] Ensure `column-visibility-manager.ts` exists
- [ ] Make it the ONLY source of `getDefaultVisibleColumns`
- [ ] Remove duplicate exports from drawer files
- [ ] Update imports in all consuming files

**Files to Create/Update:**
```
src/components/production/task/list/column-visibility-manager.ts
src/components/production/service-order/list/column-visibility-manager.ts
src/components/production/observation/list/column-visibility-manager.ts
src/components/production/truck/list/column-visibility-manager.ts
src/components/production/airbrushing/list/column-visibility-manager.ts
src/components/production/cutting/list/column-visibility-manager.ts
src/components/inventory/item/list/column-visibility-manager.ts
src/components/inventory/order/list/column-visibility-manager.ts
src/components/inventory/supplier/list/column-visibility-manager.ts
src/components/inventory/borrow/list/column-visibility-manager.ts
src/components/inventory/activity/list/column-visibility-manager.ts
src/components/inventory/ppe/list/column-visibility-manager.ts
src/components/human-resources/warning/list/column-visibility-manager.ts
src/components/human-resources/position/list/column-visibility-manager.ts
src/components/administration/customer/list/column-visibility-manager.ts
src/components/administration/employee/list/column-visibility-manager.ts
src/components/administration/sector/list/column-visibility-manager.ts
src/components/administration/user/list/column-visibility-manager.ts
```

---

### Phase 2: Migrate to Generic Drawer (HIGH)
**Goal:** Remove custom drawer implementations
**Timeline:** 3-4 hours

#### Step 2.1: Update Page Imports
**For each page using custom drawer:**
- [ ] Replace custom drawer import with `ColumnVisibilityDrawerContent`
- [ ] Update drawer opening logic to use `openColumnDrawer` context
- [ ] Import `getDefaultVisibleColumns` from manager file only
- [ ] Test that column visibility works correctly

**Template:**
```typescript
// BEFORE
import { TaskColumnVisibilityDrawer } from "@/components/production/task/list/task-column-visibility-drawer";

// AFTER
import { ColumnVisibilityDrawerContent } from "@/components/ui/column-visibility-drawer";
import { getDefaultVisibleColumns } from "@/components/production/task/list/column-visibility-manager";
```

#### Step 2.2: Remove Custom Drawer Files
**After migration complete:**
- [ ] Delete old custom drawer components
- [ ] Keep only manager files and generic UI drawer
- [ ] Verify no imports remain to deleted files

**Files to Delete:**
```
src/components/production/task/list/task-column-visibility-drawer.tsx
src/components/production/service-order/list/service-order-column-visibility-drawer.tsx
src/components/production/observation/list/observation-column-visibility-drawer.tsx
... (and all other custom drawer files)
```

---

### Phase 3: Clean Up v2 Files (HIGH)
**Goal:** Resolve v2 file ambiguity
**Timeline:** 1-2 hours

#### Step 3.1: Determine v2 Purpose
- [ ] Check git history to understand v2 creation reason
- [ ] Compare v1 vs v2 implementations
- [ ] Identify which is current standard

#### Step 3.2: Consolidate Versions
**Option A: v2 is newer**
- [ ] Rename v2 files to remove suffix
- [ ] Delete v1 files
- [ ] Update all imports

**Option B: v2 is experimental**
- [ ] Delete v2 files
- [ ] Keep v1 as standard
- [ ] Document decision

**Files Affected:**
```
activity-column-visibility-drawer-v2.tsx
truck-column-visibility-drawer-v2.tsx
supplier-column-visibility-drawer-v2.tsx
order-column-visibility-drawer-v2.tsx
service-order-column-visibility-drawer-v2.tsx
column-visibility-drawer-v2.tsx (warning component)
item/list/column-visibility-drawer-v2.tsx
activity/list/column-visibility-drawer-v2.tsx
```

---

### Phase 4: Add Barrel Exports (MEDIUM)
**Goal:** Improve import ergonomics
**Timeline:** 1 hour

#### Step 4.1: Create index.ts Files
**For each component list directory:**
- [ ] Create `index.ts`
- [ ] Export public API (manager functions, table component)
- [ ] Update imports in consuming files

**Template:**
```typescript
// src/components/production/task/list/index.ts
export { TaskTable, createColumnDefinitions } from './task-table';
export { getDefaultVisibleColumns } from './column-visibility-manager';
export type { TableColumn } from './task-table';
```

---

### Phase 5: Standardize File Naming (LOW)
**Goal:** Consistent naming convention
**Timeline:** 30 minutes

#### Step 5.1: Rename Files
- [ ] Ensure all manager files are `.ts` (not `.tsx`)
- [ ] Use consistent naming: `{entity}-column-manager.ts`
- [ ] Update imports after renaming

**Examples:**
```
column-visibility-manager.ts → task-column-manager.ts
column-visibility-manager.ts → item-column-manager.ts
```

---

## DEPENDENCIES BETWEEN FIXES

```
Phase 1 (Architecture)
    ↓
Phase 2 (Migrate Drawer) ← Must complete Phase 1 first
    ↓
Phase 3 (Clean v2) ← Can run parallel with Phase 2
    ↓
Phase 4 (Barrel Exports) ← Requires Phases 1-3 complete
    ↓
Phase 5 (Naming) ← Final polish
```

---

## FILES TO MODIFY

### Create/Update (Manager Files)
```
src/components/production/task/list/column-visibility-manager.ts
src/components/production/service-order/list/column-visibility-manager.ts
src/components/production/observation/list/column-visibility-manager.ts
src/components/production/truck/list/column-visibility-manager.ts
src/components/production/airbrushing/list/column-visibility-manager.ts
src/components/production/garage/list/column-visibility-manager.ts
src/components/production/cutting/list/column-visibility-manager.ts
src/components/inventory/item/list/column-visibility-manager.ts
src/components/inventory/order/list/column-visibility-manager.ts
src/components/inventory/supplier/list/column-visibility-manager.ts
src/components/inventory/borrow/list/column-visibility-manager.ts
src/components/inventory/activity/list/column-visibility-manager.ts
src/components/inventory/ppe/list/column-visibility-manager.ts
src/components/human-resources/warning/list/column-visibility-manager.ts
src/components/human-resources/position/list/column-visibility-manager.ts
src/components/administration/customer/list/column-visibility-manager.ts
src/components/administration/employee/list/column-visibility-manager.ts
src/components/administration/sector/list/column-visibility-manager.ts
src/components/administration/user/list/column-visibility-manager.ts
src/components/painting/paint-type/list/column-visibility-manager.ts
```

### Modify (Page Files - Update Imports)
```
src/app/(tabs)/producao/cronograma/listar.tsx
src/app/(tabs)/producao/historico/index.tsx
src/app/(tabs)/producao/ordens-de-servico/listar.tsx
src/app/(tabs)/producao/caminhoes/listar.tsx
src/app/(tabs)/producao/observacoes/listar.tsx
src/app/(tabs)/producao/aerografia/listar.tsx
src/app/(tabs)/producao/recorte/plano-de-recorte/listar.tsx
src/app/(tabs)/estoque/produtos/listar.tsx
src/app/(tabs)/estoque/pedidos/listar.tsx
src/app/(tabs)/estoque/fornecedores/listar.tsx
src/app/(tabs)/estoque/emprestimos/listar.tsx
src/app/(tabs)/estoque/movimentacoes/listar.tsx
src/app/(tabs)/estoque/epi/listar.tsx
src/app/(tabs)/recursos-humanos/advertencias/listar.tsx
src/app/(tabs)/recursos-humanos/funcionarios/listar.tsx
src/app/(tabs)/recursos-humanos/cargos/listar.tsx
src/app/(tabs)/administracao/clientes/listar.tsx
src/app/(tabs)/administracao/colaboradores/listar.tsx
src/app/(tabs)/administracao/setores/listar.tsx
src/app/(tabs)/pintura/tipos-de-tinta/listar.tsx
... (all other list pages using column visibility)
```

### Delete (After Migration)
```
src/components/production/task/list/task-column-visibility-drawer.tsx
src/components/production/service-order/list/service-order-column-visibility-drawer.tsx
src/components/production/service-order/list/service-order-column-visibility-drawer-v2.tsx
src/components/production/observation/list/observation-column-visibility-drawer.tsx
src/components/production/truck/list/truck-column-visibility-drawer.tsx
src/components/production/truck/list/truck-column-visibility-drawer-v2.tsx
src/components/production/airbrushing/list/airbrushing-column-visibility-drawer.tsx
src/components/inventory/item/list/column-visibility-drawer.tsx
src/components/inventory/item/list/column-visibility-drawer-v2.tsx
src/components/inventory/order/list/order-column-visibility-drawer.tsx
src/components/inventory/order/list/order-column-visibility-drawer-v2.tsx
src/components/inventory/supplier/list/supplier-column-visibility-drawer.tsx
src/components/inventory/supplier/list/supplier-column-visibility-drawer-v2.tsx
src/components/inventory/borrow/list/borrow-column-visibility-drawer.tsx
src/components/inventory/activity/list/activity-column-visibility-drawer.tsx
src/components/inventory/activity/list/activity-column-visibility-drawer-v2.tsx
src/components/inventory/activity/list/column-visibility-drawer.tsx
src/components/inventory/activity/list/column-visibility-drawer-v2.tsx
src/components/inventory/ppe/list/ppe-column-visibility-drawer.tsx
src/components/human-resources/warning/list/column-visibility-drawer.tsx
src/components/human-resources/warning/list/column-visibility-drawer-v2.tsx
src/components/administration/customer/list/customer-column-visibility-drawer.tsx
src/components/administration/employee/list/employee-column-visibility-drawer.tsx
src/components/administration/sector/list/sector-column-visibility-drawer.tsx
src/components/administration/user/list/user-column-visibility-drawer.tsx
src/components/painting/paint-type/list/paint-type-column-visibility-drawer.tsx
```

### Create (Barrel Exports)
```
src/components/production/task/list/index.ts
src/components/production/service-order/list/index.ts
src/components/production/observation/list/index.ts
src/components/production/truck/list/index.ts
src/components/inventory/item/list/index.ts
src/components/inventory/order/list/index.ts
src/components/inventory/supplier/list/index.ts
src/components/inventory/borrow/list/index.ts
src/components/inventory/activity/list/index.ts
src/components/administration/customer/list/index.ts
src/components/administration/employee/list/index.ts
... (for all entity list directories)
```

---

## IDENTIFIED PATTERNS

### Common Mistakes Across Pages

#### 1. **Duplicate Function Exports**
**Pattern:** Exporting same function from multiple files
```typescript
// ❌ BAD: Both files export the same function
// column-visibility-manager.ts
export function getDefaultVisibleColumns() { ... }

// task-column-visibility-drawer.tsx
export function getDefaultVisibleColumns() { ... }
```

**Fix:**
```typescript
// ✅ GOOD: Only manager exports
// column-visibility-manager.ts
export function getDefaultVisibleColumns() { ... }

// task-column-visibility-drawer.tsx
import { getDefaultVisibleColumns } from './column-visibility-manager';
```

---

#### 2. **Inconsistent Import Sources**
**Pattern:** Pages import from different sources
```typescript
// ❌ BAD: Mixed imports
// page1.tsx
import { getDefaultVisibleColumns } from "./column-visibility-manager";

// page2.tsx
import { getDefaultVisibleColumns } from "./task-column-visibility-drawer";
```

**Fix:**
```typescript
// ✅ GOOD: All import from manager
import { getDefaultVisibleColumns } from "./column-visibility-manager";
```

---

#### 3. **Custom Drawer Per Entity**
**Pattern:** Creating custom drawer component for each entity
```typescript
// ❌ BAD: Duplicate drawer logic
TaskColumnVisibilityDrawer
OrderColumnVisibilityDrawer
CustomerColumnVisibilityDrawer
// ... 20+ similar components
```

**Fix:**
```typescript
// ✅ GOOD: Use generic drawer
import { ColumnVisibilityDrawerContent } from "@/components/ui/column-visibility-drawer";

openColumnDrawer(() => (
  <ColumnVisibilityDrawerContent
    columns={allColumns}
    visibleColumns={visibleColumns}
    onVisibilityChange={handleChange}
    defaultColumns={getDefaultVisibleColumns()}
  />
));
```

---

#### 4. **Not Using Utility Drawer Context**
**Pattern:** Managing drawer state manually
```typescript
// ❌ BAD: Manual state
const [drawerOpen, setDrawerOpen] = useState(false);

<TaskColumnVisibilityDrawer
  open={drawerOpen}
  onOpenChange={setDrawerOpen}
  ...
/>
```

**Fix:**
```typescript
// ✅ GOOD: Use context
const { openColumnDrawer } = useUtilityDrawer();

const handleOpenColumns = () => {
  openColumnDrawer(() => <ColumnVisibilityDrawerContent ... />);
};
```

---

### Root Causes

#### RC1. **No Clear Architecture Documentation**
- Developers created custom solutions because pattern wasn't documented
- Led to divergent implementations over time

**Solution:**
- Document standard pattern in `docs/architecture/column-visibility.md`
- Add code examples to component README files
- Create template/scaffold for new entities

---

#### RC2. **Incremental Migration Not Completed**
- Generic `ColumnVisibilityDrawerContent` was created
- But old custom drawers were never removed
- Both patterns coexist, causing confusion

**Solution:**
- Complete migration to generic drawer
- Delete old custom implementations
- Prevent creation of new custom drawers

---

#### RC3. **Lack of Code Review Guidelines**
- No checks for duplicate function exports
- No enforcement of import patterns
- Allows anti-patterns to slip through

**Solution:**
- Add ESLint rules to detect duplicate exports
- Add PR checklist for column visibility changes
- Document import conventions in CONTRIBUTING.md

---

### Systemic Issues

#### SI1. **Code Duplication Across Entities**
**Scale:** 20+ entities with similar patterns
**Impact:** Changes must be made in 20+ places
**Risk:** Inconsistencies, bugs in some entities but not others

**Examples:**
- Column visibility logic duplicated per entity
- Table components have similar structure but aren't shared
- Filter logic reimplemented for each entity

**Long-term Solution:**
- Create generic, configurable table component
- Use configuration objects instead of custom components
- Share more code between entities

---

#### SI2. **Missing Abstraction Layer**
**Problem:** Too much boilerplate per entity
**Current:** Each entity needs:
- Table component
- Column visibility manager
- Filter components
- List page component

**Better Approach:**
Consider creating a higher-level abstraction:
```typescript
// Future: Declarative entity list
<EntityList
  entity="task"
  columns={taskColumns}
  defaultColumns={defaultTaskColumns}
  filters={taskFilters}
  actions={taskActions}
/>
```

---

#### SI3. **TypeScript Not Fully Leveraged**
**Problem:** Column definitions could be more type-safe

**Current:**
```typescript
visibleColumnKeys: string[]  // Any string accepted
```

**Better:**
```typescript
type TaskColumnKey = "name" | "customer" | "status" | ...;
visibleColumnKeys: TaskColumnKey[]  // Only valid keys accepted
```

**Benefits:**
- Catch typos at compile time
- Better IDE autocomplete
- Safer refactoring

---

## TESTING CHECKLIST

### After Phase 1 (Architecture)
- [ ] All manager files export `getDefaultVisibleColumns`
- [ ] No duplicate exports found in codebase
- [ ] TypeScript compiles without errors
- [ ] All imports resolve correctly

### After Phase 2 (Generic Drawer)
- [ ] Column visibility drawer opens on all list pages
- [ ] Selected columns persist across page navigation
- [ ] "Reset to Default" button works correctly
- [ ] "Apply" button saves column selection
- [ ] Search within columns works
- [ ] Visual consistency across all pages
- [ ] No broken imports or missing components

### After Phase 3 (Clean v2)
- [ ] No -v2 files remain
- [ ] Git history preserved
- [ ] All functionality still works
- [ ] No broken references to deleted files

### After Phase 4 (Barrel Exports)
- [ ] index.ts files export correct members
- [ ] Imports use barrel exports
- [ ] Bundle size unchanged or improved
- [ ] Tree-shaking still works

### After Phase 5 (Naming)
- [ ] All files follow naming convention
- [ ] No broken imports after renames
- [ ] Git rename detection works
- [ ] Documentation updated with new names

---

## CODE CHANGE TEMPLATES

### Template 1: Create Column Visibility Manager
```typescript
// src/components/{domain}/{entity}/list/{entity}-column-manager.ts

/**
 * Column visibility manager for {entity} table
 * Provides default visible columns for mobile view
 */

export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "{primaryColumn}",    // e.g., "name"
    "{secondaryColumn}",  // e.g., "status"
    "{tertiaryColumn}",   // e.g., "createdAt"
  ]);
}

// Additional column-related utilities can go here
export const COLUMN_WIDTHS = {
  // Define if needed
};
```

---

### Template 2: Update List Page
```typescript
// REMOVE these imports
import { TaskColumnVisibilityDrawer } from "@/components/production/task/list/task-column-visibility-drawer";

// ADD these imports
import { ColumnVisibilityDrawerContent } from "@/components/ui/column-visibility-drawer";
import { getDefaultVisibleColumns } from "@/components/production/task/list/column-visibility-manager";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";

// In component:
const { openColumnDrawer } = useUtilityDrawer();
const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(
  Array.from(getDefaultVisibleColumns())
);

// Get all columns from table component
const allColumns = useMemo(() => createColumnDefinitions(), []);

// Handle column visibility changes
const handleColumnsChange = useCallback((newColumns: Set<string>) => {
  setVisibleColumnKeys(Array.from(newColumns));
}, []);

// Handle opening drawer
const handleOpenColumns = useCallback(() => {
  openColumnDrawer(() => (
    <ColumnVisibilityDrawerContent
      columns={allColumns}
      visibleColumns={new Set(visibleColumnKeys)}
      onVisibilityChange={handleColumnsChange}
      defaultColumns={getDefaultVisibleColumns()}
    />
  ));
}, [openColumnDrawer, allColumns, visibleColumnKeys, handleColumnsChange]);

// In JSX:
<ListActionButton
  icon={<IconList size={20} color={colors.foreground} />}
  onPress={handleOpenColumns}
  badgeCount={visibleColumnKeys.length}
  badgeVariant="primary"
/>

// Pass to table:
<TaskTable
  tasks={tasks}
  visibleColumnKeys={visibleColumnKeys}
  ...
/>
```

---

### Template 3: Create Barrel Export
```typescript
// src/components/{domain}/{entity}/list/index.ts

export { {Entity}Table, createColumnDefinitions } from './{entity}-table';
export { getDefaultVisibleColumns } from './{entity}-column-manager';
export type { TableColumn } from './{entity}-table';

// Example for tasks:
export { TaskTable, createColumnDefinitions } from './task-table';
export { getDefaultVisibleColumns } from './task-column-manager';
export type { TableColumn } from './task-table';
```

---

## RISK ASSESSMENT

### High Risk Areas

#### 1. Import Chain Updates
**Risk:** Breaking imports during refactoring
**Mitigation:**
- Use TypeScript compiler to catch broken imports
- Test incrementally after each file change
- Use global search to find all import statements
- Consider using automated refactoring tools

#### 2. Runtime Errors from Missing Exports
**Risk:** Function no longer exported from expected location
**Mitigation:**
- Update all imports before deleting exports
- Run full TypeScript build
- Test all affected pages manually
- Check console for errors

#### 3. Lost User Preferences
**Risk:** Column visibility preferences reset
**Mitigation:**
- Check if preferences are persisted (AsyncStorage, localStorage)
- Ensure preference keys remain consistent
- Test preference persistence before/after changes
- Document any preference migration needed

---

### Medium Risk Areas

#### 4. Circular Dependencies
**Risk:** Creating import cycles during consolidation
**Mitigation:**
- Use dependency analysis tools
- Follow uni-directional data flow
- Manager → Table → Page (no backwards imports)

#### 5. Bundle Size Increase
**Risk:** Barrel exports prevent tree-shaking
**Mitigation:**
- Use named exports only
- Avoid re-exporting everything
- Test bundle size before/after
- Use webpack-bundle-analyzer

---

### Low Risk Areas

#### 6. Visual Regression
**Risk:** UI changes from drawer migration
**Mitigation:**
- Generic drawer should match custom drawer UX
- Take screenshots before migration
- Compare after migration
- Adjust styles if needed

---

## METRICS FOR SUCCESS

### Quantitative Metrics
- [ ] Reduce number of `getDefaultVisibleColumns` exports from 58 to ~20
- [ ] Delete ~25+ custom drawer components
- [ ] Reduce total lines of column visibility code by >50%
- [ ] Zero TypeScript errors
- [ ] Zero duplicate function exports (enforced by linter)
- [ ] 100% of list pages use generic drawer

### Qualitative Metrics
- [ ] Developers can add column visibility to new entity in <5 minutes
- [ ] Architecture documentation exists and is clear
- [ ] Pattern is consistent across all entities
- [ ] Code reviewers understand the pattern
- [ ] New developers can follow existing examples

---

## MAINTENANCE PLAN

### Post-Fix Documentation
1. **Create Architecture Doc**
   - Location: `/docs/architecture/column-visibility.md`
   - Content: Pattern explanation, examples, dos/don'ts

2. **Update Component README**
   - Location: `/src/components/ui/column-visibility-drawer/README.md`
   - Content: Usage guide, props explanation

3. **Create Developer Guide**
   - Location: `/docs/guides/adding-entity-list.md`
   - Content: Step-by-step guide to add new entity with column visibility

### Ongoing Governance
1. **ESLint Rules**
   - Add rule to prevent duplicate function exports
   - Enforce import from manager files only
   - Warn on custom drawer component creation

2. **PR Checklist**
   - Add item: "Uses generic ColumnVisibilityDrawerContent"
   - Add item: "Imports from manager files, not drawer files"
   - Add item: "No duplicate getDefaultVisibleColumns exports"

3. **Code Review Guidelines**
   - Document in CONTRIBUTING.md
   - Link to architecture documentation
   - Provide migration examples

---

## NEXT STEPS

### Immediate Actions (Today)
1. ✅ Review this master plan
2. [ ] Get stakeholder approval
3. [ ] Create GitHub issues for each phase
4. [ ] Assign phases to developers

### Short Term (This Week)
1. [ ] Complete Phase 1 (Architecture)
2. [ ] Complete Phase 2 (Generic Drawer)
3. [ ] Begin Phase 3 (Clean v2)

### Medium Term (Next Week)
1. [ ] Complete Phase 3 (Clean v2)
2. [ ] Complete Phase 4 (Barrel Exports)
3. [ ] Complete Phase 5 (Naming)
4. [ ] Create documentation

### Long Term (Next Sprint)
1. [ ] Add ESLint rules
2. [ ] Update PR templates
3. [ ] Conduct knowledge sharing session
4. [ ] Monitor for pattern adherence

---

## RELATED ISSUES

### Previously Identified Issues
1. **OrderBy Normalization** - Fixed per `/src/schemas/ORDERBY_FIX_REPORT.md`
2. **Close Button Position** - Documented in `/FIX_CLOSE_BUTTON.md` (SafeArea reload issue)

### Potentially Related Issues
1. **Filter Drawer Patterns** - May have similar duplication issues
2. **Form Components** - Check for similar architectural inconsistencies
3. **API Client** - Ensure column keys match backend schema

---

## CONCLUSION

This master fix plan addresses a critical architectural inconsistency in the mobile application's column visibility implementation. The root cause is a lack of clear documentation and completed migration, leading to duplicate code and confusing patterns.

The fix is straightforward but touches many files:
1. Consolidate `getDefaultVisibleColumns` into manager files (single source of truth)
2. Migrate all pages to use generic `ColumnVisibilityDrawerContent`
3. Delete custom drawer implementations and v2 files
4. Add barrel exports and improve naming

**Estimated Total Effort:** 7-10 hours
**Risk Level:** Medium (many files touched, but changes are mechanical)
**Impact:** High (reduces technical debt, improves maintainability)

**Recommendation:** Proceed with implementation in phases, testing thoroughly after each phase.

---

**Document Version:** 1.0
**Author:** Claude (Synthesis Agent)
**Date:** November 2, 2025
**Status:** Ready for Review
