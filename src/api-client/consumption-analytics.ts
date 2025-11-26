// packages/api-client/src/consumption-analytics.ts

import { apiClient } from './axiosClient';
import type { ConsumptionAnalyticsFilters, ConsumptionAnalyticsResponse } from '../types/consumption-analytics';

// =====================
// Consumption Analytics Service Class
// =====================

export class ConsumptionAnalyticsService {
  private readonly basePath = '/activities/analytics';

  /**
   * Get consumption analytics with comparison support
   * Supports simple view, sector comparison, and user comparison
   */
  async getConsumptionComparison(filters: ConsumptionAnalyticsFilters): Promise<ConsumptionAnalyticsResponse> {
    const response = await apiClient.post<ConsumptionAnalyticsResponse>(
      `${this.basePath}/consumption-comparison`,
      filters,
    );
    return response.data;
  }
}

// =====================
// Export service instance
// =====================

export const consumptionAnalyticsService = new ConsumptionAnalyticsService();

// =====================
// Export individual functions
// =====================

export const getConsumptionComparison = (filters: ConsumptionAnalyticsFilters) =>
  consumptionAnalyticsService.getConsumptionComparison(filters);
