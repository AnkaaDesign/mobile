import React from "react";
import { View, StyleSheet } from "react-native";
import { IconPercentage, IconBriefcase } from "@tabler/icons-react-native";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/formatters";
import { formatPercentage } from "@/utils";
import { SALARY_ADJUSTMENT_TYPE_LABELS } from "@/constants/enum-labels";
import type { SalaryAdjustment, SalaryAdjustmentItem } from "@/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <ThemedText style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</ThemedText>
      <View style={styles.rowValue}>
        {typeof value === "string" || typeof value === "number" ? (
          <ThemedText style={styles.rowValueText}>{value}</ThemedText>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      {icon}
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
  );
}

export function SalaryAdjustmentSummaryCard({ adjustment }: { adjustment: SalaryAdjustment }) {
  const { colors } = useTheme();
  const itemsCount = adjustment.items?.length ?? 0;

  return (
    <Card style={styles.card}>
      <SectionHeader icon={<IconPercentage size={20} color={colors.primary} />} title="Resumo do Reajuste" />
      <Row
        label="Tipo"
        value={<Badge variant="secondary">{SALARY_ADJUSTMENT_TYPE_LABELS[adjustment.type] || adjustment.type}</Badge>}
      />
      <Row
        label="Percentual"
        value={
          adjustment.percentage !== null && adjustment.percentage !== undefined ? (
            formatPercentage(adjustment.percentage)
          ) : (
            <Badge variant="outline">Valores personalizados</Badge>
          )
        }
      />
      <Row label="Data de Vigência" value={formatDate(adjustment.effectiveDate)} />
      <Row label="Cargos Afetados" value={<Badge variant="default">{String(itemsCount)}</Badge>} />
      <Row label="Aplicado Por" value={adjustment.appliedBy?.name || "—"} />
      <Row label="Criado Em" value={adjustment.createdAt ? formatDateTime(adjustment.createdAt) : "—"} />
      {adjustment.note ? (
        <View style={styles.noteBlock}>
          <ThemedText style={[styles.rowLabel, { color: colors.mutedForeground }]}>Observação</ThemedText>
          <ThemedText style={styles.noteText}>{adjustment.note}</ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

export function SalaryAdjustmentItemsCard({ items }: { items: SalaryAdjustmentItem[] }) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <SectionHeader icon={<IconBriefcase size={20} color={colors.primary} />} title="Cargos Reajustados" />
      {items.length === 0 ? (
        <ThemedText style={[styles.empty, { color: colors.mutedForeground }]}>
          Nenhum cargo vinculado a este reajuste.
        </ThemedText>
      ) : (
        items.map((item) => {
          const delta =
            item.previousValue > 0 ? ((item.newValue - item.previousValue) / item.previousValue) * 100 : null;
          const deltaColor =
            delta === null
              ? colors.mutedForeground
              : delta > 0
                ? colors.destructive
                : delta < 0
                  ? "#059669"
                  : colors.mutedForeground;
          return (
            <View key={item.id} style={[styles.itemBox, { borderColor: colors.border, backgroundColor: colors.muted }]}>
              <ThemedText style={styles.itemName}>{item.position?.name || item.positionId}</ThemedText>
              <View style={styles.itemValues}>
                <View style={styles.itemValueCol}>
                  <ThemedText style={[styles.itemValueLabel, { color: colors.mutedForeground }]}>Anterior</ThemedText>
                  <ThemedText style={styles.itemValueText}>{formatCurrency(item.previousValue)}</ThemedText>
                </View>
                <View style={styles.itemValueCol}>
                  <ThemedText style={[styles.itemValueLabel, { color: colors.mutedForeground }]}>Novo</ThemedText>
                  <ThemedText style={styles.itemValueText}>{formatCurrency(item.newValue)}</ThemedText>
                </View>
                <View style={styles.itemValueCol}>
                  <ThemedText style={[styles.itemValueLabel, { color: colors.mutedForeground }]}>Variação</ThemedText>
                  <ThemedText style={[styles.itemValueText, { color: deltaColor }]}>
                    {delta === null ? "—" : formatPercentage(delta)}
                  </ThemedText>
                </View>
              </View>
            </View>
          );
        })
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.xs },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.medium },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: fontSize.sm, flexShrink: 1, marginRight: spacing.md },
  rowValue: { flexShrink: 1, alignItems: "flex-end" },
  rowValueText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, textAlign: "right" },
  noteBlock: { paddingVertical: spacing.sm, gap: spacing.xs },
  noteText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  empty: { fontSize: fontSize.sm, paddingVertical: spacing.md, textAlign: "center" },
  itemBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  itemName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  itemValues: { flexDirection: "row", justifyContent: "space-between" },
  itemValueCol: { flex: 1, gap: 2 },
  itemValueLabel: { fontSize: fontSize.xs },
  itemValueText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
});
