import React from "react";
import { View, Modal, Pressable, ScrollView } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { IconX } from "@tabler/icons-react-native";

interface AirbrushingFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (newFilters: any) => void;
  currentFilters: Partial<any>;
}

export function AirbrushingFilterModal({
  visible,
  onClose,
  onApply,
  currentFilters,
}: AirbrushingFilterModalProps) {
  const { colors, spacing } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: spacing.md,
            maxHeight: "80%",
          }}
        >
          <ThemedText size="lg" weight="semibold">Filtros</ThemedText>
          {/* Add filter controls here */}
        </View>
      </View>
    </Modal>
  );
}