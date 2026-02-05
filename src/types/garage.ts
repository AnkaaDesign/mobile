// packages/interfaces/src/garage.ts
//
// NOTE: This file contains BOTH:
// 1. Static garage configuration (Garage, Lane) - used for visualization
// 2. Database entities (GarageLane, ParkingSpot) - if they exist in the database
// Trucks have a `spot` field (TRUCK_SPOT enum) that indicates
// their location in the static garage structure.

import { TRUCK_SPOT } from '@/constants';
import type { BaseEntity, BaseGetUniqueResponse, BaseGetManyResponse, BaseCreateResponse, BaseUpdateResponse, BaseDeleteResponse, BaseBatchResponse } from "./common";

// =====================
// Static Configuration
// =====================

export const GARAGE_CONFIG = {
  GARAGE_LENGTH: 45,
  GARAGE_WIDTH: 25,
  LANE_LENGTH: 35,
  LANE_WIDTH: 3,
  LANE_SPACING: 4,
  TRUCK_MIN_SPACING: 1,
  TRUCK_WIDTH_TOP_VIEW: 2.8,

  // Cabin dimensions - two-tier system based on truck body length
  CABIN_LENGTH_SMALL: 2.0, // meters - for trucks with body < 7m
  CABIN_LENGTH_LARGE: 2.4, // meters - for trucks with body >= 7m and < 10m
  CABIN_THRESHOLD_SMALL: 7, // meters - below this uses small cabin (2m)
  CABIN_THRESHOLD_LARGE: 10, // meters - below this but >= 7m uses large cabin (2.4m), >= 10m no cabin

  // Legacy constants (deprecated - use the new two-tier system above)
  CABIN_LENGTH: 1.8, // DEPRECATED
  CABIN_THRESHOLD: 10, // DEPRECATED

  MAX_TRUCKS_PER_LANE: 3,
  MIN_TRUCK_LENGTH: 5,
} as const;

// =====================
// Type Definitions
// =====================

export type GarageId = 'B1' | 'B2' | 'B3';
export type LaneId = 'A' | 'B' | 'C';
export type SpotNumber = 1 | 2 | 3;

// Static configuration types (for visualization)
export interface StaticLane {
  id: LaneId;
  xPosition: number;
  width: number;
  length: number;
}

export interface StaticGarage {
  id: GarageId;
  name: string;
  width: number;
  length: number;
  lanes: StaticLane[];
}

// Backward compatibility aliases
export type Lane = StaticLane;
export type Garage = GarageEntity; // Main database entity (defined below)

// =====================
// Static Garage Data
// =====================

export const LANES: StaticLane[] = [
  {
    id: 'A',
    xPosition: GARAGE_CONFIG.LANE_SPACING,
    width: GARAGE_CONFIG.LANE_WIDTH,
    length: GARAGE_CONFIG.LANE_LENGTH,
  },
  {
    id: 'B',
    xPosition: GARAGE_CONFIG.LANE_SPACING + GARAGE_CONFIG.LANE_WIDTH + GARAGE_CONFIG.LANE_SPACING,
    width: GARAGE_CONFIG.LANE_WIDTH,
    length: GARAGE_CONFIG.LANE_LENGTH,
  },
  {
    id: 'C',
    xPosition:
      GARAGE_CONFIG.LANE_SPACING +
      2 * (GARAGE_CONFIG.LANE_WIDTH + GARAGE_CONFIG.LANE_SPACING),
    width: GARAGE_CONFIG.LANE_WIDTH,
    length: GARAGE_CONFIG.LANE_LENGTH,
  },
];

export const GARAGES: StaticGarage[] = [
  {
    id: 'B1',
    name: 'Barracão 1',
    width: GARAGE_CONFIG.GARAGE_WIDTH,
    length: GARAGE_CONFIG.GARAGE_LENGTH,
    lanes: LANES,
  },
  {
    id: 'B2',
    name: 'Barracão 2',
    width: GARAGE_CONFIG.GARAGE_WIDTH,
    length: GARAGE_CONFIG.GARAGE_LENGTH,
    lanes: LANES,
  },
  {
    id: 'B3',
    name: 'Barracão 3',
    width: GARAGE_CONFIG.GARAGE_WIDTH,
    length: GARAGE_CONFIG.GARAGE_LENGTH,
    lanes: LANES,
  },
];

// =====================
// Utility Functions
// =====================

export interface ParsedSpot {
  garage: GarageId | null;
  lane: LaneId | null;
  spotNumber: SpotNumber | null;
}

/**
 * Parse a spot enum value into its components
 */
