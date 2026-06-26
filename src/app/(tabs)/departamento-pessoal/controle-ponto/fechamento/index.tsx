import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { IconChevronRight } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, ErrorScreen } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { StatChip } from "@/components/personnel-department/time-clock/fechamento-stat-chip";
import { useTheme } from "@/lib/theme";
import { useSecullumAssinaturas } from "@/hooks/secullum";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { format } from "date-fns";
import { useScreenReady } from "@/hooks/use-screen-ready";
import type { SecullumAssinaturaListItem } from "@/types/secullum";

const PAGE_SIZE = 20;

const formatPeriod = (dataInicio: string, dataFim: string) => {
  try {
    return `${format(new Date(dataInicio), "dd/MM/yyyy")} - ${format(new Date(dataFim), "dd/MM/yyyy")}`;
  } catch {
    return `${dataInicio} - ${dataFim}`;
  }
};

export default function FechamentoListScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useSecullumAssinaturas();

  useScreenReady(!isLoading);

  const apiResponse = data?.data;
  const notLinked = apiResponse?.success === false;

  const filtered: SecullumAssinaturaListItem[] = useMemo(() => {
    const list = apiResponse?.data;
    if (!list || !Array.isArray(list)) return [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((a) => (a.Descricao ?? "").toLowerCase().includes(q) || String(a.Id).includes(q));
  }, [apiResponse, searchQuery]);

  const visible = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setPage(1);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const renderRow = useCallback(
    ({ item }: { item: SecullumAssinaturaListItem }) => {
      const pendentes = Math.max(0, (item.NumeroCartoes ?? 0) - (item.Aprovados ?? 0) - (item.Rejeitados ?? 0));
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push(`/departamento-pessoal/controle-ponto/fechamento/${item.Id}` as never)}
        >
          <Card style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <View style={styles.rowHeaderLeft}>
                <ThemedText style={styles.descricao} numberOfLines={2}>
                  {item.Descricao || `Apuração #${item.Id}`}
                </ThemedText>
                <ThemedText style={[styles.period, { color: colors.mutedForeground }]}>
                  Nº {item.Id} · {formatPeriod(item.DataInicio, item.DataFim)}
                </ThemedText>
              </View>
              <IconChevronRight size={20} color={colors.mutedForeground} />
            </View>

            <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
              <StatChip label="Cartões" value={item.NumeroCartoes ?? 0} tone="neutral" colors={colors} />
              <StatChip label="Aprovados" value={item.Aprovados ?? 0} tone="success" colors={colors} />
              <StatChip label="Rejeitados" value={item.Rejeitados ?? 0} tone="danger" colors={colors} />
              <StatChip label="Pendentes" value={pendentes} tone="warning" colors={colors} />
            </View>
          </Card>
        </TouchableOpacity>
      );
    },
    [colors],
  );

  if (error) {
    const errorMessage =
      (error as any)?.response?.data?.message || (error as any)?.message || "Erro ao carregar fechamentos";
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
          <ErrorScreen message="Erro ao carregar fechamentos" detail={errorMessage} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>

      <View style={styles.headerContainer}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar por descrição..." />
      </View>

      <FlatList
        data={visible}
        renderItem={renderRow}
        keyExtractor={(item) => String(item.Id)}
        contentContainerStyle={styles.listContent}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (visible.length < filtered.length) setPage((p) => p + 1);
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          isLoading ? null : notLinked ? (
            <EmptyState
              title="Não vinculado ao Secullum"
              description="A integração com o Secullum não pôde resolver os fechamentos."
              icon="alert-circle"
            />
          ) : (
            <EmptyState
              title="Nenhum fechamento"
              description="Não há apurações de cartão-ponto para exibir."
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
  listContent: { padding: spacing.sm, gap: spacing.sm },
  rowCard: { padding: spacing.md, gap: spacing.sm },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  rowHeaderLeft: { flex: 1, gap: 2 },
  descricao: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  period: { fontSize: fontSize.xs },
  statsRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm },
});
