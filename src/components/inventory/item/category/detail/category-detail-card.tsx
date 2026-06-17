
import { View, Pressable , StyleSheet} from "react-native";
import type { ItemCategory } from '../../../../../types';
import { ACCOUNTING_TYPE_LABELS, ITEM_CATEGORY_LEVEL_LABELS } from "@/constants";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

interface CategoryDetailCardProps {
  category: ItemCategory;
  onPress?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
  variant?: "default" | "compact";
  itemCount?: number;
}

export function CategoryDetailCard({ category, onPress, showActions: _showActions = true, variant = "default", itemCount = 0 }: CategoryDetailCardProps) {
  const { colors } = useTheme();

  // The headline "Tipo" is the accounting rollup (contábil). The physical
  // ItemCategoryType is an internal flag, shown as secondary detail only.
  const accountingType = category.accountingType ?? category.parent?.accountingType ?? null;
  const accountingLabel = accountingType ? ACCOUNTING_TYPE_LABELS[accountingType] : "Sem classificação";

  return (
    <Pressable onPress={onPress}>
      <Card style={variant === "compact" ? { ...styles.card, ...styles.cardCompact } : styles.card}>
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText style={styles.name} numberOfLines={1}>
              {category.name}
            </ThemedText>
            <Badge variant={accountingType ? "default" : "secondary"}>
              <ThemedText style={styles.badgeText}>{accountingLabel}</ThemedText>
            </Badge>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Tipo:</ThemedText>
              <ThemedText style={styles.value}>{accountingLabel}</ThemedText>
            </View>

            {category.categoryLevel != null && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.label}>Nível:</ThemedText>
                <ThemedText style={styles.value}>{ITEM_CATEGORY_LEVEL_LABELS[category.categoryLevel as keyof typeof ITEM_CATEGORY_LEVEL_LABELS]}</ThemedText>
              </View>
            )}

            {itemCount > 0 && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.label}>Produtos:</ThemedText>
                <Badge variant="default">
                  <ThemedText style={styles.badgeText}>{itemCount}</ThemedText>
                </Badge>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <ThemedText style={StyleSheet.flatten([styles.statusText, { color: colors.mutedForeground }])}>
              {category.categoryLevel != null ? ITEM_CATEGORY_LEVEL_LABELS[category.categoryLevel as keyof typeof ITEM_CATEGORY_LEVEL_LABELS] : "Categoria"} · {accountingLabel}
            </ThemedText>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  cardCompact: {
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs / 2,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: "600",
    flex: 1,
  },
  details: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  footer: {
    marginTop: spacing.sm,
    flexDirection: "row",
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
});
