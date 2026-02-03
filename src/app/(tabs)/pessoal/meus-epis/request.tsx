import { useEffect, useState, useCallback, useMemo } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { TextArea } from "@/components/ui/text-area";
import { useAuth } from "@/contexts/auth-context";
import { usePpeSize, useRequestPpeDelivery } from '@/hooks';
import { getItems } from '@/api-client';
import { ppeRequestSchema } from '@/schemas/ppe-request';
import { PPE_TYPE, PPE_DELIVERY_MODE, PPE_TYPE_LABELS, ITEM_CATEGORY_TYPE } from '@/constants';
import { getItemPpeSize } from '@/utils/ppe-size-mapping';
import { getPpeSizeByType, allowsOnDemandDelivery } from '@/utils/ppe';
import { cn } from "@/lib/utils";
import type { PpeRequestFormData } from '@/schemas/ppe-request';
import type { Item } from '@/types';
import { useTheme } from "@/lib/theme";

export default function RequestPPEScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);
  // Track all loaded items to find selected item details
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

  // Async query function for PPE items with CLIENT-SIDE size filtering (matching web implementation)
  const searchPpeItems = useCallback(async (
    search: string,
    page: number = 1
  ): Promise<{ data: Item[]; hasMore: boolean; total?: number }> => {
    const pageSize = 50; // Fetch more items to filter client-side

    try {
      // Fetch PPE items with stock > 0
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

      // CLIENT-SIDE FILTERING (matching web implementation)
      items = items.filter((item: Item) => {
        // 1. Filter by delivery mode - only allow ON_DEMAND or BOTH (or legacy null)
        if (item.ppeDeliveryMode && !allowsOnDemandDelivery(item)) {
          return false;
        }

        // 2. If user has no sizes configured, include all items (filtered only by delivery mode above)
        if (!hasSizesConfigured || !userPpeSize?.data) {
          return true;
        }

        // 3. If item doesn't have a ppeType, include it
        if (!item.ppeType) return true;

        // 4. For OTHERS type, always include (no size requirement)
        if (item.ppeType === PPE_TYPE.OTHERS) return true;

        // 5. Get user's size for this PPE type
        const userSize = getPpeSizeByType(userPpeSize.data, item.ppeType);

        // 6. Get item's size from measures array (handles both letter and numeric sizes)
        const itemSize = getItemPpeSize(item);

        // 7. If item has no size defined, include it (size is optional)
        if (!itemSize) return true;

        // 8. If user has no size configured for this type, include item
        if (!userSize) return true;

        // 9. Match user's size with item's size (e.g., "SIZE_38" === "SIZE_38")
        return itemSize === userSize;
      });

      const total = response.meta?.total || items.length;
      const hasMore = response.meta?.hasNextPage || false;

      // Cache loaded items for lookup when selecting
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
      console.error('[PPE Request Screen] Error fetching PPE items:', error);
      return { data: [], hasMore: false };
    }
  }, [hasSizesConfigured, userPpeSize?.data]);

  // Update stock availability when selected item changes
  useEffect(() => {
    if (selectedItem) {
      const stock = selectedItem.quantity ?? (selectedItem as any).currentStock;
      if (stock !== undefined) {
        setStockAvailable(stock);
      } else {
        setStockAvailable(null);
      }
    } else {
      setStockAvailable(null);
    }
  }, [selectedItem]);

  // Get option value and label for Combobox
  const getOptionValue = useCallback((item: Item) => item.id, []);
  const getOptionLabel = useCallback((item: Item) => {
    const parts = [item.name];
    // Get size from measures
    const itemSize = getItemPpeSize(item);
    if (itemSize) parts.push(`- ${itemSize}`);
    // Add PPE type label
    if (item.ppeType) {
      const typeLabel = PPE_TYPE_LABELS[item.ppeType as PPE_TYPE] || item.ppeType;
      parts.push(`(${typeLabel})`);
    }
    return parts.join(' ');
  }, []);

  const handleSubmit = useCallback(async (data: PpeRequestFormData) => {
    console.log('[PPE Request Screen] Submitting request:', data);
    console.log('[PPE Request Screen] Selected item:', selectedItem);

    const requestData = {
      itemId: data.itemId,
      quantity: 1,
      reason: data.reason,
    };

    try {
      const result = await requestMutation.mutateAsync(requestData);
      console.log('[PPE Request Screen] Request successful:', result);
      form.reset();
      router.back();
    } catch (error: any) {
      console.error('[PPE Request Screen] Request failed:', error);
      // API client handles error alerts
    }
  }, [requestMutation, form, selectedItem]);

  const isLoading = requestMutation.isPending;

  return (
    <ThemedView style={{ flex: 1, backgroundColor: colors.background, paddingBottom: insets.bottom }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ gap: 16 }}>
          {/* Item Selection - Now with async loading and infinite scroll */}
          <Controller
            control={form.control}
            name="itemId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={{ gap: 8 }}>
                <ThemedText style={{ fontSize: 14, fontWeight: "500" }}>
                  Item <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
                </ThemedText>
                <Combobox<Item>
                  async={true}
                  queryKey={["ppe-items", "request", userPpeSize?.data?.id]}
                  queryFn={searchPpeItems}
                  initialOptions={initialOptions}
                  minSearchLength={0}
                  pageSize={20}
                  debounceMs={300}
                  value={value}
                  onValueChange={(newValue) => {
                    const id = Array.isArray(newValue) ? newValue[0] : newValue;
                    onChange(id || '');
                    // Update selected item from cached items
                    if (id) {
                      const item = loadedItems.get(id);
                      if (item) {
                        setSelectedItem(item);
                      }
                    } else {
                      setSelectedItem(null);
                    }
                  }}
                  getOptionValue={getOptionValue}
                  getOptionLabel={getOptionLabel}
                  placeholder="Selecione o item de EPI"
                  emptyText="Nenhum EPI encontrado"
                  searchPlaceholder="Buscar EPI por nome ou código..."
                  disabled={isLoading || isLoadingPpeSize}
                  searchable={true}
                  clearable={false}
                  error={error?.message}
                  renderOption={(item, isSelected) => {
                    const itemSize = getItemPpeSize(item);
                    const typeLabel = item.ppeType ? (PPE_TYPE_LABELS[item.ppeType as PPE_TYPE] || item.ppeType) : null;

                    return (
                      <View style={{ flex: 1 }}>
                        <ThemedText style={{ fontWeight: isSelected ? "600" : "400" }}>
                          {item.name}
                          {itemSize ? ` - ${itemSize}` : ''}
                        </ThemedText>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                          {typeLabel && (
                            <ThemedText style={{ fontSize: 12, color: colors.mutedForeground }}>
                              {typeLabel}
                            </ThemedText>
                          )}
                          {item.ppeCA && (
                            <ThemedText style={{ fontSize: 12, color: colors.mutedForeground }}>
                              CA: {item.ppeCA}
                            </ThemedText>
                          )}
                          {item.quantity !== undefined && (
                            <ThemedText style={{ fontSize: 12, color: item.quantity > 0 ? colors.mutedForeground : colors.destructive }}>
                              Estoque: {item.quantity}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                    );
                  }}
                />
                {error && (
                  <ThemedText style={{ fontSize: 12, color: colors.destructive }}>
                    {error.message}
                  </ThemedText>
                )}
              </View>
            )}
          />

          {/* Selected Item Info */}
          {selectedItem && (
            <View style={{
              padding: 12,
              backgroundColor: colors.card,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border
            }}>
              <ThemedText style={{ fontWeight: "600", marginBottom: 4 }}>
                Item Selecionado
              </ThemedText>
              <ThemedText style={{ fontSize: 13 }}>
                {selectedItem.name}
                {getItemPpeSize(selectedItem) ? ` - ${getItemPpeSize(selectedItem)}` : ''}
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {selectedItem.ppeType && (
                  <ThemedText style={{ fontSize: 12, color: colors.mutedForeground }}>
                    {PPE_TYPE_LABELS[selectedItem.ppeType as PPE_TYPE] || selectedItem.ppeType}
                  </ThemedText>
                )}
                {selectedItem.ppeCA && (
                  <ThemedText style={{ fontSize: 12, color: colors.mutedForeground }}>
                    CA: {selectedItem.ppeCA}
                  </ThemedText>
                )}
              </View>
              {stockAvailable !== null && (
                <ThemedText style={{
                  fontSize: 12,
                  color: stockAvailable > 0 ? colors.mutedForeground : colors.destructive,
                  marginTop: 4
                }}>
                  Estoque disponível: {stockAvailable} unidades
                </ThemedText>
              )}
            </View>
          )}

          {/* Reason (Required) */}
          <Controller
            control={form.control}
            name="reason"
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <View style={{ gap: 8 }}>
                <ThemedText style={{ fontSize: 14, fontWeight: "500" }}>
                  Justificativa <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
                </ThemedText>
                <TextArea
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Informe o motivo da solicitação"
                  editable={!isLoading}
                  numberOfLines={3}
                  className={cn(error && "border-destructive")}
                />
                {error && (
                  <ThemedText style={{ fontSize: 12, color: colors.destructive }}>
                    {error.message}
                  </ThemedText>
                )}
              </View>
            )}
          />

          {/* Info about PPE sizes */}
          {!hasSizesConfigured && !isLoadingPpeSize && (
            <View style={{
              padding: 12,
              backgroundColor: "#dbeafe",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#93c5fd"
            }}>
              <ThemedText style={{ fontSize: 13, color: "#1e40af", marginBottom: 4 }}>
                Dica: Cadastre seus tamanhos de EPI
              </ThemedText>
              <ThemedText style={{ fontSize: 12, color: "#1e3a8a" }}>
                Cadastrar seus tamanhos ajuda a mostrar apenas os EPIs do seu tamanho.
                Acesse seu perfil ou entre em contato com o RH.
              </ThemedText>
            </View>
          )}

          {/* Info when user has PPE sizes */}
          {hasSizesConfigured && (
            <View style={{
              padding: 12,
              backgroundColor: "#dcfce7",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#86efac"
            }}>
              <ThemedText style={{ fontSize: 13, color: "#166534", marginBottom: 4 }}>
                Seus tamanhos de EPI estão cadastrados
              </ThemedText>
              <ThemedText style={{ fontSize: 12, color: "#15803d" }}>
                Os EPIs exibidos já estão filtrados de acordo com seus tamanhos registrados.
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={{ padding: 16, gap: 12, borderTopWidth: 1, borderColor: colors.border }}>
        <Button
          onPress={() => {
            form.handleSubmit(handleSubmit)();
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <ThemedText style={{ color: "#fff" }}>Enviando...</ThemedText>
            </View>
          ) : (
            <ThemedText style={{ color: "#fff" }}>Solicitar EPI</ThemedText>
          )}
        </Button>
        <Button
          variant="outline"
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <ThemedText>Cancelar</ThemedText>
        </Button>
      </View>
    </ThemedView>
  );
}
