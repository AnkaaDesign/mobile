import { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { IconPackage, IconX, IconLoader, IconAlertTriangle, IconCheck } from "@tabler/icons-react-native";
import {
  ThemedText,
  Card,
  Input,
  Select,
  SelectItem,
  Button,
  SimpleFormField,
  DateTimePicker,
} from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { useItems, useUsers, useItem } from "@/hooks";

// Simple Borrow Form Schema - matches backend API structure
const borrowSimpleSchema = z.object({
  userId: z.string().uuid("Colaborador é obrigatório").min(1, "Colaborador é obrigatório"),
  itemId: z.string().uuid("Item é obrigatório").min(1, "Item é obrigatório"),
  quantity: z.number().positive("Quantidade deve ser positiva").int("Quantidade deve ser um número inteiro"),
  returnedAt: z.date().nullable().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  conditionNotes: z.string().optional(),
});

type BorrowSimpleFormData = z.infer<typeof borrowSimpleSchema>;

interface BorrowSimpleFormProps {
  onSubmit: (data: BorrowSimpleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BorrowSimpleForm({ onSubmit, onCancel, isSubmitting }: BorrowSimpleFormProps) {
  const { colors } = useTheme();
  const [itemSearch] = useState("");
  const [userSearch] = useState("");

  const form = useForm<BorrowSimpleFormData>({
    resolver: zodResolver(borrowSimpleSchema),
    defaultValues: {
      userId: "",
      itemId: "",
      quantity: 1,
      returnedAt: null,
      reason: "",
      notes: "",
      conditionNotes: "",
    },
    mode: "onChange",
  });

  // Fetch items
  const { data: items } = useItems({
    searchingFor: itemSearch,
    orderBy: { name: "asc" },
  });

  // Fetch users (employees)
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

  // Stock validation logic matching web implementation
  const stockValidation = useMemo(() => {
    if (!selectedItem || !selectedQuantity) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];

    // Calculate available stock (accounting for active borrows)
    const activeBorrowsQuantity = selectedItem.activeBorrowsQuantity || 0;
    const availableStock = selectedItem.quantity - activeBorrowsQuantity;

    // Validation 1: Check stock availability
    if (selectedQuantity > availableStock) {
      errors.push(`Estoque insuficiente. Disponível: ${availableStock}`);
    }

    // Validation 2: Check if item category is TOOL
    if (selectedItem.itemCategory?.type !== "TOOL") {
      errors.push("Apenas ferramentas podem ser emprestadas");
    }

    // Validation 3: Check if item is active
    if (!selectedItem.active) {
      errors.push("Item inativo não pode ser emprestado");
    }

    return {
      isValid: errors.length === 0,
      errors,
      availableStock,
      itemName: selectedItem.name,
      categoryType: selectedItem.itemCategory?.type,
      isActive: selectedItem.active,
    };
  }, [selectedItem, selectedQuantity]);

  const handleSubmit = async (data: BorrowSimpleFormData) => {
    // Validate stock before submission
    if (!stockValidation.isValid) {
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
            <ThemedText style={styles.title}>Novo Empréstimo</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Registrar empréstimo de item para colaborador
            </ThemedText>
          </View>

          {/* Main Form */}
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <SimpleFormField label="Colaborador" required error={form.formState.errors.userId}>
                <Controller
                  control={form.control}
                  name="userId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={value}
                      onValueChange={onChange}
                      disabled={isSubmitting}
                    >
                      <SelectItem label="Selecione um colaborador" value="" />
                      {userOptions.map((option) => (
                        <SelectItem key={option.value} label={option.label} value={option.value} />
                      ))}
                    </Select>
                  )}
                />
              </SimpleFormField>

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

              {/* Stock Validation Summary */}
              {selectedItemId && selectedItem && (
                <Card style={[
                  styles.validationCard,
                  {
                    backgroundColor: stockValidation.isValid
                      ? colors.success + "10"
                      : colors.destructive + "10",
                    borderColor: stockValidation.isValid
                      ? colors.success
                      : colors.destructive,
                  }
                ]}>
                  <View style={styles.validationContent}>
                    {isLoadingItem ? (
                      <View style={styles.validationRow}>
                        <IconLoader size={16} color={colors.mutedForeground} />
                        <ThemedText style={[styles.validationText, { color: colors.mutedForeground }]}>
                          Carregando informações do item...
                        </ThemedText>
                      </View>
                    ) : (
                      <>
                        <View style={styles.validationRow}>
                          {stockValidation.isValid ? (
                            <IconCheck size={16} color={colors.success} />
                          ) : (
                            <IconAlertTriangle size={16} color={colors.destructive} />
                          )}
                          <ThemedText style={[
                            styles.validationText,
                            {
                              color: stockValidation.isValid
                                ? colors.success
                                : colors.destructive,
                              fontWeight: "600"
                            }
                          ]}>
                            {stockValidation.itemName}
                          </ThemedText>
                        </View>

                        <View style={styles.validationDetails}>
                          <ThemedText style={[styles.validationDetailText, { color: colors.foreground }]}>
                            Disponível: {stockValidation.availableStock || 0}
                          </ThemedText>
                          <ThemedText style={[styles.validationDetailText, { color: colors.foreground }]}>
                            Categoria: {stockValidation.categoryType || "N/A"}
                          </ThemedText>
                          <ThemedText style={[styles.validationDetailText, { color: colors.foreground }]}>
                            Status: {stockValidation.isActive ? "Ativo" : "Inativo"}
                          </ThemedText>
                        </View>

                        {!stockValidation.isValid && stockValidation.errors.length > 0 && (
                          <View style={styles.validationErrors}>
                            {stockValidation.errors.map((error, index) => (
                              <ThemedText
                                key={index}
                                style={[styles.validationErrorText, { color: colors.destructive }]}
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

              <SimpleFormField label="Motivo" error={form.formState.errors.reason}>
                <Controller
                  control={form.control}
                  name="reason"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      placeholder="Motivo do empréstimo (opcional)"
                      editable={!isSubmitting}
                      error={!!form.formState.errors.reason}
                    />
                  )}
                />
              </SimpleFormField>

              <SimpleFormField label="Observações" error={form.formState.errors.notes}>
                <Controller
                  control={form.control}
                  name="notes"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      placeholder="Observações gerais (opcional)"
                      multiline
                      numberOfLines={3}
                      editable={!isSubmitting}
                      error={!!form.formState.errors.notes}
                    />
                  )}
                />
              </SimpleFormField>

              <SimpleFormField label="Condição do Item" error={form.formState.errors.conditionNotes}>
                <Controller
                  control={form.control}
                  name="conditionNotes"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      placeholder="Estado do item (opcional)"
                      multiline
                      numberOfLines={2}
                      editable={!isSubmitting}
                      error={!!form.formState.errors.conditionNotes}
                    />
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
          disabled={!form.formState.isValid || isSubmitting || !stockValidation.isValid}
          style={styles.actionButton}
        >
          {isSubmitting ? (
            <>
              <IconLoader size={20} color="white" />
              <ThemedText style={{ color: "white" }}>Salvando...</ThemedText>
            </>
          ) : (
            <>
              <IconPackage size={20} />
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
  validationCard: {
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  validationContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  validationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  validationText: {
    fontSize: 14,
  },
  validationDetails: {
    marginLeft: spacing.lg + spacing.xs,
    gap: spacing.xs,
  },
  validationDetailText: {
    fontSize: 12,
  },
  validationErrors: {
    marginLeft: spacing.lg + spacing.xs,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  validationErrorText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
