import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import {
  IconClipboardList,
  IconCircleCheckFilled,
  IconClock,
  IconLoader,
  IconX,
} from "@tabler/icons-react-native";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS } from "@/constants";
import type { ServiceOrder } from "@/types";
import { formatDate, formatDateTime } from "@/utils";

interface ServiceOrderInfoCardProps {
  serviceOrder: ServiceOrder;
}

const SERVICE_ORDER_STATUS_CONFIG: Record<
  string,
  {
    icon: any;
    color: string;
    bgColor: string;
  }
> = {
  [SERVICE_ORDER_STATUS.PENDING]: {
    icon: IconClock,
    color: "#6b7280",
    bgColor: "#f3f4f6",
  },
  [SERVICE_ORDER_STATUS.IN_PROGRESS]: {
    icon: IconLoader,
    color: "#3b82f6",
    bgColor: "#eff6ff",
  },
  [SERVICE_ORDER_STATUS.COMPLETED]: {
    icon: IconCircleCheckFilled,
    color: "#15803d",
    bgColor: "#f0fdf4",
  },
  [SERVICE_ORDER_STATUS.CANCELLED]: {
    icon: IconX,
    color: "#b91c1c",
    bgColor: "#fef2f2",
  },
};

export function ServiceOrderInfoCard({ serviceOrder }: ServiceOrderInfoCardProps) {
  const { colors, isDark } = useTheme();

  const status = serviceOrder.status || SERVICE_ORDER_STATUS.PENDING;
  const config = SERVICE_ORDER_STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconClipboardList size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações da Ordem</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* Status Badge */}
        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
            Status
          </ThemedText>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDark ? `${config.color}20` : config.bgColor,
                  borderColor: config.color,
                },
              ]}
            >
              <StatusIcon size={16} color={config.color} />
              <ThemedText
                style={[styles.statusText, { color: config.color }]}
              >
                {SERVICE_ORDER_STATUS_LABELS[status as SERVICE_ORDER_STATUS]}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
            Descrição
          </ThemedText>
          <ThemedText style={[styles.value, { color: colors.foreground }]}>
            {serviceOrder.description || "Sem descrição"}
          </ThemedText>
        </View>

        {/* Created At */}
        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
            Data de Criação
          </ThemedText>
          <ThemedText style={[styles.value, { color: colors.foreground }]}>
            {formatDateTime(serviceOrder.createdAt)}
          </ThemedText>
        </View>

        {/* Started At */}
        {serviceOrder.startedAt && (
          <View style={styles.row}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
              Data de Início
            </ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDateTime(serviceOrder.startedAt)}
            </ThemedText>
          </View>
        )}

        {/* Finished At */}
        {serviceOrder.finishedAt && (
          <View style={styles.row}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
              Data de Finalização
            </ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDateTime(serviceOrder.finishedAt)}
            </ThemedText>
          </View>
        )}

        {/* Last Updated */}
        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
            Última Atualização
          </ThemedText>
          <ThemedText style={[styles.value, { color: colors.foreground }]}>
            {formatDateTime(serviceOrder.updatedAt)}
          </ThemedText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
  row: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  value: {
    fontSize: fontSize.base,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
