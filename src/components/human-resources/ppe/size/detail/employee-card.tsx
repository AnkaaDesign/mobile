
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconUser, IconBuilding, IconBriefcase, IconId } from "@tabler/icons-react-native";
import type { PpeSize } from '../../../../../types';
import { USER_STATUS_LABELS } from "@/constants";
import { formatCPF } from "@/utils";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

interface EmployeeCardProps {
  ppeSize: PpeSize;
}

export function EmployeeCard({ ppeSize }: EmployeeCardProps) {
  const { colors } = useTheme();

  if (!ppeSize.user) {
    return null;
  }

  const user = ppeSize.user;

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconUser size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>Informações do Funcionário</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.employeeContent}>
          {/* Name and Status */}
          <View style={styles.employeeHeader}>
            <View style={styles.nameSection}>
              <ThemedText style={StyleSheet.flatten([styles.employeeName, { color: colors.foreground }])}>{user.name}</ThemedText>
              {user.status && (
                <Badge variant={user.status !== "DISMISSED" ? "success" : "secondary"}>
                  <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>{USER_STATUS_LABELS[user.status]}</ThemedText>
                </Badge>
              )}
            </View>
            {user.email && <ThemedText style={StyleSheet.flatten([styles.employeeEmail, { color: colors.mutedForeground }])}>{user.email}</ThemedText>}
          </View>

          {/* Employee Details */}
          <View style={styles.detailsGrid}>
            {user.cpf && (
              <View style={StyleSheet.flatten([styles.detailItem, { backgroundColor: colors.muted + "30" }])}>
                <View style={styles.detailHeader}>
                  <IconId size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>CPF</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{formatCPF(user.cpf)}</ThemedText>
              </View>
            )}

            {user.position && (
              <View style={StyleSheet.flatten([styles.detailItem, { backgroundColor: colors.muted + "30" }])}>
                <View style={styles.detailHeader}>
                  <IconBriefcase size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Cargo</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{user.position.name}</ThemedText>
              </View>
            )}

            {user.position?.sector && (
              <View style={StyleSheet.flatten([styles.detailItem, { backgroundColor: colors.muted + "30" }])}>
                <View style={styles.detailHeader}>
                  <IconBuilding size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Setor</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{user.position.sector.name}</ThemedText>
              </View>
            )}

            {user.pis && (
              <View style={StyleSheet.flatten([styles.detailItem, { backgroundColor: colors.muted + "30" }])}>
                <View style={styles.detailHeader}>
                  <IconId size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>PIS</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{user.pis}</ThemedText>
              </View>
            )}
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.md,
  },
  employeeContent: {
    gap: spacing.lg,
  },
  employeeHeader: {
    gap: spacing.sm,
  },
  nameSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  employeeName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  employeeEmail: {
    fontSize: fontSize.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  detailsGrid: {
    gap: spacing.md,
  },
  detailItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
