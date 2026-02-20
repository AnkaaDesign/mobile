import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconComponents, IconWeight } from "@tabler/icons-react-native";
import type { PaintProduction } from '../../../../types';

interface ComponentsUsedCardProps {
  production: PaintProduction;
}

export function ComponentsUsedCard({ production }: ComponentsUsedCardProps) {
  const { colors } = useTheme();
  const formula = production.formula;
  const components = formula?.components || [];
  const totalWeightGrams = production.volumeLiters * Number(formula?.density || 1) * 1000;

  if (!formula || components.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconComponents size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Componentes Utilizados</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={[styles.table, { borderColor: colors.border + "50" }]}>
          {/* Header Row */}
          <View style={[styles.tableHeaderRow, { backgroundColor: colors.muted }]}>
            <View style={[styles.tableHeaderCell, styles.componentColumn]}>
              <ThemedText style={StyleSheet.flatten([styles.tableHeaderText, { color: colors.foreground }])} numberOfLines={1}>
                COMPONENTE
              </ThemedText>
            </View>
            <View style={[styles.tableHeaderCell, styles.quantityColumn]}>
              <ThemedText style={StyleSheet.flatten([styles.tableHeaderText, { color: colors.foreground }])} numberOfLines={1}>
                QUANTIDADE
              </ThemedText>
            </View>
          </View>

          {/* Component Rows */}
          {components
            .sort((a, b) => b.ratio - a.ratio)
            .map((component, index) => {
              const componentWeightGrams = (totalWeightGrams * component.ratio) / 100;
              const isLastRow = index === components.length - 1;

              return (
                <View
                  key={component.id}
                  style={[
                    styles.tableRow,
                    { borderBottomColor: colors.border },
                    !isLastRow && styles.tableRowBorder,
                  ]}
                >
                  <View style={[styles.tableCell, styles.componentColumn]}>
                    <View style={styles.componentInfo}>
                      {component.item?.uniCode && (
                        <ThemedText style={StyleSheet.flatten([styles.uniCode, { color: colors.mutedForeground }])} numberOfLines={1} ellipsizeMode="tail">
                          {component.item.uniCode}
                        </ThemedText>
                      )}
                      <ThemedText style={StyleSheet.flatten([styles.componentName, { color: colors.foreground }])} numberOfLines={1} ellipsizeMode="tail">
                        {component.item?.name || "Item não encontrado"}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.tableCell, styles.quantityColumn]}>
                    <View style={styles.quantityInfo}>
                      <IconWeight size={14} color={colors.mutedForeground} />
                      <ThemedText
                        style={StyleSheet.flatten([
                          componentWeightGrams >= 100 ? styles.quantityLarge : styles.quantityMedium,
                          { color: colors.foreground },
                        ])}
                        numberOfLines={1}
                      >
                        {componentWeightGrams < 20 ? componentWeightGrams.toFixed(2) : Math.round(componentWeightGrams)} g
                      </ThemedText>
                    </View>
                  </View>
                </View>
              );
            })}

          {/* Total Row */}
          <View style={[styles.tableRow, styles.totalRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={[styles.tableCell, styles.componentColumn]}>
              <ThemedText style={StyleSheet.flatten([styles.totalText, { color: colors.foreground }])}>
                Total
              </ThemedText>
            </View>
            <View style={[styles.tableCell, styles.quantityColumn]}>
              <View style={styles.quantityInfo}>
                <IconWeight size={14} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.totalQuantity, { color: colors.foreground }])}>
                  {Math.round(totalWeightGrams)} g
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  table: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
  },
  tableHeaderCell: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tableHeaderText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableRowBorder: {
    borderBottomWidth: 1,
  },
  tableCell: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
  },
  componentColumn: {
    flex: 1,
  },
  quantityColumn: {
    alignItems: "flex-end",
  },
  componentInfo: {
    gap: spacing.xxs,
  },
  uniCode: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
  },
  componentName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  quantityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  quantityMedium: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  quantityLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  totalRow: {
    borderTopWidth: 2,
  },
  totalText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  totalQuantity: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
