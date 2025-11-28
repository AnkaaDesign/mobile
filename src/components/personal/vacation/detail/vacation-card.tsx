
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBeach, IconUser } from "@tabler/icons-react-native";
import type { Vacation } from '../../../../types';
import { VACATION_STATUS_LABELS, VACATION_TYPE_LABELS, getBadgeVariant } from "@/constants";

interface VacationCardProps {
  vacation: Vacation;
}

export function VacationCard({ vacation }: VacationCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconBeach size={20} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>Informações Básicas</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          {/* Status and Type Section */}
          <View style={styles.section}>
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
              Status e Tipo
            </ThemedText>
            <View style={styles.badgesContainer}>
              <View style={styles.badgeWrapper}>
                <ThemedText style={StyleSheet.flatten([styles.badgeLabel, { color: colors.mutedForeground }])}>
                  Status
                </ThemedText>
                <Badge variant={getBadgeVariant(vacation.status, "VACATION")}>
                  <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>
                    {VACATION_STATUS_LABELS[vacation.status]}
                  </ThemedText>
                </Badge>
              </View>
              <View style={styles.badgeWrapper}>
                <ThemedText style={StyleSheet.flatten([styles.badgeLabel, { color: colors.mutedForeground }])}>
                  Tipo
                </ThemedText>
                <Badge variant="outline">
                  <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.foreground }])}>
                    {VACATION_TYPE_LABELS[vacation.type]}
                  </ThemedText>
                </Badge>
              </View>
              {vacation.isCollective && (
                <View style={styles.badgeWrapper}>
                  <ThemedText style={StyleSheet.flatten([styles.badgeLabel, { color: colors.mutedForeground }])}>
                    Modalidade
                  </ThemedText>
                  <Badge variant="info">
                    <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>
                      Coletivas
                    </ThemedText>
                  </Badge>
                </View>
              )}
            </View>
          </View>

          {/* User Information Section */}
          {vacation.user && (
            <View style={StyleSheet.flatten([styles.section, styles.userSection, { borderTopColor: colors.border + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                Colaborador
              </ThemedText>
              <View style={styles.fieldsContainer}>
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <View style={styles.fieldLabelWithIcon}>
                    <IconUser size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                      Nome
                    </ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                    {vacation.user.name}
                  </ThemedText>
                </View>
              </View>
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
  badgesContainer: {
    gap: spacing.md,
  },
  badgeWrapper: {
    gap: spacing.xs,
  },
  badgeLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textTransform: "uppercase",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  userSection: {
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
});
