// packages/interfaces/src/paint.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse, BaseMergeResponse } from "./common";
import type { PAINT_FINISH, ORDER_BY_DIRECTION, TRUCK_MANUFACTURER, PAINT_TYPE_ENUM } from '@/constants';
import type { Item, ItemIncludes, ItemOrderBy } from "./item";
import type { Task, TaskIncludes } from "./task";
import type { PaintBrand, PaintBrandIncludes, PaintBrandOrderBy, PaintBrandWhere } from "./paint-brand";

// =====================
// Main Entity Interfaces
// =====================

export interface PaintType extends BaseEntity {
  name: string;
  type: PAINT_TYPE_ENUM;
  needGround: boolean;

  // Relations (optional, populated based on query)
  paints?: Paint[];
  componentItems?: Item[];

  // Count fields (optional, populated when using _count in include)
  _count?: {
    paints?: number;
    componentItems?: number;
  };
}

export interface Paint extends BaseEntity {
  name: string;
  code: string | null;
  hex: string;
  finish: PAINT_FINISH;
  manufacturer: TRUCK_MANUFACTURER | null;
  tags: string[];
  colorOrder: number;
  paintTypeId: string;
  paintBrandId: string | null;
  colorPreview: string | null; // Paint preview image URL (WebP)

  // Relations (optional, populated based on query)
  paintType?: PaintType;
  paintBrand?: PaintBrand;
  formulas?: PaintFormula[];
  generalPaintings?: Task[];
  logoTasks?: Task[];
  relatedPaints?: Paint[];
  relatedTo?: Paint[];
  paintGrounds?: PaintGround[];
  groundPaintFor?: PaintGround[];

  // Count fields (when included)
  // Fixed: Added missing _count property to match API type definition
  _count?: {
    formulas?: number;
    paintProduction?: number;
    generalPaintings?: number;
    logoTasks?: number;
    relatedPaints?: number;
    relatedTo?: number;
    paintGrounds?: number;
    groundPaintFor?: number;
  };
}

export interface PaintGround extends BaseEntity {
  paintId: string;
  groundPaintId: string;

  // Relations (optional, populated based on query)
  paint?: Paint;
  groundPaint?: Paint;
}

export interface PaintFormula extends BaseEntity {
  description: string;
  paintId: string;
  density: number;
  pricePerLiter: number;

  // Relations (optional, populated based on query)
  components?: PaintFormulaComponent[];
  paint?: Paint;
  paintProduction?: PaintProduction[];

  // Count fields (optional, populated when using _count in include)
  _count?: {
    components?: number;
    paintProduction?: number;
  };
}

export interface PaintFormulaComponent extends BaseEntity {
  ratio: number; // Percentage of this component in the formula (calculated from weightInGrams)
  weight?: number; // Weight in grams used during formulation
  weightInGrams?: number; // Weight in grams (alias for weight, used in form schemas)
  itemId: string;
  formulaPaintId: string;

  // Relations (optional, populated based on query)
  item?: Item;
  formula?: PaintFormula;
}

export interface PaintProduction extends BaseEntity {
  volumeLiters: number;
  formulaId: string;

  // Relations (optional, populated based on query)
  formula?: PaintFormula;
}

export interface TaskPaint extends BaseEntity {
  taskId: string;
  catalogPaintId: string | null;
  color: string | null;
  quantity: number | null;
  measureUnit: string | null;
  observations: string | null;

  // Relations (optional, populated based on query)
  task?: Task;
  catalogPaint?: Paint;
}

// =====================
// Include Types
// =====================

export interface PaintTypeIncludes {
  paints?:
    | boolean
    | {
        include?: PaintIncludes;
      };
  componentItems?:
    | boolean
    | {
        include?: ItemIncludes;
      };
}

export interface PaintIncludes {
  paintType?:
    | boolean
    | {
        include?: PaintTypeIncludes;
      };
  paintBrand?:
    | boolean
    | {
        include?: PaintBrandIncludes;
      };
  formulas?:
    | boolean
    | {
        include?: PaintFormulaIncludes;
      };
  generalPaintings?:
    | boolean
    | {
        include?: TaskIncludes;
      };
  logoTasks?:
    | boolean
    | {
        include?: TaskIncludes;
      };
  paintProduction?:
    | boolean
    | {
        include?: PaintProductionIncludes;
      };
  relatedPaints?:
    | boolean
    | {
        include?: PaintIncludes;
      };
  relatedTo?:
    | boolean
    | {
        include?: PaintIncludes;
      };
  paintGrounds?:
    | boolean
    | {
        include?: PaintGroundIncludes;
      };
  groundPaintFor?:
    | boolean
    | {
        include?: PaintGroundIncludes;
      };
}

