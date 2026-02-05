import React, { useMemo, useCallback, useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, Image } from "react-native";
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
import { CHANGE_LOG_ENTITY_TYPE, CHANGE_LOG_ACTION, CHANGE_TRIGGERED_BY, CHANGE_LOG_ENTITY_TYPE_LABELS } from "@/constants";
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

// Helper function to parse JSON values
const parseJsonValue = (val: any) => {
  if (!val) return val;
  if (typeof val === "string" && (val.trim().startsWith("[") || val.trim().startsWith("{"))) {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

// Constants for date calculations (7 days in milliseconds)
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Helper function to calculate recent changes - callable outside of render
const calculateRecentChangesCount = (changelogs: ChangeLog[]): number => {
  const cutoffTime = Date.now() - SEVEN_DAYS_MS;
  return changelogs.filter((c) => new Date(c.createdAt).getTime() > cutoffTime).length;
};

// Status labels for services
const SERVICE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em Progresso",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

// Badge component for mobile
const Badge = ({
  children,
  variant = "default",
  colors,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive";
  colors: any;
}) => {
  const variantStyles: Record<string, { bg: string; text: string }> = {
    default: { bg: colors.muted + "60", text: colors.mutedForeground },
    success: { bg: "#16a34a20", text: "#16a34a" },
    warning: { bg: "#f9731620", text: "#f97316" },
    destructive: { bg: "#ef444420", text: "#ef4444" },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <View style={{ backgroundColor: style.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
      <ThemedText style={{ fontSize: 10, fontWeight: "500", color: style.text }}>{children}</ThemedText>
    </View>
  );
};

// File thumbnail component
const FileThumbnail = ({ fileId, size = 48, colors }: { fileId?: string; size?: number; colors: any }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Build thumbnail URL - backend route is /files/thumbnail/{id}?size=small
  const apiBaseUrl = getApiBaseUrl();
  const thumbnailUrl = fileId ? `${apiBaseUrl}/files/thumbnail/${fileId}?size=small` : "";

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidUuid = fileId && uuidRegex.test(fileId);

  if (!fileId || !isValidUuid || hasError) {
    return (
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: "#e5e5e5",
          borderRadius: borderRadius.sm,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        }}
      >
        <IconPhoto size={size * 0.4} color={colors.mutedForeground} />
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: "#e5e5e5",
        borderRadius: borderRadius.sm,
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      }}
    >
      <Image
        source={{ uri: thumbnailUrl, cache: "force-cache" }}
        style={{
          width: size,
          height: size,
        }}
        resizeMode="cover"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
      {isLoading && !hasError && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#e5e5e5",
          }}
        >
          <IconPhoto size={size * 0.4} color={colors.mutedForeground} />
        </View>
      )}
    </View>
  );
};

