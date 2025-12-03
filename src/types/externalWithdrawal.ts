// packages/interfaces/src/externalWithdrawal.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { ORDER_BY_DIRECTION, EXTERNAL_WITHDRAWAL_STATUS, EXTERNAL_WITHDRAWAL_TYPE } from '@/constants';
import type { File, FileIncludes } from "./file";
import type { Item, ItemIncludes, ItemOrderBy } from "./item";

// =====================
// Main Entity Interfaces
// =====================

export interface ExternalWithdrawal extends BaseEntity {
  withdrawerName: string;
  willReturn: boolean;
  type: EXTERNAL_WITHDRAWAL_TYPE;
  status: EXTERNAL_WITHDRAWAL_STATUS;
  statusOrder: number;
  nfeId: string | null;
  receiptId: string | null;
  notes: string | null;
  totalPrice?: number;

  // Relations (optional, populated based on query)
  nfe?: File;
  receipt?: File;
  items?: ExternalWithdrawalItem[];
}

export interface ExternalWithdrawalItem extends BaseEntity {
  externalWithdrawalId: string;
  itemId: string;
  withdrawedQuantity: number;
  returnedQuantity: number;
  price: number | null;
  unitPrice?: number;

  // Relations (optional, populated based on query)
  externalWithdrawal?: ExternalWithdrawal;
  item?: Item;
}

// =====================
// Include Types
// =====================

export interface ExternalWithdrawalIncludes {
  nfe?:
    | boolean
    | {
        include?: FileIncludes;
      };
  receipt?:
    | boolean
    | {
        include?: FileIncludes;
      };
  items?:
    | boolean
    | {
        include?: ExternalWithdrawalItemIncludes;
      };
}

export interface ExternalWithdrawalItemIncludes {
  externalWithdrawal?:
    | boolean
    | {
        include?: ExternalWithdrawalIncludes;
      };
  item?:
    | boolean
    | {
        include?: ItemIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface ExternalWithdrawalOrderBy {
  id?: ORDER_BY_DIRECTION;
  withdrawerName?: ORDER_BY_DIRECTION;
  willReturn?: ORDER_BY_DIRECTION;
  type?: ORDER_BY_DIRECTION;
  status?: ORDER_BY_DIRECTION;
  statusOrder?: ORDER_BY_DIRECTION;
  notes?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
}

export interface ExternalWithdrawalItemOrderBy {
  id?: ORDER_BY_DIRECTION;
  externalWithdrawalId?: ORDER_BY_DIRECTION;
  itemId?: ORDER_BY_DIRECTION;
  withdrawedQuantity?: ORDER_BY_DIRECTION;
  returnedQuantity?: ORDER_BY_DIRECTION;
  price?: ORDER_BY_DIRECTION;
  unitPrice?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  item?: ItemOrderBy;
  externalWithdrawal?: ExternalWithdrawalOrderBy;
}

// =====================
// Response Interfaces
// =====================

// ExternalWithdrawal Responses
export type ExternalWithdrawalGetUniqueResponse = BaseGetUniqueResponse<ExternalWithdrawal>;
export type ExternalWithdrawalGetManyResponse = BaseGetManyResponse<ExternalWithdrawal>;
export type ExternalWithdrawalCreateResponse = BaseCreateResponse<ExternalWithdrawal>;
export type ExternalWithdrawalUpdateResponse = BaseUpdateResponse<ExternalWithdrawal>;
export type ExternalWithdrawalDeleteResponse = BaseDeleteResponse;

// ExternalWithdrawalItem Responses
export type ExternalWithdrawalItemGetUniqueResponse = BaseGetUniqueResponse<ExternalWithdrawalItem>;
export type ExternalWithdrawalItemGetManyResponse = BaseGetManyResponse<ExternalWithdrawalItem>;
export type ExternalWithdrawalItemCreateResponse = BaseCreateResponse<ExternalWithdrawalItem>;
export type ExternalWithdrawalItemUpdateResponse = BaseUpdateResponse<ExternalWithdrawalItem>;
export type ExternalWithdrawalItemDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

// ExternalWithdrawal Batch Operations
export type ExternalWithdrawalBatchCreateResponse<T = any> = BaseBatchResponse<ExternalWithdrawal, T>;
export type ExternalWithdrawalBatchUpdateResponse<T = any> = BaseBatchResponse<ExternalWithdrawal, T & { id: string }>;
export type ExternalWithdrawalBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// ExternalWithdrawalItem Batch Operations
export type ExternalWithdrawalItemBatchCreateResponse<T = any> = BaseBatchResponse<ExternalWithdrawalItem, T>;
export type ExternalWithdrawalItemBatchUpdateResponse<T = any> = BaseBatchResponse<ExternalWithdrawalItem, T & { id: string }>;
export type ExternalWithdrawalItemBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
