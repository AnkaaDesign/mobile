import React from "react";
import { View, Text, FlatList , StyleSheet} from "react-native";
import { Card } from "@/components/ui/card";
import { Order } from '../../../../types';
import { ORDER_STATUS_LABELS } from '../../../../constants';
import { formatDateTime } from '../../../../utils';
import { useTheme } from "@/lib/theme";

interface ScheduleHistoryProps {
  orders: Order[];
}

export function ScheduleHistory({ orders }: ScheduleHistoryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "RECEIVED":
        return "#10B981";
      case "CANCELLED":
        return "#EF4444";
      case "IN_PROGRESS":
      case "FULFILLED":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderRow}>
      <View style={styles.orderInfo}>
        <Text style={styles.orderNumber}>
          Pedido #{item.id.slice(0, 8)}
        </Text>
        <Text style={styles.orderDate}>
          {formatDateTime(item.createdAt)}
        </Text>
      </View>
      <View
        style={StyleSheet.flatten([
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) + "20" },
        ])}
      >
        <Text
          style={StyleSheet.flatten([styles.statusText, { color: getStatusColor(item.status) }])}
        >
          {ORDER_STATUS_LABELS[item.status] || item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Histórico de Execuções</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhuma execução registrada ainda
          </Text>
        }
      />
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
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  orderDate: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
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
});