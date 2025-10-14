import React, { useEffect, useState } from "react";
import { View, ScrollView, Modal, ActivityIndicator } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { TextArea } from "@/components/ui/text-area";
import { showToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { useItems, usePpeSize, useRequestPpeDelivery } from '@/hooks';
import { ppeRequestSchema, type PpeRequestFormData } from '@/schemas/ppe-request';
import { PPE_TYPE } from '@/constants';
import { cn } from "@/lib/utils";

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
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);

  // Get user's PPE size
  const { data: userPpeSize } = usePpeSize(user?.ppeSizeId || "", {
    enabled: !!user?.ppeSizeId,
  });

  // Get available PPE items
  const { data: items, isLoading: isLoadingItems } = useItems({
    where: {
      category: { type: "PPE" },
      isActive: true,
    },
    include: {
      category: true,
      brand: true,
    },
    orderBy: { name: "asc" },
  });

  const form = useForm<PpeRequestFormData>({
    resolver: zodResolver(ppeRequestSchema),
    defaultValues: {
      itemId: "",
      quantity: 1,
      scheduledDate: null,
      notes: "",
      reason: "",
    },
  });

  // Request PPE delivery mutation
  const requestMutation = useRequestPpeDelivery();

  // Watch for item changes
  const watchedItemId = form.watch("itemId");

  useEffect(() => {
    if (watchedItemId && items?.data) {
      const item = items.data.find((i) => i.id === watchedItemId);
      setSelectedItem(item);

      // Get stock availability
      if (item?.currentStock !== undefined) {
        setStockAvailable(item.currentStock);
      } else {
        setStockAvailable(null);
      }
    } else {
      setSelectedItem(null);
      setStockAvailable(null);
    }
  }, [watchedItemId, items?.data]);

  // Validate PPE size compatibility
  const validateSizeCompatibility = (itemId: string): { isValid: boolean; message?: string } => {
    if (!userPpeSize?.data) {
      return {
        isValid: false,
        message: "Você precisa cadastrar seus tamanhos de EPI antes de solicitar",
      };
    }

    const item = items?.data?.find((i) => i.id === itemId);
    if (!item) {
      return { isValid: false, message: "Item não encontrado" };
    }

    // Check if user has the required size registered
    const ppeType = item.ppeType;
    const userSize = userPpeSize.data;

    if (!ppeType) {
      return { isValid: true }; // No specific type, allow request
    }

    // Validate based on PPE type
    switch (ppeType) {
      case PPE_TYPE.SHIRT:
      case PPE_TYPE.UNIFORM:
        if (!userSize.shirts) {
          return {
            isValid: false,
            message: "Você precisa cadastrar seu tamanho de camisa",
          };
        }
        break;
      case PPE_TYPE.PANTS:
        if (!userSize.pants) {
          return {
            isValid: false,
            message: "Você precisa cadastrar seu tamanho de calça",
          };
        }
        break;
      case PPE_TYPE.BOOTS:
        if (!userSize.boots) {
          return {
            isValid: false,
            message: "Você precisa cadastrar seu tamanho de bota",
          };
        }
        break;
      case PPE_TYPE.GLOVES:
        if (!userSize.gloves) {
          return {
            isValid: false,
            message: "Você precisa cadastrar seu tamanho de luva",
          };
        }
        break;
      case PPE_TYPE.MASK:
        if (!userSize.mask) {
          return {
            isValid: false,
            message: "Você precisa cadastrar seu tamanho de máscara",
          };
        }
        break;
      case PPE_TYPE.SLEEVES:
        if (!userSize.sleeves) {
          return {
            isValid: false,
            message: "Você precisa cadastrar seu tamanho de manga",
          };
        }
        break;
      case PPE_TYPE.RAIN_BOOTS:
        if (!userSize.rainBoots) {
          return {
            isValid: false,
            message: "Você precisa cadastrar seu tamanho de galocha",
          };
        }
        break;
    }

    return { isValid: true };
  };

  const handleSubmit = async (data: PpeRequestFormData) => {
    // Validate size compatibility
    const sizeValidation = validateSizeCompatibility(data.itemId);
    if (!sizeValidation.isValid) {
      showToast({
        message: sizeValidation.message || "Tamanho incompatível",
        type: "error",
      });
      return;
    }

    // Check stock availability
    if (stockAvailable !== null && data.quantity > stockAvailable) {
      showToast({
        message: `Estoque insuficiente. Disponível: ${stockAvailable}`,
        type: "error",
      });
      return;
    }

    try {
      await requestMutation.mutateAsync({
        itemId: data.itemId,
        quantity: data.quantity,
        scheduledDate: data.scheduledDate || undefined,
        notes: data.notes,
        reason: data.reason,
      });
      showToast({
        message: "Solicitação de EPI enviada com sucesso!",
        type: "success",
      });
      form.reset();
      onSuccess();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Erro ao solicitar EPI";
      showToast({
        message: errorMessage,
        type: "error",
      });
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedItem(null);
    setStockAvailable(null);
    onClose();
  };

  const itemOptions: ComboboxOption[] =
    items?.data?.map((item) => ({
      value: item.id,
      label: `${item.name}${item.ppeCA ? ` - CA: ${item.ppeCA}` : ""}${item.ppeType ? ` (${item.ppeType})` : ""}`,
    })) || [];

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
              {/* Item Selection */}
              <Controller
                control={form.control}
                name="itemId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View className="gap-2">
                    <Text className="text-sm font-medium text-foreground">
                      Item <Text className="text-destructive">*</Text>
                    </Text>
                    <Combobox
                      options={itemOptions}
                      value={value}
                      onValueChange={onChange}
                      placeholder="Selecione o item de EPI"
                      disabled={isLoading || isLoadingItems}
                      searchable={true}
                      clearable={false}
                      error={error ? error.message : undefined}
                    />
                    {error && <Text className="text-sm text-destructive">{error.message}</Text>}
                  </View>
                )}
              />

              {/* Selected Item Info */}
              {selectedItem && (
                <View className="p-3 bg-muted rounded-lg gap-2">
                  <Text className="text-sm font-medium">Informações do Item</Text>
                  {selectedItem.brand && (
                    <Text className="text-xs text-muted-foreground">
                      Marca: {selectedItem.brand.name}
                    </Text>
                  )}
                  {selectedItem.ppeType && (
                    <Text className="text-xs text-muted-foreground">
                      Tipo: {selectedItem.ppeType}
                    </Text>
                  )}
                  {selectedItem.ppeCA && (
                    <Text className="text-xs text-muted-foreground">
                      CA: {selectedItem.ppeCA}
                    </Text>
                  )}
                  {stockAvailable !== null && (
                    <Text
                      className={cn(
                        "text-xs font-medium",
                        stockAvailable > 0 ? "text-success" : "text-destructive"
                      )}
                    >
                      Estoque disponível: {stockAvailable}
                    </Text>
                  )}
                </View>
              )}

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
                      onChangeText={(text) => {
                        const num = parseInt(text) || 1;
                        onChange(num);
                      }}
                      onBlur={onBlur}
                      placeholder="1"
                      keyboardType="numeric"
                      editable={!isLoading}
                      className={cn(error && "border-destructive")}
                    />
                    {error && <Text className="text-sm text-destructive">{error.message}</Text>}
                    {stockAvailable !== null && value > stockAvailable && (
                      <Text className="text-sm text-destructive">
                        Quantidade solicitada excede o estoque disponível
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
                      value={value}
                      onChange={onChange}
                      placeholder="Selecione uma data"
                      disabled={isLoading}
                      minimumDate={new Date()}
                    />
                    {error && <Text className="text-sm text-destructive">{error.message}</Text>}
                  </View>
                )}
              />

              {/* Reason (Optional) */}
              <Controller
                control={form.control}
                name="reason"
                render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
                  <View className="gap-2">
                    <Text className="text-sm font-medium text-foreground">
                      Justificativa (Opcional)
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

              {/* Notes (Optional) */}
              <Controller
                control={form.control}
                name="notes"
                render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
                  <View className="gap-2">
                    <Text className="text-sm font-medium text-foreground">
                      Observações (Opcional)
                    </Text>
                    <TextArea
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Observações adicionais"
                      editable={!isLoading}
                      numberOfLines={3}
                      className={cn(error && "border-destructive")}
                    />
                    {error && <Text className="text-sm text-destructive">{error.message}</Text>}
                  </View>
                )}
              />

              {/* Warning about PPE sizes */}
              {!userPpeSize?.data && (
                <View className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <Text className="text-sm text-yellow-600 dark:text-yellow-500">
                    Atenção: Você ainda não cadastrou seus tamanhos de EPI. Alguns itens podem
                    requerer essa informação antes da solicitação.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View className="p-4 border-t border-border gap-2">
            <Button
              onPress={form.handleSubmit(handleSubmit)}
              disabled={isLoading || isLoadingItems}
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
            <Button variant="outline" onPress={handleClose} disabled={isLoading}>
              <Text>Cancelar</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
