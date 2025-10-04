import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Card } from "@/components/ui/card";
import { OrderItem } from '../../../../types';
import { formatCurrency } from '../../../../utils';
import { useTheme } from "@/lib/theme";

interface ItemsListProps {
  items: OrderItem[];
}

export function ItemsList({ items }: ItemsListProps) {
  const renderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>
          {item.item?.name || "Item não encontrado"}
        </Text>
        <Text style={styles.itemCode}>
          Código: {item.item?.uniCode || "-"}
        </Text>
      </View>
      <View style={styles.itemQuantity}>
        <Text style={styles.quantity}>
          {item.orderedQuantity} {item.item?.measureUnit || "un"}
        </Text>
        {item.unitPrice && (
          <Text style={styles.price}>
            {formatCurrency(item.unitPrice)}
          </Text>
        )}
      </View>
    </View>
  );

  const calculateTotal = () => {
    return items.reduce(
      (sum, item) => sum + (item.unitPrice || 0) * item.orderedQuantity,
      0
    );
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Itens do Pedido</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum item encontrado</Text>
        }
      />

      {items.length > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(calculateTotal())}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  itemCode: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  itemQuantity: {
    alignItems: "flex-end",
  },
  quantity: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  price: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
});