# Paint-Related Fields: Quick Reference Guide

## Critical Missing Fields in Mobile

| Entity | Field | Type | Required | Notes |
|--------|-------|------|----------|-------|
| Paint | code | string or null | No | Max 20 chars, internal code |
| Paint | manufacturer | TRUCK_MANUFACTURER or null | No | Truck brand association |
| PaintFormula | density | number | Yes | Paint density value |
| PaintFormula | pricePerLiter | number | Yes | Cost per liter for costing |

---

## Entity Overview

### Paint Type
- 5 types: POLYESTER, ACRYLIC, LACQUER, POLYURETHANE, EPOXY
- Has needGround flag
- Can have associated component items

### Paint Brand
- Simple name field
- Can have associated paints
- Can have associated component items

### Paint
- Complete visual properties (hex color, finish, palette)
- References PaintType (required) and PaintBrand (optional)
- Has ground paint relationships via PaintGround
- Associated with formulas for production

### Paint Ground
- Links Paint to its ground/base paint
- Bidirectional relationship

### Paint Formula
- Belongs to one Paint
- Contains 1+ components
- Has density and price per liter for costing
- Can be used for paint production

### Paint Formula Component
- Links formula to inventory items with weight ratios
- Ratio calculated from weightInGrams

### Paint Production
- Tracks production batches
- Uses a formula to calculate composition

---

## Enum Values

### PAINT_FINISH (5 values)
SOLID | METALLIC | PEARL | MATTE | SATIN

### COLOR_PALETTE (14 values)
BLACK | GRAY | WHITE | SILVER | GOLDEN | YELLOW | ORANGE | BROWN | RED | PINK | PURPLE | BLUE | GREEN | BEIGE

### TRUCK_MANUFACTURER (6 values)
SCANIA | VOLVO | DAF | VOLKSWAGEN | IVECO | MERCEDES_BENZ

### PAINT_TYPE_ENUM (5 values)
POLYESTER | ACRYLIC | LACQUER | POLYURETHANE | EPOXY

---

## Key Relationships

```
Paint ←→ PaintType (required)
Paint ←→ PaintBrand (optional)
Paint ←→ Paint (via PaintGround - ground relationships)
Paint ←→ PaintFormula (one-to-many)
PaintFormula ←→ PaintFormulaComponent (one-to-many)
PaintFormulaComponent ←→ Item (inventory items in formula)
PaintFormula ←→ PaintProduction (one-to-many)
```

---

## Validation Rules at a Glance

**Paint:**
- name: required, min 1 char
- code: optional, max 20 chars, nullable
- hex: required, valid hex color
- finish: required enum
- paintTypeId: required UUID
- paintBrandId: optional UUID, nullable
- manufacturer: optional enum, nullable
- tags: string array, default []
- palette: optional enum
- paletteOrder: optional, int 1-14

**PaintFormula:**
- description: required, min 1 char
- paintId: required UUID
- density: required, positive decimal
- pricePerLiter: required, positive decimal
- components: at least 1 required

**PaintFormulaComponent:**
- itemId: required UUID
- formulaPaintId: required UUID
- ratio: positive decimal (percentage)

**PaintProduction:**
- formulaId: required UUID
- volumeLiters: required, positive decimal

---

## Implementation Priority

**High Priority (Core Functionality):**
1. Add Paint.code field
2. Add Paint.manufacturer field
3. Add PaintFormula.density field
4. Add PaintFormula.pricePerLiter field

**Medium Priority (Enhanced Features):**
1. Update form components to handle new fields
2. Update validation schemas
3. Update API mapping functions

**Low Priority (Polish):**
1. Add UI labels and descriptions
2. Update help text
3. Add examples in documentation

---

## Files to Modify

### Mobile App
1. `/Users/kennedycampos/Documents/repositories/mobile/src/types/paint.ts`
   - Add missing fields to Paint interface
   - Add missing fields to PaintFormula interface

2. `/Users/kennedycampos/Documents/repositories/mobile/src/schemas/paint.ts`
   - Update paintCreateSchema
   - Update paintUpdateSchema
   - Update paintFormulaCreateSchema
   - Update paintFormulaUpdateSchema

3. `/Users/kennedycampos/Documents/repositories/mobile/src/components/paint/form/paint-form.tsx`
   - Add code input field
   - Add manufacturer selector

4. `/Users/kennedycampos/Documents/repositories/mobile/src/components/painting/formula/paint-formula-detail.tsx`
   - Add density display
   - Add pricePerLiter display

5. `/Users/kennedycampos/Documents/repositories/mobile/src/api-client/paint.ts`
   - Update mapPaintToFormData to include new fields
   - Update mapPaintFormulaToFormData to include new fields

---

## Web App Reference Files

For implementation details, refer to:
- `/Users/kennedycampos/Documents/repositories/web/src/types/paint.ts`
- `/Users/kennedycampos/Documents/repositories/web/src/schemas/paint.ts`
- `/Users/kennedycampos/Documents/repositories/web/src/api-client/paint.ts`
- `/Users/kennedycampos/Documents/repositories/web/src/constants/enums.ts`

