// packages/interfaces/src/budget.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { ORDER_BY_DIRECTION } from '@/constants';
import type { Task, TaskIncludes, TaskOrderBy } from "./task";

// =====================
// Budget Interface
// =====================

export interface Budget extends BaseEntity {
  total: number;
  expiresIn: Date;
  taskId: string;

  // Relations
  task?: Task;
  items?: BudgetItem[];
}

// =====================
// BudgetItem Interface
// =====================

export interface BudgetItem extends BaseEntity {
  description: string;
  amount: number;
  budgetId: string;

  // Relations
  budget?: Budget;
}

// =====================
// Include Types
// =====================

export interface BudgetIncludes {
  task?:
    | boolean
    | {
        include?: TaskIncludes;
      };
}

// =====================
// OrderBy Types
// =====================

export interface BudgetOrderBy {
  id?: ORDER_BY_DIRECTION;
  taskId?: ORDER_BY_DIRECTION;
  expiresIn?: ORDER_BY_DIRECTION;
  total?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  task?: TaskOrderBy;
}

// =====================
// Response Interfaces - Budget
// =====================

export type BudgetGetUniqueResponse = BaseGetUniqueResponse<Budget>;
export type BudgetGetManyResponse = BaseGetManyResponse<Budget>;
export type BudgetCreateResponse = BaseCreateResponse<Budget>;
export type BudgetUpdateResponse = BaseUpdateResponse<Budget>;
export type BudgetDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses - Budget
// =====================

export type BudgetBatchCreateResponse<T = any> = BaseBatchResponse<Budget, T>;
export type BudgetBatchUpdateResponse<T = any> = BaseBatchResponse<Budget, T & { id: string }>;
export type BudgetBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
