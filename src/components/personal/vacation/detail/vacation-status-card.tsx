
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconFileCheck } from "@tabler/icons-react-native";
import type { Vacation } from '../../../../types';
import { VACATION_STATUS_LABELS, getBadgeVariant } from '../../../../constants';
import { formatDate } from '../../../../utils';

interface VacationStatusCardProps {
  vacation: Vacation;
}

export function VacationStatusCard({ vacation }: VacationStatusCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconFileCheck size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Status de Aprovação</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          {/* Current Status Section */}
          <View style={styles.section}>
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
              Status Atual
            </ThemedText>
            <View style={styles.statusBadgeContainer}>
              <Badge variant={getBadgeVariant(vacation.status, "VACATION")}>
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>
                  {VACATION_STATUS_LABELS[vacation.status]}
                </ThemedText>
              </Badge>
            </View>
          </View>

          {/* Dates Section */}
          <View style={StyleSheet.flatten([styles.section, styles.datesSection, { borderTopColor: colors.border + "50" }])}>
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
              Datas de Registro
            </ThemedText>
            <View style={styles.fieldsContainer}>
              <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                  Criado em
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                  {formatDate(vacation.createdAt)}
                </ThemedText>
              </View>

              <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                  Última atualização
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                  {formatDate(vacation.updatedAt)}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Collective Vacation Info */}
          {vacation.isCollective && (
            <View style={StyleSheet.flatten([styles.infoBox, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
              <ThemedText style={StyleSheet.flatten([styles.infoText, { color: colors.foreground }])}>
                Esta é uma férias coletiva que se aplica a todos os funcionários. Férias coletivas são aprovadas automaticamente e não podem ser canceladas individualmente.
              </ThemedText>
            </View>
          )}
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
  statusBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  datesSection: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
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
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
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
