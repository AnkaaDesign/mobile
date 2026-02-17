import React, { useMemo, useCallback, useState } from "react";
import { View, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
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
  CHANGE_LOG_ACTION,
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
  TASK_STATUS_LABELS,
  TASK_PRICING_STATUS_LABELS,
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
  pricingId?: string;
  maxHeight?: number;
  limit?: number;
}

type IconComponent = React.ComponentType<any>;

const actionConfig: Record<CHANGE_LOG_ACTION, { icon: IconComponent; color: string }> = {
  [CHANGE_LOG_ACTION.CREATE]: { icon: IconPlus, color: "#16a34a" },
  [CHANGE_LOG_ACTION.UPDATE]: { icon: IconEdit, color: "#737373" },
  [CHANGE_LOG_ACTION.DELETE]: { icon: IconTrash, color: "#ef4444" },
  [CHANGE_LOG_ACTION.RESTORE]: { icon: IconRefresh, color: "#a855f7" },
  [CHANGE_LOG_ACTION.ROLLBACK]: { icon: IconRefresh, color: "#a855f7" },
  [CHANGE_LOG_ACTION.ARCHIVE]: { icon: IconArchive, color: "#6b7280" },
  [CHANGE_LOG_ACTION.UNARCHIVE]: { icon: IconArchiveOff, color: "#6b7280" },
  [CHANGE_LOG_ACTION.ACTIVATE]: { icon: IconToggleRight, color: "#16a34a" },
  [CHANGE_LOG_ACTION.DEACTIVATE]: { icon: IconToggleLeft, color: "#f97316" },
  [CHANGE_LOG_ACTION.APPROVE]: { icon: IconCheck, color: "#16a34a" },
  [CHANGE_LOG_ACTION.REJECT]: { icon: IconX, color: "#ef4444" },
  [CHANGE_LOG_ACTION.CANCEL]: { icon: IconX, color: "#ef4444" },
  [CHANGE_LOG_ACTION.COMPLETE]: { icon: IconCheck, color: "#16a34a" },
  [CHANGE_LOG_ACTION.RESCHEDULE]: { icon: IconCalendar, color: "#3b82f6" },
  [CHANGE_LOG_ACTION.BATCH_CREATE]: { icon: IconPlus, color: "#16a34a" },
  [CHANGE_LOG_ACTION.BATCH_UPDATE]: { icon: IconEdit, color: "#737373" },
  [CHANGE_LOG_ACTION.BATCH_DELETE]: { icon: IconTrash, color: "#ef4444" },
  [CHANGE_LOG_ACTION.VIEW]: { icon: IconHistory, color: "#6b7280" },
};

// File fields that should show thumbnails instead of counts
const FILE_ARRAY_FIELDS = ["artworks", "artworkIds", "baseFiles", "baseFileIds", "budgets", "invoices", "receipts"];

