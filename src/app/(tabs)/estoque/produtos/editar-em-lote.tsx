import { useState, useMemo } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconPackage, IconDeviceFloppy, IconAlertTriangle } from "@tabler/icons-react-native";
import { useItems, useItemBatchMutations, useItemCategories, useSuppliers } from "@/hooks";
import { useItemBrandsInfiniteMobile } from "@/hooks/use-item-brands-infinite-mobile";

import { ThemedView, ThemedText, Button, LoadingScreen, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Switch } from "@/components/ui";
import { BatchOperationResultDialog } from "@/components/common/batch-operation-result-dialog";
import { useTheme } from "@/lib/theme";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { toast } from "@/lib/toast";
import type { Item } from "@/types";
import type { BatchOperationResult } from "@/components/common/batch-operation-result-dialog";

interface BatchEditData {
  // Fields that can be batch edited
  categoryId?: string | null;
  brandId?: string | null;
  supplierId?: string | null;
  isActive?: boolean;
  totalPrice?: number | null;
  quantity?: number | null;
  maxQuantity?: number | null;
  reorderPoint?: number | null;
}

interface FieldChange {
  field: keyof BatchEditData;
  enabled: boolean;
}

export default function ProductBatchEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchOperationResult | null>(null);

  // Track which fields are enabled for batch editing
  const [enabledFields, setEnabledFields] = useState<Record<keyof BatchEditData, boolean>>({
    categoryId: false,
    brandId: false,
    supplierId: false,
    isActive: false,
    totalPrice: false,
    quantity: false,
    maxQuantity: false,
    reorderPoint: false,
  });

  // Batch edit data
  const [batchData, setBatchData] = useState<BatchEditData>({
    categoryId: null,
    brandId: null,
    supplierId: null,
    isActive: true,
    totalPrice: null,
    quantity: null,
    maxQuantity: null,
    reorderPoint: null,
  });

  // Get product IDs from URL params
  const productIds = useMemo(() => {
    const ids = params.ids as string;
    if (!ids) return [];
    return ids.split(",").filter(Boolean);
  }, [params.ids]);

  // Fetch products to edit
  const {
    data: productsResponse,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useItems(
    {
      where: {
        id: { in: productIds },
      },
      include: {
        brand: true,
        category: true,
        supplier: true,
      },
    },
    {
      enabled: productIds.length > 0,
    }
  );

  // Fetch categories for dropdown
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useItemCategories({});

  // Fetch brands for dropdown
  const { items: brandsData, isLoading: isLoadingBrands } = useItemBrandsInfiniteMobile({
    limit: 100,
  });

  // Fetch suppliers for dropdown
  const { data: suppliersResponse, isLoading: isLoadingSuppliers } = useSuppliers({
    limit: 100,
  });

  const { batchUpdateAsync: batchUpdate } = useItemBatchMutations();

  const products = productsResponse?.data || [];
  const categories = categoriesResponse?.data || [];
  const brands = brandsData || [];
  const suppliers = suppliersResponse?.data || [];

  const hasValidProducts = products.length > 0;
  const allProductsFound = products.length === productIds.length;

  const handleCancel = () => {
    router.push(routeToMobilePath(routes.inventory.products.list) as any);
  };

  const toggleField = (field: keyof BatchEditData) => {
    setEnabledFields(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const updateBatchData = (field: keyof BatchEditData, value: any) => {
    setBatchData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateBatchData = (): string | null => {
    // Check if at least one field is enabled
    const hasEnabledField = Object.values(enabledFields).some(enabled => enabled);
    if (!hasEnabledField) {
      return "Selecione pelo menos um campo para editar";
    }

    // Validate numeric fields
    if (enabledFields.totalPrice && ((batchData.totalPrice ?? null) === null || (batchData.totalPrice ?? 0) < 0)) {
      return "Preço total deve ser maior ou igual a zero";
    }
    if (enabledFields.quantity && ((batchData.quantity ?? null) === null || (batchData.quantity ?? 0) < 0)) {
      return "Quantidade deve ser maior ou igual a zero";
    }
    if (enabledFields.maxQuantity && (batchData.maxQuantity ?? null) !== null && (batchData.maxQuantity ?? 0) < 0) {
      return "Quantidade máxima deve ser maior ou igual a zero";
    }
    if (enabledFields.reorderPoint && (batchData.reorderPoint ?? null) !== null && (batchData.reorderPoint ?? 0) < 0) {
      return "Ponto de reposição deve ser maior ou igual a zero";
    }

    return null;
  };

  const handleSubmit = () => {
    // Validate before showing confirmation
    const validationError = validateBatchData();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      "Confirmar Edição em Lote",
      `Você está prestes a atualizar ${products.length} produto${products.length !== 1 ? 's' : ''}. Esta ação não pode ser desfeita. Deseja continuar?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: performBatchUpdate,
        },
      ]
    );
  };

  const performBatchUpdate = async () => {
    setIsSubmitting(true);
    try {
      // Build the update data for each product
      const updateData: any = {};

      if (enabledFields.categoryId) {
        updateData.categoryId = batchData.categoryId;
      }
      if (enabledFields.brandId) {
        updateData.brandId = batchData.brandId;
      }
      if (enabledFields.supplierId) {
        updateData.supplierId = batchData.supplierId;
      }
      if (enabledFields.isActive) {
        updateData.isActive = batchData.isActive;
      }
      if (enabledFields.totalPrice) {
        updateData.totalPrice = batchData.totalPrice;
      }
      if (enabledFields.quantity) {
        updateData.quantity = batchData.quantity;
      }
      if (enabledFields.maxQuantity) {
        updateData.maxQuantity = batchData.maxQuantity;
      }
      if (enabledFields.reorderPoint) {
        updateData.reorderPoint = batchData.reorderPoint;
      }

      // Create batch update payload
      const payload = {
        items: productIds.map(id => ({
          id,
          data: updateData,
        })),
      };

      const result = await batchUpdate(payload);

      if (result?.data) {
        // Transform to BatchOperationResult format
        const batchOperationResult: BatchOperationResult = {
          success: result.data.totalFailed === 0,
          successCount: result.data.totalSuccess,
          failedCount: result.data.totalFailed,
          errors: result.data.failed?.map((f: any) =>
            `${products.find(p => p.id === f.id)?.name || 'Produto'}: ${f.error}`
          ) || [],
        };

        setBatchResult(batchOperationResult);
        setShowResultDialog(true);

        // Show toast notification
        if (result.data.totalSuccess > 0) {
          toast.success(
            `${result.data.totalSuccess} produto${result.data.totalSuccess !== 1 ? 's' : ''} atualizado${result.data.totalSuccess !== 1 ? 's' : ''} com sucesso`
          );
        }

        if (result.data.totalFailed > 0) {
          toast.error(
            `${result.data.totalFailed} produto${result.data.totalFailed !== 1 ? 's' : ''} falhou ao atualizar`
          );
        }
      }
    } catch (error) {
      console.error("Batch update error:", error);
      toast.error("Erro ao atualizar produtos");

      // Show error in dialog
      setBatchResult({
        success: false,
        successCount: 0,
        failedCount: productIds.length,
        errors: ["Erro ao processar a atualização em lote"],
      });
      setShowResultDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResultDialogClose = () => {
    setShowResultDialog(false);
    if (batchResult?.success || (batchResult?.successCount ?? 0) > 0) {
      // Navigate back to list if there were any successes
      router.push(routeToMobilePath(routes.inventory.products.list) as any);
    }
  };

  // Loading and error states
  if (productIds.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconPackage size={48} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Nenhum Produto Selecionado
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            Nenhum produto foi selecionado para edição em lote.
          </ThemedText>
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.button}
          >
            Voltar
          </Button>
        </View>
      </ThemedView>
    );
  }

  if (isLoadingProducts || isLoadingCategories || isLoadingBrands || isLoadingSuppliers) {
    return <LoadingScreen message="Carregando produtos..." />;
  }

  if (productsError || !hasValidProducts) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconAlertTriangle size={48} color={colors.destructive} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Erro ao Carregar Produtos
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            {productsError ? "Ocorreu um erro ao carregar os produtos selecionados." : "Os produtos selecionados não foram encontrados."}
          </ThemedText>
          {!allProductsFound && products.length > 0 && (
            <View style={[styles.warningCard, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <ThemedText style={[styles.warningText, { color: colors.warning }]}>
                Apenas {products.length} de {productIds.length} produtos foram encontrados.
              </ThemedText>
            </View>
          )}
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.button}
          >
            Voltar
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
            Editar Produtos em Lote
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {products.length} produto{products.length !== 1 ? 's' : ''} selecionado{products.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
            Selecione os campos que deseja alterar e defina os novos valores. As alterações serão aplicadas a todos os produtos selecionados.
          </ThemedText>
        </View>

        {/* Batch Edit Form */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
            Campos para Edição
          </ThemedText>

          {/* Category Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                checked={enabledFields.categoryId}
                onCheckedChange={() => toggleField('categoryId')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Categoria
              </ThemedText>
            </View>
            {enabledFields.categoryId && (
              <View style={styles.fieldInput}>
                <Select
                  value={batchData.categoryId || undefined}
                  onValueChange={(value) => updateBatchData('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} label={category.name} />
                    ))}
                  </SelectContent>
                </Select>
              </View>
            )}
          </View>

          {/* Brand Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                checked={enabledFields.brandId}
                onCheckedChange={() => toggleField('brandId')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Marca
              </ThemedText>
            </View>
            {enabledFields.brandId && (
              <View style={styles.fieldInput}>
                <Select
                  value={batchData.brandId || undefined}
                  onValueChange={(value) => updateBatchData('brandId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id} label={brand.name} />
                    ))}
                  </SelectContent>
                </Select>
              </View>
            )}
          </View>

          {/* Supplier Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                checked={enabledFields.supplierId}
                onCheckedChange={() => toggleField('supplierId')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Fornecedor
              </ThemedText>
            </View>
            {enabledFields.supplierId && (
              <View style={styles.fieldInput}>
                <Select
                  value={batchData.supplierId || undefined}
                  onValueChange={(value) => updateBatchData('supplierId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.id}
                        label={supplier.fantasyName || supplier.corporateName || ""}
                      />
                    ))}
                  </SelectContent>
                </Select>
              </View>
            )}
          </View>

          {/* Status Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                checked={enabledFields.isActive}
                onCheckedChange={() => toggleField('isActive')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Status
              </ThemedText>
            </View>
            {enabledFields.isActive && (
              <View style={styles.fieldInput}>
                <Select
                  value={batchData.isActive ? 'true' : 'false'}
                  onValueChange={(value) => updateBatchData('isActive', value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" label="Ativo" />
                    <SelectItem value="false" label="Inativo" />
                  </SelectContent>
                </Select>
              </View>
            )}
          </View>

          {/* Total Price Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                checked={enabledFields.totalPrice}
                onCheckedChange={() => toggleField('totalPrice')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Preço Total
              </ThemedText>
            </View>
            {enabledFields.totalPrice && (
              <View style={styles.fieldInput}>
                <Input
                  type="currency"
                  value={batchData.totalPrice}
                  onChange={(value) => updateBatchData('totalPrice', value)}
                  placeholder="R$ 0,00"
                />
              </View>
            )}
          </View>

          {/* Quantity Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                checked={enabledFields.quantity}
                onCheckedChange={() => toggleField('quantity')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Quantidade
              </ThemedText>
            </View>
            {enabledFields.quantity && (
              <View style={styles.fieldInput}>
                <Input
                  type="number"
                  value={batchData.quantity}
                  onChange={(value) => updateBatchData('quantity', value)}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

          {/* Max Quantity Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                checked={enabledFields.maxQuantity}
                onCheckedChange={() => toggleField('maxQuantity')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Quantidade Máxima
              </ThemedText>
            </View>
            {enabledFields.maxQuantity && (
              <View style={styles.fieldInput}>
                <Input
                  type="number"
                  value={batchData.maxQuantity}
                  onChange={(value) => updateBatchData('maxQuantity', value)}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

          {/* Reorder Point Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                checked={enabledFields.reorderPoint}
                onCheckedChange={() => toggleField('reorderPoint')}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Ponto de Reposição
              </ThemedText>
            </View>
            {enabledFields.reorderPoint && (
              <View style={styles.fieldInput}>
                <Input
                  type="number"
                  value={batchData.reorderPoint}
                  onChange={(value) => updateBatchData('reorderPoint', value)}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>
        </View>

        {/* Selected Products List */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
            Produtos Selecionados
          </ThemedText>
          <View style={styles.productsList}>
            {products.map((product, index) => (
              <View
                key={product.id}
                style={[
                  styles.productItem,
                  { borderBottomColor: colors.border },
                  index === products.length - 1 && styles.productItemLast
                ]}
              >
                <ThemedText style={[styles.productName, { color: colors.foreground }]}>
                  {product.name}
                </ThemedText>
                {product.uniCode && (
                  <ThemedText style={[styles.productCode, { color: colors.mutedForeground }]}>
                    Código: {product.uniCode}
                  </ThemedText>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={isSubmitting}
            style={styles.footerButton}
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onPress={handleSubmit}
            disabled={isSubmitting}
            icon={<IconDeviceFloppy size={20} color={colors.primaryForeground} />}
            style={styles.footerButton}
          >
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </View>
      </ScrollView>

      {/* Batch Operation Result Dialog */}
      <BatchOperationResultDialog
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
        result={batchResult}
        onConfirm={handleResultDialogClose}
        itemType="produtos"
        itemTypeSingular="produto"
        title="Resultado da Edição em Lote"
        description="Resumo da operação de atualização"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  infoCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    minWidth: 120,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  fieldInput: {
    marginLeft: 44,
  },
  productsList: {
    gap: 0,
  },
  productItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  productItemLast: {
    borderBottomWidth: 0,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  productCode: {
    fontSize: 12,
  },
  warningCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  footerButton: {
    flex: 1,
  },
});
