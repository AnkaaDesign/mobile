import { useMemo } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Supplier } from "@/types";
import { formatCurrency, formatDate } from "@/utils";
import { ORDER_STATUS, ORDER_STATUS_LABELS, routes } from "@/constants";
import { cn } from "@/lib/utils";

interface RelatedOrdersCardProps {
  supplier: Supplier;
  className?: string;
}

// Status icons and colors
const ORDER_STATUS_CONFIG: Record<
  string,
  {
    icon: string;
    color: string;
    badgeClass: string;
  }
> = {
  [ORDER_STATUS.CREATED]: {
    icon: "clock",
    color: "text-neutral-500",
    badgeClass: "bg-neutral-500 text-white border-neutral-500",
  },
  [ORDER_STATUS.PARTIALLY_FULFILLED]: {
    icon: "package",
    color: "text-yellow-500",
    badgeClass: "bg-yellow-500 text-white border-yellow-500",
  },
  [ORDER_STATUS.FULFILLED]: {
    icon: "truck",
    color: "text-orange-500",
    badgeClass: "bg-orange-500 text-white border-orange-500",
  },
  [ORDER_STATUS.PARTIALLY_RECEIVED]: {
    icon: "package",
    color: "text-blue-500",
    badgeClass: "bg-blue-500 text-white border-blue-500",
  },
  [ORDER_STATUS.RECEIVED]: {
    icon: "circle-check-filled",
    color: "text-green-700",
    badgeClass: "bg-green-700 text-white border-green-700",
  },
  [ORDER_STATUS.OVERDUE]: {
    icon: "alert-triangle",
    color: "text-purple-600",
    badgeClass: "bg-purple-600 text-white border-purple-600",
  },
  [ORDER_STATUS.CANCELLED]: {
    icon: "x",
    color: "text-red-700",
    badgeClass: "bg-red-700 text-white border-red-700",
  },
};

