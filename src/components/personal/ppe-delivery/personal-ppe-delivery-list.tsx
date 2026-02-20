import { useState, useMemo } from "react";
import { View, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useMyPpeDeliveriesInfinite } from '@/hooks/use-my-ppe-deliveries-infinite';
import { PPE_DELIVERY_STATUS_LABELS, PPE_DELIVERY_STATUS, PPE_TYPE_LABELS, PPE_TYPE } from '@/constants';
import { BADGE_COLORS, ENTITY_BADGE_CONFIG } from '@/constants/badge-colors';
import { formatDate, formatQuantity } from '@/utils';
import { cn } from "@/lib/utils";
import { PersonalPpeDeliveryFilterModal } from "./personal-ppe-delivery-filter-modal";
import { PersonalPpeDeliveryFilterTags } from "./personal-ppe-delivery-filter-tags";
import { Button } from "@/components/ui/button";

interface PersonalPpeDeliveryListProps {
  className?: string;
}

export function PersonalPpeDeliveryList({ className }: PersonalPpeDeliveryListProps) {
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<any>({});

  // Build query filters - the /my-requests endpoint automatically filters by current user
  const queryFilters = useMemo(() => {
    const baseFilters: any = {};

    if (filters.status && filters.status.length > 0) {
      baseFilters.status = filters.status;
    }

    if (filters.itemIds && filters.itemIds.length > 0) {
      baseFilters.itemIds = filters.itemIds;
    }

    if (filters.scheduledDateRange) {
      baseFilters.scheduledDateRange = filters.scheduledDateRange;
    }

    if (filters.actualDeliveryDateRange) {
      baseFilters.actualDeliveryDateRange = filters.actualDeliveryDateRange;
    }

    return baseFilters;
  }, [filters]);

  // Use the my-requests endpoint which automatically filters by current user
  const {
    deliveries,
    isLoading,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    refresh,
  } = useMyPpeDeliveriesInfinite(queryFilters);

  // Get badge colors from centralized configuration
  const getStatusBadgeColors = (status: string) => {
    const variant = ENTITY_BADGE_CONFIG.PPE_DELIVERY[status as PPE_DELIVERY_STATUS] || "gray";
    return BADGE_COLORS[variant];
  };

  const renderPpeDelivery = ({ item: delivery }: { item: any }) => {
    return (
      <Card style={{ padding: 16, marginBottom: 12 }}>
        <View className="gap-3">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-base font-semibold">{delivery.item?.name || "Item não encontrado"}</Text>
              {delivery.item?.ppeType && (
                <Text className="text-sm text-muted-foreground">
                  Tipo: {PPE_TYPE_LABELS[delivery.item.ppeType as PPE_TYPE] || delivery.item.ppeType}
                </Text>
              )}
              {delivery.item?.ppeCA && (
                <Text className="text-sm text-muted-foreground">CA: {delivery.item.ppeCA}</Text>
              )}
            </View>
            <Badge
              variant="secondary"
              style={{ backgroundColor: getStatusBadgeColors(delivery.status).bg }}
            >
              <Text style={{ color: getStatusBadgeColors(delivery.status).text, fontSize: 12, fontWeight: '500' }}>
                {PPE_DELIVERY_STATUS_LABELS[delivery.status as PPE_DELIVERY_STATUS] || delivery.status}
              </Text>
            </Badge>
          </View>

          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Icon name="package" size={16} className="text-muted-foreground" />
              <Text className="text-sm text-muted-foreground">
                Quantidade: {formatQuantity(delivery.quantity)}
              </Text>
            </View>

            {delivery.scheduledDate && (
              <View className="flex-row items-center gap-2">
                <Icon name="calendar" size={16} className="text-muted-foreground" />
                <Text className="text-sm text-muted-foreground">
                  Agendado para: {formatDate(delivery.scheduledDate)}
                </Text>
              </View>
            )}

            {delivery.actualDeliveryDate && (
              <View className="flex-row items-center gap-2">
                <Icon name="calendar-check" size={16} className="text-muted-foreground" />
                <Text className="text-sm text-muted-foreground">
                  Entregue em: {formatDate(delivery.actualDeliveryDate)}
                </Text>
              </View>
            )}

            {delivery.reviewedByUser && (
              <View className="flex-row items-center gap-2">
                <Icon name="user-check" size={16} className="text-muted-foreground" />
                <Text className="text-sm text-muted-foreground">
                  Revisado por: {delivery.reviewedByUser.name}
                </Text>
              </View>
            )}

            {delivery.ppeSchedule && (
              <View className="flex-row items-center gap-2">
                <Icon name="clock" size={16} className="text-muted-foreground" />
                <Text className="text-sm text-muted-foreground">Entrega agendada</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center gap-2 pt-1">
            <Icon name="clock" size={14} className="text-muted-foreground" />
            <Text className="text-xs text-muted-foreground">
              Solicitado em: {formatDate(delivery.createdAt)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const handleLoadMore = () => {
    if (canLoadMore && !isFetchingNextPage) {
      loadMore();
    }
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" />
      </View>
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
      {/* Filter Button and Tags */}
      <View className="px-4 pt-4 gap-2">
        <Button
          variant="outline"
          onPress={() => setIsFilterModalVisible(true)}
          className="flex-row items-center gap-2"
        >
          <Icon name="filter" size={16} />
          <Text>Filtros</Text>
        </Button>
        <PersonalPpeDeliveryFilterTags
          filters={filters}
          onRemoveFilter={(key) => {
            setFilters((prev: any) => {
              const newFilters = { ...prev };
              delete newFilters[key];
              return newFilters;
            });
          }}
          onClearAll={() => setFilters({})}
        />
      </View>

      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderPpeDelivery}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-12">
            <Icon name="package-x" size={48} className="text-muted-foreground mb-4" />
            <Text className="text-lg font-semibold text-center mb-2">
              Nenhuma entrega encontrada
            </Text>
            <Text className="text-muted-foreground text-center">
              Você não possui entregas de EPI no momento
            </Text>
          </View>
        }
      />

      <PersonalPpeDeliveryFilterModal
        visible={isFilterModalVisible}
        filters={filters}
        onApplyFilters={(newFilters: any) => {
          setFilters(newFilters);
          setIsFilterModalVisible(false);
        }}
        onClose={() => setIsFilterModalVisible(false)}
      />
    </View>
  );
}
