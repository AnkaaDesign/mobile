import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconUsers, IconChevronRight, IconUser } from "@tabler/icons-react-native";
import type { Position } from '../../../../types';
import { routes, USER_STATUS_LABELS } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

interface EmployeesCardProps {
  position: Position;
}

export function EmployeesCard({ position }: EmployeesCardProps) {
  const { colors } = useTheme();

  const employees = position.users || [];
  const hasEmployees = employees.length > 0;

  const handleEmployeePress = (userId: string) => {
    router.push(routeToMobilePath(routes.administration.users.details(userId)) as any);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconUsers size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Colaboradores ({employees.length})
            </ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasEmployees ? (
          <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "30" }])}>
            <IconUser size={32} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.emptyStateText, { color: colors.mutedForeground }])}>
              Nenhum colaborador neste cargo
            </ThemedText>
          </View>
        ) : (
          <View style={styles.employeesList}>
            {employees.slice(0, 10).map((employee, index) => (
              <TouchableOpacity
                key={employee.id}
                onPress={() => handleEmployeePress(employee.id)}
                style={StyleSheet.flatten([
                  styles.employeeItem,
                  {
                    backgroundColor: colors.muted + "20",
                    borderBottomWidth: index < Math.min(employees.length, 10) - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  },
                ])}
                activeOpacity={0.7}
              >
                <View style={styles.employeeContent}>
                  <View style={styles.employeeInfo}>
                    <View style={StyleSheet.flatten([styles.employeeIcon, { backgroundColor: colors.primary + "10" }])}>
                      <IconUser size={16} color={colors.primary} />
                    </View>
                    <View style={styles.employeeDetails}>
                      <ThemedText style={StyleSheet.flatten([styles.employeeName, { color: colors.foreground }])}>{employee.name}</ThemedText>
                      {employee.email && (
                        <ThemedText style={StyleSheet.flatten([styles.employeeEmail, { color: colors.mutedForeground }])}>
                          {employee.email}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  <View style={styles.employeeActions}>
                    {employee.status && (
                      <Badge variant="secondary" style={styles.statusBadge}>
                        <ThemedText style={StyleSheet.flatten([styles.statusText, { color: colors.foreground }])}>
                          {USER_STATUS_LABELS[employee.status]}
                        </ThemedText>
                      </Badge>
                    )}
                    <IconChevronRight size={18} color={colors.mutedForeground} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {employees.length > 10 && (
              <View style={StyleSheet.flatten([styles.moreEmployees, { backgroundColor: colors.muted + "30" }])}>
                <ThemedText style={StyleSheet.flatten([styles.moreEmployeesText, { color: colors.mutedForeground }])}>
                  +{employees.length - 10} {employees.length - 10 === 1 ? "colaborador" : "colaboradores"}
                </ThemedText>
              </View>
            )}
          </View>
        )}
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
  emptyState: {
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyStateText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  employeesList: {
    gap: 0,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  employeeItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  employeeContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  employeeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  employeeIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  employeeDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  employeeName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  employeeEmail: {
    fontSize: fontSize.xs,
  },
  employeeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  moreEmployees: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    alignItems: "center",
  },
  moreEmployeesText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
