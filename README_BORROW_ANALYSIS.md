# Borrow Form Analysis - Complete Documentation

This directory contains comprehensive analysis of the Borrow (employee item loan) forms across Web and Mobile platforms.

## Documents

### 1. BORROW_FORM_ANALYSIS.md (23 KB) - Comprehensive Deep Dive
**Best for:** Understanding the complete system, development planning, and feature requirements

**Contains:**
- Executive Summary
- Part 1: Complete Field List (database schema, related data)
- Part 2: Form-by-Form Detailed Comparison
  - Single Create (Web only)
  - Batch Create (Web & Mobile with differences)
  - Edit Form (Web only)
  - Return Form (Web & Mobile with differences)
- Part 3: Use Cases & Workflows (5 main use cases)
- Part 4: Validation Comparison (create vs return)
- Part 5: Missing Functionality & Gaps
- Part 6: Field Requirements Summary
- Part 7: Data Validation & Rules
- Part 8: Implementation Quality Assessment + Recommendations

### 2. BORROW_FORM_QUICK_REFERENCE.md (12 KB) - Quick Lookup
**Best for:** Quick lookups while coding, testing checklists, gotchas

**Contains:**
- Form Availability Matrix
- Field Comparison by Form (visual trees)
- Validation Rules Quick Reference (tables)
- Form Field Details (item/user/quantity selectors)
- Return Form Differences (side-by-side)
- URL State Management
- Error Handling Comparison
- Batch Processing Differences
- Key Implementation Files
- Common Issues & Gotchas
- Testing Checklist

## Quick Navigation

### If you need to...

**Understand the overall system:**
→ Start with BORROW_FORM_ANALYSIS.md, Part 1 & 2

**Implement a feature:**
→ Check BORROW_FORM_ANALYSIS.md, Part 6 (field requirements)

**Fix a bug:**
→ Check BORROW_FORM_QUICK_REFERENCE.md (gotchas section)

**Write tests:**
→ Check BORROW_FORM_QUICK_REFERENCE.md (testing checklist)

**Compare Web vs Mobile:**
→ Check BORROW_FORM_QUICK_REFERENCE.md (comparison tables)

**Understand validation:**
→ Check both documents, Part 4 in Analysis, "Quick Reference" section

**See what's missing:**
→ BORROW_FORM_ANALYSIS.md, Part 5 (gaps and recommendations)

## Key Facts at a Glance

### Forms Available
- **Web:** Single Create, Batch Create, Edit, Return, Mark as Lost
- **Mobile:** Batch Create ONLY, Return, Mark as Lost

### Most Critical Differences
1. **Mobile has no Edit form** - users must recreate to change details
2. **Mobile has no Pagination** - limited to 50 items per batch
3. **Mobile has no URL State** - selections lost on page refresh
4. **Web Batch has complex state** - 11 URL parameters tracked

### Core Fields (All Forms)
- `itemId` (UUID) - Item being borrowed
- `userId` (UUID) - Responsible person
- `quantity` (Number) - Amount borrowed
- `returnedAt` (DateTime, optional) - Set on return
- `status` (Enum) - ACTIVE, RETURNED, LOST

### Validation Strictness
- **Web Create:** High (client-side comprehensive)
- **Mobile Create:** Medium (server-side fallback)
- **Web Return:** Moderate (7 checks)
- **Mobile Return:** Basic (2 checks)

## Implementation Files

### Web
```
/home/kennedy/repositories/web/src/components/inventory/borrow/form/
├── borrow-create-form.tsx           [Single create - 257 lines]
├── borrow-batch-create-form.tsx     [Batch with URL state - 374 lines]
├── borrow-edit-form.tsx             [Edit with read-only - 254 lines]
├── borrow-return-form.tsx           [Return item - 330 lines]
└── [Supporting components and utilities]
```

### Mobile
```
/home/kennedy/repositories/mobile/src/components/inventory/borrow/form/
├── borrow-batch-create-form.tsx     [Batch only - 342 lines]
└── borrow-return-form.tsx           [Return item - 307 lines]
```

## Recommendations Summary

### High Priority
1. Mobile feature parity (add edit, single create, pagination)
2. Fix mark as lost implementation on web
3. Add notes/reason field to both
4. Improve mobile validation error display

### Medium Priority
1. Add expected return date to schema
2. Implement return history/timeline
3. Batch edit capability
4. Batch delete capability

### Low Priority
1. Advanced filtering
2. CSV bulk import
3. Analytics

## Testing Strategy

1. **Critical Path Tests** (happy path)
   - Single borrow create
   - Batch borrow create
   - Return active borrow
   - Edit active borrow
   - Mark as lost

2. **Validation Tests**
   - Invalid quantities
   - Inactive items/users
   - Stock availability
   - Date constraints
   - Batch limits

3. **State Tests** (Web Batch only)
   - Pagination with selections
   - URL parameter persistence
   - Filter application

4. **Mobile Specific**
   - Item addition/removal
   - Quantity editing
   - Selection loss on refresh

See BORROW_FORM_QUICK_REFERENCE.md for complete testing checklist.

## Schema Information

Both Web and Mobile use **identical Zod schemas** at:
- Web: `/home/kennedy/repositories/web/src/schemas/borrow.ts`
- Mobile: `/home/kennedy/repositories/mobile/src/schemas/borrow.ts`

Core schemas:
- `borrowCreateSchema` - Single borrow creation
- `borrowUpdateSchema` - Update existing borrow
- `borrowBatchCreateSchema` - Multiple borrows
- `borrowGetManySchema` - Query with filters

## Notes

- Analysis current as of October 26, 2025
- All file paths are absolute (Linux format)
- Portuguese language used in UI (pt-BR)
- Both platforms use React Hook Form + Zod for validation
- Web uses Tailwind CSS + Shadcn UI
- Mobile uses React Native styles

## Questions?

Refer to the detailed documents:
1. For "Why?" questions → BORROW_FORM_ANALYSIS.md
2. For "How?" questions → BORROW_FORM_QUICK_REFERENCE.md
3. For specific examples → Code comments in implementation files
