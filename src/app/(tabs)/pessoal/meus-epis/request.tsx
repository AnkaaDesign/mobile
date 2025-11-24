import { useEffect, useState, useCallback } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { TextArea } from "@/components/ui/text-area";
import { showToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { useItems, usePpeSize, useRequestPpeDelivery } from '@/hooks';
import { ppeRequestSchema } from '@/schemas/ppe-request';
import { PPE_TYPE } from '@/constants';
import { cn } from "@/lib/utils";
import type { PpeRequestFormData } from '@/schemas/ppe-request';
import { useTheme } from "@/lib/theme";

export default function RequestPPEScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    ppeType: string | null;
    ppeCA?: string;
    brand?: { name: string };
    currentStock?: number;
  } | null>(null);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);

  // Get user's PPE size
  const ppeSizeId = user?.ppeSize ? String(user.ppeSize) : "";
  const { data: userPpeSize } = usePpeSize(ppeSizeId, {
    enabled: !!user?.ppeSize,
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
      if (item) {
        setSelectedItem({
          id: item.id,
          name: item.name,
          ppeType: item.ppeType,
          ppeCA: item.ppeCA ?? undefined,
          brand: item.brand,
          currentStock: ((item as any).currentStock),
        });

        // Get stock availability
        if (((item as any).currentStock) !== undefined) {
          setStockAvailable(((item as any).currentStock));
        } else {
          setStockAvailable(null);
        }
      } else {
        setSelectedItem(null);
        setStockAvailable(null);
      }
    } else {
      setSelectedItem(null);
      setStockAvailable(null);
    }
  }, [watchedItemId, items?.data]);

  // Validate PPE size compatibility
  const validateSizeCompatibility = (itemId: string): { isValid: boolean; message?: string } => {
    const item = items?.data?.find((i) => i.id === itemId);
    if (!item) {
      return { isValid: false, message: "Item não encontrado" };
    }

    // Check if user has the required size registered
    const ppeType = item.ppeType;

    // If item doesn't have a specific type that requires sizing, allow request
    if (!ppeType) {
      return { isValid: true }; // No specific type, allow request
    }

    // Check if this PPE type actually requires size registration
    const typesThatRequireSizes = [
      PPE_TYPE.SHIRT,
      "UNIFORM" as any,
      PPE_TYPE.PANTS,
      PPE_TYPE.BOOTS,
      PPE_TYPE.GLOVES,
      PPE_TYPE.MASK,
      PPE_TYPE.SLEEVES,
      PPE_TYPE.RAIN_BOOTS,
    ];

    // If this type doesn't require sizes, allow request
    if (!typesThatRequireSizes.includes(ppeType as any)) {
      return { isValid: true };
    }

    // Now check if user has PPE size record
    if (!userPpeSize?.data) {
      return {
        isValid: false,
        message: "Você precisa cadastrar seus tamanhos de EPI antes de solicitar este item",
      };
    }

    const userSize = userPpeSize.data;

    // Validate based on PPE type
    switch (ppeType) {
      case PPE_TYPE.SHIRT:
      case "UNIFORM" as any:
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

  const handleSubmit = useCallback(async (data: PpeRequestFormData) => {
    console.log('=== [PPE Request Screen] HANDLE SUBMIT CALLED ===');
    console.log('[PPE Request Screen] Form data:', data);
    console.log('[PPE Request Screen] Selected item:', selectedItem);
    console.log('[PPE Request Screen] Stock available:', stockAvailable);

    console.log('[PPE Request Screen] Preparing request data (no size validation required)');
    const requestData = {
      itemId: data.itemId,
      quantity: 1,
      reason: data.reason,
    };
    console.log('[PPE Request Screen] Request data:', requestData);

    try {
      console.log('[PPE Request Screen] Calling mutation...');
      const result = await requestMutation.mutateAsync(requestData);
      console.log('[PPE Request Screen] Request successful:', result);

      showToast({
        message: "Solicitação de EPI enviada com sucesso!",
        type: "success",
      });
      form.reset();
      router.back();
    } catch (error: any) {
      console.error('[PPE Request Screen] Request failed:', error);
      console.error('[PPE Request Screen] Error details:', {
        message: error?.message,
        response: error?.response,
        data: error?.response?.data,
      });

      const errorMessage = error?.response?.data?.message || "Erro ao solicitar EPI";
      showToast({
        message: errorMessage,
        type: "error",
      });
    }
  }, [stockAvailable, requestMutation, form, selectedItem]);

  const itemOptions: ComboboxOption[] =
    items?.data?.map((item) => ({
      value: item.id,
      label: `${item.name}${item.ppeSize ? ` • ${item.ppeSize}` : ""}${item.ppeCA ? ` - CA: ${item.ppeCA}` : ""}`,
    })) || [];

  const isLoading = requestMutation.isPending;

  // Debug logs for component state
  console.log('[PPE Request Screen] Component render');
  console.log('[PPE Request Screen] isLoading:', isLoading);
  console.log('[PPE Request Screen] isLoadingItems:', isLoadingItems);
  console.log('[PPE Request Screen] Button disabled:', isLoading || isLoadingItems);
  console.log('[PPE Request Screen] Form values:', form.getValues());

  return (
    <ThemedView style={{ flex: 1, backgroundColor: colors.background, paddingBottom: insets.bottom }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ gap: 16 }}>
          {/* Item Selection */}
          <Controller
            control={form.control}
            name="itemId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={{ gap: 8 }}>
                <ThemedText style={{ fontSize: 14, fontWeight: "500" }}>
                  Item <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
                </ThemedText>
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
                {error && <ThemedText style={{ fontSize: 12, color: colors.destructive }}>{error.message}</ThemedText>}
              </View>
            )}
          />

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
                {error && <ThemedText style={{ fontSize: 12, color: colors.destructive }}>{error.message}</ThemedText>}
              </View>
            )}
          />

          {/* Info about PPE sizes */}
          {!userPpeSize?.data && (
            <View style={{ padding: 12, backgroundColor: "#dbeafe", borderRadius: 8, borderWidth: 1, borderColor: "#93c5fd" }}>
              <ThemedText style={{ fontSize: 13, color: "#1e40af", marginBottom: 4 }}>
                💡 Dica: Cadastre seus tamanhos de EPI
              </ThemedText>
              <ThemedText style={{ fontSize: 12, color: "#1e3a8a" }}>
                Cadastrar seus tamanhos ajuda a filtrar e sugerir os EPIs corretos para você. Acesse seu perfil ou entre em contato com o RH.
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={{ padding: 16, gap: 12, borderTopWidth: 1, borderColor: colors.border }}>
        <Button
          onPress={() => {
            console.log('=== [PPE Request Screen] BUTTON PRESS EVENT FIRED ===');
            console.log('[PPE Request Screen] Button clicked');
            console.log('[PPE Request Screen] Is loading:', isLoading);
            console.log('[PPE Request Screen] Is loading items:', isLoadingItems);
            console.log('[PPE Request Screen] Button disabled state:', isLoading || isLoadingItems);
            console.log('[PPE Request Screen] Form values:', form.getValues());
            console.log('[PPE Request Screen] Form errors:', form.formState.errors);

            try {
              console.log('[PPE Request Screen] Calling form.handleSubmit...');
              form.handleSubmit(handleSubmit)();
              console.log('[PPE Request Screen] form.handleSubmit called successfully');
            } catch (error) {
              console.error('[PPE Request Screen] Error calling form.handleSubmit:', error);
            }
          }}
          disabled={isLoading || isLoadingItems}
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
          onPress={() => {
            console.log('[PPE Request Screen] Cancel button pressed');
            router.back();
          }}
          disabled={isLoading}
        >
          <ThemedText>Cancelar</ThemedText>
        </Button>
      </View>
    </ThemedView>
  );
}
