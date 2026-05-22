// packages/hooks/src/use-auto-order-analysis.ts
//
// Read-only hook that fetches auto-order recommendations grouped by supplier.
// Mirrors the web service at /home/kennedy/Documents/repositories/web/src/services/api/auto-order.ts
// but only exposes the analyze endpoint (mobile is recommendation-only per spec §10).

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api-client/axiosClient";

// =====================
// Types
// =====================

export interface AutoOrderRecommendation {
  itemId: string;
  itemName: string;
  currentStock: number;
  monthlyConsumption: number;
  trend: "increasing" | "stable" | "decreasing";
  trendPercentage: number;
  daysUntilStockout: number;
  recommendedOrderQuantity: number;
  urgency: "critical" | "high" | "medium" | "low";
  reason: string;
  supplierId: string | null;
  supplierName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  lastOrderDate: Date | null;
  daysSinceLastOrder: number | null;
  hasActivePendingOrder: boolean;
  estimatedLeadTime: number;
  estimatedCost: number;
  reorderPoint: number | null;
  maxQuantity: number | null;
  isInSchedule: boolean;
  scheduleNextRun: Date | null;
  isEmergencyOverride: boolean;
}

export interface AutoOrderSupplierGroup {
  supplierId: string | null;
  supplierName: string | null;
  itemCount: number;
  totalEstimatedCost: number;
  items: AutoOrderRecommendation[];
}

export interface AutoOrderAnalysisResponse {
  success: boolean;
  data: {
    totalRecommendations: number;
    recommendations: AutoOrderRecommendation[];
    supplierGroups: AutoOrderSupplierGroup[];
    summary: {
      totalItems: number;
      totalEstimatedCost: number;
      criticalItems: number;
      emergencyOverrides: number;
      scheduledItems: number;
    };
  };
}

// =====================
// API Function
// =====================

export async function analyzeAutoOrders(params?: {
  lookbackMonths?: number;
  minStockCriteria?: "all" | "low" | "critical";
  supplierIds?: string[];
  categoryIds?: string[];
}): Promise<AutoOrderAnalysisResponse> {
  const searchParams = new URLSearchParams();

  if (params?.lookbackMonths) {
    searchParams.append("lookbackMonths", params.lookbackMonths.toString());
  }
  if (params?.minStockCriteria) {
    searchParams.append("minStockCriteria", params.minStockCriteria);
  }
  if (params?.supplierIds) {
    params.supplierIds.forEach((id) => searchParams.append("supplierIds", id));
  }
  if (params?.categoryIds) {
    params.categoryIds.forEach((id) => searchParams.append("categoryIds", id));
  }

  const qs = searchParams.toString();
  const url = qs ? `/orders/auto/analyze?${qs}` : `/orders/auto/analyze`;
  const response = await apiClient.get(url);
  return response.data as AutoOrderAnalysisResponse;
}

// =====================
// React Query Hook
// =====================

export function useAutoOrderAnalysis(params?: {
  lookbackMonths?: number;
  minStockCriteria?: "all" | "low" | "critical";
  supplierIds?: string[];
  categoryIds?: string[];
}) {
  return useQuery({
    queryKey: ["auto-order-analysis", params],
    queryFn: () => analyzeAutoOrders(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
