import React, { useMemo, useCallback, useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
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
  IconPhoto,
} from "@tabler/icons-react-native";
import type { ChangeLog } from "../../types";
import {
  CHANGE_LOG_ENTITY_TYPE,
  CHANGE_ACTION,
  CHANGE_TRIGGERED_BY,
  CHANGE_LOG_ENTITY_TYPE_LABELS,
  SERVICE_ORDER_TYPE,
  SECTOR_PRIVILEGES,
} from "@/constants";
import {
  CUT_TYPE_LABELS,
  CUT_STATUS_LABELS,
  CUT_ORIGIN_LABELS,
  AIRBRUSHING_STATUS_LABELS,
  PAINT_FINISH_LABELS,
  SERVICE_ORDER_STATUS_LABELS,
  SERVICE_ORDER_TYPE_LABELS,
  TRUCK_MANUFACTURER_LABELS,
} from "@/constants/enum-labels";
import { formatRelativeTime, getFieldLabel, formatFieldValue, getActionLabel } from "@/utils";
import { getApiBaseUrl } from "@/utils/file";
import { useChangeLogs } from "@/hooks";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { useEntityDetails, useAuth } from "@/hooks";
import { getVisibleServiceOrderTypes } from "@/utils/permissions/entity-permissions";

interface TaskWithServiceOrdersChangelogProps {
  taskId: string;
  taskName?: string;
  taskCreatedAt?: Date | string;
  serviceOrderIds: string[];
  truckId?: string;
  layoutIds?: string[];
  maxHeight?: number;
  limit?: number;
}

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
  let currentEntityId: string | null = null;
  let currentAction: string | null = null;
  let currentEntityType: string | null = null;

  changelogs.forEach((changelog) => {
    const time = new Date(changelog.createdAt).getTime();
    const isCreateAction = changelog.action === CHANGE_ACTION.CREATE;
    const isLayoutEntity = changelog.entityType === CHANGE_LOG_ENTITY_TYPE.LAYOUT;

    // For LAYOUT CREATE actions, group by time (within 1 second) to combine all sides
    if (isCreateAction && isLayoutEntity) {
      const canGroupWithCurrent =
        currentEntityType === CHANGE_LOG_ENTITY_TYPE.LAYOUT &&
        currentAction === CHANGE_ACTION.CREATE &&
        currentTime !== null &&
        Math.abs(time - currentTime) < 1000;

      if (canGroupWithCurrent) {
        currentGroup.push(changelog);
        currentTime = time;
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [changelog];
        currentTime = time;
        currentEntityId = changelog.entityId;
        currentAction = changelog.action;
        currentEntityType = changelog.entityType;
      }
      return;
    }

    // CREATE actions for non-LAYOUT entities should always be separate groups
    if (isCreateAction) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      groups.push([changelog]);
      currentGroup = [];
      currentTime = null;
      currentEntityId = null;
      currentAction = null;
      currentEntityType = null;
      return;
    }

    // For non-CREATE actions, group by time AND entity
    const shouldGroup =
      currentTime !== null &&
      Math.abs(time - currentTime) < 1000 &&
      currentEntityId === changelog.entityId &&
      currentAction !== CHANGE_ACTION.CREATE;

    if (shouldGroup) {
      currentGroup.push(changelog);
      currentTime = time;
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [changelog];
      currentTime = time;
      currentEntityId = changelog.entityId;
      currentAction = changelog.action;
      currentEntityType = changelog.entityType;
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

// Format date for section header
const formatDateHeader = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Hoje";
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Ontem";
  } else {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
};

// Group changelogs by date
const groupByDate = (groups: ChangeLog[][]): Map<string, ChangeLog[][]> => {
  const dateGroups = new Map<string, ChangeLog[][]>();

  groups.forEach((group) => {
    if (group.length === 0) return;
    const date = new Date(group[0].createdAt);
    const dateKey = formatDateHeader(date);

    const existing = dateGroups.get(dateKey) || [];
    existing.push(group);
    dateGroups.set(dateKey, existing);
  });

  return dateGroups;
};

// Format field values with entity resolution
const formatValueWithEntity = (
  value: any,
  field: string | null,
  entityType: CHANGE_LOG_ENTITY_TYPE,
  entityDetails: any,
  metadata?: any
) => {
  if (!field) return formatFieldValue(value, field, entityType, metadata);

  if (value === null || value === undefined) return "Nenhum";

  let parsedValue = value;
  if (typeof value === "string") {
    try {
      if (value.trim().startsWith("[") || value.trim().startsWith("{")) {
        parsedValue = JSON.parse(value);
      }
    } catch {
      parsedValue = value;
    }
  }

  // Check if it's a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof parsedValue === "string" && uuidRegex.test(parsedValue)) {
    if (entityDetails) {
      if (field === "customerId" && entityDetails.customers?.has(parsedValue)) {
        return entityDetails.customers.get(parsedValue) || "Cliente";
      }
      if (field === "sectorId" && entityDetails.sectors?.has(parsedValue)) {
        return entityDetails.sectors.get(parsedValue) || "Setor";
      }
      if (field === "paintId" && entityDetails.paints?.has(parsedValue)) {
        const paint = entityDetails.paints.get(parsedValue);
        return paint?.name || "Tinta";
      }
      if (field === "invoiceToId" && entityDetails.customers?.has(parsedValue)) {
        return entityDetails.customers.get(parsedValue) || "Cliente";
      }
      if (field === "truckId" && entityDetails.trucks?.has(parsedValue)) {
        return entityDetails.trucks.get(parsedValue) || "Caminhao";
      }
    }

    if (field === "customerId") return "Cliente (carregando...)";
    if (field === "sectorId") return "Setor (carregando...)";
    if (field === "paintId") return "Tinta (carregando...)";
    if (field === "invoiceToId") return "Cliente (carregando...)";
    if (field === "truckId") return "Caminhao (carregando...)";
  }

  return formatFieldValue(parsedValue, field, entityType, metadata);
};

