import { View, StyleSheet } from "react-native";
import { IconAlertTriangleFilled, IconClockFilled } from "@tabler/icons-react-native";
import type { Item } from '../../../../types';

import { determineStockLevel } from "@/utils";
import { STOCK_LEVEL } from "@/constants";

interface StockStatusIndicatorProps {
  item: Item;
  hasActiveOrder?: boolean;
}

export function StockStatusIndicator({ item, hasActiveOrder = false }: StockStatusIndicatorProps) {
  const quantity = item.quantity || 0;

  // Determine stock level using the utility function.
  // `hasActiveOrder` is intentionally NOT passed: pending-order state is a UI
  // overlay only (the new util ignores it anyway).
  const stockLevel = determineStockLevel(
    quantity,
    item.reorderPoint || null,
    item.maxQuantity || null,
    false,
    item.category?.type ?? null,
  );

  // Get the appropriate color for the stock level (matching web exactly)
  const getColor = () => {
    switch (stockLevel) {
      case STOCK_LEVEL.NEGATIVE_STOCK:
        return "#737373"; // neutral-500
      case STOCK_LEVEL.OUT_OF_STOCK:
        return "#b91c1c"; // red-700
      case STOCK_LEVEL.CRITICAL:
        return "#f97316"; // orange-500
      case STOCK_LEVEL.LOW:
        return "#eab308"; // yellow-500
      case STOCK_LEVEL.OPTIMAL:
        return "#15803d"; // green-700
      case STOCK_LEVEL.OVERSTOCKED:
        return "#9333ea"; // purple-600
      default:
        return "#737373"; // neutral-500
    }
  };

  const color = getColor();

  return (
    <View style={styles.container}>
      <IconAlertTriangleFilled size={16} color={color} />
      {hasActiveOrder && (
        <View style={styles.orderOverlay}>
          <IconClockFilled size={10} color="#3b82f6" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  orderOverlay: {
    position: "absolute",
    bottom: -3,
    right: -3,
    backgroundColor: "#fff",
    borderRadius: 6,
  },
});
