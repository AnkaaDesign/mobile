# Nested Routes Implementation Checklist

Use this checklist when implementing a new nested route in the List System.

---

## Pre-Implementation Research (5-10 minutes)

- [ ] Identify the nested route path (e.g., `/estoque/pedidos/[orderId]/items/listar`)
- [ ] Identify the route parameter name (e.g., `orderId`)
- [ ] Identify the parent entity (e.g., Order)
- [ ] Identify the child entity (e.g., OrderItem)
- [ ] Determine the relationship field in child (e.g., `orderId`)
- [ ] Verify the InfiniteMobile hook exists (e.g., `useOrderItemsInfiniteMobile`)
- [ ] Verify the hook accepts `where` parameter
- [ ] Document any special filtering needs

### Research Template

```
Route: /module/parent/[parentId]/child/listar
Parent Param: parentId
Parent Entity: ParentType
Child Entity: ChildType
Relationship Field: parentIdFieldName
Hook: useChildInfiniteMobile
Special Filters: (any?)
Status: __ Ready / __ Needs Hook / __ Needs Type Definition
```

---

## Setup Phase (2-3 minutes)

### Create File Structure

- [ ] Create `src/config/list/{module}/{child-entity}.ts`
- [ ] Update `src/config/list/{module}/index.ts` to export new config
- [ ] Verify page component exists: `src/app/(tabs)/.../[parentId]/{child}/listar.tsx`

### Add Type Definitions

- [ ] Add route params interface to `src/types/routes.ts`:
  ```typescript
  export interface ParentListRouteParams {
    parentId: string
  }
  ```

---

## Config Creation Phase (20-30 minutes)

### 1. Basic Structure

In `src/config/list/{module}/{entity}.ts`:

- [ ] Copy from similar config as template
- [ ] Update `key` (e.g., `'module-child-entities'`)
- [ ] Update `title` (e.g., `'Items of Parent'`)
- [ ] Keep config generic (no parent-specific where clause)

### 2. Query Configuration

- [ ] Set `hook` to the InfiniteMobile hook name
- [ ] Set `defaultSort` (typically newest first: `{ field: 'createdAt', direction: 'desc' }`)
- [ ] Set `pageSize` (typical: 20-30 for mobile)
- [ ] Define `include` for related entities
- [ ] Do NOT include parent filter in `where` yet

**Checklist**:
- [ ] Hook name verified to exist
- [ ] Hook signature checked (supports where/orderBy/include/limit)
- [ ] Page size appropriate for device
- [ ] Related data includes are efficient

### 3. Table Configuration

- [ ] Define 3-8 `columns`
- [ ] Each column has: key, label, width, align, render function
- [ ] Set appropriate widths (0.8-2.5 range)
- [ ] Choose 3-4 columns for `defaultVisible`
- [ ] Set `rowHeight` (typical: 56-60px)
- [ ] Add table `actions` (view, edit, delete)
  - [ ] Routes include parent ID: `/parent/${parentId}/child/...`

**Checklist**:
- [ ] Columns render correctly
- [ ] Width ratios sum to reasonable total
- [ ] Default visible columns are informative
- [ ] Row height accommodates content
- [ ] Action routes include parentId

### 4. Optional: Filters

- [ ] Define `filters.sections` (group related filters)
- [ ] Add relevant filter fields (select, date-range, number-range, text)
- [ ] Ensure filter keys match data structure
- [ ] Test filter combinations

**Checklist**:
- [ ] At least one filter section
- [ ] Filter fields are meaningful
- [ ] Field keys are typed correctly
- [ ] Options are appropriate

### 5. Optional: Search

- [ ] Set `search.placeholder`
- [ ] Set `search.debounce` (typical: 300ms)
- [ ] Verify searchable fields are included in API

**Checklist**:
- [ ] Placeholder is clear
- [ ] Debounce prevents excessive requests

### 6. Optional: Export

- [ ] Define `export` with title and filename
- [ ] Choose formats (csv, json, pdf)
- [ ] Map columns for export
- [ ] Include formatting functions if needed

**Checklist**:
- [ ] Export columns mirror table columns
- [ ] Formatting makes sense
- [ ] Filename is descriptive

### 7. Optional: Actions

