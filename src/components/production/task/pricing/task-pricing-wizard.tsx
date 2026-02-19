import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Text as RNText,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, FormProvider, useFieldArray, useWatch, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconPlus, IconTrash, IconNote, IconCalendar, IconCurrencyReal, IconPhoto, IconFileInvoice } from "@tabler/icons-react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import { MultiStepFormContainer } from "@/components/forms";
import { DatePicker } from "@/components/ui/date-picker";
import { BudgetPreview } from "./budget-preview";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTaskDetail, useTaskMutations } from "@/hooks/useTask";
import { useTaskPricingByTask } from "@/hooks/useTaskPricing";
import { taskPricingCreateNestedSchema } from "@/schemas/task-pricing";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SERVICE_ORDER_TYPE } from "@/constants/enums";
import { getServiceDescriptionsByType } from "@/constants/service-descriptions";
import { formatCurrency } from "@/utils";
import type { FormStep } from "@/components/ui/form-steps";

// Wizard form schema wrapping the nested pricing schema
const wizardSchema = z.object({
  pricing: taskPricingCreateNestedSchema,
});

type WizardFormData = z.infer<typeof wizardSchema>;

const WIZARD_STEPS: FormStep[] = [
  { id: 1, name: "Configuração", description: "Dados básicos" },
  { id: 2, name: "Serviços", description: "Itens e valores" },
  { id: 3, name: "Resumo", description: "Prévia" },
];

