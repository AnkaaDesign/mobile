import { useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, ErrorScreen } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Header } from "@/components/ui/header";
import { useTheme } from "@/lib/theme";
import { useSecullumAssinaturaById } from "@/hooks/secullum";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useNav } from "@/contexts/nav";
import { ASSINATURA_ITEM_STATUS, type SecullumAssinaturaItem } from "@/types/secullum";

const statusLabel = (status: number) => {
  if (status === ASSINATURA_ITEM_STATUS.APROVADO) return "Aprovado";
  if (status === ASSINATURA_ITEM_STATUS.REJEITADO) return "Rejeitado";
  return "Pendente";
};

const statusVariant = (status: number): "success" | "destructive" | "outline" => {
  if (status === ASSINATURA_ITEM_STATUS.APROVADO) return "success";
  if (status === ASSINATURA_ITEM_STATUS.REJEITADO) return "destructive";
  return "outline";
};

const formatResponse = (dataResposta: string | null) => {
  if (!dataResposta) return "—";
  try {
    return format(new Date(dataResposta), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return dataResposta;
  }
};

export default function FechamentoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const goBack = () => nav.goBack();

  const { data, isLoading, error, refetch } = useSecullumAssinaturaById(
    Number.isFinite(numericId) ? numericId : undefined,
  );

  useScreenReady(!isLoading);

  const items: SecullumAssinaturaItem[] = useMemo(() => {
    const list = data?.data?.data?.ListaItensAssinatura;
    return Array.isArray(list) ? list : [];
  }, [data]);

  const summary = useMemo(() => {
    let aprovados = 0;
    let rejeitados = 0;
    let pendentes = 0;
    for (const i of items) {
      if (i.Status === ASSINATURA_ITEM_STATUS.APROVADO) aprovados++;
      else if (i.Status === ASSINATURA_ITEM_STATUS.REJEITADO) rejeitados++;
      else pendentes++;
    }
    return { aprovados, rejeitados, pendentes, total: items.length };
  }, [items]);

  if (error) {
    const errorMessage =
      (error as any)?.response?.data?.message || (error as any)?.message || "Erro ao carregar o fechamento";
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Fechamento" showBackButton onBackPress={goBack} />
        <ErrorScreen message="Erro ao carregar o fechamento" detail={errorMessage} onRetry={refetch} />
      </ThemedView>
    );
  }

  const renderItem = ({ item }: { item: SecullumAssinaturaItem }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <ThemedText style={styles.funcionario} numberOfLines={1}>
          {item.Funcionario || "Sem nome"}
        </ThemedText>
        <Badge variant={statusVariant(item.Status)}>{statusLabel(item.Status)}</Badge>
      </View>
      <View style={styles.itemRow}>
        <ThemedText style={[styles.itemLabel, { color: colors.mutedForeground }]}>Data da resposta:</ThemedText>
        <ThemedText style={styles.itemValue}>{formatResponse(item.DataResposta)}</ThemedText>
      </View>
    </Card>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={`Fechamento #${id}`} subtitle="Apuração de cartão-ponto" showBackButton onBackPress={goBack} />

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => String(item.Id ?? index)}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.lg }]}
        ListHeaderComponent={
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryStat}>
                <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Cartões</ThemedText>
                <ThemedText style={styles.summaryValue}>{summary.total}</ThemedText>
              </View>
              <View style={styles.summaryStat}>
                <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Aprovados</ThemedText>
                <Badge variant="success">{String(summary.aprovados)}</Badge>
              </View>
              <View style={styles.summaryStat}>
                <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Rejeitados</ThemedText>
                <Badge variant="destructive">{String(summary.rejeitados)}</Badge>
              </View>
              <View style={styles.summaryStat}>
                <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Pendentes</ThemedText>
                <Badge variant="outline">{String(summary.pendentes)}</Badge>
              </View>
            </View>
          </Card>
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              title="Nenhum item"
              description="Este fechamento não possui itens de assinatura."
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
  listContent: { padding: spacing.sm, gap: spacing.sm },
  summaryCard: { padding: spacing.md, marginBottom: spacing.sm },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryStat: { alignItems: "center", gap: 4, flex: 1 },
  summaryLabel: { fontSize: 10, fontWeight: fontWeight.medium },
  summaryValue: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  itemCard: { padding: spacing.md, gap: spacing.sm },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  funcionario: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, flex: 1 },
  itemRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  itemLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  itemValue: { fontSize: fontSize.sm },
});
