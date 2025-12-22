// packages/interfaces/src/garage.ts
//
// NOTE: Garages are now static configuration - not database entities
// Trucks have a `spot` field (TRUCK_SPOT enum) that indicates
// their location in the static garage structure.

import { TRUCK_SPOT } from '@/constants';

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
  CABIN_LENGTH: 1.8,
  CABIN_THRESHOLD: 10,
  MAX_TRUCKS_PER_LANE: 3,
  MIN_TRUCK_LENGTH: 5,
} as const;

// =====================
// Type Definitions
// =====================

export type GarageId = 'B1' | 'B2' | 'B3';
export type LaneId = 'A' | 'B' | 'C';
export type SpotNumber = 1 | 2 | 3;

export interface Lane {
  id: LaneId;
  xPosition: number;
  width: number;
  length: number;
}

export interface Garage {
  id: GarageId;
  name: string;
  width: number;
  length: number;
  lanes: Lane[];
}

// =====================
// Static Garage Data
// =====================

export const LANES: Lane[] = [
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

export const GARAGES: Garage[] = [
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

  const spotString = typeof spot === 'string' ? spot : spot.toString();
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
export function getGarage(garageId: GarageId): Garage | undefined {
  return GARAGES.find((g) => g.id === garageId);
}

/**
 * Get a lane by ID
 */
export function getLane(laneId: LaneId): Lane | undefined {
  return LANES.find((l) => l.id === laneId);
}

/**
 * Calculate truck length for garage display
 * Trucks under 10m need an extra 2.8m for the cabin
 */
export function calculateTruckGarageLength(layoutSectionsWidthSum: number): number {
  if (layoutSectionsWidthSum < GARAGE_CONFIG.CABIN_THRESHOLD) {
    return layoutSectionsWidthSum + GARAGE_CONFIG.CABIN_LENGTH;
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
