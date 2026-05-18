import { View, StyleSheet } from "react-native";
import { useFormContext } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatQuantity } from "@/utils";
import { ABC_CATEGORY_LABELS, XYZ_CATEGORY_LABELS } from "@/constants";
import type { ItemUpdateFormData } from "../../../../schemas";
import type { Item } from "../../../../types";

interface CalculationBreakdownProps {
  item?: Item;
}

export function CalculationBreakdown({ item }: CalculationBreakdownProps) {
  const { colors } = useTheme();
  const { watch } = useFormContext<ItemUpdateFormData>();

  const monthlyConsumption = item?.monthlyConsumption ?? 0;
  const estimatedLeadTime = watch("estimatedLeadTime") ?? item?.estimatedLeadTime ?? null;
  const reorderPoint = watch("reorderPoint") ?? item?.reorderPoint ?? null;
  const maxQuantity = item?.maxQuantity ?? null;
  const abcCategory = item?.abcCategory ?? null;
  const xyzCategory = item?.xyzCategory ?? null;

  const formatValue = (value: number | null | undefined, suffix?: string) => {
    if (value === null || value === undefined) return "—";
    return suffix ? `${formatQuantity(value)} ${suffix}` : formatQuantity(value);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}>
      <ThemedText style={[styles.title, { color: colors.foreground }]}>
        Cálculo de Estoque
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Valores calculados automaticamente pelo sistema
      </ThemedText>

      <View style={styles.grid}>
        <Row label="Consumo Mensal" value={formatValue(monthlyConsumption, "un/mês")} colors={colors} />
        <Row label="Prazo de Entrega" value={estimatedLeadTime !== null ? `${estimatedLeadTime} dias` : "—"} colors={colors} />
        <Row label="Categoria ABC" value={abcCategory ? ABC_CATEGORY_LABELS[abcCategory] : "—"} colors={colors} />
        <Row label="Categoria XYZ" value={xyzCategory ? XYZ_CATEGORY_LABELS[xyzCategory] : "—"} colors={colors} />
        <Row label="Ponto de Reposição" value={formatValue(reorderPoint)} colors={colors} />
        <Row label="Quantidade Máxima" value={formatValue(maxQuantity)} colors={colors} />
      </View>
    </View>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border + "60" }]}>
      <ThemedText style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</ThemedText>
      <ThemedText style={[styles.rowValue, { color: colors.foreground }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  grid: {
    gap: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  rowLabel: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  rowValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