// Paint color preview component
const PaintColorPreview = ({ paint, size = 40, colors }: { paint: any; size?: number; colors: any }) => {
  if (paint?.colorPreview) {
    return (
      <Image
        source={{ uri: paint.colorPreview }}
        style={{
          width: size,
          height: size,
          borderRadius: borderRadius.sm,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: paint?.hex || "#888888",
        borderRadius: borderRadius.sm,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      }}
    />
  );
};

// Render cuts as cards
const renderCutsCards = (cuts: any[], colors: any) => {
  if (!Array.isArray(cuts) || cuts.length === 0) {
    return <ThemedText style={{ fontSize: fontSize.xs, color: colors.destructive, fontWeight: "500", marginLeft: 4 }}>—</ThemedText>;
  }

  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
      {cuts.map((cut: any, index: number) => (
        <View
          key={index}
          style={{
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
            padding: spacing.sm,
            backgroundColor: colors.card,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          {/* Cut Info */}
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "600", flex: 1 }} numberOfLines={1}>
                {cut.file?.filename || cut.file?.name || "Arquivo de recorte"}
              </ThemedText>
              {cut.status && (
                <Badge colors={colors} variant={cut.status === "COMPLETED" ? "success" : "default"}>
                  {CUT_STATUS_LABELS[cut.status as keyof typeof CUT_STATUS_LABELS] || cut.status}
                </Badge>
              )}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {cut.type && (
                <View style={{ flexDirection: "row", gap: 2 }}>
                  <ThemedText style={{ fontSize: 10, color: colors.mutedForeground }}>Tipo:</ThemedText>
                  <ThemedText style={{ fontSize: 10, color: colors.foreground }}>{CUT_TYPE_LABELS[cut.type as keyof typeof CUT_TYPE_LABELS] || cut.type}</ThemedText>
                </View>
              )}
              {cut.quantity && (
                <View style={{ flexDirection: "row", gap: 2 }}>
                  <ThemedText style={{ fontSize: 10, color: colors.mutedForeground }}>Qtd:</ThemedText>
                  <ThemedText style={{ fontSize: 10, color: colors.foreground }}>{cut.quantity}</ThemedText>
                </View>
              )}
              {cut.origin && (
                <View style={{ flexDirection: "row", gap: 2 }}>
                  <ThemedText style={{ fontSize: 10, color: colors.mutedForeground }}>Origem:</ThemedText>
                  <ThemedText style={{ fontSize: 10, color: colors.foreground }}>{CUT_ORIGIN_LABELS[cut.origin as keyof typeof CUT_ORIGIN_LABELS] || cut.origin}</ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* File Preview */}
          {(cut.file?.id || cut.fileId) && <FileThumbnail fileId={cut.file?.id || cut.fileId} size={48} colors={colors} />}
        </View>
      ))}
    </View>
  );
};

// Render services as cards
const renderServicesCards = (services: any[], colors: any) => {
  if (!Array.isArray(services) || services.length === 0) {
    return <ThemedText style={{ fontSize: fontSize.xs, color: colors.destructive, fontWeight: "500", marginLeft: 4 }}>—</ThemedText>;
  }

  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
      {services.map((service: any, index: number) => (
        <View
          key={index}
          style={{
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
            padding: spacing.sm,
            backgroundColor: colors.card,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }}>
            <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "600", flex: 1 }} numberOfLines={1}>
              {service.description || "Serviço"}
            </ThemedText>
            {service.status && (
              <Badge colors={colors} variant={service.status === "COMPLETED" ? "success" : "default"}>
                {SERVICE_STATUS_LABELS[service.status] || service.status}
              </Badge>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

// Render airbrushings as cards
const renderAirbrushingsCards = (airbrushings: any[], colors: any) => {
  if (!Array.isArray(airbrushings) || airbrushings.length === 0) {
    return <ThemedText style={{ fontSize: fontSize.xs, color: colors.destructive, fontWeight: "500", marginLeft: 4 }}>—</ThemedText>;
  }

  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
      {airbrushings.map((airbrushing: any, index: number) => (
        <View
          key={index}
          style={{
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
            padding: spacing.sm,
            backgroundColor: colors.card,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }}>
            <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "600", flex: 1 }} numberOfLines={1}>
              {airbrushing.description || "Aerografia"}
            </ThemedText>
            {airbrushing.status && (
              <Badge colors={colors} variant={airbrushing.status === "COMPLETED" ? "success" : "default"}>
                {AIRBRUSHING_STATUS_LABELS[airbrushing.status as keyof typeof AIRBRUSHING_STATUS_LABELS] || airbrushing.status}
              </Badge>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

// Render paints as cards
const renderPaintsCards = (paints: any[], colors: any) => {
  if (!Array.isArray(paints) || paints.length === 0) {
    return <ThemedText style={{ fontSize: fontSize.xs, color: colors.destructive, fontWeight: "500", marginLeft: 4 }}>—</ThemedText>;
  }

  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
      {paints.map((paint: any, index: number) => (
        <View
          key={paint.id || index}
          style={{
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
            padding: spacing.sm,
            backgroundColor: colors.card,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
            {/* Paint preview */}
            <PaintColorPreview paint={paint} size={40} colors={colors} />

            {/* Paint information */}
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" }}>
                <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "600" }} numberOfLines={1}>
                  {paint.name}
                </ThemedText>
                {paint.code && (
                  <ThemedText style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: "monospace" }}>{paint.code}</ThemedText>
                )}
              </View>

              {/* Badges */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                {paint.paintType?.name && <Badge colors={colors}>{paint.paintType.name}</Badge>}
                {paint.finish && <Badge colors={colors}>{PAINT_FINISH_LABELS[paint.finish as keyof typeof PAINT_FINISH_LABELS] || paint.finish}</Badge>}
                {paint.paintBrand?.name && <Badge colors={colors}>{paint.paintBrand.name}</Badge>}
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

// Render artworks/files as thumbnails
const renderArtworksCards = (artworks: any[], colors: any) => {
  if (!Array.isArray(artworks) || artworks.length === 0) {
    return <ThemedText style={{ fontSize: fontSize.xs, color: colors.destructive, fontWeight: "500", marginLeft: 4 }}>Nenhum arquivo</ThemedText>;
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs, alignItems: "center" }}>
      {artworks.map((file: any, idx: number) => {
        const fileId = typeof file === "string" ? file : file.id;
        return <FileThumbnail key={idx} fileId={fileId} size={48} colors={colors} />;
      })}
      <ThemedText style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>
        ({artworks.length} arquivo{artworks.length > 1 ? "s" : ""})
      </ThemedText>
    </View>
  );
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

    // TODO: Get user from auth context for privilege checking
    // For now, we'll include all fields - privilege filtering should be added
    const canViewFinancialFields = true; // TODO: Check user privileges

    // Define sensitive fields that should not be displayed
    const sensitiveFields = ["sessionToken", "verificationCode", "verificationExpiresAt", "verificationType", "password", "token", "apiKey", "secret"];

    // Define financial/document fields that should only be visible to FINANCIAL and ADMIN
    const financialFields = ["budgetIds", "invoiceIds", "receiptIds", "price", "cost", "value", "totalPrice", "totalCost", "discount", "profit", "commission"];

    // Filter out sensitive field changes and financial fields for non-privileged users
    const filteredLogs = logs.filter((log) => {
      if (!log.field) return true;

      // Check if the field is sensitive (case-insensitive)
      const fieldLower = log.field.toLowerCase();

      // Always filter out sensitive fields
      if (sensitiveFields.some((sensitive) => fieldLower.includes(sensitive.toLowerCase()))) {
        return false;
      }

      // Filter out financial fields for non-FINANCIAL/ADMIN users
      if (!canViewFinancialFields && financialFields.some((financial) => fieldLower.includes(financial.toLowerCase()))) {
        return false;
      }

      return true;
    });

    // Only add creation entry if entityCreatedAt is provided AND there's no existing CREATE action
    if (entityCreatedAt && !isLoading) {
      // Check if there's already a CREATE action in the filtered logs
      const hasCreateAction = filteredLogs.some((log) => log.action === CHANGE_LOG_ACTION.CREATE);

      if (!hasCreateAction) {
        const creationEntry: Partial<ChangeLog> = {
          id: `${entityId}-creation`,
          entityId,
          entityType,
          action: CHANGE_LOG_ACTION.CREATE,
          field: null,
          oldValue: null,
          newValue: null,
          triggeredBy: CHANGE_TRIGGERED_BY.USER,
          userId: null,
          user: undefined,
          createdAt: new Date(entityCreatedAt),
          updatedAt: new Date(entityCreatedAt),
        };

        // Add creation entry at the end (oldest)
        return [...filteredLogs, creationEntry as ChangeLog];
      }
    }

    return filteredLogs;
  }, [changelogsResponse?.data, entityCreatedAt, entityId, entityType, isLoading]);

  // Extract entity IDs for fetching names
  const entityIds = useMemo(() => {
    const categoryIds = new Set<string>();
    const brandIds = new Set<string>();
    const supplierIds = new Set<string>();
    const userIds = new Set<string>();
    const customerIds = new Set<string>();
    const sectorIds = new Set<string>();
    const paintIds = new Set<string>();
    const formulaIds = new Set<string>();
    const itemIds = new Set<string>();
    const fileIds = new Set<string>();
    const observationIds = new Set<string>();
    const truckIds = new Set<string>();
    const serviceOrderIds = new Set<string>();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    changelogs.forEach((changelog) => {
      // Collect service order IDs from SERVICE_ORDER entity type changelogs
      if (changelog.entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER && changelog.entityId) {
        serviceOrderIds.add(changelog.entityId);
      }

      // Also collect user IDs from service order related fields
      if (changelog.field === "startedById" || changelog.field === "completedById" || changelog.field === "approvedById" || changelog.field === "assignedToId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") userIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") userIds.add(changelog.newValue);
      }

      if (changelog.field === "categoryId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") categoryIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") categoryIds.add(changelog.newValue);
      } else if (changelog.field === "brandId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") brandIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") brandIds.add(changelog.newValue);
      } else if (changelog.field === "supplierId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") supplierIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") supplierIds.add(changelog.newValue);
      } else if (changelog.field === "assignedToUserId" || changelog.field === "createdById") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") userIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") userIds.add(changelog.newValue);
      } else if (changelog.field === "customerId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") customerIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") customerIds.add(changelog.newValue);
      } else if (changelog.field === "sectorId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string" && uuidRegex.test(changelog.oldValue)) sectorIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string" && uuidRegex.test(changelog.newValue)) sectorIds.add(changelog.newValue);
      } else if (changelog.field === "paintId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") paintIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") paintIds.add(changelog.newValue);
      } else if (changelog.field === "logoPaints" || changelog.field === "paints" || changelog.field === "groundPaints" || changelog.field === "paintGrounds") {
        // Extract paint IDs from arrays
        const extractPaintIds = (val: any) => {
          if (!val) return;
          const parsed = parseJsonValue(val);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              if (typeof item === "string" && uuidRegex.test(item)) {
                paintIds.add(item);
              } else if (item && typeof item === "object" && item.id) {
                paintIds.add(item.id);
              }
            });
          }
        };
        extractPaintIds(changelog.oldValue);
        extractPaintIds(changelog.newValue);
      } else if (changelog.field === "formulaId" || changelog.field === "formulaPaintId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") formulaIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") formulaIds.add(changelog.newValue);
      } else if (changelog.field === "itemId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") itemIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") itemIds.add(changelog.newValue);
      } else if (changelog.field === "budgetIds" || changelog.field === "invoiceIds" || changelog.field === "receiptIds") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") fileIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") fileIds.add(changelog.newValue);
      } else if (changelog.field === "observationId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") observationIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") observationIds.add(changelog.newValue);
      } else if (changelog.field === "truckId") {
        if (changelog.oldValue && typeof changelog.oldValue === "string") truckIds.add(changelog.oldValue);
        if (changelog.newValue && typeof changelog.newValue === "string") truckIds.add(changelog.newValue);
      }
    });

    return {
      categoryIds: Array.from(categoryIds),
      brandIds: Array.from(brandIds),
      supplierIds: Array.from(supplierIds),
      userIds: Array.from(userIds),
      customerIds: Array.from(customerIds),
      sectorIds: Array.from(sectorIds),
      paintIds: Array.from(paintIds),
      formulaIds: Array.from(formulaIds),
      itemIds: Array.from(itemIds),
      fileIds: Array.from(fileIds),
      observationIds: Array.from(observationIds),
      truckIds: Array.from(truckIds),
      serviceOrderIds: Array.from(serviceOrderIds),
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
  // Use state for recentChanges count since Date.now() cannot be called during render
  const [recentChangesCount, setRecentChangesCount] = useState(0);
  React.useEffect(() => {
    setRecentChangesCount(calculateRecentChangesCount(changelogs));
  }, [changelogs]);

  const changeStats = useMemo(() => {
    const totalChanges = changelogs.length;

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
      recentChanges: recentChangesCount,
      uniqueUsers,
      mostChangedField: mostChangedField
        ? {
            field: getFieldLabel(mostChangedField[0], entityType),
            count: mostChangedField[1],
          }
        : null,
    };
  }, [changelogs, entityType, recentChangesCount]);

  // Format value with entity name
  const formatValueWithEntity = (value: any, field: string | null, metadata?: any) => {
    if (!field) return formatFieldValue(value, field, entityType, metadata);

    if (value === null || value === undefined) return "Nenhum";

    // Parse JSON strings if needed (backend stores as Json type which may come as strings)
    const parsedValue = parseJsonValue(value);

    // Check if it's a UUID and we have entity details
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof parsedValue === "string" && uuidRegex.test(parsedValue)) {
      // Show loading state while fetching entity details
      if (isLoadingEntityDetails) {
        return "Carregando...";
      }

      // Check if we have entity details and they are Maps
      if (entityDetails) {
        try {
          if (field === "categoryId" && entityDetails.categories?.has?.(parsedValue)) {
            return entityDetails.categories.get(parsedValue) || "Categoria";
          }
          if (field === "brandId" && entityDetails.brands?.has?.(parsedValue)) {
            return entityDetails.brands.get(parsedValue) || "Marca";
          }
          if (field === "supplierId" && entityDetails.suppliers?.has?.(parsedValue)) {
            return entityDetails.suppliers.get(parsedValue) || "Fornecedor";
          }
          if ((field === "assignedToUserId" || field === "createdById") && entityDetails.users?.has?.(parsedValue)) {
            return entityDetails.users.get(parsedValue) || "Usuário";
          }
          if (field === "customerId" && entityDetails.customers?.has?.(parsedValue)) {
            return entityDetails.customers.get(parsedValue) || "Cliente";
          }
          if (field === "sectorId" && entityDetails.sectors?.has?.(parsedValue)) {
            return entityDetails.sectors.get(parsedValue) || "Setor";
          }
          if (field === "paintId" && entityDetails.paints?.has?.(parsedValue)) {
            // Return the full paint object for special rendering
            return entityDetails.paints.get(parsedValue) || "Tinta";
          }
          if ((field === "formulaId" || field === "formulaPaintId") && entityDetails.formulas?.has?.(parsedValue)) {
            return entityDetails.formulas.get(parsedValue) || "Fórmula";
          }
          if (field === "itemId" && entityDetails.items?.has?.(parsedValue)) {
            return entityDetails.items.get(parsedValue) || "Item";
          }
          if ((field === "budgetIds" || field === "invoiceIds" || field === "receiptIds") && entityDetails.files?.has?.(parsedValue)) {
            return entityDetails.files.get(parsedValue) || "Arquivo";
          }
          if (field === "observationId" && entityDetails.observations?.has?.(parsedValue)) {
            return entityDetails.observations.get(parsedValue) || "Observação";
          }
          if (field === "truckId" && entityDetails.trucks?.has?.(parsedValue)) {
            return entityDetails.trucks.get(parsedValue) || "Caminhão";
          }
        } catch (error) {
          console.error("Error accessing entity details:", error);
        }
      }

      // Fallback labels when entity details not available
      if (field === "categoryId") return "Categoria (carregando...)";
      if (field === "brandId") return "Marca (carregando...)";
      if (field === "supplierId") return "Fornecedor (carregando...)";
      if (field === "assignedToUserId" || field === "createdById") return "Usuário (carregando...)";
      if (field === "customerId") return "Cliente (carregando...)";
      if (field === "sectorId") return "Setor (carregando...)";
      if (field === "paintId") return "Tinta (carregando...)";
      if (field === "formulaId" || field === "formulaPaintId") return "Fórmula (carregando...)";
      if (field === "itemId") return "Item (carregando...)";
      if (field === "budgetIds" || field === "invoiceIds" || field === "receiptIds") return "Arquivo (carregando...)";
      if (field === "observationId") return "Observação (carregando...)";
      if (field === "truckId") return "Caminhão (carregando...)";
    }

    return formatFieldValue(parsedValue, field, entityType, metadata);
  };

  // Helper function to get full paint objects from entityDetails
  const getPaintObjects = (paintIds: any) => {
    if (!paintIds || !Array.isArray(paintIds)) return null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const paintObjects = paintIds
      .map((id: string) => {
        // ID could be a string UUID or already a full object
        if (typeof id === "object" && id !== null) return id;
        if (typeof id !== "string") return null;
        if (!uuidRegex.test(id)) return null;
        return entityDetails?.paints?.get?.(id) || null;
      })
      .filter(Boolean);

    return paintObjects.length > 0 ? paintObjects : null;
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
                    const config = actionConfig[firstChange.action] || actionConfig[CHANGE_LOG_ACTION.UPDATE];
                    const Icon = config.icon;

                    // Determine the action label
                    const actionLabel = getActionLabel(firstChange.action, firstChange.triggeredBy ?? undefined);

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
                            <ThemedText style={StyleSheet.flatten([styles.timeText, { color: colors.mutedForeground }])}>{formatRelativeTime(firstChange.createdAt)}</ThemedText>
                          </View>

                          {/* CREATE ACTION - Special handling for creation with entity details */}
                          {firstChange.action === CHANGE_LOG_ACTION.CREATE && (() => {
                            // Extract entity details from newValue for CREATE actions
                            let entityCreatedDetails: any = null;
                            try {
                              if (firstChange.newValue) {
                                entityCreatedDetails = typeof firstChange.newValue === 'string'
                                  ? JSON.parse(firstChange.newValue)
                                  : firstChange.newValue;
                              }
                            } catch {
                              // Failed to parse
                            }

                            return (
                              <View style={styles.changesContainer}>
                                {/* Service Order Details */}
                                {entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER && entityCreatedDetails && (
                                  <View style={{ gap: spacing.sm }}>
                                    {entityCreatedDetails.type && (
                                      <View style={styles.detailRow}>
                                        <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Tipo:</ThemedText>
                                        <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                                          {SERVICE_ORDER_TYPE_LABELS[entityCreatedDetails.type as keyof typeof SERVICE_ORDER_TYPE_LABELS] || entityCreatedDetails.type}
                                        </ThemedText>
                                      </View>
                                    )}
                                    {entityCreatedDetails.description && (
                                      <View style={styles.detailRow}>
                                        <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Descrição:</ThemedText>
                                        <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{entityCreatedDetails.description}</ThemedText>
                                      </View>
                                    )}
                                    {entityCreatedDetails.status && (
                                      <View style={styles.detailRow}>
                                        <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Status:</ThemedText>
                                        <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                                          {SERVICE_ORDER_STATUS_LABELS[entityCreatedDetails.status as keyof typeof SERVICE_ORDER_STATUS_LABELS] || entityCreatedDetails.status}
                                        </ThemedText>
                                      </View>
                                    )}
                                  </View>
                                )}

                                {/* Truck Details */}
                                {entityType === CHANGE_LOG_ENTITY_TYPE.TRUCK && entityCreatedDetails && (
                                  <View style={{ gap: spacing.sm }}>
                                    {entityCreatedDetails.plate && (
                                      <View style={styles.detailRow}>
                                        <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Placa:</ThemedText>
                                        <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{entityCreatedDetails.plate}</ThemedText>
                                      </View>
                                    )}
                                    {entityCreatedDetails.chassisNumber && (
                                      <View style={styles.detailRow}>
                                        <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Chassi:</ThemedText>
                                        <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{entityCreatedDetails.chassisNumber}</ThemedText>
                                      </View>
                                    )}
                                    {entityCreatedDetails.category && (
                                      <View style={styles.detailRow}>
                                        <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Categoria:</ThemedText>
                                        <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                                          {TRUCK_MANUFACTURER_LABELS[entityCreatedDetails.category as keyof typeof TRUCK_MANUFACTURER_LABELS] || entityCreatedDetails.category}
                                        </ThemedText>
                                      </View>
                                    )}
                                  </View>
                                )}

                                {/* Layout Details - Note: SVG visualization not yet implemented on mobile */}
                                {entityType === CHANGE_LOG_ENTITY_TYPE.LAYOUT && entityCreatedDetails && entityCreatedDetails.layoutSections && entityCreatedDetails.layoutSections.length > 0 && (
                                  <View style={{ gap: spacing.sm }}>
                                    <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                                      Layout criado com {entityCreatedDetails.layoutSections.length} seções
                                    </ThemedText>
                                    {/* TODO: Add SVG visualization for layouts on mobile */}
                                  </View>
                                )}
                              </View>
                            );
                          })()}

                          {/* SERVICE_ORDER UPDATE - Special handling to group related changes */}
                          {entityType === CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER && firstChange.action === CHANGE_LOG_ACTION.UPDATE && (() => {
                            // Service order details are not fetched via useEntityDetails hook
                            // The relevant data comes from the changelog itself (descriptionChange, typeChange)

                            // Group related field changes intelligently for service orders
                            const statusChange = changelogGroup.find(c => c.field === 'status');
                            const descriptionChange = changelogGroup.find(c => c.field === 'description');
                            const typeChange = changelogGroup.find(c => c.field === 'type');
                            const timestampChanges = changelogGroup.filter(c =>
                              ['startedAt', 'finishedAt', 'approvedAt', 'completedAt'].includes(c.field || '')
                            );
                            const userChanges = changelogGroup.filter(c =>
                              ['startedById', 'completedById', 'approvedById'].includes(c.field || '')
                            );
                            const otherChanges = changelogGroup.filter(c =>
                              c.field &&
                              !['status', 'statusOrder', 'description', 'type', 'startedAt', 'finishedAt', 'approvedAt', 'completedAt', 'startedById', 'completedById', 'approvedById'].includes(c.field)
                            );

                            // Build a summary of the status change
                            let statusSummary: { title: string; timestamp?: string; user?: string } | null = null;

                            if (statusChange) {
                              const newStatus = statusChange.newValue as string | null;
                              const oldStatus = statusChange.oldValue as string | null;
                              const newStatusLabel = newStatus ? (SERVICE_ORDER_STATUS_LABELS[newStatus as keyof typeof SERVICE_ORDER_STATUS_LABELS] || newStatus) : '';
                              const oldStatusLabel = oldStatus ? (SERVICE_ORDER_STATUS_LABELS[oldStatus as keyof typeof SERVICE_ORDER_STATUS_LABELS] || oldStatus) : '';

                              statusSummary = {
                                title: `Status: ${oldStatusLabel} → ${newStatusLabel}`,
                              };

                              // Add timestamp if available
                              const relevantTimestamp = timestampChanges.find(c => {
                                if (newStatus === 'IN_PROGRESS' && c.field === 'startedAt') return true;
                                if (newStatus === 'COMPLETED' && (c.field === 'finishedAt' || c.field === 'completedAt')) return true;
                                if (newStatus === 'WAITING_APPROVE' && c.field === 'approvedAt') return true;
                                return false;
                              });
                              if (relevantTimestamp?.newValue) {
                                // Parse the value - handle both double-encoded (old data) and correct format (new data)
                                let dateValue = relevantTimestamp.newValue;
                                if (typeof dateValue === 'string' && dateValue.startsWith('"') && dateValue.endsWith('"')) {
                                  try {
                                    dateValue = JSON.parse(dateValue);
                                  } catch {
                                    // If parsing fails, use as-is
                                  }
                                }
                                const date = new Date(dateValue);
                                statusSummary.timestamp = date.toLocaleDateString('pt-BR') + ' - ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                              }

                              // Add user info if available
                              const relevantUser = userChanges.find(c => {
                                if (newStatus === 'IN_PROGRESS' && c.field === 'startedById') return true;
                                if (newStatus === 'COMPLETED' && c.field === 'completedById') return true;
                                if (newStatus === 'WAITING_APPROVE' && c.field === 'approvedById') return true;
                                return false;
                              });
                              if (relevantUser?.newValue && entityDetails?.users && typeof relevantUser.newValue === 'string') {
                                // users Map stores user names as strings
                                statusSummary.user = entityDetails.users.get(relevantUser.newValue) || undefined;
                              }
                            }

                            return (
                              <View style={styles.changesContainer}>
                                {/* Service Order identification - show description and type */}
                                {(descriptionChange || typeChange) && (
                                  <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
                                    {descriptionChange?.newValue && (
                                      <View style={styles.detailRow}>
                                        <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Descrição:</ThemedText>
                                        <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                                          {String(descriptionChange.newValue)}
                                        </ThemedText>
                                      </View>
                                    )}
                                    {typeChange?.newValue && (
                                      <View style={styles.detailRow}>
                                        <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Tipo:</ThemedText>
                                        <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                                          {SERVICE_ORDER_TYPE_LABELS[typeChange.newValue as keyof typeof SERVICE_ORDER_TYPE_LABELS] || String(typeChange.newValue)}
                                        </ThemedText>
                                      </View>
                                    )}
                                  </View>
                                )}

                                {/* Status change summary */}
                                {statusSummary && (
                                  <View style={StyleSheet.flatten([styles.statusSummary, { backgroundColor: colors.muted + '30' }])}>
                                    <ThemedText style={StyleSheet.flatten([styles.statusTitle, { color: colors.foreground }])}>{statusSummary.title}</ThemedText>
                                    {statusSummary.timestamp && (
                                      <View style={styles.statusDetail}>
                                        <IconClock size={12} color={colors.mutedForeground} />
                                        <ThemedText style={StyleSheet.flatten([styles.statusDetailText, { color: colors.mutedForeground }])}>{statusSummary.timestamp}</ThemedText>
                                      </View>
                                    )}
                                    {statusSummary.user && (
                                      <View style={styles.statusDetail}>
                                        <IconUser size={12} color={colors.mutedForeground} />
                                        <ThemedText style={StyleSheet.flatten([styles.statusDetailText, { color: colors.mutedForeground }])}>Por: {statusSummary.user}</ThemedText>
                                      </View>
                                    )}
                                  </View>
                                )}

                                {/* Other field changes */}
                                {otherChanges.length > 0 && otherChanges.map((changelog) => (
                                  <View key={changelog.id} style={styles.changeItem}>
                                    <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>{getFieldLabel(changelog.field ?? '', entityType)}: </ThemedText>
                                    <View style={styles.inlineValues}>
                                      <ThemedText style={{ fontSize: fontSize.xs, color: colors.destructive, textDecorationLine: 'line-through', marginRight: 8 }}>
                                        {formatFieldValue(changelog.oldValue, changelog.field, entityType) || 'Nenhum'}
                                      </ThemedText>
                                      <ThemedText style={{ fontSize: fontSize.xs, color: colors.success }}>
                                        {formatFieldValue(changelog.newValue, changelog.field, entityType) || 'Nenhum'}
                                      </ThemedText>
                                    </View>
                                  </View>
                                ))}
                              </View>
                            );
                          })()}

                          {/* Changes (generic) */}
                          {entityType !== CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER && firstChange.action !== CHANGE_LOG_ACTION.CREATE && changelogGroup.length > 0 && (
                            <View style={styles.changesContainer}>
                              {changelogGroup
                                .filter((changelog) => {
                                  // Exclude internal/system fields from display
                                  if (changelog.field === "statusOrder") return false;
                                  if (changelog.field === "colorOrder") return false;

                                  // Exclude services field when it's just internal updates (service orders have their own changelog)
                                  if (changelog.field === "services") {
                                    const parseValue = (val: any) => {
                                      if (!val) return val;
                                      if (typeof val === "string" && (val.trim().startsWith("[") || val.trim().startsWith("{"))) {
                                        try {
                                          return JSON.parse(val);
                                        } catch {
                                          return val;
                                        }
                                      }
                                      return val;
                                    };

                                    const oldParsed = parseValue(changelog.oldValue);
                                    const newParsed = parseValue(changelog.newValue);
                                    const oldCount = Array.isArray(oldParsed) ? oldParsed.length : 0;
                                    const newCount = Array.isArray(newParsed) ? newParsed.length : 0;

                                    // If count is the same, services weren't added/removed, just updated - don't show
                                    if (oldCount === newCount && oldCount > 0) {
                                      return false;
                                    }
                                  }

                                  return true;
                                })
                                .map((changelog, changeIndex) => {
                                if (!changelog.field) return null;

                                const showSeparator = changeIndex > 0;

                                // Parse values for special field handling
                                const oldParsed = parseJsonValue(changelog.oldValue);
                                const newParsed = parseJsonValue(changelog.newValue);

                                return (
                                  <View key={changelog.id}>
                                    {showSeparator && <View style={StyleSheet.flatten([styles.changeSeparator, { backgroundColor: colors.border }])} />}

                                    <View style={styles.changeItem}>
                                      <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>{getFieldLabel(changelog.field ?? '', entityType)}</ThemedText>

                                      {/* Special handling for cuts/cutRequest/cutPlan */}
                                      {(changelog.field === "cuts" || changelog.field === "cutRequest" || changelog.field === "cutPlan") ? (
                                        <View style={styles.fieldValues}>
                                          <View>
                                            <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Antes:</ThemedText>
                                            {renderCutsCards(oldParsed, colors)}
                                          </View>
                                          <View style={{ marginTop: spacing.sm }}>
                                            <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Depois:</ThemedText>
                                            {renderCutsCards(newParsed, colors)}
                                          </View>
                                        </View>
                                      ) : changelog.field === "services" ? (
                                        /* Special handling for services - DON'T show for TASK since service orders have their own changelog */
                                        (() => {
                                          // Check if old or new is empty
                                          const hasOld = Array.isArray(oldParsed) && oldParsed.length > 0;
                                          const hasNew = Array.isArray(newParsed) && newParsed.length > 0;

                                          // Check if services were actually added or removed (count changed)
                                          const oldCount = Array.isArray(oldParsed) ? oldParsed.length : 0;
                                          const newCount = Array.isArray(newParsed) ? newParsed.length : 0;

                                          // If count is the same, services weren't added/removed, just updated internally
                                          // In this case, don't show anything - individual service order changelogs will show below
                                          if (oldCount === newCount && oldCount > 0) {
                                            return null;
                                          }

                                          // Only show services being added (no "Antes:/Depois:" labels)
                                          if (!hasOld && hasNew) {
                                            return renderServicesCards(newParsed, colors);
                                          }

                                          // Only show services being removed
                                          if (hasOld && !hasNew) {
                                            return (
                                              <View>
                                                <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground, marginBottom: spacing.xs }])}>Removidos:</ThemedText>
                                                {renderServicesCards(oldParsed, colors)}
                                              </View>
                                            );
                                          }

                                          // Show added and removed services when count changed
                                          if (hasOld && hasNew && oldCount !== newCount) {
                                            // Find which services were added/removed by ID
                                            const oldIds = new Set(oldParsed.map((s: any) => s.id).filter(Boolean));
                                            const newIds = new Set(newParsed.map((s: any) => s.id).filter(Boolean));

                                            const addedServices = newParsed.filter((s: any) => s.id && !oldIds.has(s.id));
                                            const removedServices = oldParsed.filter((s: any) => s.id && !newIds.has(s.id));

                                            return (
                                              <>
                                                {removedServices.length > 0 && (
                                                  <View style={{ marginBottom: spacing.sm }}>
                                                    <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground, marginBottom: spacing.xs }])}>Removidos:</ThemedText>
                                                    {renderServicesCards(removedServices, colors)}
                                                  </View>
                                                )}
                                                {addedServices.length > 0 && (
                                                  <View>
                                                    {removedServices.length > 0 && <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground, marginBottom: spacing.xs }])}>Adicionados:</ThemedText>}
                                                    {renderServicesCards(addedServices, colors)}
                                                  </View>
                                                )}
                                              </>
                                            );
                                          }

                                          // Nothing to show
                                          return null;
                                        })()
                                      ) : changelog.field === "airbrushings" ? (
                                        /* Special handling for airbrushings */
                                        <View style={styles.fieldValues}>
                                          <View>
                                            <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Antes:</ThemedText>
                                            {renderAirbrushingsCards(oldParsed, colors)}
                                          </View>
                                          <View style={{ marginTop: spacing.sm }}>
                                            <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Depois:</ThemedText>
                                            {renderAirbrushingsCards(newParsed, colors)}
                                          </View>
                                        </View>
                                      ) : changelog.field === "paintId" ? (
                                        /* Special handling for paintId - render as single paint card */
                                        (() => {
                                          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                                          const getFullPaint = (paintIdValue: any) => {
                                            if (!paintIdValue || typeof paintIdValue !== "string") return null;
                                            if (!uuidRegex.test(paintIdValue)) return null;
                                            return entityDetails?.paints?.get?.(paintIdValue) || null;
                                          };
                                          const oldPaint = getFullPaint(changelog.oldValue);
                                          const newPaint = getFullPaint(changelog.newValue);

                                          return (
                                            <View style={styles.fieldValues}>
                                              <View>
                                                <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Antes:</ThemedText>
                                                {oldPaint ? renderPaintsCards([oldPaint], colors) : (
                                                  <ThemedText style={{ fontSize: fontSize.xs, color: colors.destructive, fontWeight: "500", marginLeft: 4 }}>—</ThemedText>
                                                )}
                                              </View>
                                              <View style={{ marginTop: spacing.sm }}>
                                                <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Depois:</ThemedText>
                                                {newPaint ? renderPaintsCards([newPaint], colors) : (
                                                  <ThemedText style={{ fontSize: fontSize.xs, color: colors.success, fontWeight: "500", marginLeft: 4 }}>—</ThemedText>
                                                )}
                                              </View>
                                            </View>
                                          );
                                        })()
                                      ) : (changelog.field === "logoPaints" || changelog.field === "paints" || changelog.field === "paintGrounds" || changelog.field === "groundPaints") ? (
                                        /* Special handling for paint arrays */
                                        (() => {
                                          const oldPaints = getPaintObjects(oldParsed);
                                          const newPaints = getPaintObjects(newParsed);

                                          return (
                                            <View style={styles.fieldValues}>
                                              <View>
                                                <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Antes:</ThemedText>
                                                {renderPaintsCards(oldPaints ?? [], colors)}
                                              </View>
                                              <View style={{ marginTop: spacing.sm }}>
                                                <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Depois:</ThemedText>
                                                {renderPaintsCards(newPaints ?? [], colors)}
                                              </View>
                                            </View>
                                          );
                                        })()
                                      ) : (changelog.field === "artworks" || changelog.field === "budgets" || changelog.field === "invoices" || changelog.field === "receipts") ? (
                                        /* Special handling for file fields - show thumbnails */
                                        <View style={styles.fieldValues}>
                                          <View>
                                            <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Antes:</ThemedText>
                                            {renderArtworksCards(oldParsed, colors)}
                                          </View>
                                          <View style={{ marginTop: spacing.sm }}>
                                            <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Depois:</ThemedText>
                                            {renderArtworksCards(newParsed, colors)}
                                          </View>
                                        </View>
                                      ) : (changelog.field === "logoId" || changelog.field === "logo") ? (
                                        /* Special handling for logo fields */
                                        <View style={styles.fieldValues}>
                                          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                                            <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Antes:</ThemedText>
                                            {changelog.oldValue && typeof changelog.oldValue === 'string' ? (
                                              <FileThumbnail fileId={changelog.oldValue} size={40} colors={colors} />
                                            ) : (
                                              <ThemedText style={{ fontSize: fontSize.xs, color: colors.destructive, fontWeight: "500" }}>—</ThemedText>
                                            )}
                                          </View>
                                          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs }}>
                                            <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Depois:</ThemedText>
                                            {changelog.newValue && typeof changelog.newValue === 'string' ? (
                                              <FileThumbnail fileId={changelog.newValue} size={40} colors={colors} />
                                            ) : (
                                              <ThemedText style={{ fontSize: fontSize.xs, color: colors.success, fontWeight: "500" }}>—</ThemedText>
                                            )}
                                          </View>
                                        </View>
                                      ) : Array.isArray(changelog.oldValue) && Array.isArray(changelog.newValue) && changelog.field === "phones" ? (
                                        /* Special handling for phone arrays - show complete lists */
                                        <View style={styles.fieldValues}>
                                          <View style={styles.valueRow}>
                                            <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Antes:</ThemedText>
                                            <ThemedText style={StyleSheet.flatten([styles.valueText, { color: colors.destructive }])}>
                                              {formatValueWithEntity(changelog.oldValue, changelog.field)}
                                            </ThemedText>
                                          </View>
                                          <View style={styles.valueRow}>
                                            <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Depois:</ThemedText>
                                            <ThemedText style={StyleSheet.flatten([styles.valueText, { color: colors.foreground }])}>
                                              {formatValueWithEntity(changelog.newValue, changelog.field)}
                                            </ThemedText>
                                          </View>
                                        </View>
                                      ) : Array.isArray(changelog.oldValue) && Array.isArray(changelog.newValue) &&
                                      (changelog.field === "barcodes" || changelog.field === "barcode") ? (
                                        /* Handle barcode arrays specially */
                                        <View style={styles.arrayChanges}>
                                          {(() => {
                                            const oldBarcodes = (changelog.oldValue as unknown as string[]) || [];
                                            const newBarcodes = (changelog.newValue as unknown as string[]) || [];
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
                                        /* Default field handling */
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
                                            // Field updated - always show both "Antes:" and "Depois:"
                                            <>
                                              <View style={styles.valueRow}>
                                                <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Antes:</ThemedText>
                                                <ThemedText style={StyleSheet.flatten([styles.valueText, { color: colors.destructive }])}>
                                                  {formatValueWithEntity(changelog.oldValue, changelog.field)}
                                                </ThemedText>
                                              </View>
                                              <View style={styles.valueRow}>
                                                <ThemedText style={StyleSheet.flatten([styles.valueLabel, { color: colors.mutedForeground }])}>Depois:</ThemedText>
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
                              <ThemedText style={StyleSheet.flatten([styles.userNameValue, { color: colors.foreground }])}>{firstChange.user?.name || "Sistema"}</ThemedText>
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
    fontSize: fontSize.sm,
    fontWeight: "600",
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
  // Service Order status summary styles
  statusSummary: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  statusTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  statusDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statusDetailText: {
    fontSize: fontSize.xs,
  },
  inlineValues: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: fontSize.xs,
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
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  valueText: {
    fontSize: fontSize.xs,
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
    fontSize: fontSize.xs,
  },
  arrayValue: {
    fontSize: fontSize.xs,
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
    fontSize: fontSize.xs,
    fontWeight: "400",
  },
  userNameValue: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },

  // Detail row styles for CREATE action
  detailRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: fontSize.xs,
    fontWeight: "500",
    flex: 1,
  },
});
