import { useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronRight, IconInfoCircle, IconCalendarTime } from "@tabler/icons-react-native";
import { ThemedView, ThemedText, ErrorScreen, EmptyState } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useMyMissingDays } from "@/hooks/secullum";
import { useScreenReady } from "@/hooks/use-screen-ready";

const formatYmd = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatDayDisplay = (ymd: string) => {
  // ymd is local date — split parts to avoid timezone shift on Date parsing.
  const [y, m, d] = ymd.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
};

// Diff in days between two YYYY-MM-DD strings, ignoring DST and timezones.
const daysBetween = (a: string, b: string): number => {
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  // Use UTC to avoid DST jumps adding a fractional day.
  const ta = Date.UTC(ya, ma - 1, da);
  const tb = Date.UTC(yb, mb - 1, db);
  return Math.round((tb - ta) / (24 * 60 * 60 * 1000));
};

// Weekday helper: 0 = Sunday, 6 = Saturday. Used to filter out weekend
// non-workdays from the missing-days list (the user's schedule is Mon-Fri).
const dayOfWeek = (ymd: string): number => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
};
const isWeekend = (ymd: string) => {
  const dow = dayOfWeek(ymd);
  return dow === 0 || dow === 6;
};

type MissingDay = {
  date: string;
  weekdayPt: string;
  saldo?: string | null;
  totalFaltas?: string | null;
  existePeriodoEncerrado: boolean;
};

type Group =
  | {
      kind: "single";
      key: string;
      day: MissingDay;
    }
  | {
      kind: "period";
      key: string;
      start: MissingDay;
      end: MissingDay;
      days: MissingDay[];
      length: number;
    };

/**
 * Collapse consecutive missing days into "Período de Afastamento" groups.
 * Two days are part of the same period when their dates are exactly 1 calendar
 * day apart AND both share the same `existePeriodoEncerrado` flag (so an open
 * day doesn't get bundled with a frozen one). Solitary days surface as
 * "Dia Específico" rows.
 *
 * Input must be sorted descending (newest first) — that's how the screen
 * presents them. We build groups by walking the sorted list and emitting a
 * group when the next entry is no longer the prior date - 1.
 */
function groupMissingDays(sortedDesc: MissingDay[]): Group[] {
  const groups: Group[] = [];
  let i = 0;
  while (i < sortedDesc.length) {
    const start = sortedDesc[i];
    let end = start;
    let j = i + 1;
    while (
      j < sortedDesc.length &&
      daysBetween(sortedDesc[j].date, end.date) === 1 &&
      sortedDesc[j].existePeriodoEncerrado === start.existePeriodoEncerrado
    ) {
      end = sortedDesc[j];
      j++;
    }
    if (j - i === 1) {
      groups.push({ kind: "single", key: `s-${start.date}`, day: start });
    } else {
      const days = sortedDesc.slice(i, j);
      groups.push({
        kind: "period",
        key: `p-${end.date}-${start.date}`,
        // For display: oldest → newest within the period.
        start: end,
        end: start,
        days,
        length: j - i,
      });
    }
    i = j;
  }
  return groups;
}

