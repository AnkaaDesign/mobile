import React, { useState, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { StandardModal } from "@/components/ui/standard-modal";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { useSectors } from "@/hooks/useSector";
import { SECTOR_PRIVILEGES } from "@/constants";
import type { Sector } from "@/types";

interface TaskSectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSector: (sectorId: string) => void;
  currentSectorId?: string | null;
  loading?: boolean;
}

export const TaskSectorModal: React.FC<TaskSectorModalProps> = ({
  visible,
  onClose,
  onSelectSector,
  currentSectorId,
  loading = false,
}) => {
  const { colors } = useTheme();
  const [selectedSectorId, setSelectedSectorId] = useState<string | undefined>(
    currentSectorId || undefined
  );

  // Fetch sectors with production privilege
  const { data: sectorsData, isLoading } = useSectors({
    privilege: SECTOR_PRIVILEGES.PRODUCTION,
    orderBy: { name: "asc" },
  });

  const sectors = useMemo(() => sectorsData?.data || [], [sectorsData]);

  const handleConfirm = () => {
    if (selectedSectorId) {
      onSelectSector(selectedSectorId);
    }
  };

  const handleSectorPress = (sectorId: string) => {
    setSelectedSectorId(sectorId);
  };

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Definir Setor"
      subtitle="Selecione o setor de produção para esta tarefa"
      bodyStyle={styles.body}
      actions={[
        { label: "Cancelar", variant: "outline", onPress: onClose, disabled: loading },
        {
          label: "Confirmar",
          onPress: handleConfirm,
          disabled: !selectedSectorId || loading,
          loading,
        },
      ]}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando setores...</ThemedText>
        </View>
      ) : sectors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>Nenhum setor disponível</ThemedText>
        </View>
      ) : (
        <View>
          {sectors.map((sector: Sector) => {
            const isSelected = selectedSectorId === sector.id;
            return (
              <TouchableOpacity
                key={sector.id}
                style={[
                  styles.sectorItem,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + "20"
                      : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleSectorPress(sector.id)}
                activeOpacity={0.7}
              >
                <View style={styles.sectorItemContent}>
                  <ThemedText
                    style={[
                      styles.sectorName,
                      isSelected && { fontWeight: fontWeight.semibold },
                    ]}
                  >
                    {sector.name}
                  </ThemedText>
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
      )}
    </StandardModal>
  );
};

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  sectorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  sectorItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  sectorName: {
    fontSize: fontSize.md,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "white",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
