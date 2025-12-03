// packages/interfaces/src/garage.ts

import type { ORDER_BY_DIRECTION } from '@/constants';
import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";
import type { Truck, TruckIncludes } from "./truck";

// =====================
// Main Entity Interfaces
// =====================

export interface ParkingSpot extends BaseEntity {
  name: string;
  length: number;
  garageLaneId: string;

  // Relations
  garageLane?: GarageLane;
}

export interface GarageLane extends BaseEntity {
  width: number;
  length: number;
  xPosition: number;
  yPosition: number;
  garageId: string;

  // Relations
  garage?: Garage;
  parkingSpots?: ParkingSpot[];
}

export interface Garage extends BaseEntity {
  name: string;
  width: number;
  length: number;

  // Relations
  lanes?: GarageLane[];
  trucks?: Truck[];
}

// =====================
// Include Types
// =====================

export interface GarageIncludes {
  lanes?:
    | boolean
    | {
        include?: GarageLaneIncludes;
      };
  trucks?:
    | boolean
    | {
        include?: TruckIncludes;
      };
}

export interface GarageLaneIncludes {
  garage?:
    | boolean
    | {
        include?: GarageIncludes;
      };
  parkingSpots?:
    | boolean
    | {
        include?: ParkingSpotIncludes;
      };
}

export interface ParkingSpotIncludes {
  garageLane?:
    | boolean
    | {
        include?: GarageLaneIncludes;
      };
}

// =====================
// Order By Types
// =====================

export interface GarageOrderBy {
  id?: ORDER_BY_DIRECTION;
  name?: ORDER_BY_DIRECTION;
  width?: ORDER_BY_DIRECTION;
  length?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
}

export interface GarageLaneOrderBy {
  id?: ORDER_BY_DIRECTION;
  width?: ORDER_BY_DIRECTION;
  length?: ORDER_BY_DIRECTION;
  xPosition?: ORDER_BY_DIRECTION;
  yPosition?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  garage?: GarageOrderBy;
}

export interface ParkingSpotOrderBy {
  id?: ORDER_BY_DIRECTION;
  name?: ORDER_BY_DIRECTION;
  length?: ORDER_BY_DIRECTION;
  createdAt?: ORDER_BY_DIRECTION;
  updatedAt?: ORDER_BY_DIRECTION;
  garageLane?: GarageLaneOrderBy;
}

// =====================
// Response Interfaces
// =====================

// Garage responses
export type GarageGetUniqueResponse = BaseGetUniqueResponse<Garage>;
export type GarageGetManyResponse = BaseGetManyResponse<Garage>;
export type GarageCreateResponse = BaseCreateResponse<Garage>;
export type GarageUpdateResponse = BaseUpdateResponse<Garage>;
export type GarageDeleteResponse = BaseDeleteResponse;

// GarageLane responses
export type GarageLaneGetUniqueResponse = BaseGetUniqueResponse<GarageLane>;
export type GarageLaneGetManyResponse = BaseGetManyResponse<GarageLane>;
export type GarageLaneCreateResponse = BaseCreateResponse<GarageLane>;
export type GarageLaneUpdateResponse = BaseUpdateResponse<GarageLane>;
export type GarageLaneDeleteResponse = BaseDeleteResponse;

// ParkingSpot responses
export type ParkingSpotGetUniqueResponse = BaseGetUniqueResponse<ParkingSpot>;
export type ParkingSpotGetManyResponse = BaseGetManyResponse<ParkingSpot>;
export type ParkingSpotCreateResponse = BaseCreateResponse<ParkingSpot>;
export type ParkingSpotUpdateResponse = BaseUpdateResponse<ParkingSpot>;
export type ParkingSpotDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Operation Responses
// =====================

// Garage batch operations
export type GarageBatchCreateResponse<T = any> = BaseBatchResponse<Garage, T>;
export type GarageBatchUpdateResponse<T = any> = BaseBatchResponse<Garage, T & { id: string }>;
export type GarageBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// GarageLane batch operations
export type GarageLaneBatchCreateResponse<T = any> = BaseBatchResponse<GarageLane, T>;
export type GarageLaneBatchUpdateResponse<T = any> = BaseBatchResponse<GarageLane, T & { id: string }>;
export type GarageLaneBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// ParkingSpot batch operations
export type ParkingSpotBatchCreateResponse<T = any> = BaseBatchResponse<ParkingSpot, T>;
export type ParkingSpotBatchUpdateResponse<T = any> = BaseBatchResponse<ParkingSpot, T & { id: string }>;
export type ParkingSpotBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
