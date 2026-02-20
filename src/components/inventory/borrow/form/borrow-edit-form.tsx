import { useState, useMemo } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconX, IconLoader, IconAlertTriangle, IconCheck } from "@tabler/icons-react-native";
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
import { useItem } from "@/hooks";
import { useActiveUsersMinimal, useItemsMinimal } from "@/hooks/use-form-data";
import { BORROW_STATUS } from "@/constants";
import type { Borrow } from "@/types";

// Borrow Edit Form Schema - matches backend API structure (Prisma schema)
const borrowEditSchema = z.object({
  userId: z.string().uuid("Colaborador é obrigatório").min(1, "Colaborador é obrigatório"),
  itemId: z.string().uuid("Item é obrigatório").min(1, "Item é obrigatório"),
  quantity: z.number().positive("Quantidade deve ser positiva").int("Quantidade deve ser um número inteiro"),
  returnedAt: z.date().nullable().optional(),
  status: z.enum([BORROW_STATUS.ACTIVE, BORROW_STATUS.RETURNED, BORROW_STATUS.LOST]).optional(),
});

type BorrowEditFormData = z.infer<typeof borrowEditSchema>;

interface BorrowEditFormProps {
  borrow: Borrow & {
    item?: {
      id: string;
      name: string;
      uniCode?: string;
      quantity: number;
      measureUnit?: string;
      isActive: boolean;
      itemCategory?: { name: string; type: string }
    };
    user?: {
      id: string;
      name: string;
      email?: string;
      status: string
    };
  };
  onSubmit: (data: BorrowEditFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BorrowEditForm({ borrow, onSubmit, onCancel, isSubmitting }: BorrowEditFormProps) {
  const { colors } = useTheme();
  const [itemSearch] = useState("");
  const [userSearch] = useState("");

  const isReturned = borrow.status === BORROW_STATUS.RETURNED || borrow.returnedAt !== null;
  const isLost = borrow.status === BORROW_STATUS.LOST;

  const form = useForm<BorrowEditFormData>({
    resolver: zodResolver(borrowEditSchema),
    defaultValues: {
      userId: borrow.userId || borrow.user?.id || "",
      itemId: borrow.itemId || borrow.item?.id || "",
      quantity: borrow.quantity || 1,
      returnedAt: borrow.returnedAt ? new Date(borrow.returnedAt) : null,
      status: borrow.status as typeof BORROW_STATUS.ACTIVE | typeof BORROW_STATUS.RETURNED | typeof BORROW_STATUS.LOST | undefined,
    },
    mode: "onChange",
  });

  // Fetch items - using minimal data for 90% reduction
  const { data: items } = useItemsMinimal({
    where: itemSearch ? { name: { contains: itemSearch, mode: 'insensitive' } } : undefined,
    orderBy: { name: "asc" },
    limit: 200,
  });

  // Fetch active users - using minimal data for 95% reduction
  const { data: users } = useActiveUsersMinimal({
    where: userSearch ? { name: { contains: userSearch, mode: 'insensitive' } } : undefined,
    orderBy: { name: "asc" },
    limit: 200,
  });

  const itemOptions = items?.map((item) => ({
    value: item.id,
    label: item.name,
  })) || [];

  const userOptions = users?.map((user) => ({
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

  // Fetch selected item details for validation - optimized select
  const { data: selectedItemResponse, isLoading: isLoadingItem } = useItem(selectedItemId, {
    enabled: !!selectedItemId,
    select: {
      id: true,
      name: true,
      quantity: true,
      isActive: true,
      category: {
        select: {
          id: true,
          type: true,
        },
      },
      borrows: {
        select: {
          id: true,
          quantity: true,
          status: true,
        },
        where: {
          status: BORROW_STATUS.ACTIVE,
        },
      },
    },
  });

  const selectedItem = selectedItemResponse as any;

  // Stock validation logic matching web implementation
  const stockValidation = useMemo(() => {
    if (!selectedItem || !selectedQuantity) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];

    // Calculate available stock (accounting for active borrows and current borrow quantity)
    const activeBorrowsQuantity = selectedItem.borrows?.filter((b: any) => b.status === BORROW_STATUS.ACTIVE).reduce((sum: number, b: any) => sum + b.quantity, 0) || 0;
    const availableStock = selectedItem.quantity - activeBorrowsQuantity + borrow.quantity;

    // Validation 1: Check stock availability
    if (selectedQuantity > availableStock) {
      errors.push(`Estoque insuficiente. Disponível: ${availableStock}`);
    }

    // Validation 2: Check if item category is TOOL
    if (selectedItem.category?.type !== "TOOL") {
      errors.push("Apenas ferramentas podem ser emprestadas");
    }

    // Validation 3: Check if item is active
    if (!selectedItem.isActive && !isReturned) {
      errors.push("Item inativo não pode ser emprestado");
    }

    return {
      isValid: errors.length === 0,
      errors,
      availableStock,
      itemName: selectedItem.name,
      categoryType: selectedItem.category?.type,
      isActive: selectedItem.isActive,
    };
  }, [selectedItem, selectedQuantity, borrow.quantity, isReturned]);

  // Return date validation
  const returnDateValidation = useMemo(() => {
    const returnedAt = form.watch("returnedAt");
    if (!returnedAt) return { isValid: true, errors: [] };

    const errors: string[] = [];
    const returnDate = new Date(returnedAt);
    const borrowDate = new Date(borrow.createdAt);
    const today = new Date();

    // Validate return date is not in the future
    if (returnDate > today) {
      errors.push("Data de devolução não pode ser no futuro");
    }

    // Validate return date is not before borrow date
    if (returnDate < borrowDate) {
      errors.push("Data de devolução não pode ser anterior à data do empréstimo");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [form.watch("returnedAt"), borrow.createdAt]);

  const handleSubmit = async (data: BorrowEditFormData) => {
    // Validate stock before submission
    if (!stockValidation.isValid) {
      Alert.alert(
        "Validação falhou",
        stockValidation.errors.join("\n"),
        [{ text: "OK" }]
      );
      return;
    }

    // Validate return date
    if (!returnDateValidation.isValid) {
      Alert.alert(
        "Validação falhou",
        returnDateValidation.errors.join("\n"),
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerSection}>
            <ThemedText style={styles.title}>Editar Empréstimo</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Empréstimo criado em {new Date(borrow.createdAt).toLocaleDateString("pt-BR")}
            </ThemedText>
            {isReturned && (
              <View style={[styles.statusBadge, { backgroundColor: colors.success + "20" }]}>
                <IconCheck size={16} color={colors.success} />
                <ThemedText style={[styles.statusText, { color: colors.success }]}>
                  Devolvido
                </ThemedText>
              </View>
            )}
            {isLost && (
              <View style={[styles.statusBadge, { backgroundColor: colors.destructive + "20" }]}>
                <IconAlertTriangle size={16} color={colors.destructive} />
                <ThemedText style={[styles.statusText, { color: colors.destructive }]}>
                  Perdido
                </ThemedText>
              </View>
            )}
          </View>

          {/* Warning for returned/lost borrows */}
          {(isReturned || isLost) && (
            <Card style={[styles.warningCard, { backgroundColor: colors.warning + "10", borderColor: colors.warning }]}>
              <View style={styles.warningContent}>
                <IconAlertTriangle size={20} color={colors.warning} />
                <ThemedText style={[styles.warningText, { color: colors.warning }]}>
                  {isReturned
                    ? "Este empréstimo já foi devolvido. Algumas alterações podem não ser permitidas."
                    : "Este empréstimo foi marcado como perdido. Edições são limitadas."}
                </ThemedText>
              </View>
            </Card>
          )}

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
                      disabled={isSubmitting || isReturned || isLost}
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
                      disabled={isSubmitting || isReturned || isLost}
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
                        const sanitized = typeof text === 'string' ? text.replace(/[^0-9]/g, "") : "";
                        const num = parseInt(sanitized, 10);
                        onChange(isNaN(num) ? 1 : num);
                      }}
                      placeholder="1"
                      keyboardType="numeric"
                      editable={!isSubmitting && !isReturned && !isLost}
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
                            Disponível para ajuste: {stockValidation.availableStock || 0}
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

              {/* Return Date */}
              <SimpleFormField label="Data de Devolução" error={form.formState.errors.returnedAt}>
                <Controller
                  control={form.control}
                  name="returnedAt"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <DateTimePicker
                        value={value || undefined}
                        onChange={(date) => onChange(date || null)}
                        disabled={isSubmitting}
                        maximumDate={new Date()}
                        minimumDate={new Date(borrow.createdAt)}
                      />
                      <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
                        A data em que o item foi devolvido (opcional)
                      </ThemedText>
                    </View>
                  )}
                />
              </SimpleFormField>

              {/* Return Date Validation */}
              {!returnDateValidation.isValid && returnDateValidation.errors.length > 0 && (
                <Card style={[styles.validationCard, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive }]}>
                  <View style={styles.validationContent}>
                    {returnDateValidation.errors.map((error, index) => (
                      <ThemedText
                        key={index}
                        style={[styles.validationErrorText, { color: colors.destructive }]}
                      >
                        • {error}
                      </ThemedText>
                    ))}
                  </View>
                </Card>
              )}
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
          onPress={form.handleSubmit(handleSubmit as any)}
          disabled={!form.formState.isValid || isSubmitting || !stockValidation.isValid || !returnDateValidation.isValid}
          style={styles.actionButton}
        >
          {isSubmitting ? (
            <>
              <IconLoader size={20} color="white" />
              <ThemedText style={{ color: "white" }}>Salvando...</ThemedText>
            </>
          ) : (
            <>
              <IconCheck size={20} />
              <ThemedText style={{ color: "white" }}>Salvar Alterações</ThemedText>
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
    paddingBottom: 0, // No spacing - action bar has its own margin
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  warningCard: {
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  warningContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
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
  helpText: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
