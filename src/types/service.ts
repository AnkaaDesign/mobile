// packages/types/src/service.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { ORDER_BY_DIRECTION } from '@/constants';

// =====================
// Main Entity Interface
// =====================

export interface Service extends BaseEntity {
  description: string;
}

// =====================
// Include Types
// =====================

// No relations to include
export type ServiceIncludes = Record<string, never>;

// =====================
// Order By Types
// =====================

export interface ServiceOrderBy {
  id?: ORDER_BY_DIRECTION;
  description?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
}

// =====================
// Response Interfaces
// =====================

export type ServiceGetUniqueResponse = BaseGetUniqueResponse<Service>;
export type ServiceGetManyResponse = BaseGetManyResponse<Service>;
export type ServiceCreateResponse = BaseCreateResponse<Service>;
export type ServiceUpdateResponse = BaseUpdateResponse<Service>;
export type ServiceDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

export type ServiceBatchCreateResponse<T = any> = BaseBatchResponse<Service, T>;
export type ServiceBatchUpdateResponse<T = any> = BaseBatchResponse<Service, T & { id: string }>;
export type ServiceBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