export function RelatedOrdersCard({ supplier, className }: RelatedOrdersCardProps) {
  const orders = supplier.orders || [];

  // Sort orders by status priority (active orders first) and then by date
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      // Priority for active statuses
      const statusPriority: Record<string, number> = {
        [ORDER_STATUS.CREATED]: 1,
        [ORDER_STATUS.PARTIALLY_FULFILLED]: 2,
        [ORDER_STATUS.FULFILLED]: 3,
        [ORDER_STATUS.OVERDUE]: 4,
        [ORDER_STATUS.PARTIALLY_RECEIVED]: 5,
        [ORDER_STATUS.RECEIVED]: 6,
        [ORDER_STATUS.CANCELLED]: 7,
      };

      const aPriority = statusPriority[a.status] ?? 8;
      const bPriority = statusPriority[b.status] ?? 8;

      if (aPriority !== bPriority) return aPriority - bPriority;

      // Then sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalOrders = orders.length;
    const activeOrders = orders.filter((order) => order.status !== ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.RECEIVED).length;
    const completedOrders = orders.filter((order) => order.status === ORDER_STATUS.RECEIVED).length;

    const totalValue = orders.reduce((sum, order) => {
      const orderTotal = order.items?.reduce((itemSum, item) => itemSum + item.orderedQuantity * item.price, 0) || 0;
      return sum + orderTotal;
    }, 0);

    const statusCounts = orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalOrders,
      activeOrders,
      completedOrders,
      totalValue,
      statusCounts,
    };
  }, [orders]);

  const handleOrderPress = (orderId: string) => {
    router.push(routes.inventory.orders.details(orderId));
  };

  const handleViewAll = () => {
    if (supplier.id) {
      router.push(`${routes.inventory.orders.list}?supplierId=${supplier.id}&supplierName=${encodeURIComponent(supplier.name || "")}`);
    }
  };

  if (orders.length === 0) {
    return (
      <Card className={cn("shadow-sm border border-border", className)} level={1}>
        <CardHeader className="pb-4">
          <View className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <View className="p-2 rounded-lg bg-primary/10">
                <Icon name="shopping-cart" size={20} className="text-primary" />
              </View>
              <Text className="text-xl font-semibold">Pedidos Relacionados</Text>
            </CardTitle>
            {supplier.id && (
              <Button variant="outline" size="sm" onPress={handleViewAll}>
                <Text>Ver todos</Text>
              </Button>
            )}
          </View>
        </CardHeader>
        <CardContent className="pt-0">
          <View className="text-center py-12">
            <Icon name="alert-circle" size={48} className="text-muted-foreground mx-auto mb-4" />
            <Text className="text-muted-foreground">Nenhum pedido associado a este fornecedor.</Text>
          </View>
        </CardContent>
      </Card>
    );
  }

  // Show first 8 orders
  const displayOrders = sortedOrders.slice(0, 8);

  return (
    <Card className={cn("shadow-sm border border-border", className)} level={1}>
      <CardHeader className="pb-4">
        <View className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <View className="p-2 rounded-lg bg-primary/10">
              <Icon name="shopping-cart" size={20} className="text-primary" />
            </View>
            <Text className="text-xl font-semibold">Pedidos Relacionados</Text>
          </CardTitle>
          {supplier.id && (
            <Button variant="outline" size="sm" onPress={handleViewAll}>
              <Text>Ver todos</Text>
            </Button>
          )}
        </View>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Statistics Summary */}
        <View className="flex flex-row gap-3 mb-6">
          <View className="flex-1 bg-card-nested rounded-lg p-3 border border-border">
            <Text className="text-xs font-medium text-muted-foreground">Total</Text>
            <Text className="text-xl font-bold mt-1">{statistics.totalOrders}</Text>
          </View>

          <View className="flex-1 bg-yellow-50/80 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200/40 dark:border-yellow-700/40">
            <Text className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Ativos</Text>
            <Text className="text-xl font-bold mt-1 text-yellow-800 dark:text-yellow-200">{statistics.activeOrders}</Text>
          </View>

          <View className="flex-1 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200/40 dark:border-blue-700/40">
            <Text className="text-xs font-medium text-blue-800 dark:text-blue-200">Valor</Text>
            <Text className="text-lg font-bold mt-1 text-blue-800 dark:text-blue-200">{formatCurrency(statistics.totalValue)}</Text>
          </View>
        </View>

        {/* Status Summary */}
        <View className="flex flex-row flex-wrap gap-2 mb-4">
          {[
            ORDER_STATUS.CREATED,
            ORDER_STATUS.PARTIALLY_FULFILLED,
            ORDER_STATUS.FULFILLED,
            ORDER_STATUS.OVERDUE,
            ORDER_STATUS.PARTIALLY_RECEIVED,
            ORDER_STATUS.RECEIVED,
            ORDER_STATUS.CANCELLED,
          ].map((status) => {
            const count = statistics.statusCounts[status] || 0;
            const config = ORDER_STATUS_CONFIG[status];
            return (
              <Badge key={status} className={cn("font-medium border", config.badgeClass)}>
                <Text className="text-xs text-white">{ORDER_STATUS_LABELS[status]} ({count})</Text>
              </Badge>
            );
          })}
        </View>

        {/* Orders List */}
        <ScrollView className="space-y-2" showsVerticalScrollIndicator={false}>
          {displayOrders.map((order) => {
            const orderTotal = order.items?.reduce((sum, item) => sum + item.orderedQuantity * item.price, 0) || 0;
            const itemCount = order.items?.length || 0;
            const config = ORDER_STATUS_CONFIG[order.status];
            const orderDescription = `Pedido #${order.id.slice(-8).toUpperCase()}`;

            return (
              <Pressable
                key={order.id}
                onPress={() => handleOrderPress(order.id)}
                className="border border-border/50 rounded-lg p-3 bg-card active:bg-muted/50 mb-2"
              >
                <View className="flex flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="font-semibold text-sm text-foreground">{orderDescription}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {itemCount} {itemCount === 1 ? "item" : "itens"}
                    </Text>
                  </View>

                  {order.status === ORDER_STATUS.CANCELLED && (
                    <Badge variant="secondary" className="ml-2">
                      <Text className="text-xs">Cancelado</Text>
                    </Badge>
                  )}
                </View>

                <View className="flex flex-row justify-between items-center mt-2 pt-2 border-t border-border/50">
                  <View className="flex flex-row items-center gap-2">
                    <Icon name={config.icon} size={16} className={config.color} />
                    <Text className="font-medium text-sm">{formatDate(order.createdAt)}</Text>
                  </View>

                  {orderTotal > 0 && (
                    <Text className="text-xs text-muted-foreground font-medium">{formatCurrency(orderTotal)}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {sortedOrders.length > 8 && (
          <View className="mt-4 pt-4 border-t border-border">
            <Text className="text-sm text-muted-foreground text-center">
              Mostrando 8 de {sortedOrders.length} pedidos
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
