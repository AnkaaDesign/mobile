import { useMemo, useCallback, useState } from "react";
import { useSecullumHorarios } from "./secullum";

/**
 * Secullum Horario item type
 */
export interface SecullumHorarioItem {
  id: string;
  Id: number;
  Codigo: string;
  Descricao: string;
  HorarioFlexivel: boolean;
  Ativo: boolean;
  Entrada1?: string;
  Saida1?: string;
  Entrada2?: string;
  Saida2?: string;
  Entrada3?: string;
  Saida3?: string;
  ToleranciaEntrada?: number;
  ToleranciaSaida?: number;
  CargaHorariaDiaria?: string;
  CargaHorariaSemanal?: string;
  TipoHorario?: number;
  TipoHorarioDescricao?: string;
}

/**
 * Mobile-optimized hook for Secullum Horarios (Schedules)
 * Wraps the regular query to provide an infinite-scroll compatible API
 * Since Secullum returns all data at once, this is a static list without pagination
 */
export function useSecullumHorariosInfiniteMobile(params?: {
  incluirDesativados?: boolean;
  searchingFor?: string;
  orderBy?: { field: string; direction: "asc" | "desc" };
}) {
  const [refreshing, setRefreshing] = useState(false);

  // Use the existing Secullum horarios query
  const query = useSecullumHorarios({
    incluirDesativados: params?.incluirDesativados ?? true,
  });

  // Transform and filter the data
  const items = useMemo((): SecullumHorarioItem[] => {
    const data = query.data?.data?.data || [];

    // Transform to include string id for FlatList
    let transformedItems = data.map((item: any) => ({
      ...item,
      id: String(item.Id),
    }));

    // Apply search filter (client-side)
    if (params?.searchingFor) {
      const searchTerm = params.searchingFor.toLowerCase();
      transformedItems = transformedItems.filter(
        (item: SecullumHorarioItem) =>
          item.Descricao?.toLowerCase().includes(searchTerm) ||
          item.Codigo?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting (client-side)
    if (params?.orderBy) {
      const { field, direction } = params.orderBy;
      transformedItems = [...transformedItems].sort((a: any, b: any) => {
        const aVal = a[field] ?? "";
        const bVal = b[field] ?? "";
        const comparison =
          typeof aVal === "string"
            ? aVal.localeCompare(bVal)
            : aVal - bVal;
        return direction === "desc" ? -comparison : comparison;
      });
    }

    return transformedItems;
  }, [query.data, params?.searchingFor, params?.orderBy]);

  // Refresh handler
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [query]);

  return {
    // Flattened data
    items,
    data: items, // Alias for backward compatibility
    totalItemsLoaded: items.length,
    totalCount: items.length,
    currentPage: 1,

    // Loading states
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    isFetchingNextPage: false, // No pagination
    isRefetching: query.isRefetching || refreshing,

    // Pagination control (disabled - all data loaded at once)
    loadMore: () => {},
    canLoadMore: false,
    hasNextPage: false,

    // Pre-fetching (not needed)
    prefetchNext: () => {},
    shouldPrefetch: false,

    // Error handling
    retryLoadMore: async (): Promise<void> => {},
    canRetry: false,
    retryCount: 0,
    isRetrying: false,

    // Utility functions
    refetch: query.refetch,
    refresh,

    // Original query for advanced usage
    originalQuery: query,
  };
}
