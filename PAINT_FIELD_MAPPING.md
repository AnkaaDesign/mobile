# Paint-Related Fields Mapping: Web vs Mobile

This document provides a comprehensive mapping of all paint-related entities, their fields, data types, validation rules, relationships, and identifies what needs to be added to the mobile application to match the web application.

---

## 1. PAINT TYPE ENTITY

### Fields
| Field Name | Data Type | Required | Mobile | Validation Rules | Notes |
|---|---|---|---|---|---|
| id | string (UUID) | Yes | Yes | UUID format | Auto-generated |
| name | string | Yes | Yes | Min 1, Max 100 chars | Unique name |
| type | PAINT_TYPE_ENUM | Yes | Yes | POLYESTER, ACRYLIC, LACQUER, POLYURETHANE, EPOXY | Refers to paint base type |
| needGround | boolean | Yes | Yes | Default: false | Indicates if paint needs ground |
| createdAt | Date | Yes | Yes | ISO 8601 | Auto-generated |
| updatedAt | Date | Yes | Yes | ISO 8601 | Auto-updated |

### Related Fields (Relations)
| Relation | Type | Mobile Support |
|---|---|---|
| paints | Paint[] | Partial (via includes) |
| componentItems | Item[] | Partial (via includes) |
| _count | Count object | Yes |

### Create Schema Fields
```typescript
{
  name: string (required, min 1, max 100)
  needGround: boolean (optional, default false)
  componentItemIds?: string[] (optional, array of UUIDs)
}
```

### Update Schema Fields
```typescript
{
  name?: string (optional, min 1, max 100)
  needGround?: boolean (optional)
  componentItemIds?: string[] (optional)
}
```

### Validation Rules
- name: Required, non-empty, max 100 characters
- needGround: Boolean with default false
- componentItemIds: Array of valid UUIDs

---

## 2. PAINT BRAND ENTITY

### Fields
| Field Name | Data Type | Required | Mobile | Validation Rules | Notes |
|---|---|---|---|---|---|
| id | string (UUID) | Yes | Yes | UUID format | Auto-generated |
| name | string | Yes | Yes | Min 1, Max 100 chars | Brand name |
| createdAt | Date | Yes | Yes | ISO 8601 | Auto-generated |
| updatedAt | Date | Yes | Yes | ISO 8601 | Auto-updated |

### Related Fields (Relations)
| Relation | Type | Mobile Support |
|---|---|---|
| paints | Paint[] | Partial (via includes) |
| componentItems | Item[] | Partial (via includes) |
| _count | Count object | Yes |

### Create Schema Fields
```typescript
{
  name: string (required, min 1, max 100)
  componentItemIds?: string[] (optional)
}
```

### Update Schema Fields
```typescript
{
  name?: string (optional, min 1, max 100)
  componentItemIds?: string[] (optional)
}
```

### Validation Rules
- name: Required, non-empty, max 100 characters

---

## 3. PAINT ENTITY

