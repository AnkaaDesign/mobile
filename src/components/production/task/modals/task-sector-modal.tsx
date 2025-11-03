import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Modal, ModalContent, ModalHeader, ModalFooter } from "@/components/ui/modal";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
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
    <Modal visible={visible} onClose={onClose} animationType="slide">
      <ModalContent style={styles.modalContent}>
        <ModalHeader>
          <ThemedText style={styles.title}>Definir Setor</ThemedText>
          <ThemedText style={styles.subtitle}>
            Selecione o setor de produção para esta tarefa
          </ThemedText>
        </ModalHeader>

        <View style={styles.content}>
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
            <ScrollView style={styles.sectorList} showsVerticalScrollIndicator={false}>
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
                      <View
                        style={[
                          styles.colorDot,
                          { backgroundColor: sector.color || colors.primary },
                        ]}
                      />
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
            </ScrollView>
          )}
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
            disabled={!selectedSectorId || loading}
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
    maxHeight: "80%",
    minHeight: 400,
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
    minHeight: 300,
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
  sectorList: {
    flex: 1,
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
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
  button: {
    minWidth: 100,
  },
});
