# Mobile-Web Alignment Master Plan

## Executive Summary

After analyzing both web and mobile projects with 12 specialized subagents, we've identified critical misalignments across schemas, types, filters, and components. This document provides a comprehensive strategy for aligning the mobile application with the correct web implementation.

**Status**: Mobile app has ~60-70% alignment with web patterns, but with significant architectural inconsistencies
**Estimated Effort**: 4-6 weeks for complete alignment
**Risk Level**: Medium (some breaking changes required)

---

## Critical Findings

### 1. Schema & Type Misalignment

**Web Architecture (Correct)**:
- Location: `/web/src/schemas/` (Zod validation)
- Location: `/web/src/types/` (TypeScript interfaces)
- Pattern: Include → OrderBy → Where → GetMany (with transforms) → CRUD schemas → Batch schemas
- Transform functions normalize convenience filters to Prisma WHERE clauses
- Comprehensive validation with Portuguese error messages

**Mobile Issues**:
- ✅ Types are mostly aligned
- ⚠️ Schemas exist but some are outdated
- ❌ Missing transform functions in some schemas
- ❌ Inconsistent convenience filter implementations
- ❌ Some schemas import from wrong locations

### 2. Filter Architecture Misalignment

**Web Architecture (Correct)**:
- **Core System**: `/web/src/utils/table-filter-utils.ts` (1000+ lines)
- **Components**:
  - `advanced-filter-dialog.tsx` - Visual filter builder with AND/OR logic
  - `search-filters-panel.tsx` - Popover-based quick filters
  - `filter-indicator.tsx` - Active filter badges
- **Builders**: StringFilterBuilder, NumberFilterBuilder, DateFilterBuilder, BooleanFilterBuilder, SelectFilterBuilder
- **Presets**: Save/load/share filter combinations
- **URL State**: Bidirectional sync with debouncing

**Mobile Issues**:
- ❌ No `table-filter-utils.ts` equivalent
- ❌ No filter builder utilities
- ❌ No filter preset system
- ⚠️ Mix of Modal and Drawer patterns (inconsistent UX)
- ⚠️ V1/V2 component duplication (migration incomplete)
- ❌ Manual filter transformation in each list page (no centralized logic)
- ❌ No URL state management for filters
- ✅ Filter tags/indicators exist but limited

### 3. Component Pattern Inconsistencies

**Across All Modules**:

| Issue | Administration | HR | Inventory | Production |
|-------|---------------|-----|-----------|------------|
| Filter Modal/Drawer Mix | ❌ Both exist | ❌ Both exist | ❌ V1/V2 versions | ⚠️ DrawerV2 only |
| Column Visibility | ⚠️ Mixed V1/V2 | ❌ Missing | ⚠️ V1/V2 versions | ✅ Manager pattern |
| Sort Logic | ⚠️ Inline buildOrderBy() | ⚠️ Inline buildOrderBy() | ⚠️ Inline buildOrderBy() | ⚠️ Inline buildOrderBy() |
| Search Pattern | ⚠️ Manual debounce | ⚠️ Manual debounce | ⚠️ Manual debounce | ⚠️ Manual debounce |
| Table Component | ⚠️ Per-entity | ⚠️ Per-entity | ⚠️ Per-entity | ⚠️ Per-entity |
| Swipe Actions | ✅ Consistent | ✅ Consistent | ✅ Consistent | ✅ Consistent |

### 4. Shared Utilities Missing

**Web Has (Mobile Missing)**:

1. **Filter Utilities** (`/web/src/utils/table-filter-utils.ts`):
   - `FilterBuilder` classes for all data types
   - `extractActiveFilters()` - Convert state to indicators
   - `countActiveFilters()` - Active filter counting
   - `serializeFiltersToUrl()` / `deserializeFiltersFromUrl()` - URL persistence
   - `convertFilterDefinitionToQuery()` - UI → API transformation
   - `FilterPresetStorage` interface with localStorage implementation

2. **Sort Utilities** (`/web/src/utils/table-sort-utils.ts`):
   - `TableSortUtils` class with all sort operations
   - `toggleColumnSort()` - Handle sort state changes
   - `sortItems()` - Local sorting with null handling
   - `customSortFunctions` - Brazilian name, CPF, CNPJ, currency, date sorting
   - `parseSortFromUrl()` / `serializeSortForUrl()` - URL persistence

