import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Text } from "react-native";
import { useColorScheme } from "react-native";
import { useOrderScheduleExpectedTotals } from "@/hooks";
import { useOrderSchedulesInfiniteMobile } from "@/hooks/use-order-schedules-infinite-mobile";
import { formatCurrency } from "@/utils/number";

/**
 * Expected-total support for the (config-driven) order-schedule list.
 *
 * The generic config list renders columns via pure `render(item)` functions and
 * the list screen only hands a static `config` to <Layout>, so there is no clean
 * hook into the column pipeline for an async-computed value. To still show a
 * "Preço esperado" per row from a SINGLE batch request, we:
 *   1. Re-read the same infinite schedule query the list uses. React Query shares
 *      the cache, so this does NOT trigger an extra list network request — it only
 *      gives us the currently-visible ids.
 *   2. Fire ONE batch /order-schedules/expected-totals request for those ids.
 *   3. Expose an id -> expectedTotal map via context.
 * A tiny <ExpectedTotalCell /> rendered as a secondary line in the frequency
 * column reads the map. This keeps it to one batch request, never per-row.
 */

interface ExpectedTotalContextValue {
  totals: Record<string, number>;
  isLoading: boolean;
}

const ExpectedTotalContext = createContext<ExpectedTotalContextValue>({
  totals: {},
  isLoading: false,
});

export function ExpectedTotalProvider({
  // Mirror the list's sort so the same page of ids is read from cache.
  children,
}: {
  children: ReactNode;
}) {
  // Same hook + params the list config uses (defaultSort nextRun asc, include
  // orders) so the query key matches and React Query serves these ids from the
  // SAME cache entry the list already populated — no extra list request.
  const { items } = useOrderSchedulesInfiniteMobile({
    orderBy: { nextRun: "asc" },
    include: { orders: true },
  });

  const visibleIds = useMemo(
    () => (items || []).map((s: { id: string }) => s.id),
    [items],
  );

  const { data, isLoading } = useOrderScheduleExpectedTotals(visibleIds);

  const value = useMemo<ExpectedTotalContextValue>(() => {
    const totals: Record<string, number> = {};
    for (const row of data?.data ?? []) {
      totals[row.id] = row.expectedTotal;
    }
    return { totals, isLoading };
  }, [data, isLoading]);

  return (
    <ExpectedTotalContext.Provider value={value}>
      {children}
    </ExpectedTotalContext.Provider>
  );
}

/** Secondary "Preço esperado" line shown under the frequency in each row. */
export function ExpectedTotalCell({ scheduleId }: { scheduleId: string }) {
  const { totals } = useContext(ExpectedTotalContext);
  const isDark = useColorScheme() === "dark";
  const total = totals[scheduleId];

  if (total == null) {
    return null;
  }

  return (
    <Text
      style={{
        fontSize: 11,
        marginTop: 2,
        color: isDark ? "#a3a3a3" : "#737373",
      }}
      numberOfLines={1}
    >
      {`Preço esperado: ${formatCurrency(total)}`}
    </Text>
  );
}
