import React, { useCallback, useMemo } from "react";
import { FlatList, View, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { Warning } from '../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { WARNING_CATEGORY_LABELS, WARNING_SEVERITY_LABELS, WARNING_SEVERITY } from '../../../constants';
import { formatDate } from '../../../utils';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

interface TeamWarningTableProps {
  warnings: Warning[];
  onWarningPress?: (warningId: string) => void;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  loading?: boolean;
}

// Helper function to get severity colors
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case WARNING_SEVERITY.VERBAL:
      return { background: badgeColors.info.background, text: badgeColors.info.text };
    case WARNING_SEVERITY.WRITTEN:
      return { background: badgeColors.warning.background, text: badgeColors.warning.text };
    case WARNING_SEVERITY.SUSPENSION:
      return { background: "rgba(255, 152, 0, 0.15)", text: "#ff9800" }; // orange-500
    case WARNING_SEVERITY.FINAL_WARNING:
      return { background: badgeColors.error.background, text: badgeColors.error.text };
    default:
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
  }
};

export const TeamWarningTable = React.memo<TeamWarningTableProps>(({ warnings, onWarningPress, onRefresh, refreshing = false, loading = false }) => {
  const { colors, isDark } = useTheme();

  // Row component
  const renderRow = useCallback(
    ({ item }: { item: Warning }) => {
      const severityLabel = WARNING_SEVERITY_LABELS[item.severity as keyof typeof WARNING_SEVERITY_LABELS] || item.severity;
      const categoryLabel = WARNING_CATEGORY_LABELS[item.category as keyof typeof WARNING_CATEGORY_LABELS] || item.category;
      const severityColor = getSeverityColor(item.severity);

      return (
        <Pressable onPress={() => onWarningPress?.(item.id)} android_ripple={{ color: colors.primary + "20" }}>
          <Card style={styles.warningCard}>
            {/* Header: User and Severity */}
            <View style={styles.cardHeader}>
              <View style={styles.userSection}>
                <View style={[styles.userAvatar, { backgroundColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200] }]}>
                  <Icon name="user" size="sm" variant="muted" />
                </View>
                <View style={styles.userInfo}>
                  <ThemedText style={styles.userName} numberOfLines={1}>
                    {item.collaborator?.name || "Colaborador"}
                  </ThemedText>
                  <ThemedText style={styles.categoryLabel} numberOfLines={1}>
                    {categoryLabel}
                  </ThemedText>
                </View>
              </View>
              <Badge
                variant="secondary"
                size="sm"
                style={{
                  backgroundColor: severityColor.background,
                  borderWidth: 0,
                }}
              >
                <ThemedText
                  style={{
                    color: severityColor.text,
                    fontSize: fontSize.xs,
                    fontWeight: fontWeight.medium,
                  }}
                >
                  {severityLabel}
                </ThemedText>
              </Badge>
            </View>

            {/* Reason */}
            <View style={styles.reasonSection}>
              <ThemedText style={styles.reasonText} numberOfLines={2}>
                {item.reason}
              </ThemedText>
            </View>

            {/* Footer: Date and Status */}
            <View style={styles.cardFooter}>
              <View style={styles.dateSection}>
                <Icon name="calendar" size="xs" variant="muted" />
                <ThemedText style={styles.dateText}>{formatDate(item.createdAt)}</ThemedText>
              </View>
              <Badge
                variant={item.isActive ? "default" : "secondary"}
                size="sm"
                style={{
                  backgroundColor: item.isActive ? badgeColors.success.background : badgeColors.muted.background,
                  borderWidth: 0,
                }}
              >
                <ThemedText
                  style={{
                    color: item.isActive ? badgeColors.success.text : badgeColors.muted.text,
                    fontSize: fontSize.xs,
                    fontWeight: fontWeight.medium,
                  }}
                >
                  {item.isActive ? "Ativa" : "Resolvida"}
                </ThemedText>
              </Badge>
            </View>
          </Card>
        </Pressable>
      );
    },
    [colors, isDark, onWarningPress],
  );

  // Empty state component
  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Icon name="alert-circle" size="xl" variant="muted" />
        <ThemedText style={styles.emptyTitle}>Nenhuma advertência encontrada</ThemedText>
        <ThemedText style={styles.emptySubtitle}>As advertências da sua equipe aparecerão aqui</ThemedText>
      </View>
    ),
    [],
  );

  // Main loading state
  if (loading && warnings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando advertências...</ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      data={warnings}
      renderItem={renderRow}
      keyExtractor={(item) => item.id}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={warnings.length === 0 ? styles.emptyListContent : styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
});

const styles = StyleSheet.create({
  warningCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  categoryLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  reasonSection: {
    marginBottom: spacing.sm,
  },
  reasonText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    opacity: 0.8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
});

TeamWarningTable.displayName = "TeamWarningTable";
