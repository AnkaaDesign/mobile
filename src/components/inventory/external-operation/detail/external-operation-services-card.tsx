import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { ExternalOperationServiceItem } from "@/types";
import { formatCurrency } from "@/utils";
import { useCanViewPrices } from "@/hooks";

interface ExternalOperationServicesCardProps {
  services: ExternalOperationServiceItem[];
}

/**
 * Read-only list of ad-hoc services billed on a CHARGEABLE "Operação Externa".
 * Rendered only when the withdrawal has services.
 */
export function ExternalOperationServicesCard({ services }: ExternalOperationServicesCardProps) {
  const { colors } = useTheme();
  const canViewPrices = useCanViewPrices();

  if (!services || services.length === 0) return null;

  const sorted = [...services].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const total = sorted.reduce((sum, service) => sum + (service.amount || 0), 0);

  return (
    <DetailCard
      title="Serviços"
      icon="briefcase"
      badge={<Badge variant="secondary">{sorted.length}</Badge>}
    >
      <View style={styles.content}>
        {sorted.map((service, index) => (
          <View
            key={service.id}
            style={[
              styles.row,
              {
                borderBottomColor: colors.border,
                borderBottomWidth: index < sorted.length - 1 ? StyleSheet.hairlineWidth : 0,
              },
            ]}
          >
            <ThemedText style={[styles.description, { color: colors.foreground }]}>
              {service.description}
            </ThemedText>
            {canViewPrices && (
              <ThemedText style={[styles.amount, { color: colors.foreground }]}>
                {formatCurrency(service.amount)}
              </ThemedText>
            )}
          </View>
        ))}

        {canViewPrices && (
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <ThemedText style={[styles.totalLabel, { color: colors.mutedForeground }]}>
              Total dos Serviços
            </ThemedText>
            <ThemedText style={[styles.totalValue, { color: colors.foreground }]}>
              {formatCurrency(total)}
            </ThemedText>
          </View>
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  description: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  amount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  totalValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