export interface PaintFormulaIncludes {
  components?:
    | boolean
    | {
        include?: PaintFormulaComponentIncludes;
      };
  paint?:
    | boolean
    | {
        include?: PaintIncludes;
      };
  paintProduction?:
    | boolean
    | {
        include?: PaintProductionIncludes;
      };
}

export interface PaintFormulaComponentIncludes {
  item?:
    | boolean
    | {
        include?: ItemIncludes;
      };
  formula?:
    | boolean
    | {
        include?: PaintFormulaIncludes;
      };
}

export interface PaintProductionIncludes {
  formula?:
    | boolean
    | {
        include?: PaintFormulaIncludes;
      };
}

export interface PaintGroundIncludes {
  paint?:
    | boolean
    | {
        include?: PaintIncludes;
      };
  groundPaint?:
    | boolean
    | {
        include?: PaintIncludes;
      };
}

export interface TaskPaintIncludes {
  task?:
    | boolean
    | {
        include?: TaskIncludes;
      };
  catalogPaint?:
    | boolean
    | {
        include?: PaintIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface PaintTypeOrderBy {
  id?: ORDER_BY_DIRECTION;
  name?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
}

export interface PaintOrderBy {
  id?: ORDER_BY_DIRECTION;
  name?: ORDER_BY_DIRECTION;
  hex?: ORDER_BY_DIRECTION;
  finish?: ORDER_BY_DIRECTION;
  manufacturer?: ORDER_BY_DIRECTION;
  colorOrder?: ORDER_BY_DIRECTION;
  paintTypeId?: ORDER_BY_DIRECTION;
  paintBrandId?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  paintType?: PaintTypeOrderBy;
  paintBrand?: PaintBrandOrderBy;
}

export interface PaintFormulaOrderBy {
  id?: ORDER_BY_DIRECTION;
  description?: ORDER_BY_DIRECTION;
  density?: ORDER_BY_DIRECTION;
  pricePerLiter?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  paint?: PaintOrderBy;
}

export interface PaintFormulaComponentOrderBy {
  id?: ORDER_BY_DIRECTION;
  ratio?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  item?: ItemOrderBy;
  formula?: PaintFormulaOrderBy;
}

export interface PaintProductionOrderBy {
  id?: ORDER_BY_DIRECTION;
  volumeLiters?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  formula?: PaintFormulaOrderBy;
}

export interface PaintGroundOrderBy {
  id?: ORDER_BY_DIRECTION;
  paintId?: ORDER_BY_DIRECTION;
  groundPaintId?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  paint?: PaintOrderBy;
  groundPaint?: PaintOrderBy;
}

export interface TaskPaintOrderBy {
  id?: ORDER_BY_DIRECTION;
  taskId?: ORDER_BY_DIRECTION;
  catalogPaintId?: ORDER_BY_DIRECTION;
  color?: ORDER_BY_DIRECTION;
  quantity?: ORDER_BY_DIRECTION;
  measureUnit?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
}

// =====================
// Where Clause Types
// =====================

export interface PaintTypeWhere {
  // Logical operators
  AND?: PaintTypeWhere | PaintTypeWhere[];
  OR?: PaintTypeWhere[];
  NOT?: PaintTypeWhere | PaintTypeWhere[];

  // ID fields
  id?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };

  // String fields
  name?: string | { equals?: string; not?: string; contains?: string; startsWith?: string; endsWith?: string; mode?: "default" | "insensitive"; in?: string[]; notIn?: string[] };

  // Type fields
  type?: PAINT_TYPE_ENUM | { equals?: PAINT_TYPE_ENUM; not?: PAINT_TYPE_ENUM; in?: PAINT_TYPE_ENUM[]; notIn?: PAINT_TYPE_ENUM[] };

  // Boolean fields
  needGround?: boolean | { equals?: boolean; not?: boolean };

  // Date fields
  createdAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };
  updatedAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };

  // Relations
  paints?: any; // Paint where conditions when filtering by related paints
  componentItems?: any; // Item where conditions when filtering by component items
}

