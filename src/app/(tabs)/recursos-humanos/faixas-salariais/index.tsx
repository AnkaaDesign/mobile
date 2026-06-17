import { useMemo, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import {
  IconBriefcase,
  IconArrowDown,
  IconArrowUp,
  IconChartBar,
  IconChevronRight,
  IconChevronDown,
  IconCashBanknote,
} from "@tabler/icons-react-native";

import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Header } from "@/components/ui/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/ui/search-bar";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useNav } from "@/contexts/nav";
import { usePositions } from "@/hooks";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { Position } from "@/types";

interface RemunerationRecord {
  id: string;
  value: number;
  current?: boolean;
  createdAt: Date | string;
}

const getHistory = (position: Position): RemunerationRecord[] => {
  const records = ((position.monetaryValues ?? position.remunerations ?? []) as unknown) as RemunerationRecord[];
  return [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const getCurrent = (position: Position): number => position.remuneration ?? getHistory(position)[0]?.value ?? 0;

export default function SalaryRangeScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
      fallback="unauthorized"
    >
      <SalaryRangeScreenInner />
    </PrivilegeGate>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        {icon}
        <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
          {label}
        </ThemedText>
      </View>
      <ThemedText style={styles.summaryValue}>{value}</ThemedText>
    </Card>
  );
}

function SalaryRangeScreenInner() {
  const { colors } = useTheme();
  const nav = useNav();
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch, isRefetching } = usePositions({
    include: { remunerations: true, _count: { select: { users: true } } },
    orderBy: { hierarchy: "asc" },
    limit: 100,
  });

  useScreenReady(!isLoading);

  const positions = useMemo(() => data?.data ?? [], [data?.data]);

  const summary = useMemo(() => {
    const values = positions.map(getCurrent).filter((v) => v > 0);
    const total = positions.length;
    if (values.length === 0) return { total, min: 0, max: 0, avg: 0 };
    return {
      total,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((s, v) => s + v, 0) / values.length,
    };
  }, [positions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return positions;
    const term = search.trim().toLowerCase();
    return positions.filter((p) => p.name.toLowerCase().includes(term));
  }, [positions, search]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Faixas Salariais" subtitle="Remuneração por cargo" showBackButton onBackPress={() => nav.goBack()} />
        <View style={styles.loading}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} style={styles.skeleton} />
          ))}
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ErrorScreen
        title="Erro ao carregar faixas salariais"
        message="Não foi possível carregar os cargos. Tente novamente."
        onRetry={refetch}
      />
    );
  }

  const renderItem = ({ item, index }: { item: Position; index: number }) => {
    const isExpanded = expandedIds.has(item.id);
    const history = getHistory(item);
    const current = getCurrent(item);

    return (
      <Card style={styles.posCard}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpanded(item.id)} style={styles.posRow}>
          {isExpanded ? (
            <IconChevronDown size={18} color={colors.mutedForeground} />
          ) : (
            <IconChevronRight size={18} color={colors.mutedForeground} />
          )}
          <View style={styles.posInfo}>
            <ThemedText style={styles.posName}>{item.name}</ThemedText>
            <View style={styles.posMetaRow}>
              <ThemedText style={[styles.posMeta, { color: colors.mutedForeground }]}>
                Hierarquia: {item.hierarchy ?? "-"}
              </ThemedText>
              <Badge variant="default">{`${item._count?.users ?? 0} colab.`}</Badge>
              {item.bonifiable ? <Badge variant="active">Bonificável</Badge> : null}
            </View>
          </View>
          <ThemedText style={styles.posValue}>{current > 0 ? formatCurrency(current) : "—"}</ThemedText>
        </TouchableOpacity>

        {isExpanded ? (
          <View style={[styles.historyBox, { borderTopColor: colors.border }]}>
            <ThemedText style={[styles.historyTitle, { color: colors.mutedForeground }]}>
              Histórico de Remunerações
            </ThemedText>
            {history.length === 0 ? (
              <ThemedText style={[styles.posMeta, { color: colors.mutedForeground }]}>
                Nenhum histórico de remuneração para este cargo.
              </ThemedText>
            ) : (
              history.map((record) => (
                <View key={record.id} style={styles.historyRow}>
                  <View
                    style={[
                      styles.historyDot,
                      { backgroundColor: record.current ? "#15803d" : colors.mutedForeground },
                    ]}
                  />
                  <ThemedText style={styles.historyValue}>{formatCurrency(record.value)}</ThemedText>
                  <ThemedText style={[styles.posMeta, { color: colors.mutedForeground }]}>
                    {formatDate(record.createdAt)}
                  </ThemedText>
                  {record.current ? <Badge variant="active">Atual</Badge> : null}
                </View>
              ))
            )}
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Header title="Faixas Salariais" subtitle="Remuneração por cargo" showBackButton onBackPress={() => nav.goBack()} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.summaryGrid}>
              <SummaryCard
                icon={<IconBriefcase size={16} color={colors.mutedForeground} />}
                label="Total de Cargos"
                value={String(summary.total)}
              />
              <SummaryCard
                icon={<IconArrowDown size={16} color={colors.mutedForeground} />}
                label="Menor"
                value={summary.min > 0 ? formatCurrency(summary.min) : "—"}
              />
              <SummaryCard
                icon={<IconArrowUp size={16} color={colors.mutedForeground} />}
                label="Maior"
                value={summary.max > 0 ? formatCurrency(summary.max) : "—"}
              />
              <SummaryCard
                icon={<IconChartBar size={16} color={colors.mutedForeground} />}
                label="Média"
                value={summary.avg > 0 ? formatCurrency(summary.avg) : "—"}
              />
            </View>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar cargo" />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Nenhum cargo encontrado"
            description={search ? "Ajuste a busca para ver mais resultados." : "Cadastre cargos para visualizar as faixas salariais."}
            icon="cash-banknote"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: spacing.md, gap: spacing.sm },
  listHeader: { gap: spacing.md, marginBottom: spacing.sm },
  loading: { padding: spacing.md, gap: spacing.md },
  skeleton: { height: 72, borderRadius: 8 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  summaryCard: { flexGrow: 1, flexBasis: "47%", padding: spacing.md, gap: spacing.xs },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  summaryLabel: { fontSize: fontSize.xs, flexShrink: 1 },
  summaryValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  posCard: { padding: spacing.md },
  posRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  posInfo: { flex: 1, gap: spacing.xs },
  posName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  posMetaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  posMeta: { fontSize: fontSize.sm },
  posValue: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  historyBox: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, gap: spacing.sm },
  historyTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  historyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
