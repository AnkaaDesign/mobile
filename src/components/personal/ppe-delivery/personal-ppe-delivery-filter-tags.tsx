
import { View, ScrollView } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import Icon from "@/components/ui/icon";
import { PPE_DELIVERY_STATUS_LABELS } from '@/constants';
import { formatDate } from '@/utils';

interface PersonalPpeDeliveryFilterTagsProps {
  filters: {
    status?: string[];
    itemIds?: string[];
    scheduledDateRange?: { gte?: Date; lte?: Date };
    actualDeliveryDateRange?: { gte?: Date; lte?: Date };
  };
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
}

export function PersonalPpeDeliveryFilterTags({
  filters,
  onRemoveFilter,
  onClearAll,
}: PersonalPpeDeliveryFilterTagsProps) {
  const hasFilters = Object.keys(filters).length > 0;

  if (!hasFilters) {
    return null;
  }

  return (
    <View className="gap-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row gap-2"
      >
        {filters.status?.map((status: string) => (
          <Badge key={status} variant="secondary" className="flex-row items-center gap-1">
            <Text className="text-xs">{PPE_DELIVERY_STATUS_LABELS[status as keyof typeof PPE_DELIVERY_STATUS_LABELS]}</Text>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onPress={() => {
                const newStatus = filters.status?.filter((s: string) => s !== status);
                if (!newStatus || newStatus.length === 0) {
                  onRemoveFilter("status");
                } else {
                  // This needs to be handled by parent
                }
              }}
            >
              <Icon name="x" size={12} />
            </Button>
          </Badge>
        ))}

        {filters.itemIds && (
          <Badge variant="secondary" className="flex-row items-center gap-1">
            <Text className="text-xs">Item específico</Text>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onPress={() => onRemoveFilter("itemIds")}
            >
              <Icon name="x" size={12} />
            </Button>
          </Badge>
        )}

        {filters.scheduledDateRange && (
          <Badge variant="secondary" className="flex-row items-center gap-1">
            <Text className="text-xs">
              Agendado:{" "}
              {filters.scheduledDateRange.gte && formatDate(filters.scheduledDateRange.gte)}
              {" - "}
              {filters.scheduledDateRange.lte && formatDate(filters.scheduledDateRange.lte)}
            </Text>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onPress={() => onRemoveFilter("scheduledDateRange")}
            >
              <Icon name="x" size={12} />
            </Button>
          </Badge>
        )}

        {filters.actualDeliveryDateRange && (
          <Badge variant="secondary" className="flex-row items-center gap-1">
            <Text className="text-xs">
              Entregue:{" "}
              {filters.actualDeliveryDateRange.gte && formatDate(filters.actualDeliveryDateRange.gte)}
              {" - "}
              {filters.actualDeliveryDateRange.lte && formatDate(filters.actualDeliveryDateRange.lte)}
            </Text>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onPress={() => onRemoveFilter("actualDeliveryDateRange")}
            >
              <Icon name="x" size={12} />
            </Button>
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          onPress={onClearAll}
          className="flex-row items-center gap-1"
        >
          <Icon name="x" size={14} />
          <Text className="text-xs">Limpar tudo</Text>
        </Button>
      </ScrollView>
    </View>
  );
}
