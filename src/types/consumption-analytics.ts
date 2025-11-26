// mobile/src/types/consumption-analytics.ts

import type { BaseResponse } from './common';

// =====================
// Consumption Analytics Types
// =====================

/**
 * Comparison mode for consumption analysis
 */
export type ConsumptionComparisonMode = 'items' | 'sectors' | 'users';

/**
 * Entity comparison data (for sector or user comparisons)
 */
export interface ConsumptionEntityComparison {
  entityId: string;
  entityName: string;
  quantity: number;
  value: number;
  percentage: number;
  movementCount: number;
}

/**
 * Consumption item (simple mode)
 */
export interface ConsumptionItemSimple {
  itemId: string;
  itemName: string;
  itemUniCode: string | null;
  categoryId: string | null;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  totalQuantity: number;
  totalValue: number;
  movementCount: number;
  currentStock: number;
  averagePrice: number;
}

/**
 * Consumption item (comparison mode)
 */
export interface ConsumptionItemComparison extends Omit<ConsumptionItemSimple, 'totalQuantity' | 'totalValue' | 'movementCount'> {
  totalQuantity: number;
  totalValue: number;
  comparisons: ConsumptionEntityComparison[];
  currentStock: number;
  averagePrice: number;
}

/**
 * Union type for consumption items
 */
export type ConsumptionItem = ConsumptionItemSimple | ConsumptionItemComparison;

/**
 * Summary statistics
 */
export interface ConsumptionSummary {
  totalQuantity: number;
  totalValue: number;
  itemCount: number;
  entityCount?: number;
  averageConsumptionPerItem: number;
  averageValuePerItem: number;
}

/**
 * Pagination metadata
 */
export interface ConsumptionPagination {
  hasMore: boolean;
  offset: number;
  limit: number;
  total: number;
}

/**
 * Consumption analytics data
 */
export interface ConsumptionAnalyticsData {
  mode: ConsumptionComparisonMode;
  items: ConsumptionItem[];
  summary: ConsumptionSummary;
  pagination: ConsumptionPagination;
}

/**
 * Consumption analytics response
 */
export interface ConsumptionAnalyticsResponse extends BaseResponse {
  data: ConsumptionAnalyticsData;
}

/**
 * Consumption analytics request filters
 */
export interface ConsumptionAnalyticsFilters {
  startDate: Date;
  endDate: Date;
  sectorIds?: string[];
  userIds?: string[];
  itemIds?: string[];
  brandIds?: string[];
  categoryIds?: string[];
  offset?: number;
  limit?: number;
  sortBy?: 'quantity' | 'value' | 'name';
  sortOrder?: 'asc' | 'desc';
  operation?: 'OUTBOUND' | 'INBOUND' | 'ALL';
}

/**
 * Chart type for consumption visualization
 */
export type ConsumptionChartType = 'bar' | 'pie' | 'area';

/**
 * Helper to check if item is comparison mode
 */
export function isComparisonItem(item: ConsumptionItem): item is ConsumptionItemComparison {
  return 'comparisons' in item;
}
