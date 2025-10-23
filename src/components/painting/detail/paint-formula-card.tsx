import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { router } from "expo-router";
import {
  IconFlask,
  IconDroplet,
  IconCurrencyReal,
  IconChevronRight,
  IconBeaker,
} from "@tabler/icons-react-native";
import type { PaintFormula, PaintFormulaComponent } from "@/types";
import { formatCurrency } from "@/utils";

interface PaintFormulaCardProps {
  formulas?: (PaintFormula & {
    components?: (PaintFormulaComponent & {
      item?: {
        id: string;
        name: string;
        code?: string | null;
      };
    })[];
    _count?: {
      components?: number;
      productions?: number;
    };
  })[];
  paintId: string;
}

export const PaintFormulaCard: React.FC<PaintFormulaCardProps> = ({ formulas, paintId }) => {
  const { colors } = useTheme();

  if (!formulas || formulas.length === 0) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <IconFlask size={20} color={colors.primary} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Fórmulas
          </ThemedText>
        </View>
        <View style={styles.emptyState}>
          <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Nenhuma fórmula cadastrada
          </ThemedText>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/(tabs)/painting/formulas/create?paintId=${paintId}`)}
          >
            <ThemedText style={[styles.createButtonText, { color: colors.primaryForeground }]}>
              Criar Primeira Fórmula
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  const handleFormulaPress = (formulaId: string) => {
    router.push(`/(tabs)/painting/formulas/details/${formulaId}`);
  };

  const getBestFormula = () => {
    // Find formula with lowest price per liter
    return formulas.reduce((best, current) => {
      if (!best || (current.pricePerLiter && current.pricePerLiter < (best.pricePerLiter || Infinity))) {
        return current;
      }
      return best;
    }, formulas[0]);
  };

  const bestFormula = getBestFormula();

  return (
    <Card style={styles.card}>
      {/* Header with icon and title */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconFlask size={20} color={colors.primary} />
        <ThemedText style={[styles.title, { color: colors.foreground }]}>
          Fórmulas
        </ThemedText>
        <Badge variant="secondary" style={{ marginLeft: "auto" }}>
          {formulas.length} {formulas.length === 1 ? "fórmula" : "fórmulas"}
        </Badge>
      </View>

      <View style={styles.content}>
        {formulas.map((formula, index) => (
          <TouchableOpacity
            key={formula.id}
            style={[
              styles.formulaItem,
              {
                borderColor: colors.border,
                backgroundColor: formula.id === bestFormula?.id ? colors.accent : "transparent"
              }
            ]}
            onPress={() => handleFormulaPress(formula.id)}
            activeOpacity={0.7}
          >
            <View style={styles.formulaContent}>
              {/* Formula header */}
              <View style={styles.formulaHeader}>
                <View style={styles.formulaTitleContainer}>
                  <ThemedText style={[styles.formulaTitle, { color: colors.foreground }]}>
                    {formula.description}
                  </ThemedText>
                  {formula.id === bestFormula?.id && (
                    <Badge variant="default" style={styles.bestBadge}>
                      Melhor Custo
                    </Badge>
                  )}
                </View>
                <IconChevronRight size={20} color={colors.mutedForeground} />
              </View>

              {/* Formula details */}
              <View style={styles.formulaDetails}>
                {/* Density */}
                <View style={styles.detailItem}>
                  <IconDroplet size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Densidade:
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                    {formula.density ? `${formula.density.toFixed(2)} g/ml` : "N/A"}
                  </ThemedText>
                </View>

                {/* Price per liter */}
                <View style={styles.detailItem}>
                  <IconCurrencyReal size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Preço/Litro:
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                    {formula.pricePerLiter ? formatCurrency(formula.pricePerLiter) : "N/A"}
                  </ThemedText>
                </View>

                {/* Components count */}
                <View style={styles.detailItem}>
                  <IconBeaker size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Componentes:
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                    {formula._count?.components || formula.components?.length || 0}
                  </ThemedText>
                </View>
              </View>

              {/* Component preview (first 3 components) */}
              {formula.components && formula.components.length > 0 && (
                <View style={styles.componentPreview}>
                  <Separator style={styles.separator} />
                  <View style={styles.componentList}>
                    {formula.components.slice(0, 3).map((component) => (
                      <View key={component.id} style={styles.componentItem}>
                        <ThemedText style={[styles.componentName, { color: colors.foreground }]}>
                          {component.item?.name || "Componente"}
                        </ThemedText>
                        <Badge variant="outline" style={styles.componentRatio}>
                          {component.ratio.toFixed(1)}%
                        </Badge>
                      </View>
                    ))}
                    {formula.components.length > 3 && (
                      <ThemedText style={[styles.moreComponents, { color: colors.mutedForeground }]}>
                        +{formula.components.length - 3} mais...
                      </ThemedText>
                    )}
                  </View>
                </View>
              )}

              {/* Production count */}
              {formula._count?.productions !== undefined && formula._count.productions > 0 && (
                <View style={[styles.productionInfo, { backgroundColor: colors.muted }]}>
                  <ThemedText style={[styles.productionText, { color: colors.mutedForeground }]}>
                    Usada em {formula._count.productions} produção{formula._count.productions !== 1 ? "ções" : ""}
                  </ThemedText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Add formula button */}
        <TouchableOpacity
          style={[styles.addButton, { borderColor: colors.primary }]}
          onPress={() => router.push(`/(tabs)/painting/formulas/create?paintId=${paintId}`)}
          activeOpacity={0.7}
        >
          <IconFlask size={20} color={colors.primary} />
          <ThemedText style={[styles.addButtonText, { color: colors.primary }]}>
            Adicionar Fórmula
          </ThemedText>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.md,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  createButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  createButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  formulaItem: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  formulaContent: {
    padding: spacing.md,
  },
  formulaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  formulaTitleContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  formulaTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  bestBadge: {
    alignSelf: "flex-start",
  },
  formulaDetails: {
    gap: spacing.xs,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  componentPreview: {
    marginTop: spacing.sm,
  },
  separator: {
    marginBottom: spacing.sm,
  },
  componentList: {
    gap: spacing.xs,
  },
  componentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  componentName: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  componentRatio: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  moreComponents: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  productionInfo: {
    marginTop: spacing.sm,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  productionText: {
    fontSize: fontSize.xs,
    textAlign: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    borderStyle: "dashed",
  },
  addButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});