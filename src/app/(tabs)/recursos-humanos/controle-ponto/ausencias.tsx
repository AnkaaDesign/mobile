import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, ErrorScreen } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { useTheme } from "@/lib/theme";
import { useSecullumAbsenceDays } from "@/hooks/secullum";
import { getBonusPeriod } from "@/utils";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useScreenReady } from "@/hooks/use-screen-ready";
import type { SecullumAbsenceDayRow } from "@/types/secullum";

const formatDateDisplay = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "dd/MM - EEEE", { locale: ptBR });
  } catch {
    return dateStr;
  }
};

export default function AbsencesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const periodDates = useMemo(
    () => getBonusPeriod(selectedDate.getFullYear(), selectedDate.getMonth() + 1),
    [selectedDate],
  );

  const params = useMemo(
    () => ({
      startDate: format(periodDates.startDate, "yyyy-MM-dd"),
      endDate: format(periodDates.endDate, "yyyy-MM-dd"),
    }),
    [periodDates],
  );

  const { data, isLoading, error, refetch } = useSecullumAbsenceDays(params);

  useScreenReady(!isLoading);

  const apiResponse = data?.data;
  const notLinked = apiResponse?.success === false;

  const rows: SecullumAbsenceDayRow[] = useMemo(() => {
    const list = apiResponse?.data;
    if (!list || !Array.isArray(list)) return [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (r) =>
        r.userName?.toLowerCase().includes(q) ||
        (r.sectorName ?? "").toLowerCase().includes(q) ||
        (r.JustificativaDescricao ?? "").toLowerCase().includes(q) ||
        (r.Motivo ?? "").toLowerCase().includes(q),
    );
  }, [apiResponse, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

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
    ({ item }: { item: SecullumAbsenceDayRow }) => (
      <Card style={styles.rowCard}>
        <View style={styles.rowHeader}>
          <ThemedText style={styles.dateText}>{formatDateDisplay(item.date)}</ThemedText>
          {item.isPartialDay ? (
            <Badge variant="warning">Parcial</Badge>
          ) : (
            <Badge variant="destructive">Falta</Badge>
          )}
        </View>

        <ThemedText style={styles.userName} numberOfLines={1}>
          {item.userName}
        </ThemedText>

        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Setor:</ThemedText>
          <ThemedText style={styles.infoValue} numberOfLines={1}>
            {item.sectorName || "—"}
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Faltas:</ThemedText>
          <ThemedText style={styles.infoValue}>{item.faltas || "—"}</ThemedText>
        </View>

        {!!item.JustificativaDescricao && (
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Tipo:</ThemedText>
            <ThemedText style={styles.infoValue} numberOfLines={2}>
              {item.JustificativaDescricao}
            </ThemedText>
          </View>
        )}

        {!!item.Motivo && (
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Motivo:</ThemedText>
            <ThemedText style={styles.infoValue} numberOfLines={3}>
              {item.Motivo}
            </ThemedText>
          </View>
        )}
      </Card>
    ),
    [colors],
  );

  if (error) {
    const errorMessage =
      (error as any)?.response?.data?.message || (error as any)?.message || "Erro ao carregar ausências";
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
          <ErrorScreen message="Erro ao carregar ausências" detail={errorMessage} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>

      <View style={styles.headerContainer}>
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

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por colaborador, setor ou motivo..."
        />
      </View>

      <FlatList
        data={rows}
        renderItem={renderRow}
        keyExtractor={(item, index) => `${item.userId}-${item.date}-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          isLoading ? null : notLinked ? (
            <EmptyState
              title="Não vinculado ao Secullum"
              description="A integração com o Secullum não pôde resolver as ausências do período."
              icon="alert-circle"
            />
          ) : (
            <EmptyState
              title="Nenhuma ausência"
              description="Não há ausências registradas no período selecionado."
              icon="calendar-x"
            />
          )
        }
        showsVerticalScrollIndicator={false}
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
  rowCard: { padding: spacing.md, gap: spacing.xs },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dateText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, textTransform: "capitalize" },
  userName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, marginBottom: spacing.xs },
  infoRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  infoLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, minWidth: 56 },
  infoValue: { fontSize: fontSize.sm, flex: 1 },
});
