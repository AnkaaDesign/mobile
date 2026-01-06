// packages/interfaces/src/observation.ts

import type { ORDER_BY_DIRECTION } from '@/constants';
import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { File, FileIncludes } from "./file";
import type { Task, TaskIncludes, TaskOrderBy } from "./task";

// =====================
// Main Entity Interface
// =====================

export interface Observation extends BaseEntity {
  reason: string;
  description: string;
  taskId: string;

  // Relations
  files?: File[];
  task?: Task;
}

// =====================
// Include Types
// =====================

export interface ObservationIncludes {
  files?:
    | boolean
    | {
        include?: FileIncludes;
        where?: any;
        orderBy?: any;
        take?: number;
        skip?: number;
      };
  task?:
    | boolean
    | {
        include?: TaskIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface ObservationOrderBy {
  id?: ORDER_BY_DIRECTION;
  description?: ORDER_BY_DIRECTION;
  taskId?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  task?: TaskOrderBy;
}

// =====================
// Response Interfaces
// =====================

export type ObservationGetUniqueResponse = BaseGetUniqueResponse<Observation>;
export type ObservationGetManyResponse = BaseGetManyResponse<Observation>;
export type ObservationCreateResponse = BaseCreateResponse<Observation>;
export type ObservationUpdateResponse = BaseUpdateResponse<Observation>;
export type ObservationDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

export type ObservationBatchCreateResponse<T = any> = BaseBatchResponse<Observation, T>;
export type ObservationBatchUpdateResponse<T = any> = BaseBatchResponse<Observation, T & { id: string }>;
export type ObservationBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
