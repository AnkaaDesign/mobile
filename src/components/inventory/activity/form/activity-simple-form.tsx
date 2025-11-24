import { useState, useMemo } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconArrowDown, IconArrowUp, IconLoader, IconAlertTriangle, IconCheck, IconInfoCircle } from "@tabler/icons-react-native";

import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { useItems, useUsers, useItem } from "@/hooks";
import { ACTIVITY_OPERATION, ACTIVITY_REASON, ACTIVITY_REASON_LABELS } from "@/constants";

// Simple Activity Form Schema
const activitySimpleSchema = z.object({
  operation: z.enum([ACTIVITY_OPERATION.INBOUND, ACTIVITY_OPERATION.OUTBOUND]),
  itemId: z.string().uuid("Item é obrigatório").min(1, "Item é obrigatório"),
  quantity: z.number().positive("Quantidade deve ser positiva").int("Quantidade deve ser um número inteiro"),
  userId: z.string().uuid().nullable().optional(),
  reason: z.string().nullable().optional(),
});

type ActivitySimpleFormData = z.infer<typeof activitySimpleSchema>;

interface ActivitySimpleFormProps {
  onSubmit: (data: ActivitySimpleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ActivitySimpleForm({ onSubmit, onCancel, isSubmitting }: ActivitySimpleFormProps) {
  const { colors } = useTheme();
  const [itemSearch] = useState("");
  const [userSearch] = useState("");

  const form = useForm<ActivitySimpleFormData>({
    resolver: zodResolver(activitySimpleSchema),
    defaultValues: {
      operation: ACTIVITY_OPERATION.INBOUND,
      itemId: "",
      quantity: 1,
      userId: null,
      reason: null,
    },
    mode: "onChange",
  });

  // Fetch items
  const { data: items } = useItems({
    searchingFor: itemSearch,
    orderBy: { name: "asc" },
  });

  // Fetch users
  const { data: users } = useUsers({
    searchingFor: userSearch,
    orderBy: { username: "asc" },
  });

  const itemOptions = items?.data?.map((item) => ({
    value: item.id,
    label: item.name,
  })) || [];

  const userOptions = users?.data?.map((user) => ({
    value: user.id,
    label: user.name,
  })) || [];

  const reasonOptions = Object.values(ACTIVITY_REASON).map((reason) => ({
    value: reason,
    label: ACTIVITY_REASON_LABELS[reason],
  }));

  const operation = form.watch("operation");

  // Watch selected item and quantity for stock validation
  const selectedItemId = useWatch({
    control: form.control,
    name: "itemId",
  });

  const selectedQuantity = useWatch({
    control: form.control,
    name: "quantity",
  });

  // Fetch selected item details for validation
  const { data: selectedItem, isLoading: isLoadingItem } = useItem(selectedItemId, {
    enabled: !!selectedItemId,
  });

  // Stock validation logic with borrow awareness
  const stockValidation = useMemo(() => {
    if (!selectedItem || !selectedQuantity) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];

    // Calculate available stock (accounting for active borrows)
    const activeBorrowsQuantity = selectedItem.activeBorrowsQuantity || 0;
    const availableStock = selectedItem.quantity - activeBorrowsQuantity;
    const totalStock = selectedItem.quantity;

    // Only validate stock for OUTBOUND operations
    if (operation === ACTIVITY_OPERATION.OUTBOUND) {
      if (selectedQuantity > availableStock) {
        errors.push(`Estoque insuficiente. Disponível: ${availableStock} (${activeBorrowsQuantity} em empréstimo)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      availableStock,
      totalStock,
      activeBorrowsQuantity,
      itemName: selectedItem.name,
      showWarning: operation === ACTIVITY_OPERATION.OUTBOUND && activeBorrowsQuantity > 0,
    };
  }, [selectedItem, selectedQuantity, operation]);

  const handleSubmit = async (data: ActivitySimpleFormData) => {
    // Validate stock for OUTBOUND operations before submission
    if (operation === ACTIVITY_OPERATION.OUTBOUND && !stockValidation.isValid) {
      Alert.alert(
        "Validação falhou",
        stockValidation.errors.join("\n"),
        [{ text: "OK" }]
      );
      return;
    }

    await onSubmit(data);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Operation Type */}
        <FormCard title="Tipo de Operação" subtitle="Registrar entrada ou saída de item">
          <View style={styles.operationButtons}>
            <Button
              variant={operation === ACTIVITY_OPERATION.INBOUND ? "default" : "outline"}
              onPress={() => form.setValue("operation", ACTIVITY_OPERATION.INBOUND)}
              disabled={isSubmitting}
              style={styles.operationButton}
            >
              <IconArrowDown size={20} color={operation === ACTIVITY_OPERATION.INBOUND ? "white" : colors.foreground} />
              <Text style={{ color: operation === ACTIVITY_OPERATION.INBOUND ? "white" : colors.foreground }}>
                Entrada
              </Text>
            </Button>

            <Button
              variant={operation === ACTIVITY_OPERATION.OUTBOUND ? "default" : "outline"}
              onPress={() => form.setValue("operation", ACTIVITY_OPERATION.OUTBOUND)}
              disabled={isSubmitting}
              style={styles.operationButton}
            >
              <IconArrowUp size={20} color={operation === ACTIVITY_OPERATION.OUTBOUND ? "white" : colors.foreground} />
              <Text style={{ color: operation === ACTIVITY_OPERATION.OUTBOUND ? "white" : colors.foreground }}>
                Saída
              </Text>
            </Button>
          </View>
        </FormCard>

        {/* Item and Quantity */}
        <FormCard title="Informações do Item">
          <FormFieldGroup
            label="Item"
            required
            error={form.formState.errors.itemId?.message}
          >
            <Controller
              control={form.control}
              name="itemId"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  value={value}
                  onValueChange={onChange}
                  options={itemOptions}
                  placeholder="Selecione um item"
                  searchPlaceholder="Buscar item..."
                  disabled={isSubmitting}
                  searchable
                  clearable={false}
                  error={error?.message}
                />
              )}
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
                  value={value?.toString() || ""}
                  onChangeText={(text) => {
                    const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                    onChange(isNaN(num) ? 1 : num);
                  }}
                  placeholder="1"
                  keyboardType="numeric"
                  editable={!isSubmitting}
                  error={!!form.formState.errors.quantity}
                />
              )}
            />
          </FormFieldGroup>

          {/* Stock Information with Borrow Awareness */}
          {selectedItemId && selectedItem && (
            <View
              style={[
                styles.stockCard,
                {
                  backgroundColor: !stockValidation.isValid
                    ? colors.destructive + "10"
                    : stockValidation.showWarning
                    ? colors.warning + "10"
                    : colors.muted,
                  borderColor: !stockValidation.isValid
                    ? colors.destructive
                    : stockValidation.showWarning
                    ? colors.warning
                    : colors.border,
                }
              ]}
            >
              <View style={styles.stockContent}>
                {isLoadingItem ? (
                  <View style={styles.stockRow}>
                    <IconLoader size={16} color={colors.mutedForeground} />
                    <Text style={[styles.stockText, { color: colors.mutedForeground }]}>
                      Carregando informações do item...
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.stockRow}>
                      {!stockValidation.isValid ? (
                        <IconAlertTriangle size={16} color={colors.destructive} />
                      ) : stockValidation.showWarning ? (
                        <IconInfoCircle size={16} color={colors.warning} />
                      ) : (
                        <IconCheck size={16} color={colors.success} />
                      )}
                      <Text style={[
                        styles.stockText,
                        {
                          color: !stockValidation.isValid
                            ? colors.destructive
                            : stockValidation.showWarning
                            ? colors.warning
                            : colors.foreground,
                          fontWeight: "600"
                        }
                      ]}>
                        {stockValidation.itemName}
                      </Text>
                    </View>

                    <View style={styles.stockDetails}>
                      <View style={styles.stockDetailRow}>
                        <Text style={[styles.stockDetailLabel, { color: colors.mutedForeground }]}>
                          Estoque Total:
                        </Text>
                        <Text style={[styles.stockDetailValue, { color: colors.foreground }]}>
                          {stockValidation.totalStock || 0}
                        </Text>
                      </View>

                      {operation === ACTIVITY_OPERATION.OUTBOUND && stockValidation.activeBorrowsQuantity > 0 && (
                        <>
                          <View style={styles.stockDetailRow}>
                            <Text style={[styles.stockDetailLabel, { color: colors.mutedForeground }]}>
                              Em Empréstimo:
                            </Text>
                            <Text style={[styles.stockDetailValue, { color: colors.warning }]}>
                              {stockValidation.activeBorrowsQuantity}
                            </Text>
                          </View>

                          <View style={[styles.stockDetailRow, styles.stockDetailRowHighlight]}>
                            <Text style={[styles.stockDetailLabel, { color: colors.foreground, fontWeight: "600" }]}>
                              Disponível:
                            </Text>
                            <Text style={[
                              styles.stockDetailValue,
                              {
                                color: stockValidation.isValid ? colors.success : colors.destructive,
                                fontWeight: "600"
                              }
                            ]}>
                              {stockValidation.availableStock}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>

                    {!stockValidation.isValid && stockValidation.errors.length > 0 && (
                      <View style={styles.stockErrors}>
                        {stockValidation.errors.map((error, index) => (
                          <Text
                            key={index}
                            style={[styles.stockErrorText, { color: colors.destructive }]}
                          >
                            • {error}
                          </Text>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          )}
        </FormCard>

        {/* Optional Fields */}
        <FormCard title="Informações Adicionais (Opcional)">
          <FormFieldGroup
            label="Motivo"
            error={form.formState.errors.reason?.message}
          >
            <Controller
              control={form.control}
              name="reason"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  value={value || ""}
                  onValueChange={(val) => onChange(val || null)}
                  options={reasonOptions}
                  placeholder="Selecione um motivo"
                  searchPlaceholder="Buscar motivo..."
                  disabled={isSubmitting}
                  searchable
                  clearable
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup
            label="Responsável"
            error={form.formState.errors.userId?.message}
          >
            <Controller
              control={form.control}
              name="userId"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  value={value || ""}
                  onValueChange={(val) => onChange(val || null)}
                  options={userOptions}
                  placeholder="Selecione um usuário"
                  searchPlaceholder="Buscar usuário..."
                  disabled={isSubmitting}
                  searchable
                  clearable
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>
        </FormCard>
      </ScrollView>

      {/* Action Bar */}
      <SimpleFormActionBar
        onCancel={onCancel}
        onSubmit={form.handleSubmit(handleSubmit)}
        isSubmitting={isSubmitting}
        canSubmit={
          form.formState.isValid &&
          !(operation === ACTIVITY_OPERATION.OUTBOUND && !stockValidation.isValid)
        }
        submitLabel="Registrar"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  operationButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  operationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  stockCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  stockContent: {
    gap: spacing.sm,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stockText: {
    fontSize: 14,
  },
  stockDetails: {
    gap: spacing.xs,
    paddingLeft: spacing.sm,
  },
  stockDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockDetailRowHighlight: {
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    marginTop: spacing.xs,
  },
  stockDetailLabel: {
    fontSize: 12,
  },
  stockDetailValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  stockErrors: {
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingLeft: spacing.sm,
  },
  stockErrorText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
