import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { PpeDelivery } from '@/types';
import { formatDate, formatDateTime } from '@/utils';
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";

interface TeamPpeDeliveryCardProps {
  delivery: PpeDelivery;
}

export function TeamPpeDeliveryCard({ delivery }: TeamPpeDeliveryCardProps) {
  const { colors } = useTheme();

  return (
    <DetailCard title="Informações de Entrega" icon="truck">
      {delivery.scheduledDate && (
        <DetailField
          label="Data Programada"
          icon="calendar"
          value={formatDate(new Date(delivery.scheduledDate))}
        />
      )}

      {delivery.actualDeliveryDate && (
        <DetailField
          label="Data de Entrega"
          icon="calendar"
          value={formatDate(new Date(delivery.actualDeliveryDate))}
        />
      )}

      {delivery.reviewedByUser && (
        <DetailField
          label="Aprovado Por"
          icon="user"
          value={delivery.reviewedByUser.name}
        />
      )}

      <DetailField
        label="Cadastrado Em"
        icon="clock"
        value={formatDateTime(new Date(delivery.createdAt))}
      />

      {delivery.reason && (
        <View style={[styles.notesContainer, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}>
          <ThemedText style={[styles.notesLabel, { color: colors.mutedForeground }]}>
            Motivo
          </ThemedText>
          <ThemedText style={[styles.notesText, { color: colors.foreground }]}>
            {delivery.reason}
          </ThemedText>
        </View>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  notesContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  notesLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
