# Nested Routes Documentation Index

Complete documentation for implementing nested list pages in the List System.

---

## Quick Links

### I Just Want to Implement a Nested Route

1. **Start Here**: [Quick Reference](./NESTED_ROUTES_QUICK_REFERENCE.md) (5 min read)
2. **Then See**: [Implementation Checklist](./NESTED_ROUTES_IMPLEMENTATION_CHECKLIST.md) (follow while building)
3. **If Stuck**: [Examples](./NESTED_ROUTES_EXAMPLES.md) (find similar use case)

### I Want to Understand the Architecture

1. **Overview**: [Architecture Decision](./NESTED_ROUTES_ARCHITECTURE.md) (why this approach?)
2. **Details**: [Pattern Guide](./NESTED_ROUTES_PATTERN_GUIDE.md) (how it works)
3. **Examples**: [Implementation Examples](./NESTED_ROUTES_EXAMPLES.md) (real-world cases)

### I'm Reviewing Someone's Code

1. Use [Implementation Checklist](./NESTED_ROUTES_IMPLEMENTATION_CHECKLIST.md)
2. Verify against [Quick Reference](./NESTED_ROUTES_QUICK_REFERENCE.md)
3. Check against [Examples](./NESTED_ROUTES_EXAMPLES.md) for patterns

---

## Document Descriptions

### 1. NESTED_ROUTES_QUICK_REFERENCE.md
**Reading Time**: 5-10 minutes

Quick lookup guide with:
- Pattern summary (30 seconds)
- Common buildWhere patterns
- Hook requirements
- Page template
- Issue troubleshooting table
- Existing examples

**When to Use**: Fast reference while coding

**Key Sections**:
- The Pattern in 30 Seconds
- File Checklist
- Common buildWhere Patterns
- Common Issues & Solutions

---

### 2. NESTED_ROUTES_PATTERN_GUIDE.md
**Reading Time**: 20-30 minutes

Comprehensive guide covering:
- Overview of current nested routes
- Architecture decision (component wrapper)
- Step-by-step implementation pattern
- Detailed implementation examples (3 examples)
- Hook requirements
- Dynamic filter application methods
- Query params flow
- Type safety pattern
- Testing examples
- Best practices
- Migration checklist
- Troubleshooting
- Future enhancements

**When to Use**: First time learning the pattern, deep dive

**Key Sections**:
- Overview
- Architecture Decision
- Pattern Implementation (step-by-step)
- Detailed Implementation Examples
- Hook Requirements
- Dynamic Filter Application
- Type Safety Pattern
- Testing
- Best Practices
- Troubleshooting

---

### 3. NESTED_ROUTES_EXAMPLES.md
**Reading Time**: 15-25 minutes

Concrete implementation examples:
- Order Items (simple one-to-many)
- Paint Formula Components (complex with related data)
- Maintenance Schedules (decision tree)
- Employee PPE (date range with filters)

Each example includes:
- Scenario description
- File structure
- Complete config file
- Page component
- Hook requirements

Also includes:
- Common patterns (4 types)
- Testing example
- Summary

**When to Use**: Looking for similar use case, copy-paste starting point

**Key Sections**:
- Order Items Example
- Paint Formula Components Example
- Maintenance Schedules Example
- Employee PPE Example
- Common Patterns
- Testing Example

---

### 4. NESTED_ROUTES_ARCHITECTURE.md
**Reading Time**: 25-35 minutes

Deep dive into design decisions:
- Problem statement
- Why NestedLayout (wrapper pattern)
- Architecture diagram
- Implementation details
- Data flow (request and response paths)
- Comparison with alternatives (3 alternatives)
- Integration with List System
- Type safety approach
- Error handling strategy
- Performance considerations
- Extensibility options
- Migration path
- Q&A

**When to Use**: Understanding why this approach, architecture review, team discussion

**Key Sections**:
- Problem Statement
- Chosen Solution
- Implementation Details
- Data Flow
- Comparison with Alternatives
- Type Safety
- Error Handling
- Performance
- Extensibility
- Migration Path

---

### 5. NESTED_ROUTES_IMPLEMENTATION_CHECKLIST.md
**Reading Time**: Variable (use while implementing)