export function parseSpot(spot: TRUCK_SPOT | string | null): ParsedSpot {
  if (!spot || spot === TRUCK_SPOT.PATIO || spot === 'PATIO') {
    return { garage: null, lane: null, spotNumber: null };
  }

  const spotString = String(spot);
  const match = spotString.match(/^B(\d)_([ABC])(\d)$/);

  if (!match) {
    return { garage: null, lane: null, spotNumber: null };
  }

  return {
    garage: `B${match[1]}` as GarageId,
    lane: match[2] as LaneId,
    spotNumber: parseInt(match[3], 10) as SpotNumber,
  };
}

/**
 * Build a spot enum value from components
 */
export function buildSpot(
  garageId: GarageId,
  laneId: LaneId,
  spotNumber: SpotNumber,
): TRUCK_SPOT {
  const key = `${garageId}_${laneId}${spotNumber}` as keyof typeof TRUCK_SPOT;
  return TRUCK_SPOT[key];
}

/**
 * Get a garage by ID
 */
export function getGarage(garageId: GarageId): StaticGarage | undefined {
  return GARAGES.find((g) => g.id === garageId);
}

/**
 * Get a lane by ID
 */
export function getLane(laneId: LaneId): StaticLane | undefined {
  return LANES.find((l) => l.id === laneId);
}

/**
 * Calculate truck length for garage display
 * Two-tier cabin system:
 * - Trucks with body < 7m: add 2.0m cabin (small trucks)
 * - Trucks with body >= 7m and < 10m: add 2.4m cabin (larger trucks)
 * - Trucks with body >= 10m: no cabin added (semi-trailers)
 */
export function calculateTruckGarageLength(layoutSectionsWidthSum: number): number {
  if (layoutSectionsWidthSum < GARAGE_CONFIG.CABIN_THRESHOLD_SMALL) {
    return layoutSectionsWidthSum + GARAGE_CONFIG.CABIN_LENGTH_SMALL;
  }
  if (layoutSectionsWidthSum < GARAGE_CONFIG.CABIN_THRESHOLD_LARGE) {
    return layoutSectionsWidthSum + GARAGE_CONFIG.CABIN_LENGTH_LARGE;
  }
  return layoutSectionsWidthSum;
}

/**
 * Calculate the sum of layout section widths
 */
export function calculateLayoutSectionsSum(
  sections: Array<{ width: number }> | undefined | null,
): number {
  if (!sections || sections.length === 0) {
    return GARAGE_CONFIG.MIN_TRUCK_LENGTH;
  }
  return sections.reduce((sum, section) => sum + section.width, 0);
}

// =====================
// Spot Labels
// =====================

export const SPOT_LABELS: Record<TRUCK_SPOT, string> = {
  [TRUCK_SPOT.B1_F1_V1]: 'Barracão 1 - Faixa 1 - Vaga 1',
  [TRUCK_SPOT.B1_F1_V2]: 'Barracão 1 - Faixa 1 - Vaga 2',
  [TRUCK_SPOT.B1_F1_V3]: 'Barracão 1 - Faixa 1 - Vaga 3',
  [TRUCK_SPOT.B1_F2_V1]: 'Barracão 1 - Faixa 2 - Vaga 1',
  [TRUCK_SPOT.B1_F2_V2]: 'Barracão 1 - Faixa 2 - Vaga 2',
  [TRUCK_SPOT.B1_F2_V3]: 'Barracão 1 - Faixa 2 - Vaga 3',
  [TRUCK_SPOT.B1_F3_V1]: 'Barracão 1 - Faixa 3 - Vaga 1',
  [TRUCK_SPOT.B1_F3_V2]: 'Barracão 1 - Faixa 3 - Vaga 2',
  [TRUCK_SPOT.B1_F3_V3]: 'Barracão 1 - Faixa 3 - Vaga 3',
  [TRUCK_SPOT.B2_F1_V1]: 'Barracão 2 - Faixa 1 - Vaga 1',
  [TRUCK_SPOT.B2_F1_V2]: 'Barracão 2 - Faixa 1 - Vaga 2',
  [TRUCK_SPOT.B2_F1_V3]: 'Barracão 2 - Faixa 1 - Vaga 3',
  [TRUCK_SPOT.B2_F2_V1]: 'Barracão 2 - Faixa 2 - Vaga 1',
  [TRUCK_SPOT.B2_F2_V2]: 'Barracão 2 - Faixa 2 - Vaga 2',
  [TRUCK_SPOT.B2_F2_V3]: 'Barracão 2 - Faixa 2 - Vaga 3',
  [TRUCK_SPOT.B2_F3_V1]: 'Barracão 2 - Faixa 3 - Vaga 1',
  [TRUCK_SPOT.B2_F3_V2]: 'Barracão 2 - Faixa 3 - Vaga 2',
  [TRUCK_SPOT.B2_F3_V3]: 'Barracão 2 - Faixa 3 - Vaga 3',
  [TRUCK_SPOT.B3_F1_V1]: 'Barracão 3 - Faixa 1 - Vaga 1',
  [TRUCK_SPOT.B3_F1_V2]: 'Barracão 3 - Faixa 1 - Vaga 2',
  [TRUCK_SPOT.B3_F1_V3]: 'Barracão 3 - Faixa 1 - Vaga 3',
  [TRUCK_SPOT.B3_F2_V1]: 'Barracão 3 - Faixa 2 - Vaga 1',
  [TRUCK_SPOT.B3_F2_V2]: 'Barracão 3 - Faixa 2 - Vaga 2',
  [TRUCK_SPOT.B3_F2_V3]: 'Barracão 3 - Faixa 2 - Vaga 3',
  [TRUCK_SPOT.B3_F3_V1]: 'Barracão 3 - Faixa 3 - Vaga 1',
  [TRUCK_SPOT.B3_F3_V2]: 'Barracão 3 - Faixa 3 - Vaga 2',
  [TRUCK_SPOT.B3_F3_V3]: 'Barracão 3 - Faixa 3 - Vaga 3',
  [TRUCK_SPOT.PATIO]: 'Pátio',
};

