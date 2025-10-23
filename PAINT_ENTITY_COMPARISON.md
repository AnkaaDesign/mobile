# Paint Entities: Detailed Web vs Mobile Comparison

## Entity: Paint Type

### Web Implementation
```typescript
interface PaintType extends BaseEntity {
  name: string;
  type: PAINT_TYPE_ENUM;
  needGround: boolean;
  paints?: Paint[];
  componentItems?: Item[];
  _count?: {
    paints?: number;
    componentItems?: number;
  };
}
```

### Mobile Implementation
```typescript
interface PaintType extends BaseEntity {
  name: string;
  type: PAINT_TYPE_ENUM;
  needGround: boolean;
  paints?: Paint[];
  componentItems?: Item[];
  _count?: {
    paints?: number;
    componentItems?: number;
  };
}
```

**Status:** MATCHES ✓

---

## Entity: Paint Brand

### Web Implementation
```typescript
interface PaintBrand extends BaseEntity {
  name: string;
  paints?: Paint[];
  componentItems?: Item[];
  _count?: {
    paints?: number;
    componentItems?: number;
  };
}
```

### Mobile Implementation
```typescript
interface PaintBrand extends BaseEntity {
  name: string;
  paints?: Paint[];
  componentItems?: Item[];
  _count?: {
    paints?: number;
    componentItems?: number;
  };
}
```

**Status:** MATCHES ✓

---

## Entity: Paint

### Web Implementation
```typescript
interface Paint extends BaseEntity {
  name: string;
  code: string | null;                    // ← Present in web
  hex: string;
  finish: PAINT_FINISH;
  manufacturer: TRUCK_MANUFACTURER | null; // ← Present in web
  tags: string[];
  palette: COLOR_PALETTE;
  paletteOrder: number;
  paintTypeId: string;
  paintBrandId: string | null;
  paintType?: PaintType;
  paintBrand?: PaintBrand;
  formulas?: PaintFormula[];
  generalPaintings?: Task[];
  logoTasks?: Task[];
  relatedPaints?: Paint[];
  relatedTo?: Paint[];
  paintGrounds?: PaintGround[];
  groundPaintFor?: PaintGround[];
}
```

### Mobile Implementation
```typescript
interface Paint extends BaseEntity {
  name: string;
  code: string | null;                    // MISSING FROM INTERFACE!
  hex: string;
  finish: PAINT_FINISH;
  manufacturer: TRUCK_MANUFACTURER | null; // MISSING FROM INTERFACE!
  tags: string[];
  palette: COLOR_PALETTE;
  paletteOrder: number;
  paintTypeId: string;
  paintBrandId: string | null;
  paintType?: PaintType;
  paintBrand?: PaintBrand;
  formulas?: PaintFormula[];
  generalPaintings?: Task[];
  logoTasks?: Task[];
  relatedPaints?: Paint[];
  relatedTo?: Paint[];
  paintGrounds?: PaintGround[];
  groundPaintFor?: PaintGround[];
}
```

**Status:** MISSING 2 FIELDS ✗
- code
- manufacturer

**Schema Status:** INCLUDES ✓
- The schema includes these fields in create/update schemas

---

## Entity: Paint Ground

### Web Implementation
```typescript
interface PaintGround extends BaseEntity {
  paintId: string;
  groundPaintId: string;
  paint?: Paint;
  groundPaint?: Paint;
}
```

### Mobile Implementation
```typescript
interface PaintGround extends BaseEntity {
  paintId: string;
  groundPaintId: string;
  paint?: Paint;
  groundPaint?: Paint;
}
```

**Status:** MATCHES ✓

---

## Entity: Paint Formula

### Web Implementation
```typescript
interface PaintFormula extends BaseEntity {
  description: string;
  paintId: string;
  density: number;                 // ← Present in web
  pricePerLiter: number;           // ← Present in web
  components?: PaintFormulaComponent[];
  paint?: Paint;
  paintProduction?: PaintProduction[];
}
```

