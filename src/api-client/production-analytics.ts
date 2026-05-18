// mobile/src/api-client/production-analytics.ts
//
// Mobile-side production analytics client. Mirrors the web counterpart at
// web/src/api-client/production-analytics.ts. Currently only the task-
// production endpoint is exposed because that's all mobile consumes today.

import { apiClient } from './axiosClient';
import type {
  TaskProductionFilters,
  TaskProductionResponse,
} from '../types/production-analytics';

export class ProductionAnalyticsService {
  private readonly basePath = '/tasks/analytics';

  async getTaskProductionStats(
    filters: TaskProductionFilters,
  ): Promise<TaskProductionResponse> {
    const response = await apiClient.post<TaskProductionResponse>(
      `${this.basePath}/task-production`,
      filters,
    );
    return response.data;
  }
}

export const productionAnalyticsService = new ProductionAnalyticsService();

export const getTaskProductionStats = (filters: TaskProductionFilters) =>
  productionAnalyticsService.getTaskProductionStats(filters);
