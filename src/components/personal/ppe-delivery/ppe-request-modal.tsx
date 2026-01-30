import { useEffect, useState, useCallback, useMemo } from "react";
import { View, ScrollView, Modal, ActivityIndicator } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { TextArea } from "@/components/ui/text-area";
import { useAuth } from "@/contexts/auth-context";
import { usePpeSize, useRequestPpeDelivery } from '@/hooks';
import { getItems } from '@/api-client';
import { ppeRequestSchema, type PpeRequestFormData } from '@/schemas/ppe-request';
import { PPE_TYPE } from '@/constants';
import { cn } from "@/lib/utils";
import type { Item } from '@/types';

interface PpeRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PpeRequestModal({
  visible,
  onClose,
  onSuccess,
}: PpeRequestModalProps) {
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);
  const [loadedItems, setLoadedItems] = useState<Map<string, Item>>(new Map());

  // Get user's PPE size - user.ppeSize is already the full PpeSize object if included
  // If it's just an ID reference, fetch it; otherwise use it directly
  const ppeSizeId = typeof user?.ppeSize === 'object' ? user.ppeSize?.id : user?.ppeSize;
  const { data: fetchedPpeSize, isLoading: isLoadingPpeSize } = usePpeSize(ppeSizeId || '', {
    enabled: !!ppeSizeId && typeof user?.ppeSize !== 'object',
  });

  // Use directly loaded ppeSize or fetched one
  const userPpeSize = typeof user?.ppeSize === 'object' && user.ppeSize
    ? { data: user.ppeSize }
    : fetchedPpeSize;

  const form = useForm<PpeRequestFormData>({
    resolver: zodResolver(ppeRequestSchema),
    defaultValues: {
      itemId: "",
      quantity: 1,
      scheduledDate: null,
      reason: "",
    },
  });

  // Request PPE delivery mutation
  const requestMutation = useRequestPpeDelivery();

  // Memoize the initial options to prevent infinite loops
  const initialOptions = useMemo(() => {
    return selectedItem ? [selectedItem] : [];
  }, [selectedItem?.id]);

  // Build size filter conditions based on user's PPE sizes
  const buildSizeFilterConditions = useCallback(() => {
    const ppeSizeData = userPpeSize?.data;
    if (!ppeSizeData) {
      return null;
    }

    const sizeConditions: Array<{ ppeType: string; ppeSize: string }> = [];

    if (ppeSizeData.shirts) {
      sizeConditions.push({ ppeType: PPE_TYPE.SHIRT, ppeSize: ppeSizeData.shirts });
    }
    if (ppeSizeData.pants) {
      sizeConditions.push({ ppeType: PPE_TYPE.PANTS, ppeSize: ppeSizeData.pants });
    }
    if (ppeSizeData.boots) {
      sizeConditions.push({ ppeType: PPE_TYPE.BOOTS, ppeSize: ppeSizeData.boots });
    }
    if (ppeSizeData.gloves) {
      sizeConditions.push({ ppeType: PPE_TYPE.GLOVES, ppeSize: ppeSizeData.gloves });
    }
    if (ppeSizeData.mask) {
      sizeConditions.push({ ppeType: PPE_TYPE.MASK, ppeSize: ppeSizeData.mask });
    }
    if (ppeSizeData.sleeves) {
      sizeConditions.push({ ppeType: PPE_TYPE.SLEEVES, ppeSize: ppeSizeData.sleeves });
    }
    if (ppeSizeData.rainBoots) {
      sizeConditions.push({ ppeType: PPE_TYPE.RAIN_BOOTS, ppeSize: ppeSizeData.rainBoots });
    }

    return sizeConditions;
  }, [userPpeSize?.data]);

  // Async query function for PPE items with infinite scrolling and size filtering
  const searchPpeItems = useCallback(async (
    search: string,
    page: number = 1
  ): Promise<{ data: Item[]; hasMore: boolean; total?: number }> => {
    const pageSize = 20;
    const sizeConditions = buildSizeFilterConditions();

    try {
      const whereClause: any = {
        ppeType: { not: null },
        isActive: true,
      };

      if (sizeConditions && sizeConditions.length > 0) {
        const userPpeTypes = sizeConditions.map(sc => sc.ppeType);

        whereClause.OR = [
          { ppeType: PPE_TYPE.OTHERS },
          { ppeSize: null },
          { ppeType: { notIn: userPpeTypes } },
          ...sizeConditions.map(sc => ({
            AND: [
              { ppeType: sc.ppeType },
              { ppeSize: sc.ppeSize },
            ],
          })),
        ];
      }

      const response = await getItems({
        take: pageSize,
        skip: (page - 1) * pageSize,
        where: whereClause,
        include: {
          brand: true,
          category: true,
          measures: true,
        },
        searchingFor: search || undefined,
        orderBy: { name: 'asc' },
      });

      const items = response.data || [];
      const total = response.meta?.total || items.length;
      const hasMore = (page * pageSize) < total;

      // Cache loaded items
      setLoadedItems(prev => {
        const newMap = new Map(prev);
        items.forEach(item => newMap.set(item.id, item));
        return newMap;
      });

      return {
        data: items,
        hasMore,
        total,
      };
    } catch (error) {
      console.error('[PPE Request Modal] Error fetching PPE items:', error);
      return { data: [], hasMore: false };
    }
  }, [buildSizeFilterConditions]);

  // Update stock availability when selected item changes
  useEffect(() => {
    if (selectedItem) {
      const stock = selectedItem.quantity ?? (selectedItem as any).currentStock;
      setStockAvailable(stock !== undefined ? stock : null);
    } else {
      setStockAvailable(null);
    }
  }, [selectedItem]);

  // Get option value and label for Combobox
  const getOptionValue = useCallback((item: Item) => item.id, []);
  const getOptionLabel = useCallback((item: Item) => {
    const parts = [item.name];
    if (item.ppeCA) parts.push(`- CA: ${item.ppeCA}`);
    if (item.ppeSize) parts.push(`(${item.ppeSize})`);
    return parts.join(' ');
  }, []);

  const handleSubmit = useCallback(async (data: PpeRequestFormData) => {
    const requestData = {
      itemId: data.itemId,
      quantity: data.quantity,
      scheduledDate: data.scheduledDate || undefined,
      reason: data.reason,
    };

    try {
      await requestMutation.mutateAsync(requestData);
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('[PPE Request Modal] Request failed:', error);
    }
  }, [requestMutation, form, onSuccess]);

  const handleClose = useCallback(() => {
    form.reset();
    setSelectedItem(null);
    setStockAvailable(null);
    setLoadedItems(new Map());
    onClose();
  }, [form, onClose]);

  const isLoading = requestMutation.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-background rounded-t-3xl max-h-[90%]">
          <View className="p-4 border-b border-border">
            <Text className="text-xl font-semibold">Solicitar EPI</Text>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="gap-4">
              {/* Item Selection - Async with infinite scroll */}
              <Controller
                control={form.control}
                name="itemId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View className="gap-2">
                    <Text className="text-sm font-medium text-foreground">
                      Item <Text className="text-destructive">*</Text>
                    </Text>
                    <Combobox<Item>
                      async={true}
                      queryKey={["ppe-items", "modal", userPpeSize?.data?.id]}
                      queryFn={searchPpeItems}
                      initialOptions={initialOptions}
                      minSearchLength={0}
                      pageSize={20}
                      debounceMs={300}
                      value={value}
                      onValueChange={(newValue) => {
                        const id = Array.isArray(newValue) ? newValue[0] : newValue;
                        onChange(id || '');
                        if (id) {
                          const item = loadedItems.get(id);
                          if (item) setSelectedItem(item);
                        } else {
                          setSelectedItem(null);
                        }
                      }}
                      getOptionValue={getOptionValue}
                      getOptionLabel={getOptionLabel}
                      placeholder="Selecione o item de EPI"
                      emptyText="Nenhum EPI encontrado"
                      searchPlaceholder="Buscar EPI..."
                      disabled={isLoading || isLoadingPpeSize}
                      searchable={true}
                      clearable={false}
                      error={error?.message}
                    />
                    {error && <Text className="text-sm text-destructive">{error.message}</Text>}
                  </View>
                )}
              />

              {/* Quantity */}
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
                    {stockAvailable !== null && value > stockAvailable && (
                      <Text className="text-sm text-destructive">
                        Quantidade excede estoque ({stockAvailable} disponíveis)
                      </Text>
                    )}
                  </View>
                )}
              />

              {/* Scheduled Date (Optional) */}
              <Controller
                control={form.control}
                name="scheduledDate"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View className="gap-2">
                    <Text className="text-sm font-medium text-foreground">
                      Data Desejada (Opcional)
                    </Text>
                    <DatePicker
                      value={value ?? undefined}
                      onChange={onChange}
                      placeholder="Selecione uma data"
                      disabled={isLoading}
                      minimumDate={new Date()}
                    />
                    {error && <Text className="text-sm text-destructive">{error.message}</Text>}
                  </View>
                )}
              />

              {/* Reason (Required) */}
              <Controller
                control={form.control}
                name="reason"
                render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
                  <View className="gap-2">
                    <Text className="text-sm font-medium text-foreground">
                      Justificativa <Text className="text-destructive">*</Text>
                    </Text>
                    <TextArea
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Informe o motivo da solicitação"
                      editable={!isLoading}
                      numberOfLines={3}
                      className={cn(error && "border-destructive")}
                    />
                    {error && <Text className="text-sm text-destructive">{error.message}</Text>}
                  </View>
                )}
              />

              {/* Info about PPE sizes */}
              {!userPpeSize?.data && !isLoadingPpeSize && (
                <View className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Text className="text-sm text-blue-600 dark:text-blue-400">
                    Dica: Cadastrar seus tamanhos de EPI mostra apenas os itens do seu tamanho.
                  </Text>
                </View>
              )}

              {userPpeSize?.data && (
                <View className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <Text className="text-sm text-green-600 dark:text-green-400">
                    EPIs filtrados pelo seu tamanho cadastrado.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View className="p-4 border-t border-border gap-2">
            <Button
              onPress={() => form.handleSubmit(handleSubmit)()}
              disabled={isLoading}
            >
              {isLoading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text>Enviando...</Text>
                </View>
              ) : (
                <Text>Solicitar EPI</Text>
              )}
            </Button>
            <Button
              variant="outline"
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text>Cancelar</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
