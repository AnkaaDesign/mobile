// packages/types/src/cut.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { ORDER_BY_DIRECTION, CUT_TYPE, CUT_STATUS, CUT_ORIGIN, CUT_REQUEST_REASON } from '@/constants';
import type { File, FileIncludes, FileOrderBy } from "./file";
import type { Task, TaskIncludes, TaskOrderBy } from "./task";

// =====================
// Main Entity Interfaces
// =====================

export interface Cut extends BaseEntity {
  fileId: string;
  type: CUT_TYPE;
  status: CUT_STATUS;
  statusOrder: number;
  startedAt: Date | null;
  completedAt: Date | null;

  // New simplified structure fields
  taskId?: string | null; // Optional task reference
  origin: CUT_ORIGIN; // How this cut was created
  reason?: CUT_REQUEST_REASON | null; // Reason for the cut (e.g., for recuts)
  parentCutId?: string | null; // Reference to parent cut (for recuts)

  // Relations (optional, populated based on query)
  file?: File;
  task?: Task;
  parentCut?: Cut;
  childCuts?: Cut[];
}

// =====================
// Include Types
// =====================

export interface CutIncludes {
  file?:
    | boolean
    | {
        include?: FileIncludes;
      };
  task?:
    | boolean
    | {
        include?: TaskIncludes;
      };
  parentCut?:
    | boolean
    | {
        include?: CutIncludes;
      };
  childCuts?:
    | boolean
    | {
        include?: CutIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface CutOrderBy {
  id?: ORDER_BY_DIRECTION;
  fileId?: ORDER_BY_DIRECTION;
  type?: ORDER_BY_DIRECTION;
  status?: ORDER_BY_DIRECTION;
  statusOrder?: ORDER_BY_DIRECTION;
  startedAt?: ORDER_BY_DIRECTION;
  completedAt?: ORDER_BY_DIRECTION;
  taskId?: ORDER_BY_DIRECTION;
  origin?: ORDER_BY_DIRECTION;
  reason?: ORDER_BY_DIRECTION;
  parentCutId?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  file?: FileOrderBy;
  task?: TaskOrderBy;
}

// =====================
// Where Types
// =====================

export interface CutWhere {
  id?: string | { in: string[] };
  fileId?: string | { in: string[] };
  type?: CUT_TYPE | { in: CUT_TYPE[] };
  status?: CUT_STATUS | { in: CUT_STATUS[] };
  statusOrder?: number | { gte?: number; lte?: number };
  startedAt?: Date | { gte?: Date; lte?: Date } | null;
  completedAt?: Date | { gte?: Date; lte?: Date } | null;
  taskId?: string | { in: string[] } | null;
  origin?: CUT_ORIGIN | { in: CUT_ORIGIN[] };
  reason?: CUT_REQUEST_REASON | { in: CUT_REQUEST_REASON[] } | null;
  parentCutId?: string | { in: string[] } | null;
  createdAt?: Date | { gte?: Date; lte?: Date };
  updatedAt?: Date | { gte?: Date; lte?: Date };
  file?: any;
  task?: any;
  parentCut?: any;
  childCuts?: { some?: any };
}

// =====================
// API Response Types
// =====================

// Cut responses
export type CutGetUniqueResponse = BaseGetUniqueResponse<Cut>;
export type CutGetManyResponse = BaseGetManyResponse<Cut>;
export type CutCreateResponse = BaseCreateResponse<Cut>;
export type CutUpdateResponse = BaseUpdateResponse<Cut>;
export type CutDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Types
// =====================

// Cut batch operations
export interface CutBatchCreateData {
  fileId: string;
  type: CUT_TYPE;
  status?: CUT_STATUS;
  startedAt?: Date | null;
  completedAt?: Date | null;
  taskId?: string | null;
  origin: CUT_ORIGIN;
  reason?: CUT_REQUEST_REASON | null;
  parentCutId?: string | null;
}

export interface CutBatchUpdateData {
  id: string;
  fileId?: string;
  type?: CUT_TYPE;
  status?: CUT_STATUS;
  startedAt?: Date | null;
  completedAt?: Date | null;
  taskId?: string | null;
  origin?: CUT_ORIGIN;
  reason?: CUT_REQUEST_REASON | null;
  parentCutId?: string | null;
}

export type CutBatchCreateResponse<T = any> = BaseBatchResponse<Cut, T>;
export type CutBatchUpdateResponse<T = any> = BaseBatchResponse<Cut, T & { id: string }>;
export type CutBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