export default function JustificarAusenciaListScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNav();

  // Default range: last 90 days through today. Secullum's app uses 30 days by
  // default, but that's too narrow when the user is reviewing a previous bonus
  // period (26th of prev month → 25th of current month) — a Falta from early
  // in that period can sit just past the 30-day cutoff.
  const range = useMemo(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 90);
    return { startDate: formatYmd(start), endDate: formatYmd(today) };
  }, []);

  const { data: response, isLoading, error, refetch, isFetching } = useMyMissingDays(range);

  useScreenReady(!isLoading);

  const missingDays = useMemo<MissingDay[]>(() => {
    const apiData = response?.data;
    if (apiData && "data" in apiData && Array.isArray(apiData.data)) {
      // Newest first + exclude weekends — Mon-Fri schedule, Saturday and
      // Sunday are never "missing batidas" because they're scheduled off.
      // Without this filter the list fills up with Saturdays the user can
      // never meaningfully justify.
      return [...apiData.data]
        .filter((d) => !isWeekend(d.date))
        .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
    }
    return [];
  }, [response]);

  const groups = useMemo(() => groupMissingDays(missingDays), [missingDays]);

  if (error) {
    const msg =
      (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      "Erro ao carregar dias sem batida";
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Justificar Ausência" }} />
        <ErrorScreen message="Erro ao carregar" detail={msg} onRetry={() => refetch()} />
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Justificar Ausência" }} />
      <ThemedView
        style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}
      >
        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconInfoCircle size={20} color={colors.primary} />
          <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
            Selecione um dia sem batida para enviar uma justificativa de ausência ao gestor.
          </ThemedText>
        </View>

        {/* List — single dates render as "Dia Específico" rows, runs of
            consecutive dates collapse into "Período de Afastamento" rows
            so the user picks once and justifies the whole span at once. */}
        <FlatList
          data={groups}
          keyExtractor={(g) => g.key}
          contentContainerStyle={
            groups.length === 0
              ? styles.emptyContent
              : { paddingHorizontal: 12, paddingBottom: 24 }
          }
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <EmptyState
                icon="check-circle"
                title="Sem dias pendentes"
                description="Nenhum dia sem batida no período."
              />
            )
          }
          renderItem={({ item: group }) => {
            const disabled =
              group.kind === "single"
                ? group.day.existePeriodoEncerrado
                : group.start.existePeriodoEncerrado;
            const onPress = () => {
              if (group.kind === "single") {
                nav.push(
                  mobileRoute(`/pessoal/meus-pontos/justificar-ausencia/${group.day.date}`),
                );
              } else {
                nav.push(
                  mobileRoute(
                    `/pessoal/meus-pontos/justificar-ausencia/${group.start.date}?end=${group.end.date}`,
                  ),
                );
              }
            };

            return group.kind === "single" ? (
                <TouchableOpacity
                  disabled={disabled}
                  onPress={onPress}
                  style={[
                    styles.row,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: disabled ? 0.55 : 1,
                    },
                  ]}
                >
                  <View style={styles.rowLeft}>
                    <ThemedText style={styles.rowDate}>
                      {formatDayDisplay(group.day.date)}
                    </ThemedText>
                    <ThemedText style={[styles.rowWeekday, { color: colors.mutedForeground }]}>
                      {group.day.weekdayPt}
                      {disabled ? " · período encerrado" : ""}
                    </ThemedText>
                  </View>
                  <View style={styles.rowRight}>
                    {group.day.totalFaltas ? (
                      <View
                        style={[styles.faltaBadge, { backgroundColor: colors.destructive + "22" }]}
                      >
                        <ThemedText
                          style={[styles.faltaText, { color: colors.destructive }]}
                        >
                          {group.day.totalFaltas}
                        </ThemedText>
                      </View>
                    ) : null}
                    <IconChevronRight size={20} color={colors.mutedForeground} />
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  disabled={disabled}
                  onPress={onPress}
                  style={[
                    styles.row,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: disabled ? 0.55 : 1,
                    },
                  ]}
                >
                  <View style={styles.periodIcon}>
                    <IconCalendarTime size={22} color={colors.primary} />
                  </View>
                  <View style={styles.rowLeft}>
                    <ThemedText style={styles.rowDate}>
                      {formatDayDisplay(group.start.date)} → {formatDayDisplay(group.end.date)}
                    </ThemedText>
                    <ThemedText style={[styles.rowWeekday, { color: colors.mutedForeground }]}>
                      Período de Afastamento · {group.length} dias
                      {disabled ? " · período encerrado" : ""}
                    </ThemedText>
                  </View>
                  <View style={styles.rowRight}>
                    <View
                      style={[
                        styles.faltaBadge,
                        { backgroundColor: colors.primary + "1f" },
                      ]}
                    >
                      <ThemedText style={[styles.faltaText, { color: colors.primary }]}>
                        {group.length}d
                      </ThemedText>
                    </View>
                    <IconChevronRight size={20} color={colors.mutedForeground} />
                  </View>
                </TouchableOpacity>
              );
          }}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  infoCard: {
    margin: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  emptyContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingWrap: { paddingVertical: 64, alignItems: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowLeft: { flex: 1, gap: 2 },
  rowDate: { fontSize: 15, fontWeight: "600" },
  rowWeekday: { fontSize: 12 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  faltaBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  faltaText: { fontSize: 12, fontWeight: "700" },
  periodIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
});
