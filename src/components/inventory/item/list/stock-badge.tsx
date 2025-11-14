
import { View, Text, ViewStyle, TextStyle } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { fontSize, spacing } from "@/constants/design-system";
import type { Item } from '../../../../types';
import { determineStockLevel } from "@/utils";
import { STOCK_LEVEL, STOCK_LEVEL_LABELS } from "@/constants";

interface StockBadgeProps {
  item: Pick<Item, "quantity" | "reorderPoint" | "maxQuantity"> & { measures?: Item["measures"] };
  size?: BadgeProps["size"];
  showIcon?: boolean;
  showQuantity?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hasActiveOrder?: boolean;
}

interface StockStatus {
  label: string;
  variant: BadgeProps["variant"];
  color: string;
  icon: string;
}

export function StockBadge({ item, size = "default", showIcon = true, showQuantity = false, style, textStyle, hasActiveOrder = false }: StockBadgeProps) {

  // Determine stock level using the utility
  const stockLevel = determineStockLevel(item.quantity || 0, item.reorderPoint || null, item.maxQuantity || null, hasActiveOrder);

  // Get stock status based on level
  const getStockStatus = (): StockStatus => {
    switch (stockLevel) {
      case STOCK_LEVEL.NEGATIVE_STOCK:
        return {
          label: STOCK_LEVEL_LABELS[STOCK_LEVEL.NEGATIVE_STOCK],
          variant: "destructive",
          color: "#737373", // neutral-500
          icon: "alertTriangle",
        };
      case STOCK_LEVEL.OUT_OF_STOCK:
        return {
          label: STOCK_LEVEL_LABELS[STOCK_LEVEL.OUT_OF_STOCK],
          variant: "destructive",
          color: "#dc2626", // red-600
          icon: "box",
        };
      case STOCK_LEVEL.CRITICAL:
        return {
          label: STOCK_LEVEL_LABELS[STOCK_LEVEL.CRITICAL],
          variant: "destructive",
          color: "#f97316", // orange-500
          icon: "alertCircle",
        };
      case STOCK_LEVEL.LOW:
        return {
          label: STOCK_LEVEL_LABELS[STOCK_LEVEL.LOW],
          variant: "warning",
          color: "#eab308", // yellow-500
          icon: "alertTriangle",
        };
      case STOCK_LEVEL.OPTIMAL:
        return {
          label: STOCK_LEVEL_LABELS[STOCK_LEVEL.OPTIMAL],
          variant: "success",
          color: "#16a34a", // green-600
          icon: "check",
        };
      case STOCK_LEVEL.OVERSTOCKED:
        return {
          label: STOCK_LEVEL_LABELS[STOCK_LEVEL.OVERSTOCKED],
          variant: "secondary",
          color: "#9333ea", // purple-600
          icon: "box",
        };
      default:
        return {
          label: "Desconhecido",
          variant: "default",
          color: "#737373", // neutral-500
          icon: "help",
        };
    }
  };

  const stockStatus = getStockStatus();

  // Container style for icon and text
  const containerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  };

  // Quantity text style
  const quantityStyle: TextStyle = {
    fontSize: size === "sm" ? fontSize.xs : fontSize.sm,
    color: stockStatus.color,
    marginRight: spacing.xs,
  };

  // Icon size based on badge size
  const iconSize = size === "sm" ? 12 : size === "lg" ? 18 : 14;

  return (
    <Badge variant={stockStatus.variant} size={size} style={style} textStyle={textStyle}>
      <View style={containerStyle}>
        {showIcon && <Icon name={stockStatus.icon} size={iconSize} color={stockStatus.color} />}
        {showQuantity && (
          <Text style={quantityStyle}>
            {item.quantity} {item.measures && item.measures.length > 0 ? item.measures[0].unit : "un"}
          </Text>
        )}
        <Text>{stockStatus.label}</Text>
      </View>
    </Badge>
  );
}

// Helper function to get just the stock status info without rendering the badge
export function getStockStatus(
  item: Pick<Item, "quantity" | "reorderPoint" | "maxQuantity">,
  hasActiveOrder = false,
): {
  label: string;
  variant: BadgeProps["variant"];
  level: STOCK_LEVEL;
  isLow: boolean;
  isCritical: boolean;
  needsReorder: boolean;
} {
  const stockLevel = determineStockLevel(item.quantity || 0, item.reorderPoint || null, item.maxQuantity || null, hasActiveOrder);

  const isLow = stockLevel === STOCK_LEVEL.LOW || stockLevel === STOCK_LEVEL.CRITICAL || stockLevel === STOCK_LEVEL.OUT_OF_STOCK || stockLevel === STOCK_LEVEL.NEGATIVE_STOCK;
  const isCritical = stockLevel === STOCK_LEVEL.CRITICAL || stockLevel === STOCK_LEVEL.OUT_OF_STOCK || stockLevel === STOCK_LEVEL.NEGATIVE_STOCK;
  const needsReorder = isLow;

  let variant: BadgeProps["variant"];
  switch (stockLevel) {
    case STOCK_LEVEL.NEGATIVE_STOCK:
    case STOCK_LEVEL.OUT_OF_STOCK:
    case STOCK_LEVEL.CRITICAL:
      variant = "destructive";
      break;
    case STOCK_LEVEL.LOW:
      variant = "warning";
      break;
    case STOCK_LEVEL.OPTIMAL:
      variant = "success";
      break;
    case STOCK_LEVEL.OVERSTOCKED:
      variant = "secondary";
      break;
    default:
      variant = "default";
  }

  return {
    label: STOCK_LEVEL_LABELS[stockLevel] || "Desconhecido",
    variant,
    level: stockLevel,
    isLow,
    isCritical,
    needsReorder,
  };
}

// Compact version for list views
export function StockIndicator({ item, hasActiveOrder = false }: { item: Pick<Item, "quantity" | "reorderPoint" | "maxQuantity">; hasActiveOrder?: boolean }) {

  const status = getStockStatus(item, hasActiveOrder);

  const getIndicatorColor = () => {
    switch (status.level) {
      case STOCK_LEVEL.NEGATIVE_STOCK:
        return "#737373"; // neutral-500
      case STOCK_LEVEL.OUT_OF_STOCK:
        return "#dc2626"; // red-600
      case STOCK_LEVEL.CRITICAL:
        return "#f97316"; // orange-500
      case STOCK_LEVEL.LOW:
        return "#eab308"; // yellow-500
      case STOCK_LEVEL.OPTIMAL:
        return "#16a34a"; // green-600
      case STOCK_LEVEL.OVERSTOCKED:
        return "#9333ea"; // purple-600
      default:
        return "#737373"; // neutral-500
    }
  };

  const indicatorStyle: ViewStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: getIndicatorColor(),
  };

  return <View style={indicatorStyle} />;
}
