import { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Pressable, Keyboard, Alert } from "react-native";
import { ThemedText } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Combobox } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight } from "@/constants/design-system";
import { formSpacing, formLayout } from "@/constants/form-styles";
import { SECTOR_PRIVILEGES } from "@/constants";
import { updateTask, getSectors } from "@/api-client";
import { queryClient } from "@/lib/query-client";
import { taskKeys } from "@/hooks/queryKeys";
// import { showToast } from "@/components/ui/toast";
import type { Task } from "@/types";
import {
  IconUsers,
  IconX,
  IconCheck,
} from "@tabler/icons-react-native";
import { useQuery } from "@tanstack/react-query";

interface SectorSelectModalProps {
  visible: boolean;
  onClose: () => void;
  task: Task | null;
  onSuccess?: (task: Task) => void;
}

export function SectorSelectModal({
  visible,
  onClose,
  task,
  onSuccess,
}: SectorSelectModalProps) {
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);

  // Fetch production sectors
  const { data: sectorsResponse, isLoading: sectorsLoading } = useQuery({
    queryKey: ["sectors", "production-only"],
    queryFn: () => getSectors({
      where: {
        privileges: SECTOR_PRIVILEGES.PRODUCTION,
      },
      orderBy: { name: "asc" },
      limit: 100,
    }),
    enabled: visible,
  });

  const sectorOptions = useMemo(() => {
    return (sectorsResponse?.data || []).map((sector) => ({
      value: sector.id,
      label: sector.name,
    }));
  }, [sectorsResponse?.data]);

  // Reset selected sector when task changes or modal opens
  useEffect(() => {
    if (visible && task) {
      setSelectedSectorId(task.sectorId || null);
    }
  }, [visible, task]);

  const onSubmit = async () => {
    if (!task) {
      Alert.alert("Erro", "Nenhuma tarefa selecionada");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await updateTask(task.id, {
        sectorId: selectedSectorId,
      });

      queryClient.invalidateQueries({ queryKey: taskKeys.all });

      Alert.alert(
        "Sucesso",
        selectedSectorId
          ? `Setor da tarefa "${task.name}" atualizado com sucesso!`
          : `Setor da tarefa "${task.name}" removido com sucesso!`
      );

      if (response.data) {
        onSuccess?.(response.data);
      }
      onClose();
    } catch (error: any) {
      console.error("[SectorSelectModal] Error:", error);
      // API client already shows error alert
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={[styles.modal, { backgroundColor: colors.background }]} onPress={() => Keyboard.dismiss()}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
              <IconUsers size={20} color={colors.primary} />
              <ThemedText style={styles.headerTitle}>Definir Setor</ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.muted }]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <IconX size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Task name */}
            <ThemedText style={[styles.taskName, { color: colors.mutedForeground }]} numberOfLines={1}>
              {task?.name}
            </ThemedText>

            {/* Current Sector Info */}
            {task?.sector && (
              <View style={[styles.currentSector, { backgroundColor: colors.muted }]}>
                <ThemedText style={[styles.currentSectorLabel, { color: colors.mutedForeground }]}>
                  Atual:
                </ThemedText>
                <ThemedText style={styles.currentSectorValue}>
                  {task.sector?.name || "-"}
                </ThemedText>
              </View>
            )}

            {/* Sector Combobox */}
            <View style={styles.formField}>
              <ThemedText style={styles.label}>Novo Setor</ThemedText>
              <Combobox
                value={selectedSectorId || ""}
                onValueChange={(val) => setSelectedSectorId(val as string || null)}
                options={sectorOptions}
                placeholder="Selecione o setor"
                searchPlaceholder="Buscar setor..."
                emptyText="Nenhum setor encontrado"
                loading={sectorsLoading}
                searchable={true}
                clearable={true}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <View style={styles.buttonWrapper}>
              <Button
                variant="outline"
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <IconX size={18} color={colors.mutedForeground} />
                <Text style={styles.buttonText}>Cancelar</Text>
              </Button>
            </View>

            <View style={styles.buttonWrapper}>
              <Button
                variant="default"
                onPress={onSubmit}
                disabled={isSubmitting || !task}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <IconCheck size={18} color={colors.primaryForeground} />
                )}
                <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Text>
              </Button>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  taskName: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  currentSector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  currentSectorLabel: {
    fontSize: fontSize.xs,
  },
  currentSectorValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  formField: {
    gap: 6,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  footer: {
    flexDirection: "row",
    gap: formSpacing.rowGap,
    padding: formSpacing.actionBarPadding,
    borderTopWidth: formLayout.borderWidth,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