- [ ] Define `create` action with label and route
  - [ ] Route includes `[parentId]` param
- [ ] Define `bulk` actions if applicable
- [ ] Add confirmation dialogs if needed

**Checklist**:
- [ ] Create route is correct
- [ ] Bulk actions make sense
- [ ] Confirmations are clear

### 8. Optional: Empty State

- [ ] Define `emptyState` with icon, title, description
- [ ] Tailor message to context

**Checklist**:
- [ ] Message is helpful
- [ ] Icon is appropriate

### 9. Optional: Permissions

- [ ] Define `permissions` for view/create/edit/delete
- [ ] Map to actual privilege names from your system

**Checklist**:
- [ ] Privileges are defined in SECTOR_PRIVILEGES
- [ ] Permissions match business rules

---

## Page Implementation Phase (5 minutes)

In `src/app/(tabs)/.../[parentId]/{entity}/listar.tsx`:

- [ ] Import `NestedLayout` from `@/components/list/NestedLayout`
- [ ] Import config from `@/config/list/{module}/{entity}`
- [ ] Create default export function
- [ ] Return `<NestedLayout>` with:
  - [ ] `config` prop
  - [ ] `paramKey` matching route param name
  - [ ] `buildWhere` function returning where clause

**Template**:
```typescript
import { NestedLayout } from '@/components/list/NestedLayout'
import { entityListConfig } from '@/config/list/{module}/{entity}'

export default function EntityListScreen() {
  return (
    <NestedLayout
      config={entityListConfig}
      paramKey="parentId"
      buildWhere={(parentId) => ({ parentId })}
    />
  )
}
```

**Checklist**:
- [ ] File has exactly 6-8 lines
- [ ] paramKey matches route param in brackets
- [ ] buildWhere returns correct where clause
- [ ] buildWhere field name matches child entity schema

---

## Verification Phase (10-15 minutes)

### Type Checking

- [ ] Run TypeScript compiler: `tsc --noEmit`
- [ ] Resolve any type errors
- [ ] Verify param type matches definition

### Hook Verification

- [ ] Hook file exists at expected location
- [ ] Hook is exported from `src/hooks/index.ts`
- [ ] Hook signature verified
- [ ] Hook supports all params used in config

### Config Verification

- [ ] Config exported from module index
- [ ] Config imported correctly in page
- [ ] All field names match actual data structure
- [ ] Render functions don't error on null/undefined

### Runtime Testing

- [ ] Navigate to nested route manually
- [ ] Verify data loads correctly
- [ ] Verify parent filter is applied (only child data shown)
- [ ] Test search functionality
- [ ] Test sorting (if sortable columns present)
- [ ] Test filters (if defined)
- [ ] Test infinite scroll (scroll to bottom)
- [ ] Test refresh (pull-to-refresh)
- [ ] Verify empty state when no results

**Test Cases**:
- [ ] Data loads successfully
- [ ] Filtering works correctly
- [ ] Search works correctly
- [ ] Pagination works
- [ ] Error states handled
- [ ] Empty state displays correctly
- [ ] Actions work (if implemented)

### Navigation Testing

- [ ] Navigate from parent to nested route
- [ ] Verify parentId param passed correctly
- [ ] Test back navigation
- [ ] Test any action routes (edit, view, etc.)
- [ ] Verify routes include parentId

---

## Integration Phase (5 minutes)

### Module Exports

- [ ] Add to `src/config/list/{module}/index.ts`:
  ```typescript
  export { entityListConfig } from './entity'
  ```

### Navigation Updates (if needed)

- [ ] Update parent page navigation to new nested route
- [ ] Update any menu/navigation definitions
- [ ] Test navigation from multiple entry points

---

## Documentation Phase (5 minutes)

- [ ] Add comment at top of config explaining purpose
- [ ] Document any special filtering logic
- [ ] Add JSDoc for buildWhere if complex
- [ ] Update route params in `src/types/routes.ts` with description

---

## Final Checklist

### Code Quality

- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code follows existing patterns
- [ ] Comments explain any complex logic
- [ ] No console.log or debugging code

### Functionality

- [ ] Parent filter applied correctly
- [ ] Data loads for multiple parent IDs
- [ ] Search/filters/sort all work
- [ ] Error states handled
- [ ] Empty state displays
- [ ] Navigation works
- [ ] Back button works

