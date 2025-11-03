# Quick Implementation Guide - Column Visibility Fix

**For:** Developers implementing the Master Fix Plan
**Time:** 30 seconds to understand, 5 minutes per entity to implement

---

## 🎯 The Goal

**One pattern for all column visibility across the app.**

---

## 📁 File Structure (Per Entity)

```
src/components/{domain}/{entity}/list/
├── {entity}-table.tsx              ← Table component with createColumnDefinitions()
├── {entity}-column-manager.ts      ← ONLY place for getDefaultVisibleColumns()
└── index.ts                        ← Barrel export (optional but recommended)
```

**Delete:**
```
❌ {entity}-column-visibility-drawer.tsx  (custom drawer - not needed)
❌ *-v2.tsx files                          (legacy - remove)
```

---

## 🔧 Implementation Steps

### Step 1: Create/Update Column Manager

**File:** `src/components/{domain}/{entity}/list/{entity}-column-manager.ts`

```typescript
/**
 * Column visibility manager for {entity} table
 */

export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "column1",    // Most important column
    "column2",    // Second most important
    "column3",    // Third most important (mobile shows ~3 columns)
  ]);
}
```

**That's it!** This is your single source of truth.

---

### Step 2: Update List Page

**File:** `src/app/(tabs)/{domain}/{entity}/listar.tsx`

#### Imports
```typescript
// ✅ Add these
import { ColumnVisibilityDrawerContent } from "@/components/ui/column-visibility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { getDefaultVisibleColumns } from "@/components/{domain}/{entity}/list/{entity}-column-manager";
import { createColumnDefinitions } from "@/components/{domain}/{entity}/list/{entity}-table";

// ❌ Remove these
import { {Entity}ColumnVisibilityDrawer } from "..."; // Delete this line
```

#### Component Setup
```typescript
export default function {Entity}ListScreen() {
  const { openColumnDrawer } = useUtilityDrawer();

  // Column state
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(
    Array.from(getDefaultVisibleColumns())
  );

  // Get all available columns
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle column changes
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Open drawer
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

  // ... rest of component
}
```

#### JSX
```typescript
// Column visibility button
<ListActionButton
  icon={<IconList size={20} color={colors.foreground} />}
  onPress={handleOpenColumns}
  badgeCount={visibleColumnKeys.length}
  badgeVariant="primary"
/>

// Pass to table
<{Entity}Table
  items={items}
  visibleColumnKeys={visibleColumnKeys}
  {...otherProps}
/>
```

#### Wrap in UtilityDrawerWrapper
```typescript
return (
  <UtilityDrawerWrapper>
    <View style={styles.container}>
      {/* Your page content */}
    </View>
  </UtilityDrawerWrapper>
);
```

---

### Step 3: Verify Table Component

**File:** `src/components/{domain}/{entity}/list/{entity}-table.tsx`

Ensure table component:
1. ✅ Exports `createColumnDefinitions()`
2. ✅ Accepts `visibleColumnKeys` prop
3. ✅ Filters columns based on `visibleColumnKeys`

```typescript
interface {Entity}TableProps {
  items: {Entity}[];
  visibleColumnKeys?: string[];
  // ... other props
}

export const {Entity}Table = ({
  items,
  visibleColumnKeys,
  ...
}) => {
  // Use visibleColumnKeys if provided, else use defaults
  const visibleColumns = useMemo(() => {
    if (visibleColumnKeys && visibleColumnKeys.length > 0) {
      return new Set(visibleColumnKeys);
    }
    return getDefaultVisibleColumns();
  }, [visibleColumnKeys]);

  // Filter columns
  const displayColumns = useMemo(() => {
    const allColumns = createColumnDefinitions();
    return allColumns.filter(col => visibleColumns.has(col.key));
  }, [visibleColumns]);

  // ... rest of component
};
```

---

### Step 4: Delete Old Files

After steps 1-3 are complete:

