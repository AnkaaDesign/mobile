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
  [CHANGE_ACTION.CREATE]: { icon: IconPlus, color: "#16a34a" },
  [CHANGE_ACTION.UPDATE]: { icon: IconEdit, color: "#737373" },
  [CHANGE_ACTION.DELETE]: { icon: IconTrash, color: "#ef4444" },
  [CHANGE_ACTION.RESTORE]: { icon: IconRefresh, color: "#a855f7" },
  [CHANGE_ACTION.ROLLBACK]: { icon: IconRefresh, color: "#a855f7" },
  [CHANGE_ACTION.ARCHIVE]: { icon: IconArchive, color: "#6b7280" },
  [CHANGE_ACTION.UNARCHIVE]: { icon: IconArchiveOff, color: "#6b7280" },
  [CHANGE_ACTION.ACTIVATE]: { icon: IconToggleRight, color: "#16a34a" },
  [CHANGE_ACTION.DEACTIVATE]: { icon: IconToggleLeft, color: "#f97316" },
  [CHANGE_ACTION.APPROVE]: { icon: IconCheck, color: "#16a34a" },
  [CHANGE_ACTION.REJECT]: { icon: IconX, color: "#ef4444" },
  [CHANGE_ACTION.CANCEL]: { icon: IconX, color: "#ef4444" },
  [CHANGE_ACTION.COMPLETE]: { icon: IconCheck, color: "#16a34a" },
  [CHANGE_ACTION.RESCHEDULE]: { icon: IconCalendar, color: "#3b82f6" },
  [CHANGE_ACTION.BATCH_CREATE]: { icon: IconPlus, color: "#16a34a" },
  [CHANGE_ACTION.BATCH_UPDATE]: { icon: IconEdit, color: "#737373" },
  [CHANGE_ACTION.BATCH_DELETE]: { icon: IconTrash, color: "#ef4444" },
  [CHANGE_ACTION.VIEW]: { icon: IconHistory, color: "#6b7280" },
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
      // Customer fields
      if (field === "customerId" && entityDetails.customers?.has(parsedValue)) {
        return entityDetails.customers.get(parsedValue) || "Cliente";
      }
      if (field === "invoiceToId" && entityDetails.customers?.has(parsedValue)) {
        return entityDetails.customers.get(parsedValue) || "Cliente";
      }
      // Sector field
      if (field === "sectorId" && entityDetails.sectors?.has(parsedValue)) {
        return entityDetails.sectors.get(parsedValue) || "Setor";
      }
      // Paint field
      if (field === "paintId" && entityDetails.paints?.has(parsedValue)) {
        const paint = entityDetails.paints.get(parsedValue);
        return paint?.name || "Tinta";
      }
      // Truck field
      if (field === "truckId" && entityDetails.trucks?.has(parsedValue)) {
        return entityDetails.trucks.get(parsedValue) || "Caminhão";
      }
      // User fields - resolve from users map
      const userFields = [
        "assignedToId", "createdById", "startedById", "approvedById", "completedById",
        "userId", "reviewedBy", "rejectedBy", "cancelledBy", "responsibleUserId"
      ];
      if (userFields.includes(field) && entityDetails.users?.has(parsedValue)) {
        return entityDetails.users.get(parsedValue) || "Usuário";
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
    const metadata = firstLog.metadata as { sourceTaskName?: string } | undefined;
    const actionLabel = getActionLabel(firstLog.action, firstLog.triggeredBy, metadata);

    // Special handling for service orders - show description/type/status (matching web)
    if (
      firstLog.entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER &&
      firstLog.action === CHANGE_ACTION.CREATE
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

    // Special handling for service orders UPDATE - use feminine form and show description/type (matching web)
    if (
      firstLog.entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER &&
      firstLog.action === CHANGE_ACTION.UPDATE
    ) {
      // Use feminine form "Atualizada" for SERVICE_ORDER (matching web)
      const feminineActionLabel = actionLabel.replace("Atualizado", "Atualizada");

      // Extract description and type changes from the group (matching web)
      const descriptionChange = group.find((c) => c.field === "description");
      const typeChange = group.find((c) => c.field === "type");

      // Get values from changes or metadata
      const description = descriptionChange?.newValue || (firstLog.metadata as any)?.description;
      const typeValue = typeChange?.newValue || (firstLog.metadata as any)?.type;
      const typeLabel = typeValue
        ? SERVICE_ORDER_TYPE_LABELS[typeValue as keyof typeof SERVICE_ORDER_TYPE_LABELS] || typeValue
        : null;

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
        </View>
      );
    }

    return (
      <ThemedText style={[styles.itemTitle, { color: colors.foreground }]}>
        {entityLabel} {actionLabel}
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

    // Separate status change, timestamp changes, and user changes like the web does
    const statusChange = group.find(c => c.field === 'status');
    const timestampFields = ['startedAt', 'finishedAt', 'approvedAt', 'completedAt'];
    const userFields = ['startedById', 'completedById', 'approvedById'];

    // Fields to skip from individual display (they're summarized with status change)
    const fieldsToSkip = new Set<string>();
    if (statusChange) {
      // If there's a status change, skip related timestamp and user fields
      timestampFields.forEach(f => fieldsToSkip.add(f));
      userFields.forEach(f => fieldsToSkip.add(f));
    }

    group.forEach((log, idx) => {
      const field = log.field;

      // Skip fields that are summarized with status change
      if (field && fieldsToSkip.has(field)) {
        return;
      }

      const fieldLabel = getFieldLabel(field, log.entityType);

      if (log.action === CHANGE_ACTION.UPDATE && field) {
        // Special handling for file array fields - show thumbnails
        if (FILE_ARRAY_FIELDS.includes(field)) {
          const oldFiles = parseFileArrayValue(log.oldValue);
          const newFiles = parseFileArrayValue(log.newValue);

          changes.push(
            <View key={`${log.id}-${idx}`} style={styles.changeRow}>
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{fieldLabel}:</ThemedText>
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
          const oldStatusLabel = log.oldValue
            ? SERVICE_ORDER_STATUS_LABELS[log.oldValue as keyof typeof SERVICE_ORDER_STATUS_LABELS] || String(log.oldValue)
            : "Nenhum";
          const newStatusLabel = log.newValue
            ? SERVICE_ORDER_STATUS_LABELS[log.newValue as keyof typeof SERVICE_ORDER_STATUS_LABELS] || String(log.newValue)
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
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{fieldLabel}:</ThemedText>
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
                <ThemedText style={[styles.newValue, { color: colors.success }]}>
                  {String(newValue || "Nenhum")}
                </ThemedText>
              </View>
            </View>
          </View>
        );
      } else if (log.action === CHANGE_ACTION.CREATE && field && log.newValue !== null && log.newValue !== undefined) {
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

  // Check if user can view financial fields (ADMIN, FINANCIAL only)
  const canViewFinancialFields =
    userSectorPrivilege === SECTOR_PRIVILEGES.ADMIN ||
    userSectorPrivilege === SECTOR_PRIVILEGES.FINANCIAL;

  // Check if user can view restricted fields (ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC, DESIGNER only)
  const canViewRestrictedFields =
    userSectorPrivilege === SECTOR_PRIVILEGES.ADMIN ||
    userSectorPrivilege === SECTOR_PRIVILEGES.FINANCIAL ||
    userSectorPrivilege === SECTOR_PRIVILEGES.COMMERCIAL ||
    userSectorPrivilege === SECTOR_PRIVILEGES.LOGISTIC ||
    userSectorPrivilege === SECTOR_PRIVILEGES.DESIGNER;

  // Check if user can view invoiceTo field - DESIGNER cannot see it (only ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC)
  const canViewInvoiceToField =
    userSectorPrivilege === SECTOR_PRIVILEGES.ADMIN ||
    userSectorPrivilege === SECTOR_PRIVILEGES.FINANCIAL ||
    userSectorPrivilege === SECTOR_PRIVILEGES.COMMERCIAL ||
    userSectorPrivilege === SECTOR_PRIVILEGES.LOGISTIC;

  // Combine and sort all changelogs
  const allChangelogs = useMemo(() => {
    const logs: ChangeLog[] = [];

    if (taskLogs?.data) logs.push(...taskLogs.data);
    if (serviceOrderLogs?.data) logs.push(...serviceOrderLogs.data);
    if (truckLogs?.data) logs.push(...truckLogs.data);
    if (layoutLogs?.data) logs.push(...layoutLogs.data);

    // Sort by createdAt descending
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Define fields to filter (matching web changelog-history.tsx)
    const internalFields = ["statusOrder", "colorOrder"];
    const sensitiveFields = ["sessionToken", "verificationCode", "verificationExpiresAt", "verificationType", "password", "token", "apiKey", "secret"];
    const financialFields = ["budgetIds", "invoiceIds", "receiptIds", "pricingId", "price", "cost", "value", "totalPrice", "totalCost", "discount", "profit", "budget", "pricing"];
    const restrictedFields = ["forecastDate", "negotiatingWith"]; // invoiceTo removed - has its own check
    const invoiceToFields = ["invoiceTo", "invoiceToId"]; // Separate check - DESIGNER cannot see

    // Filter logs based on user permissions (matching web)
    const filteredLogs = logs.filter((log) => {
      // Filter service orders by visible types
      if (log.entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER) {
        const metadata = log.metadata as any;
        const serviceType = metadata?.type;
        if (serviceType && !visibleServiceOrderTypes.includes(serviceType)) {
          return false;
        }
      }

      // Skip logs without field (CREATE/DELETE actions are ok)
      if (!log.field) return true;

      const fieldLower = log.field.toLowerCase();

      // Always filter out internal system fields
      if (internalFields.includes(log.field)) {
        return false;
      }

      // Always filter out sensitive fields
      if (sensitiveFields.some((sensitive) => fieldLower.includes(sensitive.toLowerCase()))) {
        return false;
      }

      // Filter out financial fields for non-FINANCIAL/ADMIN users
      if (!canViewFinancialFields && financialFields.some((financial) => fieldLower.includes(financial.toLowerCase()))) {
        return false;
      }

      // Filter out restricted fields (forecastDate, negotiatingWith) for non-privileged users
      if (!canViewRestrictedFields && restrictedFields.some((restricted) => fieldLower.includes(restricted.toLowerCase()))) {
        return false;
      }

      // Filter out invoiceTo fields - DESIGNER cannot see (only ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC)
      if (!canViewInvoiceToField && invoiceToFields.some((invoiceTo) => fieldLower.includes(invoiceTo.toLowerCase()))) {
        return false;
      }

      return true;
    });

    return filteredLogs.slice(0, limit);
  }, [taskLogs, serviceOrderLogs, truckLogs, layoutLogs, visibleServiceOrderTypes, limit, canViewFinancialFields, canViewRestrictedFields, canViewInvoiceToField]);

  // Extract entity IDs for detail fetching - grouped by entity type
  const entityIdsByType = useMemo(() => {
    const customerIds = new Set<string>();
    const sectorIds = new Set<string>();
    const paintIds = new Set<string>();
    const truckIds = new Set<string>();
    const userIds = new Set<string>();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // User fields that should resolve to user names
    const userFields = [
      "userId", "assignedToId", "createdById", "startedById", "approvedById",
      "completedById", "reviewedBy", "rejectedBy", "cancelledBy", "responsibleUserId"
    ];

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
        } else if (field && userFields.includes(field)) {
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
});

export default TaskWithServiceOrdersChangelog;
