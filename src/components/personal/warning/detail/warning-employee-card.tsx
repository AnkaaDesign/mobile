
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconUser, IconBriefcase, IconMail, IconPhone, IconHash } from "@tabler/icons-react-native";
import type { Warning } from '../../../../types';
import { formatBrazilianPhone } from "@/utils";

interface WarningEmployeeCardProps {
  warning: Warning;
}

export function WarningEmployeeCard({ warning }: WarningEmployeeCardProps) {
  const { colors } = useTheme();

  const employee = warning.collaborator;

  if (!employee) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconUser size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Colaborador</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
              <IconUser size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
              Colaborador não encontrado
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
              As informações do colaborador não estão disponíveis.
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconUser size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Colaborador</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          {/* Employee Name Section */}
          <View style={styles.section}>
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
              Identificação
            </ThemedText>
            <View style={styles.fieldsContainer}>
              <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                  Nome Completo
                </ThemedText>
                <ThemedText
                  style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {employee.name}
                </ThemedText>
              </View>

              {employee.position && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <View style={styles.fieldLabelWithIcon}>
                    <IconBriefcase size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                      Cargo
                    </ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                    {employee.position.name}
                  </ThemedText>
                </View>
              )}

              {employee.id && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <View style={styles.fieldLabelWithIcon}>
                    <IconHash size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                      ID
                    </ThemedText>
                  </View>
                  <ThemedText
                    style={StyleSheet.flatten([styles.fieldValue, styles.monoText, { color: colors.foreground }])}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {employee.id}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Contact Information Section */}
          {(employee.email || employee.phone) && (
            <View style={StyleSheet.flatten([styles.section, styles.contactSection, { borderTopColor: colors.border + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                Contato
              </ThemedText>
              <View style={styles.fieldsContainer}>
                {employee.email && (
                  <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                    <View style={styles.fieldLabelWithIcon}>
                      <IconMail size={16} color={colors.mutedForeground} />
                      <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                        E-mail
                      </ThemedText>
                    </View>
                    <ThemedText
                      style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {employee.email}
                    </ThemedText>
                  </View>
                )}

                {employee.phone && (
                  <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                    <View style={styles.fieldLabelWithIcon}>
                      <IconPhone size={16} color={colors.mutedForeground} />
                      <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                        Telefone
                      </ThemedText>
                    </View>
                    <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                      {formatBrazilianPhone(employee.phone)}
                    </ThemedText>
                  </View>
                )}
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
  contactSection: {
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
  monoText: {
    fontFamily: "monospace",
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
