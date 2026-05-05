import { useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronRight, IconCalendarOff, IconInfoCircle } from "@tabler/icons-react-native";
import { ThemedView, ThemedText, ErrorScreen, EmptyState } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useMyMissingDays } from "@/hooks/secullum";

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

  // Default range: last 30 days through today. Matches the Secullum app default.
  const range = useMemo(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 30);
    return { startDate: formatYmd(start), endDate: formatYmd(today) };
  }, []);

  const { data: response, isLoading, error, refetch, isFetching } = useMyMissingDays(range);

  const missingDays = useMemo(() => {
    const apiData = response?.data;
    if (apiData && "data" in apiData && Array.isArray(apiData.data)) {
      return apiData.data;
    }
    return [];
  }, [response]);

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
          renderItem={({ item }) => {
            const disabled = item.existePeriodoEncerrado;
            return (
              <TouchableOpacity
                disabled={disabled}
                onPress={() =>
                  router.push(`/(tabs)/pessoal/meus-pontos/justificar-ausencia/${item.date}` as any)
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
