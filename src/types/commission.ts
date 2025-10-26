// packages/interfaces/src/commission.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { ORDER_BY_DIRECTION, COMMISSION_STATUS } from '@/constants';
import type { Task, TaskIncludes, TaskOrderBy } from "./task";
import type { User, UserIncludes, UserOrderBy } from "./user";

// =====================
// Commission Interface
// =====================

export interface Commission extends BaseEntity {
  status: COMMISSION_STATUS;
  reason: string | null;
  taskId: string;
  userId: string;

  // Relations
  task?: Task;
  user?: User;
}

// =====================
// Include Types
// =====================

export interface CommissionIncludes {
  task?:
    | boolean
    | {
        include?: TaskIncludes;
      };
  user?:
    | boolean
    | {
        include?: UserIncludes;
      };
}

// =====================
// OrderBy Types
// =====================

export interface CommissionOrderBy {
  id?: ORDER_BY_DIRECTION;
  status?: ORDER_BY_DIRECTION;
  reason?: ORDER_BY_DIRECTION;
  taskId?: ORDER_BY_DIRECTION;
  userId?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  task?: TaskOrderBy;
  user?: UserOrderBy;
}

// =====================
// Response Interfaces
// =====================

export interface CommissionGetUniqueResponse extends BaseGetUniqueResponse<Commission> {}
export interface CommissionGetManyResponse extends BaseGetManyResponse<Commission> {}
export interface CommissionCreateResponse extends BaseCreateResponse<Commission> {}
export interface CommissionUpdateResponse extends BaseUpdateResponse<Commission> {}
export interface CommissionDeleteResponse extends BaseDeleteResponse {}

// =====================
// Batch Operation Responses
// =====================

export interface CommissionBatchCreateResponse<T = any> extends BaseBatchResponse<Commission, T> {}
export interface CommissionBatchUpdateResponse<T = any> extends BaseBatchResponse<Commission, T & { id: string }> {}
export interface CommissionBatchDeleteResponse extends BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }> {}
