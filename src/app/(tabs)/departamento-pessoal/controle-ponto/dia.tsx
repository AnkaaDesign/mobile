import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, ErrorScreen } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { TimeSlotChip } from "@/components/personnel-department/time-clock/time-slot-chip";
import { useTheme } from "@/lib/theme";
import { useSecullumTimeEntriesByDay } from "@/hooks/secullum";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useScreenReady } from "@/hooks/use-screen-ready";

interface DayRow {
  userId: string;
  userName: string;
  entry1: string;
  exit1: string;
  entry2: string;
  exit2: string;
  faltas: string;
  hasEntry: boolean;
}

const dash = (v: any): string => {
  const s = v == null ? "" : String(v);
  return s && s !== "0" && s !== "00:00" ? s : "—";
};

export default function TimeEntriesDayScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const dateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  const { data: dayData, isLoading, error, refetch } = useSecullumTimeEntriesByDay(dateStr);

  useScreenReady(!isLoading);

  // The proxy returns { success, message, data: [{ user, entry }] }. When the
  // integration can't resolve (e.g. unlinked / not configured) it returns
  // success:false + an empty data array — surfaced as a distinct empty state.
  const apiResponse = dayData?.data;
  const notLinked = apiResponse?.success === false;

  const rows: DayRow[] = useMemo(() => {
    const list = apiResponse?.data;
    if (!list || !Array.isArray(list)) return [];
    let mapped: DayRow[] = list.map((item: any) => {
      const e = item.entry || {};
      return {
        userId: item.user?.id ?? "",
        userName: item.user?.name ?? "Sem nome",
        entry1: dash(e.Entrada1 ?? e.entry1),
        exit1: dash(e.Saida1 ?? e.exit1),
        entry2: dash(e.Entrada2 ?? e.entry2),
        exit2: dash(e.Saida2 ?? e.exit2),
        faltas: dash(e.Faltas ?? e.faltas),
        hasEntry: !!item.entry,
      };
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      mapped = mapped.filter((r) => r.userName.toLowerCase().includes(q));
    }
    return mapped;
  }, [apiResponse, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handlePreviousDay = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  }, []);

  const handleNextDay = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  }, []);

  const renderRow = useCallback(
    ({ item }: { item: DayRow }) => (
      <Card style={styles.rowCard}>
        <View style={styles.rowHeader}>
          <View style={styles.rowHeaderLeft}>
            <ThemedText style={styles.userName} numberOfLines={1}>
              {item.userName}
            </ThemedText>
          </View>
          {!item.hasEntry && (
            <Badge variant="outline">Sem registro</Badge>
          )}
        </View>
        <View style={styles.timeRow}>
          <TimeSlotChip label="Ent. 1" value={item.entry1} colors={colors} />
          <TimeSlotChip label="Saí. 1" value={item.exit1} colors={colors} />
          <TimeSlotChip label="Ent. 2" value={item.entry2} colors={colors} />
          <TimeSlotChip label="Saí. 2" value={item.exit2} colors={colors} />
          <TimeSlotChip label="Faltas" value={item.faltas} colors={colors} />
        </View>
      </Card>
    ),
    [colors],
  );

  if (error) {
    const errorMessage =
      (error as any)?.response?.data?.message || (error as any)?.message || "Erro ao carregar registros";
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
          <ErrorScreen message="Erro ao carregar registros do dia" detail={errorMessage} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>

      <View style={styles.headerContainer}>
        <View style={[styles.daySelector, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.muted }]} onPress={handlePreviousDay}>
            <IconChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.dayDisplay}>
            <ThemedText style={styles.dayLabel}>
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </ThemedText>
            <ThemedText style={[styles.weekdayLabel, { color: colors.mutedForeground }]}>
              {format(selectedDate, "EEEE, yyyy", { locale: ptBR })}
            </ThemedText>
          </View>
          <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.muted }]} onPress={handleNextDay}>
            <IconChevronRight size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por colaborador..."
        />
      </View>

      <FlatList
        data={rows}
        renderItem={renderRow}
        keyExtractor={(item, index) => item.userId || `row-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          isLoading ? null : notLinked ? (
            <EmptyState
              title="Não vinculado ao Secullum"
              description="A integração com o Secullum não pôde resolver os registros deste dia."
              icon="alert-circle"
            />
          ) : (
            <EmptyState
              title="Nenhum registro"
              description={`Não há registros de ponto para ${format(selectedDate, "dd/MM/yyyy")}.`}
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
  daySelector: {
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
  dayDisplay: { flex: 1, alignItems: "center", gap: 2 },
  dayLabel: { fontSize: 15, fontWeight: "600", textTransform: "capitalize" },
  weekdayLabel: { fontSize: 11, fontWeight: "500", textTransform: "capitalize" },
  listContent: { padding: spacing.sm, gap: spacing.sm },
  rowCard: { padding: spacing.md, gap: spacing.sm },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  rowHeaderLeft: { flex: 1, gap: 2 },
  userName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  timeRow: { flexDirection: "row", gap: spacing.xs },
});