### Fields
| Field Name | Data Type | Required | Mobile | Validation Rules | Notes |
|---|---|---|---|---|---|
| id | string (UUID) | Yes | Yes | UUID format | Auto-generated |
| name | string | Yes | Yes | Min 1 char | Paint name/description |
| code | string or null | No | **MISSING** | Max 20 chars, nullable | Internal code |
| hex | string | Yes | Yes | Valid hex color | HEX color format (#RRGGBB) |
| finish | PAINT_FINISH | Yes | Yes | SOLID, METALLIC, PEARL, MATTE, SATIN | Paint surface finish |
| manufacturer | TRUCK_MANUFACTURER or null | No | **MISSING** | SCANIA, VOLVO, DAF, VOLKSWAGEN, IVECO, MERCEDES_BENZ, nullable | Vehicle manufacturer |
| tags | string[] | Yes | Yes | Array of strings | Searchable tags |
| palette | COLOR_PALETTE | Yes | Yes | 14 color options | Color palette category |
| paletteOrder | number | Yes | Yes | Int min 1, max 14 | Display order within palette |
| paintTypeId | string (UUID) | Yes | Yes | UUID format, required | Foreign key to PaintType |
| paintBrandId | string (UUID) or null | No | Yes | UUID format, nullable | Foreign key to PaintBrand |
| createdAt | Date | Yes | Yes | ISO 8601 | Auto-generated |
| updatedAt | Date | Yes | Yes | ISO 8601 | Auto-updated |

### Related Fields (Relations)
| Relation | Type | Mobile Support |
|---|---|---|
| paintType | PaintType | Yes |
| paintBrand | PaintBrand | Yes |
| formulas | PaintFormula[] | Yes |
| generalPaintings | Task[] | Partial |
| logoTasks | Task[] | Partial |
| relatedPaints | Paint[] | Partial |
| relatedTo | Paint[] | Partial |
| paintGrounds | PaintGround[] | Yes |
| groundPaintFor | PaintGround[] | Yes |

### Create Schema Fields
```typescript
{
  name: string (required, min 1)
  code?: string or null (optional, min 1, max 20, nullable)
  hex: string (required, valid hex color)
  finish: PAINT_FINISH (required)
  paintTypeId: string (required, UUID)
  paintBrandId?: string or null (optional, UUID, nullable)
  manufacturer?: TRUCK_MANUFACTURER or null (optional, nullable)
  tags?: string[] (optional, default [])
  palette?: COLOR_PALETTE (optional)
  paletteOrder?: number (optional, int min 1, max 14)
  groundIds?: string[] (optional, array of UUIDs for PaintGround)
}
```

### Update Schema Fields
```typescript
{
  name?: string (optional, min 1)
  code?: string or null (optional, min 1, max 20, nullable)
  hex?: string (optional, valid hex color)
  finish?: PAINT_FINISH (optional)
  paintTypeId?: string (optional, UUID)
  paintBrandId?: string or null (optional, UUID, nullable)
  manufacturer?: TRUCK_MANUFACTURER or null (optional, nullable)
  tags?: string[] (optional, default [])
  palette?: COLOR_PALETTE (optional)
  paletteOrder?: number (optional, int min 1, max 14)
  groundIds?: string[] (optional)
}
```

### Validation Rules
- name: Required, non-empty
- code: Optional, max 20 characters, can be null
- hex: Required, valid hex color format
- finish: Required enum from PAINT_FINISH
- paintTypeId: Required UUID
- paintBrandId: Optional UUID, can be null
- manufacturer: Optional enum, can be null
- tags: Array of strings, default empty
- palette: Optional enum from COLOR_PALETTE
- paletteOrder: Optional integer, min 1, max 14
- groundIds: Optional array of UUIDs for ground paints

### Enums

#### PAINT_FINISH
- SOLID
- METALLIC
- PEARL
- MATTE
- SATIN

#### COLOR_PALETTE (14 options)
- BLACK
- GRAY
- WHITE
- SILVER
- GOLDEN
- YELLOW
- ORANGE
- BROWN
- RED
- PINK
- PURPLE
- BLUE
- GREEN
- BEIGE

#### TRUCK_MANUFACTURER (6 options)
- SCANIA
- VOLVO
- DAF
- VOLKSWAGEN
- IVECO
- MERCEDES_BENZ

---

## 4. PAINT GROUND ENTITY

### Fields
| Field Name | Data Type | Required | Mobile | Validation Rules | Notes |
|---|---|---|---|---|---|
| id | string (UUID) | Yes | Yes | UUID format | Auto-generated |
| paintId | string (UUID) | Yes | Yes | UUID format, required | Foreign key to Paint |
| groundPaintId | string (UUID) | Yes | Yes | UUID format, required | Foreign key to Paint (ground) |
| createdAt | Date | Yes | Yes | ISO 8601 | Auto-generated |
| updatedAt | Date | Yes | Yes | ISO 8601 | Auto-updated |

### Related Fields (Relations)
| Relation | Type | Mobile Support |
|---|---|---|
| paint | Paint | Yes |
| groundPaint | Paint | Yes |

### Create Schema Fields
```typescript
{
  paintId: string (required, UUID)
  groundPaintId: string (required, UUID)
}
```

### Update Schema Fields
```typescript
{
  paintId?: string (optional, UUID)
  groundPaintId?: string (optional, UUID)
}
```

### Validation Rules
- paintId: Required UUID, must reference valid Paint
- groundPaintId: Required UUID, must reference valid Paint (used as ground)

---

## 5. PAINT FORMULA ENTITY

### Fields
| Field Name | Data Type | Required | Mobile | Validation Rules | Notes |
|---|---|---|---|---|---|
| id | string (UUID) | Yes | Yes | UUID format | Auto-generated |
| description | string | Yes | Yes | Min 1 char | Formula name/description |
| paintId | string (UUID) | Yes | Yes | UUID format, required | Foreign key to Paint |
| density | number | Yes | **MISSING** | Decimal number | Paint density value |
| pricePerLiter | number | Yes | **MISSING** | Decimal number | Cost per liter |
| createdAt | Date | Yes | Yes | ISO 8601 | Auto-generated |
| updatedAt | Date | Yes | Yes | ISO 8601 | Auto-updated |

### Related Fields (Relations)
| Relation | Type | Mobile Support |
|---|---|---|
| components | PaintFormulaComponent[] | Yes |
| paint | Paint | Yes |
| paintProduction | PaintProduction[] | Yes |

### Create Schema Fields
```typescript
{
  description: string (required, min 1)
  paintId: string (required, UUID)
  components: Array<{
    weightInGrams: number (required, positive, min 0.1)
    itemId: string (required, UUID)
    rawInput?: string (optional, internal use)
  }> (required, min 1 component)
}
```

### Update Schema Fields
```typescript
{
  description?: string (optional, min 1)
  paintId?: string (optional, UUID)
  // Note: Components are managed separately
}
```

### Validation Rules
- description: Required, non-empty
- paintId: Required UUID
- components: At least one component required
- weightInGrams: Positive number, min 0.1g
- itemId: Valid UUID

---

## 6. PAINT FORMULA COMPONENT ENTITY

### Fields
| Field Name | Data Type | Required | Mobile | Validation Rules | Notes |
|---|---|---|---|---|---|
| id | string (UUID) | Yes | Yes | UUID format | Auto-generated |
| ratio | number | Yes | Yes | Decimal percentage | Component percentage in formula |
| itemId | string (UUID) | Yes | Yes | UUID format, required | Foreign key to Item |
| formulaPaintId | string (UUID) | Yes | Yes | UUID format, required | Foreign key to PaintFormula |
| createdAt | Date | Yes | Yes | ISO 8601 | Auto-generated |
| updatedAt | Date | Yes | Yes | ISO 8601 | Auto-updated |

### Related Fields (Relations)
| Relation | Type | Mobile Support |
|---|---|---|
| item | Item | Yes |
| formula | PaintFormula | Yes |

### Create Schema Fields
```typescript
{
  ratio: number (required, calculated from weightInGrams)
  itemId: string (required, UUID)
  formulaPaintId: string (required, UUID)
}
```

### Update Schema Fields
```typescript
{
  ratio?: number (optional)
  itemId?: string (optional, UUID)
  formulaPaintId?: string (optional, UUID)
}
```

### Validation Rules
- ratio: Positive decimal, calculated from weight
- itemId: Required UUID
- formulaPaintId: Required UUID

---

## 7. PAINT PRODUCTION ENTITY

### Fields
| Field Name | Data Type | Required | Mobile | Validation Rules | Notes |
|---|---|---|---|---|---|
| id | string (UUID) | Yes | Yes | UUID format | Auto-generated |
| volumeLiters | number | Yes | Yes | Decimal number | Volume produced in liters |
| formulaId | string (UUID) | Yes | Yes | UUID format, required | Foreign key to PaintFormula |
| createdAt | Date | Yes | Yes | ISO 8601 | Auto-generated |
| updatedAt | Date | Yes | Yes | ISO 8601 | Auto-updated |

### Related Fields (Relations)
| Relation | Type | Mobile Support |
|---|---|---|
| formula | PaintFormula | Yes |

### Create Schema Fields
```typescript
{
  volumeLiters: number (required, positive)
  formulaId: string (required, UUID)
}
```

### Update Schema Fields
```typescript
{
  volumeLiters?: number (optional, positive)
  formulaId?: string (optional, UUID)
}
```

### Validation Rules
- volumeLiters: Required, positive decimal number
- formulaId: Required UUID

---

## 8. ENUMS AND CONSTANTS

### PAINT_TYPE_ENUM
```typescript
enum PAINT_TYPE_ENUM {
  POLYESTER = "POLYESTER",
  ACRYLIC = "ACRYLIC",
  LACQUER = "LACQUER",
  POLYURETHANE = "POLYURETHANE",
  EPOXY = "EPOXY",
}
```

### PAINT_FINISH
```typescript
enum PAINT_FINISH {
  SOLID = "SOLID",
  METALLIC = "METALLIC",
  PEARL = "PEARL",
  MATTE = "MATTE",
  SATIN = "SATIN",
}
```

### COLOR_PALETTE (14 options)
```typescript
enum COLOR_PALETTE {
  BLACK = "BLACK",
  GRAY = "GRAY",
  WHITE = "WHITE",
  SILVER = "SILVER",
  GOLDEN = "GOLDEN",
  YELLOW = "YELLOW",
  ORANGE = "ORANGE",
  BROWN = "BROWN",
  RED = "RED",
  PINK = "PINK",
  PURPLE = "PURPLE",
  BLUE = "BLUE",
  GREEN = "GREEN",
  BEIGE = "BEIGE",
}
```

### TRUCK_MANUFACTURER
```typescript
enum TRUCK_MANUFACTURER {
  SCANIA = "SCANIA",
  VOLVO = "VOLVO",
  DAF = "DAF",
  VOLKSWAGEN = "VOLKSWAGEN",
  IVECO = "IVECO",
  MERCEDES_BENZ = "MERCEDES_BENZ",
}
```

---

## 9. RELATIONSHIP DIAGRAM

```
PaintType
  ├─ paints: Paint[]
  └─ componentItems: Item[]

PaintBrand
  ├─ paints: Paint[]
  └─ componentItems: Item[]

Paint
  ├─ paintType: PaintType
  ├─ paintBrand: PaintBrand (optional)
  ├─ formulas: PaintFormula[]
  ├─ generalPaintings: Task[]
  ├─ logoTasks: Task[]
  ├─ relatedPaints: Paint[]
  ├─ relatedTo: Paint[]
  ├─ paintGrounds: PaintGround[]
  └─ groundPaintFor: PaintGround[]

PaintGround
  ├─ paint: Paint
  └─ groundPaint: Paint

PaintFormula
  ├─ paint: Paint
  ├─ components: PaintFormulaComponent[]
  └─ paintProduction: PaintProduction[]

PaintFormulaComponent
  ├─ formula: PaintFormula
  └─ item: Item

PaintProduction
  └─ formula: PaintFormula
```

---

## 10. MISSING FIELDS IN MOBILE APPLICATION

Based on the comparison between web and mobile applications, the following fields are **MISSING** in the mobile application:

### PAINT Entity
- [x] **code** - string (optional, max 20 chars, nullable)
- [x] **manufacturer** - TRUCK_MANUFACTURER (optional, nullable)
- [ ] **density** - number (should be in PaintFormula)
- [ ] **pricePerLiter** - number (should be in PaintFormula)

### PAINT FORMULA Entity
- [x] **density** - number (required in web, missing in mobile type definition)
- [x] **pricePerLiter** - number (required in web, missing in mobile type definition)

### Key Observations

1. **Paint.code**: Mobile types currently do NOT include the `code` field, but it's in the schema
2. **Paint.manufacturer**: Mobile types currently do NOT include the `manufacturer` field, but it's in the schema
3. **PaintFormula.density**: Mobile types currently do NOT include the `density` field
4. **PaintFormula.pricePerLiter**: Mobile types currently do NOT include the `pricePerLiter` field

---

## 11. IMPLEMENTATION CHECKLIST FOR MOBILE

### Type Definitions (src/types/paint.ts)
- [ ] Add `code?: string | null` to Paint interface
- [ ] Add `manufacturer?: TRUCK_MANUFACTURER | null` to Paint interface
- [ ] Add `density: number` to PaintFormula interface
- [ ] Add `pricePerLiter: number` to PaintFormula interface

### Validation Schemas (src/schemas/paint.ts)
- [ ] Update paintCreateSchema to include code and manufacturer fields
- [ ] Update paintUpdateSchema to include code and manufacturer fields
- [ ] Update paintFormulaCreateSchema to include density and pricePerLiter
- [ ] Update paintFormulaUpdateSchema to include density and pricePerLiter

### API Client (src/api-client/paint.ts)
- [ ] Update form data mapping to include new fields
- [ ] Update API calls to handle new fields

### Components
- [ ] Update paint forms to include code input field
- [ ] Update paint forms to include manufacturer selector
- [ ] Update formula forms to include density input
- [ ] Update formula forms to include pricePerLiter input

### Constants
- [ ] Verify PAINT_FINISH, COLOR_PALETTE, TRUCK_MANUFACTURER enums are complete
- [ ] Add PAINT_TYPE_ENUM support if not present

---

## 12. VALIDATION RULES SUMMARY

### Text Fields
- name: min 1, max 100 characters
- code: optional, min 1, max 20 characters
- description: min 1 character

### Numeric Fields
- density: decimal number, positive
- pricePerLiter: decimal number, positive
- volumeLiters: positive number
- ratio: percentage (0-100)
- paletteOrder: integer, min 1, max 14
- weightInGrams: positive, min 0.1

### UUID Fields
- All ID references must be valid UUIDs
- Foreign keys must reference existing records

### Enum Fields
- finish: Must be one of PAINT_FINISH values
- palette: Must be one of COLOR_PALETTE values
- manufacturer: Must be one of TRUCK_MANUFACTURER values or null
- type (PaintType): Must be one of PAINT_TYPE_ENUM values

---

## 13. ORDER BY FIELDS

Available ordering fields for each entity:

### PaintType
- id, name, createdAt, updatedAt

### PaintBrand
- id, name, createdAt, updatedAt

### Paint
- id, name, hex, finish, manufacturer, palette, paletteOrder, paintTypeId, paintBrandId, createdAt, updatedAt
- Plus relational ordering: paintType.*, paintBrand.*

### PaintFormula
- id, description, density, pricePerLiter, createdAt, updatedAt
- Plus relational ordering: paint.*

### PaintFormulaComponent
- id, ratio, createdAt, updatedAt
- Plus relational ordering: item.*, formula.*

### PaintProduction
- id, volumeLiters, createdAt, updatedAt
- Plus relational ordering: formula.*

---

## 14. FILTERING CAPABILITIES

### Paint Filtering
- By paintTypeId
- By paintBrandId
- By name (contains, startsWith, endsWith)
- By hex (contains, startsWith, endsWith)
- By finish (exact match, in array)
- By manufacturer (exact match, in array)
- By palette (exact match, in array)
- By paletteOrder (range operators)
- By tags (has, hasEvery, hasSome)
- By createdAt/updatedAt (date range operators)

### PaintFormula Filtering
- By paintId
- By description (contains, startsWith, endsWith)
- By density (range operators)
- By pricePerLiter (range operators)
- By createdAt/updatedAt (date range operators)

---

## 15. BATCH OPERATIONS SUPPORT

All paint entities support batch operations:

### Supported Operations
- **Create**: Multiple records in one request
- **Update**: Multiple records with changes in one request
- **Delete**: Multiple records by ID in one request

### Schema Examples

#### Batch Create
```typescript
{
  paints: PaintCreateFormData[]
}
```

#### Batch Update
```typescript
{
  paints: Array<{
    id: string (UUID)
    data: PaintUpdateFormData
  }>
}
```

#### Batch Delete
```typescript
{
  paintIds: string[] (array of UUIDs)
}
```

---

## Summary

The mobile application has the core paint entity structure in place but is missing several important fields:

**Critical Missing Fields:**
1. Paint.code
2. Paint.manufacturer
3. PaintFormula.density
4. PaintFormula.pricePerLiter

These fields should be added to ensure full feature parity with the web application and proper formula costing/tracking functionality.