### Mobile Implementation
```typescript
interface PaintFormula extends BaseEntity {
  description: string;
  paintId: string;
  density: number;                 // MISSING FROM INTERFACE!
  pricePerLiter: number;           // MISSING FROM INTERFACE!
  components?: PaintFormulaComponent[];
  paint?: Paint;
  paintProduction?: PaintProduction[];
}
```

**Status:** MISSING 2 FIELDS ✗
- density
- pricePerLiter

**Notes:**
- These fields are critical for formula costing and density calculations
- Web has full validation for these numeric fields
- Mobile mapPaintFormulaToFormData currently includes these fields but type is incomplete

---

## Entity: Paint Formula Component

### Web Implementation
```typescript
interface PaintFormulaComponent extends BaseEntity {
  ratio: number;
  itemId: string;
  formulaPaintId: string;
  item?: Item;
  formula?: PaintFormula;
}
```

### Mobile Implementation
```typescript
interface PaintFormulaComponent extends BaseEntity {
  ratio: number;
  itemId: string;
  formulaPaintId: string;
  item?: Item;
  formula?: PaintFormula;
}
```

**Status:** MATCHES ✓

---

## Entity: Paint Production

### Web Implementation
```typescript
interface PaintProduction extends BaseEntity {
  volumeLiters: number;
  formulaId: string;
  formula?: PaintFormula;
}
```

### Mobile Implementation
```typescript
interface PaintProduction extends BaseEntity {
  volumeLiters: number;
  formulaId: string;
  formula?: PaintFormula;
}
```

**Status:** MATCHES ✓

---

## Schema Validation Comparison

### Paint Create Schema

**Web:**
```typescript
{
  name: z.string().min(1, "Nome é obrigatório"),
  code: z.string().min(1).max(20).nullable().optional(),
  hex: hexColorSchema,
  finish: z.enum(...PAINT_FINISH),
  paintTypeId: z.string().uuid("Tipo de tinta inválido"),
  paintBrandId: z.string().uuid().nullable().optional(),
  manufacturer: z.enum(...TRUCK_MANUFACTURER).nullable().optional(),
  tags: z.array(z.string()).default([]),
  palette: z.enum(...COLOR_PALETTE).optional(),
  paletteOrder: z.number().int().min(1).max(14).optional(),
  groundIds: z.array(z.string().uuid()).optional(),
}
```

**Mobile:**
```typescript
{
  name: z.string().min(1, "Nome é obrigatório"),
  code: z.string().min(1).max(20).nullable().optional(),
  hex: hexColorSchema,
  finish: z.enum(...PAINT_FINISH),
  paintTypeId: z.string().uuid("Tipo de tinta inválido"),
  paintBrandId: z.string().uuid().nullable().optional(),
  manufacturer: z.enum(...TRUCK_MANUFACTURER).nullable().optional(),
  tags: z.array(z.string()).default([]),
  palette: z.enum(...COLOR_PALETTE).optional(),
  paletteOrder: z.number().int().min(1).max(14).optional(),
  groundIds: z.array(z.string().uuid()).optional(),
}
```

**Status:** MATCHES ✓

---

### Paint Formula Create Schema

**Web:**
```typescript
{
  description: z.string().min(1, "Descrição é obrigatória"),
  paintId: z.string().uuid("Tinta inválida"),
  components: z.array(
    z.object({
      weightInGrams: z.number().positive().min(0.1),
      itemId: z.string().uuid("Item inválido"),
      rawInput: z.string().optional(),
    }),
  ).min(1, "Fórmula deve ter pelo menos um componente"),
}
```

**Mobile:**
```typescript
{
  description: z.string().min(1, "Descrição é obrigatória"),
  paintId: z.string().uuid("Tinta inválida"),
  components: z.array(
    z.object({
      weightInGrams: z.number().positive().min(0.1),
      itemId: z.string().uuid("Item inválido"),
      rawInput: z.string().optional(),
    }),
  ).min(1, "Fórmula deve ter pelo menos um componente"),
}
```

**Note:** Neither schema includes density or pricePerLiter in create - these appear to be handled separately or updated after creation.

**Status:** MATCHES ✓

---

## API Form Data Mapping

### Paint Form Data - mapPaintToFormData

