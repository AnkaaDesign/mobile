import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import {
  IconCircleCheckFilled,
  IconClock,
  IconLoader,
  IconX,
  IconPlayerPause,
  IconPlayerPlay,
} from "@tabler/icons-react-native";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS } from "@/constants";
import type { ServiceOrder } from "@/types";
import { formatDateTime } from "@/utils";
import { useUpdateServiceOrder } from "@/hooks/useServiceOrder";

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
  [SERVICE_ORDER_STATUS.PAUSED]: {
    icon: IconPlayerPause,
    color: "#d97706",
    bgColor: "#fffbeb",
  },
  [SERVICE_ORDER_STATUS.CANCELLED]: {
    icon: IconX,
    color: "#b91c1c",
    bgColor: "#fef2f2",
  },
  [SERVICE_ORDER_STATUS.WAITING_APPROVE]: {
    icon: IconClock,
    color: "#9333ea",
    bgColor: "#faf5ff",
  },
};

function formatActiveTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0min";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export function ServiceOrderInfoCard({ serviceOrder }: ServiceOrderInfoCardProps) {
  const { colors, isDark } = useTheme();
  const { mutate: updateServiceOrder } = useUpdateServiceOrder(serviceOrder.id);

  const status = serviceOrder.status || SERVICE_ORDER_STATUS.PENDING;
  const config = SERVICE_ORDER_STATUS_CONFIG[status] || SERVICE_ORDER_STATUS_CONFIG[SERVICE_ORDER_STATUS.PENDING];
  const StatusIcon = config.icon;

  const canPause = status === SERVICE_ORDER_STATUS.IN_PROGRESS;
  const canResume = status === SERVICE_ORDER_STATUS.PAUSED;

  const handlePause = () => {
    Alert.alert("Pausar Ordem", "Deseja pausar esta ordem de serviço?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Pausar",
        onPress: () => updateServiceOrder({ status: SERVICE_ORDER_STATUS.PAUSED }),
      },
    ]);
  };

  const handleResume = () => {
    Alert.alert("Retomar Ordem", "Deseja retomar esta ordem de serviço?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Retomar",
        onPress: () => updateServiceOrder({ status: SERVICE_ORDER_STATUS.IN_PROGRESS }),
      },
    ]);
  };

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

      {serviceOrder.pausedAt && (
        <DetailField
          label="Pausado em"
          icon="calendar"
          value={formatDateTime(serviceOrder.pausedAt)}
        />
      )}

      {serviceOrder.finishedAt && (
        <DetailField
          label="Data de Finalização"
          icon="calendar-check"
          value={formatDateTime(serviceOrder.finishedAt)}
        />
      )}

      {(serviceOrder.totalActiveTimeSeconds ?? 0) > 0 && (
        <DetailField
          label="Tempo Ativo"
          icon="clock"
          value={formatActiveTime(serviceOrder.totalActiveTimeSeconds ?? 0)}
        />
      )}

      <DetailField
        label="Última Atualização"
        icon="clock"
        value={formatDateTime(serviceOrder.updatedAt)}
      />

      {(canPause || canResume) && (
        <View style={styles.actionRow}>
          {canPause && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#d97706" }]}
              onPress={handlePause}
              activeOpacity={0.7}
            >
              <IconPlayerPause size={16} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Pausar</ThemedText>
            </TouchableOpacity>
          )}
          {canResume && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#3b82f6" }]}
              onPress={handleResume}
              activeOpacity={0.7}
            >
              <IconPlayerPlay size={16} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Retomar</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: "#fff",
  },
});
