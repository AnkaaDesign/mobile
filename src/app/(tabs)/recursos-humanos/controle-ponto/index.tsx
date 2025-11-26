import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { IconChevronLeft, IconChevronRight, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, ErrorScreen } from "@/components/ui";
import { Combobox } from "@/components/ui/combobox";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { useTheme } from "@/lib/theme";
import { useSecullumTimeEntries } from "@/hooks/secullum";
import { useUsers } from "@/hooks/useUser";
import { getBonusPeriod } from "@/utils";
import { CalculationsTable, CalculationsColumnDrawer } from "@/components/personal/calculations";
import { USER_STATUS } from "@/constants";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

interface TimeEntry {
  id: string;
  date: string;
  entry1?: string;
  exit1?: string;
  entry2?: string;
  exit2?: string;
  entry3?: string;
  exit3?: string;
  totalHours?: string;
  location?: string;
  userName?: string;
  source?: string;
}

const COLUMN_DEFINITIONS = [
  { key: "date", label: "Data" },
  { key: "entry1", label: "Entrada 1" },
  { key: "exit1", label: "Saída 1" },
  { key: "entry2", label: "Entrada 2" },
  { key: "exit2", label: "Saída 2" },
  { key: "entry3", label: "Entrada 3" },
  { key: "exit3", label: "Saída 3" },
  { key: "totalHours", label: "Total Horas" },
  { key: "location", label: "Local" },
  { key: "source", label: "Origem" },
];

const DEFAULT_VISIBLE_COLUMNS = [
  "date", "entry1", "exit1", "entry2", "exit2", "totalHours"
];

