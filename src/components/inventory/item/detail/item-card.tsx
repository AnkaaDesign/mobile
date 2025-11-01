
import { View, Pressable , StyleSheet} from "react-native";
import type { Item } from '../../../../types';
import { formatCurrency, determineStockLevel } from '../../../../utils';
import { STOCK_LEVEL, STOCK_LEVEL_LABELS } from '../../../../constants';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

interface ItemCardProps {
  item: Item;
  onPress?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
  variant?: "default" | "compact";
}

export function ItemCard({ item, onPress, showActions: _showActions = true, variant = "default" }: ItemCardProps) {
  const { colors } = useTheme();

  const currentPrice = item.prices?.[0]?.value || 0;

  // Determine stock level using the utility
  const stockLevel = determineStockLevel(
    item.quantity || 0,
    item.reorderPoint || null,
    item.maxQuantity || null,
    false, // hasActiveOrder - we don't have this info in the card
  );

  // Get badge variant based on stock level
  const getBadgeVariant = () => {
    switch (stockLevel) {
      case STOCK_LEVEL.NEGATIVE_STOCK:
      case STOCK_LEVEL.OUT_OF_STOCK:
      case STOCK_LEVEL.CRITICAL:
        return "destructive";
      case STOCK_LEVEL.LOW:
        return "warning";
      case STOCK_LEVEL.OPTIMAL:
        return "success";
      case STOCK_LEVEL.OVERSTOCKED:
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Pressable onPress={onPress}>
      <Card style={variant === "compact" ? { ...styles.card, ...styles.cardCompact } : styles.card}>
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText style={styles.name} numberOfLines={1}>
              {item.name}
            </ThemedText>
            {item.uniCode && <ThemedText style={styles.code}>#{item.uniCode}</ThemedText>}
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Quantidade:</ThemedText>
              <Badge variant={getBadgeVariant()}>
                <ThemedText style={styles.badgeText}>{item.quantity}</ThemedText>
              </Badge>
            </View>

            {stockLevel !== STOCK_LEVEL.OPTIMAL && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.label}>Status:</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.statusText, { color: colors.mutedForeground }])}>{STOCK_LEVEL_LABELS[stockLevel as keyof typeof STOCK_LEVEL_LABELS]}</ThemedText>
              </View>
            )}

            {currentPrice > 0 && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.label}>Preço:</ThemedText>
                <ThemedText style={styles.price}>{formatCurrency(currentPrice)}</ThemedText>
              </View>
            )}
          </View>

          {item.category && (
            <View style={styles.footer}>
              <Badge variant="secondary">
                <ThemedText style={styles.categoryText}>{item.category.name}</ThemedText>
              </Badge>
            </View>
          )}
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
  code: {
    fontSize: fontSize.sm,
    opacity: 0.6,
    marginLeft: spacing.sm,
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
  price: {
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
  categoryText: {
    fontSize: fontSize.xs,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
});
