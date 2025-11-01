
import { View, FlatList, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/auth-context";
import { usePpeDeliveries } from '../../../hooks';
import { PPE_DELIVERY_STATUS_LABELS, PPE_DELIVERY_STATUS } from '../../../constants';
import { formatDate, isDateInPast, addDays } from '../../../utils';
import { cn } from "@/lib/utils";

interface MyPpeListProps {
  className?: string;
}

export function MyPpeList({ className }: MyPpeListProps) {
  const { user } = useAuth();
  const { data, isLoading, refetch } = usePpeDeliveries({
    where: { userId: user?.id },
    include: {
      item: {
        include: {
          ppeConfig: true,
        },
      },
    },
    orderBy: { deliveredAt: "desc" },
  });

  const getExpirationStatus = (delivery: any) => {
    if (!delivery.item?.ppeConfig?.expirationDays || !delivery.deliveredAt) {
      return null;
    }

    const expirationDate = addDays(new Date(delivery.deliveredAt), delivery.item.ppeConfig.expirationDays);

    const alertDate = delivery.item.ppeConfig.alertDaysBefore ? addDays(expirationDate, -delivery.item.ppeConfig.alertDaysBefore) : null;

    const isExpired = isDateInPast(expirationDate);
    const isNearExpiration = alertDate && isDateInPast(alertDate) && !isExpired;

    return {
      expirationDate,
      isExpired,
      isNearExpiration,
    };
  };

  const renderPpeDelivery = ({ item: delivery }: { item: any }) => {
    const expirationStatus = getExpirationStatus(delivery);

    return (
      <Card style={{ padding: 16, marginBottom: 12 }}>
        <View className="gap-3">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-base font-semibold">{delivery.item?.name}</Text>
              {delivery.size && <Text className="text-sm text-muted-foreground">Tamanho: {delivery.size}</Text>}
              {delivery.item?.ppeConfig?.ca && <Text className="text-sm text-muted-foreground">CA: {delivery.item.ppeConfig.ca}</Text>}
            </View>
            <Badge variant={delivery.status === PPE_DELIVERY_STATUS.DELIVERED ? "success" : "secondary"}>{PPE_DELIVERY_STATUS_LABELS[delivery.status as PPE_DELIVERY_STATUS]}</Badge>
          </View>

          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <Icon name="calendar-event" size={16} className="text-muted-foreground" />
              <Text className="text-sm text-muted-foreground">Entregue em: {formatDate(delivery.deliveredAt)}</Text>
            </View>
            {delivery.quantity && <Text className="text-sm text-muted-foreground">Qtd: {delivery.quantity}</Text>}
          </View>

          {expirationStatus && (
            <View
              className={cn(
                "p-3 rounded-lg flex-row items-center gap-2",
                expirationStatus.isExpired ? "bg-destructive/10" : expirationStatus.isNearExpiration ? "bg-yellow-500/10" : "bg-muted/50",
              )}
            >
              {(expirationStatus.isExpired || expirationStatus.isNearExpiration) && (
                <Icon name="alert-triangle" size={16} className={cn(expirationStatus.isExpired ? "text-destructive" : "text-yellow-600")} />
              )}
              <Text
                className={cn(
                  "text-sm",
                  expirationStatus.isExpired ? "text-destructive font-medium" : expirationStatus.isNearExpiration ? "text-yellow-600 font-medium" : "text-muted-foreground",
                )}
              >
                {expirationStatus.isExpired ? "Vencido em: " : "Vence em: "}
                {formatDate(expirationStatus.expirationDate)}
              </Text>
            </View>
          )}

          {delivery.observations && <Text className="text-sm text-muted-foreground">Observações: {delivery.observations}</Text>}
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className={cn("flex-1", className)}>
      <FlatList
        data={data?.data || []}
        keyExtractor={(item) => item.id}
        renderItem={renderPpeDelivery}
        contentContainerStyle={{ padding: 16 }}
        refreshing={false}
        onRefresh={refetch}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-8">
            <Text className="text-muted-foreground text-center">Você não possui EPIs entregues no momento</Text>
          </View>
        }
      />
    </View>
  );
}
