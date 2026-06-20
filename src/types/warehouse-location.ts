// packages/interfaces/src/warehouse-location.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { ORDER_BY_DIRECTION, WAREHOUSE_LOCATION_TYPE } from "@/constants";
import type { Item, ItemIncludes } from "./item";

// =====================
// WarehouseLocation Interface
// =====================

export interface WarehouseLocation extends BaseEntity {
  name: string;
  type: WAREHOUSE_LOCATION_TYPE;
  section: string | null;
  code: string | null;
  description: string | null;
  isActive: boolean;

  // Map placement (not surfaced in mobile UI — kept for parity)
  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;
  rotation: number | null;

  // Grid layout
  levels: number;
  columns: number;
  columnsPerLevel: number[];

  // Relations
  items?: Item[];

  // Count aggregations
  _count?: {
    items?: number;
  };
}

// =====================
// Include Types
// =====================

export interface WarehouseLocationIncludes {
  items?:
    | boolean
    | {
        include?: ItemIncludes;
      };
}

// =====================
// OrderBy Types
// =====================

export interface WarehouseLocationOrderBy {
  id?: ORDER_BY_DIRECTION;
  name?: ORDER_BY_DIRECTION;
  type?: ORDER_BY_DIRECTION;
  section?: ORDER_BY_DIRECTION;
  code?: ORDER_BY_DIRECTION;
  description?: ORDER_BY_DIRECTION;
  isActive?: ORDER_BY_DIRECTION;
  levels?: ORDER_BY_DIRECTION;
  columns?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  _count?: {
    items?: ORDER_BY_DIRECTION;
  };
}

// =====================
// Response Interfaces
// =====================

export type WarehouseLocationGetUniqueResponse = BaseGetUniqueResponse<WarehouseLocation>;
export type WarehouseLocationGetManyResponse = BaseGetManyResponse<WarehouseLocation>;
export type WarehouseLocationCreateResponse = BaseCreateResponse<WarehouseLocation>;
export type WarehouseLocationUpdateResponse = BaseUpdateResponse<WarehouseLocation>;
export type WarehouseLocationDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

export type WarehouseLocationBatchCreateResponse<T = any> = BaseBatchResponse<WarehouseLocation, T>;
export type WarehouseLocationBatchUpdateResponse<T = any> = BaseBatchResponse<WarehouseLocation, T & { id: string }>;
export type WarehouseLocationBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
