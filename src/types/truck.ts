// packages/interfaces/src/truck.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { Task, TaskIncludes, TaskOrderBy } from "./task";
import type { Layout, LayoutIncludes } from "./layout";
import type { ORDER_BY_DIRECTION, TRUCK_MANUFACTURER, TRUCK_SPOT } from '@/constants';

// =====================
// Main Entity Interface
// =====================

export interface Truck extends BaseEntity {
  // Identification
  plate: string | null;
  chassisNumber: string | null;
  model: string;
  manufacturer: TRUCK_MANUFACTURER;

  // Position (using spot enum instead of coordinates)
  spot: TRUCK_SPOT | null;

  // Relations
  taskId: string;
  leftSideLayoutId: string | null;
  rightSideLayoutId: string | null;
  backSideLayoutId: string | null;
  task?: Task;
  leftSideLayout?: Layout;
  rightSideLayout?: Layout;
  backSideLayout?: Layout;
}

// =====================
// Include Types
// =====================

export interface TruckIncludes {
  task?:
    | boolean
    | {
        include?: TaskIncludes;
      };
  leftSideLayout?:
    | boolean
    | {
        include?: LayoutIncludes;
      };
  rightSideLayout?:
    | boolean
    | {
        include?: LayoutIncludes;
      };
  backSideLayout?:
    | boolean
    | {
        include?: LayoutIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface TruckOrderBy {
  id?: ORDER_BY_DIRECTION;
  plate?: ORDER_BY_DIRECTION;
  model?: ORDER_BY_DIRECTION;
  manufacturer?: ORDER_BY_DIRECTION;
  spot?: ORDER_BY_DIRECTION;
  taskId?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  task?: TaskOrderBy;
}

// =====================
// Response Interfaces
// =====================

export type TruckGetUniqueResponse = BaseGetUniqueResponse<Truck>;
export type TruckGetManyResponse = BaseGetManyResponse<Truck>;
export type TruckCreateResponse = BaseCreateResponse<Truck>;
export type TruckUpdateResponse = BaseUpdateResponse<Truck>;
export type TruckDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

export type TruckBatchCreateResponse<T = any> = BaseBatchResponse<Truck, T>;
export type TruckBatchUpdateResponse<T = any> = BaseBatchResponse<Truck, T & { id: string }>;
export type TruckBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
