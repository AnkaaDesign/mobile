import React, { useState, useEffect } from "react";
import { View, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";

import { itemCreateSchema, itemUpdateSchema, type ItemCreateFormData, type ItemUpdateFormData } from '../../../../schemas';
import { useItemCategories } from '../../../../hooks';
import { ITEM_CATEGORY_TYPE } from '../../../../constants';
import { spacing } from "@/constants/design-system";
import type { Supplier, ItemBrand, ItemCategory } from '../../../../types';

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

interface BaseItemFormProps {
  isSubmitting?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  onFormStateChange?: (formState: { isValid: boolean; isDirty: boolean }) => void;
  initialSupplier?: Supplier;
  initialBrand?: ItemBrand;
  initialCategory?: ItemCategory;
}

interface CreateItemFormProps extends BaseItemFormProps {
  mode: "create";
  onSubmit: (data: ItemCreateFormData) => Promise<void>;
  defaultValues?: Partial<ItemCreateFormData>;
}

interface UpdateItemFormProps extends BaseItemFormProps {
  mode: "update";
  onSubmit: (data: ItemUpdateFormData) => Promise<void>;
  defaultValues?: Partial<ItemUpdateFormData>;
}

type ItemFormProps = CreateItemFormProps | UpdateItemFormProps;

export function ItemForm(props: ItemFormProps) {
  const { isSubmitting, defaultValues, mode, onFormStateChange, onDirtyChange, initialCategory: _initialCategory, initialBrand: _initialBrand, initialSupplier: _initialSupplier } = props;
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(defaultValues?.categoryId || undefined);
  const [isPPE, setIsPPE] = useState(false);

  // Default values for create mode
  const createDefaults: ItemCreateFormData = {
    name: "",
    uniCode: null,
    quantity: 0,
    reorderPoint: null,
    reorderQuantity: null,
    maxQuantity: null,
    boxQuantity: null,
    icms: 0,
    ipi: 0,
    measures: [], // Initialize with empty measures array
    barcodes: [],
    shouldAssignToUser: true,
    abcCategory: null,
    xyzCategory: null,
    brandId: undefined,
    categoryId: undefined,
    supplierId: null,
    estimatedLeadTime: 30,
    isActive: true,
    price: undefined,
    // PPE fields
    ppeType: null,
    ppeCA: null,
    ppeDeliveryMode: null,
    ppeStandardQuantity: null,
    ppeAutoOrderMonths: null,
    monthlyConsumptionTrendPercent: null,
    ...defaultValues,
  };

  // Ensure defaultValues has barcodes and measures as arrays for update mode
  const processedDefaultValues =
    mode === "update" && defaultValues
      ? {
          ...defaultValues,
          barcodes: Array.isArray(defaultValues.barcodes) ? defaultValues.barcodes : [],
          measures: Array.isArray(defaultValues.measures) ? defaultValues.measures : [],
        }
      : defaultValues;

  // Create a unified form that works for both modes
  const form = useForm({
    resolver: zodResolver(mode === "create" ? itemCreateSchema : itemUpdateSchema),
    defaultValues: mode === "create" ? createDefaults : processedDefaultValues,
    mode: "onTouched", // Validate only after field is touched to avoid premature validation
    reValidateMode: "onChange", // After first validation, check on every change
    shouldFocusError: true, // Focus on first error field when validation fails
    criteriaMode: "all", // Show all errors for better UX
  });

  // useFieldArray for measures
  const { fields: __measureFields } = useFieldArray({
    control: form.control,
    name: "measures",
  });

  // Ensure barcodes and measures are initialized as arrays
  React.useEffect(() => {
    const currentBarcodes = form.getValues("barcodes");
    if (!Array.isArray(currentBarcodes)) {
      form.setValue("barcodes", [], { shouldValidate: false });
    }

    const currentMeasures = form.getValues("measures");
    if (!Array.isArray(currentMeasures)) {
      form.setValue("measures", [], { shouldValidate: false });
    }
  }, [form]);

  // Access formState properties during render for proper subscription
  const { isValid, isDirty, errors } = form.formState;

  // Debug validation errors in development
  useEffect(() => {
    if (__DEV__ && Object.keys(errors).length > 0) {
      console.log("Item form validation errors:", {
        errors,
        currentValues: form.getValues(),
      });
    }
  }, [errors, form]);

  // Track dirty state without triggering validation
  useEffect(() => {
    if (onDirtyChange && mode === "update") {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange, mode]);

  // Track form state changes for submit button
  useEffect(() => {
    if (onFormStateChange) {
      onFormStateChange({
        isValid,
        isDirty,
      });
    }
  }, [isValid, isDirty, onFormStateChange]);

  // Check if selected category is PPE
  const { data: categories } = useItemCategories({
    where: { id: selectedCategoryId },
  });

  useEffect(() => {
    if (categories?.data?.[0]) {
      setIsPPE(categories.data[0].type === ITEM_CATEGORY_TYPE.PPE);
    }
  }, [categories]);

  const isRequired = mode === "create";

  return (
    <FormProvider {...form}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ThemedScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.content}>
            {/* Basic Information & Classification */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Identificação e classificação do item</CardDescription>
              </CardHeader>
              <CardContent>
                <View style={styles.fieldGroup}>
                  <UnicodeInput disabled={isSubmitting} />
                  <NameInput disabled={isSubmitting} required={isRequired} />
                </View>
                <Separator style={styles.separator} />
                <View style={styles.fieldGroup}>
                  <CategorySelector
                    disabled={isSubmitting}
                    onCategoryChange={setSelectedCategoryId}
                  />
                  <BrandSelector
                    disabled={isSubmitting}
                  />
                  <SupplierSelector
                    disabled={isSubmitting}
                  />
                </View>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Controle de Estoque</CardTitle>
                <CardDescription>Quantidades e níveis de estoque</CardDescription>
              </CardHeader>
              <CardContent>
                <View style={styles.fieldGroup}>
                  <QuantityInput disabled={isSubmitting} required={isRequired} />
                  <MaxQuantityInput disabled={isSubmitting} />
                  <BoxQuantityInput disabled={isSubmitting} />
                  <LeadTimeInput disabled={isSubmitting} />
                </View>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Preço e Taxas</CardTitle>
                <CardDescription>Informações de preço e impostos</CardDescription>
              </CardHeader>
              <CardContent>
                <View style={styles.fieldGroup}>
                  <PriceInput disabled={isSubmitting} />
                  <View style={styles.fieldRow}>
                    <View style={styles.halfField}>
                      <IcmsInput disabled={isSubmitting} required={isRequired} priceFieldName="price" />
                    </View>
                    <View style={styles.halfField}>
                      <IpiInput disabled={isSubmitting} required={isRequired} priceFieldName="price" />
                    </View>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Multiple Measures - Only show for non-PPE categories */}
            {!isPPE && <MeasuresManager disabled={isSubmitting} />}

            {/* PPE Configuration - Only show for PPE categories */}
            {isPPE && <PpeConfigSection disabled={isSubmitting} required={isRequired} />}

            {/* Tracking */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Rastreamento</CardTitle>
                <CardDescription>Códigos de barras para identificação do item</CardDescription>
              </CardHeader>
              <CardContent>
                <View style={styles.fieldGroup}>
                  <BarcodeManager disabled={isSubmitting} />
                </View>
              </CardContent>
            </Card>

            {/* Extra Configurations */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Configurações Extras</CardTitle>
                <CardDescription>Configurações adicionais do item</CardDescription>
              </CardHeader>
              <CardContent>
                <View style={styles.fieldGroup}>
                  <AssignToUserToggle disabled={isSubmitting} />
                  <StatusToggle disabled={isSubmitting} />
                </View>
              </CardContent>
            </Card>
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
    paddingBottom: spacing.lg,
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
});
