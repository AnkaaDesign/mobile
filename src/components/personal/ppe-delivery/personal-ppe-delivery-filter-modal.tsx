import { useState, useEffect } from "react";
import { View, ScrollView, Modal } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useItems } from '@/hooks';
import { PPE_DELIVERY_STATUS_LABELS } from '@/constants';

interface PersonalPpeDeliveryFilterModalProps {
  visible: boolean;
  filters: any;
  onApplyFilters: (filters: any) => void;
  onClose: () => void;
}

export function PersonalPpeDeliveryFilterModal({
  visible,
  filters,
  onApplyFilters,
  onClose,
}: PersonalPpeDeliveryFilterModalProps) {

  const [localFilters, setLocalFilters] = useState(filters);

  const { data: items } = useItems({
    where: {
      category: { type: "PPE" },
      isActive: true,
    },
    orderBy: { name: "asc" },
  });

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
  };

  const statusOptions = Object.entries(PPE_DELIVERY_STATUS_LABELS).map(([key, label]) => ({
    value: key,
    label: label,
  }));

  const itemOptions: ComboboxOption[] =
    items?.data?.map((item) => ({
      value: item.id,
      label: item.name + (item.ppeCA ? ` - CA: ${item.ppeCA}` : ""),
    })) || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-background rounded-t-3xl max-h-[85%]">
          <View className="p-4 border-b border-border">
            <Text className="text-xl font-semibold">Filtros</Text>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="gap-6">
              {/* Status Filter */}
              <View className="gap-2">
                <Text className="text-sm font-medium">Status</Text>
                {statusOptions.map((option) => (
                  <View key={option.value} className="flex-row items-center gap-2">
                    <Checkbox
                      checked={localFilters.status?.includes(option.value)}
                      onCheckedChange={(checked) => {
                        const currentStatus = localFilters.status || [];
                        if (checked) {
                          setLocalFilters({
                            ...localFilters,
                            status: [...currentStatus, option.value],
                          });
                        } else {
                          setLocalFilters({
                            ...localFilters,
                            status: currentStatus.filter((s: string) => s !== option.value),
                          });
                        }
                      }}
                    />
                    <Text>{option.label}</Text>
                  </View>
                ))}
              </View>

              {/* Item Filter */}
              <View className="gap-2">
                <Text className="text-sm font-medium">Itens</Text>
                <Combobox
                  options={itemOptions}
                  value={localFilters.itemIds?.[0] || ""}
                  onValueChange={(value) => {
                    if (value) {
                      setLocalFilters({
                        ...localFilters,
                        itemIds: [value],
                      });
                    } else {
                      const newFilters = { ...localFilters };
                      delete newFilters.itemIds;
                      setLocalFilters(newFilters);
                    }
                  }}
                  placeholder="Selecione um item"
                  searchable={true}
                  clearable={true}
                />
              </View>

              {/* Scheduled Date Range */}
              <View className="gap-2">
                <Text className="text-sm font-medium">Data Agendada</Text>
                <View className="gap-2">
                  <DatePicker
                    value={localFilters.scheduledDateRange?.gte}
                    onChange={(date) => {
                      setLocalFilters({
                        ...localFilters,
                        scheduledDateRange: {
                          ...localFilters.scheduledDateRange,
                          gte: date,
                        },
                      });
                    }}
                    placeholder="Data inicial"
                  />
                  <DatePicker
                    value={localFilters.scheduledDateRange?.lte}
                    onChange={(date) => {
                      setLocalFilters({
                        ...localFilters,
                        scheduledDateRange: {
                          ...localFilters.scheduledDateRange,
                          lte: date,
                        },
                      });
                    }}
                    placeholder="Data final"
                  />
                </View>
              </View>

              {/* Actual Delivery Date Range */}
              <View className="gap-2">
                <Text className="text-sm font-medium">Data de Entrega</Text>
                <View className="gap-2">
                  <DatePicker
                    value={localFilters.actualDeliveryDateRange?.gte}
                    onChange={(date) => {
                      setLocalFilters({
                        ...localFilters,
                        actualDeliveryDateRange: {
                          ...localFilters.actualDeliveryDateRange,
                          gte: date,
                        },
                      });
                    }}
                    placeholder="Data inicial"
                  />
                  <DatePicker
                    value={localFilters.actualDeliveryDateRange?.lte}
                    onChange={(date) => {
                      setLocalFilters({
                        ...localFilters,
                        actualDeliveryDateRange: {
                          ...localFilters.actualDeliveryDateRange,
                          lte: date,
                        },
                      });
                    }}
                    placeholder="Data final"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View className="p-4 border-t border-border gap-2">
            <Button onPress={handleApply}>
              <Text>Aplicar Filtros</Text>
            </Button>
            <Button variant="outline" onPress={handleReset}>
              <Text>Limpar Filtros</Text>
            </Button>
            <Button variant="ghost" onPress={onClose}>
              <Text>Cancelar</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
