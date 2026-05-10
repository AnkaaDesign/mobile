import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ThemedText } from "@/components/ui";
import { Combobox } from "@/components/ui/combobox";
import { TextArea } from "@/components/ui/text-area";
import { useAuth } from "@/contexts/auth-context";
import { usePpeSize, useRequestPpeDelivery } from "@/hooks";
import { getItems } from "@/api-client";
import { ppeRequestSchema } from "@/schemas/ppe-request";
import { PPE_TYPE, ITEM_CATEGORY_TYPE, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { getItemPpeSize } from "@/utils/ppe-size-mapping";
import { getPpeSizeByType, allowsOnDemandDelivery } from "@/utils/ppe";
import { cn } from "@/lib/utils";
import { formatQuantity } from "@/utils";
import type { PpeRequestFormData } from "@/schemas/ppe-request";
import type { Item } from "@/types";
import { useTheme } from "@/lib/theme";

import { FormScreen } from "@/components/screens/form-screen";
import { useFormFlow } from "@/hooks/use-form-flow";

export default function RequestPPEScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);
  const loadedItemsRef = useRef<Map<string, Item>>(new Map());

  const ppeSizeId = typeof user?.ppeSize === "object" ? user.ppeSize?.id : user?.ppeSize;
  const { data: fetchedPpeSize, isLoading: isLoadingPpeSize } = usePpeSize(
    ppeSizeId || "",
    {
      enabled: !!ppeSizeId && typeof user?.ppeSize !== "object",
    },
  );

  const userPpeSizeData = useMemo(() => {
    if (typeof user?.ppeSize === "object" && user.ppeSize) {
      return user.ppeSize;
    }
    return fetchedPpeSize?.data ?? null;
  }, [user?.ppeSize, fetchedPpeSize?.data]);

  const form = useForm<PpeRequestFormData>({
    resolver: zodResolver(ppeRequestSchema),
    defaultValues: {
      itemId: "",
      quantity: 1,
      reason: "",
    },
  });

  const requestMutation = useRequestPpeDelivery();

  const initialOptions = useMemo(
    () => (selectedItem ? [selectedItem] : []),
    [selectedItem?.id],
  );

  const hasSizesConfigured = useMemo(() => {
    if (!userPpeSizeData) return false;
    return !!(
      userPpeSizeData.shirts ||
      userPpeSizeData.pants ||
      userPpeSizeData.boots ||
      userPpeSizeData.gloves ||
      userPpeSizeData.mask ||
      userPpeSizeData.sleeves ||
      userPpeSizeData.rainBoots ||
      userPpeSizeData.shorts
    );
  }, [userPpeSizeData]);

  const userPpeSizeDataRef = useRef(userPpeSizeData);
  useEffect(() => {
    userPpeSizeDataRef.current = userPpeSizeData;
  }, [userPpeSizeData]);

  const hasSizesConfiguredRef = useRef(hasSizesConfigured);
  useEffect(() => {
    hasSizesConfiguredRef.current = hasSizesConfigured;
  }, [hasSizesConfigured]);

  const searchPpeItems = useCallback(
    async (
      search: string,
    ): Promise<{ data: Item[]; hasMore: boolean; total?: number }> => {
      try {
        const response = await getItems({
          take: 500,
          where: {
            isActive: true,
            category: { type: ITEM_CATEGORY_TYPE.PPE },
            quantity: { gt: 0 },
          },
          include: { brand: true, category: true, measures: true },
          searchingFor: search || undefined,
          orderBy: { name: "asc" },
        });

        let items = response.data || [];
        const sizesConfigured = hasSizesConfiguredRef.current;
        const ppeSizeData = userPpeSizeDataRef.current;

        items = items.filter((item: Item) => {
          if (item.ppeDeliveryMode && !allowsOnDemandDelivery(item)) return false;
          if (!sizesConfigured || !ppeSizeData) return true;
          if (!item.ppeType) return true;
          if (item.ppeType === PPE_TYPE.OTHERS) return true;

          const userSize = getPpeSizeByType(ppeSizeData, item.ppeType);
          const itemSize = getItemPpeSize(item);
          if (!itemSize) return true;
          if (!userSize) return true;
          return itemSize === userSize;
        });

        items.forEach((item) => loadedItemsRef.current.set(item.id, item));
        return { data: items, hasMore: false };
      } catch {
        return { data: [], hasMore: false };
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedItem) {
      const stock = selectedItem.quantity ?? (selectedItem as any).currentStock;
      setStockAvailable(stock !== undefined ? stock : null);
    } else {
      setStockAvailable(null);
    }
  }, [selectedItem]);

  const getOptionValue = useCallback((item: Item) => item.id, []);
  const getOptionLabel = useCallback((item: Item) => item.name, []);

  const renderPpeOption = useCallback(
    (item: Item, isSelected: boolean) => (
      <View style={{ flex: 1 }}>
        <ThemedText style={{ fontWeight: isSelected ? "600" : "400" }}>
          {item.name}
        </ThemedText>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
          {item.ppeCA && (
            <ThemedText style={{ fontSize: 12, color: colors.mutedForeground }}>
              CA: {item.ppeCA}
            </ThemedText>
          )}
          {item.quantity !== undefined && (
            <ThemedText
              style={{
                fontSize: 12,
                color: item.quantity > 0 ? colors.mutedForeground : colors.destructive,
              }}
            >
              Estoque: {formatQuantity(item.quantity)}
            </ThemedText>
          )}
        </View>
      </View>
    ),
    [colors],
  );

  const flow = useFormFlow<PpeRequestFormData, unknown>({
    form,
    mutation: async (data) => {
      const requestData = {
        itemId: data.itemId,
        quantity: 1,
        reason: data.reason,
      };
      return requestMutation.mutateAsync(requestData);
    },
    cancelFallback: mobileRoute(routes.personal.myPpes.root),
    successRoute: () => mobileRoute(routes.personal.myPpes.root),
  });

  const queryKey = useMemo(
    () => ["ppe-items", "request", userPpeSizeData?.id ?? null],
    [userPpeSizeData?.id],
  );

  const isLoading = flow.isSubmitting || isLoadingPpeSize;

  return (
    <FormScreen<PpeRequestFormData, unknown>
      title="Solicitar EPI"
      mode="create"
      form={form}
      flow={flow}
      submitLabel="Solicitar EPI"
      submittingLabel="Enviando..."
    >
      <View style={{ gap: 16 }}>
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
                queryKey={queryKey}
                queryFn={searchPpeItems}
                initialOptions={initialOptions}
                minSearchLength={0}
                pageSize={20}
                debounceMs={300}
                value={value}
                onValueChange={(newValue) => {
                  const id = Array.isArray(newValue) ? newValue[0] : newValue;
                  onChange(id || "");
                  if (id) {
                    const item = loadedItemsRef.current.get(id);
                    if (item) setSelectedItem(item);
                  } else {
                    setSelectedItem(null);
                  }
                }}
                getOptionValue={getOptionValue}
                getOptionLabel={getOptionLabel}
                placeholder="Selecione o item de EPI"
                emptyText="Nenhum EPI encontrado"
                searchPlaceholder="Buscar EPI por nome ou código..."
                disabled={isLoading}
                searchable={true}
                clearable={false}
                error={error?.message}
                renderOption={renderPpeOption}
              />
              {error && (
                <ThemedText style={{ fontSize: 12, color: colors.destructive }}>
                  {error.message}
                </ThemedText>
              )}
            </View>
          )}
        />

        {selectedItem && (
          <View
            style={{
              padding: 12,
              backgroundColor: colors.card,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ThemedText style={{ fontWeight: "600", marginBottom: 4 }}>
              Item Selecionado
            </ThemedText>
            <ThemedText style={{ fontSize: 13 }}>{selectedItem.name}</ThemedText>
            {selectedItem.ppeCA && (
              <ThemedText
                style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}
              >
                CA: {selectedItem.ppeCA}
              </ThemedText>
            )}
            {stockAvailable !== null && (
              <ThemedText
                style={{
                  fontSize: 12,
                  color: stockAvailable > 0 ? colors.mutedForeground : colors.destructive,
                  marginTop: 4,
                }}
              >
                Estoque disponível: {stockAvailable} unidades
              </ThemedText>
            )}
          </View>
        )}

        <Controller
          control={form.control}
          name="reason"
          render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
            <View style={{ gap: 8 }}>
              <ThemedText style={{ fontSize: 14, fontWeight: "500" }}>
                Justificativa{" "}
                <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
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

        {!hasSizesConfigured && !isLoadingPpeSize && (
          <View
            style={{
              padding: 12,
              backgroundColor: "#dbeafe",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#93c5fd",
            }}
          >
            <ThemedText style={{ fontSize: 13, color: "#1e40af", marginBottom: 4 }}>
              Dica: Cadastre seus tamanhos de EPI
            </ThemedText>
            <ThemedText style={{ fontSize: 12, color: "#1e3a8a" }}>
              Cadastrar seus tamanhos ajuda a mostrar apenas os EPIs do seu tamanho.
              Acesse seu perfil ou entre em contato com o RH.
            </ThemedText>
          </View>
        )}

        {hasSizesConfigured && (
          <View
            style={{
              padding: 12,
              backgroundColor: "#dcfce7",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#86efac",
            }}
          >
            <ThemedText style={{ fontSize: 13, color: "#166534", marginBottom: 4 }}>
              Seus tamanhos de EPI estão cadastrados
            </ThemedText>
            <ThemedText style={{ fontSize: 12, color: "#15803d" }}>
              Os EPIs exibidos já estão filtrados de acordo com seus tamanhos registrados.
            </ThemedText>
          </View>
        )}
      </View>
    </FormScreen>
  );
}