### Performance

- [ ] Page size appropriate
- [ ] Includes optimized (not over-fetching)
- [ ] No unnecessary re-renders
- [ ] Search has debounce
- [ ] Infinite scroll smooth

### Documentation

- [ ] Code commented where needed
- [ ] Config documented with example usage
- [ ] Types documented
- [ ] Route params documented

---

## Submission Checklist

Before considering the nested route complete:

- [ ] All files created/modified
- [ ] All tests passing
- [ ] All TypeScript errors resolved
- [ ] Config follows existing patterns
- [ ] Page component is minimal (6-8 lines)
- [ ] Documentation updated
- [ ] Types defined
- [ ] Routes verified
- [ ] Data verified
- [ ] Error handling verified
- [ ] Performance acceptable
- [ ] Code reviewed (if applicable)

---

## Common Mistakes to Avoid

- ❌ Including parent filter in config.query.where (should be in buildWhere)
- ❌ Wrong paramKey name (must match route param name)
- ❌ buildWhere returning wrong field name (must match schema)
- ❌ Hook doesn't support where clause (need to update hook first)
- ❌ Routes in actions don't include parentId
- ❌ Config includes non-portable logic
- ❌ Page component is too complex (should be 6-8 lines)
- ❌ Not validating parent param exists
- ❌ Forgetting to export config from module index

---

## Example Completed Checklist

For reference, here's a completed checklist for Order Items:

### Pre-Implementation Research
- [x] Route: `/estoque/pedidos/[orderId]/items/listar`
- [x] Parent Param: `orderId`
- [x] Child Entity: OrderItem
- [x] Relationship: `orderId` field
- [x] Hook: `useOrderItemsInfiniteMobile`
- [x] Hook supports where: Yes

### Setup
- [x] Config file: `src/config/list/inventory/order-items.ts`
- [x] Module index updated: `src/config/list/inventory/index.ts`
- [x] Route params: Added to `src/types/routes.ts`

### Config (✓ Completed in 25 mins)
- [x] Query configured with hook and sort
- [x] Table with 5 columns
- [x] Filters for status
- [x] Search implemented
- [x] Empty state defined
- [x] Actions include parentId

### Page (✓ Completed in 3 mins)
- [x] File: 6 lines
- [x] Uses NestedLayout
- [x] buildWhere returns `{ orderId }`

### Verification (✓ Completed in 10 mins)
- [x] Types check
- [x] Hook verified
- [x] Data loads
- [x] Filter works
- [x] Navigation works

---

## Time Estimates

- Research: 5-10 minutes
- Setup: 2-3 minutes
- Config Creation: 20-30 minutes
- Page Implementation: 5 minutes
- Verification: 10-15 minutes
- Integration: 5 minutes
- Documentation: 5 minutes

**Total: ~60-75 minutes per nested route**

---

## Quick Reference

### Most Important Steps

1. Create config in `src/config/list/{module}/{entity}.ts`
2. Create page with `<NestedLayout>` (6 lines)
3. Verify buildWhere returns correct where clause
4. Test data loads with correct parent filter
5. Export config from module index

### Most Common Issues

1. **buildWhere field name wrong** → Check schema
2. **Hook doesn't have where param** → Update hook first
3. **Page too complex** → Should be 6-8 lines max
4. **Actions routes missing parentId** → Add to render function
5. **Parent filter still in config** → Move to buildWhere

---

## Resources

- **Pattern Guide**: `docs/NESTED_ROUTES_PATTERN_GUIDE.md`
- **Implementation Examples**: `docs/NESTED_ROUTES_EXAMPLES.md`
- **Quick Reference**: `docs/NESTED_ROUTES_QUICK_REFERENCE.md`
- **Architecture**: `docs/NESTED_ROUTES_ARCHITECTURE.md`
- **NestedLayout Component**: `src/components/list/NestedLayout.tsx`

---

## Questions?

Refer to:
1. Pattern Guide for detailed explanation
2. Examples for concrete implementations
3. Architecture doc for design decisions
4. Quick Reference for fast lookups

---

**Last Updated**: November 14, 2025
**Pattern Version**: 1.0
