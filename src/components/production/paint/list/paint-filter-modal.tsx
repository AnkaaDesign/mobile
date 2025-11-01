
import { View, Modal, Pressable } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";

import { useTheme } from "@/lib/theme";

interface PaintFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: any;
  onApply: (filters: any) => void;
  onReset?: () => void;
}

export function PaintFilterModal({
  visible,
  onClose,
  // filters removed
  // onApply removed
  // onReset removed
}: PaintFilterModalProps) {
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