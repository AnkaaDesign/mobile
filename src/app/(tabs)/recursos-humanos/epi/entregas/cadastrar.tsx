import { useCallback, useEffect, useMemo, useRef } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";

import { usePpeDeliveryMutations, useScreenReady } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { getItems, getUsers } from "@/api-client";
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_ORDER, USER_STATUS, ITEM_CATEGORY_TYPE, PPE_TYPE, routes } from "@/constants";
import { ppeDeliveryCreateSchema, type PpeDeliveryCreateFormData } from "../../../../../schemas";
import { routeToMobilePath } from "@/utils/route-mapper";
import { getItemPpeSize } from "@/utils/ppe-size-mapping";
import type { Item, User } from "@/types";

export default function CreateHRPPEDeliveryScreen() {
  useScreenReady();
  const router = useRouter();
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const { createAsync, createMutation } = usePpeDeliveryMutations();

  const form = useForm<PpeDeliveryCreateFormData>({
    resolver: zodResolver(ppeDeliveryCreateSchema),
    defaultValues: {
      itemId: "",
      userId: "",
      quantity: 1,
      status: PPE_DELIVERY_STATUS.APPROVED,
      statusOrder: PPE_DELIVERY_STATUS_ORDER[PPE_DELIVERY_STATUS.APPROVED],
    },
  });

  const isLoading = createMutation.isPending;

  // Track selected user's PPE size for item filtering
  const selectedUserId = form.watch("userId");
  const selectedUserRef = useRef<User | null>(null);
  const loadedUsersRef = useRef<Map<string, User>>(new Map());

  // Update selectedUserRef when userId changes
  useEffect(() => {
    if (selectedUserId) {
      const user = loadedUsersRef.current.get(selectedUserId);
      selectedUserRef.current = user || null;
    } else {
      selectedUserRef.current = null;
    }
  }, [selectedUserId]);

  // Async query for users with pagination
  const searchUsers = useCallback(async (search: string, page = 1) => {
    const pageSize = 50;
    try {
      const response = await getUsers({
        take: pageSize,
        skip: (page - 1) * pageSize,
        where: { status: { not: USER_STATUS.DISMISSED } },
        orderBy: { name: "asc" },
        include: { ppeSize: true },
        searchingFor: search || undefined,
      });
      const users = response.data || [];
      users.forEach((u) => loadedUsersRef.current.set(u.id, u));
      return {
        data: users,
        hasMore: response.meta?.hasNextPage || false,
      };
    } catch {
      return { data: [], hasMore: false };
    }
  }, []);

  const userQueryKey = useMemo(() => ["users", "hr-ppe-delivery-create"], []);
  const getUserValue = useCallback((u: User) => u.id, []);
  const getUserLabel = useCallback((u: User) => u.name, []);

  // Async query for PPE items + client-side size filtering
  const searchItems = useCallback(async (search: string) => {
    try {
      const response = await getItems({
        take: 500,
        where: {
          isActive: true,
          category: { type: ITEM_CATEGORY_TYPE.PPE },
        },
        include: { measures: true, brand: true },
        searchingFor: search || undefined,
        orderBy: { name: "asc" },
      });

      let items = response.data || [];

      // Client-side PPE size filtering based on selected user
      const user = selectedUserRef.current;
      if (user?.ppeSize) {
        const userPpeSize = (user as any).ppeSize;
        items = items.filter((item: Item) => {
          if (!item.ppeType) return true;
          if (item.ppeType === PPE_TYPE.OTHERS) return true;

          const itemSize = getItemPpeSize(item);
          if (!itemSize) return true;

          let userSize: string | null = null;
          if (item.ppeType === PPE_TYPE.SHIRT || item.ppeType === PPE_TYPE.SLEEVES) {
            userSize = userPpeSize?.shirts || userPpeSize?.sleeves || null;
          } else if (item.ppeType === PPE_TYPE.PANTS) {
            userSize = userPpeSize?.pants || null;
          } else if (item.ppeType === PPE_TYPE.BOOTS) {
            userSize = userPpeSize?.boots || null;
          } else if (item.ppeType === PPE_TYPE.GLOVES) {
            userSize = userPpeSize?.gloves || null;
          } else if (item.ppeType === PPE_TYPE.MASK) {
            userSize = userPpeSize?.mask || null;
          } else if (item.ppeType === PPE_TYPE.RAIN_BOOTS) {
            userSize = userPpeSize?.rainBoots || null;
          }

          if (!userSize) return true;
          return itemSize === userSize;
        });
      }

      return {
        data: items,
        hasMore: false,
      };
    } catch {
      return { data: [], hasMore: false };
    }
  }, []);

  // Re-query items when selected user changes (for size filtering)
  const itemQueryKey = useMemo(
    () => ["ppe-items", "hr-delivery-create", selectedUserId || "none"],
    [selectedUserId]
  );

  const getItemValue = useCallback((item: Item) => item.id, []);
  const getItemLabel = useCallback((item: Item) => {
    const itemSize = getItemPpeSize(item);
    const displaySize = itemSize
      ? itemSize.startsWith("SIZE_") ? itemSize.replace("SIZE_", "") : itemSize
      : null;
    const brandName = (item as any).brand?.name || null;
    return [item.name, brandName, displaySize].filter(Boolean).join(" - ");
  }, []);

  const handleSubmit = async (data: PpeDeliveryCreateFormData) => {
    try {
      const result = await createAsync({
        ...data,
        status: PPE_DELIVERY_STATUS.APPROVED,
        statusOrder: PPE_DELIVERY_STATUS_ORDER[PPE_DELIVERY_STATUS.APPROVED],
        reviewedBy: currentUser?.id || null,
      });
      const newId = (result as any)?.data?.id || (result as any)?.id;
      if (newId) {
        router.replace(routeToMobilePath(routes.humanResources.ppe.deliveries.details(newId)) as any);
      } else {
        router.back();
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao criar a entrega de EPI");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormCard title="Informações Básicas" icon="IconShield">
            {/* User */}
            <FormFieldGroup
              label="Colaborador"
              required
              error={form.formState.errors.userId?.message}
            >
              <Controller
                control={form.control}
                name="userId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox<User>
                    async
                    queryKey={userQueryKey}
                    queryFn={searchUsers}
                    minSearchLength={0}
                    debounceMs={300}
                    value={value || undefined}
                    onValueChange={(newValue) => {
                      const id = Array.isArray(newValue) ? newValue[0] : newValue;
                      onChange(id || "");
                      if (id) {
                        selectedUserRef.current = loadedUsersRef.current.get(id) || null;
                      } else {
                        selectedUserRef.current = null;
                      }
                    }}
                    getOptionValue={getUserValue}
                    getOptionLabel={getUserLabel}
                    placeholder="Selecione o colaborador"
                    searchPlaceholder="Buscar colaborador..."
                    emptyText="Nenhum colaborador encontrado"
                    disabled={isLoading}
                    searchable
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            {/* Item */}
            <FormFieldGroup
              label="Item EPI"
              required
              error={form.formState.errors.itemId?.message}
            >
              <Controller
                control={form.control}
                name="itemId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox<Item>
                    async
                    queryKey={itemQueryKey}
                    queryFn={searchItems}
                    minSearchLength={0}
                    debounceMs={300}
                    value={value || undefined}
                    onValueChange={(newValue) => {
                      const id = Array.isArray(newValue) ? newValue[0] : newValue;
                      onChange(id || "");
                    }}
                    getOptionValue={getItemValue}
                    getOptionLabel={getItemLabel}
                    placeholder="Selecione o item"
                    searchPlaceholder="Buscar EPI..."
                    emptyText="Nenhum EPI encontrado"
                    disabled={isLoading}
                    searchable
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            {/* Quantity */}
            <FormFieldGroup
              label="Quantidade"
              required
              error={form.formState.errors.quantity?.message}
            >
              <Controller
                control={form.control}
                name="quantity"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={String(value || 1)}
                    onChangeText={(text: string | number | null) => {
                      if (!text) {
                        onChange(1);
                        return;
                      }
                      const numValue = parseInt(String(text));
                      onChange(isNaN(numValue) ? 1 : numValue);
                    }}
                    onBlur={onBlur}
                    placeholder="1"
                    editable={!isLoading}
                    error={!!form.formState.errors.quantity}
                    keyboardType="number-pad"
                  />
                )}
              />
            </FormFieldGroup>
          </FormCard>

          <View style={styles.spacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      <FormActionBar
        onSave={form.handleSubmit(handleSubmit)}
        onCancel={handleCancel}
        isLoading={isLoading}
        isSaveDisabled={!form.formState.isDirty || isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: formSpacing.screenPadding,
    paddingBottom: formSpacing.screenPaddingBottom,
  },
  spacing: {
    height: spacing.xl,
  },
});