3. **URL State Management** (`/web/src/utils/url-state-utils.ts`):
   - `UrlStateManager` interface
   - Built-in parsers/serializers for all data types
   - Debouncing per field
   - Validation support
   - Subscribe pattern for state changes

4. **Common Schemas** (`/web/src/schemas/common.ts`):
   - `createNameSchema()`, `createDescriptionSchema()` - Reusable validators
   - `createNumberRangeSchema()`, `dateRangeSchema` - Range validators
   - `createBatchCreateSchema()`, `createBatchUpdateSchema()` - Batch operation helpers
   - Document validators: `cpfSchema`, `cnpjSchema`, `phoneSchema`, `pisSchema`
   - Transform helpers: `normalizeOrderBy()`, `createSearchTransform()`, `mergeAndConditions()`

---

## Alignment Strategy

### Phase 1: Foundation (Week 1) - HIGH PRIORITY

#### 1.1 Create Shared Utilities

**Task**: Port essential utilities from web to mobile

```
src/lib/
├── filter-utils.ts          ← Port from web/src/utils/table-filter-utils.ts
├── sort-utils.ts            ← Port from web/src/utils/table-sort-utils.ts
├── url-state-utils.ts       ← Port from web/src/utils/url-state-utils.ts (if needed for mobile)
└── form-utils.ts            ← Shared form helpers

src/schemas/
├── common.ts                ← Port from web, add mobile-specific validators
└── index.ts                 ← Update exports
```

**Key Adaptations for Mobile**:
- URL state management may be less critical (can be Phase 2)
- Focus on filter builders and transformation logic
- Adapt to React Native navigation patterns
- Consider AsyncStorage for filter presets instead of localStorage

#### 1.2 Standardize Common Schemas

**Files to Update**:
- `src/schemas/common.ts` - Add missing validators from web
- Add transform helpers (normalizeOrderBy, createSearchTransform, etc.)
- Ensure all entities use common validators

**Checklist**:
- ✅ Document validators (CPF, CNPJ, phone, PIS, email)
- ✅ Range schemas (number, date)
- ✅ Batch operation schemas
- ✅ Transform function helpers

### Phase 2: Schema Alignment (Week 1-2)

#### 2.1 Administration Module

**Schemas to Update**:

| Entity | Current Status | Required Updates |
|--------|---------------|------------------|
| Customer | ⚠️ Partial | Add missing convenience filters, update transform |
| User | ⚠️ Partial | Add status transition validation, age verification |
| Sector | ⚠️ Partial | Add privilege filtering |
| Notification | ⚠️ Partial | Add channel/importance filters |
| File | ⚠️ Partial | Add security validations, MIME type checks |
| ChangeLog | ❌ Missing | Create complete schema from web |
| Commission | ⚠️ Partial | Review and align |
| Employee | ⚠️ Needs review | Check alignment with web |
| Monitoring | ⚠️ Needs review | Check alert/metric schemas |

**For Each Schema**:
1. Compare with web version line-by-line
2. Add missing convenience filters
3. Update transform functions to match web logic
4. Add missing validation rules
5. Update type inference
6. Test with existing API

#### 2.2 HR Module

**Schemas to Update**:

| Entity | Web Schema Size | Mobile Status | Priority |
|--------|----------------|---------------|----------|
| Holiday | 405 lines | ⚠️ Needs review | Medium |
| Position | 733 lines | ⚠️ Needs review | High |
| Vacation | 723 lines | ⚠️ Needs review | High |
| Warning | 554 lines | ⚠️ Needs review | Medium |
| PPE | 1749 lines | ⚠️ Needs review | High |
| Employee | - | ⚠️ Check if duplicate with User | High |

**Key Updates**:
- Position: Add MonetaryValue pattern for remuneration
- Vacation: Add status tracking, collective vacation support
- Warning: Add multi-witness, severity/category
- PPE: Align size/delivery/schedule schemas

#### 2.3 Inventory Module