Step-by-step checklist for implementing nested routes:

**Phases**:
1. Pre-Implementation Research (5-10 min)
2. Setup Phase (2-3 min)
3. Config Creation Phase (20-30 min)
4. Page Implementation Phase (5 min)
5. Verification Phase (10-15 min)
6. Integration Phase (5 min)
7. Documentation Phase (5 min)

Each phase includes specific checkboxes and explanations

**Sections**:
- Pre-Implementation Research
- Setup Phase
- Config Creation (with subsections)
- Page Implementation
- Verification
- Integration
- Documentation
- Final Checklist
- Common Mistakes
- Time Estimates
- Quick Reference
- Resources

**When to Use**: While actually implementing, before submitting code

**Total Time**: ~60-75 minutes per nested route

---

### 6. NESTED_ROUTES_INDEX.md
**This File**

Overview and navigation for all nested routes documentation.

---

## Learning Path

### Path 1: Quick Implementation (30 minutes)

1. Read [Quick Reference](./NESTED_ROUTES_QUICK_REFERENCE.md) (5 min)
2. Find similar example in [Examples](./NESTED_ROUTES_EXAMPLES.md) (5 min)
3. Use [Implementation Checklist](./NESTED_ROUTES_IMPLEMENTATION_CHECKLIST.md) (20 min)

**Outcome**: Implement a simple nested route

---

### Path 2: Deep Understanding (90 minutes)

1. Read [Quick Reference](./NESTED_ROUTES_QUICK_REFERENCE.md) (5 min)
2. Read [Architecture Decision](./NESTED_ROUTES_ARCHITECTURE.md) (30 min)
3. Read [Pattern Guide](./NESTED_ROUTES_PATTERN_GUIDE.md) (30 min)
4. Review [Examples](./NESTED_ROUTES_EXAMPLES.md) (15 min)
5. Study [Implementation Checklist](./NESTED_ROUTES_IMPLEMENTATION_CHECKLIST.md) (10 min)

**Outcome**: Full understanding of pattern, can explain to others

---

### Path 3: Code Review (40 minutes)

1. Skim [Quick Reference](./NESTED_ROUTES_QUICK_REFERENCE.md) (5 min)
2. Check [Implementation Checklist](./NESTED_ROUTES_IMPLEMENTATION_CHECKLIST.md) (10 min)
3. Verify against [Examples](./NESTED_ROUTES_EXAMPLES.md) (10 min)
4. Reference [Pattern Guide](./NESTED_ROUTES_PATTERN_GUIDE.md) for questions (15 min)

**Outcome**: Review nested route PR effectively

---

## Common Questions

### Q: Where do I start?

**A**:
- If implementing: Quick Reference → Examples → Checklist
- If learning: Architecture → Pattern Guide → Examples
- If reviewing: Checklist → Quick Reference → Examples

### Q: How long does it take to implement a nested route?

**A**: 60-75 minutes (setup 5, config 25, page 5, verify 12, integration 5, docs 5)

### Q: What if my case is different from the examples?