/**
 * Get human-readable label for a spot
 */
export function getSpotLabel(spot: TRUCK_SPOT | null): string {
  if (!spot) return 'Sem vaga';
  return SPOT_LABELS[spot] || spot;
}

// =====================
// Database Entity Interfaces
// =====================

/**
 * Database entity for Garage (if database-backed implementation exists)
 * This is separate from the static Garage configuration above
 */
export interface GarageEntity extends BaseEntity {
  name: string;
  width: number;
  length: number;
  description?: string | null;
  location?: string | null;
  metadata?: Record<string, any> | null;

  // Relations
  lanes?: GarageLane[];
  trucks?: any[]; // Truck type from truck.ts
}

/**
 * Database entity for GarageLane
 */
export interface GarageLane extends BaseEntity {
  garageId: string;
  name?: string | null;
  width: number;
  length: number;
  xPosition: number;
  yPosition: number;
  metadata?: Record<string, any> | null;

  // Relations
  garage?: GarageEntity;
  parkingSpots?: ParkingSpot[];
}

/**
 * Database entity for ParkingSpot
 */
export interface ParkingSpot extends BaseEntity {
  garageLaneId: string;
  name: string;
  length: number;

  // Relations
  garageLane?: GarageLane;
}

// =====================
// Response Types - Garage
// =====================

export type GarageGetUniqueResponse = BaseGetUniqueResponse<GarageEntity>;
export type GarageGetManyResponse = BaseGetManyResponse<GarageEntity>;
export type GarageCreateResponse = BaseCreateResponse<GarageEntity>;
export type GarageUpdateResponse = BaseUpdateResponse<GarageEntity>;
export type GarageDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Response Types - Garage
// =====================

export type GarageBatchCreateResponse<T = any> = BaseBatchResponse<GarageEntity, T>;
export type GarageBatchUpdateResponse<T = any> = BaseBatchResponse<GarageEntity, T & { id: string }>;
export type GarageBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// =====================
// Response Types - GarageLane
// =====================

export type GarageLaneGetUniqueResponse = BaseGetUniqueResponse<GarageLane>;
export type GarageLaneGetManyResponse = BaseGetManyResponse<GarageLane>;
export type GarageLaneCreateResponse = BaseCreateResponse<GarageLane>;
export type GarageLaneUpdateResponse = BaseUpdateResponse<GarageLane>;
export type GarageLaneDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Response Types - GarageLane
// =====================

export type GarageLaneBatchCreateResponse<T = any> = BaseBatchResponse<GarageLane, T>;
export type GarageLaneBatchUpdateResponse<T = any> = BaseBatchResponse<GarageLane, T & { id: string }>;
export type GarageLaneBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;

// =====================
// Response Types - ParkingSpot
// =====================

export type ParkingSpotGetUniqueResponse = BaseGetUniqueResponse<ParkingSpot>;
export type ParkingSpotGetManyResponse = BaseGetManyResponse<ParkingSpot>;
export type ParkingSpotCreateResponse = BaseCreateResponse<ParkingSpot>;
export type ParkingSpotUpdateResponse = BaseUpdateResponse<ParkingSpot>;
export type ParkingSpotDeleteResponse = BaseDeleteResponse;

// =====================
// Batch Response Types - ParkingSpot
// =====================

export type ParkingSpotBatchCreateResponse<T = any> = BaseBatchResponse<ParkingSpot, T>;
export type ParkingSpotBatchUpdateResponse<T = any> = BaseBatchResponse<ParkingSpot, T & { id: string }>;
export type ParkingSpotBatchDeleteResponse = BaseBatchResponse<{ id: string; deleted: boolean }, { id: string }>;