**Critical Issues to Fix**:
1. ❌ Remove debug logging in `src/api-client/item.ts` (lines 121-167)
2. ❌ Deprecate `prices: Price[]` field, use `monetaryValues: MonetaryValue[]`
3. ❌ Remove V1 components (item-filter-drawer.tsx, column-visibility-drawer.tsx)
4. ⚠️ Complete ActivityWhere type (currently `any`)

**Schemas to Update**:

| Entity | Web Schema | Mobile Status | Action |
|--------|-----------|---------------|--------|
| Item | Complex | ⚠️ Good | Add missing filters |
| ItemBrand | Simple | ✅ Aligned | Minor review |
| ItemCategory | Simple | ✅ Aligned | Minor review |
| Activity | Medium | ⚠️ Needs filters | Add date ranges, discrepancy filters |
| Borrow | Medium | ⚠️ Needs filters | Add status, return date filters |
| Order | Complex | ⚠️ Needs filters | Add schedule filters |
| Supplier | Medium | ⚠️ Needs filters | Add tag, location filters |

#### 2.4 Production Module

**Critical Issues**:
1. ⚠️ Task schema is 1400+ lines (too complex, needs refactoring)
2. ⚠️ Transform functions are 400+ lines (extract to helpers)
3. ❌ Missing schemas for Paint, Airbrushing, Cut entities
4. ⚠️ ServiceOrder has inline service object instead of proper relation

**Schemas to Update**:

| Entity | Complexity | Action |
|--------|-----------|--------|
| Task | Very High | Refactor, extract filters to helpers |
| ServiceOrder | Medium | Add missing filters, fix service relation |
| Truck | Medium | Review plate validation, position filters |
| Garage | Medium | Review hierarchy schemas |
| Paint | Missing | Create from web |
| Airbrushing | Missing | Create from web |
| Cut | Missing | Create from web |

### Phase 3: Component Standardization (Week 2-3)

#### 3.1 Create Base Components

**New Components to Create**:

```typescript
// src/components/common/filters/
BaseFilterDrawer.tsx              // Unified filter container
FilterSection.tsx                 // Collapsible section wrapper
FilterBuilders/
  ├── StringFilter.tsx            // Text input with operators
  ├── NumberFilter.tsx            // Number input with range
  ├── DateFilter.tsx              // Date picker
  ├── DateRangeFilter.tsx         // Start/end dates
  ├── SelectFilter.tsx            // Single select
  ├── MultiSelectFilter.tsx       // Multiple select
  └── BooleanFilter.tsx           // Toggle/switch
FilterIndicators/
  ├── FilterTag.tsx               // Single active filter
  └── FilterTagList.tsx           // Collection with clear all
FilterPresets/
  ├── PresetManager.tsx           // Save/load UI
  └── PresetStorage.ts            // AsyncStorage implementation

// src/components/common/tables/
BaseTable.tsx                     // Generic table component
TableHeader.tsx                   // Header with sort indicators
TableRow.tsx                      // Row with selection/swipe
SwipeActions.tsx                  // Standardized swipe menu
ColumnVisibilityDrawer.tsx        // Unified column manager

// src/components/common/search/
SearchBar.tsx                     // Debounced search input
```

#### 3.2 Migrate Filters to New Pattern

**For Each Module**:

1. **Replace Modal/Drawer Inconsistencies**:
   - Administration: Standardize on `BaseFilterDrawer`
   - HR: Standardize on `BaseFilterDrawer`
   - Inventory: Remove V1, update V2 to use `BaseFilterDrawer`
   - Production: Update DrawerV2 to use `BaseFilterDrawer`

2. **Migration Pattern**:
```typescript
// OLD (item-filter-drawer-v2.tsx)
export function ItemFilterDrawerV2({ visible, onClose, onApply, currentFilters }) {
  // 200+ lines of inline filter logic
}

// NEW (using base components)
import { BaseFilterDrawer, FilterSection, StringFilter, NumberRangeFilter } from '@/components/common/filters';

export function ItemFilterDrawer({ visible, onClose, onApply, currentFilters }) {
  return (
    <BaseFilterDrawer visible={visible} onClose={onClose} onApply={onApply}>
      <FilterSection title="Status" icon="check-circle">
        <BooleanFilter label="Ativo" field="isActive" />
        <BooleanFilter label="Deve atribuir usuário" field="shouldAssignToUser" />
      </FilterSection>

      <FilterSection title="Faixas" icon="slider">
        <NumberRangeFilter label="Quantidade" field="quantityRange" />
        <NumberRangeFilter label="Preço" field="totalPriceRange" />
      </FilterSection>

      <FilterSection title="Datas" icon="calendar">
        <DateRangeFilter label="Criado em" field="createdDateRange" />
      </FilterSection>
    </BaseFilterDrawer>
  );
}
```

