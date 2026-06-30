import { useMemo, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconThumbUp, IconThumbDown, IconHelpCircle } from "@tabler/icons-react-native";
import { ThemedView, ThemedText, ErrorScreen } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatChip } from "@/components/personnel-department/time-clock/fechamento-stat-chip";
import { useTheme } from "@/lib/theme";
import { useSecullumAssinaturaById } from "@/hooks/secullum";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useScreenReady } from "@/hooks/use-screen-ready";
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

const StatusIcon = ({ status, color }: { status: number; color: string }) => {
  if (status === ASSINATURA_ITEM_STATUS.APROVADO) return <IconThumbUp size={13} color={color} />;
  if (status === ASSINATURA_ITEM_STATUS.REJEITADO) return <IconThumbDown size={13} color={color} />;
  return <IconHelpCircle size={13} color={color} />;
};

/** Foreground (icon + text) color for the status badge — white on filled variants. */
const badgeFg = (status: number, colors: any): string => {
  if (status === ASSINATURA_ITEM_STATUS.APROVADO || status === ASSINATURA_ITEM_STATUS.REJEITADO) return "#ffffff";
  return colors.foreground;
};

const formatResponse = (dataResposta: string | null) => {
  if (!dataResposta) return "—";
  try {
    return format(new Date(dataResposta), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return dataResposta;
  }
};

/**
 * One employee row in a fechamento. Rejected items are tappable: tapping reveals
 * the rejection reason (the employee's `Resposta` motivo) inline.
 */
function AssinaturaItemCard({ item, colors }: { item: SecullumAssinaturaItem; colors: any }) {
  const [expanded, setExpanded] = useState(false);
  const isRejected = item.Status === ASSINATURA_ITEM_STATUS.REJEITADO;
  const reason = (item.Resposta ?? "").trim();

  const card = (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <ThemedText style={styles.funcionario} numberOfLines={1}>
          {item.Funcionario || "Sem nome"}
        </ThemedText>
        <Badge variant={statusVariant(item.Status)}>
          <View style={styles.badgeRow}>
            <StatusIcon status={item.Status} color={badgeFg(item.Status, colors)} />
            <ThemedText style={[styles.badgeLabel, { color: badgeFg(item.Status, colors) }]}>
              {statusLabel(item.Status)}
            </ThemedText>
          </View>
        </Badge>
      </View>
      <View style={styles.itemRow}>
        <ThemedText style={[styles.itemLabel, { color: colors.mutedForeground }]}>Data da resposta:</ThemedText>
        <ThemedText style={styles.itemValue}>{formatResponse(item.DataResposta)}</ThemedText>
      </View>
      {isRejected &&
        (expanded ? (
          <View style={[styles.reasonBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <ThemedText style={[styles.reasonLabel, { color: colors.mutedForeground }]}>Motivo da rejeição</ThemedText>
            <ThemedText style={styles.reasonText}>{reason || "Nenhum motivo informado."}</ThemedText>
          </View>
        ) : (
          <ThemedText style={[styles.reasonHint, { color: colors.mutedForeground }]}>Toque para ver o motivo</ThemedText>
        ))}
    </Card>
  );

  if (!isRejected) return card;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => setExpanded((e) => !e)}>
      {card}
    </TouchableOpacity>
  );
}

export default function FechamentoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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
        <ErrorScreen message="Erro ao carregar o fechamento" detail={errorMessage} onRetry={refetch} />
      </ThemedView>
    );
  }

  const renderItem = ({ item }: { item: SecullumAssinaturaItem }) => (
    <AssinaturaItemCard item={item} colors={colors} />
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => String(item.Id ?? index)}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.lg }]}
        ListHeaderComponent={
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <StatChip label="Cartões" value={summary.total} tone="neutral" colors={colors} />
              <StatChip label="Aprovados" value={summary.aprovados} tone="success" colors={colors} />
              <StatChip label="Rejeitados" value={summary.rejeitados} tone="danger" colors={colors} />
              <StatChip label="Pendentes" value={summary.pendentes} tone="warning" colors={colors} />
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
  summaryRow: { flexDirection: "row", gap: spacing.xs },
  summaryStat: { alignItems: "center", gap: 4, flex: 1 },
  summaryLabel: { fontSize: 10, fontWeight: fontWeight.medium },
  summaryValue: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  itemCard: { padding: spacing.md, gap: spacing.sm },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  badgeLabel: { fontSize: 11, fontWeight: fontWeight.semibold },
  funcionario: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, flex: 1 },
  itemRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  itemLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  itemValue: { fontSize: fontSize.sm },
  reasonHint: { fontSize: fontSize.xs, fontStyle: "italic" },
  reasonBox: { borderRadius: 8, borderWidth: 1, padding: spacing.sm, gap: 2 },
  reasonLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: "uppercase", letterSpacing: 0.3 },
  reasonText: { fontSize: fontSize.sm, lineHeight: 20 },
});
