import React, { useCallback } from "react";
import { FlatList, View, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { Cut } from '../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { CUT_STATUS, CUT_TYPE, CUT_ORIGIN } from '../../../constants';
import { formatDate } from '../../../utils';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

interface TeamCutTableProps {
  cuts: Cut[];
  onCutPress?: (cutId: string) => void;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  loading?: boolean;
}

// Helper function to get status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case CUT_STATUS.PENDING:
      return { background: badgeColors.warning.background, text: badgeColors.warning.text };
    case CUT_STATUS.IN_PROGRESS:
      return { background: badgeColors.info.background, text: badgeColors.info.text };
    case CUT_STATUS.COMPLETED:
      return { background: badgeColors.success.background, text: badgeColors.success.text };
    case CUT_STATUS.CANCELLED:
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
    default:
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
  }
};

// Helper function to get status label
const getStatusLabel = (status: string) => {
  switch (status) {
    case CUT_STATUS.PENDING:
      return "Pendente";
    case CUT_STATUS.IN_PROGRESS:
      return "Em Progresso";
    case CUT_STATUS.COMPLETED:
      return "Concluído";
    case CUT_STATUS.CANCELLED:
      return "Cancelado";
    default:
      return status;
  }
};

// Helper function to get type label
const getTypeLabel = (type: string) => {
  switch (type) {
    case CUT_TYPE.NORMAL:
      return "Normal";
    case CUT_TYPE.RECUT:
      return "Recorte";
    case CUT_TYPE.REWORK:
      return "Retrabalho";
    default:
      return type;
  }
};

// Helper function to get origin label
const getOriginLabel = (origin: string) => {
  switch (origin) {
    case CUT_ORIGIN.AUTOMATIC:
      return "Automático";
    case CUT_ORIGIN.MANUAL:
      return "Manual";
    case CUT_ORIGIN.REQUESTED:
      return "Solicitado";
    default:
      return origin;
  }
};

export const TeamCutTable = React.memo<TeamCutTableProps>(
  ({ cuts, onCutPress, onRefresh, refreshing = false, loading = false }) => {
    const { colors, isDark } = useTheme();

    // Row component
    const renderRow = useCallback(
      ({ item }: { item: Cut }) => {
        const statusColor = getStatusColor(item.status);
        const statusLabel = getStatusLabel(item.status);
        const typeLabel = getTypeLabel(item.type);
        const originLabel = getOriginLabel(item.origin);

        return (
          <Pressable onPress={() => onCutPress?.(item.id)} android_ripple={{ color: colors.primary + "20" }}>
            <Card style={styles.cutCard}>
              {/* Header: File and Status */}
              <View style={styles.cardHeader}>
                <View style={styles.fileSection}>
                  <View style={[styles.fileIcon, { backgroundColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200] }]}>
                    <Icon name="scissors" size="sm" variant="muted" />
                  </View>
                  <View style={styles.fileInfo}>
                    <ThemedText style={styles.fileName} numberOfLines={1}>
                      {item.file?.name || "Arquivo"}
                    </ThemedText>
                    <ThemedText style={styles.typeLabel} numberOfLines={1}>
                      {typeLabel}
                    </ThemedText>
                  </View>
                </View>
                <Badge
                  variant="secondary"
                  size="sm"
                  style={{
                    backgroundColor: statusColor.background,
                    borderWidth: 0,
                  }}
                >
                  <ThemedText
                    style={{
                      color: statusColor.text,
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.medium,
                    }}
                  >
                    {statusLabel}
                  </ThemedText>
                </Badge>
              </View>

              {/* Details Section */}
              <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Origem:</ThemedText>
                  <ThemedText style={styles.detailValue}>{originLabel}</ThemedText>
                </View>
                {item.task && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Tarefa:</ThemedText>
                    <ThemedText style={styles.detailValue} numberOfLines={1}>
                      {item.task.title}
                    </ThemedText>
                  </View>
                )}
                {item.startedAt && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Iniciado:</ThemedText>
                    <ThemedText style={styles.detailValue}>{formatDate(item.startedAt)}</ThemedText>
                  </View>
                )}
                {item.completedAt && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Concluído:</ThemedText>
                    <ThemedText style={styles.detailValue}>{formatDate(item.completedAt)}</ThemedText>
                  </View>
                )}
              </View>

              {/* Footer: Created Date */}
              <View style={styles.cardFooter}>
                <View style={styles.dateSection}>
                  <Icon name="calendar" size="xs" variant="muted" />
                  <ThemedText style={styles.dateText}>
                    Criado: {formatDate(item.createdAt)}
                  </ThemedText>
                </View>
              </View>
            </Card>
          </Pressable>
        );
      },
      [colors, isDark, onCutPress],
    );

    // Empty state component
    const renderEmpty = useCallback(
      () => (
        <View style={styles.emptyContainer}>
          <Icon name="scissors" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhum recorte encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Os recortes da sua equipe aparecerão aqui</ThemedText>
        </View>
      ),
      [],
    );

    // Main loading state
    if (loading && cuts.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando recortes...</ThemedText>
        </View>
      );
    }

    return (
      <FlatList
        data={cuts}
        renderItem={renderRow}
        keyExtractor={(item) => item.id}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={cuts.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  }
);

const styles = StyleSheet.create({
  cutCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  fileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  typeLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  detailsSection: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
    textAlign: "right",
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

TeamCutTable.displayName = "TeamCutTable";
