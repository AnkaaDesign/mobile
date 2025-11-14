import { useEffect, useState, useMemo } from "react";
import { View, ScrollView } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Combobox} from "@/components/ui/combobox";

import { DatePicker } from "@/components/ui/date-picker";
import { usePpeDeliveryMutations, useUsers, useItems } from "@/hooks";
import { ppeDeliveryCreateSchema } from '../../../schemas';
import type { PpeDeliveryCreateFormData } from '../../../schemas';
import type { User, Item } from '../../../types';
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS, USER_STATUS, PPE_TYPE } from "@/constants";
import { Controller } from "react-hook-form";
import { getItemPpeSize } from "@/utils/ppe-size-mapping";

import { cn } from "@/lib/utils";

interface PpeDeliveryFormProps {
  preselectedUser?: User;
  preselectedItem?: Item;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PpeDeliveryForm({ preselectedUser, preselectedItem, onSuccess, onCancel }: PpeDeliveryFormProps) {
  const { createAsync, createMutation } = usePpeDeliveryMutations();
  const [_selectedItem, _setSelectedItem] = useState<Item | null>(preselectedItem || null);

  const { data: users } = useUsers({
    where: { status: { not: USER_STATUS.DISMISSED } },
    orderBy: { name: "asc" },
    include: { ppeSize: true }, // Include user's PPE size configuration
  });

  const { data: items } = useItems({
    where: {
      category: { type: "PPE" },
      isActive: true,
    },
    orderBy: { name: "asc" },
    include: { measures: true }, // Include measures to get SIZE
  });

  const form = useForm<PpeDeliveryCreateFormData>({
    resolver: zodResolver(ppeDeliveryCreateSchema),
    defaultValues: {
      userId: preselectedUser?.id || "",
      itemId: preselectedItem?.id || "",
      quantity: 1,
      actualDeliveryDate: new Date(),
      status: PPE_DELIVERY_STATUS.PENDING,
    },
  });

  useEffect(() => {
    if (form.watch("itemId")) {
      const item = items?.data?.find((i) => i.id === form.watch("itemId"));
      _setSelectedItem(item || null);
    }
  }, [form.watch("itemId"), items]);

  const handleSubmit = async (data: PpeDeliveryCreateFormData) => {
    await createAsync(data);
    onSuccess?.();
  };

  const isLoading = createMutation.isPending;

  return (
    <ScrollView className="flex-1">
      <View className="p-4 gap-4">
        <Text className="text-lg font-semibold">Registrar Entrega de EPI</Text>

        <View className="gap-4">
          <Controller
            control={form.control}
            name="userId"
            render={({ field: { onChange, value }, fieldState: { error } }) => {
              const userOptions: ComboboxOption[] =
                users?.data?.map((user) => ({
                  value: user.id,
                  label: user.name,
                })) || [];

              return (
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">
                    Funcionário <Text className="text-destructive">*</Text>
                  </Text>
                  <Combobox
                    options={userOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione o funcionário"
                    disabled={isLoading || !!preselectedUser}
                    searchable={true}
                    clearable={false}
                    error={error ? error.message : undefined}
                  />
                </View>
              );
            }}
          />

          <Controller
            control={form.control}
            name="itemId"
            render={({ field: { onChange, value }, fieldState: { error } }) => {
              // Get selected user to filter items by size
              const selectedUserId = form.watch("userId");
              const selectedUser = users?.data?.find(u => u.id === selectedUserId);

              // Filter items based on user's PPE size configuration
              const filteredItems = useMemo(() => {
                if (!items?.data) return [];

                // If no user selected or user has no ppeSize config, show all items
                if (!selectedUser?.ppeSize) return items.data;

                return items.data.filter((item) => {
                  // If item has no ppeType, include it (not a sized PPE)
                  if (!item.ppeType) return true;

                  // For OTHERS type, sizes are optional
                  if (item.ppeType === PPE_TYPE.OTHERS) return true;

                  // Get item size from measures
                  const itemSize = getItemPpeSize(item);

                  // If item has no size, include it (size is optional)
                  if (!itemSize) return true;

                  // Get user's size for this PPE type
                  let userSize: string | null = null;
                  if (item.ppeType === PPE_TYPE.SHIRT || item.ppeType === PPE_TYPE.SLEEVES) {
                    userSize = selectedUser.ppeSize.shirts || selectedUser.ppeSize.sleeves;
                  } else if (item.ppeType === PPE_TYPE.PANTS) {
                    userSize = selectedUser.ppeSize.pants;
                  } else if (item.ppeType === PPE_TYPE.BOOTS) {
                    userSize = selectedUser.ppeSize.boots;
                  } else if (item.ppeType === PPE_TYPE.GLOVES) {
                    userSize = selectedUser.ppeSize.gloves;
                  } else if (item.ppeType === PPE_TYPE.MASK) {
                    userSize = selectedUser.ppeSize.mask;
                  } else if (item.ppeType === PPE_TYPE.RAIN_BOOTS) {
                    userSize = selectedUser.ppeSize.rainBoots;
                  }

                  // If user has no size configured for this type, include all items
                  if (!userSize) return true;

                  // Match item size with user size
                  return itemSize === userSize;
                });
              }, [items?.data, selectedUser]);

              const itemOptions: ComboboxOption[] =
                filteredItems.map((item) => ({
                  value: item.id,
                  label: item.name + (item.ppeCA ? ` - CA: ${item.ppeCA}` : ""),
                }));

              return (
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">
                    EPI <Text className="text-destructive">*</Text>
                  </Text>
                  {selectedUser?.ppeSize && (
                    <Text className="text-xs text-muted-foreground">
                      Mostrando apenas EPIs compatíveis com o tamanho do colaborador
                    </Text>
                  )}
                  <Combobox
                    options={itemOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione o EPI"
                    disabled={isLoading || !!preselectedItem}
                    searchable={true}
                    clearable={false}
                    error={error ? error.message : undefined}
                  />
                </View>
              );
            }}
          />

          <Controller
            control={form.control}
            name="quantity"
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <View className="gap-2">
                <Text className="text-sm font-medium text-foreground">
                  Quantidade <Text className="text-destructive">*</Text>
                </Text>
                <Input
                  value={value?.toString()}
                  onChangeText={(text) => onChange(parseInt(text) || 1)}
                  onBlur={onBlur}
                  placeholder="1"
                  keyboardType="numeric"
                  editable={!isLoading}
                  className={cn(error && "border-destructive")}
                />
                {error && <Text className="text-sm text-destructive">{error.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={form.control}
            name="actualDeliveryDate"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View className="gap-2">
                <Text className="text-sm font-medium text-foreground">
                  Data de Entrega <Text className="text-destructive">*</Text>
                </Text>
                <DatePicker value={value ?? undefined} onChange={onChange} placeholder="Selecione a data" disabled={isLoading} />
                {error && <Text className="text-sm text-destructive">{error.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={form.control}
            name="status"
            render={({ field: { onChange, value }, fieldState: { error } }) => {
              const statusOptions: ComboboxOption[] = Object.entries(PPE_DELIVERY_STATUS_LABELS).map(([key, label]) => ({
                value: key,
                label: label,
              }));

              return (
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">
                    Status <Text className="text-destructive">*</Text>
                  </Text>
                  <Combobox
                    options={statusOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione o status"
                    disabled={isLoading}
                    searchable={false}
                    clearable={false}
                    error={error ? error.message : undefined}
                  />
                </View>
              );
            }}
          />

        </View>

        <View className="flex-row gap-3 pt-4">
          <Button variant="outline" onPress={onCancel} disabled={isLoading} className="flex-1">
            <Text>Cancelar</Text>
          </Button>
          <Button onPress={form.handleSubmit(handleSubmit)} disabled={isLoading} className="flex-1">
            <Text>{isLoading ? "Salvando..." : "Registrar Entrega"}</Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
