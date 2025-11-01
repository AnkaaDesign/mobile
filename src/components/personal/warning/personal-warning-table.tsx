import React, { useCallback } from "react";
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
import { badgeColors } from "@/lib/theme/extended-colors";

interface PersonalWarningTableProps {
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

export const PersonalWarningTable = React.memo<PersonalWarningTableProps>(({ warnings, onWarningPress, onRefresh, refreshing = false, loading = false }) => {
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
            {/* Header: Severity and Category */}
            <View style={styles.cardHeader}>
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
              <View style={styles.categoryBadge}>
                <Icon name="tag" size="xs" variant="muted" />
                <ThemedText style={styles.categoryText} numberOfLines={1}>
                  {categoryLabel}
                </ThemedText>
              </View>
            </View>

            {/* Reason */}
            <View style={styles.reasonSection}>
              <ThemedText style={styles.reasonText} numberOfLines={2}>
                {item.reason}
              </ThemedText>
            </View>

            {/* Description if available */}
            {item.description && (
              <View style={styles.descriptionSection}>
                <ThemedText style={styles.descriptionText} numberOfLines={3}>
                  {item.description}
                </ThemedText>
              </View>
            )}

            {/* Supervisor Information */}
            {item.supervisor && (
              <View style={styles.supervisorSection}>
                <Icon name="user-check" size="xs" variant="muted" />
                <ThemedText style={styles.supervisorText} numberOfLines={1}>
                  Supervisor: {item.supervisor.name}
                </ThemedText>
              </View>
            )}

            {/* Follow-up Date if applicable */}
            {item.followUpDate && item.isActive && (
              <View style={styles.followUpSection}>
                <Icon name="calendar-clock" size="xs" variant="muted" />
                <ThemedText style={styles.followUpText}>
                  Acompanhamento: {formatDate(item.followUpDate)}
                </ThemedText>
              </View>
            )}

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
                  backgroundColor: item.isActive ? badgeColors.error.background : badgeColors.success.background,
                  borderWidth: 0,
                }}
              >
                <ThemedText
                  style={{
                    color: item.isActive ? badgeColors.error.text : badgeColors.success.text,
                    fontSize: fontSize.xs,
                    fontWeight: fontWeight.medium,
                  }}
                >
                  {item.isActive ? "Ativa" : "Resolvida"}
                </ThemedText>
              </Badge>
            </View>

            {/* Resolved Date if resolved */}
            {!item.isActive && item.resolvedAt && (
              <View style={styles.resolvedSection}>
                <Icon name="check-circle" size="xs" variant="muted" />
                <ThemedText style={styles.resolvedText}>
                  Resolvida em: {formatDate(item.resolvedAt)}
                </ThemedText>
              </View>
            )}
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
        <Icon name="shield-check" size="xl" variant="muted" />
        <ThemedText style={styles.emptyTitle}>Nenhuma advertência registrada</ThemedText>
        <ThemedText style={styles.emptySubtitle}>Parabéns! Você não possui advertências em seu histórico.</ThemedText>
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
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
    justifyContent: "flex-end",
  },
  categoryText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
  reasonSection: {
    marginBottom: spacing.sm,
  },
  reasonText: {
    fontSize: fontSize.md,
    lineHeight: 20,
    fontWeight: fontWeight.semibold,
  },
  descriptionSection: {
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(0, 0, 0, 0.1)",
  },
  descriptionText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    opacity: 0.7,
    fontStyle: "italic",
  },
  supervisorSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  supervisorText: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  followUpSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    padding: spacing.xs,
    borderRadius: 4,
  },
  followUpText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
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
  resolvedSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(16, 185, 129, 0.2)",
  },
  resolvedText: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    color: "#10b981",
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

PersonalWarningTable.displayName = "PersonalWarningTable";
