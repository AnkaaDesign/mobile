import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import type { Warning } from '../../../../types';
import { formatCPF } from '../../../../utils';
import { routes } from '../../../../constants';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailRow } from "@/components/ui/detail-row";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconUser, IconChevronRight } from "@tabler/icons-react-native";
import { extendedColors } from "@/lib/theme/extended-colors";
import { router } from "expo-router";
import { routeToMobilePath } from "@/lib/route-mapper";

interface EmployeeCardProps {
  warning: Warning;
}

export function EmployeeCard({ warning }: EmployeeCardProps) {
  const { colors, isDark } = useTheme();

  const handleEmployeePress = () => {
    if (warning.collaborator?.id) {
      router.push(routeToMobilePath(routes.administration.collaborators.details(warning.collaborator.id)) as any);
    }
  };

  if (!warning.collaborator) {
    return null;
  }

  // Count previous warnings if available
  const previousWarningsCount = warning.collaborator.warningsCollaborator?.filter((w) => w.id !== warning.id).length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconUser size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Colaborador</ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TouchableOpacity onPress={handleEmployeePress} activeOpacity={0.7}>
          <View style={StyleSheet.flatten([styles.employeeContainer, { backgroundColor: colors.muted + "30" }])}>
            <View style={styles.employeeInfo}>
              <ThemedText style={StyleSheet.flatten([styles.employeeName, { color: colors.foreground }])}>{warning.collaborator.name}</ThemedText>

              {warning.collaborator.cpf && <ThemedText style={StyleSheet.flatten([styles.employeeDetail, { color: colors.mutedForeground }])}>CPF: {formatCPF(warning.collaborator.cpf)}</ThemedText>}

              {warning.collaborator.position && (
                <ThemedText style={StyleSheet.flatten([styles.employeeDetail, { color: colors.mutedForeground }])}>Cargo: {warning.collaborator.position.name}</ThemedText>
              )}

              {warning.collaborator.sector && (
                <ThemedText style={StyleSheet.flatten([styles.employeeDetail, { color: colors.mutedForeground }])}>Setor: {warning.collaborator.sector.name}</ThemedText>
              )}

              {previousWarningsCount > 0 && (
                <View style={styles.warningsCountContainer}>
                  <Badge variant="warning">
                    <ThemedText style={styles.warningsCountText}>
                      {previousWarningsCount} advertência{previousWarningsCount !== 1 ? "s" : ""} anterior{previousWarningsCount !== 1 ? "es" : ""}
                    </ThemedText>
                  </Badge>
                </View>
              )}
            </View>

            <View style={StyleSheet.flatten([styles.chevronContainer, { backgroundColor: colors.primary + "10" }])}>
              <IconChevronRight size={20} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
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
  employeeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  employeeInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  employeeName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  employeeDetail: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
  },
  warningsCountContainer: {
    marginTop: spacing.sm,
    alignItems: "flex-start",
  },
  warningsCountText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
