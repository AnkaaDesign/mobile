import { useMemo, useCallback } from "react";
import { View, ScrollView, TouchableOpacity , StyleSheet} from "react-native";
import { ThemedText } from "@/components/ui/themed-text";

import { Skeleton } from "@/components/ui/skeleton";
import {
  IconHistory,
  IconEdit,
  IconPlus,
  IconTrash,
  IconClock,
  IconUser,
  IconAlertCircle,
  IconRefresh,
  IconArchive,
  IconArchiveOff,
  IconToggleLeft,
  IconToggleRight,
  IconCheck,
  IconX,
  IconCalendar,
} from "@tabler/icons-react-native";
import type { ChangeLog } from '../../types';
import { CHANGE_LOG_ENTITY_TYPE, CHANGE_ACTION, CHANGE_TRIGGERED_BY, CHANGE_LOG_ENTITY_TYPE_LABELS } from '../../constants';
import { formatRelativeTime, getFieldLabel, formatFieldValue, getActionLabel } from '../../utils';
import { useChangeLogs } from '../../hooks';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { useEntityDetails } from "@/hooks";

interface ChangelogTimelineProps {
  entityType: CHANGE_LOG_ENTITY_TYPE;
  entityId: string;
  entityName?: string;
  entityCreatedAt?: Date | string;
  maxHeight?: number;
  limit?: number;
}

// Map actions to icons
type IconComponent = React.ComponentType<any>;

const actionConfig: Record<CHANGE_ACTION, { icon: IconComponent; color: string }> = {
  [CHANGE_ACTION.CREATE]: { icon: IconPlus, color: "#22c55e" },
  [CHANGE_ACTION.UPDATE]: { icon: IconEdit, color: "#737373" },
  [CHANGE_ACTION.DELETE]: { icon: IconTrash, color: "#ef4444" },
  [CHANGE_ACTION.RESTORE]: { icon: IconRefresh, color: "#a855f7" },
  [CHANGE_ACTION.ROLLBACK]: { icon: IconRefresh, color: "#a855f7" },
  [CHANGE_ACTION.ARCHIVE]: { icon: IconArchive, color: "#6b7280" },
  [CHANGE_ACTION.UNARCHIVE]: { icon: IconArchiveOff, color: "#6b7280" },
  [CHANGE_ACTION.ACTIVATE]: { icon: IconToggleRight, color: "#22c55e" },
  [CHANGE_ACTION.DEACTIVATE]: { icon: IconToggleLeft, color: "#f97316" },
  [CHANGE_ACTION.APPROVE]: { icon: IconCheck, color: "#22c55e" },
  [CHANGE_ACTION.REJECT]: { icon: IconX, color: "#ef4444" },
  [CHANGE_ACTION.CANCEL]: { icon: IconX, color: "#ef4444" },
  [CHANGE_ACTION.COMPLETE]: { icon: IconCheck, color: "#22c55e" },
  [CHANGE_ACTION.RESCHEDULE]: { icon: IconClock, color: "#737373" },
  [CHANGE_ACTION.BATCH_CREATE]: { icon: IconPlus, color: "#22c55e" },
  [CHANGE_ACTION.BATCH_UPDATE]: { icon: IconEdit, color: "#737373" },
  [CHANGE_ACTION.BATCH_DELETE]: { icon: IconTrash, color: "#ef4444" },
  [CHANGE_ACTION.VIEW]: { icon: IconHistory, color: "#6b7280" },
};

