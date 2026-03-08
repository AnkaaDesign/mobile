import { View, StyleSheet } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { fontSize } from "@/constants/design-system";
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
    <DetailCard title="Informações da Produção" icon="flask">
      <DetailField
        label="Volume Produzido"
        icon="droplet"
        value={
          <View>
            <ThemedText style={[styles.valueLarge, { color: colors.foreground }]}>
              {production.volumeLiters.toFixed(2)} L
            </ThemedText>
            <ThemedText style={[styles.valueSmall, { color: colors.mutedForeground }]}>
              {(production.volumeLiters * 1000).toFixed(0)} mL
            </ThemedText>
          </View>
        }
      />

      <DetailField
        label="Peso Total"
        icon="weight"
        value={
          <View>
            <ThemedText style={[styles.valueLarge, { color: colors.foreground }]}>
              {Math.round(totalWeightGrams)} g
            </ThemedText>
            <ThemedText style={[styles.valueSmall, { color: colors.mutedForeground }]}>
              {(totalWeightGrams / 1000).toFixed(2)} kg
            </ThemedText>
          </View>
        }
      />

      <DetailField
        label="Data de Produção"
        icon="calendar"
        value={formatDateTime(production.createdAt)}
      />
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  valueLarge: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  valueSmall: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
