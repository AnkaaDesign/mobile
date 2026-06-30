import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { StandardModal } from "@/components/ui/standard-modal";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { TASK_STATUS } from "@/constants";
import { IconPlayerPlay, IconPlayerPause, IconCheck, IconX, IconClock, IconReceipt, IconCash } from "@tabler/icons-react-native";

interface TaskStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectStatus: (status: TASK_STATUS) => void;
  currentStatus?: TASK_STATUS;
  loading?: boolean;
}

interface StatusOption {
  value: TASK_STATUS;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: TASK_STATUS.PREPARATION,
    label: "Em Preparação",
    description: "Tarefa sendo preparada",
    icon: <IconPlayerPause size={24} color="white" />,
    color: "#f97316", // orange-500 (in preparation)
  },
  {
    value: TASK_STATUS.WAITING_PRODUCTION,
    label: "Aguardando Produção",
    description: "Tarefa aguardando início da produção",
    icon: <IconClock size={24} color="white" />,
    color: "#737373", // neutral-500 (waiting)
  },
  {
    value: TASK_STATUS.IN_PRODUCTION,
    label: "Em Produção",
    description: "Tarefa em andamento",
    icon: <IconPlayerPlay size={24} color="white" />,
    color: "#2563eb", // blue-600 (in progress)
  },
  {
    value: TASK_STATUS.COMPLETED,
    label: "Concluída",
    description: "Tarefa finalizada",
    icon: <IconCheck size={24} color="white" />,
    color: "#15803d", // green-700 (finished)
  },
  {
    value: TASK_STATUS.CANCELLED,
    label: "Cancelada",
    description: "Tarefa cancelada",
    icon: <IconX size={24} color="white" />,
    color: "#b91c1c", // red-700 (cancelled)
  },
];

export const TaskStatusModal: React.FC<TaskStatusModalProps> = ({
  visible,
  onClose,
  onSelectStatus,
  currentStatus,
  loading = false,
}) => {
  const { colors } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<TASK_STATUS | undefined>(currentStatus);

  const handleConfirm = () => {
    if (selectedStatus) {
      onSelectStatus(selectedStatus);
    }
  };

  const handleStatusPress = (status: TASK_STATUS) => {
    setSelectedStatus(status);
  };

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Definir Status"
      subtitle="Selecione o novo status para esta tarefa"
      actions={[
        { label: "Cancelar", variant: "outline", onPress: onClose, disabled: loading },
        {
          label: "Confirmar",
          onPress: handleConfirm,
          disabled: !selectedStatus || selectedStatus === currentStatus || loading,
          loading,
        },
      ]}
    >
      <View>
        {STATUS_OPTIONS.map((option) => {
          const isSelected = selectedStatus === option.value;
          const isCurrent = currentStatus === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.statusItem,
                {
                  backgroundColor: isSelected
                    ? colors.primary + "20"
                    : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleStatusPress(option.value)}
              activeOpacity={0.7}
            >
              <View style={styles.statusItemLeft}>
                <View
                  style={[styles.iconContainer, { backgroundColor: option.color }]}
                >
                  {option.icon}
                </View>
                <View style={styles.statusInfo}>
                  <View style={styles.statusLabelContainer}>
                    <ThemedText
                      style={[
                        styles.statusLabel,
                        isSelected && { fontWeight: fontWeight.semibold },
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                    {isCurrent && (
                      <Badge variant="secondary" size="sm">
                        <ThemedText style={styles.badgeText}>Atual</ThemedText>
                      </Badge>
                    )}
                  </View>
                  <ThemedText style={styles.statusDescription}>
                    {option.description}
                  </ThemedText>
                </View>
              </View>
              {isSelected && (
                <View
                  style={[styles.checkmark, { backgroundColor: colors.primary }]}
                >
                  <ThemedText style={styles.checkmarkText}>✓</ThemedText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </StandardModal>
  );
};

const styles = StyleSheet.create({
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  statusItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statusInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  statusLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusLabel: {
    fontSize: fontSize.md,
  },
  statusDescription: {
    fontSize: fontSize.sm,
    opacity: 0.6,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  checkmarkText: {
    color: "white",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
