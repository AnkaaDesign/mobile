
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import type { Vacation } from '../../../../types';
import { VACATION_STATUS_LABELS, getBadgeVariant } from "@/constants";
import { formatDate } from "@/utils";

interface VacationStatusCardProps {
  vacation: Vacation;
}

export function VacationStatusCard({ vacation }: VacationStatusCardProps) {
  const { colors } = useTheme();

  return (
    <DetailCard title="Status de Aprovação" icon="file-check">
      <View style={styles.content}>
        <DetailSection title="Status Atual">
          <DetailField
            label="Status"
            value={
              <Badge variant={getBadgeVariant(vacation.status, "VACATION")}>
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>
                  {VACATION_STATUS_LABELS[vacation.status]}
                </ThemedText>
              </Badge>
            }
          />
        </DetailSection>

        <DetailSection title="Datas de Registro">
          <DetailField label="Criado em" value={formatDate(vacation.createdAt)} />
          <DetailField label="Última atualização" value={formatDate(vacation.updatedAt)} />
        </DetailSection>

        {/* Collective Vacation Info */}
        {vacation.isCollective && (
          <View style={StyleSheet.flatten([styles.infoBox, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
            <ThemedText style={StyleSheet.flatten([styles.infoText, { color: colors.foreground }])}>
              Esta é uma férias coletiva que se aplica a todos os funcionários. Férias coletivas são aprovadas automaticamente e não podem ser canceladas individualmente.
            </ThemedText>
          </View>
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  infoBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
});
