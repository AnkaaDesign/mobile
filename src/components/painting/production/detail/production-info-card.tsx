import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconFlask, IconDroplet, IconWeight, IconCalendar } from "@tabler/icons-react-native";
import type { PaintProduction } from '../../../../types';
import { formatDateTime } from "@/utils";

interface ProductionInfoCardProps {
  production: PaintProduction;
}

export function ProductionInfoCard({ production }: ProductionInfoCardProps) {
  const { colors } = useTheme();
  const formula = production.formula;
  const totalWeightGrams = production.volumeLiters * Number(formula?.density || 1) * 1000;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconFlask size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações da Produção</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          {/* Production Metrics Section */}
          <View style={styles.section}>
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
              Dados de Produção
            </ThemedText>
            <View style={styles.fieldsContainer}>
              {/* Volume */}
              <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                <View style={styles.fieldLabelWithIcon}>
                  <IconDroplet size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Volume Produzido
                  </ThemedText>
                </View>
                <View style={styles.valueContainer}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldValueLarge, { color: colors.foreground }])}>
                    {production.volumeLiters.toFixed(2)} L
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.fieldValueSmall, { color: colors.mutedForeground }])}>
                    {(production.volumeLiters * 1000).toFixed(0)} mL
                  </ThemedText>
                </View>
              </View>

              {/* Weight */}
              <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                <View style={styles.fieldLabelWithIcon}>
                  <IconWeight size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Peso Total
                  </ThemedText>
                </View>
                <View style={styles.valueContainer}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldValueLarge, { color: colors.foreground }])}>
                    {Math.round(totalWeightGrams)} g
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.fieldValueSmall, { color: colors.mutedForeground }])}>
                    Densidade: {formula?.density ? Number(formula.density).toFixed(2) : "1.00"} g/ml
                  </ThemedText>
                </View>
              </View>

              {/* Date */}
              <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                <View style={styles.fieldLabelWithIcon}>
                  <IconCalendar size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Data de Produção
                  </ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                  {formatDateTime(production.createdAt)}
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
  infoContainer: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.lg,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  fieldsContainer: {
    gap: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
  valueContainer: {
    alignItems: "flex-end",
  },
  fieldValueLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  fieldValueSmall: {
    fontSize: fontSize.xs,
    marginTop: spacing.xxs,
  },
});
