import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEditForm } from "@/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { itemUpdateSchema} from '../../../../schemas';
import type { Item } from '../../../../types';
import { useItemCategories } from "@/hooks";
import { ITEM_CATEGORY_TYPE } from "@/constants";
import { FormProvider } from "react-hook-form";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { formSpacing } from "@/constants/form-styles";
import { FormCard } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";

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
  const { colors } = useTheme();
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardView} keyboardVerticalOffset={0}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Basic Information */}
          <FormCard title="Informações Básicas">
            <View style={styles.fieldGroup}>
              <NameInput disabled={isSubmitting} required={false} />
              <UnicodeInput disabled={isSubmitting} />
            </View>
          </FormCard>

          {/* Categorization */}
          <FormCard title="Classificação">
            <View style={styles.fieldGroup}>
              <BrandSelector disabled={isSubmitting} required={false} initialBrand={item.brand} />
              <CategorySelector disabled={isSubmitting} required={false} initialCategory={item.category} onCategoryChange={setSelectedCategoryId} />
              <SupplierSelector disabled={isSubmitting} initialSupplier={item.supplier} />
            </View>
          </FormCard>

          {/* Inventory */}
          <FormCard title="Controle de Estoque">
            <View style={styles.fieldGroup}>
              <QuantityInput disabled={isSubmitting} required={false} />
              <MaxQuantityInput disabled={isSubmitting} />
              <BoxQuantityInput disabled={isSubmitting} />
              <LeadTimeInput disabled={isSubmitting} />
            </View>
          </FormCard>

          {/* Pricing */}
          <FormCard title="Preço e Impostos">
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
          </FormCard>

          {/* Measures */}
          <MeasuresManager disabled={isSubmitting} />

          {/* Tracking */}
          <FormCard title="Rastreamento">
            <View style={styles.fieldGroup}>
              <BarcodeManager disabled={isSubmitting} />
              <AssignToUserToggle disabled={isSubmitting} />
              <StatusToggle disabled={isSubmitting} />
            </View>
          </FormCard>

          {/* PPE Configuration */}
          {isPPE && (
            <FormCard title="Configuração de EPI">
              <PpeConfigSection disabled={isSubmitting} />
            </FormCard>
          )}
          </ScrollView>

          <SimpleFormActionBar
            onCancel={onCancel}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            canSubmit={!isSubmitting}
            submitLabel="Salvar"
          />
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
    paddingTop: formSpacing.containerPaddingVertical,
    paddingBottom: 0, // No spacing - action bar has its own margin
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
});
