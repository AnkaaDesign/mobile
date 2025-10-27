import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconUsers, IconUser, IconUserCheck, IconUserX } from "@tabler/icons-react-native";
import { ASSIGNMENT_TYPE, ASSIGNMENT_TYPE_LABELS } from '../../../../../constants';
import type { PpeDeliverySchedule } from '../../../../../types';

interface EmployeeCardProps {
  schedule: PpeDeliverySchedule;
}

export function EmployeeCard({ schedule }: EmployeeCardProps) {
  const { colors, isDark } = useTheme();

  const getAssignmentColor = (type: ASSIGNMENT_TYPE) => {
    switch (type) {
      case ASSIGNMENT_TYPE.ALL:
        return {
          bg: isDark ? extendedColors.green[900] : extendedColors.green[100],
          text: isDark ? extendedColors.green[400] : extendedColors.green[700],
          icon: isDark ? extendedColors.green[400] : extendedColors.green[600],
        };
      case ASSIGNMENT_TYPE.ALL_EXCEPT:
        return {
          bg: isDark ? extendedColors.yellow[900] : extendedColors.yellow[100],
          text: isDark ? extendedColors.yellow[400] : extendedColors.yellow[700],
          icon: isDark ? extendedColors.yellow[400] : extendedColors.yellow[600],
        };
      case ASSIGNMENT_TYPE.SPECIFIC:
        return {
          bg: isDark ? extendedColors.blue[900] : extendedColors.blue[100],
          text: isDark ? extendedColors.blue[400] : extendedColors.blue[700],
          icon: isDark ? extendedColors.blue[400] : extendedColors.blue[600],
        };
      default:
        return {
          bg: colors.muted,
          text: colors.mutedForeground,
          icon: colors.mutedForeground,
        };
    }
  };

  const assignmentColors = getAssignmentColor(schedule.assignmentType);

  const getAssignmentIcon = () => {
    switch (schedule.assignmentType) {
      case ASSIGNMENT_TYPE.ALL:
        return <IconUsers size={18} color={assignmentColors.icon} />;
      case ASSIGNMENT_TYPE.ALL_EXCEPT:
        return <IconUserX size={18} color={assignmentColors.icon} />;
      case ASSIGNMENT_TYPE.SPECIFIC:
        return <IconUserCheck size={18} color={assignmentColors.icon} />;
      default:
        return <IconUser size={18} color={assignmentColors.icon} />;
    }
  };

  const getAssignmentDescription = () => {
    switch (schedule.assignmentType) {
      case ASSIGNMENT_TYPE.ALL:
        return "Todos os funcionários receberão EPIs deste cronograma";
      case ASSIGNMENT_TYPE.ALL_EXCEPT:
        return `Todos exceto ${schedule.excludedUserIds?.length || 0} funcionário(s)`;
      case ASSIGNMENT_TYPE.SPECIFIC:
        return `${schedule.includedUserIds?.length || 0} funcionário(s) específico(s)`;
      default:
        return "";
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconUsers size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Atribuição de Funcionários
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.content}>
          {/* Assignment Type Badge */}
          <View
            style={StyleSheet.flatten([
              styles.assignmentBadge,
              { backgroundColor: assignmentColors.bg },
            ])}
          >
            <View style={styles.badgeIcon}>{getAssignmentIcon()}</View>
            <View style={styles.badgeContent}>
              <ThemedText
                style={StyleSheet.flatten([
                  styles.badgeLabel,
                  { color: assignmentColors.text },
                ])}
              >
                Tipo de Atribuição
              </ThemedText>
              <ThemedText
                style={StyleSheet.flatten([
                  styles.badgeValue,
                  { color: assignmentColors.text },
                ])}
              >
                {ASSIGNMENT_TYPE_LABELS[schedule.assignmentType]}
              </ThemedText>
            </View>
          </View>

          {/* Description */}
          <View
            style={StyleSheet.flatten([
              styles.descriptionBox,
              { backgroundColor: colors.muted + "30" },
            ])}
          >
            <ThemedText
              style={StyleSheet.flatten([styles.description, { color: colors.mutedForeground }])}
            >
              {getAssignmentDescription()}
            </ThemedText>
          </View>

          {/* Excluded Users List */}
          {schedule.assignmentType === ASSIGNMENT_TYPE.ALL_EXCEPT &&
            schedule.excludedUserIds &&
            schedule.excludedUserIds.length > 0 && (
              <View style={styles.usersList}>
                <ThemedText
                  style={StyleSheet.flatten([styles.usersLabel, { color: colors.foreground }])}
                >
                  Funcionários Excluídos
                </ThemedText>
                <View
                  style={StyleSheet.flatten([
                    styles.usersCount,
                    { backgroundColor: colors.muted + "50" },
                  ])}
                >
                  <IconUserX size={16} color={colors.mutedForeground} />
                  <ThemedText
                    style={StyleSheet.flatten([
                      styles.usersCountText,
                      { color: colors.foreground },
                    ])}
                  >
                    {schedule.excludedUserIds.length} funcionário(s)
                  </ThemedText>
                </View>
              </View>
            )}

          {/* Included Users List */}
          {schedule.assignmentType === ASSIGNMENT_TYPE.SPECIFIC &&
            schedule.includedUserIds &&
            schedule.includedUserIds.length > 0 && (
              <View style={styles.usersList}>
                <ThemedText
                  style={StyleSheet.flatten([styles.usersLabel, { color: colors.foreground }])}
                >
                  Funcionários Incluídos
                </ThemedText>
                <View
                  style={StyleSheet.flatten([
                    styles.usersCount,
                    { backgroundColor: colors.muted + "50" },
                  ])}
                >
                  <IconUserCheck size={16} color={colors.mutedForeground} />
                  <ThemedText
                    style={StyleSheet.flatten([
                      styles.usersCountText,
                      { color: colors.foreground },
                    ])}
                  >
                    {schedule.includedUserIds.length} funcionário(s)
                  </ThemedText>
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
  assignmentBadge: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    alignItems: "center",
  },
  badgeIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeContent: {
    flex: 1,
  },
  badgeLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs / 2,
  },
  badgeValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  descriptionBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  description: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  usersList: {
    gap: spacing.sm,
  },
  usersLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  usersCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  usersCountText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
