import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { IconUser, IconBriefcase, IconBuilding, IconMail, IconPhone } from "@tabler/icons-react-native";
import type { Vacation } from '../../../../types';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { router } from "expo-router";
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes } from '../../../../constants';

interface EmployeeCardProps {
  vacation: Vacation;
}

export function EmployeeCard({ vacation }: EmployeeCardProps) {
  const { colors } = useTheme();

  const user = vacation.user;

  if (!user) {
    return null;
  }

  const handleNavigateToUser = () => {
    if (user?.id) {
      router.push(routeToMobilePath(routes.humanResources.employees.details(user.id)) as any);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconUser size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Funcionário</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <TouchableOpacity onPress={handleNavigateToUser} activeOpacity={0.7}>
          <View style={styles.employeeContent}>
            {/* Avatar and Name */}
            <View style={styles.employeeHeader}>
              <Avatar size="lg">
                {user.profilePictureUrl ? (
                  <AvatarImage source={{ uri: user.profilePictureUrl }} />
                ) : null}
                <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <View style={styles.employeeInfo}>
                <ThemedText style={StyleSheet.flatten([styles.employeeName, { color: colors.foreground }])}>
                  {user.name}
                </ThemedText>
                {user.position && (
                  <View style={styles.employeeDetail}>
                    <IconBriefcase size={14} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.employeeDetailText, { color: colors.mutedForeground }])}>
                      {user.position.name}
                    </ThemedText>
                  </View>
                )}
                {user.position?.sector && (
                  <View style={styles.employeeDetail}>
                    <IconBuilding size={14} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.employeeDetailText, { color: colors.mutedForeground }])}>
                      {user.position.sector.name}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Contact Information */}
            {(user.email || user.phone) && (
              <View style={StyleSheet.flatten([styles.contactSection, { borderTopColor: colors.border, borderTopWidth: 1 }])}>
                {user.email && (
                  <View style={StyleSheet.flatten([styles.contactItem, { backgroundColor: colors.muted + "20" }])}>
                    <IconMail size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.contactText, { color: colors.foreground }])}>
                      {user.email}
                    </ThemedText>
                  </View>
                )}
                {user.phone && (
                  <View style={StyleSheet.flatten([styles.contactItem, { backgroundColor: colors.muted + "20" }])}>
                    <IconPhone size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.contactText, { color: colors.foreground }])}>
                      {user.phone}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Tap to view hint */}
            <View style={styles.hintContainer}>
              <ThemedText style={StyleSheet.flatten([styles.hintText, { color: colors.mutedForeground }])}>
                Toque para ver detalhes do funcionário
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  employeeInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  employeeName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  employeeDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  employeeDetailText: {
    fontSize: fontSize.sm,
  },
  contactSection: {
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  contactText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  hintContainer: {
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  hintText: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
});
