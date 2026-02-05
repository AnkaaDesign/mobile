// packages/interfaces/src/position.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { ORDER_BY_DIRECTION } from '@/constants';
import type { User, UserIncludes, UserOrderBy } from "./user";
import type { Sector, SectorIncludes } from "./sector";

// =====================
// Main Entity Interfaces
// =====================

export interface MonetaryValue extends BaseEntity {
  value: number;
  current: boolean;
  itemId: string | null;
  positionId: string | null;

  // Relations (optional, populated based on query)
  item?: any; // Item type
  position?: Position;
}

export interface Position extends BaseEntity {
  name: string;
  description?: string | null; // Position description
  hierarchy: number | null;
  bonifiable: boolean;
  commissionRate: number;
  sectorId: string | null;

  // Relations (optional, populated based on query)
  users?: User[];
  monetaryValues?: MonetaryValue[];
  remunerations?: PositionRemuneration[]; // DEPRECATED: use monetaryValues
  sector?: Sector;

  // Virtual field (computed from latest/current monetary value)
  remuneration?: number;

  // Count fields (when included)
  _count?: {
    users?: number;
    monetaryValues?: number;
    remunerations?: number; // DEPRECATED
  };
}

// DEPRECATED: Use MonetaryValue instead
export interface PositionRemuneration extends BaseEntity {
  value: number;
  positionId: string;

  // Relations (optional, populated based on query)
  position?: Position;
}

// =====================
// Include Types
// =====================

export interface MonetaryValueIncludes {
  item?: boolean | { include?: any };
  position?: boolean | { include?: PositionIncludes };
}

export interface PositionIncludes {
  users?:
    | boolean
    | {
        include?: UserIncludes;
      };
  monetaryValues?:
    | boolean
    | {
        include?: MonetaryValueIncludes;
      };
  remunerations?:  // DEPRECATED: use monetaryValues
    | boolean
    | {
        include?: PositionRemunerationIncludes;
      };
  sector?:
    | boolean
    | {
        include?: SectorIncludes;
      };
}

export interface PositionRemunerationIncludes {
  position?:
    | boolean
    | {
        include?: PositionIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface PositionOrderBy {
  id?: ORDER_BY_DIRECTION;
  name?: ORDER_BY_DIRECTION;
  hierarchy?: ORDER_BY_DIRECTION;
  remuneration?: ORDER_BY_DIRECTION;
  user?: UserOrderBy;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
}

export interface PositionRemunerationOrderBy {
  id?: ORDER_BY_DIRECTION;
  value?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  position?: PositionOrderBy;
}

// =====================
// Response Interfaces
// =====================

// Position responses
export type PositionGetUniqueResponse = BaseGetUniqueResponse<Position>;
export type PositionGetManyResponse = BaseGetManyResponse<Position>;
export type PositionCreateResponse = BaseCreateResponse<Position>;
export type PositionUpdateResponse = BaseUpdateResponse<Position>;
export type PositionDeleteResponse = BaseDeleteResponse;

// PositionRemuneration responses
export type PositionRemunerationGetUniqueResponse = BaseGetUniqueResponse<PositionRemuneration>;
export type PositionRemunerationGetManyResponse = BaseGetManyResponse<PositionRemuneration>;
export type PositionRemunerationCreateResponse = BaseCreateResponse<PositionRemuneration>;
export type PositionRemunerationUpdateResponse = BaseUpdateResponse<PositionRemuneration>;
export type PositionRemunerationDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

// Position batch operations
export type PositionBatchCreateResponse<T> = BaseBatchResponse<Position, T>;
export type PositionBatchUpdateResponse<T> = BaseBatchResponse<Position, T>;
export type PositionBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// PositionRemuneration batch operations
export type PositionRemunerationBatchCreateResponse<T> = BaseBatchResponse<PositionRemuneration, T>;
export type PositionRemunerationBatchUpdateResponse<T> = BaseBatchResponse<PositionRemuneration, T>;
export type PositionRemunerationBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;