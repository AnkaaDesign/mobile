import React, { useCallback, useMemo, useEffect } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { FormCard } from "@/components/ui/form-section";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formSpacing, formLayout } from "@/constants/form-styles";
import { useUsers, useItem } from "@/hooks";
import { ACTIVITY_OPERATION, ACTIVITY_REASON } from "@/constants";
import { ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from "@/constants/enum-labels";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { useKeyboardAwareScroll } from "@/hooks";
import { IconCheck, IconX } from "@tabler/icons-react-native";
import type { Activity } from "@/types";

// Form schema for activity editing
const activityEditFormSchema = z.object({
  quantity: z.number().positive("Quantidade deve ser maior que zero"),
  operation: z.enum([ACTIVITY_OPERATION.INBOUND, ACTIVITY_OPERATION.OUTBOUND], {
    errorMap: () => ({ message: "Selecione uma operação válida" }),
  }),
  userId: z.string().uuid("Selecione um usuário válido").nullable().optional(),
  reason: z.enum([
    ACTIVITY_REASON.ORDER_RECEIVED,
    ACTIVITY_REASON.PRODUCTION_USAGE,
    ACTIVITY_REASON.PPE_DELIVERY,
    ACTIVITY_REASON.BORROW,
    ACTIVITY_REASON.RETURN,
    ACTIVITY_REASON.EXTERNAL_WITHDRAWAL,
    ACTIVITY_REASON.EXTERNAL_WITHDRAWAL_RETURN,
    ACTIVITY_REASON.INVENTORY_COUNT,
    ACTIVITY_REASON.MANUAL_ADJUSTMENT,
    ACTIVITY_REASON.MAINTENANCE,
    ACTIVITY_REASON.DAMAGE,
    ACTIVITY_REASON.LOSS,
    ACTIVITY_REASON.PAINT_PRODUCTION,
    ACTIVITY_REASON.OTHER,
  ] as const, {
    errorMap: () => ({ message: "Selecione um motivo válido" }),
  }).nullable().optional(),
});

type ActivityEditFormData = z.infer<typeof activityEditFormSchema>;

interface ActivityEditFormProps {
  activity: Activity;
  onSubmit: (data: ActivityEditFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const OPERATION_OPTIONS = [
  { value: ACTIVITY_OPERATION.INBOUND, label: ACTIVITY_OPERATION_LABELS[ACTIVITY_OPERATION.INBOUND] },
  { value: ACTIVITY_OPERATION.OUTBOUND, label: ACTIVITY_OPERATION_LABELS[ACTIVITY_OPERATION.OUTBOUND] },
];

const REASON_OPTIONS = [
  { value: "", label: "Sem motivo específico" },
  { value: ACTIVITY_REASON.ORDER_RECEIVED, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.ORDER_RECEIVED] },
  { value: ACTIVITY_REASON.PRODUCTION_USAGE, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.PRODUCTION_USAGE] },
  { value: ACTIVITY_REASON.PPE_DELIVERY, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.PPE_DELIVERY] },
  { value: ACTIVITY_REASON.BORROW, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.BORROW] },
  { value: ACTIVITY_REASON.RETURN, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.RETURN] },
  { value: ACTIVITY_REASON.EXTERNAL_WITHDRAWAL, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.EXTERNAL_WITHDRAWAL] },
  { value: ACTIVITY_REASON.EXTERNAL_WITHDRAWAL_RETURN, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.EXTERNAL_WITHDRAWAL_RETURN] },
  { value: ACTIVITY_REASON.INVENTORY_COUNT, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.INVENTORY_COUNT] },
  { value: ACTIVITY_REASON.MANUAL_ADJUSTMENT, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.MANUAL_ADJUSTMENT] },
  { value: ACTIVITY_REASON.MAINTENANCE, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.MAINTENANCE] },
  { value: ACTIVITY_REASON.DAMAGE, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.DAMAGE] },
  { value: ACTIVITY_REASON.LOSS, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.LOSS] },
  { value: ACTIVITY_REASON.PAINT_PRODUCTION, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.PAINT_PRODUCTION] },
  { value: ACTIVITY_REASON.OTHER, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.OTHER] },
];

