// mobile/src/hooks/use-default-goal.ts
//
// Mobile default-goal resolution. Simplified mirror of web's
// web/src/hooks/administration/use-default-goal.ts.
//
// The mobile productivity chart draws a single FLAT goal line (one number),
// not web's per-period stepped line, so this returns just `{ value, isLoading }`
// instead of the full per-period map. The aggregation math itself matches web:
// fetch goals for the metric for each YEAR the displayed range touches, filter
// to the in-range (year, month) periods and (if sectorIds given) those sectors,
// SUM targetValue across sectors per (year, month), then aggregate to a single
// number per the requested mode.

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { getGoals } from "../api-client/goal";
import { GOAL_METRIC } from "../constants/enums";
import type { Goal, GoalGetManyParams } from "../types/goal";

// Mobile only needs the two flat-line aggregations the productivity widget uses:
//   - AVERAGE_PER_PERIOD: mean of the per-period sums (typical monthly target).
//   - AVERAGE_PER_USER:   AVERAGE_PER_PERIOD divided by the active-user count.
export type GoalAggregation = "AVERAGE_PER_PERIOD" | "AVERAGE_PER_USER";

export interface BusinessPeriod {
  year: number;
  month: number; // 1-12
}

export interface UseDefaultGoalParams {
  metric: GOAL_METRIC;
  /**
   * The (year, month) business periods the chart is currently displaying.
   * The widget derives these from its startDate/endDate via the local
   * business-period helpers.
   */
  periods: BusinessPeriod[];
  /**
   * Filter the goal lookup to specific sectors. Empty/omitted = sum across all
   * sectors (mirrors web's sectorFilterActive logic).
   */
  sectorIds?: string[];
  /** How to collapse the per-period sums into a single flat-line value. */
  aggregation: GoalAggregation;
  /**
   * Denominator for AVERAGE_PER_USER. When the aggregation is AVERAGE_PER_USER
   * and this is null/0, the hook returns value=null (matches the widget rule:
   * don't guess a per-user target without a real headcount).
   */
  activeUserCount?: number | null;
  /** Disable the lookup entirely (returns value=null). */
  enabled?: boolean;
}

export interface UseDefaultGoalResult {
  /** The aggregated default goal value, or null if no goal applies. */
  value: number | null;
  /**
   * Per-period goal sums keyed by zero-padded "YYYY-MM" (matching
   * TaskProductionItem.period). Lets the chart draw a goal line that FOLLOWS
   * each period's target instead of a single flat line. Null when no goals.
   */
  perPeriodValues: Map<string, number> | null;
  /** Whether any underlying goals query is still loading. */
  isLoading: boolean;
}

const goalKeys = {
  all: ["goals"] as const,
  list: (params: GoalGetManyParams) =>
    [...goalKeys.all, "list", params] as const,
};

/**
 * Resolve the single flat default-goal value for the productivity widget.
 */
export function useDefaultGoal(
  params: UseDefaultGoalParams,
): UseDefaultGoalResult {
  const {
    metric,
    periods,
    sectorIds,
    aggregation,
    activeUserCount,
    enabled = true,
  } = params;

  // Distinct years the displayed range touches — one query per year, matching
  // web's fan-out.
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const p of periods) set.add(p.year);
    return Array.from(set).sort((a, b) => a - b);
  }, [periods]);

  const enabledForQuery = enabled && periods.length > 0;

  const yearQueries = useQueries({
    queries: enabledForQuery
      ? years.map((y) => {
          const queryParams: GoalGetManyParams = {
            metric,
            year: y,
            include: { sector: true },
            limit: 500,
          };
          return {
            queryKey: goalKeys.list(queryParams),
            queryFn: () => getGoals(queryParams),
            staleTime: 1000 * 60 * 5,
          };
        })
      : [],
  });

  return useMemo<UseDefaultGoalResult>(() => {
    if (!enabledForQuery) {
      return { value: null, perPeriodValues: null, isLoading: false };
    }

    const allGoals: Goal[] = [];
    let anyLoading = false;
    for (const q of yearQueries) {
      if (q.isLoading) anyLoading = true;
      const rows = q.data?.data ?? [];
      for (const g of rows) allGoals.push(g);
    }

    const periodSet = new Set(periods.map((p) => `${p.year}-${p.month}`));
    const sectorFilterActive = (sectorIds?.length ?? 0) > 0;

    const matching = allGoals.filter((g) => {
      if (g.metric !== metric) return false;
      if (!periodSet.has(`${g.year}-${g.month}`)) return false;
      if (sectorFilterActive && g.sectorId && !sectorIds!.includes(g.sectorId)) {
        return false;
      }
      return true;
    });

    if (matching.length === 0) {
      return { value: null, perPeriodValues: null, isLoading: anyLoading };
    }

    // Multiple rows can share one (year, month) — one per sector. The value for
    // a period is the SUM across sectors; the per-period average then means
    // across months, not across (sector, month) cells.
    const perPeriodSums = new Map<string, number>();
    for (const g of matching) {
      const key = `${g.year}-${g.month}`;
      perPeriodSums.set(
        key,
        (perPeriodSums.get(key) ?? 0) + Number(g.targetValue ?? 0),
      );
    }
    const periodSums = Array.from(perPeriodSums.values());
    const total = periodSums.reduce((sum, v) => sum + v, 0);
    const perPeriodAvg = periodSums.length > 0 ? total / periodSums.length : null;

    let value: number | null;
    switch (aggregation) {
      case "AVERAGE_PER_USER":
        value =
          perPeriodAvg != null && activeUserCount && activeUserCount > 0
            ? perPeriodAvg / activeUserCount
            : null;
        break;
      case "AVERAGE_PER_PERIOD":
      default:
        value = perPeriodAvg;
        break;
    }

    // Re-key the per-period sums to zero-padded "YYYY-MM" so the widget can look
    // them up by TaskProductionItem.period directly.
    const perPeriodValues = new Map<string, number>();
    for (const [k, v] of perPeriodSums.entries()) {
      const [yy, mm] = k.split("-");
      perPeriodValues.set(`${yy}-${mm.padStart(2, "0")}`, v);
    }

    return {
      value,
      perPeriodValues: perPeriodValues.size > 0 ? perPeriodValues : null,
      isLoading: anyLoading,
    };
  }, [
    enabledForQuery,
    yearQueries,
    periods,
    sectorIds,
    metric,
    aggregation,
    activeUserCount,
  ]);
}
