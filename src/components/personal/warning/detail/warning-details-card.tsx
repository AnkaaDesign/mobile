
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconCalendar, IconUserShield, IconUsers, IconCategory } from "@tabler/icons-react-native";
import type { Warning } from '../../../../types';
import { WARNING_CATEGORY_LABELS } from "@/constants";
import { formatDate, formatDateTime } from "@/utils";

interface WarningDetailsCardProps {
  warning: Warning;
}

export function WarningDetailsCard({ warning }: WarningDetailsCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconCategory size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Detalhes e Datas</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Category Section */}
        <View style={styles.section}>
          <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
            Categoria
          </ThemedText>
          <View style={styles.fieldsContainer}>
            <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                Tipo de Advertência
              </ThemedText>
              <Badge variant="outline">
                <ThemedText style={styles.badgeText}>
                  {WARNING_CATEGORY_LABELS[warning.category]}
                </ThemedText>
              </Badge>
            </View>
          </View>
        </View>

        {/* Issued By Section */}
        <View style={StyleSheet.flatten([styles.section, styles.supervisorSection, { borderTopColor: colors.border + "50" }])}>
          <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
            Emitida Por
          </ThemedText>
          <View style={styles.fieldsContainer}>
            <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
              <View style={styles.fieldLabelWithIcon}>
                <IconUserShield size={16} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                  Supervisor
                </ThemedText>
              </View>
              <View style={styles.personInfo}>
                <ThemedText style={StyleSheet.flatten([styles.personName, { color: colors.foreground }])}>
                  {warning.supervisor?.name || "-"}
                </ThemedText>
                {warning.supervisor?.position && (
                  <ThemedText style={StyleSheet.flatten([styles.personPosition, { color: colors.mutedForeground }])}>
                    {warning.supervisor.position.name}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Witnesses Section */}
        {warning.witness && warning.witness.length > 0 && (
          <View style={StyleSheet.flatten([styles.section, styles.witnessSection, { borderTopColor: colors.border + "50" }])}>
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
              Testemunhas
            </ThemedText>
            <View style={StyleSheet.flatten([styles.witnessBox, { backgroundColor: colors.muted + "30" }])}>
              <View style={styles.witnessHeader}>
                <IconUsers size={16} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.witnessCount, { color: colors.mutedForeground }])}>
                  {warning.witness.length} pessoa{warning.witness.length !== 1 ? 's' : ''}
                </ThemedText>
              </View>
              <View style={styles.witnessContainer}>
                {warning.witness.map((w: any) => (
                  <View key={w.id} style={styles.witnessItem}>
                    <View style={StyleSheet.flatten([styles.witnessDot, { backgroundColor: colors.primary }])} />
                    <ThemedText style={StyleSheet.flatten([styles.witnessText, { color: colors.foreground }])}>
                      {w.name}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Dates Section */}
        <View style={StyleSheet.flatten([styles.section, styles.datesSection, { borderTopColor: colors.border + "50" }])}>
          <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
            Datas Importantes
          </ThemedText>
          <View style={styles.fieldsContainer}>
            <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
              <View style={styles.fieldLabelWithIcon}>
                <IconCalendar size={16} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                  Acompanhamento
                </ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                {formatDate(warning.followUpDate)}
              </ThemedText>
            </View>

            <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                Criada em
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                {formatDateTime(warning.createdAt)}
              </ThemedText>
            </View>

            <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                Atualizada em
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                {formatDateTime(warning.updatedAt)}
              </ThemedText>
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
  section: {
    gap: spacing.lg,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  supervisorSection: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  witnessSection: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
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
  personInfo: {
    alignItems: "flex-end",
  },
  personName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  personPosition: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  witnessBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  witnessHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  witnessCount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  witnessContainer: {
    gap: spacing.sm,
  },
  witnessItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  witnessDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  witnessText: {
    fontSize: fontSize.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
