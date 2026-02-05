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
import { PPE_TYPE, PPE_TYPE_LABELS, SECTOR_PRIVILEGES, ITEM_CATEGORY_TYPE } from '@/constants';
import { getItemPpeSize } from '@/utils/ppe-size-mapping';
import { getPpeSizeByType, allowsOnDemandDelivery } from '@/utils/ppe';
import { cn } from "@/lib/utils";
import { hasPrivilege } from "@/utils/user";
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

  // Check if user has PPE sizes configured
  const hasSizesConfigured = useMemo(() => {
    const ppeSizeData = userPpeSize?.data;
    if (!ppeSizeData) return false;
    return !!(ppeSizeData.shirts || ppeSizeData.pants || ppeSizeData.boots ||
              ppeSizeData.gloves || ppeSizeData.mask || ppeSizeData.sleeves ||
              ppeSizeData.rainBoots || ppeSizeData.shorts);
  }, [userPpeSize?.data]);

  // Async query function for PPE items with CLIENT-SIDE size filtering (like web)
  const searchPpeItems = useCallback(async (
    search: string,
    page: number = 1
  ): Promise<{ data: Item[]; hasMore: boolean; total?: number }> => {
    const pageSize = 50; // Fetch more items to filter client-side

    try {
      // Fetch ALL PPE items with stock > 0 (like web version)
      const response = await getItems({
        take: pageSize,
        skip: (page - 1) * pageSize,
        where: {
          category: {
            type: ITEM_CATEGORY_TYPE.PPE,
          },
          quantity: {
            gt: 0,
          },
        },
        include: {
          brand: true,
          category: true,
          measures: true,
        },
        searchingFor: search || undefined,
        orderBy: { name: 'asc' },
      });

      let items = response.data || [];

      // CLIENT-SIDE FILTERING (exactly like web version)
      if (hasSizesConfigured && userPpeSize?.data) {
        items = items.filter((item: Item) => {
          // 1. Only allow items with ON_DEMAND or BOTH delivery mode (or legacy null)
          if (item.ppeDeliveryMode && !allowsOnDemandDelivery(item)) {
            return false;
          }

          // 2. If item doesn't have a ppeType, include it
          if (!item.ppeType) return true;

          // 3. For OTHERS type, always include (no size requirement)
          if (item.ppeType === PPE_TYPE.OTHERS) return true;

          // 4. Get user's size for this PPE type
          if (!userPpeSize.data) return true;
          const userSize = getPpeSizeByType(userPpeSize.data, item.ppeType);

          // 5. Get item's size from measures array
          const itemSize = getItemPpeSize(item);

          // 6. If item has no size defined, include it
          if (!itemSize) return true;

          // 7. If user has no size configured for this type, include item
          if (!userSize) return true;

          // 8. Match user's size with item's size
          return itemSize === userSize;
        });
      } else {
        // User has no sizes configured - only filter by delivery mode
        items = items.filter((item: Item) => {
          if (item.ppeDeliveryMode && !allowsOnDemandDelivery(item)) {
            return false;
          }
          return true;
        });
      }

      const total = response.meta?.totalRecords || items.length;
      const hasMore = response.meta?.hasNextPage || false;

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
  }, [hasSizesConfigured, userPpeSize?.data]);

  // Update stock availability when selected item changes
  useEffect(() => {
    if (selectedItem) {
      const stock = selectedItem.quantity ?? (selectedItem as any).currentStock;
      setStockAvailable(stock !== undefined ? stock : null);
    } else {
      setStockAvailable(null);
    }
  }, [selectedItem]);

  // Check if user can see stock info (warehouse/admin only)
  const canSeeStock = useMemo(() => {
    return hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) || hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  // Get option value and label for Combobox
  const getOptionValue = useCallback((item: Item) => item.id, []);
  const getOptionLabel = useCallback((item: Item) => {
    const parts = [item.name];
    // Get size from measures
    const itemSize = getItemPpeSize(item);
    if (itemSize) parts.push(`- ${itemSize}`);
    // Show PPE type with proper label
    if (item.ppeType) {
      const typeLabel = PPE_TYPE_LABELS[item.ppeType as PPE_TYPE] || item.ppeType;
      parts.push(`(${typeLabel})`);
    }
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
                    {/* Only show stock warning for warehouse/admin users */}
                    {canSeeStock && stockAvailable !== null && value > stockAvailable && (
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
              {!hasSizesConfigured && !isLoadingPpeSize && (
                <View className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Text className="text-sm text-blue-600 dark:text-blue-400">
                    Dica: Cadastrar seus tamanhos de EPI mostra apenas os itens do seu tamanho.
                  </Text>
                </View>
              )}

              {hasSizesConfigured && (
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