export function ActivityEditForm({
  activity,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ActivityEditFormProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);

  // Keyboard visibility tracking
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowListener = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  // Keyboard-aware scrolling
  const { handlers, refs } = useKeyboardAwareScroll();

  // Memoize keyboard context value
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  // React Hook Form
  const form = useForm<ActivityEditFormData>({
    resolver: zodResolver(activityEditFormSchema),
    defaultValues: {
      quantity: activity.quantity,
      operation: activity.operation,
      userId: activity.userId || null,
      reason: activity.reason || null,
    },
    mode: "onChange",
  });

  // Fetch users for selection
  const { data: users, isLoading: isLoadingUsers } = useUsers({
    orderBy: { name: "asc" },
    limit: 100,
  });

  // Fetch item details with borrow information
  const { data: itemData } = useItem(activity.itemId, {
    include: {
      borrows: {
        where: { status: "ACTIVE" },
      },
    },
  });

  // Calculate available stock
  const activeBorrowsQuantity = useMemo(() => {
    return itemData?.data?.borrows?.reduce((total, borrow) => {
      return borrow.status === "ACTIVE" ? total + borrow.quantity : total;
    }, 0) || 0;
  }, [itemData]);

  const currentStock = itemData?.data?.quantity || 0;
  const availableStock = currentStock - activeBorrowsQuantity;

  const userOptions = useMemo(
    () =>
      users?.data?.map((user) => ({
        value: user.id,
        label: user.name,
      })) || [],
    [users],
  );

  // Display item name
  const itemDisplayName = useMemo(() => {
    if (activity.item) {
      return activity.item.uniCode
        ? `${activity.item.uniCode} - ${activity.item.name}`
        : activity.item.name;
    }
    return "Item não encontrado";
  }, [activity.item]);

  // Handle form submission
  const handleFormSubmit = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();
    await onSubmit(values);
  }, [form, onSubmit]);

  return (
    <FormProvider {...form}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
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
              <FormCard title="Informações da Movimentação" icon="IconClipboardList">
                {/* Item field - read-only */}
                <View style={styles.fieldGroup}>
                  <Label style={styles.fieldLabel}>Item</Label>
                  <Input
                    value={itemDisplayName}
                    editable={false}
                    style={[styles.input, { backgroundColor: colors.muted }]}
                  />
                  {itemData && (
                    <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
                      Estoque disponível: {availableStock}
                      {activeBorrowsQuantity > 0 && ` (${activeBorrowsQuantity} emprestado)`}
                    </ThemedText>
                  )}
                </View>

                {/* Quantity Input */}
                <Controller
                  control={form.control}
                  name="quantity"
                  render={({ field: { value, onChange }, fieldState: { error } }) => (
                    <View style={styles.fieldGroup}>
                      <Label style={styles.fieldLabel}>
                        Quantidade <ThemedText variant="destructive">*</ThemedText>
                      </Label>
                      <Input
                        value={value?.toString() || ""}
                        onChangeText={(text) => {
                          const num = parseFloat(text);
                          onChange(isNaN(num) ? 0 : num);
                        }}
                        keyboardType="decimal-pad"
                        placeholder="0,01"
                        editable={!isSubmitting}
                      />
                      {error && (
                        <ThemedText variant="destructive" style={styles.errorText}>
                          {error.message}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />

                {/* Operation Selector */}
                <Controller
                  control={form.control}
                  name="operation"
                  render={({ field: { value, onChange }, fieldState: { error } }) => (
                    <View style={styles.fieldGroup}>
                      <Label style={styles.fieldLabel}>
                        Tipo de Operação <ThemedText variant="destructive">*</ThemedText>
                      </Label>
                      <Combobox
                        value={value}
                        onValueChange={onChange}
                        options={OPERATION_OPTIONS}
                        placeholder="Selecione o tipo"
                        searchable={false}
                        clearable={false}
                        disabled={isSubmitting}
                      />
                      {error && (
                        <ThemedText variant="destructive" style={styles.errorText}>
                          {error.message}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />

                {/* Reason Selector */}
                <Controller
                  control={form.control}
                  name="reason"
                  render={({ field: { value, onChange }, fieldState: { error } }) => (
                    <View style={styles.fieldGroup}>
                      <Label style={styles.fieldLabel}>Motivo (opcional)</Label>
                      <Combobox
                        value={value || ""}
                        onValueChange={(val) => onChange(val || null)}
                        options={REASON_OPTIONS}
                        placeholder="Selecione o motivo"
                        searchPlaceholder="Buscar motivo..."
                        emptyText="Nenhum motivo encontrado"
                        disabled={isSubmitting}
                        searchable
                      />
                      {error && (
                        <ThemedText variant="destructive" style={styles.errorText}>
                          {error.message}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />

                {/* User Selector */}
                <Controller
                  control={form.control}
                  name="userId"
                  render={({ field: { value, onChange }, fieldState: { error } }) => (
                    <View style={styles.fieldGroup}>
                      <Label style={styles.fieldLabel}>Usuário Responsável (opcional)</Label>
                      <Combobox
                        value={value || ""}
                        onValueChange={(val) => onChange(val || null)}
                        options={userOptions}
                        placeholder="Selecione um usuário"
                        searchPlaceholder="Buscar usuário..."
                        emptyText="Nenhum usuário encontrado"
                        disabled={isSubmitting || isLoadingUsers}
                        loading={isLoadingUsers}
                        searchable
                      />
                      {error && (
                        <ThemedText variant="destructive" style={styles.errorText}>
                          {error.message}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />
              </FormCard>
            </ScrollView>
          </KeyboardAwareFormProvider>

          {/* Action Bar */}
          {!isKeyboardVisible && (
            <View
              style={[
                styles.actionBar,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  marginBottom: (insets.bottom || 0) + formSpacing.cardMarginBottom,
                },
              ]}
            >
              {/* Cancel Button */}
              <View style={styles.buttonWrapper}>
                <Button variant="outline" onPress={onCancel} disabled={isSubmitting}>
                  <IconX size={18} color={colors.mutedForeground} />
                  <Text style={styles.buttonText}>Cancelar</Text>
                </Button>
              </View>

              {/* Submit Button */}
              <View style={styles.buttonWrapper}>
                <Button
                  variant="default"
                  onPress={handleFormSubmit}
                  disabled={isSubmitting || !form.formState.isValid}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <IconCheck size={18} color={colors.primaryForeground} />
                  )}
                  <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                    {isSubmitting ? "Atualizando..." : "Atualizar"}
                  </Text>
                </Button>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </FormProvider>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    marginBottom: 4,
  },
  input: {
    minHeight: 44,
  },
  helpText: {
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  errorText: {
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  actionBar: {
    flexDirection: "row",
    gap: formSpacing.rowGap,
    padding: formSpacing.actionBarPadding,
    borderRadius: formLayout.cardBorderRadius,
    borderWidth: formLayout.borderWidth,
    marginHorizontal: formSpacing.containerPaddingHorizontal,
    marginTop: spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ActivityEditForm;
