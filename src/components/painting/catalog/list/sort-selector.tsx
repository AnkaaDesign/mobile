import { View, TouchableOpacity, StyleSheet, Modal, FlatList } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { IconCheck } from "@tabler/icons-react-native";

export type SortOption = "finish" | "color" | "paintBrand" | "manufacturer" | "name" | "type";

interface SortSelectorProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SORT_OPTIONS: Record<SortOption, string> = {
  finish: "Acabamento",
  color: "Cor",
  paintBrand: "Marca",
  manufacturer: "Montadora",
  name: "Nome",
  type: "Tipo",
};

export function SortSelector({ currentSort, onSortChange, isOpen, onClose }: SortSelectorProps) {
  const { colors } = useTheme();

  const handleSortSelect = (sort: SortOption) => {
    onSortChange(sort);
  };

  const renderSortOption = ({ item }: { item: [string, string] }) => {
    const [key, label] = item;
    const isSelected = currentSort === key;

    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          {
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => handleSortSelect(key as SortOption)}
      >
        <ThemedText
          style={[
            styles.optionText,
            { color: isSelected ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {label}
        </ThemedText>
        {isSelected && (
          <IconCheck
            size={20}
            color={colors.primaryForeground}
            style={styles.checkIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.modalTitle}>Ordenar por</ThemedText>
          </View>

          <FlatList
            data={Object.entries(SORT_OPTIONS)}
            renderItem={renderSortOption}
            keyExtractor={(item) => item[0]}
            contentContainerStyle={styles.optionsList}
          />

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <Button
              variant="outline"
              onPress={onClose}
              style={styles.closeButton}
            >
              <ThemedText style={{ color: colors.foreground }}>Fechar</ThemedText>
            </Button>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  triggerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  optionsList: {
    padding: spacing.sm,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  optionText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  checkIcon: {
    marginLeft: spacing.xs,
  },
  modalFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  closeButton: {
    width: "100%",
  },
});