**A**:
1. Check [Common Patterns](./NESTED_ROUTES_EXAMPLES.md#common-patterns)
2. See [Pattern Guide - Dynamic Filter Application](./NESTED_ROUTES_PATTERN_GUIDE.md#dynamic-filter-application-methods)
3. Ask about architecture in [Architecture Q&A](./NESTED_ROUTES_ARCHITECTURE.md#questions--answers)

### Q: How do I know if the hook supports nested routes?

**A**: See [Hook Requirements](./NESTED_ROUTES_QUICK_REFERENCE.md#hook-requirements)

### Q: What if I make a mistake?

**A**: See [Common Mistakes to Avoid](./NESTED_ROUTES_IMPLEMENTATION_CHECKLIST.md#common-mistakes-to-avoid)

---

## Key Files Referenced

### Code Files
- `src/components/list/NestedLayout.tsx` - The wrapper component
- `src/components/list/Layout/index.tsx` - The base layout
- `src/hooks/list/useList.ts` - Core list hook
- `src/components/list/types.ts` - Type definitions

### Config Files (Examples)
- `src/config/list/inventory/order-items.ts` - Order items config
- `src/config/list/painting/formula-components.ts` - Formula components config
- `src/config/list/inventory/maintenance-schedules.ts` - Maintenance schedules config

### Page Files (Examples)
- `src/app/(tabs)/estoque/pedidos/[orderId]/items/listar.tsx` - Order items page
- `src/app/(tabs)/pintura/formulas/[formulaId]/componentes/listar.tsx` - Formula components page

### Type Files
- `src/types/routes.ts` - Route parameter interfaces

---

## Architecture Overview

```
User navigates to nested route
            ↓
Route param extracted (useLocalSearchParams)
            ↓
NestedLayout component
  ├─ Validates param
  ├─ Builds where clause (buildWhere callback)
  ├─ Modifies config with where clause
            ↓
    Layout component (unchanged)
      ├─ useList hook (unchanged)
      ├─ Search, Filters, Table, etc.
            ↓
        Query hook (e.g., useOrderItemsInfiniteMobile)
          ├─ Receives: where + orderBy + include + limit
                    ↓
              API endpoint
                    ↓
        Returns filtered data
                    ↓
      Table renders child entity data
            ↓
User sees filtered list scoped to parent
```

---

## Pattern Summary

**Core Concept**: NestedLayout wrapper extracts route params and applies them as filters to the config.

**Implementation**:
- Config file (220 lines) - handles structure and options
- Page component (6 lines) - specifies parent param and filter logic

**Formula**:
```typescript
<NestedLayout
  config={childEntityConfig}
  paramKey="parentId"
  buildWhere={(parentId) => ({ parentIdField: parentId })}
/>
```

**Benefits**:
- Non-breaking
- Minimal boilerplate
- Type-safe
- Testable
- Extensible

---

## Nested Routes Status

### Implemented
- ✓ Order Items `/estoque/pedidos/[orderId]/items/listar`
- ✓ Paint Formula Components `/pintura/formulas/[formulaId]/componentes/listar`

### Documented Pattern
- ✓ Pattern Guide
- ✓ Examples
- ✓ NestedLayout Component

### Ready for Implementation
- [ ] Maintenance Schedules (+ others)
- [ ] Employee PPE (+ others)

---

## Documentation Maintenance

### Last Updated
November 14, 2025

### Version
1.0 - Initial release with complete pattern documentation

### Authors
Research and Documentation for List System Migration

### How to Update

If adding new nested routes:
1. Update [Examples](./NESTED_ROUTES_EXAMPLES.md) with new example
2. Update [Quick Reference](./NESTED_ROUTES_QUICK_REFERENCE.md) if pattern changes
3. Update this index with link to new documentation

---

## Related Documentation

- [Mobile App List System Migration Guide](./LIST_SYSTEM_MIGRATION_WORKFLOW.md)
- [List System Pattern Reference](./LIST_SYSTEM_PATTERN_REFERENCE.md)
- [Enum Pattern Analysis](./ENUM_PATTERN_ANALYSIS.md)

---

## Getting Help

**Problem**: Can't find what I need
1. Check [Common Questions](#common-questions)
2. Use browser search (Ctrl+F) in relevant document
3. Check [Pattern Guide Table of Contents](./NESTED_ROUTES_PATTERN_GUIDE.md)

**Problem**: Implementation not working
1. See [Troubleshooting](./NESTED_ROUTES_PATTERN_GUIDE.md#troubleshooting) in Pattern Guide
2. Check [Common Mistakes](./NESTED_ROUTES_IMPLEMENTATION_CHECKLIST.md#common-mistakes-to-avoid)
3. Compare against [Examples](./NESTED_ROUTES_EXAMPLES.md)

**Problem**: Not sure about architecture
1. Read [Architecture Decision](./NESTED_ROUTES_ARCHITECTURE.md)
2. Check [Comparison with Alternatives](./NESTED_ROUTES_ARCHITECTURE.md#comparison-with-alternatives)
3. Review [Q&A](./NESTED_ROUTES_ARCHITECTURE.md#questions--answers)

---

## Summary

These documents provide complete guidance for understanding and implementing nested routes in the mobile app's List System.

Start with the [Quick Reference](./NESTED_ROUTES_QUICK_REFERENCE.md) and follow the learning path that matches your needs.

Each document is self-contained but cross-referenced for easy navigation.
