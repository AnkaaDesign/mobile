# Human Resources Module - Comprehensive Analysis

## Executive Summary

The mobile application's human resources module contains a well-structured architecture with clear separation of concerns between schemas, types, components, and pages. The module handles multiple HR-related entities: Employees, Vacations, Holidays, Positions, Warnings, and PPE (Personal Protective Equipment).

---

## 1. Architecture Overview

### Directory Structure
```
src/
├── schemas/              # Zod validation schemas for API requests
├── types/                # TypeScript type definitions (responses)
├── api-client/           # Service classes for API calls
├── app/(tabs)/human-resources/     # Route pages
├── components/human-resources/     # Reusable UI components
├── constants/            # Enums, labels, and configuration
└── hooks/                # React hooks for data fetching
```

### Key Pattern: Schema -> API Client -> Hook -> Component -> Page

Each entity follows a consistent pattern:
1. **Schema** (schemas/*.ts) - Zod validation + transformation
2. **Type** (types/*.ts) - TypeScript interfaces
3. **API Client** (api-client/*.ts) - Service class wrapper
4. **Hook** (hooks/use*.ts) - React Query integration
5. **Component** (components/human-resources/**) - Reusable UI
6. **Page** (app/(tabs)/human-resources/**) - Route entry point

---

## 2. Core Entities Analyzed

### 2.1 Holiday
**Purpose:** Manage company holidays (fixed dates and recurring patterns)

**Schema Definition** (`schemas/holiday.ts`):
- **Fields:** id, name, date, type, createdAt, updatedAt
- **Type Enum:** HOLIDAY_TYPE (NATIONAL, CORPORATE, OPTIONAL)
- **Query Filters:**
  - searchingFor (text search by name)
  - types (array of HOLIDAY_TYPE)
  - names (array of specific names)
  - year, month (temporal filters)
  - dateRange (start/end date)
  - isRecurring, isNational, isUpcoming (boolean flags)

**Transform Logic:**
- Converts convenience filters to Prisma where clauses
- Normalizes orderBy format
- Handles take/limit alias

**Status:** Mature and well-designed

---

### 2.2 Vacation
**Purpose:** Manage employee vacation requests and approvals

**Schema Definition** (`schemas/vacation.ts`):
- **Fields:** id, userId, startAt, endAt, isCollective, type, status, createdAt, updatedAt
- **Type Enum:** VACATION_TYPE (ANNUAL, MEDICAL, UNPAID, etc.)
- **Status Enum:** VACATION_STATUS (PENDING, APPROVED, IN_PROGRESS, COMPLETED, REJECTED)
- **Query Filters:**
  - searchingFor (employee name/email)
  - userIds, statuses, types
  - isCollective, isActive, isPast, isFuture
  - year, month
  - startAtRange, endAtRange (date ranges)

**Advanced Features:**
- Supports multi-field ordering (but implemented non-cumulatively in latest tables)
- User relationship include (nested to second level)
- Time-based filters with 00:00:00 / 23:59:59 precision

**Status:** Mature with temporal complexity

---

### 2.3 Position & PositionRemuneration
**Purpose:** Define job positions and manage salary history

**Schema Definition** (`schemas/position.ts`):
- **Position Fields:** id, name, remuneration, bonifiable
- **Remuneration Fields:** id, value, positionId, createdAt, updatedAt
- **Relationships:** Position → Users (many), Remunerations (many)

**Query Filters:**
- searchingFor (position name)
- hasUsers (boolean)
- remunerationRange (min/max values)
- Supports historical remunerations

**Specialized Methods:**
- `findByPositionId()` - Get all remunerations for a position
- `getCurrentByPositionId()` - Get active remuneration
- `findByValueRange()` - Range queries

**Status:** Well-structured with specialized operations

---

### 2.4 Warning
**Purpose:** Track employee warnings/disciplinary actions

**Schema Definition** (`schemas/warning.ts`):
- **Fields:** 
  - id, severity, category, reason, description
  - isActive, followUpDate, hrNotes, resolvedAt
  - collaboratorId, supervisorId, witness[], attachments[]

- **Severity Enum:** WARNING_SEVERITY (LIGHT, MODERATE, SEVERE, CRITICAL)
- **Category Enum:** WARNING_CATEGORY (ATTENDANCE, BEHAVIOR, PERFORMANCE, SAFETY, OTHER)

**Query Filters:**
- searchingFor (searches reason, description, hrNotes, collaborator name)
- severities, categories (multi-select)
- collaboratorIds, supervisorIds, witnessIds
- hasFollowUp, hasHrNotes, isActive, isResolved
- createdAt, updatedAt (date ranges)

**Schema Issues Found:**
- ✓ Correctly uses 'witness' (not 'witnesses') for relation
- ✓ Correctly uses 'attachments' (not 'files') for relation
- All validation messages in Portuguese

**Status:** Well-implemented, recently corrected for relation names

---

### 2.5 PPE (Personal Protective Equipment)
**Purpose:** Manage safety equipment delivery and scheduling

**Three Sub-entities:**

**2.5.1 PpeSize**
- Fields: id, measurement values by type, userId
- Custom endpoints: getPpeSizesByMask, getPpeSizeByUserId

**2.5.2 PpeDelivery**
- Fields: id, userId, ppeType, status, statusOrder, deliveryDate
- Status: REQUESTED, PENDING, APPROVED, DELIVERED, REJECTED
- Custom endpoints:
  - markAsDelivered
  - requestPpeDelivery
  - getMyPpeDeliveries
  - getAvailablePpeForUser
  - batchApprove, batchReject

**2.5.3 PpeDeliverySchedule**
- Fields: id, employeeId, ppeItemId, frequency, lastDelivered
- Coordinates automatic PPE delivery scheduling

**Status:** Complex with specialized workflow (approval + batch operations)

---

## 3. Current Patterns & Conventions

### 3.1 Schema Patterns

**Convention:** All schemas follow this structure:
```typescript
// 1. Include Schema (relations to load)
export const entityIncludeSchema = z.object({...})

// 2. OrderBy Schema (sorting)
export const entityOrderBySchema = z.union([...])

// 3. Where Schema (filtering)
export const entityWhereSchema = z.lazy(...)

// 4. Convenience Filters
const entityFilters = {...}

// 5. Transform Function
const entityTransform = (data: any) => {...}

// 6. Query Schema (combining all)
export const entityGetManySchema = z.object({...})
  .transform(entityTransform)

// 7. CRUD Schemas
export const entityCreateSchema = z.object({...})
export const entityUpdateSchema = z.object({...})

// 8. Batch Operations
export const entityBatchCreateSchema = z.object({...})
```

**Key Features:**
- Zod for runtime validation
- `transform()` converts convenience filters to Prisma format
- `z.lazy()` for recursive/circular references
- Portuguese validation messages throughout

### 3.2 API Client Pattern

All API clients follow class-based structure:
```typescript
export class EntityService {
  private readonly basePath = "/endpoint"
  
  // Query operations
  async getEntities(params): Promise<Response>
  async getEntityById(id, params): Promise<Response>
  
  // Mutation operations
  async createEntity(data, query): Promise<Response>
  async updateEntity(id, data, query): Promise<Response>
  async deleteEntity(id): Promise<Response>
  
  // Batch operations
  async batchCreateEntities(data, query): Promise<Response>
  // ... batch update, delete
}

export const entityService = new EntityService()
export const getEntities = (params) => entityService.getEntities(params)
// ... individual function exports
```

**Consistency:** All services follow identical patterns

### 3.3 Table/List Component Pattern

Emerging pattern for list components:

```typescript
export interface TableColumn {
  key: string
  header: string
  accessor: (item: Entity) => React.ReactNode
  width: number
  align?: "left" | "center" | "right"
  sortable?: boolean
}

export interface SortConfig {
  columnKey: string
  direction: "asc" | "desc"
}

export const createColumnDefinitions = (): TableColumn[] => [...]

export const EntityTable = React.memo<EntityTableProps>(({ items, ... }) => {
  // Dynamic column width calculation
  // Responsive horizontal scroll
  // Selection support
  // Multi-sort (or single-sort depending on entity)
  // Swipe actions on mobile
})
```

**Evolution:** Tables are being unified toward a consistent design pattern

---

## 4. Components Structure

### 4.1 Directory Pattern
```
src/components/human-resources/{entity}/
├── list/
│   ├── {entity}-table.tsx          # Main table component
│   ├── {entity}-filter-modal.tsx   # Filter UI
│   ├── {entity}-filter-tags.tsx    # Active filter display
│   ├── {entity}-filter-drawer.tsx  # Alternative filter UI
│   └── column-visibility-*.tsx     # Column management
├── detail/
│   ├── index.ts                    # Barrel export
│   ├── {entity}-card.tsx           # Main entity display
│   ├── {related}-card.tsx          # Related entity cards
│   └── ...
└── skeleton/
    ├── {entity}-list-skeleton.tsx  # Loading state
    ├── {entity}-detail-skeleton.tsx
    └── index.ts
```

### 4.2 Filter Implementations

**Pattern 1: Modal-based Filter** (`WarningFilterModal`)
- Sections (expandable)
- Multi-combobox for selections
- Date range pickers
- Switch toggles
- Clean apply/clear buttons
- Active filter count badge

**Pattern 2: Drawer-based Filter** (`EmployeeFilterDrawer`)
- Collapsible sections
- Similar UI elements
- Alternative UX from modal

**Status:** Two competing patterns - should consolidate

### 4.3 Table Components

**Evolving Pattern:**
- `WarningTable` - Latest pattern with modern sorting/selection
- `PerformanceLevelTable` - Multi-sort with sort order numbering
- `EmployeeTable` - Advanced selection and column visibility

**Key Features:**
- Dynamic column width calculation based on ratios
- Responsive horizontal scroll
- Selection checkboxes
- Sortable columns with visual indicators
- Swipe actions (delete/edit on mobile)
- Infinite scroll with loading states
- Empty states
- Themed with extended colors

---

## 5. Patterns Used & Consistency Analysis

### 5.1 STRONG Patterns (Consistent)

✓ **Schema Structure**: All HR schemas follow identical include/orderBy/where pattern
✓ **API Client Structure**: All services use class + function exports
✓ **Type Naming**: FormData, Response types follow consistent naming
✓ **Portuguese Localization**: All validation messages in Portuguese
✓ **Zod Transforms**: All schemas use transform() for filter conversion
✓ **Batch Operations**: All entities support batch CRUD

### 5.2 EMERGING Patterns (Inconsistent)

⚠ **Table Components**:
- Warning table has newest pattern (non-cumulative sort)
- Performance level has multi-sort with numbering
- Employee uses separate sort configuration
- **Issue**: No clear guidance on single vs. multi-sort

⚠ **Filter UI**:
- Modal vs. Drawer implementations
- Filter tags vs. inline display
- **Issue**: Two competing UX patterns

⚠ **Column Visibility**:
- Drawer v1 and v2 variants
- **Issue**: Incomplete migration/cleanup

### 5.3 OUTDATED Patterns (Needs Update)

🔴 **PPE Request Form**: `delivery-form.tsx` in wrong location
🔴 **Some Filter Drawers**: v1 versions still exist alongside v2
🔴 **Include Patterns**: Some components overuse nested includes

---

## 6. Data Flow & Dependencies

### 6.1 Type System Flow

```
Zod Schema (schemas/*.ts)
    ↓
Type Inference (z.infer<typeof schema>)
    ↓
API Client Usage (api-client/*.ts)
    ↓
React Hook Response
    ↓
Component Props
    ↓
Table/Form Rendering
```

### 6.2 Query Parameter Transformation

Example: Vacation Filter to API Call
```typescript
// UI State
{ userIds: ["123", "456"], statuses: ["APPROVED"] }

// Transform (in schema)
→ { where: { userId: { in: [...] }, status: { in: [...] } } }

// API Call
getVacations({ ...filters, where: {...}, orderBy: {...} })

// Backend Processing
Prisma.vacation.findMany({ where: {...}, orderBy: {...} })
```

### 6.3 Hook Usage Pattern

Typical usage:
```typescript
const { items, isLoading, loadMore } = useEntitiesInfiniteMobile(queryParams)
// items: Entity[]
// Pagination handled via React Query
// Infinite scroll via loadMore callback
```

---

## 7. Identified Issues & Inconsistencies

### HIGH PRIORITY

1. **Relation Name Inconsistencies** (Warning Schema - FIXED)
   - Was: 'witnesses' should be 'witness'
   - Was: 'files' should be 'attachments'
   - Status: Corrected in schema analysis

2. **Schema Naming Mismatch**
   - Issue: Some schemas reference wrong field names
   - Example: WarningIncludeSchema references wrong properties
   - Impact: Runtime errors on include calls

3. **Two Filter UX Patterns**
   - Modal Filter vs. Drawer Filter
   - Creates inconsistent user experience
   - Should standardize on one approach

### MEDIUM PRIORITY

4. **Column Visibility Duplication**
   - `column-visibility-drawer.tsx` and `column-visibility-drawer-v2.tsx`
   - v2 exists but v1 still in use
   - Needs migration completion

5. **Sort Configuration Inconsistency**
   - Warning table: Single sort (non-cumulative)
   - Performance level: Multi-sort with numbering
   - Employee table: Custom sort ordering
   - Should standardize on one behavior

6. **File Organization**
   - `delivery-form.tsx` in wrong location
   - Filter variants (v2) alongside old versions
   - Inconsistent nesting of related components

### LOW PRIORITY

7. **Over-nested Include Schemas**
   - Vacation and Position include up to 18+ nested user relations
   - Could be optimized with targeted includes

8. **Enum Label Lookups**
   - Manual record lookups: `LABEL_MAP[value as keyof typeof LABEL_MAP]`
   - Verbose pattern, but functional

---

## 8. Strengths of Current Implementation

✓ **Type Safety**: Full TypeScript with Zod validation
✓ **Consistency**: API client and schema patterns are unified
✓ **Extensibility**: Easy to add new entities following patterns
✓ **Localization**: All user-facing text in Portuguese
✓ **Mobile-Optimized**: Responsive tables with swipe actions
✓ **Performance**: Infinite scroll, lazy loading, memoization
✓ **Batch Operations**: All entities support batch CRUD
✓ **Error Handling**: Validation errors from Zod + API errors
✓ **Flexibility**: Rich filtering with convenience + raw Prisma filters

---

## 9. Areas for Improvement

### Code Quality
- [ ] Consolidate filter implementations (modal vs. drawer)
- [ ] Standardize sort behavior (single vs. multi)
- [ ] Finish column visibility migration (remove v1)
- [ ] Document sort strategy decisions

### Type Safety
- [ ] Verify all schema include references match Prisma model
- [ ] Add stricter typing to filter transforms
- [ ] Document custom endpoint patterns

### DX (Developer Experience)
- [ ] Create shared table component base class
- [ ] Extract common filter logic
- [ ] Document "add new entity" checklist
- [ ] Add JSDoc comments to schema transforms

### Architecture
- [ ] Consider facade pattern for simpler API usage
- [ ] Standardize on one filter UX approach
- [ ] Create component template generator

---

## 10. Quick Reference: What Exists

### Fully Implemented Entities
- ✓ Holiday (CRUD + complex filtering)
- ✓ Vacation (CRUD + time-based filtering + approvals)
- ✓ Position + PositionRemuneration (CRUD + specialized queries)
- ✓ Warning (CRUD + multi-field filtering + attachments)
- ✓ PPE (Delivery + Schedule + Size management)

### Partially Implemented
- ⚠ Employee (List view complete, edit not in scope)
- ⚠ Performance Levels (List only, no CRUD)
- ⚠ Positions (View + edit views exist)

### UI Patterns Established
- ✓ List pages with search + filters
- ✓ Table components with sorting
- ✓ Detail pages with related data
- ✓ Filter modals/drawers
- ✓ Selection & bulk actions
- ✓ Skeletons for loading states
- ✓ Empty states

---

## 11. Recommendations

### Immediate Actions
1. Consolidate filter implementations (choose Modal or Drawer)
2. Standardize sort behavior across all tables
3. Complete column visibility migration
4. Document which pattern should be used for new entities

### Short-term
1. Create table component factory
2. Extract common filter logic to shared hook
3. Add "Add New Entity" developer checklist
4. Document schema naming conventions

### Long-term
1. Consider API facade layer for simpler component usage
2. Evaluate form builder for consistency
3. Consider mobile-specific component library
4. Plan UI/UX standardization across all modules

---

## 12. Files Summary

### Schemas (src/schemas/)
- holiday.ts - 405 lines
- vacation.ts - 712 lines
- position.ts - 696 lines
- warning.ts - 554 lines
- ppe-request.ts (related to deliveries)

### API Clients (src/api-client/)
- holiday.ts - Service + exports
- vacation.ts - Service + exports
- position.ts - Service + PositionRemuneration (225 lines)
- warning.ts - Service + exports
- ppe.ts - PpeSizeService, PpeDeliveryService, PpeDeliveryScheduleService (448 lines)

### Components (src/components/human-resources/)
- warning/ - List, detail, skeleton
- vacation/ - List, detail, skeleton
- position/ - List, detail, skeleton
- ppe/ - Multiple sub-entities (delivery, schedule, size)
- performance-level/ - List only
- holiday/ - List, detail, skeleton

### Pages (src/app/(tabs)/human-resources/)
- All entities have list views
- Detail views for most entities
- Create/Edit views for major entities

---

## 13. Conclusion

The human resources module demonstrates a mature, well-organized architecture with strong patterns for schemas, API clients, and basic UI components. The recent improvements to table components and filtering show a movement toward greater consistency.

**Key Takeaway**: The module is at an inflection point where emerging patterns need to be evaluated and consolidated before they diverge further. The next phase should focus on standardizing filter UX, sort behavior, and creating reusable component templates to improve development velocity.

The codebase is **production-ready** for current features but would benefit from the architectural improvements outlined in section 11 for long-term maintainability.