#### 3.3 Remove Deprecated Components

**Files to Delete**:

```
Administration:
- components/administration/customer/list/customer-filter-drawer.tsx (if old version)
- components/administration/user/list/user-filter-modal.tsx (replace with drawer)

Inventory:
- components/inventory/item/list/item-filter-drawer.tsx (V1)
- components/inventory/item/list/column-visibility-drawer.tsx (V1)
- components/inventory/order/list/order-filter-modal.tsx (if old)
- components/inventory/activity/list/activity-filter-modal.tsx (if old)

Production:
- Any old filter components not using DrawerV2 pattern
```

**Files to Keep and Update**:
```
Keep V2 versions but refactor to use new base components:
- *-filter-drawer-v2.tsx → Refactor to use BaseFilterDrawer
- *-column-visibility-drawer-v2.tsx → Standardize across all modules
```

### Phase 4: Create Shared Hooks (Week 3)

#### 4.1 Filter Hooks

```typescript
// src/hooks/useEntityFilters.ts
export function useEntityFilters<TFilters>(
  schema: z.ZodSchema<TFilters>,
  initialFilters?: Partial<TFilters>
) {
  // Generic filter state management
  // URL sync (optional for mobile)
  // Validation
  // Transform to API format
}

// src/hooks/useDebouncedSearch.ts
export function useDebouncedSearch(
  initialValue = "",
  debounceMs = 300
) {
  // Centralized search debouncing
}

// src/hooks/useTableSort.ts
export function useTableSort<T>(
  defaultSort?: SortConfig[],
  maxSorts = 3
) {
  // Centralized sort state management
  // Build orderBy for API
}

// src/hooks/useColumnVisibility.ts
export function useColumnVisibility(
  entityKey: string,
  defaultColumns: string[]
) {
  // Persistent column visibility using AsyncStorage
}
```

#### 4.2 Refactor List Pages

**Pattern for All List Pages**:

```typescript
// BEFORE (400+ lines with inline logic)
export function CustomerListScreen() {
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState({});
  const [sortConfigs, setSortConfigs] = useState([]);

  // 50+ lines of buildOrderBy()
  const buildOrderBy = () => { ... };

  // Manual filter transformation
  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
  };

  // ... more inline logic
}

// AFTER (150 lines with hooks)
export function CustomerListScreen() {
  const { displayText, searchText, setDisplayText } = useDebouncedSearch();
  const { filters, activeFilterCount, toApiParams } = useCustomerFilters();
  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(DEFAULT_SORT);
  const { visibleColumns, setVisibleColumns } = useColumnVisibility('customers', DEFAULT_COLUMNS);

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...toApiParams(),
  };

  const { items, isLoading, loadMore, refresh } = useCustomersInfiniteMobile(queryParams);

  return (
    <ThemedView>
      <SearchBar value={displayText} onChangeText={setDisplayText} />
      <CustomerFilterDrawer filters={filters} onApply={setFilters} />
      <FilterTagList filters={extractActiveFilters(filters)} />
      <CustomerTable
        data={items}
        sortConfigs={sortConfigs}
        onSort={handleSort}
        visibleColumns={visibleColumns}
      />
    </ThemedView>
  );
}
```

### Phase 5: Testing & Validation (Week 4)

#### 5.1 Module-by-Module Testing

**For Each Module (Administration, HR, Inventory, Production)**:

1. **Schema Validation**:
   - Test all convenience filters
   - Test transform functions
   - Test batch operations
   - Test include/orderBy/where clauses