```bash
# Delete custom drawer (no longer needed)
rm src/components/{domain}/{entity}/list/{entity}-column-visibility-drawer.tsx

# Delete any v2 files
rm src/components/{domain}/{entity}/list/*-v2.tsx
```

---

### Step 5: Test

- [ ] Open list page
- [ ] Click column visibility button
- [ ] Drawer opens
- [ ] Toggle columns on/off
- [ ] Click "Apply"
- [ ] Table updates with selected columns
- [ ] Refresh page
- [ ] Columns reset to default (or persist if you have storage)
- [ ] Click "Restaurar" (Reset)
- [ ] Columns return to default
- [ ] No console errors

---

## 📋 Checklist (Copy for Each Entity)

```markdown
Entity: _______________

- [ ] Created/updated {entity}-column-manager.ts
- [ ] getDefaultVisibleColumns() returns appropriate columns
- [ ] Updated list page imports
- [ ] Added useUtilityDrawer hook
- [ ] Added visibleColumnKeys state
- [ ] Added handleColumnsChange callback
- [ ] Added handleOpenColumns callback
- [ ] Updated JSX to use ColumnVisibilityDrawerContent
- [ ] Wrapped page in UtilityDrawerWrapper
- [ ] Verified table accepts visibleColumnKeys prop
- [ ] Deleted custom drawer file
- [ ] Deleted any -v2 files
- [ ] Tested: Drawer opens
- [ ] Tested: Columns toggle
- [ ] Tested: Changes apply
- [ ] Tested: Reset works
- [ ] Tested: No console errors
- [ ] TypeScript compiles
- [ ] Committed changes
```

---

## 🚨 Common Mistakes

### Mistake 1: Duplicate getDefaultVisibleColumns
```typescript
// ❌ DON'T export from drawer file
// {entity}-column-visibility-drawer.tsx
export function getDefaultVisibleColumns() { ... }

// ✅ DO export only from manager file
// {entity}-column-manager.ts
export function getDefaultVisibleColumns() { ... }
```

### Mistake 2: Importing from Wrong Place
```typescript
// ❌ DON'T import from drawer
import { getDefaultVisibleColumns } from "./{entity}-column-visibility-drawer";

// ✅ DO import from manager
import { getDefaultVisibleColumns } from "./{entity}-column-manager";
```

### Mistake 3: Using Custom Drawer
```typescript
// ❌ DON'T create custom drawer component
<{Entity}ColumnVisibilityDrawer ... />

// ✅ DO use generic drawer via context
openColumnDrawer(() => <ColumnVisibilityDrawerContent ... />);
```

### Mistake 4: Not Wrapping in UtilityDrawerWrapper
```typescript
// ❌ DON'T forget wrapper
return <View>...</View>;

// ✅ DO wrap page
return <UtilityDrawerWrapper><View>...</View></UtilityDrawerWrapper>;
```

### Mistake 5: Wrong Import Path
```typescript
// ❌ DON'T use relative paths for UI components
import { ColumnVisibilityDrawerContent } from "../../../../components/ui/...";

// ✅ DO use alias
import { ColumnVisibilityDrawerContent } from "@/components/ui/column-visibility-drawer";
```

---

## 🎨 Copy-Paste Templates

### Template: Column Manager File
```typescript
// src/components/{domain}/{entity}/list/{entity}-column-manager.ts

/**
 * Column visibility manager for {entity} table
 * Provides default visible columns for mobile view
 */

export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "name",           // Primary identifier
    "status",         // Important state
    "createdAt",      // Timestamp
  ]);
}
```

### Template: List Page Imports
```typescript
import { useState, useMemo, useCallback } from "react";
import { View, FlatList, RefreshControl, StyleSheet } from "react-native";
import { router } from "expo-router";
import { FAB } from "@/components/ui/fab";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { ColumnVisibilityDrawerContent } from "@/components/ui/column-visibility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { IconList } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { {Entity}Table, createColumnDefinitions } from "@/components/{domain}/{entity}/list/{entity}-table";
import { getDefaultVisibleColumns } from "@/components/{domain}/{entity}/list/{entity}-column-manager";
```

