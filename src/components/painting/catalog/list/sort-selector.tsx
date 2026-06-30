import { TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { StandardModal } from "@/components/ui/standard-modal";
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
    <StandardModal
      visible={isOpen}
      onClose={onClose}
      title="Ordenar por"
      scroll={false}
      padded={false}
      actions={[{ label: "Fechar", variant: "outline", onPress: onClose }]}
    >
      <FlatList
        data={Object.entries(SORT_OPTIONS)}
        renderItem={renderSortOption}
        keyExtractor={(item) => item[0]}
        contentContainerStyle={styles.optionsList}
      />
    </StandardModal>
  );
}

const styles = StyleSheet.create({
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
});
