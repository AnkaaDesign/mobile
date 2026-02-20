import { useEffect, useState, useMemo } from "react";
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";

import { usePpeDeliveryMutations, useUsers, useItems, useKeyboardAwareScroll } from "@/hooks";
import { ppeDeliveryCreateSchema } from '../../../schemas';
import type { PpeDeliveryCreateFormData } from '../../../schemas';
import type { User, Item } from '../../../types';
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS, USER_STATUS, PPE_TYPE } from "@/constants";
import { getItemPpeSize } from "@/utils/ppe-size-mapping";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

interface PpeDeliveryFormProps {
  preselectedUser?: User;
  preselectedItem?: Item;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PpeDeliveryForm({ preselectedUser, preselectedItem, onSuccess, onCancel }: PpeDeliveryFormProps) {
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
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
    include: { measures: true, brand: true },
  });

  const form = useForm<PpeDeliveryCreateFormData>({
    resolver: zodResolver(ppeDeliveryCreateSchema),
    defaultValues: {
      userId: preselectedUser?.id || "",
      itemId: preselectedItem?.id || "",
      quantity: 1,
      reason: null,
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

  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          ref={refs.scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
          <FormCard title="Registrar Entrega de EPI" icon="IconShield">
          <FormFieldGroup
            label="Funcionário"
            required
            error={form.formState.errors.userId?.message}
          >
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
                  <Combobox
                    options={userOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione o funcionário"
                    disabled={isLoading || !!preselectedUser}
                    searchable={true}
                    clearable={false}
                    error={error?.message}
                  />
                );
              }}
            />
          </FormFieldGroup>

          <FormFieldGroup
            label="EPI"
            required
            error={form.formState.errors.itemId?.message}
          >
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
                    const userPpeSize = (selectedUser as any).ppeSize;
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

                    // If user has no size configured for this type, include all items
                    if (!userSize) return true;

                    // Match item size with user size
                    return itemSize === userSize;
                  });
                }, [items?.data, selectedUser]);

                const itemOptions: ComboboxOption[] =
                  filteredItems.map((item) => {
                    const itemSize = getItemPpeSize(item);
                    const displaySize = itemSize
                      ? (itemSize.startsWith("SIZE_") ? itemSize.replace("SIZE_", "") : itemSize)
                      : null;
                    const brandName = (item as any).brand?.name || null;
                    const labelParts = [item.name, brandName, displaySize].filter(Boolean);
                    return {
                      value: item.id,
                      label: labelParts.join(" - "),
                    };
                  });

                return (
                  <Combobox
                    options={itemOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione o EPI"
                    disabled={isLoading || !!preselectedItem}
                    searchable={true}
                    clearable={false}
                    error={error?.message}
                  />
                );
              }}
            />
          </FormFieldGroup>

          <FormFieldGroup
            label="Quantidade"
            required
            error={form.formState.errors.quantity?.message}
          >
            <Controller
              control={form.control}
              name="quantity"
              render={({ field: { onChange, value } }) => (
                <Input
                  type="integer"
                  value={value ?? undefined}
                  onChange={onChange}
                  placeholder="1"
                  min={1}
                  editable={!isLoading}
                  error={!!form.formState.errors.quantity}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup
            label="Data de Entrega"
            required
            error={form.formState.errors.actualDeliveryDate?.message}
          >
            <Controller
              control={form.control}
              name="actualDeliveryDate"
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  value={value ?? undefined}
                  onChange={onChange}
                  placeholder="Selecione a data"
                  disabled={isLoading}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup
            label="Status"
            required
            error={form.formState.errors.status?.message}
          >
            <Controller
              control={form.control}
              name="status"
              render={({ field: { onChange, value }, fieldState: { error } }) => {
                const statusOptions: ComboboxOption[] = Object.entries(PPE_DELIVERY_STATUS_LABELS).map(([key, label]) => ({
                  value: key,
                  label: label,
                }));

                return (
                  <Combobox
                    options={statusOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione o status"
                    disabled={isLoading}
                    searchable={false}
                    clearable={false}
                    error={error?.message}
                  />
                );
              }}
            />
          </FormFieldGroup>

          <FormFieldGroup
            label="Justificativa"
            error={form.formState.errors.reason?.message}
          >
            <Controller
              control={form.control}
              name="reason"
              render={({ field: { onChange, onBlur, value } }) => (
                <Textarea
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Motivo da solicitação ou entrega"
                  numberOfLines={3}
                  editable={!isLoading}
                />
              )}
            />
          </FormFieldGroup>
          </FormCard>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <FormActionBar
          onCancel={onCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isLoading}
          canSubmit={form.formState.isValid}
          submitLabel="Registrar Entrega"
        />
      </KeyboardAvoidingView>
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
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingTop: formSpacing.containerPaddingVertical,
    paddingBottom: 0, // No spacing - action bar has its own margin
  },
  fieldGroup: {
    gap: spacing.lg,
  },
});
