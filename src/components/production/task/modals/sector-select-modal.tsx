import { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { ThemedText } from "@/components/ui";
import { StandardModal } from "@/components/ui/standard-modal";
import { Combobox } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { updateTask, getSectors } from "@/api-client";
import { queryClient } from "@/lib/query-client";
import { taskKeys } from "@/hooks/queryKeys";
import type { Task } from "@/types";
import { IconUsers } from "@tabler/icons-react-native";
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
    <StandardModal
      visible={visible}
      onClose={handleClose}
      title="Definir Setor"
      icon={IconUsers}
      actions={[
        { label: "Cancelar", variant: "outline", onPress: handleClose, disabled: isSubmitting },
        {
          label: isSubmitting ? "Salvando..." : "Salvar",
          onPress: onSubmit,
          disabled: isSubmitting || !task,
          loading: isSubmitting,
        },
      ]}
    >
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
    </StandardModal>
  );
}

const styles = StyleSheet.create({
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
});