2. **Component Testing**:
   - Test filter application
   - Test filter removal (individual and all)
   - Test sort behavior (single and multi-sort)
   - Test search with filters
   - Test column visibility persistence
   - Test swipe actions

3. **Integration Testing**:
   - Test list → filter → results flow
   - Test list → sort → results flow
   - Test list → search → results flow
   - Test create/edit forms with schemas
   - Test batch operations

#### 5.2 Cross-Module Consistency Check

**Verify**:
- ✅ All filters use BaseFilterDrawer pattern
- ✅ All tables use consistent column definitions
- ✅ All list pages use shared hooks
- ✅ All schemas follow web patterns
- ✅ No V1 components remain
- ✅ No debug logging in production code
- ✅ All deprecated fields removed
- ✅ Consistent UX across all modules

#### 5.3 Performance Testing

**Test**:
- Filter application speed (should be <100ms)
- Table rendering with 100+ items
- Infinite scroll performance
- Search debouncing (should not lag)
- Column visibility changes (should be instant)

---

## Priority Matrix

### Critical (Do First - Week 1)
1. ✅ Create filter-utils.ts and sort-utils.ts
2. ✅ Update schemas/common.ts with web utilities
3. ✅ Remove debug logging from item.ts API client
4. ✅ Create BaseFilterDrawer component
5. ✅ Create shared hooks (useEntityFilters, useDebouncedSearch, useTableSort)

### High (Week 2)
6. ✅ Align all administration schemas
7. ✅ Align all HR schemas
8. ✅ Align all inventory schemas
9. ✅ Remove all V1 filter/column components
10. ✅ Migrate all filters to BaseFilterDrawer pattern

### Medium (Week 3)
11. ✅ Align all production schemas
12. ✅ Refactor all list pages to use hooks
13. ✅ Create missing entity schemas (Paint, Airbrushing, Cut)
14. ✅ Implement filter presets with AsyncStorage
15. ✅ Standardize column visibility across modules

### Low (Week 4)
16. ✅ Add URL state management (if needed for mobile)
17. ✅ Create advanced filter builder UI (like web)
18. ✅ Add filter export/import functionality
19. ✅ Performance optimizations
20. ✅ Documentation updates

---

## File-by-File Action Items

### Shared Utilities to Create

```
src/lib/filter-utils.ts               [CREATE] Port from web/src/utils/table-filter-utils.ts
src/lib/sort-utils.ts                 [CREATE] Port from web/src/utils/table-sort-utils.ts
src/lib/url-state-utils.ts            [CREATE] Optional, port if needed
src/schemas/common.ts                 [UPDATE] Add missing validators and helpers
```

### Administration Module

```
src/schemas/customer.ts               [UPDATE] Align with web
src/schemas/user.ts                   [UPDATE] Add status validation, age check
src/schemas/sector.ts                 [UPDATE] Add privilege filters
src/schemas/notification.ts           [UPDATE] Add channel/importance
src/schemas/file.ts                   [UPDATE] Add security validations
src/schemas/changelog.ts              [CREATE] Port from web
src/components/administration/*/list/*-filter-drawer-v2.tsx [UPDATE] Use BaseFilterDrawer
src/components/administration/*/list/*-filter-modal.tsx [DELETE] Replace with drawer
src/app/(tabs)/administration/*/list.tsx [UPDATE] Use shared hooks
```

### HR Module

```
src/schemas/holiday.ts                [UPDATE] Align with web
src/schemas/position.ts               [UPDATE] Add MonetaryValue pattern
src/schemas/vacation.ts               [UPDATE] Add status tracking
src/schemas/warning.ts                [UPDATE] Add severity/category
src/schemas/epi.ts (or ppe.ts)       [UPDATE] Align size/delivery/schedule
src/components/human-resources/*/list/*-filter-*.tsx [UPDATE] Standardize pattern
src/app/(tabs)/human-resources/*/list.tsx [UPDATE] Use shared hooks
```

### Inventory Module

