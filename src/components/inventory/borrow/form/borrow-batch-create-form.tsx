import React, { useState, useCallback } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useItems, useUsers } from '../../../../hooks';
import { IconLoader } from "@tabler/icons-react-native";

// Form schema for batch borrow creation
const borrowBatchFormSchema = z.object({
  userId: z.string().uuid("Usuário é obrigatório"),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().positive("Quantidade deve ser positiva"),
  })).min(1, "Selecione pelo menos um item").max(50, "Máximo de 50 itens por empréstimo"),
});

type BorrowBatchFormData = z.infer<typeof borrowBatchFormSchema>;

interface BorrowBatchCreateFormProps {
  onSubmit: (data: BorrowBatchFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BorrowBatchCreateForm({ onSubmit, onCancel, isSubmitting }: BorrowBatchCreateFormProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Array<{ itemId: string; name: string; quantity: number }>>([]);

  const form = useForm<BorrowBatchFormData>({
    resolver: zodResolver(borrowBatchFormSchema),
    defaultValues: {
      userId: "",
      items: [],
    },
  });

  // Fetch items for selection
  const { data: items, isLoading: isLoadingItems } = useItems({
    searchingFor: searchQuery,
    orderBy: { name: "asc" },
    include: {
      brand: true,
      category: true,
    },
  });

  // Fetch users for selection
  const { data: users, isLoading: isLoadingUsers } = useUsers({
    searchingFor: userSearchQuery,
    orderBy: { name: "asc" },
  });

  const itemOptions = items?.data?.map((item) => ({
    value: item.id,
    label: `${item.name}${item.brand ? ` - ${item.brand.name}` : ""}`,
  })) || [];

  const userOptions = users?.data?.map((user) => ({
    value: user.id,
    label: user.name,
  })) || [];

  // Handle adding an item to the batch
  const handleAddItem = useCallback((itemId: string) => {
    const item = items?.data?.find((i) => i.id === itemId);
    if (!item) return;

    // Check if item already exists
    if (selectedItems.some((i) => i.itemId === itemId)) {
      Alert.alert("Atenção", "Este item já foi adicionado à lista");
      return;
    }

    // Check max items limit
    if (selectedItems.length >= 50) {
      Alert.alert("Limite Atingido", "Você pode adicionar no máximo 50 itens por empréstimo");
      return;
    }

    setSelectedItems((prev) => [
      ...prev,
      {
        itemId: item.id,
        name: item.name,
        quantity: 1,
      },
    ]);
  }, [items?.data, selectedItems]);

  // Handle removing an item from the batch
  const handleRemoveItem = useCallback((itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.itemId !== itemId));
  }, []);

  // Handle quantity change for an item
  const handleQuantityChange = useCallback((itemId: string, quantity: string) => {
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) return;

    setSelectedItems((prev) =>
      prev.map((i) => (i.itemId === itemId ? { ...i, quantity: numQuantity } : i))
    );
  }, []);

  // Handle form submission
  const handleFormSubmit = async (data: BorrowBatchFormData) => {
    try {
      // Map selected items to form data
      const formData = {
        ...data,
        items: selectedItems.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
        })),
      };

      await onSubmit(formData);
    } catch (error) {
      // Error handled by parent component
    }
  };

  return (
    <FormProvider {...form}>
      <ThemedScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* User Selection */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Informações do Empréstimo</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                control={form.control}
                name="userId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Usuário *</Label>
                    <Combobox
                      value={value}
                      onValueChange={onChange}
                      options={userOptions}
                      placeholder="Selecione o usuário"
                      searchPlaceholder="Buscar usuário..."
                      emptyText="Nenhum usuário encontrado"
                      onSearchChange={setUserSearchQuery}
                      disabled={isSubmitting || isLoadingUsers}
                      loading={isLoadingUsers}
                      clearable={false}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                    <ThemedText style={styles.helpText}>
                      Selecione o colaborador que receberá os itens emprestados
                    </ThemedText>
                  </View>
                )}
              />
            </CardContent>
          </Card>

          {/* Item Selection */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Selecionar Itens</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.fieldGroup}>
                <Label>Adicionar Item</Label>
                <Combobox
                  value=""
                  onValueChange={handleAddItem}
                  options={itemOptions}
                  placeholder="Buscar e adicionar item..."
                  searchPlaceholder="Digite para buscar..."
                  emptyText="Nenhum item encontrado"
                  onSearchChange={setSearchQuery}
                  disabled={isSubmitting || isLoadingItems || selectedItems.length >= 50}
                  loading={isLoadingItems}
                />
                <ThemedText style={styles.helpText}>
                  {selectedItems.length}/50 itens adicionados
                </ThemedText>
              </View>
            </CardContent>
          </Card>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Itens Selecionados ({selectedItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.itemsList}>
                  {selectedItems.map((item) => (
                    <View key={item.itemId} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.itemInfo}>
                        <ThemedText style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </ThemedText>
                        <View style={styles.quantityRow}>
                          <Label style={styles.quantityLabel}>Qtd:</Label>
                          <Input
                            value={item.quantity.toString()}
                            onChangeText={(value) => handleQuantityChange(item.itemId, value)}
                            keyboardType="numeric"
                            disabled={isSubmitting}
                            style={styles.quantityInput}
                          />
                        </View>
                      </View>
                      <Button
                        variant="ghost"
                        onPress={() => handleRemoveItem(item.itemId)}
                        disabled={isSubmitting}
                        style={styles.removeButton}
                      >
                        <Icon name="trash" size={20} color={colors.destructive} />
                      </Button>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <View style={styles.actions}>
              <Button variant="outline" onPress={onCancel} disabled={isSubmitting} style={styles.cancelButton}>
                Cancelar
              </Button>
              <Button
                onPress={form.handleSubmit(handleFormSubmit)}
                disabled={isSubmitting || selectedItems.length === 0}
                style={styles.submitButton}
              >
                {isSubmitting ? (
                  <>
                    <IconLoader size={20} color={colors.primaryForeground} />
                    <ThemedText style={{ color: colors.primaryForeground }}>Salvando...</ThemedText>
                  </>
                ) : (
                  <ThemedText style={{ color: colors.primaryForeground }}>Criar Empréstimos</ThemedText>
                )}
              </Button>
            </View>
          </View>
        </View>
      </ThemedScrollView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  card: {
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: "#ef4444",
    marginTop: spacing.xs,
  },
  helpText: {
    fontSize: fontSize.xs,
    color: "#6b7280",
    marginTop: spacing.xs,
  },
  itemsList: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  quantityLabel: {
    fontSize: fontSize.sm,
    minWidth: 35,
  },
  quantityInput: {
    width: 80,
    height: 36,
  },
  removeButton: {
    padding: spacing.sm,
  },
  actionsContainer: {
    marginTop: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  cancelButton: {
    minWidth: 100,
  },
  submitButton: {
    minWidth: 120,
  },
});
