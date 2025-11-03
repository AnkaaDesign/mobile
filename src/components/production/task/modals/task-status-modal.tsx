import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Modal, ModalContent, ModalHeader, ModalFooter } from "@/components/ui/modal";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
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
    value: TASK_STATUS.PENDING,
    label: "Pendente",
    description: "Tarefa aguardando início",
    icon: <IconClock size={24} color="white" />,
    color: "#6b7280", // gray-500
  },
  {
    value: TASK_STATUS.IN_PRODUCTION,
    label: "Em Produção",
    description: "Tarefa em andamento",
    icon: <IconPlayerPlay size={24} color="white" />,
    color: "#3b82f6", // blue-500
  },
  {
    value: TASK_STATUS.ON_HOLD,
    label: "Em Espera",
    description: "Tarefa pausada temporariamente",
    icon: <IconPlayerPause size={24} color="white" />,
    color: "#f59e0b", // amber-500
  },
  {
    value: TASK_STATUS.COMPLETED,
    label: "Concluída",
    description: "Tarefa finalizada",
    icon: <IconCheck size={24} color="white" />,
    color: "#15803d", // green-700
  },
  {
    value: TASK_STATUS.INVOICED,
    label: "Faturada",
    description: "Tarefa faturada",
    icon: <IconReceipt size={24} color="white" />,
    color: "#7c3aed", // purple-600
  },
  {
    value: TASK_STATUS.SETTLED,
    label: "Quitada",
    description: "Tarefa totalmente paga",
    icon: <IconCash size={24} color="white" />,
    color: "#059669", // emerald-600
  },
  {
    value: TASK_STATUS.CANCELLED,
    label: "Cancelada",
    description: "Tarefa cancelada",
    icon: <IconX size={24} color="white" />,
    color: "#dc2626", // red-600
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
    <Modal visible={visible} onClose={onClose} animationType="slide">
      <ModalContent style={styles.modalContent}>
        <ModalHeader>
          <ThemedText style={styles.title}>Definir Status</ThemedText>
          <ThemedText style={styles.subtitle}>
            Selecione o novo status para esta tarefa
          </ThemedText>
        </ModalHeader>

        <View style={styles.content}>
          <ScrollView style={styles.statusList} showsVerticalScrollIndicator={false}>
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
          </ScrollView>
        </View>

        <ModalFooter>
          <Button
            variant="outline"
            onPress={onClose}
            disabled={loading}
            style={styles.button}
          >
            Cancelar
          </Button>
          <Button
            onPress={handleConfirm}
            disabled={!selectedStatus || selectedStatus === currentStatus || loading}
            loading={loading}
            style={styles.button}
          >
            Confirmar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    maxHeight: "85%",
    minHeight: 500,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    minHeight: 400,
  },
  statusList: {
    flex: 1,
  },
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
  button: {
    minWidth: 100,
  },
});