// File thumbnail component for changelog display (similar to web's LogoDisplay)
const FileThumbnail = ({
  fileId,
  size = 48,
}: {
  fileId?: string;
  size?: number;
}) => {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!fileId) {
    return (
      <View
        style={[
          styles.fileThumbnailPlaceholder,
          {
            width: size,
            height: size,
            backgroundColor: colors.muted,
            borderColor: colors.border,
          },
        ]}
      >
        <IconPhoto size={16} color={colors.mutedForeground} />
      </View>
    );
  }

  if (imageError) {
    return (
      <View
        style={[
          styles.fileThumbnailPlaceholder,
          {
            width: size,
            height: size,
            backgroundColor: colors.muted,
            borderColor: colors.border,
          },
        ]}
      >
        <IconPhoto size={16} color={colors.mutedForeground} />
      </View>
    );
  }

  const apiUrl = getApiBaseUrl();
  const imageUrl = `${apiUrl}/files/thumbnail/${fileId}`;

  return (
    <View style={[styles.fileThumbnailContainer, { width: size, height: size }]}>
      {imageLoading && (
        <View
          style={[
            styles.fileThumbnailLoading,
            {
              width: size,
              height: size,
              backgroundColor: colors.muted,
              borderColor: colors.border,
            },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.fileThumbnailImage,
          {
            width: size,
            height: size,
            borderColor: colors.border,
            opacity: imageLoading ? 0 : 1,
          },
        ]}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        onLoad={() => {
          setImageLoading(false);
        }}
        resizeMode="cover"
      />
    </View>
  );
};

// Parse value helper for file arrays
const parseFileArrayValue = (val: any): any[] | null => {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
};

// Extract file ID from various data structures
const extractFileId = (file: any, field: string): string => {
  const isArtworkField = field === "artworks" || field === "artworkIds";
  if (typeof file === "string") {
    return file;
  } else if (isArtworkField) {
    // For artworks: { id: artworkId, fileId: fileId, file: { id, thumbnailUrl } }
    return file.fileId || file.file?.id || file.id;
  } else {
    // For baseFiles/budgets/etc: { id: fileId, filename, thumbnailUrl }
    return file.id;
  }
};

// Render file thumbnails grid
const FileArrayDisplay = ({
  files,
  field,
  isOldValue,
}: {
  files: any[] | null;
  field: string;
  isOldValue?: boolean;
}) => {
  const { colors } = useTheme();

  if (!files || files.length === 0) {
    return (
      <ThemedText
        style={[
          styles.fileArrayEmpty,
          { color: isOldValue ? colors.destructive : colors.success },
        ]}
      >
        Nenhum arquivo
      </ThemedText>
    );
  }

  return (
    <View style={styles.fileArrayContainer}>
      <View style={styles.fileArrayGrid}>
        {files.map((file: any, idx: number) => {
          const fileId = extractFileId(file, field);
          return <FileThumbnail key={idx} fileId={fileId} size={40} />;
        })}
      </View>
      <ThemedText style={[styles.fileArrayCount, { color: colors.mutedForeground }]}>
        ({files.length} arquivo{files.length > 1 ? "s" : ""})
      </ThemedText>
    </View>
  );
};

// Group changelog entries by entity and time
const groupChangelogsByEntity = (changelogs: ChangeLog[]) => {
  const groups: ChangeLog[][] = [];
  let currentGroup: ChangeLog[] = [];
  let currentTime: number | null = null;
  let currentEntityId: string | null = null;
  let currentAction: CHANGE_LOG_ACTION | null = null;
  let currentEntityType: CHANGE_LOG_ENTITY_TYPE | null = null;

  changelogs.forEach((changelog) => {
    const time = new Date(changelog.createdAt).getTime();
    const isCreateAction = changelog.action === CHANGE_LOG_ACTION.CREATE;
    const isLayoutEntity = changelog.entityType === CHANGE_LOG_ENTITY_TYPE.LAYOUT;

    // For LAYOUT CREATE actions, group by time (within 1 second) to combine all sides
    if (isCreateAction && isLayoutEntity) {
      const canGroupWithCurrent =
        currentEntityType === CHANGE_LOG_ENTITY_TYPE.LAYOUT &&
        currentAction === CHANGE_LOG_ACTION.CREATE &&
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

    // TASK/SERVICE_ORDER/TRUCK UPDATE/ROLLBACK/BATCH_UPDATE always get separate groups (matching web)
    const isRollbackableUpdate =
      (changelog.action === CHANGE_LOG_ACTION.UPDATE ||
        changelog.action === CHANGE_LOG_ACTION.ROLLBACK ||
        changelog.action === CHANGE_LOG_ACTION.BATCH_UPDATE) &&
      (changelog.entityType === CHANGE_LOG_ENTITY_TYPE.TASK ||
        changelog.entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER ||
        changelog.entityType === CHANGE_LOG_ENTITY_TYPE.TRUCK);

    if (isRollbackableUpdate) {
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

    // For non-CREATE, non-rollbackable actions, group by time AND entity
    const shouldGroup =
      currentTime !== null &&
      Math.abs(time - currentTime) < 1000 &&
      currentEntityId === changelog.entityId &&
      currentAction !== CHANGE_LOG_ACTION.CREATE;

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

// Safe Map lookup helper - handles both Map instances and plain objects
// (React Query persistence via AsyncStorage can deserialize Maps as plain objects)
const safeMapGet = (map: any, key: string): any => {
  if (!map) return undefined;
  if (typeof map.get === "function") return map.get(key);
  // Fallback for plain objects (deserialized Maps)
  if (typeof map === "object" && key in map) return map[key];
  return undefined;
};

const safeMapHas = (map: any, key: string): boolean => {
  if (!map) return false;
  if (typeof map.has === "function") return map.has(key);
  // Fallback for plain objects (deserialized Maps)
  if (typeof map === "object") return key in map;
  return false;
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
      // Customer fields
      if (field === "customerId" && safeMapHas(entityDetails.customers, parsedValue)) {
        return safeMapGet(entityDetails.customers, parsedValue) || "Cliente";
      }
      if (field === "invoiceToId" && safeMapHas(entityDetails.customers, parsedValue)) {
        return safeMapGet(entityDetails.customers, parsedValue) || "Cliente";
      }
      // Sector field
      if (field === "sectorId" && safeMapHas(entityDetails.sectors, parsedValue)) {
        return safeMapGet(entityDetails.sectors, parsedValue) || "Setor";
      }
      // Paint field
      if (field === "paintId" && safeMapHas(entityDetails.paints, parsedValue)) {
        const paint = safeMapGet(entityDetails.paints, parsedValue);
        return paint?.name || "Tinta";
      }
      // Truck field
      if (field === "truckId" && safeMapHas(entityDetails.trucks, parsedValue)) {
        return safeMapGet(entityDetails.trucks, parsedValue) || "Caminhão";
      }
      // User fields - resolve from users map
      const userFields = [
        "assignedToId", "createdById", "startedById", "approvedById", "completedById",
        "userId", "reviewedBy", "rejectedBy", "cancelledBy", "responsibleUserId"
      ];
      if (userFields.includes(field) && safeMapHas(entityDetails.users, parsedValue)) {
        return safeMapGet(entityDetails.users, parsedValue) || "Usuário";
      }
    }

    // Fallback loading messages
    if (field === "customerId" || field === "invoiceToId") return "Cliente (carregando...)";
    if (field === "sectorId") return "Setor (carregando...)";
    if (field === "paintId") return "Tinta (carregando...)";
    if (field === "truckId") return "Caminhão (carregando...)";
    const userFields = [
      "assignedToId", "createdById", "startedById", "approvedById", "completedById",
      "userId", "reviewedBy", "rejectedBy", "cancelledBy", "responsibleUserId"
    ];
    if (userFields.includes(field)) return "Usuário (carregando...)";
  }

  return formatFieldValue(parsedValue, field, entityType, metadata);
};

// Get entity type label
const getEntityTypeLabel = (entityType: CHANGE_LOG_ENTITY_TYPE): string => {
  return CHANGE_LOG_ENTITY_TYPE_LABELS[entityType] || entityType;
};

// Timeline item component
const TimelineItem = React.memo(({
  group,
  isLast,
  entityDetails,
  userSectorPrivilege,
}: {
  group: ChangeLog[];
  isLast: boolean;
  entityDetails: any;
  userSectorPrivilege?: string;
}) => {
  const { colors } = useTheme();
  const firstLog = group[0];
  const action = firstLog.action;
  const config = actionConfig[action] || actionConfig[CHANGE_LOG_ACTION.UPDATE];
  const IconComp = config.icon;

  // Get the display title
  const getTitle = () => {
    const entityLabel = getEntityTypeLabel(firstLog.entityType);
    const metadata = firstLog.metadata as { sourceTaskName?: string } | undefined;
    const actionLabel = getActionLabel(firstLog.action, firstLog.triggeredBy ?? undefined, metadata);

    // Special handling for service orders - show description/type/status (matching web)
    if (
      firstLog.entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER &&
      firstLog.action === CHANGE_LOG_ACTION.CREATE
    ) {
      // Extract entity details from newValue (matching web implementation)
      let createdEntityData: any = null;
      try {
        if (firstLog.newValue) {
          createdEntityData =
            typeof firstLog.newValue === "string"
              ? JSON.parse(firstLog.newValue)
              : firstLog.newValue;
        }
      } catch (e) {
        // Fall back to metadata if newValue parsing fails
        createdEntityData = firstLog.metadata as any;
      }

      // Also try metadata as fallback
      if (!createdEntityData) {
        createdEntityData = firstLog.metadata as any;
      }

      if (createdEntityData) {
        const description = createdEntityData.description;
        const type = createdEntityData.type
          ? SERVICE_ORDER_TYPE_LABELS[createdEntityData.type as keyof typeof SERVICE_ORDER_TYPE_LABELS]
          : null;
        const status = createdEntityData.status
          ? SERVICE_ORDER_STATUS_LABELS[createdEntityData.status as keyof typeof SERVICE_ORDER_STATUS_LABELS]
          : null;

        // Use feminine form "Criada" for SERVICE_ORDER (matching web)
        const feminineActionLabel = actionLabel.replace("Criado", "Criada");

        return (
          <View>
            <ThemedText style={[styles.itemTitle, { color: colors.foreground }]}>
              Ordem de Serviço {feminineActionLabel}
            </ThemedText>
            {description && (
              <ThemedText style={[styles.itemDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
                Descrição: <ThemedText style={{ fontSize: fontSize.xs, color: colors.foreground, fontWeight: "500" }}>{description}</ThemedText>
              </ThemedText>
            )}
            {type && (
              <ThemedText style={[styles.itemType, { color: colors.mutedForeground }]}>
                Tipo: <ThemedText style={{ fontSize: fontSize.xs, color: colors.foreground, fontWeight: "500" }}>{type}</ThemedText>
              </ThemedText>
            )}
            {status && (
              <ThemedText style={[styles.itemType, { color: colors.mutedForeground }]}>
                Status: <ThemedText style={{ fontSize: fontSize.xs, color: colors.foreground, fontWeight: "500" }}>{status}</ThemedText>
              </ThemedText>
            )}
          </View>
        );
      }
    }

    // Special handling for service orders UPDATE - use feminine form and show description/type/status summary (matching web)
    if (
      firstLog.entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER &&
      firstLog.action === CHANGE_LOG_ACTION.UPDATE
    ) {
      // Use feminine form "Atualizada" for SERVICE_ORDER (matching web)
      const feminineActionLabel = actionLabel.replace("Atualizado", "Atualizada");

      // Extract description and type changes from the group (matching web)
      const descriptionChange = group.find((c) => c.field === "description");
      const typeChange = group.find((c) => c.field === "type");
      const soStatusChange = group.find((c) => c.field === "status");

      // Get values from changes or metadata
      const description = descriptionChange?.newValue || (firstLog.metadata as any)?.description;
      const typeValue = typeChange?.newValue || (firstLog.metadata as any)?.type;
      const typeLabel = typeValue
        ? SERVICE_ORDER_TYPE_LABELS[typeValue as keyof typeof SERVICE_ORDER_TYPE_LABELS] || typeValue
        : null;

      // Status summary with relevant timestamp and user (matching web)
      let statusTimestamp: string | null = null;
      let statusUser: string | null = null;
      if (soStatusChange) {
        const newStatus = soStatusChange.newValue;
        const soTimestampChanges = group.filter((c) =>
          ["startedAt", "finishedAt", "approvedAt", "completedAt"].includes(c.field || "")
        );
        const soUserChanges = group.filter((c) =>
          ["startedById", "completedById", "approvedById"].includes(c.field || "")
        );

        // Pick relevant timestamp based on new status
        const relevantTimestamp = soTimestampChanges.find((c) => {
          if (newStatus === "IN_PROGRESS" && c.field === "startedAt") return true;
          if (newStatus === "COMPLETED" && (c.field === "finishedAt" || c.field === "completedAt")) return true;
          if (newStatus === "WAITING_APPROVE" && c.field === "approvedAt") return true;
          return false;
        });

        if (relevantTimestamp?.newValue) {
          // Handle double-encoded date strings (old data)
          let dateValue = relevantTimestamp.newValue;
          if (typeof dateValue === "string" && dateValue.startsWith('"') && dateValue.endsWith('"')) {
            try { dateValue = JSON.parse(dateValue); } catch { /* use as-is */ }
          }
          try {
            statusTimestamp = new Date(dateValue).toLocaleString("pt-BR");
          } catch { /* ignore */ }
        }

        // Pick relevant user based on new status
        const relevantUser = soUserChanges.find((c) => {
          if (newStatus === "IN_PROGRESS" && c.field === "startedById") return true;
          if (newStatus === "COMPLETED" && c.field === "completedById") return true;
          if (newStatus === "WAITING_APPROVE" && c.field === "approvedById") return true;
          return false;
        });

        if (relevantUser?.newValue && entityDetails) {
          statusUser = safeMapGet(entityDetails.users, relevantUser.newValue) || null;
        }
      }

      return (
        <View>
          <ThemedText style={[styles.itemTitle, { color: colors.foreground }]}>
            Ordem de Serviço {feminineActionLabel}
          </ThemedText>
          {description && (
            <ThemedText style={[styles.itemDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
              Descrição: <ThemedText style={{ fontSize: fontSize.xs, color: colors.foreground, fontWeight: "500" }}>{description}</ThemedText>
            </ThemedText>
          )}
          {typeLabel && (
            <ThemedText style={[styles.itemType, { color: colors.mutedForeground }]}>
              Tipo: <ThemedText style={{ fontSize: fontSize.xs, color: colors.foreground, fontWeight: "500" }}>{typeLabel}</ThemedText>
            </ThemedText>
          )}
          {statusTimestamp && (
            <ThemedText style={[styles.itemType, { color: colors.mutedForeground }]}>
              Data: <ThemedText style={{ fontSize: fontSize.xs, color: colors.foreground, fontWeight: "500" }}>{statusTimestamp}</ThemedText>
            </ThemedText>
          )}
          {statusUser && (
            <ThemedText style={[styles.itemType, { color: colors.mutedForeground }]}>
              Responsável: <ThemedText style={{ fontSize: fontSize.xs, color: colors.foreground, fontWeight: "500" }}>{statusUser}</ThemedText>
            </ThemedText>
          )}
        </View>
      );
    }

    // Copy operation detection (matching web)
    const isCopyOperation = firstLog.reason && firstLog.reason.includes("Campos copiados");
    const displayTitle = isCopyOperation ? firstLog.reason : `${entityLabel} ${actionLabel}`;

    return (
      <ThemedText style={[styles.itemTitle, { color: colors.foreground }]}>
        {displayTitle}
      </ThemedText>
    );
  };

  // Helper to parse pricing/budget value (matching web implementation)
  const parsePricingValue = (val: any) => {
    if (val === null || val === undefined) return null;
    if (typeof val === "object" && val.id) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (parsed && typeof parsed === "object" && parsed.id) return parsed;
        // If it's just a UUID string, return it as id
        return { id: val, budgetNumber: null, total: null, items: null };
      } catch {
        // It's a raw UUID string
        return { id: val, budgetNumber: null, total: null, items: null };
      }
    }
    return null;
  };

  // Helper to format currency (matching web implementation)
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return null;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Render pricing value display (matching web implementation)
  const renderPricingValue = (pricing: any, isOld: boolean) => {
    if (!pricing || !pricing.id) {
      return (
        <ThemedText style={{ fontSize: fontSize.xs, color: isOld ? colors.destructive : colors.success, fontWeight: "500" }}>
          Nenhum
        </ThemedText>
      );
    }

    const hasBudgetInfo = pricing.budgetNumber || pricing.total !== null;
    const items = pricing.items || [];

    if (hasBudgetInfo) {
      return (
        <View style={[styles.pricingCard, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <View style={styles.pricingHeader}>
            {pricing.budgetNumber && (
              <ThemedText style={[styles.pricingTitle, { color: isOld ? colors.destructive : colors.success }]}>
                Orçamento #{pricing.budgetNumber}
              </ThemedText>
            )}
            {pricing.total !== null && pricing.total !== undefined && (
              <ThemedText style={[styles.pricingTotal, { color: colors.mutedForeground }]}>
                {formatCurrency(pricing.total)}
              </ThemedText>
            )}
          </View>
          {items.length > 0 && (
            <View style={[styles.pricingItems, { borderTopColor: colors.border }]}>
              <ThemedText style={[styles.pricingItemsLabel, { color: colors.mutedForeground }]}>
                Itens:
              </ThemedText>
              {items.map((item: any, itemIdx: number) => (
                <View key={itemIdx} style={styles.pricingItemRow}>
                  <ThemedText style={[styles.pricingItemDesc, { color: colors.foreground }]} numberOfLines={1}>
                    {item.description}
                  </ThemedText>
                  <ThemedText style={[styles.pricingItemAmount, { color: colors.mutedForeground }]}>
                    {formatCurrency(item.amount)}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }

    // Fallback to showing just the ID if no budget info
    return (
      <ThemedText style={{ color: isOld ? colors.destructive : colors.success, fontFamily: "monospace", fontSize: fontSize.xs }}>
        {pricing.id}
      </ThemedText>
    );
  };

  // Get field changes
  const getChanges = () => {
    const changes: React.ReactNode[] = [];

    // Per-field permission filtering (matching web's inline filtering)
    const alwaysHiddenFields = ["statusOrder", "colorOrder", "services", "serviceOrders", "serviceOrderIds"];
    const financialFieldsList = ["pricingId", "budgetIds", "invoiceIds", "receiptIds", "price", "cost", "value", "totalPrice", "totalCost", "discount", "profit"];
    const restrictedFieldsList = ["forecastDate", "representatives", "representativeIds", "negotiatingWith"];
    const invoiceToFieldsList = ["invoiceTo", "invoiceToId"];

    const canViewFinancial =
      userSectorPrivilege === SECTOR_PRIVILEGES.ADMIN ||
      userSectorPrivilege === SECTOR_PRIVILEGES.FINANCIAL;
    const canViewRestricted =
      userSectorPrivilege === SECTOR_PRIVILEGES.ADMIN ||
      userSectorPrivilege === SECTOR_PRIVILEGES.FINANCIAL ||
      userSectorPrivilege === SECTOR_PRIVILEGES.COMMERCIAL ||
      userSectorPrivilege === SECTOR_PRIVILEGES.LOGISTIC ||
      userSectorPrivilege === SECTOR_PRIVILEGES.DESIGNER;
    const canViewInvoiceTo =
      userSectorPrivilege === SECTOR_PRIVILEGES.ADMIN ||
      userSectorPrivilege === SECTOR_PRIVILEGES.FINANCIAL ||
      userSectorPrivilege === SECTOR_PRIVILEGES.COMMERCIAL ||
      userSectorPrivilege === SECTOR_PRIVILEGES.LOGISTIC;

    // Filter the group's logs by field permissions
    const filteredGroup = group.filter((log) => {
      if (!log.field) return true;
      const fieldLower = log.field.toLowerCase();
      if (alwaysHiddenFields.includes(log.field)) return false;
      if (!canViewFinancial && financialFieldsList.some(f => fieldLower.includes(f.toLowerCase()))) return false;
      if (!canViewRestricted && restrictedFieldsList.some(f => fieldLower.includes(f.toLowerCase()))) return false;
      if (!canViewInvoiceTo && invoiceToFieldsList.some(f => fieldLower.includes(f.toLowerCase()))) return false;
      return true;
    });

    // Separate status change, timestamp changes, and user changes like the web does
    const statusChange = filteredGroup.find(c => c.field === 'status');
    const timestampFields = ['startedAt', 'finishedAt', 'approvedAt', 'completedAt'];
    const userFieldsList2 = ['startedById', 'completedById', 'approvedById'];

    // Fields to skip from individual display (they're summarized with status change)
    const fieldsToSkip = new Set<string>();
    if (statusChange) {
      // If there's a status change, skip related timestamp and user fields
      timestampFields.forEach(f => fieldsToSkip.add(f));
      userFieldsList2.forEach(f => fieldsToSkip.add(f));
    }

    filteredGroup.forEach((log, idx) => {
      const field = log.field;

      // Skip fields that are summarized with status change
      if (field && fieldsToSkip.has(field)) {
        return;
      }

      const fieldLabel = getFieldLabel(field, log.entityType);

      if ((log.action === CHANGE_LOG_ACTION.UPDATE || log.action === CHANGE_LOG_ACTION.ROLLBACK || log.action === CHANGE_LOG_ACTION.BATCH_UPDATE) && field) {
        // Special handling for file array fields - show thumbnails
        if (FILE_ARRAY_FIELDS.includes(field)) {
          const oldFiles = parseFileArrayValue(log.oldValue);
          const newFiles = parseFileArrayValue(log.newValue);

          changes.push(
            <View key={`${log.id}-${idx}`} style={styles.changeRow}>
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Campo: <ThemedText style={{ fontSize: fontSize.xs, color: colors.foreground, fontWeight: "500" }}>{fieldLabel}</ThemedText></ThemedText>
              <View style={styles.changeValuesVertical}>
                <View style={styles.fileValueRow}>
                  <ThemedText style={[styles.valueLabel, { color: colors.mutedForeground }]}>Antes: </ThemedText>
                  <FileArrayDisplay files={oldFiles} field={field} isOldValue />
                </View>
                <View style={styles.fileValueRow}>
                  <ThemedText style={[styles.valueLabel, { color: colors.mutedForeground }]}>Depois: </ThemedText>
                  <FileArrayDisplay files={newFiles} field={field} />
                </View>
              </View>
            </View>
          );
          return;
        }

        // Special handling for pricingId (Orçamento) - matching web implementation
        if (field === "pricingId") {
          const oldPricing = parsePricingValue(log.oldValue);
          const newPricing = parsePricingValue(log.newValue);

          changes.push(
            <View key={`${log.id}-${idx}`} style={styles.changeRow}>
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Campo: <ThemedText style={{ fontSize: fontSize.xs, color: colors.foreground, fontWeight: "500" }}>{fieldLabel}</ThemedText></ThemedText>
              <View style={styles.changeValuesVertical}>
                <View style={styles.pricingValueRow}>
                  <ThemedText style={[styles.valueLabel, { color: colors.mutedForeground }]}>Antes:</ThemedText>
                  {renderPricingValue(oldPricing, true)}
                </View>
                <View style={styles.pricingValueRow}>
                  <ThemedText style={[styles.valueLabel, { color: colors.mutedForeground }]}>Depois:</ThemedText>
                  {renderPricingValue(newPricing, false)}
                </View>
              </View>
            </View>
          );
          return;
        }

        // Special handling for status field - show "Status: old → new" format (matching web)
        if (field === "status") {
          // Use the correct label map based on entity type
          const statusLabels = log.entityType === CHANGE_LOG_ENTITY_TYPE.TASK
            ? TASK_STATUS_LABELS
            : log.entityType === CHANGE_LOG_ENTITY_TYPE.TASK_PRICING
              ? TASK_PRICING_STATUS_LABELS
              : SERVICE_ORDER_STATUS_LABELS;
          const oldStatusLabel = log.oldValue
            ? (statusLabels as Record<string, string>)[log.oldValue] || String(log.oldValue)
            : "Nenhum";
          const newStatusLabel = log.newValue
            ? (statusLabels as Record<string, string>)[log.newValue] || String(log.newValue)
            : "Nenhum";

          changes.push(
            <View key={`${log.id}-${idx}`} style={styles.changeRow}>
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Status:{" "}
                <ThemedText style={{ fontSize: fontSize.xs, color: colors.destructive }}>{oldStatusLabel}</ThemedText>
                <ThemedText style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}> → </ThemedText>
                <ThemedText style={{ fontSize: fontSize.xs, color: colors.success }}>{newStatusLabel}</ThemedText>
              </ThemedText>
            </View>
          );
          return;
        }

        // Special handling for type field - show formatted label
        if (field === "type" && log.entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER) {
          const oldTypeLabel = log.oldValue
            ? SERVICE_ORDER_TYPE_LABELS[log.oldValue as keyof typeof SERVICE_ORDER_TYPE_LABELS] || String(log.oldValue)
            : "Nenhum";
          const newTypeLabel = log.newValue
            ? SERVICE_ORDER_TYPE_LABELS[log.newValue as keyof typeof SERVICE_ORDER_TYPE_LABELS] || String(log.newValue)
            : "Nenhum";

          changes.push(
            <View key={`${log.id}-${idx}`} style={styles.changeRow}>
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Campo: <ThemedText style={{ fontSize: fontSize.xs, color: colors.foreground, fontWeight: "500" }}>{fieldLabel}</ThemedText></ThemedText>
              <View style={styles.changeValuesVertical}>
                <View style={styles.valueRow}>
                  <ThemedText style={[styles.valueLabel, { color: colors.mutedForeground }]}>Antes: </ThemedText>
                  <ThemedText style={[styles.oldValue, { color: colors.destructive }]}>
                    {oldTypeLabel}
                  </ThemedText>
                </View>
                <View style={styles.valueRow}>
                  <ThemedText style={[styles.valueLabel, { color: colors.mutedForeground }]}>Depois: </ThemedText>
                  <ThemedText style={[styles.newValue, { color: colors.success }]}>
                    {newTypeLabel}
                  </ThemedText>
                </View>
              </View>
            </View>
          );
          return;
        }

        const oldValue = formatValueWithEntity(log.oldValue, field, log.entityType, entityDetails, log.metadata);
        const newValue = formatValueWithEntity(log.newValue, field, log.entityType, entityDetails, log.metadata);

        changes.push(
          <View key={`${log.id}-${idx}`} style={styles.changeRow}>
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Campo: <ThemedText style={{ fontSize: fontSize.xs, color: colors.foreground, fontWeight: "500" }}>{fieldLabel}</ThemedText></ThemedText>
            <View style={styles.changeValuesVertical}>
              <View style={styles.valueRow}>
                <ThemedText style={[styles.valueLabel, { color: colors.mutedForeground }]}>Antes: </ThemedText>
                <ThemedText style={[styles.oldValue, { color: colors.destructive }]}>
                  {String(oldValue || "Nenhum")}
                </ThemedText>
              </View>
              <View style={styles.valueRow}>
                <ThemedText style={[styles.valueLabel, { color: colors.mutedForeground }]}>Depois: </ThemedText>
                <ThemedText style={[styles.newValue, { color: colors.success }]}>
                  {String(newValue || "Nenhum")}
                </ThemedText>
              </View>
            </View>
          </View>
        );
      } else if (log.action === CHANGE_LOG_ACTION.CREATE && field && log.newValue !== null && log.newValue !== undefined) {
        // Special handling for file array fields - show thumbnails
        if (FILE_ARRAY_FIELDS.includes(field)) {
          const newFiles = parseFileArrayValue(log.newValue);
          if (newFiles && newFiles.length > 0) {
            changes.push(
              <View key={`${log.id}-${idx}`} style={styles.changeRow}>
                <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{fieldLabel}:</ThemedText>
                <FileArrayDisplay files={newFiles} field={field} />
              </View>
            );
          }
          return;
        }

        // Special handling for pricingId on CREATE
        if (field === "pricingId") {
          const newPricing = parsePricingValue(log.newValue);
          changes.push(
            <View key={`${log.id}-${idx}`} style={styles.changeRow}>
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Campo: <ThemedText style={{ fontSize: fontSize.xs, color: colors.foreground, fontWeight: "500" }}>{fieldLabel}</ThemedText></ThemedText>
              <View style={styles.pricingValueRow}>
                {renderPricingValue(newPricing, false)}
              </View>
            </View>
          );
          return;
        }

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
  const isAutomatic = triggeredBy === CHANGE_TRIGGERED_BY.SYSTEM || triggeredBy === CHANGE_TRIGGERED_BY.SCHEDULED_JOB;

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
        {/* Header with title and timestamp (matching web) */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitle}>{getTitle()}</View>
          <ThemedText style={[styles.headerTime, { color: colors.mutedForeground }]}>
            {formatRelativeTime(firstLog.createdAt)}
          </ThemedText>
        </View>

        {getChanges()}

        {/* Footer with user (matching web format: "Por: userName") */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <ThemedText style={[styles.footerText, { color: colors.mutedForeground }]}>
            Por:{" "}
            <ThemedText style={[styles.footerUserName, { color: colors.foreground }]}>
              {isAutomatic ? "Sistema" : userName}
            </ThemedText>
          </ThemedText>
        </View>
      </View>
    </View>
  );
});

TimelineItem.displayName = 'TimelineItem';

// Loading skeleton
export const ChangelogSkeleton = React.memo(() => {
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
});

ChangelogSkeleton.displayName = 'ChangelogSkeleton';

export function TaskWithServiceOrdersChangelog({
  taskId,
  taskName,
  taskCreatedAt,
  serviceOrderIds,
  truckId,
  layoutIds = [],
  pricingId,
  limit = 100,
}: TaskWithServiceOrdersChangelogProps) {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Get user privilege for filtering service orders and field visibility
  const userSectorPrivilege = user?.sector?.privileges;

  // Get visible service order types based on user privileges
  const visibleServiceOrderTypes = useMemo(
    () => getVisibleServiceOrderTypes(user ?? null),
    [user]
  );

  // Build OR conditions to fetch all changelogs in a single query
  const orConditions = useMemo(() => {
    const conditions: any[] = [
      { entityType: CHANGE_LOG_ENTITY_TYPE.TASK, entityId: taskId },
    ];
    if (serviceOrderIds.length > 0) {
      conditions.push({ entityType: CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER, entityId: { in: serviceOrderIds } });
    }
    if (truckId) {
      conditions.push({ entityType: CHANGE_LOG_ENTITY_TYPE.TRUCK, entityId: truckId });
    }
    if (layoutIds.length > 0) {
      conditions.push({ entityType: CHANGE_LOG_ENTITY_TYPE.LAYOUT, entityId: { in: layoutIds } });
    }
    if (pricingId) {
      conditions.push({ entityType: CHANGE_LOG_ENTITY_TYPE.TASK_PRICING, entityId: pricingId });
    }
    return conditions;
  }, [taskId, serviceOrderIds, truckId, layoutIds, pricingId]);

  // Single combined changelog query using OR conditions
  const { data: allLogsResponse, isLoading } = useChangeLogs({
    where: { OR: orConditions },
    include: { user: true },
    limit,
    orderBy: { createdAt: "desc" },
  });

  // Process and filter all changelogs from the single combined response
  const allChangelogs = useMemo(() => {
    const allLogs: ChangeLog[] = allLogsResponse?.data || [];

    // Separate service order logs for type-based filtering
    const serviceLogs = allLogs.filter(
      (log) => log.entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER
    );
    const nonServiceLogs = allLogs.filter(
      (log) => log.entityType !== CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER
    );

    // Build serviceOrderTypeMap from SERVICE_ORDER CREATE actions (matching web)
    const serviceOrderTypeMap = new Map<string, string>();
    serviceLogs.forEach((log) => {
      if (
        log.action === CHANGE_LOG_ACTION.CREATE &&
        log.newValue &&
        log.entityId
      ) {
        try {
          const data = typeof log.newValue === "string" ? JSON.parse(log.newValue) : log.newValue;
          if (data?.type) {
            serviceOrderTypeMap.set(log.entityId, data.type);
          }
        } catch { /* ignore parse errors */ }
      }
    });

    // Filter service order logs by visible types using the map (matching web)
    // If type can't be determined, hide by default for security
    const filteredServiceLogs = serviceLogs.filter((log) => {
      const serviceOrderType = serviceOrderTypeMap.get(log.entityId);
      if (!serviceOrderType) return false;
      return visibleServiceOrderTypes.includes(serviceOrderType as SERVICE_ORDER_TYPE);
    });

    const logs = [...nonServiceLogs, ...filteredServiceLogs];

    // Sort by createdAt descending
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Define fields to filter (matching web changelog-history.tsx)
    const sensitiveFields = ["sessionToken", "verificationCode", "verificationExpiresAt", "verificationType", "password", "token", "apiKey", "secret"];

    // Filter logs - only sensitive fields at this level (per-field permission filtering moved to TimelineItem)
    const filteredLogs = logs.filter((log) => {
      // Skip logs without field (CREATE/DELETE actions are ok)
      if (!log.field) return true;

      const fieldLower = log.field.toLowerCase();

      // Always filter out sensitive fields
      if (sensitiveFields.some((sensitive) => fieldLower.includes(sensitive.toLowerCase()))) {
        return false;
      }

      return true;
    });

    return filteredLogs.slice(0, limit);
  }, [allLogsResponse, visibleServiceOrderTypes, limit]);

  // Extract entity IDs for detail fetching - grouped by entity type
  const entityIdsByType = useMemo(() => {
    const customerIds = new Set<string>();
    const sectorIds = new Set<string>();
    const paintIds = new Set<string>();
    const truckIds = new Set<string>();
    const userIds = new Set<string>();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // User fields that should resolve to user names
    const userFieldNames = [
      "userId", "assignedToId", "createdById", "startedById", "approvedById",
      "completedById", "reviewedBy", "rejectedBy", "cancelledBy", "responsibleUserId"
    ];

    // Paint array fields (matching web)
    const paintArrayFields = ["logoPaints", "paints", "groundPaints", "paintGrounds"];

    // Helper to extract paint IDs from array values
    const extractPaintIds = (value: any) => {
      if (!value) return;
      try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (typeof item === "string" && uuidRegex.test(item)) {
              paintIds.add(item);
            } else if (item && typeof item === "object" && item.id) {
              paintIds.add(item.id);
            }
          });
        }
      } catch { /* ignore */ }
    };

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
        } else if (field && userFieldNames.includes(field)) {
          userIds.add(value);
        }
      };

      processValue(log.oldValue, log.field);
      processValue(log.newValue, log.field);

      // Extract assignedToId from SERVICE_ORDER CREATE newValue (matching web)
      if (
        log.entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER &&
        log.action === CHANGE_LOG_ACTION.CREATE &&
        log.newValue
      ) {
        try {
          const createdData = typeof log.newValue === "string" ? JSON.parse(log.newValue) : log.newValue;
          if (createdData?.assignedToId && typeof createdData.assignedToId === "string") {
            userIds.add(createdData.assignedToId);
          }
        } catch { /* ignore */ }
      }

      // Extract paint IDs from paint array fields (matching web)
      if (log.field && paintArrayFields.includes(log.field)) {
        extractPaintIds(log.oldValue);
        extractPaintIds(log.newValue);
      }

      // Extract user IDs from negotiatingWith field (matching web)
      if (log.field === "negotiatingWith") {
        const extractUserFromNegotiating = (value: any) => {
          if (!value) return;
          try {
            const parsed = typeof value === "string" ? JSON.parse(value) : value;
            if (parsed?.userId) userIds.add(parsed.userId);
          } catch { /* ignore */ }
        };
        extractUserFromNegotiating(log.oldValue);
        extractUserFromNegotiating(log.newValue);
      }

      // Note: representatives/representativeIds are NOT added to userIds (matching web)
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

  // Progressive rendering: show 10 groups initially, expand on demand
  const INITIAL_VISIBLE = 10;
  const LOAD_MORE_COUNT = 20;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const totalGroups = groupedChangelogs.length;
  const hasMore = visibleCount < totalGroups;

  // Build a limited view of dateGroups respecting visibleCount
  const visibleDateGroups = useMemo(() => {
    const result = new Map<string, ChangeLog[][]>();
    let count = 0;
    for (const [dateKey, groups] of dateGroups.entries()) {
      if (count >= visibleCount) break;
      const remaining = visibleCount - count;
      const visibleGroups = groups.slice(0, remaining);
      result.set(dateKey, visibleGroups);
      count += visibleGroups.length;
    }
    return result;
  }, [dateGroups, visibleCount]);

  const handleShowMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, totalGroups));
  }, [totalGroups]);

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
    <View style={styles.container}>
        {Array.from(visibleDateGroups.entries()).map(([dateKey, groups], dateIdx) => (
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
                isLast={!hasMore && dateIdx === visibleDateGroups.size - 1 && idx === groups.length - 1}
                entityDetails={entityDetails}
                userSectorPrivilege={userSectorPrivilege}
              />
            ))}
          </View>
        ))}

        {/* Show more button */}
        {hasMore && (
          <TouchableOpacity
            onPress={handleShowMore}
            style={[styles.showMoreButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.showMoreText, { color: colors.primary }]}>
              Mostrar mais ({totalGroups - visibleCount} restantes)
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Creation marker */}
        {!hasMore && taskCreatedAt && (
          <View style={styles.creationMarker}>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
            <View style={[styles.creationBadge, { backgroundColor: colors.success + "20", borderColor: colors.success }]}>
              <IconPlus size={12} color={colors.success} />
              <ThemedText style={[styles.creationText, { color: colors.success }]}>
                {taskName || "Tarefa"} criada em{" "}
                {new Date(taskCreatedAt).toLocaleDateString("pt-BR")}
              </ThemedText>
            </View>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
          </View>
        )}
      </View>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerTime: {
    fontSize: fontSize.xs,
    flexShrink: 0,
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
  },
  changeRow: {
    marginBottom: spacing.sm,
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
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: fontSize.xs,
  },
  footerUserName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
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
  // File thumbnail styles
  fileThumbnailContainer: {
    position: "relative",
  },
  fileThumbnailImage: {
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  fileThumbnailPlaceholder: {
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fileThumbnailLoading: {
    position: "absolute",
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // File array display styles
  fileArrayContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  fileArrayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  fileArrayCount: {
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
  },
  fileArrayEmpty: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  fileValueRow: {
    flexDirection: "column",
    gap: spacing.xs,
  },
  // Pricing/Budget card styles (matching web)
  pricingCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  pricingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pricingTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  pricingTotal: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  pricingItems: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  pricingItemsLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  pricingItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  pricingItemDesc: {
    fontSize: fontSize.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  pricingItemAmount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  pricingValueRow: {
    marginTop: spacing.xs,
  },
  // Status change text style (matching web "Status: old → new" format)
  statusChangeText: {
    fontSize: fontSize.xs,
  },
  showMoreButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  showMoreText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});

export default TaskWithServiceOrdersChangelog;
