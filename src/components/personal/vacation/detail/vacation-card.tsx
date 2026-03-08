
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { Vacation } from '../../../../types';
import { VACATION_STATUS_LABELS, VACATION_TYPE_LABELS, getBadgeVariant } from "@/constants";

interface VacationCardProps {
  vacation: Vacation;
}

export function VacationCard({ vacation }: VacationCardProps) {
  const { colors } = useTheme();

  return (
    <DetailCard title="Informações Básicas" icon="beach">
      <View style={styles.content}>
        <DetailSection title="Status e Tipo">
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
          <DetailField
            label="Tipo"
            value={
              <Badge variant="outline">
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.foreground }])}>
                  {VACATION_TYPE_LABELS[vacation.type]}
                </ThemedText>
              </Badge>
            }
          />
          {vacation.isCollective && (
            <DetailField
              label="Modalidade"
              value={
                <Badge variant="info">
                  <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>
                    Coletivas
                  </ThemedText>
                </Badge>
              }
            />
          )}
        </DetailSection>

        {vacation.user && (
          <DetailSection title="Colaborador">
            <DetailField label="Nome" value={vacation.user.name} icon="user" />
          </DetailSection>
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
});