export interface PaintWhere {
  // Logical operators
  AND?: PaintWhere | PaintWhere[];
  OR?: PaintWhere[];
  NOT?: PaintWhere | PaintWhere[];

  // ID fields
  id?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  paintTypeId?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  paintBrandId?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] } | null;

  // String fields
  name?: string | { equals?: string; not?: string; contains?: string; startsWith?: string; endsWith?: string; mode?: "default" | "insensitive"; in?: string[]; notIn?: string[] };
  hex?: string | { equals?: string; not?: string; contains?: string; startsWith?: string; endsWith?: string; mode?: "default" | "insensitive"; in?: string[]; notIn?: string[] };

  // Enum fields
  finish?: PAINT_FINISH | { equals?: PAINT_FINISH; not?: PAINT_FINISH; in?: PAINT_FINISH[]; notIn?: PAINT_FINISH[] };
  manufacturer?: TRUCK_MANUFACTURER | { equals?: TRUCK_MANUFACTURER; not?: TRUCK_MANUFACTURER; in?: TRUCK_MANUFACTURER[]; notIn?: TRUCK_MANUFACTURER[] } | null;

  // Number fields
  colorOrder?: number | { equals?: number; not?: number; lt?: number; lte?: number; gt?: number; gte?: number; in?: number[]; notIn?: number[] };

  // Array fields
  tags?: string[] | { has?: string; hasEvery?: string[]; hasSome?: string[]; isEmpty?: boolean };

  // Date fields
  createdAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };
  updatedAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };

  // Relations
  paintType?: PaintTypeWhere;
  paintBrand?: PaintBrandWhere | null;
  formulas?: any; // PaintFormula where conditions
  generalPaintings?: any; // Task where conditions
  logoTasks?: any; // Task where conditions
  relatedPaints?: PaintWhere;
  relatedTo?: PaintWhere;
  paintGrounds?: any; // PaintGround where conditions
  groundPaintFor?: any; // PaintGround where conditions
}

export interface PaintFormulaWhere {
  // Logical operators
  AND?: PaintFormulaWhere | PaintFormulaWhere[];
  OR?: PaintFormulaWhere[];
  NOT?: PaintFormulaWhere | PaintFormulaWhere[];

  // ID fields
  id?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  paintId?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };

  // String fields
  description?:
    | string
    | { equals?: string; not?: string; contains?: string; startsWith?: string; endsWith?: string; mode?: "default" | "insensitive"; in?: string[]; notIn?: string[] };

  // Number fields
  density?: number | { equals?: number; not?: number; lt?: number; lte?: number; gt?: number; gte?: number; in?: number[]; notIn?: number[] };
  pricePerLiter?: number | { equals?: number; not?: number; lt?: number; lte?: number; gt?: number; gte?: number; in?: number[]; notIn?: number[] };

  // Date fields
  createdAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };
  updatedAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };

  // Relations
  components?: any; // PaintFormulaComponent where conditions
  paint?: PaintWhere;
  paintProduction?: any; // PaintProduction where conditions
}

export interface PaintFormulaComponentWhere {
  // Logical operators
  AND?: PaintFormulaComponentWhere | PaintFormulaComponentWhere[];
  OR?: PaintFormulaComponentWhere[];
  NOT?: PaintFormulaComponentWhere | PaintFormulaComponentWhere[];

  // ID fields
  id?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  itemId?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  formulaPaintId?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };

  // Number fields
  ratio?: number | { equals?: number; not?: number; lt?: number; lte?: number; gt?: number; gte?: number; in?: number[]; notIn?: number[] };

  // Date fields
  createdAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };
  updatedAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };

  // Relations
  item?: any; // Item where conditions
  formula?: PaintFormulaWhere;
}

export interface PaintProductionWhere {
  // Logical operators
  AND?: PaintProductionWhere | PaintProductionWhere[];
  OR?: PaintProductionWhere[];
  NOT?: PaintProductionWhere | PaintProductionWhere[];

  // ID fields
  id?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  formulaId?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };

  // Number fields
  volumeLiters?: number | { equals?: number; not?: number; lt?: number; lte?: number; gt?: number; gte?: number; in?: number[]; notIn?: number[] };

  // Date fields
  createdAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };
  updatedAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };

  // Relations
  formula?: PaintFormulaWhere;
}