```
src/api-client/item.ts                [UPDATE] Remove debug logs (lines 121-167)
src/types/item.ts                     [UPDATE] Mark prices as deprecated
src/types/activity.ts                 [UPDATE] Fix ActivityWhere type
src/schemas/item.ts                   [UPDATE] Remove price fields
src/schemas/activity.ts               [UPDATE] Add missing filters
src/schemas/order.ts                  [UPDATE] Add schedule filters
src/schemas/borrow.ts                 [UPDATE] Add status filters
src/schemas/supplier.ts               [UPDATE] Add tag/location filters
src/components/inventory/item/list/item-filter-drawer.tsx [DELETE] V1 version
src/components/inventory/item/list/item-filter-drawer-v2.tsx [UPDATE] Use BaseFilterDrawer
src/components/inventory/item/list/column-visibility-drawer.tsx [DELETE] V1 version
src/components/inventory/*/list/*-filter-*.tsx [UPDATE] Standardize
src/app/(tabs)/inventory/*/list.tsx   [UPDATE] Use shared hooks
```

### Production Module

```
src/schemas/task.ts                   [REFACTOR] Extract filters to helpers (reduce from 1400 lines)
src/schemas/serviceOrder.ts           [UPDATE] Fix service relation, add filters
src/schemas/truck.ts                  [UPDATE] Review and optimize
src/schemas/paint.ts                  [CREATE] Port from web
src/schemas/airbrushing.ts            [CREATE] Port from web
src/schemas/cut.ts                    [CREATE] Port from web
src/components/production/*/list/*-filter-drawer-v2.tsx [UPDATE] Use BaseFilterDrawer
src/app/(tabs)/production/*/list.tsx  [UPDATE] Use shared hooks
```

---

## Risk Assessment

### High Risk (Requires Careful Testing)
- Schema transform function changes (may break API queries)
- Removing deprecated Price field (ensure no references remain)
- Refactoring Task schema (very large, complex dependencies)

### Medium Risk (May Cause UI Issues)
- Filter component migration (UX changes)
- List page refactoring (lots of inline logic to extract)
- Column visibility changes (storage format changes)

### Low Risk (Safe to Change)
- Adding utility functions (pure functions)
- Creating new base components (opt-in)
- Removing debug logs
- Deleting unused V1 components (after verifying no usage)

---

## Success Criteria

### Phase 1 Success
- ✅ Filter/sort utility modules created and tested
- ✅ Common schema validators available
- ✅ BaseFilterDrawer component working
- ✅ Shared hooks created and documented

### Phase 2 Success
- ✅ All schemas aligned with web versions
- ✅ All transform functions working correctly
- ✅ All convenience filters implemented
- ✅ All validation rules matching web

### Phase 3 Success
- ✅ All filters use BaseFilterDrawer pattern
- ✅ All V1 components removed
- ✅ Consistent UX across all modules
- ✅ Column visibility standardized

### Phase 4 Success
- ✅ All list pages use shared hooks
- ✅ All inline logic extracted to reusable functions
- ✅ Code reduced by ~30% through reuse
- ✅ Easier to add new entities

### Phase 5 Success
- ✅ All tests passing
- ✅ No performance regressions
- ✅ Consistent behavior across modules
- ✅ Documentation complete

---

## Next Steps

1. **Review this plan** with your team
2. **Prioritize phases** based on business needs
3. **Assign tasks** to team members
4. **Set up branch strategy** (feature branches per module?)
5. **Begin Phase 1** with shared utilities

**Estimated Timeline**: 4-6 weeks with 1-2 developers
**Recommended Approach**: Module-by-module migration (complete one module before moving to next)

---

## Questions for Team Discussion

1. **Filter Presets**: Do we need persistent filter presets on mobile? (AsyncStorage)
2. **URL State**: Is URL state management needed for mobile deep linking?
3. **Migration Strategy**: Big bang or gradual module-by-module?
4. **Breaking Changes**: Can we accept UX changes during alignment?
5. **Testing Strategy**: Manual testing or add automated tests first?
6. **Timeline**: Is 4-6 weeks acceptable or do we need faster migration?

---

*Document Created*: Based on 12 parallel subagent analyses
*Web Project*: /Users/kennedycampos/Documents/repositories/web
*Mobile Project*: /Users/kennedycampos/Documents/repositories/mobile
*Total Files Analyzed*: 200+ files across both projects
*Total Lines Reviewed*: ~50,000+ lines of code
