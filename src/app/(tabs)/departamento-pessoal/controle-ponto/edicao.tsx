import { useState, useMemo, useCallback, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { IconChevronLeft, IconChevronRight, IconEdit } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, ErrorScreen } from "@/components/ui";
import { Combobox } from "@/components/ui/combobox";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { EditTimeEntryModal } from "@/components/personnel-department/time-clock/edit-time-entry-modal";
import { useTheme } from "@/lib/theme";
import { useSecullumTimeEntries } from "@/hooks/secullum";
import { useUsers } from "@/hooks/useUser";
import { getBonusPeriod } from "@/utils";
import { CONTRACT_STATUS } from "@/constants";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useScreenReady } from "@/hooks/use-screen-ready";

interface EditRow {
  id: string;
  date: string;
  entry1: string;
  exit1: string;
  entry2: string;
  exit2: string;
  /** Full raw Secullum row, passed to the edit modal. */
  raw: Record<string, any>;
}

// Parse Secullum "MM/DD/YYYY - Day" → ISO "YYYY-MM-DD".
const parseSecullumDate = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    const datePart = dateStr.split(" - ")[0];
    if (datePart && datePart.includes("/")) {
      const parts = datePart.split("/");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const formatDateDisplay = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "dd/MM - EEEE", { locale: ptBR });
  } catch {
    return dateStr;
  }
};

export default function TimeEntriesEditScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingRow, setEditingRow] = useState<EditRow | null>(null);

  const { data: usersData, isLoading: usersLoading } = useUsers({
    where: { currentContractStatus: { not: CONTRACT_STATUS.TERMINATED }, secullumEmployeeId: { not: null } },
    orderBy: { name: "asc" },
    take: 100,
  });

  const userOptions = useMemo(() => {
    if (!usersData?.data || !Array.isArray(usersData.data)) return [];
    return usersData.data.map((user) => ({ label: user.name, value: user.id }));
  }, [usersData]);

  useEffect(() => {
    if (usersData?.data && usersData.data.length > 0 && !selectedUserId) {
      setSelectedUserId(usersData.data[0].id);
    }
  }, [usersData, selectedUserId]);

  const periodDates = useMemo(() => {
    return getBonusPeriod(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
  }, [selectedDate]);

  const queryParams = useMemo(
    () => ({
      userId: selectedUserId || undefined,
      startDate: format(periodDates.startDate, "yyyy-MM-dd"),
      endDate: format(periodDates.endDate, "yyyy-MM-dd"),
    }),
    [selectedUserId, periodDates],
  );

  const { data: timeEntriesData, isLoading, error, refetch } = useSecullumTimeEntries(queryParams);

  useScreenReady(!isLoading);

  const rows: EditRow[] = useMemo(() => {
    const entriesArray = timeEntriesData?.data?.data?.lista;
    if (!entriesArray || !Array.isArray(entriesArray)) return [];
    return entriesArray.map((entry: any, index: number) => ({
      id: entry.Id?.toString() || entry.id?.toString() || `entry-${index}`,
      date: parseSecullumDate(entry.DataExibicao || entry.Data || entry.date || ""),
      entry1: entry.Entrada1 || "",
      exit1: entry.Saida1 || "",
      entry2: entry.Entrada2 || "",
      exit2: entry.Saida2 || "",
      raw: entry,
    }));
  }, [timeEntriesData]);

  const selectedUserName = useMemo(
    () => userOptions.find((o) => o.value === selectedUserId)?.label ?? "",
    [userOptions, selectedUserId],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["secullum", "time-entries"] });
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch, queryClient]);

  const handlePreviousMonth = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }, []);

  const renderRow = useCallback(
    ({ item }: { item: EditRow }) => (
      <Card style={styles.rowCard}>
        <View style={styles.rowHeader}>
          <ThemedText style={styles.rowDate}>{formatDateDisplay(item.date)}</ThemedText>
          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.border }]}
            onPress={() => setEditingRow(item)}
            activeOpacity={0.7}
          >
            <IconEdit size={16} color={colors.primary} />
            <ThemedText style={[styles.editText, { color: colors.primary }]}>Editar</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.timeRow}>
          <ThemedText style={[styles.timeCell, { color: colors.mutedForeground }]}>
            E1 {item.entry1 || "—"}
          </ThemedText>
          <ThemedText style={[styles.timeCell, { color: colors.mutedForeground }]}>
            S1 {item.exit1 || "—"}
          </ThemedText>
          <ThemedText style={[styles.timeCell, { color: colors.mutedForeground }]}>
            E2 {item.entry2 || "—"}
          </ThemedText>
          <ThemedText style={[styles.timeCell, { color: colors.mutedForeground }]}>
            S2 {item.exit2 || "—"}
          </ThemedText>
        </View>
      </Card>
    ),
    [colors],
  );

  const editSubtitle = editingRow
    ? [selectedUserName, formatDateDisplay(editingRow.date)].filter(Boolean).join(" · ")
    : undefined;

  if (error) {
    const errorMessage =
      (error as any)?.response?.data?.message || (error as any)?.message || "Erro ao carregar registros";
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
          <ErrorScreen message="Erro ao carregar registros" detail={errorMessage} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>

      <View style={styles.headerContainer}>
        <Combobox
          value={selectedUserId}
          onValueChange={(value) => setSelectedUserId(typeof value === "string" ? value : value?.[0] ?? "")}
          options={userOptions}
          placeholder="Selecionar funcionário"
          disabled={usersLoading}
        />

        <View style={[styles.monthSelector, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.muted }]} onPress={handlePreviousMonth}>
            <IconChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.monthDisplay}>
            <ThemedText style={styles.monthLabel}>
              {selectedDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </ThemedText>
            <ThemedText style={[styles.periodLabel, { color: colors.mutedForeground }]}>
              {periodDates.startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} -{" "}
              {periodDates.endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </ThemedText>
          </View>
          <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.muted }]} onPress={handleNextMonth}>
            <IconChevronRight size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={rows}
        renderItem={renderRow}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              title="Nenhum registro"
              description="Não há registros de ponto para o período selecionado."
              icon="calendar-x"
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />

      <EditTimeEntryModal
        visible={!!editingRow}
        entry={editingRow?.raw ?? null}
        subtitle={editSubtitle}
        onClose={() => setEditingRow(null)}
        onSaved={refetch}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingHorizontal: 8, paddingVertical: 8, gap: 8 },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minHeight: 56,
  },
  navButton: { width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  monthDisplay: { flex: 1, alignItems: "center", gap: 2 },
  monthLabel: { fontSize: 15, fontWeight: "600", textTransform: "capitalize" },
  periodLabel: { fontSize: 11, fontWeight: "500" },
  listContent: { padding: spacing.sm, gap: spacing.sm },
  rowCard: { padding: spacing.md, gap: spacing.sm },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowDate: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, textTransform: "capitalize" },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
  },
  editText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  timeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  timeCell: { fontSize: fontSize.xs },
});
