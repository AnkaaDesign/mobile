import React, { useState, useEffect } from "react";
import { View, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useEditForm } from '../../../../hooks';
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Separator } from "@/components/ui/separator";
import { IconLoader } from "@tabler/icons-react-native";
import { itemUpdateSchema, type ItemUpdateFormData } from '../../../../schemas';
import type { Item } from '../../../../types';
import { useItemCategories } from '../../../../hooks';
import { ITEM_CATEGORY_TYPE } from '../../../../constants';
import { FormProvider } from "react-hook-form";

import { spacing } from "@/constants/design-system";

// Import all form components
import { NameInput } from "./name-input";
import { UnicodeInput } from "./unicode-input";
import { StatusToggle } from "./status-toggle";
import { BrandSelector } from "./brand-selector";
import { CategorySelector } from "./category-selector";
import { SupplierSelector } from "./supplier-selector";
import { QuantityInput } from "./quantity-input";
import { MaxQuantityInput } from "./max-quantity-input";
import { BoxQuantityInput } from "./box-quantity-input";
import { LeadTimeInput } from "./lead-time-input";
import { IcmsInput } from "./icms-input";
import { IpiInput } from "./ipi-input";
import { PriceInput } from "./price-input";
import { MeasuresManager } from "./measures-manager";
import { BarcodeManager } from "./barcode-manager";
import { AssignToUserToggle } from "./assign-to-user-toggle";
import { PpeConfigSection } from "./ppe-config-section";

interface ItemEditFormProps {
  item: Item;
  onSubmit: (data: Partial<ItemUpdateFormData>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ItemEditForm({ item, onSubmit, onCancel, isSubmitting }: ItemEditFormProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(item.categoryId);
  const [isPPE, setIsPPE] = useState(false);

  // Map API data to form data
  const mapDataToForm = React.useCallback((apiData: Item): ItemUpdateFormData => {
    // Get the most recent price if available
    const currentPrice =
      apiData.prices && apiData.prices.length > 0 ? apiData.prices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.value : undefined;

    return {
      name: apiData.name,
      uniCode: apiData.uniCode,
      quantity: apiData.quantity,
      maxQuantity: apiData.maxQuantity,
      boxQuantity: apiData.boxQuantity,
      icms: apiData.icms,
      ipi: apiData.ipi,
      barcodes: apiData.barcodes || [],
      shouldAssignToUser: apiData.shouldAssignToUser,
      brandId: apiData.brandId,
      categoryId: apiData.categoryId,
      supplierId: apiData.supplierId,
      estimatedLeadTime: apiData.estimatedLeadTime,
      isActive: apiData.isActive,
      price: currentPrice,
      // PPE fields
      ppeType: apiData.ppeType,
      ppeSize: apiData.ppeSize,
      ppeCA: apiData.ppeCA,
      ppeDeliveryMode: apiData.ppeDeliveryMode,
      ppeStandardQuantity: apiData.ppeStandardQuantity,
      ppeAutoOrderMonths: apiData.ppeAutoOrderMonths,
    };
  }, []);

  // Use the edit form hook
  const form = useEditForm<ItemUpdateFormData, any, Item>({
    resolver: zodResolver(itemUpdateSchema) as any,
    originalData: item,
    onSubmit,
    mapDataToForm,
    fieldsToOmitIfUnchanged: ["barcodes"], // Don't send barcodes if unchanged
  });

  // Form will be provided through context to child components

  // Create a form object that includes handleSubmit for FormProvider
  const formWithHandleSubmit = {
    ...form,
    handleSubmit: form.handleSubmitChanges,
  };

  // Ensure barcodes is initialized as an array
  useEffect(() => {
    const currentBarcodes = form.getValues("barcodes");
    if (!Array.isArray(currentBarcodes)) {
      form.setValue("barcodes", [], { shouldValidate: false });
    }
  }, [form]);

  // Check if selected category is PPE
  const { data: categories } = useItemCategories({
    where: { id: selectedCategoryId },
  });

  useEffect(() => {
    if (categories?.data?.[0]) {
      setIsPPE(categories.data[0].type === ITEM_CATEGORY_TYPE.PPE);
    }
  }, [categories]);

  const handleSubmit = async () => {
    try {
      // The form will handle calling onSubmit with only changed fields
      await form.handleSubmitChanges()();
    } catch (error) {
      // Error handling done by parent component
    }
  };

  return (
    <FormProvider {...formWithHandleSubmit}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ThemedScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.content}>
            {/* Basic Information */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.fieldGroup}>
                  <NameInput disabled={isSubmitting} required={false} />
                  <UnicodeInput disabled={isSubmitting} />
                </View>
              </CardContent>
            </Card>

            {/* Categorization */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Classificação</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.fieldGroup}>
                  <BrandSelector disabled={isSubmitting} required={false} />
                  <CategorySelector disabled={isSubmitting} required={false} onCategoryChange={setSelectedCategoryId} />
                  <SupplierSelector disabled={isSubmitting} />
                </View>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Controle de Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.fieldGroup}>
                  <QuantityInput disabled={isSubmitting} required={false} />
                  <MaxQuantityInput disabled={isSubmitting} />
                  <BoxQuantityInput disabled={isSubmitting} />
                  <LeadTimeInput disabled={isSubmitting} />
                </View>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Preço e Impostos</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.fieldGroup}>
                  <PriceInput disabled={isSubmitting} />
                  <View style={styles.fieldRow}>
                    <View style={styles.halfField}>
                      <IcmsInput disabled={isSubmitting} required={false} priceFieldName="price" />
                    </View>
                    <View style={styles.halfField}>
                      <IpiInput disabled={isSubmitting} required={false} priceFieldName="price" />
                    </View>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Measures */}
            <MeasuresManager disabled={isSubmitting} />

            {/* Tracking */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Rastreamento</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.fieldGroup}>
                  <BarcodeManager disabled={isSubmitting} />
                  <Separator style={styles.separator} />
                  <AssignToUserToggle disabled={isSubmitting} />
                  <StatusToggle disabled={isSubmitting} />
                </View>
              </CardContent>
            </Card>

            {/* PPE Configuration */}
            {isPPE && (
              <Card style={styles.card}>
                <CardHeader>
                  <CardTitle>Configuração de EPI</CardTitle>
                </CardHeader>
                <CardContent>
                  <PpeConfigSection disabled={isSubmitting} />
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Button variant="outline" onPress={onCancel} disabled={isSubmitting} style={styles.actionButton}>
                <ThemedText>Cancelar</ThemedText>
              </Button>
              <Button onPress={handleSubmit} disabled={isSubmitting} style={styles.actionButton}>
                {isSubmitting ? (
                  <View style={styles.buttonContent}>
                    <IconLoader size={20} color="white" />
                    <ThemedText style={styles.buttonText}>Salvando...</ThemedText>
                  </View>
                ) : (
                  <ThemedText style={styles.buttonText}>Atualizar Item</ThemedText>
                )}
              </Button>
            </View>
          </View>
        </ThemedScrollView>
      </KeyboardAvoidingView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.lg,
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  separator: {
    marginVertical: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  buttonText: {
    color: "white",
  },
});
