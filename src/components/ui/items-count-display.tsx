import React from "react";
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

  return (
    <View style={styles.container}>
      <ThemedText style={StyleSheet.flatten([styles.text, { color: colors.mutedForeground }])}>
        {isLoading
          ? "Carregando..."
          : totalCount !== undefined
            ? `Exibindo ${loadedCount} de ${totalCount} ${totalCount === 1 ? itemType : itemTypePlural}`
            : `${loadedCount} ${loadedCount === 1 ? `${itemType} carregado` : `${itemTypePlural} carregados`}`}
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
