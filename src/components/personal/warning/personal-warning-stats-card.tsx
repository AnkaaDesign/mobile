import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { WARNING_SEVERITY_LABELS, WARNING_SEVERITY } from "@/constants";
import type { Warning } from '../../../types';
import { Icon } from "@/components/ui/icon";

interface PersonalWarningStatsCardProps {
  warnings: Warning[];
}

export const PersonalWarningStatsCard = ({ warnings }: PersonalWarningStatsCardProps) => {
  const { colors, isDark } = useTheme();

  const stats = useMemo(() => {
    const total = warnings.length;
    const active = warnings.filter((w) => w.isActive).length;
    const resolved = warnings.filter((w) => !w.isActive).length;

    // Count by severity
    const bySeverity = warnings.reduce(
      (acc, warning) => {
        acc[warning.severity] = (acc[warning.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Count active by severity
    const activeBySeverity = warnings
      .filter((w) => w.isActive)
      .reduce(
        (acc, warning) => {
          acc[warning.severity] = (acc[warning.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    return {
      total,
      active,
      resolved,
      bySeverity,
      activeBySeverity,
    };
  }, [warnings]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case WARNING_SEVERITY.VERBAL:
        return "#3b82f6"; // blue
      case WARNING_SEVERITY.WRITTEN:
        return "#f59e0b"; // amber
      case WARNING_SEVERITY.SUSPENSION:
        return "#ff9800"; // orange
      case WARNING_SEVERITY.FINAL_WARNING:
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Icon name="chart-bar" size="md" color={colors.primary} />
        <ThemedText style={styles.title}>Resumo das Minhas Advertências</ThemedText>
      </View>

      {/* Overall Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <ThemedText style={styles.statValue}>{stats.total}</ThemedText>
          <ThemedText style={styles.statLabel}>Total</ThemedText>
        </View>
        <View style={StyleSheet.flatten([styles.statBox, styles.statBoxBorder, { borderColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200] }])}>
          <ThemedText style={StyleSheet.flatten([styles.statValue, { color: "#ef4444" }])}>{stats.active}</ThemedText>
          <ThemedText style={styles.statLabel}>Ativas</ThemedText>
        </View>
        <View style={styles.statBox}>
          <ThemedText style={StyleSheet.flatten([styles.statValue, { color: "#10b981" }])}>{stats.resolved}</ThemedText>
          <ThemedText style={styles.statLabel}>Resolvidas</ThemedText>
        </View>
      </View>

      {/* Active Severity Breakdown */}
      {stats.active > 0 && Object.keys(stats.activeBySeverity).length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="alert-triangle" size="sm" variant="muted" />
            <ThemedText style={styles.sectionTitle}>Advertências Ativas por Gravidade</ThemedText>
          </View>
          <View style={styles.breakdownList}>
            {Object.entries(stats.activeBySeverity)
              .sort(([, a], [, b]) => b - a)
              .map(([severity, count]) => (
                <View key={severity} style={styles.breakdownItem}>
                  <View style={StyleSheet.flatten([styles.colorDot, { backgroundColor: getSeverityColor(severity) }])} />
                  <ThemedText style={styles.breakdownLabel} numberOfLines={1}>
                    {WARNING_SEVERITY_LABELS[severity as keyof typeof WARNING_SEVERITY_LABELS] || severity}
                  </ThemedText>
                  <ThemedText style={styles.breakdownCount}>{count}</ThemedText>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* All Severity Breakdown */}
      {Object.keys(stats.bySeverity).length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="list" size="sm" variant="muted" />
            <ThemedText style={styles.sectionTitle}>Histórico por Gravidade</ThemedText>
          </View>
          <View style={styles.breakdownList}>
            {Object.entries(stats.bySeverity)
              .sort(([, a], [, b]) => b - a)
              .map(([severity, count]) => (
                <View key={severity} style={styles.breakdownItem}>
                  <View style={StyleSheet.flatten([styles.colorDot, { backgroundColor: getSeverityColor(severity) }])} />
                  <ThemedText style={styles.breakdownLabel} numberOfLines={1}>
                    {WARNING_SEVERITY_LABELS[severity as keyof typeof WARNING_SEVERITY_LABELS] || severity}
                  </ThemedText>
                  <ThemedText style={styles.breakdownCount}>{count}</ThemedText>
                </View>
              ))}
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statBoxBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
  section: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    opacity: 0.7,
  },
  breakdownList: {
    gap: spacing.xs,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  breakdownCount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    minWidth: 30,
    textAlign: "right",
  },
});