export interface PaintGroundWhere {
  // Logical operators
  AND?: PaintGroundWhere | PaintGroundWhere[];
  OR?: PaintGroundWhere[];
  NOT?: PaintGroundWhere | PaintGroundWhere[];

  // ID fields
  id?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  paintId?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  groundPaintId?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };

  // Date fields
  createdAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };
  updatedAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };

  // Relations
  paint?: PaintWhere;
  groundPaint?: PaintWhere;
}

export interface TaskPaintWhere {
  // Logical operators
  AND?: TaskPaintWhere | TaskPaintWhere[];
  OR?: TaskPaintWhere[];
  NOT?: TaskPaintWhere | TaskPaintWhere[];

  // ID fields
  id?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  taskId?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] };
  catalogPaintId?: string | { equals?: string; not?: string; in?: string[]; notIn?: string[] } | null;

  // String fields
  color?: string | { equals?: string; not?: string; contains?: string; startsWith?: string; endsWith?: string; mode?: "default" | "insensitive"; in?: string[]; notIn?: string[] } | null;
  measureUnit?: string | { equals?: string; not?: string; contains?: string; startsWith?: string; endsWith?: string; mode?: "default" | "insensitive"; in?: string[]; notIn?: string[] } | null;
  observations?: string | { equals?: string; not?: string; contains?: string; startsWith?: string; endsWith?: string; mode?: "default" | "insensitive"; in?: string[]; notIn?: string[] } | null;

  // Number fields
  quantity?: number | { equals?: number; not?: number; lt?: number; lte?: number; gt?: number; gte?: number; in?: number[]; notIn?: number[] } | null;

  // Date fields
  createdAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };
  updatedAt?: Date | { equals?: Date; not?: Date; lt?: Date; lte?: Date; gt?: Date; gte?: Date; in?: Date[]; notIn?: Date[] };

  // Relations
  task?: any; // TaskWhere - avoiding circular import
  catalogPaint?: PaintWhere;
}

// Specialized filtering types for dual filtering (paint type + paint brand)
export interface ComponentFilterOptions {
  paintTypeId?: string;
  paintBrandId?: string;
  paintType?: PaintTypeWhere;
  paintBrand?: PaintBrandWhere;
  paintName?: string;
  searchTerm?: string; // For unified search across paint names, types, and brands
}

export interface PaintComponentFilters {
  // Direct field filters
  paintTypeId?: string | string[];
  paintBrandId?: string | string[];

  // Nested relation filters
  paintType?: {
    id?: string | string[];
    name?: string;
    type?: PAINT_TYPE_ENUM | PAINT_TYPE_ENUM[];
    needGround?: boolean;
  };

  paintBrand?: {
    id?: string | string[];
    name?: string;
  };

  // Combined search
  search?: string; // Searches across paint name, type name, and brand name

  // Paint-specific filters
  paint?: {
    name?: string;
    hex?: string;
    finish?: PAINT_FINISH | PAINT_FINISH[];
    manufacturer?: TRUCK_MANUFACTURER | TRUCK_MANUFACTURER[];
    tags?: string[];
  };
}

// =====================
// Response Interfaces
// =====================

// PaintType responses
export type PaintTypeGetUniqueResponse = BaseGetUniqueResponse<PaintType>;
export type PaintTypeGetManyResponse = BaseGetManyResponse<PaintType>;
export type PaintTypeCreateResponse = BaseCreateResponse<PaintType>;
export type PaintTypeUpdateResponse = BaseUpdateResponse<PaintType>;
export type PaintTypeDeleteResponse = BaseDeleteResponse;

// Paint responses
export type PaintGetUniqueResponse = BaseGetUniqueResponse<Paint>;
export type PaintGetManyResponse = BaseGetManyResponse<Paint>;
export type PaintCreateResponse = BaseCreateResponse<Paint>;
export type PaintUpdateResponse = BaseUpdateResponse<Paint>;
export type PaintDeleteResponse = BaseDeleteResponse;
export type PaintMergeResponse = BaseMergeResponse<Paint>;

