import React, { useState, useEffect } from "react";
import { View, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Separator } from "@/components/ui/separator";
import { IconLoader } from "@tabler/icons-react-native";
import { itemCreateSchema, itemUpdateSchema, type ItemCreateFormData, type ItemUpdateFormData } from '../../../../schemas';
import { useItemCategories } from '../../../../hooks';
import { ITEM_CATEGORY_TYPE } from '../../../../constants';
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

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
import { TaxInput } from "./tax-input";
import { PriceInput } from "./price-input";
import { MeasuresManager } from "./measures-manager";
import { BarcodeManager } from "./barcode-manager";
import { AssignToUserToggle } from "./assign-to-user-toggle";
import { PpeConfigSection } from "./ppe-config-section";

interface ItemFormProps<TMode extends "create" | "update"> {
  onSubmit: (data: TMode extends "create" ? ItemCreateFormData : ItemUpdateFormData) => Promise<any>;
  onCancel: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<TMode extends "create" ? ItemCreateFormData : ItemUpdateFormData>;
  mode: TMode;
}

export function ItemForm<TMode extends "create" | "update">({ onSubmit, onCancel, isSubmitting, defaultValues, mode }: ItemFormProps<TMode>) {
  const { colors, isDark } = useTheme();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(defaultValues?.categoryId);
  const [isPPE, setIsPPE] = useState(false);

  type FormData = TMode extends "create" ? ItemCreateFormData : ItemUpdateFormData;

  const form = useForm<FormData>({
    resolver: zodResolver(mode === "create" ? itemCreateSchema : itemUpdateSchema) as any,
    defaultValues: {
      name: "",
      uniCode: null,
      quantity: 0,
      reorderPoint: null,
      reorderQuantity: null,
      maxQuantity: null,
      boxQuantity: null,
      tax: 0,
      measures: [],
      barcodes: [],
      shouldAssignToUser: true,
      abcCategory: null,
      xyzCategory: null,
      brandId: "",
      categoryId: "",
      supplierId: null,
      estimatedLeadTime: 30,
      isActive: true,
      price: undefined,
      // PPE fields
      ppeType: null,
      ppeSize: null,
      ppeCA: null,
      ppeDeliveryMode: null,
      ppeStandardQuantity: null,
      ppeAutoOrderMonths: null,
      ...defaultValues,
    } as any,
  });

  // Form will be provided through context to child components

  // Check if selected category is PPE
  const { data: categories } = useItemCategories({
    where: { id: selectedCategoryId },
  });

  useEffect(() => {
    if (categories?.data?.[0]) {
      setIsPPE(categories.data[0].type === ITEM_CATEGORY_TYPE.PPE);
    }
  }, [categories]);

  const handleSubmit = async (data: FormData) => {
    try {
      // Ensure barcodes is always an array before submitting
      const processedData = {
        ...data,
        barcodes: Array.isArray(data.barcodes) ? data.barcodes : [],
      };

      await onSubmit(processedData as any);
    } catch (error) {
      // Error handling done by parent component
    }
  };

  const isRequired = mode === "create";

  return (
    <FormProvider {...form}>
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
                <NameInput disabled={isSubmitting} required={isRequired} />
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
                <BrandSelector disabled={isSubmitting} required={isRequired} />
                <CategorySelector disabled={isSubmitting} required={isRequired} onCategoryChange={setSelectedCategoryId} />
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
              <CardTitle>Preço e Impostos</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.fieldGroup}>
                <View style={styles.fieldRow}>
                  <View style={styles.halfField}>
                    <PriceInput disabled={isSubmitting} />
                  </View>
                  <View style={styles.halfField}>
                    <TaxInput disabled={isSubmitting} required={isRequired} />
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
                <PpeConfigSection disabled={isSubmitting} required={false} />
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <View style={styles.actions}>
              <Button variant="outline" onPress={onCancel} disabled={isSubmitting} style={styles.cancelButton}>
                Cancelar
              </Button>
              <Button onPress={form.handleSubmit(handleSubmit as any)} disabled={isSubmitting} style={styles.submitButton}>
                {isSubmitting ? (
                  <>
                    <IconLoader size={20} color={colors.primaryForeground} />
                    <ThemedText style={{ color: colors.primaryForeground }}>Salvando...</ThemedText>
                  </>
                ) : (
                  <ThemedText style={{ color: colors.primaryForeground }}>{mode === "create" ? "Criar Item" : "Atualizar Item"}</ThemedText>
                )}
              </Button>
            </View>
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
  ppeNotice: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
  },
  noticeContent: {
    paddingVertical: spacing.md,
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: "#2563eb",
    lineHeight: fontSize.sm * 1.5,
  },
  actionsContainer: {
    marginTop: spacing.xs,
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