**Web:**
```typescript
export const mapPaintToFormData = createMapToFormDataHelper<Paint, PaintUpdateFormData>(
  (paint) => ({
    name: paint.name,
    hex: paint.hex,
    finish: paint.finish,
    paintBrandId: paint.paintBrandId,
    manufacturer: paint.manufacturer,
    tags: paint.tags,
    palette: paint.palette,
    paletteOrder: paint.paletteOrder,
    paintTypeId: paint.paintTypeId,
    groundIds: paint.paintGrounds?.map((pg) => pg.groundPaintId) || [],
  }),
);
```

**Mobile:**
```typescript
export const mapPaintToFormData = createMapToFormDataHelper<Paint, PaintUpdateFormData>(
  (paint) => ({
    name: paint.name,
    hex: paint.hex,
    finish: paint.finish,
    paintBrandId: paint.paintBrandId,
    manufacturer: paint.manufacturer,
    tags: paint.tags,
    palette: paint.palette,
    paletteOrder: paint.paletteOrder,
    paintTypeId: paint.paintTypeId,
    groundIds: paint.paintGrounds?.map((pg) => pg.groundPaintId) || [],
  }),
);
```

**Status:** MATCHES ✓

**Issue:** Mapping expects manufacturer field from Paint object, but type definition is missing it

---

### Paint Formula Form Data - mapPaintFormulaToFormData

**Web:**
```typescript
export const mapPaintFormulaToFormData = createMapToFormDataHelper<
  PaintFormula,
  PaintFormulaUpdateFormData
>((formula) => ({
  description: formula.description,
  paintId: formula.paintId,
  density: formula.density,
  pricePerLiter: formula.pricePerLiter,
}));
```

**Mobile:**
```typescript
export const mapPaintFormulaToFormData = createMapToFormDataHelper<
  PaintFormula,
  PaintFormulaUpdateFormData
>((formula) => ({
  description: formula.description,
  paintId: formula.paintId,
  density: formula.density,
  pricePerLiter: formula.pricePerLiter,
}));
```

**Status:** MATCHES ✓

**Issue:** Mapping includes density and pricePerLiter, but type definition is missing these fields

---

## Summary Table

| Entity | Field | Web | Mobile (Type) | Mobile (Schema) | Status |
|--------|-------|-----|---------------|-----------------|--------|
| Paint | code | ✓ | ✗ | ✓ | MISSING TYPE |
| Paint | manufacturer | ✓ | ✗ | ✓ | MISSING TYPE |
| PaintFormula | density | ✓ | ✗ | - | MISSING TYPE |
| PaintFormula | pricePerLiter | ✓ | ✗ | - | MISSING TYPE |

**Type Definition Status:** 4 fields missing from TypeScript interfaces
**Schema Status:** Schemas are correct
**API Mapping Status:** Mappings reference missing type fields

---

## Impact Analysis

### High Risk (Type Safety Issue)
- Paint.code mapping will cause TypeScript error
- Paint.manufacturer mapping will cause TypeScript error
- PaintFormula.density mapping will cause TypeScript error
- PaintFormula.pricePerLiter mapping will cause TypeScript error

### Runtime Impact
- Code may work if suppressed with `as any`, but loses type safety
- Existing code likely works but with TypeScript errors

### User Features Affected
- Paint code field not visible/editable on mobile
- Manufacturer field not visible/editable on mobile
- Formula density and pricing not visible/editable on mobile
- Cannot properly track formula costs and composition

---

## Recommended Fix Order

1. **Immediate (Type Safety):**
   - Add `code` to Paint interface
   - Add `manufacturer` to Paint interface
   - Add `density` to PaintFormula interface
   - Add `pricePerLiter` to PaintFormula interface

2. **Secondary (UI Implementation):**
   - Update paint forms to display/edit code
   - Update paint forms to display/edit manufacturer
   - Update formula components to display/edit density
   - Update formula components to display/edit pricePerLiter

3. **Tertiary (Validation):**
   - Ensure schemas validate correctly
   - Add proper error messages
   - Add min/max constraints for numeric fields