// Get entity type label
const getEntityTypeLabel = (entityType: CHANGE_LOG_ENTITY_TYPE): string => {
  return CHANGE_LOG_ENTITY_TYPE_LABELS[entityType] || entityType;
};

// Timeline item component
const TimelineItem = ({
  group,
  isLast,
  entityDetails,
}: {
  group: ChangeLog[];
  isLast: boolean;
  entityDetails: any;
}) => {
  const { colors } = useTheme();
  const firstLog = group[0];
  const action = firstLog.action as CHANGE_ACTION;
  const config = actionConfig[action] || actionConfig[CHANGE_ACTION.UPDATE];
  const IconComp = config.icon;

  // Get the display title
  const getTitle = () => {
    const entityLabel = getEntityTypeLabel(firstLog.entityType);
    const actionLabel = getActionLabel(firstLog.action);

    // Special handling for service orders - show description/type
    if (
      firstLog.entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER &&
      firstLog.action === CHANGE_ACTION.CREATE
    ) {
      const metadata = firstLog.metadata as any;
      if (metadata) {
        const description = metadata.description;
        const type = metadata.type
          ? SERVICE_ORDER_TYPE_LABELS[metadata.type as keyof typeof SERVICE_ORDER_TYPE_LABELS]
          : null;

        if (description) {
          return (
            <View>
              <ThemedText style={[styles.itemTitle, { color: colors.foreground }]}>
                Ordem de Servico Criada
              </ThemedText>
              <ThemedText style={[styles.itemDescription, { color: colors.mutedForeground }]} numberOfLines={1}>
                {description}
              </ThemedText>
              {type && (
                <ThemedText style={[styles.itemType, { color: colors.mutedForeground }]}>
                  Tipo: {type}
                </ThemedText>
              )}
            </View>
          );
        }
      }
    }

    return (
      <ThemedText style={[styles.itemTitle, { color: colors.foreground }]}>
        {entityLabel} {actionLabel}
      </ThemedText>
    );
  };

  // Get field changes
  const getChanges = () => {
    const changes: React.ReactNode[] = [];

    group.forEach((log, idx) => {
      const field = log.field;
      const fieldLabel = getFieldLabel(field, log.entityType);

      if (log.action === CHANGE_ACTION.UPDATE && field) {
        const oldValue = formatValueWithEntity(log.oldValue, field, log.entityType, entityDetails, log.metadata);
        const newValue = formatValueWithEntity(log.newValue, field, log.entityType, entityDetails, log.metadata);

        changes.push(
          <View key={`${log.id}-${idx}`} style={styles.changeRow}>
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{fieldLabel}:</ThemedText>
            <View style={styles.changeValuesVertical}>
              <View style={styles.valueRow}>
                <ThemedText style={[styles.valueLabel, { color: colors.mutedForeground }]}>Antes: </ThemedText>
                <ThemedText style={[styles.oldValue, { color: colors.destructive }]}>
                  {String(oldValue || "Nenhum")}
                </ThemedText>
              </View>
              <View style={styles.valueRow}>
                <ThemedText style={[styles.valueLabel, { color: colors.mutedForeground }]}>Depois: </ThemedText>
                <ThemedText style={[styles.newValue, { color: "#22c55e" }]}>
                  {String(newValue || "Nenhum")}
                </ThemedText>
              </View>
            </View>
          </View>
        );
      } else if (log.action === CHANGE_ACTION.CREATE && field && log.newValue !== null && log.newValue !== undefined) {
        const newValue = formatValueWithEntity(log.newValue, field, log.entityType, entityDetails, log.metadata);
        if (newValue && String(newValue) !== "null" && String(newValue) !== "undefined") {
          changes.push(
            <View key={`${log.id}-${idx}`} style={styles.changeRow}>
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{fieldLabel}:</ThemedText>
              <ThemedText style={[styles.newValue, { color: colors.foreground }]}>
                {String(newValue)}
              </ThemedText>
            </View>
          );
        }
      }
    });

    return changes;
  };

  // Get user info
  const userName = firstLog.user?.name || "Sistema";
  const triggeredBy = firstLog.triggeredBy;
  const isAutomatic = triggeredBy === CHANGE_TRIGGERED_BY.SYSTEM || triggeredBy === CHANGE_TRIGGERED_BY.SCHEDULED;

  return (
    <View style={styles.timelineItem}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconComp size={16} color={config.color} />
        </View>
        {!isLast && <View style={[styles.line, { backgroundColor: colors.border }]} />}
      </View>

      {/* Content */}
      <View style={[styles.contentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {getTitle()}

        {getChanges()}

        {/* Footer with time and user */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <IconClock size={12} color={colors.mutedForeground} />
            <ThemedText style={[styles.time, { color: colors.mutedForeground }]}>
              {formatRelativeTime(firstLog.createdAt)}
            </ThemedText>
          </View>
          <View style={styles.footerRight}>
            <IconUser size={12} color={colors.mutedForeground} />
            <ThemedText style={[styles.userName, { color: colors.mutedForeground }]}>
              {isAutomatic ? "Automatico" : userName}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
};

// Loading skeleton
const ChangelogSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonItem}>
          <View style={styles.iconContainer}>
            <Skeleton width={32} height={32} borderRadius={16} />
            {i < 3 && <View style={[styles.line, { backgroundColor: colors.border }]} />}
          </View>
          <View style={styles.skeletonContent}>
            <Skeleton width="60%" height={16} borderRadius={4} />
            <View style={{ height: 8 }} />
            <Skeleton width="80%" height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
};

export function TaskWithServiceOrdersChangelog({
  taskId,
  taskName,
  taskCreatedAt,
  serviceOrderIds,
  truckId,
  layoutIds = [],
  maxHeight = 400,
  limit = 100,
}: TaskWithServiceOrdersChangelogProps) {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Get user privilege for filtering service orders
  const userSectorPrivilege = user?.sector?.privileges as SECTOR_PRIVILEGES | undefined;
  const visibleServiceOrderTypes = useMemo(
    () => getVisibleServiceOrderTypes(userSectorPrivilege),
    [userSectorPrivilege]
  );

  // Fetch changelogs for task
  const { data: taskLogs, isLoading: taskLoading } = useChangeLogs({
    where: {
      entityType: CHANGE_LOG_ENTITY_TYPE.TASK,
      entityId: taskId,
    },
    include: { user: true },
    limit,
    orderBy: { createdAt: "desc" },
  });

  // Fetch changelogs for service orders (one query for all)
  const { data: serviceOrderLogs, isLoading: serviceOrdersLoading } = useChangeLogs(
    {
      where: {
        entityType: CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER,
        entityId: { in: serviceOrderIds },
      },
      include: { user: true },
      limit,
      orderBy: { createdAt: "desc" },
    },
    { enabled: serviceOrderIds.length > 0 }
  );

  // Fetch changelogs for truck
  const { data: truckLogs, isLoading: truckLoading } = useChangeLogs(
    {
      where: {
        entityType: CHANGE_LOG_ENTITY_TYPE.TRUCK,
        entityId: truckId!,
      },
      include: { user: true },
      limit,
      orderBy: { createdAt: "desc" },
    },
    { enabled: !!truckId }
  );

  // Fetch changelogs for layouts
  const { data: layoutLogs, isLoading: layoutLoading } = useChangeLogs(
    {
      where: {
        entityType: CHANGE_LOG_ENTITY_TYPE.LAYOUT,
        entityId: { in: layoutIds },
      },
      include: { user: true },
      limit,
      orderBy: { createdAt: "desc" },
    },
    { enabled: layoutIds.length > 0 }
  );

  const isLoading = taskLoading || serviceOrdersLoading || truckLoading || layoutLoading;

  // Combine and sort all changelogs
  const allChangelogs = useMemo(() => {
    const logs: ChangeLog[] = [];

    if (taskLogs?.data) logs.push(...taskLogs.data);
    if (serviceOrderLogs?.data) logs.push(...serviceOrderLogs.data);
    if (truckLogs?.data) logs.push(...truckLogs.data);
    if (layoutLogs?.data) logs.push(...layoutLogs.data);

    // Sort by createdAt descending
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Filter service orders by visible types
    const filteredLogs = logs.filter((log) => {
      if (log.entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER) {
        const metadata = log.metadata as any;
        const serviceType = metadata?.type;
        if (serviceType && !visibleServiceOrderTypes.includes(serviceType)) {
          return false;
        }
      }
      return true;
    });

    return filteredLogs.slice(0, limit);
  }, [taskLogs, serviceOrderLogs, truckLogs, layoutLogs, visibleServiceOrderTypes, limit]);

  // Extract entity IDs for detail fetching - grouped by entity type
  const entityIdsByType = useMemo(() => {
    const customerIds = new Set<string>();
    const sectorIds = new Set<string>();
    const paintIds = new Set<string>();
    const truckIds = new Set<string>();
    const userIds = new Set<string>();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    allChangelogs.forEach((log) => {
      // Check field type and extract relevant IDs
      const processValue = (value: any, field: string | null) => {
        if (!value || typeof value !== "string" || !uuidRegex.test(value)) return;

        if (field === "customerId" || field === "invoiceToId") {
          customerIds.add(value);
        } else if (field === "sectorId") {
          sectorIds.add(value);
        } else if (field === "paintId") {
          paintIds.add(value);
        } else if (field === "truckId") {
          truckIds.add(value);
        } else if (field === "userId" || field === "assignedToId" || field === "createdById") {
          userIds.add(value);
        }
      };

      processValue(log.oldValue, log.field);
      processValue(log.newValue, log.field);
    });

    return {
      customerIds: Array.from(customerIds),
      sectorIds: Array.from(sectorIds),
      paintIds: Array.from(paintIds),
      truckIds: Array.from(truckIds),
      userIds: Array.from(userIds),
    };
  }, [allChangelogs]);

  // Fetch entity details for resolving UUIDs
  const { data: entityDetails } = useEntityDetails(entityIdsByType);

  // Group changelogs
  const groupedChangelogs = useMemo(() => groupChangelogsByEntity(allChangelogs), [allChangelogs]);
  const dateGroups = useMemo(() => groupByDate(groupedChangelogs), [groupedChangelogs]);

  if (isLoading) {
    return <ChangelogSkeleton />;
  }

  if (allChangelogs.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <IconHistory size={32} color={colors.mutedForeground} />
        <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Nenhuma alteracao registrada
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={{ maxHeight }} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {Array.from(dateGroups.entries()).map(([dateKey, groups], dateIdx) => (
          <View key={dateKey} style={styles.dateSection}>
            {/* Date Header */}
            <View style={styles.dateHeader}>
              <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
              <View style={[styles.dateBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <IconCalendar size={12} color={colors.mutedForeground} />
                <ThemedText style={[styles.dateText, { color: colors.foreground }]}>{dateKey}</ThemedText>
              </View>
              <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Timeline Items */}
            {groups.map((group, idx) => (
              <TimelineItem
                key={`${group[0].id}-${idx}`}
                group={group}
                isLast={dateIdx === dateGroups.size - 1 && idx === groups.length - 1}
                entityDetails={entityDetails}
              />
            ))}
          </View>
        ))}

        {/* Creation marker */}
        {taskCreatedAt && (
          <View style={styles.creationMarker}>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
            <View style={[styles.creationBadge, { backgroundColor: "#22c55e20", borderColor: "#22c55e" }]}>
              <IconPlus size={12} color="#22c55e" />
              <ThemedText style={[styles.creationText, { color: "#22c55e" }]}>
                {taskName || "Tarefa"} criada em{" "}
                {new Date(taskCreatedAt).toLocaleDateString("pt-BR")}
              </ThemedText>
            </View>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  dateSection: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  dateText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  timelineItem: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    alignItems: "center",
    width: 32,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  contentCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  itemTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  itemDescription: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  itemType: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
  changeRow: {
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  changeValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  changeValuesVertical: {
    flexDirection: "column",
    gap: spacing.xs,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  valueLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  oldValue: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  arrow: {
    fontSize: fontSize.xs,
  },
  newValue: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  time: {
    fontSize: fontSize.xs,
  },
  userName: {
    fontSize: fontSize.xs,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  skeletonContainer: {
    gap: spacing.md,
  },
  skeletonItem: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  skeletonContent: {
    flex: 1,
    padding: spacing.sm,
  },
  creationMarker: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  creationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  creationText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});

export default TaskWithServiceOrdersChangelog;
