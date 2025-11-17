import { useState, useMemo } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { IconArrowDown, IconArrowUp, IconDeviceFloppy, IconX, IconLoader, IconAlertTriangle, IconCheck, IconInfoCircle } from "@tabler/icons-react-native";
import {
  ThemedText,
  Card,
  Input,
  Select,
  SelectItem,
  Button,
  SimpleFormField,
} from "@/components/ui";
import { useTheme } from "@/lib/theme";
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
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerSection}>
            <ThemedText style={styles.title}>Nova Movimentação</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Registrar entrada ou saída de item
            </ThemedText>
          </View>

          {/* Operation Type */}
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <ThemedText style={styles.sectionLabel}>Tipo de Operação *</ThemedText>

              <View style={styles.operationButtons}>
                <Button
                  variant={operation === ACTIVITY_OPERATION.INBOUND ? "default" : "outline"}
                  onPress={() => form.setValue("operation", ACTIVITY_OPERATION.INBOUND)}
                  disabled={isSubmitting}
                  style={styles.operationButton}
                >
                  <IconArrowDown size={20} color={operation === ACTIVITY_OPERATION.INBOUND ? "white" : colors.foreground} />
                  <ThemedText style={{ color: operation === ACTIVITY_OPERATION.INBOUND ? "white" : colors.foreground }}>
                    Entrada
                  </ThemedText>
                </Button>

                <Button
                  variant={operation === ACTIVITY_OPERATION.OUTBOUND ? "default" : "outline"}
                  onPress={() => form.setValue("operation", ACTIVITY_OPERATION.OUTBOUND)}
                  disabled={isSubmitting}
                  style={styles.operationButton}
                >
                  <IconArrowUp size={20} color={operation === ACTIVITY_OPERATION.OUTBOUND ? "white" : colors.foreground} />
                  <ThemedText style={{ color: operation === ACTIVITY_OPERATION.OUTBOUND ? "white" : colors.foreground }}>
                    Saída
                  </ThemedText>
                </Button>
              </View>
            </View>
          </Card>

          {/* Item and Quantity */}
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <SimpleFormField label="Item" required error={form.formState.errors.itemId}>
                <Controller
                  control={form.control}
                  name="itemId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={value}
                      onValueChange={onChange}
                      disabled={isSubmitting}
                    >
                      <SelectItem label="Selecione um item" value="" />
                      {itemOptions.map((option) => (
                        <SelectItem key={option.value} label={option.label} value={option.value} />
                      ))}
                    </Select>
                  )}
                />
              </SimpleFormField>

              <SimpleFormField label="Quantidade" required error={form.formState.errors.quantity}>
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
              </SimpleFormField>

              {/* Stock Information with Borrow Awareness */}
              {selectedItemId && selectedItem && (
                <Card style={[
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
                ]}>
                  <View style={styles.stockContent}>
                    {isLoadingItem ? (
                      <View style={styles.stockRow}>
                        <IconLoader size={16} color={colors.mutedForeground} />
                        <ThemedText style={[styles.stockText, { color: colors.mutedForeground }]}>
                          Carregando informações do item...
                        </ThemedText>
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
                          <ThemedText style={[
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
                          </ThemedText>
                        </View>

                        <View style={styles.stockDetails}>
                          <View style={styles.stockDetailRow}>
                            <ThemedText style={[styles.stockDetailLabel, { color: colors.mutedForeground }]}>
                              Estoque Total:
                            </ThemedText>
                            <ThemedText style={[styles.stockDetailValue, { color: colors.foreground }]}>
                              {stockValidation.totalStock || 0}
                            </ThemedText>
                          </View>

                          {operation === ACTIVITY_OPERATION.OUTBOUND && stockValidation.activeBorrowsQuantity > 0 && (
                            <>
                              <View style={styles.stockDetailRow}>
                                <ThemedText style={[styles.stockDetailLabel, { color: colors.mutedForeground }]}>
                                  Em Empréstimo:
                                </ThemedText>
                                <ThemedText style={[styles.stockDetailValue, { color: colors.warning }]}>
                                  {stockValidation.activeBorrowsQuantity}
                                </ThemedText>
                              </View>

                              <View style={[styles.stockDetailRow, styles.stockDetailRowHighlight]}>
                                <ThemedText style={[styles.stockDetailLabel, { color: colors.foreground, fontWeight: "600" }]}>
                                  Disponível:
                                </ThemedText>
                                <ThemedText style={[
                                  styles.stockDetailValue,
                                  {
                                    color: stockValidation.isValid ? colors.success : colors.destructive,
                                    fontWeight: "600"
                                  }
                                ]}>
                                  {stockValidation.availableStock}
                                </ThemedText>
                              </View>
                            </>
                          )}
                        </View>

                        {!stockValidation.isValid && stockValidation.errors.length > 0 && (
                          <View style={styles.stockErrors}>
                            {stockValidation.errors.map((error, index) => (
                              <ThemedText
                                key={index}
                                style={[styles.stockErrorText, { color: colors.destructive }]}
                              >
                                • {error}
                              </ThemedText>
                            ))}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </Card>
              )}
            </View>
          </Card>

          {/* Optional Fields */}
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <SimpleFormField label="Motivo (opcional)" error={form.formState.errors.reason}>
                <Controller
                  control={form.control}
                  name="reason"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={value || ""}
                      onValueChange={(val) => onChange(val || null)}
                      disabled={isSubmitting}
                    >
                      <SelectItem label="Selecione um motivo" value="" />
                      {reasonOptions.map((option) => (
                        <SelectItem key={option.value} label={option.label} value={option.value} />
                      ))}
                    </Select>
                  )}
                />
              </SimpleFormField>

              <SimpleFormField label="Responsável (opcional)" error={form.formState.errors.userId}>
                <Controller
                  control={form.control}
                  name="userId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={value || ""}
                      onValueChange={(val) => onChange(val || null)}
                      disabled={isSubmitting}
                    >
                      <SelectItem label="Selecione um usuário" value="" />
                      {userOptions.map((option) => (
                        <SelectItem key={option.value} label={option.label} value={option.value} />
                      ))}
                    </Select>
                  )}
                />
              </SimpleFormField>
            </View>
          </Card>

          {/* Spacer for fixed bottom bar */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Button
          variant="outline"
          onPress={onCancel}
          disabled={isSubmitting}
          style={styles.actionButton}
        >
          <IconX size={20} />
          <ThemedText>Cancelar</ThemedText>
        </Button>

        <Button
          variant="default"
          onPress={form.handleSubmit(handleSubmit)}
          disabled={
            !form.formState.isValid ||
            isSubmitting ||
            (operation === ACTIVITY_OPERATION.OUTBOUND && !stockValidation.isValid)
          }
          style={styles.actionButton}
        >
          {isSubmitting ? (
            <>
              <IconLoader size={20} color="white" />
              <ThemedText style={{ color: "white" }}>Salvando...</ThemedText>
            </>
          ) : (
            <>
              <IconDeviceFloppy size={20} />
              <ThemedText style={{ color: "white" }}>Registrar</ThemedText>
            </>
          )}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: spacing.lg,
  },
  headerSection: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.xs,
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
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: spacing.lg,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  stockCard: {
    borderWidth: 1,
    marginTop: spacing.md,
  },
  stockContent: {
    padding: spacing.md,
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
    marginLeft: spacing.lg + spacing.xs,
    gap: spacing.xs,
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
    marginLeft: spacing.lg + spacing.xs,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  stockErrorText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
