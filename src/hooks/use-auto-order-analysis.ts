// packages/hooks/src/use-auto-order-analysis.ts
//
// Read-only hook that fetches auto-order recommendations grouped by supplier.
// Mirrors the web service at /home/kennedy/Documents/repositories/web/src/services/api/auto-order.ts
// but only exposes the analyze endpoint (mobile is recommendation-only per spec §10).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api-client/axiosClient";
import { ITEM_CATEGORY_TYPE } from "@/constants/enums";
import { itemKeys, orderKeys } from "./queryKeys";

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
  /** Category type for display/grouping only — tool badges/grouping key on
   *  `stockModel === 'FIXED_TARGET'`. PPE never appears here (excluded). */
  categoryType: ITEM_CATEGORY_TYPE | null;
  /** Stock math model on the item itself (capability-fields contract). */
  stockModel: "CONSUMPTION" | "FIXED_TARGET" | null;
  /** Target on hand when FIXED_TARGET (engine falls back to 1 when null). */
  fixedTargetQuantity: number | null;
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

// =====================
// Order creation from recommendations
// =====================

export interface AutoOrderCreatePayload {
  orders: Array<{
    /** null / omitted = the "no supplier" group. */
    supplierId?: string | null;
    items: Array<{ itemId: string; quantity: number }>;
  }>;
}

/** Create real orders from selected recommendations. The caller resolves the
 *  grouping strategy (combined / per-supplier / per-item / per-category) into
 *  `orders`; the API derives unit price + ICMS/IPI and persists each group. */
export async function createOrdersFromAutoOrder(payload: AutoOrderCreatePayload) {
  const response = await apiClient.post("/orders/auto/create", payload);
  return response.data;
}

/** Mutation for creating orders from recommendations. The api-client
 *  interceptor surfaces success/error toasts, so callers must not double-toast. */
export function useCreateOrdersFromAutoOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrdersFromAutoOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-order-analysis"] });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}
