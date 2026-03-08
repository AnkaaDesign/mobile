import { View, StyleSheet } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import {
  IconCircleCheckFilled,
  IconClock,
  IconLoader,
  IconX,
} from "@tabler/icons-react-native";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS } from "@/constants";
import type { ServiceOrder } from "@/types";
import { formatDateTime } from "@/utils";

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
    <DetailCard title="Informações da Ordem" icon="clipboard-list">
      <DetailField
        label="Status"
        icon="info-circle"
        value={
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
            <ThemedText style={[styles.statusText, { color: config.color }]}>
              {SERVICE_ORDER_STATUS_LABELS[status as SERVICE_ORDER_STATUS]}
            </ThemedText>
          </View>
        }
      />

      <DetailField
        label="Descrição"
        icon="file-text"
        value={serviceOrder.description || "Sem descrição"}
      />

      <DetailField
        label="Data de Criação"
        icon="calendar"
        value={formatDateTime(serviceOrder.createdAt)}
      />

      {serviceOrder.startedAt && (
        <DetailField
          label="Data de Início"
          icon="calendar"
          value={formatDateTime(serviceOrder.startedAt)}
        />
      )}

      {serviceOrder.finishedAt && (
        <DetailField
          label="Data de Finalização"
          icon="calendar-check"
          value={formatDateTime(serviceOrder.finishedAt)}
        />
      )}

      <DetailField
        label="Última Atualização"
        icon="clock"
        value={formatDateTime(serviceOrder.updatedAt)}
      />
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
