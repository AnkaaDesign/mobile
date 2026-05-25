// mobile/src/types/goal.ts
//
// Minimal goal types for mobile. Mirrors the relevant slice of web's goal types
// (web/src/types/goal.ts) — only what the productivity widget's default-goal
// lookup needs: the Goal row shape, the list query params, and the list
// response. Expand this if/when mobile starts consuming more goal surface.

import type { GOAL_METRIC } from "../constants/enums";
import type { BaseGetManyResponse } from "./common";
import type { Sector } from "./sector";

// =====================
// Main Entity Interface
// =====================

export interface Goal {
  id: string;
  metric: GOAL_METRIC;
  /** Year of the bonus period that ends on day 25 of `month`. */
  year: number;
  /** 1-12. The period runs from day 26 of (month-1) to day 25 of `month`. */
  month: number;
  targetValue: number;
  sectorId: string | null;

  // Relations (when include.sector is requested)
  sector?: Sector | null;
}

// =====================
// Query Params
// =====================

export interface GoalIncludes {
  sector?: boolean;
}

export interface GoalGetManyParams {
  metric?: GOAL_METRIC | GOAL_METRIC[];
  year?: number;
  month?: number;
  sectorId?: string | null;
  include?: GoalIncludes;
  limit?: number;
}

// =====================
// Response Interfaces
// =====================

export interface GoalGetManyResponse extends BaseGetManyResponse<Goal> {}