### Template: List Page Component Setup
```typescript
export default function {Entity}ListScreen() {
  const { colors } = useTheme();
  const { openColumnDrawer } = useUtilityDrawer();

  // Column visibility
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(
    Array.from(getDefaultVisibleColumns())
  );

  const allColumns = useMemo(() => createColumnDefinitions(), []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

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

  // ... rest of component
}
```

### Template: List Page JSX
```typescript
return (
  <UtilityDrawerWrapper>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search and Actions */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchText}
          onChangeText={handleSearch}
          placeholder="Buscar..."
          style={styles.searchBar}
        />
        <View style={styles.buttonContainer}>
          <ListActionButton
            icon={<IconList size={20} color={colors.foreground} />}
            onPress={handleOpenColumns}
            badgeCount={visibleColumnKeys.length}
            badgeVariant="primary"
          />
        </View>
      </View>

      {/* Table */}
      <{Entity}Table
        items={items}
        visibleColumnKeys={visibleColumnKeys}
        onItemPress={handleItemPress}
        {...otherProps}
      />

      {/* FAB */}
      {canCreate && (
        <FAB
          icon="plus"
          onPress={() => router.push("/{domain}/{entity}/cadastrar")}
          style={styles.fab}
        />
      )}
    </View>
  </UtilityDrawerWrapper>
);
```

---

## 🎯 Entity Priority List

### High Priority (Production Critical)
1. ✅ Task (cronograma) - Already migrated
2. ⬜ Service Order (ordens-de-servico)
3. ⬜ Truck (caminhoes)
4. ⬜ Observation (observacoes)
5. ⬜ Airbrushing (aerografia)

### Medium Priority (Inventory)
6. ⬜ Item (produtos)
7. ⬜ Order (pedidos)
8. ⬜ Supplier (fornecedores)
9. ⬜ Borrow (emprestimos)
10. ⬜ Activity (movimentacoes)

### Lower Priority (HR & Admin)
11. ⬜ Warning (advertencias)
12. ⬜ Employee (funcionarios)
13. ⬜ Customer (clientes)
14. ⬜ Sector (setores)
15. ⬜ User (usuarios)

---

## 🏃 Quick Start

1. Pick an entity from priority list
2. Copy checklist above
3. Follow steps 1-5
4. Mark checklist complete
5. Move to next entity

**Estimated time:** 5-10 minutes per entity
**Total entities:** ~20
**Total time:** 2-3 hours for all entities

---

## 📞 Need Help?

### Question: "My drawer doesn't open"
**Answer:** Ensure page is wrapped in `<UtilityDrawerWrapper>`

### Question: "Columns don't change when I toggle"
**Answer:** Check that `handleColumnsChange` updates `visibleColumnKeys` state

### Question: "TypeScript error on createColumnDefinitions"
**Answer:** Ensure table component exports this function

### Question: "Reset button doesn't work"
**Answer:** Ensure you pass `defaultColumns={getDefaultVisibleColumns()}` to drawer

### Question: "Can I customize the drawer UI?"
**Answer:** No - use the generic `ColumnVisibilityDrawerContent`. Customization should be minimal.

---

## ✅ Final Verification

After completing all entities:

```bash
# Search for duplicate exports (should return 0)
grep -r "export.*getDefaultVisibleColumns" src/ --include="*-drawer.tsx" | wc -l

# Search for custom drawers (should return 0)
find src/ -name "*-column-visibility-drawer.tsx" | wc -l

# Search for v2 files (should return 0)
find src/ -name "*-v2.tsx" | wc -l

# Verify TypeScript compiles
npm run type-check
# or
npx tsc --noEmit
```

All checks should pass! 🎉

---

**Last Updated:** November 2, 2025
**Status:** Ready to use
