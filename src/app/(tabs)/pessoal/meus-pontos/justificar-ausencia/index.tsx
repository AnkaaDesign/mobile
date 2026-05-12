import { useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronRight, IconCalendarOff, IconInfoCircle } from "@tabler/icons-react-native";
import { ThemedView, ThemedText, ErrorScreen, EmptyState } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useMyMissingDays } from "@/hooks/secullum";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useTutorialTarget, TUTORIAL_TARGETS, useOptionalTutorial } from "@/components/tutorial";

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

export default function JustificarAusenciaListScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const pageTarget = useTutorialTarget(TUTORIAL_TARGETS.pessoalPontosJustifyPage);

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

  // Tutorial mock data resolves synchronously through the api-client
  // short-circuit — release the navigation overlay immediately in tutorial
  // mode so the user isn't staring at the spinner until the failsafe fires.
  const isTutorialActive = useOptionalTutorial()?.isActive ?? false;
  useScreenReady(isTutorialActive || !isLoading);

  const missingDays = useMemo(() => {
    const apiData = response?.data;
    if (apiData && "data" in apiData && Array.isArray(apiData.data)) {
      return apiData.data;
    }
    return [];
  }, [response]);

  // First-row target — the tutorial spotlights this row and the user taps
  // it to open the form for that specific date. onAction drives the same
  // navigation the row's TouchableOpacity does, since the spotlight
  // overlay's Pressable swallows the underlying touch.
  const firstRowTarget = useTutorialTarget(
    TUTORIAL_TARGETS.pessoalPontosJustifyFirstRow,
    {
      onAction: () => {
        const first = missingDays[0];
        if (!first) return;
        nav.push(
          mobileRoute(`/pessoal/meus-pontos/justificar-ausencia/${first.date}`),
        );
      },
    },
  );

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
        ref={pageTarget.ref as any}
        onLayout={pageTarget.onLayout}
        collapsable={false}
        style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}
      >
        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconInfoCircle size={20} color={colors.primary} />
          <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
            Selecione um dia sem batida para enviar uma justificativa de ausência ao gestor.
          </ThemedText>
        </View>

        {/* List */}
        <FlatList
          data={missingDays}
          keyExtractor={(item) => item.date}
          contentContainerStyle={
            missingDays.length === 0
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
          renderItem={({ item, index }) => {
            const disabled = item.existePeriodoEncerrado;
            const isFirst = index === 0;
            const row = (
              <TouchableOpacity
                disabled={disabled}
                onPress={() =>
                  nav.push(mobileRoute(`/pessoal/meus-pontos/justificar-ausencia/${item.date}`))
                }
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
                    {formatDayDisplay(item.date)}
                  </ThemedText>
                  <ThemedText style={[styles.rowWeekday, { color: colors.mutedForeground }]}>
                    {item.weekdayPt}
                    {disabled ? " · período encerrado" : ""}
                  </ThemedText>
                </View>
                <View style={styles.rowRight}>
                  {item.totalFaltas ? (
                    <View style={[styles.faltaBadge, { backgroundColor: colors.destructive + "22" }]}>
                      <ThemedText style={[styles.faltaText, { color: colors.destructive }]}>
                        {item.totalFaltas}
                      </ThemedText>
                    </View>
                  ) : null}
                  <IconChevronRight size={20} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>
            );
            if (!isFirst) return row;
            return (
              <View
                ref={firstRowTarget.ref as any}
                onLayout={firstRowTarget.onLayout}
                collapsable={false}
              >
                {row}
              </View>
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
});