// Payment condition options
const PAYMENT_CONDITIONS = [
  { value: "CASH", label: "À vista" },
  { value: "INSTALLMENTS_2", label: "Entrada + 20" },
  { value: "INSTALLMENTS_3", label: "Entrada + 20/40" },
  { value: "INSTALLMENTS_4", label: "Entrada + 20/40/60" },
  { value: "INSTALLMENTS_5", label: "Entrada + 20/40/60/80" },
  { value: "INSTALLMENTS_6", label: "Entrada + 20/40/60/80/100" },
  { value: "INSTALLMENTS_7", label: "Entrada + 20/40/60/80/100/120" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

// Guarantee options
const GUARANTEE_OPTIONS = [
  { value: "5", label: "5 anos" },
  { value: "10", label: "10 anos" },
  { value: "15", label: "15 anos" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

// Validity period options
const VALIDITY_PERIOD_OPTIONS = [
  { value: "15", label: "15 dias" },
  { value: "30", label: "30 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
];

// Status options
const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "REJECTED", label: "Rejeitado" },
  { value: "CANCELLED", label: "Cancelado" },
];

// Forecast days options (1-30)
const FORECAST_DAYS_OPTIONS = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} ${i + 1 === 1 ? 'dia' : 'dias'}`,
}));

interface TaskPricingWizardProps {
  taskId: string;
}

export function TaskPricingWizard({ taskId }: TaskPricingWizardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [layoutFiles, setLayoutFiles] = useState<FilePickerItem[]>([]);

  // Fetch task data for preview
  const {
    data: taskResponse,
    isLoading: taskLoading,
  } = useTaskDetail(taskId, {
    include: {
      customer: {
        select: {
          id: true,
          fantasyName: true,
          corporateName: true,
          cnpj: true,
          cpf: true,
        },
      },
      truck: {
        select: {
          id: true,
          plate: true,
          model: true,
        },
      },
      sector: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  const task = taskResponse?.data;

  // Fetch existing pricing for edit mode (now returns null data instead of 404)
  const {
    data: pricingResponse,
    isLoading: pricingLoading,
  } = useTaskPricingByTask(taskId);
  const existingPricing = pricingResponse?.data;

  // Task mutations for saving
  const { updateAsync } = useTaskMutations();

  // Form setup
  const methods = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      pricing: {
        status: "DRAFT",
        items: [],
        discountType: "NONE",
        discountValue: null,
        subtotal: 0,
        total: 0,
        expiresAt: (() => {
          // Default to 30 days from now
          const defaultExpiry = new Date();
          defaultExpiry.setDate(defaultExpiry.getDate() + 30);
          defaultExpiry.setHours(23, 59, 59, 999);
          return defaultExpiry;
        })(),
        paymentCondition: null,
        downPaymentDate: null,
        customPaymentText: null,
        guaranteeYears: null,
        customGuaranteeText: null,
        layoutFileId: null,
        customForecastDays: null,
        simultaneousTasks: null,
        discountReference: null,
        invoicesToCustomerIds: [],
      },
    },
    mode: "onChange",
  });

  const { control, setValue, getValues, watch } = methods;

  // Pre-populate form when existing pricing loads
  useEffect(() => {
    if (!existingPricing) return;

    const p = existingPricing;
    setValue("pricing.status", p.status || "DRAFT");
    // Default to 30 days from now if no expiry date exists
    setValue("pricing.expiresAt", p.expiresAt ? new Date(p.expiresAt) : (() => {
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 30);
      defaultExpiry.setHours(23, 59, 59, 999);
      return defaultExpiry;
    })());
    setValue("pricing.discountType", p.discountType || "NONE");
    setValue("pricing.discountValue", p.discountValue ?? null);
    setValue("pricing.subtotal", p.subtotal || 0);
    setValue("pricing.total", p.total || 0);
    setValue("pricing.paymentCondition", p.paymentCondition ?? null);
    setValue("pricing.downPaymentDate", p.downPaymentDate ? new Date(p.downPaymentDate) : null);
    setValue("pricing.customPaymentText", p.customPaymentText ?? null);
    setValue("pricing.guaranteeYears", p.guaranteeYears ?? null);
    setValue("pricing.customGuaranteeText", p.customGuaranteeText ?? null);
    setValue("pricing.layoutFileId", p.layoutFileId ?? null);
    setValue("pricing.customForecastDays", p.customForecastDays ?? null);
    setValue("pricing.simultaneousTasks", p.simultaneousTasks ?? null);
    setValue("pricing.discountReference", p.discountReference ?? null);
    setValue("pricing.invoicesToCustomerIds", p.invoicesToCustomers?.map((c: any) => c.id) || []);

    if (p.items && p.items.length > 0) {
      setValue(
        "pricing.items",
        p.items.map((item: any) => ({
          id: item.id,
          description: item.description || "",
          observation: item.observation ?? null,
          amount: item.amount ?? null,
          shouldSync: true,
        }))
      );
    }

    if (p.layoutFile?.id) {
      setLayoutFiles([
        {
          id: p.layoutFile.id,
          name: "Layout",
          uri: "",
          type: "image/jpeg",
          size: 0,
          uploaded: true,
        },
      ]);
    }
  }, [existingPricing, setValue]);

  // Watch pricing data for preview AND validation
  const pricingData = watch("pricing");

  // Watch the entire form to detect ANY changes (including deep array changes)
  const formValues = watch();


  // Build preview pricing object
  const previewPricing = useMemo(() => {
    if (!pricingData) return null;

    // Determine layout file for preview
    let layoutFileForPreview = null;
    if (layoutFiles.length > 0) {
      // Use the file from FilePicker (either newly selected or existing)
      const pickedFile = layoutFiles[0];
      layoutFileForPreview = pickedFile.uploaded && pickedFile.id
        ? { id: pickedFile.id } // Uploaded file - use ID for getFileUrl
        : { uri: pickedFile.uri }; // New file - use local URI
    } else if (pricingData.layoutFileId) {
      // Fallback to form data
      layoutFileForPreview = { id: pricingData.layoutFileId };
    } else if (existingPricing?.layoutFile) {
      // Fallback to existing pricing
      layoutFileForPreview = existingPricing.layoutFile;
    }

    return {
      ...pricingData,
      budgetNumber: existingPricing?.budgetNumber,
      createdAt: existingPricing?.createdAt || new Date(),
      layoutFile: layoutFileForPreview,
    };
  }, [pricingData, existingPricing, layoutFiles]);

  // Validation for step navigation
  const canProceedToStep2 = useMemo(() => {
    return !!pricingData?.expiresAt;
  }, [pricingData]);

  const canProceedToStep3 = useMemo(() => {
    // Use formValues.pricing.items to ensure we get updates when items change
    const items = formValues?.pricing?.items || [];

    if (items.length === 0) {
      return false;
    }

    const validationResults = items.map((item: any) => {
      const hasDescription = !!(item.description?.trim());

      // Check amount is a valid number
      // Convert to number first to handle string numbers from form
      const numAmount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;

      // Valid if it's a number >= 0 (including 0 for free items)
      const hasValidAmount =
        typeof numAmount === 'number' &&
        !isNaN(numAmount) &&
        numAmount >= 0;

      return hasDescription && hasValidAmount;
    });

    return validationResults.every(v => v === true);
  }, [formValues]);

  const canSubmit = useMemo(() => {
    return canProceedToStep3 && currentStep === 3;
  }, [canProceedToStep3, currentStep]);

  // Step navigation
  const goNext = useCallback(() => {
    if (currentStep === 1 && !canProceedToStep2) {
      Alert.alert("Campo obrigatório", "Selecione o período de validade do orçamento.");
      return;
    }
    if (currentStep === 2 && !canProceedToStep3) {
      const items = pricingData?.items || [];
      if (items.length === 0) {
        Alert.alert("Orçamento vazio", "Adicione pelo menos um serviço antes de continuar.");
      } else {
        Alert.alert("Dados incompletos", "Todos os serviços precisam ter descrição e valor.");
      }
      return;
    }
    if (currentStep < 3) setCurrentStep((s) => s + 1);
  }, [currentStep, canProceedToStep2, canProceedToStep3, pricingData]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  // Handle save
  const onSave = useCallback(async () => {
    const data = getValues();
    const items = data.pricing?.items || [];

    if (items.length === 0) {
      Alert.alert("Orçamento vazio", "Adicione pelo menos um serviço antes de salvar.");
      return;
    }

    const invalidItems = items.filter(
      (item: any) => !item.description?.trim() || item.amount == null || item.amount < 0
    );
    if (invalidItems.length > 0) {
      Alert.alert("Dados incompletos", "Todos os serviços precisam ter descrição e valor.");
      return;
    }

    if (!data.pricing?.expiresAt) {
      Alert.alert("Data de validade", "Selecione o período de validade do orçamento.");
      return;
    }

    try {
      setIsSaving(true);

      // Filter only NEW layout files (not already uploaded)
      const newLayoutFiles = layoutFiles.filter(f => !f.uploaded);

      // If we have NEW files to upload, use FormData
      if (newLayoutFiles.length > 0) {
        const formData = new FormData();

        // Add layout file - backend expects 'pricingLayoutFile' field name (singular, only 1 file)
        const layoutFile = newLayoutFiles[0];
        formData.append('pricingLayoutFile', {
          uri: layoutFile.uri,
          type: layoutFile.type,
          name: layoutFile.name,
        } as any);

        // Add pricing data as JSON field in FormData
        formData.append('pricing', JSON.stringify(data.pricing));

        await updateAsync({
          id: taskId,
          data: formData as any,
        });
      } else {
        // No new files - send JSON only
        await updateAsync({
          id: taskId,
          data: { pricing: data.pricing } as any,
        });
      }

      // Reset form state and navigate back
      methods.reset();
      setCurrentStep(1);
      setLayoutFiles([]);
      router.back();
    } catch (error: any) {
      console.error("[TaskPricingWizard] Save failed:", error);
      // API client already shows error toast, no need for Alert
    } finally {
      setIsSaving(false);
    }
  }, [getValues, taskId, updateAsync, router, methods, layoutFiles]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // Loading state
  if (taskLoading || pricingLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ color: colors.mutedForeground, marginTop: spacing.md }}>
          Carregando dados...
        </ThemedText>
      </ThemedView>
    );
  }

  const userRole = user?.sector?.privileges || "";
  const canEditStatus = userRole === "ADMIN" || userRole === "FINANCIAL" || userRole === "COMMERCIAL";

  return (
    <FormProvider {...methods}>
      <MultiStepFormContainer
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onPrevStep={goPrev}
        onNextStep={goNext}
        onSubmit={onSave}
        onCancel={handleCancel}
        isSubmitting={isSaving}
        canProceed={currentStep === 1 ? canProceedToStep2 : currentStep === 2 ? canProceedToStep3 : false}
        canSubmit={canSubmit}
        submitLabel="Salvar"
        cancelLabel="Cancelar"
        scrollable={true}
      >
        {/* Step 1 - Basic Configuration */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Configuração do Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <Step1BasicConfig
                  control={control}
                  canEditStatus={canEditStatus}
                  layoutFiles={layoutFiles}
                  onLayoutFilesChange={setLayoutFiles}
                />
              </CardContent>
            </Card>
          </View>
        )}

        {/* Step 2 - Services */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Serviços e Valores</CardTitle>
              </CardHeader>
              <CardContent>
                <Step2Services control={control} />
              </CardContent>
            </Card>
          </View>
        )}

        {/* Step 3 - Preview */}
        {currentStep === 3 && previewPricing && (
          <View style={styles.stepContainer}>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Prévia do Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ThemedText style={[styles.stepDescription, { color: colors.mutedForeground, marginBottom: spacing.md }]}>
                  Revise o orçamento antes de salvar.
                </ThemedText>
                <BudgetPreview
                  pricing={previewPricing as any}
                  task={task ? {
                    name: task.name,
                    serialNumber: task.serialNumber ?? undefined,
                    term: task.term,
                    customer: task.customer ? {
                      corporateName: task.customer.corporateName ?? undefined,
                      fantasyName: task.customer.fantasyName ?? undefined,
                    } : undefined,
                    representatives: task.representatives,
                  } : undefined}
                />
              </CardContent>
            </Card>
          </View>
        )}
      </MultiStepFormContainer>
    </FormProvider>
  );
}

// ============================================================================
// Step 1 - Basic Configuration
// ============================================================================

interface Step1Props {
  control: any;
  canEditStatus: boolean;
  layoutFiles: FilePickerItem[];
  onLayoutFilesChange: (files: FilePickerItem[]) => void;
}

function Step1BasicConfig({ control, canEditStatus, layoutFiles, onLayoutFilesChange }: Step1Props) {
  const { colors } = useTheme();
  const { setValue, getValues } = useFormContext();
  const [validityPeriod, setValidityPeriod] = useState<string>("");
  const [showCustomPayment, setShowCustomPayment] = useState(false);
  const [showCustomGuarantee, setShowCustomGuarantee] = useState(false);

  const pricingStatus = useWatch({ control, name: "pricing.status" }) || "DRAFT";
  const discountType = useWatch({ control, name: "pricing.discountType" }) || "NONE";
  const discountValue = useWatch({ control, name: "pricing.discountValue" });
  const discountReference = useWatch({ control, name: "pricing.discountReference" });
  const paymentCondition = useWatch({ control, name: "pricing.paymentCondition" });
  const downPaymentDate = useWatch({ control, name: "pricing.downPaymentDate" });
  const customPaymentText = useWatch({ control, name: "pricing.customPaymentText" });
  const guaranteeYears = useWatch({ control, name: "pricing.guaranteeYears" });
  const customGuaranteeText = useWatch({ control, name: "pricing.customGuaranteeText" });
  const simultaneousTasks = useWatch({ control, name: "pricing.simultaneousTasks" });
  const customForecastDays = useWatch({ control, name: "pricing.customForecastDays" });

  // Initialize
  useEffect(() => {
    const expiresAt = getValues("pricing.expiresAt");
    if (expiresAt) {
      const diffDays = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const closest = [15, 30, 60, 90].find(d => Math.abs(d - diffDays) <= 3);
      setValidityPeriod(closest ? closest.toString() : "30");
    } else {
      // Default to 30 days for new pricing
      setValidityPeriod("30");
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      expiryDate.setHours(23, 59, 59, 999);
      setValue("pricing.expiresAt", expiryDate);
      setValue("pricing.status", "DRAFT");
    }
    if (customPaymentText) setShowCustomPayment(true);
    if (customGuaranteeText) setShowCustomGuarantee(true);
  }, []);

  const currentPaymentCondition = useMemo(() => {
    if (customPaymentText) return "CUSTOM";
    return paymentCondition || "";
  }, [paymentCondition, customPaymentText]);

  const currentGuaranteeOption = useMemo(() => {
    if (customGuaranteeText) return "CUSTOM";
    if (guaranteeYears) return guaranteeYears.toString();
    return "";
  }, [guaranteeYears, customGuaranteeText]);

  const handleValidityChange = useCallback((value: string | string[] | null | undefined) => {
    const period = typeof value === 'string' ? value : '';
    setValidityPeriod(period);
    const days = Number(period);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    expiryDate.setHours(23, 59, 59, 999);
    setValue("pricing.expiresAt", expiryDate);
  }, [setValue]);

  const handlePaymentChange = useCallback((val: string | string[] | null | undefined) => {
    const value = typeof val === 'string' ? val : '';
    if (value === "CUSTOM") {
      setShowCustomPayment(true);
      setValue("pricing.paymentCondition", "CUSTOM");
    } else {
      setShowCustomPayment(false);
      setValue("pricing.customPaymentText", null);
      setValue("pricing.paymentCondition", value || null);
    }
  }, [setValue]);

  const handleGuaranteeChange = useCallback((val: string | string[] | null | undefined) => {
    const value = typeof val === 'string' ? val : '';
    if (value === "CUSTOM") {
      setShowCustomGuarantee(true);
      setValue("pricing.guaranteeYears", null);
    } else {
      setShowCustomGuarantee(false);
      setValue("pricing.customGuaranteeText", null);
      setValue("pricing.guaranteeYears", value ? Number(value) : null);
    }
  }, [setValue]);

  const handleLayoutChange = useCallback((files: FilePickerItem[]) => {
    onLayoutFilesChange(files);
    if (files.length > 0 && files[0].id && files[0].uploaded) {
      setValue("pricing.layoutFileId", files[0].id);
    } else if (files.length === 0) {
      setValue("pricing.layoutFileId", null);
    }
  }, [setValue, onLayoutFilesChange]);

  return (
    <View style={styles.fieldSection}>
      {/* Status & Validity */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Status</ThemedText>
          <Combobox
            value={pricingStatus || "DRAFT"}
            onValueChange={(v) => setValue("pricing.status", v)}
            disabled={!canEditStatus}
            options={STATUS_OPTIONS}
            placeholder="Selecione"
            searchable={false}
            avoidKeyboard={false}
            onOpen={() => {}}
            onClose={() => {}}
          />
        </View>
        <View style={styles.halfField}>
          <View style={styles.labelWithIcon}>
            <IconCalendar size={14} color={colors.mutedForeground} style={{ flexShrink: 0 }} />
            <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, marginBottom: 0, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
              Validade <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
            </ThemedText>
          </View>
          <Combobox
            value={validityPeriod}
            onValueChange={handleValidityChange}
            options={VALIDITY_PERIOD_OPTIONS}
            placeholder="Período"
            searchable={false}
            avoidKeyboard={false}
            onOpen={() => {}}
            onClose={() => {}}
          />
        </View>
      </View>

      {/* Discount */}
      <View style={[styles.fieldSection, { marginTop: spacing.md }]}>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Tipo de Desconto</ThemedText>
            <Combobox
              value={discountType || "NONE"}
              onValueChange={(v) => {
                setValue("pricing.discountType", v || "NONE");
                if (v === "NONE") setValue("pricing.discountValue", null);
              }}
              options={[
                { value: "NONE", label: "Nenhum" },
                { value: "PERCENTAGE", label: "Porcentagem" },
                { value: "FIXED_VALUE", label: "Valor Fixo" },
              ]}
              placeholder="Selecione"
              searchable={false}
              avoidKeyboard={false}
              onOpen={() => {}}
              onClose={() => {}}
            />
          </View>
          <View style={styles.halfField}>
            <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">
              Valor do Desconto{" "}
              {discountType === "PERCENTAGE" && <ThemedText style={{ color: colors.mutedForeground }}>(%)</ThemedText>}
              {discountType === "FIXED_VALUE" && <ThemedText style={{ color: colors.mutedForeground }}>(R$)</ThemedText>}
            </ThemedText>
            <Input
              type={discountType === "FIXED_VALUE" ? "currency" : "number"}
              value={discountValue ?? ""}
              onChange={(v) => setValue("pricing.discountValue", v === "" || v == null ? null : Number(v))}
              disabled={discountType === "NONE"}
              placeholder={discountType === "NONE" ? "-" : discountType === "FIXED_VALUE" ? "R$ 0,00" : "0"}
            />
          </View>
        </View>
      </View>

      {/* Discount Reference - only show when discount is active */}
      {discountType !== "NONE" && (
        <View style={[styles.fieldSection, { marginTop: spacing.md }]}>
          <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Referência do Desconto</ThemedText>
          <TextInput
            value={discountReference || ""}
            onChangeText={(t) => setValue("pricing.discountReference", t || null)}
            placeholder="Justificativa ou referência para o desconto aplicado..."
            placeholderTextColor={colors.mutedForeground}
            maxLength={500}
            style={[styles.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground, minHeight: 42 }]}
          />
        </View>
      )}

      {/* Payment Condition & Down Payment Date */}
      <View style={[styles.fieldSection, { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }]}>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Condição de Pagamento</ThemedText>
            <Combobox
              value={currentPaymentCondition}
              onValueChange={handlePaymentChange}
              options={PAYMENT_CONDITIONS.map((o) => ({ value: o.value, label: o.label }))}
              placeholder="Selecione"
              searchable={false}
              avoidKeyboard={false}
              onOpen={() => {}}
              onClose={() => {}}
            />
          </View>
          <View style={styles.halfField}>
            <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Data da Entrada</ThemedText>
            <DatePicker
              value={downPaymentDate ? new Date(downPaymentDate) : undefined}
              onChange={(date) => setValue("pricing.downPaymentDate", date || null)}
              mode="date"
              placeholder="Selecione"
            />
          </View>
        </View>
      </View>

      {/* Custom Payment Text */}
      {showCustomPayment && (
        <View style={[styles.fieldSection, { marginTop: spacing.md }]}>
          <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Texto Personalizado de Pagamento</ThemedText>
          <TextInput
            value={customPaymentText || ""}
            onChangeText={(t) => setValue("pricing.customPaymentText", t || null)}
            placeholder="Descreva as condições de pagamento..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            style={[styles.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>
      )}

      {/* Guarantee */}
      <View style={[styles.fieldSection, { marginTop: spacing.md }]}>
        <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Período de Garantia</ThemedText>
        <Combobox
          value={currentGuaranteeOption}
          onValueChange={handleGuaranteeChange}
          options={GUARANTEE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          placeholder="Selecione"
          searchable={false}
          avoidKeyboard={false}
          onOpen={() => {}}
          onClose={() => {}}
        />
      </View>

      {/* Custom Guarantee Text */}
      {showCustomGuarantee && (
        <View style={[styles.fieldSection, { marginTop: spacing.md }]}>
          <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Texto Personalizado de Garantia</ThemedText>
          <TextInput
            value={customGuaranteeText || ""}
            onChangeText={(t) => setValue("pricing.customGuaranteeText", t || null)}
            placeholder="Descreva as condições de garantia..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            style={[styles.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>
      )}

      {/* Simultaneous Tasks & Forecast Days */}
      <View style={[styles.fieldSection, { marginTop: spacing.md }]}>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Tarefas Simultâneas</ThemedText>
            <Input
              type="number"
              value={simultaneousTasks ?? null}
              onChange={(value) => {
                const numVal = value ? Number(value) : null;
                setValue("pricing.simultaneousTasks", numVal);
              }}
              placeholder="1-100"
            />
          </View>
          <View style={styles.halfField}>
            <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Prazo Entrega (dias)</ThemedText>
            <Combobox
              value={customForecastDays ? String(customForecastDays) : ""}
              onValueChange={(value) => setValue("pricing.customForecastDays", value ? Number(value) : null)}
              options={FORECAST_DAYS_OPTIONS}
              placeholder="Auto"
              searchable={false}
              avoidKeyboard={false}
              onOpen={() => {}}
              onClose={() => {}}
            />
          </View>
        </View>
      </View>

      {/* Layout Approved */}
      <View style={[styles.fieldSection, { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }]}>
        <View style={styles.labelWithIcon}>
          <IconPhoto size={14} color={colors.mutedForeground} style={{ flexShrink: 0 }} />
          <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, marginBottom: 0, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
            Layout Aprovado
          </ThemedText>
        </View>
        <FilePicker
          value={layoutFiles}
          onChange={handleLayoutChange}
          maxFiles={1}
          placeholder="Selecione o layout aprovado"
          helperText="Arraste ou clique para selecionar"
          showCamera={true}
          showGallery={true}
          showFilePicker={false}
          acceptedFileTypes={["image/jpeg", "image/png", "image/gif", "image/webp"]}
        />
      </View>
    </View>
  );
}

// ============================================================================
// Step 2 - Services
// ============================================================================

function Step2Services({ control }: { control: any }) {
  const { colors } = useTheme();
  const { setValue, clearErrors } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pricing.items",
  });

  const pricingItems = useWatch({ control, name: "pricing.items" });
  const discountType = useWatch({ control, name: "pricing.discountType" }) || "NONE";
  const discountValue = useWatch({ control, name: "pricing.discountValue" });

  // Separate incomplete items (shown at top) from complete items (shown below in order)
  // An item is complete if it has a description with at least 3 characters
  const { incompleteIndices, completeIndices } = useMemo(() => {
    const incomplete: number[] = [];
    const complete: number[] = [];

    fields.forEach((field, index) => {
      const item = pricingItems?.[index];
      const isComplete = item?.description && item.description.trim().length >= 3;

      if (isComplete) {
        complete.push(index);
      } else {
        incomplete.push(index);
      }
    });

    return { incompleteIndices: incomplete, completeIndices: complete };
  }, [fields, pricingItems]);


  // Calculate subtotal
  const subtotal = useMemo(() => {
    if (!pricingItems || pricingItems.length === 0) return 0;
    return pricingItems.reduce((sum: number, item: any) => {
      const amount = typeof item.amount === "number" ? item.amount : Number(item.amount) || 0;
      return sum + amount;
    }, 0);
  }, [pricingItems]);

  // Calculate discount amount
  const discountAmount = useMemo(() => {
    if (discountType === "NONE" || !discountValue) return 0;
    if (discountType === "PERCENTAGE") return Math.round(((subtotal * discountValue) / 100) * 100) / 100;
    if (discountType === "FIXED_VALUE") return discountValue;
    return 0;
  }, [subtotal, discountType, discountValue]);

  const total = useMemo(() => Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100), [subtotal, discountAmount]);

  // Update form values
  useEffect(() => {
    if (pricingItems && pricingItems.length > 0) {
      setValue("pricing.subtotal", subtotal, { shouldDirty: false });
      setValue("pricing.total", total, { shouldDirty: false });
    }
  }, [subtotal, total, pricingItems, setValue]);

  const handleAddItem = useCallback(() => {
    clearErrors("pricing");
    append({ description: "", observation: null, amount: undefined });
  }, [append, clearErrors]);

  return (
    <View style={styles.fieldSection}>
      <ThemedText style={[styles.stepDescription, { color: colors.mutedForeground }]}>
        Adicione os serviços e defina os valores de cada item.
      </ThemedText>

      {/* Add Service Button */}
      <Button variant="outline" size="sm" onPress={handleAddItem} style={styles.addButton}>
        <IconPlus size={16} color={colors.foreground} />
        <ThemedText style={{ marginLeft: 4, fontSize: 14, color: colors.foreground }}>Adicionar Serviço</ThemedText>
      </Button>

      {/* Incomplete Items Section - Items being configured (shown at top) */}
      {incompleteIndices.length > 0 && (
        <View style={[styles.incompleteSection, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              Configurando Serviço
            </ThemedText>
            <ThemedText style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              Preencha a descrição
            </ThemedText>
          </View>
          {incompleteIndices.map((index) => (
            <ServiceItemRow
              key={fields[index].id}
              control={control}
              index={index}
              onRemove={() => remove(index)}
            />
          ))}
        </View>
      )}

      {/* Complete Items Section - Items with description (in their position order) */}
      {completeIndices.length > 0 && (
        <View>
          {completeIndices.map((index) => (
            <ServiceItemRow
              key={fields[index].id}
              control={control}
              index={index}
              onRemove={() => remove(index)}
            />
          ))}
        </View>
      )}

      {/* Totals */}
      {pricingItems && pricingItems.length > 0 && (
        <View style={[styles.fieldSection, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, marginTop: spacing.md }]}>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <View style={styles.labelWithIcon}>
                <IconCurrencyReal size={14} color={colors.mutedForeground} style={{ flexShrink: 0 }} />
                <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">Subtotal</ThemedText>
              </View>
              <View style={[styles.readOnlyField, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "500", color: colors.foreground }}>{formatCurrency(subtotal)}</ThemedText>
              </View>
            </View>
            <View style={styles.halfField}>
              <View style={styles.labelWithIcon}>
                <IconCurrencyReal size={14} color={colors.primary} style={{ flexShrink: 0 }} />
                <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">Valor Total</ThemedText>
              </View>
              <View style={[styles.readOnlyField, { borderColor: colors.primary, borderWidth: 2 }]}>
                <ThemedText style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.primary }}>{formatCurrency(total)}</ThemedText>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Service Item Row
// ============================================================================

function ServiceItemRow({ control, index, onRemove }: { control: any; index: number; onRemove: () => void }) {
  const { colors } = useTheme();
  const { setValue } = useFormContext();
  const [observationModal, setObservationModal] = useState({ visible: false, text: "" });

  const description = useWatch({ control, name: `pricing.items.${index}.description` });
  const amount = useWatch({ control, name: `pricing.items.${index}.amount` });
  const observation = useWatch({ control, name: `pricing.items.${index}.observation` });

  const descriptionOptions = useMemo(() => {
    const baseOptions = getServiceDescriptionsByType(SERVICE_ORDER_TYPE.PRODUCTION).map((desc) => ({
      value: desc,
      label: desc,
    }));

    // If the current description exists but isn't in the predefined list, add it to options
    // This ensures existing values can be displayed when editing
    if (description && description.trim().length > 0) {
      const descriptionExists = baseOptions.some(opt => opt.value === description);
      if (!descriptionExists) {
        return [{ value: description, label: description }, ...baseOptions];
      }
    }

    return baseOptions;
  }, [description]);

  const handleSaveObservation = () => {
    setValue(`pricing.items.${index}.observation`, observationModal.text || null);
    setObservationModal({ visible: false, text: observationModal.text });
  };

  const hasObservation = !!observation && observation.trim().length > 0;

  return (
    <View style={styles.itemRow}>
      <View style={{ width: "100%" }}>
        <Combobox
          value={description || ""}
          onValueChange={(v) => setValue(`pricing.items.${index}.description`, v || "")}
          options={descriptionOptions}
          placeholder="Selecione o serviço..."
          searchable
          clearable={false}
          avoidKeyboard={false}
          onOpen={() => {}}
          onClose={() => {}}
        />
      </View>
      <View style={styles.amountRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Input
            type="currency"
            value={amount ?? ""}
            onChange={(v) => setValue(`pricing.items.${index}.amount`, v)}
            placeholder="R$ 0,00"
          />
        </View>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: hasObservation ? colors.primary : colors.border, backgroundColor: hasObservation ? colors.primary + "15" : colors.card }]}
          onPress={() => setObservationModal({ visible: true, text: observation || "" })}
        >
          <IconNote size={16} color={hasObservation ? colors.primary : colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.border }]} onPress={onRemove}>
          <IconTrash size={16} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      {/* Observation Modal */}
      <Modal
        visible={observationModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setObservationModal({ visible: false, text: observation || "" })}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setObservationModal({ visible: false, text: observation || "" })}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <IconNote size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>Observação</ThemedText>
            </View>
            <TextInput
              value={observationModal.text}
              onChangeText={(t) => setObservationModal({ ...observationModal, text: t })}
              placeholder="Adicione notas ou detalhes adicionais..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              style={[styles.modalTextInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setObservationModal({ visible: false, text: observation || "" })}
              >
                <ThemedText style={{ color: colors.foreground }}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveObservation}>
                <RNText style={{ color: "#ffffff", fontSize: fontSize.sm, fontWeight: "600" }}>Salvar</RNText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stepContainer: {
    flex: 1,
  },
  card: {
    marginBottom: spacing.md,
  },
  stepDescription: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  fieldSection: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  halfField: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  readOnlyField: {
    height: 42,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.sm,
    minHeight: 80,
    textAlignVertical: "top",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.sm,
  },
  incompleteSection: {
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderStyle: "dashed",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  sectionHint: {
    fontSize: fontSize.xs,
  },
  itemRow: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.DEFAULT,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  modalTextInput: {
    fontSize: fontSize.sm,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
  },
  modalCancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalSaveBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
});
