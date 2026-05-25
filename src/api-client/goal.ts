// mobile/src/api-client/goal.ts
//
// Minimal goals client. Mirrors the structure of the sector client
// (mobile/src/api-client/sector.ts) but trimmed to the single list-GET the
// productivity widget needs to resolve its admin-configured default goal.
// The list endpoint is `GET /goals` (see api/src/modules/people/goal/
// goal.controller.ts).

import { apiClient } from "./axiosClient";
import type {
  GoalGetManyParams,
  GoalGetManyResponse,
} from "../types/goal";

// =====================
// Goal Service Class
// =====================

export class GoalService {
  private readonly basePath = "/goals";

  async getGoals(params?: GoalGetManyParams): Promise<GoalGetManyResponse> {
    const response = await apiClient.get<GoalGetManyResponse>(this.basePath, {
      params,
    });
    return response.data;
  }
}

// =====================
// Export service instance
// =====================

export const goalService = new GoalService();

// =====================
// Export individual functions
// =====================

export const getGoals = (params?: GoalGetManyParams) =>
  goalService.getGoals(params);
