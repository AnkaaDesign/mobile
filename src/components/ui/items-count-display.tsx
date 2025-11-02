
import { View, StyleSheet} from "react-native";
import { ThemedText } from "./themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

interface ItemsCountDisplayProps {
  loadedCount: number;
  totalCount?: number;
  isLoading?: boolean;
  itemType?: string; // singular form: "item", "marca", "categoria"
  itemTypePlural?: string; // plural form: "itens", "marcas", "categorias"
}

export function ItemsCountDisplay({ loadedCount, totalCount, isLoading, itemType = "item", itemTypePlural = "itens" }: ItemsCountDisplayProps) {
  const { colors } = useTheme();

  if (loadedCount === 0 && !isLoading) return null;

  // Show total count if available and greater than 0
  const showTotal = totalCount !== undefined && totalCount !== null && totalCount > 0;

  // Always show current count (no loading indicator - table already shows it)
  const countText = showTotal
    ? `${loadedCount} ${loadedCount === 1 ? itemType : itemTypePlural} ${loadedCount === 1 ? 'carregado' : 'carregados'} de ${totalCount}`
    : `${loadedCount} ${loadedCount === 1 ? `${itemType} carregado` : `${itemTypePlural} carregados`}`;

  return (
    <View style={styles.container}>
      <ThemedText style={StyleSheet.flatten([styles.text, { color: colors.mutedForeground }])}>
        {countText}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: "center",
  },
  text: {
    fontSize: fontSize.sm,
  },
});
