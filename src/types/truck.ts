// packages/interfaces/src/truck.ts

import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { Task, TaskIncludes, TaskOrderBy } from "./task";
import type { Garage, GarageIncludes, GarageOrderBy } from "./garage";
import type { Layout, LayoutIncludes } from "./layout";
import type { ORDER_BY_DIRECTION, TRUCK_MANUFACTURER } from '@/constants';

// =====================
// Main Entity Interface
// =====================

export interface Truck extends BaseEntity {
  // Identification
  plate: string;
  chassisNumber: string | null;
  model: string;
  manufacturer: TRUCK_MANUFACTURER;

  // Position
  xPosition: number | null;
  yPosition: number | null;

  // Relations
  taskId: string;
  garageId: string | null;
  laneId: string | null;
  leftSideLayoutId: string | null;
  rightSideLayoutId: string | null;
  backSideLayoutId: string | null;
  task?: Task;
  garage?: Garage;
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
  garage?:
    | boolean
    | {
        include?: GarageIncludes;
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
  xPosition?: ORDER_BY_DIRECTION;
  yPosition?: ORDER_BY_DIRECTION;
  taskId?: ORDER_BY_DIRECTION;
  garageId?: ORDER_BY_DIRECTION;
  laneId?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  task?: TaskOrderBy;
  garage?: GarageOrderBy;
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