// Group changelog entries by entity and time
const groupChangelogsByEntity = (changelogs: ChangeLog[]) => {
  const groups: ChangeLog[][] = [];
  let currentGroup: ChangeLog[] = [];
  let currentTime: number | null = null;

  changelogs.forEach((changelog) => {
    const time = new Date(changelog.createdAt).getTime();

    // Group changes that happened within 1 second of each other
    if (!currentTime || Math.abs(time - currentTime) < 1000) {
      currentGroup.push(changelog);
      currentTime = time;
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [changelog];
      currentTime = time;
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

export function ChangelogTimeline({ entityType, entityId, entityName, entityCreatedAt, maxHeight = 400, limit = 50 }: ChangelogTimelineProps) {
  const { colors } = useTheme();

  // Fetch changelogs
  const {
    data: changelogsResponse,
    isLoading,
    error,
    refetch,
  } = useChangeLogs({
    where: {
      entityType,
      entityId,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  const changelogs = useMemo(() => {
    const logs = changelogsResponse?.data || [];

    // Add creation entry if provided
    if (entityCreatedAt && !isLoading) {
      const creationEntry: Partial<ChangeLog> = {
        id: `${entityId}-creation`,
        entityId,
        entityType,
        action: CHANGE_ACTION.CREATE as any,
        field: null,
        oldValue: null,
        newValue: null,
        triggeredBy: CHANGE_TRIGGERED_BY.USER as any,
        userId: null,
        user: undefined,
        createdAt: new Date(entityCreatedAt),
        updatedAt: new Date(entityCreatedAt),
      };

      return [...logs, creationEntry as ChangeLog];
    }

    return logs;
  }, [changelogsResponse?.data, entityCreatedAt, entityId, entityType, isLoading]);

  // Extract entity IDs for fetching names
  const entityIds = useMemo(() => {
    const categoryIds = new Set<string>();
    const brandIds = new Set<string>();
    const supplierIds = new Set<string>();
    const userIds = new Set<string>();

    changelogs.forEach((changelog) => {
      if (changelog.field === "categoryId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") categoryIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") categoryIds.add(changelog.newValue);
      } else if (changelog.field === "brandId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") brandIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") brandIds.add(changelog.newValue);
      } else if (changelog.field === "supplierId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") supplierIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") supplierIds.add(changelog.newValue);
      } else if (changelog.field === "assignedToUserId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") userIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") userIds.add(changelog.newValue);
      }
    });

    return {
      categoryIds: Array.from(categoryIds),
      brandIds: Array.from(brandIds),
      supplierIds: Array.from(supplierIds),
      userIds: Array.from(userIds),
    };
  }, [changelogs]);

  // Fetch entity details
  const { data: entityDetails, isLoading: isLoadingEntityDetails } = useEntityDetails(entityIds);

  // Group changelogs by entity and time
  const groupedChangelogs = useMemo(() => {
    const changelogGroups = groupChangelogsByEntity(changelogs);

    // Group by date
    const dateGroups = new Map<string, typeof changelogGroups>();

    changelogGroups.forEach((group) => {
      const date = new Date(group[0].createdAt).toLocaleDateString("pt-BR");
      const existingGroups = dateGroups.get(date) || [];
      existingGroups.push(group);
      dateGroups.set(date, existingGroups);
    });

    return Array.from(dateGroups.entries()).sort((a, b) => {
      const dateA = new Date(a[0].split("/").reverse().join("-"));
      const dateB = new Date(b[0].split("/").reverse().join("-"));
      return dateB.getTime() - dateA.getTime();
    });
  }, [changelogs]);

  // Calculate summary statistics
  const changeStats = useMemo(() => {
    const totalChanges = changelogs.length;
    const recentChanges = changelogs.filter((c) => new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

    const uniqueUsers = new Set(changelogs.map((c) => c.userId).filter(Boolean)).size;

    const fieldChanges = changelogs.reduce(
      (acc, c) => {
        if (c.field) {
          acc[c.field] = (acc[c.field] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostChangedField = Object.entries(fieldChanges).sort(([, a], [, b]) => b - a)[0];

    return {
      totalChanges,
      recentChanges,
      uniqueUsers,
      mostChangedField: mostChangedField
        ? {
            field: getFieldLabel(mostChangedField[0], entityType),
            count: mostChangedField[1],
          }
        : null,
    };
  }, [changelogs, entityType]);

  // Format value with entity name
  const formatValueWithEntity = (value: any, field: string | null) => {
    if (!field) return formatFieldValue(value, field, entityType);

    if (value === null || value === undefined) return "—";

    // Check if it's a UUID and we have entity details
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof value === "string" && uuidRegex.test(value)) {
      // Show loading state while fetching entity details
      if (isLoadingEntityDetails) {
        return "Carregando...";
      }

      // Check if we have entity details and they are Maps
      if (entityDetails) {
        try {
          if (field === "categoryId" && entityDetails.categories && typeof entityDetails.categories.has === "function" && entityDetails.categories.has(value)) {
            return entityDetails.categories.get(value) || "Categoria";
          }
          if (field === "brandId" && entityDetails.brands && typeof entityDetails.brands.has === "function" && entityDetails.brands.has(value)) {
            return entityDetails.brands.get(value) || "Marca";
          }
          if (field === "supplierId" && entityDetails.suppliers && typeof entityDetails.suppliers.has === "function" && entityDetails.suppliers.has(value)) {
            return entityDetails.suppliers.get(value) || "Fornecedor";
          }
          if (field === "assignedToUserId" && entityDetails.users && typeof entityDetails.users.has === "function" && entityDetails.users.has(value)) {
            return entityDetails.users.get(value) || "Usuário";
          }
        } catch (error) {
          console.error("Error accessing entity details:", error);
        }
      }
    }

    return formatFieldValue(value, field, entityType);
  };

  // Retry handler
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  if (error) {
    return (
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: "transparent" }])}>
        <View style={styles.errorContainer}>
          <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.destructive + "20" }])}>
            <IconAlertCircle size={32} color={colors.destructive} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>Erro ao carregar histórico</ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.errorMessage, { color: colors.mutedForeground }])}>Não foi possível carregar o histórico de alterações.</ThemedText>
          <TouchableOpacity style={StyleSheet.flatten([styles.retryButton, { backgroundColor: colors.primary }])} onPress={handleRetry} activeOpacity={0.8}>
            <IconRefresh size={20} color={colors.primaryForeground} />
            <ThemedText style={StyleSheet.flatten([styles.retryButtonText, { color: colors.primaryForeground }])}>Tentar novamente</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: "transparent" }])}>
        {/* Summary skeleton */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            {[1, 2].map((index) => (
              <View key={index} style={StyleSheet.flatten([styles.summaryCard, { backgroundColor: colors.muted + "30" }])}>
                <Skeleton width={32} height={32} borderRadius={borderRadius.md} />
                <Skeleton width="70%" height={12} style={{ marginTop: spacing.sm }} />
                <Skeleton width="40%" height={24} style={{ marginTop: spacing.xs }} />
              </View>
            ))}
          </View>
        </View>

        {/* Timeline skeleton */}
        <ScrollView style={StyleSheet.flatten([styles.scrollView, maxHeight ? { maxHeight } : {}])} showsVerticalScrollIndicator={false}>
          <View style={styles.timeline}>
            {/* Date header skeleton */}
            <View style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <View style={StyleSheet.flatten([styles.dateLine, { backgroundColor: colors.border }])} />
                <Skeleton width={120} height={32} borderRadius={borderRadius.md} />
                <View style={StyleSheet.flatten([styles.dateLine, { backgroundColor: colors.border }])} />
              </View>

              {/* Timeline items skeleton */}
              <View style={styles.dayChanges}>
                {[1, 2, 3].map((index) => (
                  <View key={index} style={styles.timelineItem}>
                    {/* Timeline dot skeleton */}
                    <Skeleton width={32} height={32} borderRadius={borderRadius.full} style={{ marginRight: spacing.md }} />

                    {/* Content card skeleton */}
                    <View
                      style={StyleSheet.flatten([
                        styles.contentCard,
                        {
                          backgroundColor: colors.muted + "30",
                          borderColor: colors.border,
                        },
                      ])}
                    >
                      {/* Header skeleton */}
                      <View style={styles.cardHeader}>
                        <Skeleton width="60%" height={16} />
                        <Skeleton width={80} height={12} />
                      </View>

                      {/* Changes skeleton */}
                      <View style={styles.changesContainer}>
                        <View style={styles.changeItem}>
                          <Skeleton width="40%" height={14} style={{ marginBottom: spacing.xs }} />
                          <View style={styles.fieldValues}>
                            <View style={styles.valueRow}>
                              <Skeleton width={50} height={14} />
                              <Skeleton width="50%" height={14} />
                            </View>
                            <View style={styles.valueRow}>
                              <Skeleton width={50} height={14} />
                              <Skeleton width="45%" height={14} />
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Footer skeleton */}
                      <View style={StyleSheet.flatten([styles.cardFooter, { borderTopColor: colors.border }])}>
                        <View style={styles.userInfo}>
                          <Skeleton width={14} height={14} borderRadius={borderRadius.sm} />
                          <Skeleton width={30} height={14} />
                          <Skeleton width={80} height={14} />
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (changelogs.length === 0) {
    return (
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: "transparent" }])}>
        <View style={styles.emptyContainer}>
          <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
            <IconHistory size={48} color={colors.mutedForeground} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>Nenhuma alteração registrada</ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.emptyMessage, { color: colors.mutedForeground }])}>
            As alterações realizadas {entityName ? `em "${entityName}"` : `neste ${CHANGE_LOG_ENTITY_TYPE_LABELS[entityType]?.toLowerCase() || "item"}`} aparecerão aqui
          </ThemedText>
          <View style={StyleSheet.flatten([styles.emptyHint, { backgroundColor: colors.muted + "30" }])}>
            <IconClock size={20} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.emptyHintText, { color: colors.mutedForeground }])}>O histórico é registrado automaticamente</ThemedText>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: "transparent" }])}>
      {/* Summary Statistics */}
      {changeStats.totalChanges > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={StyleSheet.flatten([styles.summaryCard, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
              <View style={styles.summaryCardContent}>
                <IconEdit size={18} color={colors.mutedForeground} />
                <View style={styles.summaryText}>
                  <ThemedText style={StyleSheet.flatten([styles.summaryLabel, { color: colors.mutedForeground }])}>Total de Alterações</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.summaryValue, { color: colors.foreground }])}>{changeStats.totalChanges}</ThemedText>
                </View>
              </View>
            </View>

            <View style={StyleSheet.flatten([styles.summaryCard, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
              <View style={styles.summaryCardContent}>
                <IconClock size={18} color={colors.mutedForeground} />
                <View style={styles.summaryText}>
                  <ThemedText style={StyleSheet.flatten([styles.summaryLabel, { color: colors.mutedForeground }])}>Últimos 7 Dias</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.summaryValue, { color: colors.foreground }])}>{changeStats.recentChanges}</ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      <ScrollView style={StyleSheet.flatten([styles.scrollView, maxHeight ? { maxHeight } : {}])} showsVerticalScrollIndicator={false}>
        <View style={styles.timeline}>
          {groupedChangelogs.map(([date, dayChangelogGroups], groupIndex) => {
            const isLastGroup = groupIndex === groupedChangelogs.length - 1;

            return (
              <View key={date} style={styles.dateGroup}>
                {/* Date Header */}
                <View style={styles.dateHeader}>
                  <View style={StyleSheet.flatten([styles.dateLine, { backgroundColor: colors.border }])} />
                  <View
                    style={StyleSheet.flatten([
                      styles.dateContainer,
                      {
                        backgroundColor: colors.muted + "30",
                        borderColor: colors.border,
                      },
                    ])}
                  >
                    <IconCalendar size={14} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.dateText, { color: colors.mutedForeground }])}>{date}</ThemedText>
                  </View>
                  <View style={StyleSheet.flatten([styles.dateLine, { backgroundColor: colors.border }])} />
                </View>

                {/* Changes for this date */}
                <View style={styles.dayChanges}>
                  {/* Timeline line for the day */}
                  {!isLastGroup && <View style={StyleSheet.flatten([styles.dayTimelineLine, { backgroundColor: colors.border }])} />}

                  {dayChangelogGroups.map((changelogGroup, index) => {
                    const isLastChange = isLastGroup && index === dayChangelogGroups.length - 1;
                    const firstChange = changelogGroup[0];
                    const config = actionConfig[firstChange.action as unknown as CHANGE_ACTION];
                    const Icon = config.icon;

                    // Determine the action label
                    const actionLabel = getActionLabel(firstChange.action as any, firstChange.triggeredBy as any);

                    return (
                      <View key={firstChange.id} style={styles.timelineItem}>
                        {/* Timeline Line */}
                        {!isLastChange && <View style={StyleSheet.flatten([styles.timelineLine, { backgroundColor: colors.border }])} />}

                        {/* Timeline Dot */}
                        <View
                          style={StyleSheet.flatten([
                            styles.timelineDot,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                            },
                          ])}
                        >
                          <Icon size={12} color={config.color} />
                        </View>

                        {/* Content Card */}
                        <View
                          style={StyleSheet.flatten([
                            styles.contentCard,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                            },
                          ])}
                        >
                          {/* Header */}
                          <View style={StyleSheet.flatten([styles.cardHeader, { borderBottomColor: colors.border }])}>
                            <ThemedText style={StyleSheet.flatten([styles.actionText, { color: colors.foreground }])}>{actionLabel}</ThemedText>
                            <ThemedText style={StyleSheet.flatten([styles.timeText, { color: colors.mutedForeground }])}>{formatRelativeTime(firstChange.createdAt as Date)}</ThemedText>
                          </View>

                          {/* Changes */}
                          {firstChange.action !== (CHANGE_ACTION.CREATE as any) && changelogGroup.length > 0 && (
                            <View style={styles.changesContainer}>
                              {changelogGroup.map((changelog, changeIndex) => {
                                if (!changelog.field) return null;

                                const showSeparator = changeIndex > 0 && changeIndex < changelogGroup.length;

                                return (
                                  <View key={changelog.id}>
                                    {showSeparator && <View style={StyleSheet.flatten([styles.changeSeparator, { backgroundColor: colors.border }])} />}

                                    <View style={styles.changeItem}>
                                      <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>{getFieldLabel(changelog.field, entityType)}</ThemedText>

                                      {/* Handle array fields specially */}
                                      {Array.isArray(changelog.oldValue) &&
                                      Array.isArray(changelog.newValue) &&
                                      (changelog.field === "barcodes" || changelog.field === "barcode") ? (
                                        <View style={styles.arrayChanges}>
                                          {(() => {
                                            const oldBarcodes = changelog.oldValue as string[];
                                            const newBarcodes = changelog.newValue as string[];
                                            const added = newBarcodes.filter((bc) => !oldBarcodes.includes(bc));
                                            const removed = oldBarcodes.filter((bc) => !newBarcodes.includes(bc));

                                            return (
                                              <>
                                                {removed.length > 0 && (
                                                  <View style={styles.arrayChangeRow}>
                                                    <ThemedText style={StyleSheet.flatten([styles.arrayLabel, { color: colors.mutedForeground }])}>Removidos:</ThemedText>
                                                    <ThemedText style={StyleSheet.flatten([styles.arrayValue, { color: colors.destructive }])}>{removed.join(", ")}</ThemedText>
                                                  </View>
                                                )}
                                                {added.length > 0 && (
                                                  <View style={styles.arrayChangeRow}>
                                                    <ThemedText style={StyleSheet.flatten([styles.arrayLabel, { color: colors.mutedForeground }])}>Adicionados:</ThemedText>
                                                    <ThemedText style={StyleSheet.flatten([styles.arrayValue, { color: colors.primary }])}>{added.join(", ")}</ThemedText>
                                                  </View>
                                                )}
                                                {removed.length === 0 && added.length === 0 && (
                                                  <ThemedText style={StyleSheet.flatten([styles.arrayValue, { color: colors.mutedForeground }])}>Reordenados</ThemedText>
                                                )}
                                              </>
                                            );
                                          })()}
                                        </View>
                                      ) : (
                                        <View style={styles.fieldValues}>
                                          {changelog.oldValue !== null && changelog.newValue === null ? (
                                            // Field removed
                                            <View style={styles.removedValue}>
                                              <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Removido:</ThemedText>
                                              <ThemedText style={StyleSheet.flatten([styles.valueText, styles.strikethrough, { color: colors.destructive }])}>
                                                {formatValueWithEntity(changelog.oldValue, changelog.field)}
                                              </ThemedText>
                                            </View>
                                          ) : (
                                            // Field updated
                                            <>
                                              <View style={styles.valueRow}>
                                                <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Antes:</ThemedText>
                                                <ThemedText style={StyleSheet.flatten([styles.valueText, { color: colors.destructive }])}>
                                                  {formatValueWithEntity(changelog.oldValue, changelog.field)}
                                                </ThemedText>
                                              </View>
                                              <View style={styles.valueRow}>
                                                <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Agora:</ThemedText>
                                                <ThemedText style={StyleSheet.flatten([styles.valueText, { color: colors.foreground }])}>
                                                  {formatValueWithEntity(changelog.newValue, changelog.field)}
                                                </ThemedText>
                                              </View>
                                            </>
                                          )}
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          )}

                          {/* Footer */}
                          <View style={StyleSheet.flatten([styles.cardFooter, { borderTopColor: colors.border }])}>
                            <View style={styles.userInfo}>
                              <IconUser size={14} color={colors.mutedForeground} />
                              <ThemedText style={StyleSheet.flatten([styles.userName, { color: colors.mutedForeground }])}>Por:</ThemedText>
                              <ThemedText style={StyleSheet.flatten([styles.userNameValue, { color: colors.foreground }])}>{(firstChange.user as any)?.name || "Sistema"}</ThemedText>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // Error state
  errorContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  emptyHintText: {
    fontSize: fontSize.sm,
  },

  // Summary Statistics
  summaryContainer: {
    paddingBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryCardContent: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  summaryText: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },

  // Timeline
  timeline: {
    paddingBottom: spacing.md,
  },
  dateGroup: {
    marginBottom: spacing.md,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dateLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.sm,
  },
  dateText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  dayChanges: {
    position: "relative",
  },
  dayTimelineLine: {
    position: "absolute",
    left: 20,
    top: 48,
    bottom: 0,
    width: 1,
  },
  timelineItem: {
    flexDirection: "row",
    position: "relative",
    marginBottom: spacing.md,
  },
  timelineLine: {
    position: "absolute",
    left: 16,
    top: 36,
    bottom: -spacing.md,
    width: StyleSheet.hairlineWidth,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  // Content Card
  contentCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionText: {
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  timeText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },

  // Changes
  changesContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  changeSeparator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
  changeItem: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  fieldValues: {
    gap: 2,
  },
  valueRow: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "flex-start",
  },
  valueLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  valueText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    flex: 1,
  },
  removedValue: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },

  // Array changes
  arrayChanges: {
    gap: spacing.xs,
  },
  arrayChangeRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  arrayLabel: {
    fontSize: fontSize.sm,
  },
  arrayValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // Footer
  cardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  userName: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  userNameValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
