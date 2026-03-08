import { View, StyleSheet } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import { IconCalendar, IconCurrencyDollar } from "@tabler/icons-react-native";
import { formatDate, formatCurrency, hasPrivilege } from '@/utils';
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants";

interface AirbrushingDatesCardProps {
  airbrushing: any;
}

export function AirbrushingDatesCard({ airbrushing }: AirbrushingDatesCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Check if user can view financial data (ADMIN or FINANCIAL only)
  const canViewFinancials = user && (
    hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) ||
    hasPrivilege(user, SECTOR_PRIVILEGES.FINANCIAL)
  );

  // Only show price if user has permission
  const showPrice = canViewFinancials && airbrushing.price;

  const hasDateInfo = airbrushing.startDate || airbrushing.finishDate || showPrice;

  if (!hasDateInfo) {
    return (
      <DetailCard title="Datas e Valores" icon="calendar">
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted + "30" }]}>
            <IconCalendar size={32} color={colors.mutedForeground} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>
            Nenhuma informação de datas
          </ThemedText>
          <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
            Este airbrushing não possui datas ou valores cadastrados.
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  return (
    <DetailCard title="Datas e Valores" icon="calendar">
      {airbrushing.startDate && (
        <DetailField
          label="Data de Início"
          icon="calendar"
          value={formatDate(airbrushing.startDate)}
        />
      )}

      {airbrushing.finishDate && (
        <DetailField
          label="Data de Finalização"
          icon="calendar-check"
          value={formatDate(airbrushing.finishDate)}
        />
      )}

      {showPrice && (
        <DetailField
          label="Preço do Airbrushing"
          icon="currency-dollar"
          value={
            <View style={styles.priceContainer}>
              <IconCurrencyDollar size={16} color={colors.success} />
              <ThemedText style={[styles.priceValue, { color: colors.success }]}>
                {formatCurrency(airbrushing.price)}
              </ThemedText>
            </View>
          }
        />
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  priceValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
