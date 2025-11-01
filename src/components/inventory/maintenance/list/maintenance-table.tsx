
import { View, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDate } from '../../../../utils';
import {
  MAINTENANCE_STATUS_LABELS
} from '../../../../constants';
import type { Maintenance } from '../../../../types';

interface MaintenanceTableProps {
  maintenances: Maintenance[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function MaintenanceTable({
  maintenances,
  isLoading,
  isRefreshing,
  onRefresh,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
}: MaintenanceTableProps) {
  const router = useRouter();

  const handlePress = (maintenance: Maintenance) => {
    router.push(`/inventory/maintenance/details/${maintenance.id}` as any);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "info";
      case "IN_PROGRESS":
        return "warning";
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const renderMaintenanceItem = ({ item }: { item: Maintenance }) => (
    <TouchableOpacity onPress={() => handlePress(item)} activeOpacity={0.7}>
      <Card className="mb-3 p-4">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground mb-1">
              {item.name}
            </Text>
            <Text className="text-sm text-muted-foreground">
              #{item.id.slice(0, 8)}
            </Text>
          </View>
          <Badge variant={getStatusColor(item.status) as any}>
            {MAINTENANCE_STATUS_LABELS[item.status as keyof typeof MAINTENANCE_STATUS_LABELS]}
          </Badge>
        </View>

        <View className="space-y-2">
          {/* Type and Priority */}
          <View className="flex-row items-center space-x-3">
            <View className="flex-row items-center">
              <Icon name="IconTool" size={16} color="#6B7280" />
              <Text className="text-sm text-muted-foreground ml-1">
                Manutenção de {item.item?.name || 'Item'}
              </Text>
            </View>
            <Badge variant={getStatusColor(item.status) as any} size="sm">
              {MAINTENANCE_STATUS_LABELS[item.status as keyof typeof MAINTENANCE_STATUS_LABELS]}
            </Badge>
          </View>

          {/* Item Info */}
          {item.item && (
            <View className="flex-row items-center">
              <Icon name="IconBox" size={16} color="#6B7280" />
              <Text className="text-sm text-muted-foreground ml-1">
                {item.item.name}
              </Text>
            </View>
          )}

          {/* Scheduled Date */}
          {item.scheduledFor && (
            <View className="flex-row items-center">
              <Icon name="IconCalendar" size={16} color="#6B7280" />
              <Text className="text-sm text-muted-foreground ml-1">
                {formatDate(item.scheduledFor)}
              </Text>
            </View>
          )}

          {/* Duration */}
          {item.timeTaken && (
            <View className="flex-row items-center">
              <Icon name="IconClock" size={16} color="#6B7280" />
              <Text className="text-sm font-medium text-foreground ml-1">
                {item.timeTaken} min
              </Text>
            </View>
          )}

          {/* Description */}
          {item.description && (
            <View className="flex-row items-center">
              <Icon name="IconFileText" size={16} color="#6B7280" />
              <Text className="text-sm text-muted-foreground ml-1" numberOfLines={1}>
                {item.description}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <LoadingSpinner size="lg" message="Carregando manutenções..." />
      </View>
    );
  }

  if (!maintenances || maintenances.length === 0) {
    return (
      <EmptyState
        icon="IconTool"
        title="Nenhuma manutenção encontrada"
        description="Não há manutenções registradas no momento."
      />
    );
  }

  return (
    <FlatList
      data={maintenances}
      renderItem={renderMaintenanceItem}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
        />
      }
      onEndReached={hasNextPage ? onLoadMore : undefined}
      onEndReachedThreshold={0.2}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-4">
            <LoadingSpinner size="sm" />
          </View>
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={15}
      updateCellsBatchingPeriod={50}
      getItemLayout={(_data, index) => ({
        length: 220, // Estimate based on card height with content
        offset: 220 * index,
        index,
      })}
    />
  );
}