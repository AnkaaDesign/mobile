// mobile/src/types/production-analytics.ts
//
// Mirrors the web counterpart at web/src/types/production-analytics.ts but
// trimmed to what mobile needs today: task production stats. Add other
// analytics shapes here if/when mobile starts consuming them.

import type { BaseResponse } from './common';

export type TaskProductionXAxisMode = 'day' | 'month' | 'year';
export type TaskProductionYAxisMode = 'count' | 'avgPerUser' | 'both';
export type TaskProductionCompareMode = 'combined' | 'separated' | 'separatedWithTotal';
export type TaskProductionChartType =
  | 'bar'
  | 'bar-stacked'
  | 'line'
  | 'line-smooth'
  | 'line-stacked'
  | 'area'
  | 'area-smooth';

export interface TaskProductionFilters {
  startDate?: Date;
  endDate?: Date;
  sectorIds?: string[];
  xAxisMode?: TaskProductionXAxisMode;
  yAxisMode?: TaskProductionYAxisMode;
  compareMode?: TaskProductionCompareMode;
}

export interface TaskProductionSectorComparison {
  sectorId: string;
  sectorName: string;
  count: number;
  activeUsers: number;
  avgPerUser: number;
}

export interface TaskProductionItem {
  period: string;       // "YYYY", "YYYY-MM", or "YYYY-MM-DD"
  periodLabel: string;
  totalCount: number;
  activeUsers: number;
  avgPerUser: number;
  comparisons?: TaskProductionSectorComparison[];
}

export interface TaskProductionSummary {
  totalCompleted: number;
  avgPerUser: number;
  totalActiveUsers: number;
  avgTasksPerPeriod: number;
}

export interface TaskProductionData {
  summary: TaskProductionSummary;
  items: TaskProductionItem[];
}

export interface TaskProductionResponse extends BaseResponse {
  data?: TaskProductionData;
}