export default function TimeEntriesListScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Clear cache on mount to ensure fresh data
  useEffect(() => {
    console.log('🔍 [CONTROLE PONTO] Invalidating time entries cache');
    queryClient.invalidateQueries({ queryKey: ['secullum', 'time-entries'] });
  }, []);

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    () => new Set(DEFAULT_VISIBLE_COLUMNS)
  );

  // Fetch users for selector
  const { data: usersData, isLoading: usersLoading } = useUsers({
    where: { status: { not: USER_STATUS.DISMISSED } },
    orderBy: { name: "asc" },
    take: 100,
  });

  // User options for selector
  const userOptions = useMemo(() => {
    if (!usersData?.data || !Array.isArray(usersData.data)) return [];

    return [
      { label: "Todos os usuários", value: "" },
      ...usersData.data.map((user) => ({
        label: user.name,
        value: user.id,
      })),
    ];
  }, [usersData]);

  // Calculate period dates (26th to 25th - same as calculos)
  const periodDates = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    return getBonusPeriod(year, month);
  }, [selectedDate]);

  // Prepare query parameters
  const queryParams = useMemo(() => {
    const startDate = format(periodDates.startDate, "yyyy-MM-dd");
    const endDate = format(periodDates.endDate, "yyyy-MM-dd");

    return {
      userId: selectedUserId || undefined,
      startDate,
      endDate,
    };
  }, [selectedUserId, periodDates]);

  // Fetch time entries
  const {
    data: timeEntriesData,
    isLoading,
    error,
    refetch,
  } = useSecullumTimeEntries(queryParams);

  // Transform time entries
  const timeEntries = useMemo(() => {
    console.log('🔍 [CONTROLE PONTO] === DATA STRUCTURE DEBUG ===');
    console.log('🔍 [CONTROLE PONTO] timeEntriesData exists:', !!timeEntriesData);
    console.log('🔍 [CONTROLE PONTO] timeEntriesData.data exists:', !!timeEntriesData?.data);
    console.log('🔍 [CONTROLE PONTO] timeEntriesData.data.data exists:', !!timeEntriesData?.data?.data);
    console.log('🔍 [CONTROLE PONTO] timeEntriesData.data.data.data exists:', !!timeEntriesData?.data?.data?.data);

    // Log the full structure
    if (timeEntriesData?.data?.data) {
      const responseData = timeEntriesData.data.data;
      console.log('🔍 [CONTROLE PONTO] Data at .data.data:', {
        isArray: Array.isArray(responseData),
        type: typeof responseData,
        keys: typeof responseData === 'object' ? Object.keys(responseData) : 'not object',
      });

      // Check for nested data structure
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        console.log('🔍 [CONTROLE PONTO] Data at .data.data.data:', {
          isArray: Array.isArray((responseData as any).data),
          keys: typeof (responseData as any).data === 'object' ? Object.keys((responseData as any).data) : 'not object',
        });

        // Check for lista property
        if (typeof (responseData as any).data === 'object' && 'lista' in (responseData as any).data) {
          console.log('🔍 [CONTROLE PONTO] Found lista at .data.data.data.lista:', {
            isArray: Array.isArray((responseData as any).data.lista),
            length: Array.isArray((responseData as any).data.lista) ? (responseData as any).data.lista.length : 'not array',
          });
        }
      }
    }

    // Extract entries from .data.data.lista
    // Structure: timeEntriesData (React Query) -> .data (Axios response) -> .data (API response with {lista, meta})
    const entriesArray = timeEntriesData?.data?.data?.lista;

    console.log('🔍 [CONTROLE PONTO] entriesArray:', {
      exists: !!entriesArray,
      isArray: Array.isArray(entriesArray),
      length: entriesArray?.length,
    });

    if (!entriesArray || !Array.isArray(entriesArray)) {
      console.log('❌ [CONTROLE PONTO] No valid array found, returning empty');
      return [];
    }

    console.log(`✅ [CONTROLE PONTO] Found ${entriesArray.length} time entries`);

    // Helper to parse Secullum date format
    const parseSecullumDate = (dateStr: string): string => {
      if (!dateStr) return "";
      try {
        // If it's in format "MM/DD/YYYY - Day", extract MM/DD/YYYY
        const datePart = dateStr.split(" - ")[0];
        if (datePart && datePart.includes("/")) {
          const parts = datePart.split("/");
          if (parts.length === 3) {
            // Convert MM/DD/YYYY to ISO format YYYY-MM-DD
            return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
        }
        return dateStr;
      } catch {
        return dateStr;
      }
    };

    return entriesArray.map((entry: any, index: number) => ({
      id: entry.Id?.toString() || entry.id?.toString() || `entry-${index}`,
      date: parseSecullumDate(entry.DataExibicao || entry.Data || entry.date || ""),
      entry1: entry.Entrada1 || entry.entry1 || "",
      exit1: entry.Saida1 || entry.exit1 || "",
      entry2: entry.Entrada2 || entry.entry2 || "",
      exit2: entry.Saida2 || entry.exit2 || "",
      entry3: entry.Entrada3 || entry.entry3 || "",
      exit3: entry.Saida3 || entry.exit3 || "",
      totalHours: entry.TotalHoras || entry.totalHours || "",
      location: entry.Local || entry.location || "",
      userName: entry.NomeFuncionario || entry.userName || "",
      source: entry.Fonte || entry.source || "SECULLUM",
    }));
  }, [timeEntriesData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Invalidate cache to force fresh data
      await queryClient.invalidateQueries({ queryKey: ['secullum', 'time-entries'] });
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch, queryClient]);

  const handlePreviousMonth = useCallback(() => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(newColumns);
  }, []);

  // Handle API errors
  if (error) {
    const errorMessage = (error as any)?.response?.data?.message
      || (error as any)?.message
      || 'Erro ao carregar registros';

    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorScreen
          message="Erro ao carregar registros"
          detail={errorMessage}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Header: User Selector + Month Navigator + Column Button */}
        <View style={styles.headerContainer}>
          {/* User Selector - Full Width */}
          <Combobox
            value={selectedUserId}
            onValueChange={setSelectedUserId}
            options={userOptions}
            placeholder="Selecionar usuário"
            disabled={usersLoading}
          />

          {/* Month Navigator + Column Button */}
          <View style={styles.controlsRow}>
            <View style={[styles.monthSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.navButton, { backgroundColor: colors.muted }]}
                onPress={handlePreviousMonth}
              >
                <IconChevronLeft size={20} color={colors.foreground} />
              </TouchableOpacity>

              <View style={styles.monthDisplay}>
                <ThemedText style={styles.monthLabel}>
                  {selectedDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </ThemedText>
                <ThemedText style={[styles.periodLabel, { color: colors.mutedForeground }]}>
                  {periodDates.startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} - {periodDates.endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </ThemedText>
              </View>

              <TouchableOpacity
                style={[styles.navButton, { backgroundColor: colors.muted }]}
                onPress={handleNextMonth}
              >
                <IconChevronRight size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.columnButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setIsColumnPanelOpen(true)}
            >
              <IconList size={20} color={colors.foreground} />
              <View style={[styles.columnBadge, { backgroundColor: colors.primary }]}>
                <ThemedText style={styles.columnBadgeText}>{visibleColumns.size}</ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Table */}
        <CalculationsTable
          data={timeEntries}
          columns={COLUMN_DEFINITIONS}
          visibleColumns={visibleColumns}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          loading={isLoading && !refreshing}
        />
      </ThemedView>

      {/* Column Visibility Panel */}
      <SlideInPanel isOpen={isColumnPanelOpen} onClose={() => setIsColumnPanelOpen(false)}>
        <CalculationsColumnDrawer
          columns={COLUMN_DEFINITIONS}
          visibleColumns={visibleColumns}
          onVisibilityChange={handleColumnsChange}
          onClose={() => setIsColumnPanelOpen(false)}
          defaultColumns={DEFAULT_VISIBLE_COLUMNS}
        />
      </SlideInPanel>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 0,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
    marginTop: -8,
  },
  monthSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minHeight: 56,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  monthDisplay: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  periodLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  columnButton: {
    width: 56,
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  columnBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  columnBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