// PaintGround responses
export type PaintGroundGetUniqueResponse = BaseGetUniqueResponse<PaintGround>;
export type PaintGroundGetManyResponse = BaseGetManyResponse<PaintGround>;
export type PaintGroundCreateResponse = BaseCreateResponse<PaintGround>;
export type PaintGroundUpdateResponse = BaseUpdateResponse<PaintGround>;
export type PaintGroundDeleteResponse = BaseDeleteResponse;

// PaintFormula responses
export type PaintFormulaGetUniqueResponse = BaseGetUniqueResponse<PaintFormula>;
export type PaintFormulaGetManyResponse = BaseGetManyResponse<PaintFormula>;
export type PaintFormulaCreateResponse = BaseCreateResponse<PaintFormula>;
export type PaintFormulaUpdateResponse = BaseUpdateResponse<PaintFormula>;
export type PaintFormulaDeleteResponse = BaseDeleteResponse;

// PaintFormulaComponent responses
export type PaintFormulaComponentGetUniqueResponse = BaseGetUniqueResponse<PaintFormulaComponent>;
export type PaintFormulaComponentGetManyResponse = BaseGetManyResponse<PaintFormulaComponent>;
export type PaintFormulaComponentCreateResponse = BaseCreateResponse<PaintFormulaComponent>;
export type PaintFormulaComponentUpdateResponse = BaseUpdateResponse<PaintFormulaComponent>;
export type PaintFormulaComponentDeleteResponse = BaseDeleteResponse;

// PaintProduction responses
export type PaintProductionGetUniqueResponse = BaseGetUniqueResponse<PaintProduction>;
export type PaintProductionGetManyResponse = BaseGetManyResponse<PaintProduction>;
export type PaintProductionCreateResponse = BaseCreateResponse<PaintProduction>;
export type PaintProductionUpdateResponse = BaseUpdateResponse<PaintProduction>;
export type PaintProductionDeleteResponse = BaseDeleteResponse;

// TaskPaint responses
export type TaskPaintGetUniqueResponse = BaseGetUniqueResponse<TaskPaint>;
export type TaskPaintGetManyResponse = BaseGetManyResponse<TaskPaint>;
export type TaskPaintCreateResponse = BaseCreateResponse<TaskPaint>;
export type TaskPaintUpdateResponse = BaseUpdateResponse<TaskPaint>;
export type TaskPaintDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

// PaintType batch operations
export type PaintTypeBatchCreateResponse<T = any> = BaseBatchResponse<PaintType, T>;
export type PaintTypeBatchUpdateResponse<T = any> = BaseBatchResponse<PaintType, T & { id: string }>;
export type PaintTypeBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// Paint batch operations
export type PaintBatchCreateResponse<T = any> = BaseBatchResponse<Paint, T>;
export type PaintBatchUpdateResponse<T = any> = BaseBatchResponse<Paint, T & { id: string }>;
export type PaintBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// PaintGround batch operations
export type PaintGroundBatchCreateResponse<T = any> = BaseBatchResponse<PaintGround, T>;
export type PaintGroundBatchUpdateResponse<T = any> = BaseBatchResponse<PaintGround, T & { id: string }>;
export type PaintGroundBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// PaintFormula batch operations
export type PaintFormulaBatchCreateResponse<T = any> = BaseBatchResponse<PaintFormula, T>;
export type PaintFormulaBatchUpdateResponse<T = any> = BaseBatchResponse<PaintFormula, T & { id: string }>;
export type PaintFormulaBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// PaintFormulaComponent batch operations
export type PaintFormulaComponentBatchCreateResponse<T = any> = BaseBatchResponse<PaintFormulaComponent, T>;
export type PaintFormulaComponentBatchUpdateResponse<T = any> = BaseBatchResponse<PaintFormulaComponent, T & { id: string }>;
export type PaintFormulaComponentBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// PaintProduction batch operations
export type PaintProductionBatchCreateResponse<T = any> = BaseBatchResponse<PaintProduction, T>;
export type PaintProductionBatchUpdateResponse<T = any> = BaseBatchResponse<PaintProduction, T & { id: string }>;
export type PaintProductionBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// TaskPaint batch operations
export type TaskPaintBatchCreateResponse<T = any> = BaseBatchResponse<TaskPaint, T>;
export type TaskPaintBatchUpdateResponse<T = any> = BaseBatchResponse<TaskPaint, T & { id: string }>;
export type TaskPaintBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// Dashboard types have been moved to packages/types/src/dashboard.ts
