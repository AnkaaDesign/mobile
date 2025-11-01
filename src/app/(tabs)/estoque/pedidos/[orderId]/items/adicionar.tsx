import React, { useState, useCallback } from "react";
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform , StyleSheet} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrderItemMutations, useItems, useOrder } from '../../../../../../hooks';
import { orderItemCreateSchema } from '../../../../../../schemas';
import type { OrderItemCreateFormData } from '../../../../../../schemas';
import { ThemedView, ThemedText, ErrorScreen, LoadingScreen, Button } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { ThemedTextInput } from "@/components/ui/themed-text-input";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOption } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import { formatCurrency } from '../../../../../../utils';
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from '../../../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../../../constants';

export default function AddOrderItemScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [itemSearchText, setItemSearchText] = useState("");

  // Check permissions
  const canCreate = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);

  if (!canCreate) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Sem permissão" detail="Você não tem permissão para adicionar itens" />
      </ThemedView>
    );
  }

  // Get order details
  const { data: order, isLoading: orderLoading, error: orderError } = useOrder(orderId!, {
    include: {
      supplier: { select: { id: true, name: true } },
    },
    enabled: !!orderId,
  });

  // Get items for selection
  const {
    data: itemsResponse,
    isLoading: itemsLoading,
    // // error: itemsError, (unused) (unused)
  } = useItems({
    ...(itemSearchText ? { searchingFor: itemSearchText } : {}),
    include: {
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      measures: true,
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  const items = itemsResponse?.data ?? [];

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<OrderItemCreateFormData>({
    resolver: zodResolver(orderItemCreateSchema),
    defaultValues: {
      orderId: orderId!,
      orderedQuantity: 1,
      price: 0,
      icms: 0,
      ipi: 0,
      isCritical: false,
    },
    mode: "onChange",
  });

  // Watch for quantity and price changes to calculate total
  const watchedQuantity = watch("orderedQuantity");
  const watchedPrice = watch("price");
  const watchedItemId = watch("itemId");

  // Find selected item to get price info
  const selectedItem = items.find((item) => item.id === watchedItemId);

  // Mutations
  const { create, isLoading: isCreating } = useOrderItemMutations({
    onCreateSuccess: () => {
      router.back();
    },
  });

  const handleItemSearch = useCallback((text: string) => {
    setItemSearchText(text);
  }, []);

  const handleItemSelect = useCallback(
    (itemId?: string) => {
      if (!itemId) {
        setValue("itemId", "");
        setValue("price", 0);
        return;
      }

      const item = items.find((i) => i.id === itemId);
      if (item) {
        setValue("itemId", itemId);
        // Set price from item's current price if available
        const currentPrice = item.prices?.[0]?.value || 0;
        setValue("price", currentPrice);
      }
    },
    [items, setValue]
  );

  const onSubmit = async (data: OrderItemCreateFormData) => {
    try {
      await create(data);
    } catch (error) {
      console.error("Error creating order item:", error);
      Alert.alert("Erro", "Não foi possível adicionar o item ao pedido. Tente novamente.");
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        "Descartar alterações",
        "Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.",
        [
          { text: "Continuar editando", style: "cancel" },
          { text: "Descartar", style: "destructive", onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  if (orderLoading) {
    return <LoadingScreen message="Carregando pedido..." />;
  }

  if (orderError || !order) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar pedido"
          detail={orderError?.message || "Pedido não encontrado"}
        />
      </ThemedView>
    );
  }

  // Convert items to combobox options
  const itemOptions: ComboboxOption[] = items.map((item) => ({
    label: `${item.name} ${item.uniCode ? `(${item.uniCode})` : ""}`,
    value: item.id,
    item,
  }));

  const totalPrice = (watchedQuantity || 0) * (watchedPrice || 0);

  return (
    <KeyboardAvoidingView
      style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ThemedView style={StyleSheet.flatten([styles.container, { paddingBottom: insets.bottom }])}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order Context */}
          <Card style={styles.card}>
            <View style={styles.orderHeader}>
              <ThemedText style={styles.orderTitle}>{order?.data?.description || `Pedido #${orderId}`}</ThemedText>
              <ThemedText style={styles.orderSupplier}>{order?.data?.supplier?.name || order?.data?.supplier?.fantasyName}</ThemedText>
            </View>
          </Card>

          {/* Item Selection */}
          <Card style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Selecionar Item</ThemedText>

            <View style={styles.formGroup}>
              <Controller
                control={control}
                name="itemId"
                rules={{ required: "Selecione um item" }}
                render={({ field: { value, onChange } }) => (
                  <Combobox
                    label="Item *"
                    placeholder="Selecione um item..."
                    searchPlaceholder="Buscar itens..."
                    options={itemOptions}
                    value={value || ""}
                    onValueChange={(itemId) => {
                      onChange(itemId || "");
                      handleItemSelect(itemId || "");
                    }}
                    onSearchChange={handleItemSearch}
                    loading={itemsLoading}
                    error={errors.itemId?.message}
                    searchable
                    clearable
                    emptyText="Nenhum item encontrado"
                    renderOption={(option, isSelected, onPress) => (
                      <ItemOption
                        option={option}
                        isSelected={isSelected}
                        onPress={onPress}
                      />
                    )}
                  />
                )}
              />

              {selectedItem && (
                <View style={styles.itemInfo}>
                  <ThemedText style={styles.itemInfoTitle}>Informações do Item</ThemedText>
                  <View style={styles.itemInfoRow}>
                    <ThemedText style={styles.itemInfoLabel}>Nome:</ThemedText>
                    <ThemedText style={styles.itemInfoValue}>{selectedItem.name}</ThemedText>
                  </View>
                  {selectedItem.uniCode && (
                    <View style={styles.itemInfoRow}>
                      <ThemedText style={styles.itemInfoLabel}>Código:</ThemedText>
                      <ThemedText style={styles.itemInfoValue}>{selectedItem.uniCode}</ThemedText>
                    </View>
                  )}
                  {selectedItem.brand?.name && (
                    <View style={styles.itemInfoRow}>
                      <ThemedText style={styles.itemInfoLabel}>Marca:</ThemedText>
                      <ThemedText style={styles.itemInfoValue}>{selectedItem.brand.name}</ThemedText>
                    </View>
                  )}
                  {selectedItem.prices?.[0]?.value && (
                    <View style={styles.itemInfoRow}>
                      <ThemedText style={styles.itemInfoLabel}>Preço Atual:</ThemedText>
                      <ThemedText style={StyleSheet.flatten([styles.itemInfoValue, { color: colors.primary }])}>
                        {formatCurrency(selectedItem.prices[0].value)}
                      </ThemedText>
                    </View>
                  )}
                  {selectedItem.quantity !== undefined && (
                    <View style={styles.itemInfoRow}>
                      <ThemedText style={styles.itemInfoLabel}>Estoque:</ThemedText>
                      <ThemedText style={StyleSheet.flatten([
                        styles.itemInfoValue,
                        { color: selectedItem.quantity > 0 ? colors.primary : colors.destructive }
                      ])}>
                        {selectedItem.quantity}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}
            </View>
          </Card>

          {/* Quantity and Price */}
          <Card style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Quantidade e Preço</ThemedText>

            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Controller
                  control={control}
                  name="orderedQuantity"
                  rules={{
                    required: "Quantidade é obrigatória",
                    min: { value: 1, message: "Quantidade deve ser maior que 0" },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <ThemedTextInput
                      label="Quantidade *"
                      placeholder="1"
                      value={value?.toString() || ""}
                      onChangeText={(text) => {
                        const num = parseInt(text) || 0;
                        onChange(num);
                      }}
                      keyboardType="numeric"
                      error={errors.orderedQuantity?.message}
                    />
                  )}
                />
              </View>

              <View style={styles.formGroup}>
                <Controller
                  control={control}
                  name="price"
                  rules={{
                    required: "Preço unitário é obrigatório",
                    min: { value: 0, message: "Preço deve ser maior ou igual a 0" },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <ThemedTextInput
                      label="Preço Unitário *"
                      placeholder="0,00"
                      value={value ? formatCurrency(value).replace("R$ ", "") : ""}
                      onChangeText={(text) => {
                        // Parse currency input
                        const cleanText = text.replace(/[^\d,]/g, "");
                        const numericValue = parseFloat(cleanText.replace(",", ".")) || 0;
                        onChange(numericValue);
                      }}
                      keyboardType="numeric"
                      error={errors.price?.message}
                    />
                  )}
                />
              </View>
            </View>

            {/* Total Price Display */}
            {totalPrice > 0 && (
              <View style={styles.totalContainer}>
                <ThemedText style={styles.totalLabel}>Total:</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.totalValue, { color: colors.primary }])}>
                  {formatCurrency(totalPrice)}
                </ThemedText>
              </View>
            )}
          </Card>

          {/* Additional Fields */}
          <Card style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Informações Adicionais</ThemedText>

            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Controller
                  control={control}
                  name="icms"
                  rules={{
                    min: { value: 0, message: "ICMS deve ser entre 0 e 100%" },
                    max: { value: 100, message: "ICMS deve ser entre 0 e 100%" },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <ThemedTextInput
                      label="ICMS (%)"
                      placeholder="0,00"
                      value={value?.toString() || ""}
                      onChangeText={(text) => {
                        const numericValue = parseFloat(text) || 0;
                        onChange(numericValue);
                      }}
                      keyboardType="numeric"
                      error={errors.icms?.message}
                    />
                  )}
                />
              </View>

              <View style={styles.formGroup}>
                <Controller
                  control={control}
                  name="ipi"
                  rules={{
                    min: { value: 0, message: "IPI deve ser entre 0 e 100%" },
                    max: { value: 100, message: "IPI deve ser entre 0 e 100%" },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <ThemedTextInput
                      label="IPI (%)"
                      placeholder="0,00"
                      value={value?.toString() || ""}
                      onChangeText={(text) => {
                        const numericValue = parseFloat(text) || 0;
                        onChange(numericValue);
                      }}
                      keyboardType="numeric"
                      error={errors.ipi?.message}
                    />
                  )}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Controller
                control={control}
                name="isCritical"
                  render={({ field: { value, onChange } }) => (
                    <View style={styles.switchContainer}>
                      <ThemedText style={styles.switchLabel}>Item Crítico</ThemedText>
                      <Switch
                        checked={value}
                        onCheckedChange={onChange}
                      />
                    </View>
                  )}
                />
              </View>
          </Card>
        </ScrollView>

        {/* Action Buttons */}
        <View style={StyleSheet.flatten([styles.actionButtons, { paddingBottom: insets.bottom }])}>
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.cancelButton}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            style={styles.saveButton}
            disabled={!isValid || isCreating}
          >
            Adicionar Item
          </Button>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

interface ItemOptionProps {
  option: ComboboxOption;
  isSelected: boolean;
  onPress: () => void;
}

const ItemOption: React.FC<ItemOptionProps> = ({ option, isSelected, }) => {
  const { colors } = useTheme();
  const item = option.item;

  return (
    <View
      style={StyleSheet.flatten([
        styles.itemOption,
        { borderColor: colors.border },
        isSelected && { backgroundColor: colors.accent },
      ])}
    >
      <View style={styles.itemOptionHeader}>
        <ThemedText style={StyleSheet.flatten([styles.itemOptionName, isSelected && { fontWeight: "600" }])}>
          {item?.name}
        </ThemedText>
        {item?.prices?.[0]?.value && (
          <ThemedText style={StyleSheet.flatten([styles.itemOptionPrice, { color: colors.primary }])}>
            {formatCurrency(item.prices[0].value)}
          </ThemedText>
        )}
      </View>

      <View style={styles.itemOptionDetails}>
        {item?.uniCode && (
          <ThemedText style={styles.itemOptionCode}>Código: {item.uniCode}</ThemedText>
        )}
        {item?.brand?.name && (
          <ThemedText style={styles.itemOptionBrand}>Marca: {item.brand.name}</ThemedText>
        )}
        {item?.quantity !== undefined && (
          <ThemedText style={StyleSheet.flatten([
            styles.itemOptionStock,
            { color: item.quantity > 0 ? colors.primary : colors.destructive }
          ])}>
            Estoque: {item.quantity}
          </ThemedText>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    marginVertical: 8,
    padding: 16,
  },
  orderHeader: {
    gap: 4,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  orderSupplier: {
    fontSize: 14,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  formGroup: {
    flex: 1,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  itemInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    gap: 6,
  },
  itemInfoTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  itemInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemInfoLabel: {
    fontSize: 13,
    opacity: 0.7,
    width: 100,
    fontWeight: "500",
  },
  itemInfoValue: {
    fontSize: 13,
    fontWeight: "400",
    flex: 1,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  itemOption: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemOptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  itemOptionName: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  itemOptionPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemOptionDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  itemOptionCode: {
    fontSize: 12,
    opacity: 0.7,
  },
  itemOptionBrand: {
    fontSize: 12,
    opacity: 0.7,
  },
  itemOptionStock: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
});