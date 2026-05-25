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
    // Serialize Date filters to ISO strings BEFORE they hit the request
    // interceptor. The API accepts ISO strings (`z.coerce.date()`), and sending
    // strings sidesteps `deepFixArraySerialization` in axiosClient, which would
    // otherwise rebuild a Date (no own enumerable keys) into an empty `{}` and
    // trigger a 400 invalid_date. Belt-and-suspenders alongside the Date guard
    // in axiosClient — this guarantees the payload regardless of interceptor.
    const payload = {
      ...filters,
      ...(filters.startDate ? { startDate: filters.startDate.toISOString() } : {}),
      ...(filters.endDate ? { endDate: filters.endDate.toISOString() } : {}),
    };
    // NOTE: The global Axios interceptor in axiosClient.ts already throws an
    // ApiError for non-2xx HTTP responses (validateStatus covers 200-299 only).
    // This guard handles the edge case where the server returns HTTP 200 but
    // includes `success: false` in the payload (application-level failure).
    const response = await apiClient.post<TaskProductionResponse>(
      `${this.basePath}/task-production`,
      payload,
    );
    if (response.data.success === false) {
      throw new Error(response.data.message ?? 'Failed to fetch task production stats');
    }
    return response.data;
  }
}

export const productionAnalyticsService = new ProductionAnalyticsService();

export const getTaskProductionStats = (filters: TaskProductionFilters) =>
  productionAnalyticsService.getTaskProductionStats(filters);
