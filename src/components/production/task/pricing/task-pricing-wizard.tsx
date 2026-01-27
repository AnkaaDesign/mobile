import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Modal,
  Pressable,
  Text as RNText,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, FormProvider, useFieldArray, useWatch, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconArrowLeft, IconArrowRight, IconCheck, IconX, IconPlus, IconTrash, IconNote, IconCalendar, IconCurrencyReal, IconPhoto } from "@tabler/icons-react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FormSteps } from "@/components/ui/form-steps";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
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

// Wizard form schema wrapping the nested pricing schema
const wizardSchema = z.object({
  pricing: taskPricingCreateNestedSchema,
});

type WizardFormData = z.infer<typeof wizardSchema>;

const WIZARD_STEPS = [
  { id: 1, name: "Configura\u00e7\u00e3o", description: "Dados b\u00e1sicos" },
  { id: 2, name: "Servi\u00e7os", description: "Itens e valores" },
  { id: 3, name: "Resumo", description: "Pr\u00e9via" },
];

// Payment condition options
const PAYMENT_CONDITIONS = [
  { value: "CASH", label: "\u00c0 vista" },
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

interface TaskPricingWizardProps {
  taskId: string;
}

export function TaskPricingWizard({ taskId }: TaskPricingWizardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      customer: true,
      truck: true,
      sector: true,
    },
  });
  const task = taskResponse?.data;

  // Fetch existing pricing for edit mode (404 = no pricing yet = create mode)
  const {
    data: pricingResponse,
    isLoading: pricingLoading,
    isError: pricingError,
  } = useTaskPricingByTask(taskId);
  const existingPricing = pricingError ? null : pricingResponse?.data;

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
        expiresAt: null,
        paymentCondition: null,
        customPaymentText: null,
        guaranteeYears: null,
        customGuaranteeText: null,
        layoutFileId: null,
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
    setValue("pricing.expiresAt", p.expiresAt ? new Date(p.expiresAt) : null);
    setValue("pricing.discountType", p.discountType || "NONE");
    setValue("pricing.discountValue", p.discountValue ?? null);
    setValue("pricing.subtotal", p.subtotal || 0);
    setValue("pricing.total", p.total || 0);
    setValue("pricing.paymentCondition", p.paymentCondition ?? null);
    setValue("pricing.customPaymentText", p.customPaymentText ?? null);
    setValue("pricing.guaranteeYears", p.guaranteeYears ?? null);
    setValue("pricing.customGuaranteeText", p.customGuaranteeText ?? null);
    setValue("pricing.layoutFileId", p.layoutFileId ?? null);

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

  // Watch pricing data for preview
  const pricingData = watch("pricing");

  // Build preview pricing object
  const previewPricing = useMemo(() => {
    if (!pricingData) return null;
    return {
      ...pricingData,
      budgetNumber: existingPricing?.budgetNumber,
      createdAt: existingPricing?.createdAt || new Date(),
      layoutFile: pricingData.layoutFileId
        ? { id: pricingData.layoutFileId }
        : existingPricing?.layoutFile || null,
    };
  }, [pricingData, existingPricing]);

  // Step navigation
  const goNext = useCallback(() => {
    if (currentStep < 3) setCurrentStep((s) => s + 1);
  }, [currentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  // Handle save
  const onSave = useCallback(async () => {
    const data = getValues();
    const items = data.pricing?.items || [];

    if (items.length === 0) {
      Alert.alert("Or\u00e7amento vazio", "Adicione pelo menos um servi\u00e7o antes de salvar.");
      return;
    }

    const invalidItems = items.filter(
      (item: any) => !item.description?.trim() || item.amount == null || item.amount < 0
    );
    if (invalidItems.length > 0) {
      Alert.alert("Dados incompletos", "Todos os servi\u00e7os precisam ter descri\u00e7\u00e3o e valor.");
      return;
    }

    if (!data.pricing?.expiresAt) {
      Alert.alert("Data de validade", "Selecione o per\u00edodo de validade do or\u00e7amento.");
      return;
    }

    try {
      setIsSaving(true);
      await updateAsync({
        id: taskId,
        data: { pricing: data.pricing } as any,
      });
      Alert.alert("Sucesso", "Or\u00e7amento salvo com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("[TaskPricingWizard] Save failed:", error);
      Alert.alert("Erro ao salvar", error?.message || "N\u00e3o foi poss\u00edvel salvar o or\u00e7amento.");
    } finally {
      setIsSaving(false);
    }
  }, [getValues, taskId, updateAsync, router]);

  // Loading state
  if (taskLoading || (pricingLoading && !pricingError)) {
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
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <IconX size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "center" }}>
              <ThemedText style={styles.headerTitle}>
                {existingPricing ? "Editar Or\u00e7amento" : "Novo Or\u00e7amento"}
              </ThemedText>
              {task?.name ? (
                <ThemedText style={{ fontSize: fontSize.xs, color: colors.mutedForeground }} numberOfLines={1}>
                  {task.name}
                </ThemedText>
              ) : null}
            </View>
            <View style={{ width: 40 }} />
          </View>
          <FormSteps steps={WIZARD_STEPS} currentStep={currentStep} />
        </View>

        {/* Content */}
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            {/* Step 1 - Basic Configuration */}
            {currentStep === 1 && (
              <Step1BasicConfig
                control={control}
                canEditStatus={canEditStatus}
                layoutFiles={layoutFiles}
                onLayoutFilesChange={setLayoutFiles}
              />
            )}

            {/* Step 2 - Services */}
            {currentStep === 2 && (
              <Step2Services control={control} />
            )}

            {/* Step 3 - Preview */}
            {currentStep === 3 && previewPricing && (
              <View style={styles.stepContainer}>
                <ThemedText style={[styles.stepTitle, { color: colors.foreground }]}>
                  Pr\u00e9via do Or\u00e7amento
                </ThemedText>
                <ThemedText style={[styles.stepDescription, { color: colors.mutedForeground }]}>
                  Revise o or\u00e7amento antes de salvar.
                </ThemedText>
                <BudgetPreview
                  pricing={previewPricing as any}
                  task={task ? {
                    name: task.name,
                    serialNumber: task.serialNumber,
                    term: task.term,
                    customer: task.customer,
                    negotiatingWith: (task as any).negotiatingWith,
                  } : undefined}
                />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card, paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.footerButtons}>
            {currentStep > 1 ? (
              <Button variant="outline" onPress={goPrev} style={styles.navButton}>
                <IconArrowLeft size={18} color={colors.foreground} />
                <ThemedText style={{ marginLeft: 4 }}>Voltar</ThemedText>
              </Button>
            ) : (
              <Button variant="outline" onPress={() => router.back()} style={styles.navButton}>
                <ThemedText>Cancelar</ThemedText>
              </Button>
            )}

            {currentStep < 3 ? (
              <Button variant="default" onPress={goNext} style={styles.navButton}>
                <ThemedText style={{ color: "#ffffff", marginRight: 4 }}>Pr\u00f3ximo</ThemedText>
                <IconArrowRight size={18} color="#ffffff" />
              </Button>
            ) : (
              <Button
                variant="default"
                onPress={onSave}
                disabled={isSaving}
                style={[styles.navButton, { backgroundColor: "#0a5c1e" }]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <IconCheck size={18} color="#ffffff" />
                    <ThemedText style={{ color: "#ffffff", marginLeft: 4 }}>Salvar</ThemedText>
                  </>
                )}
              </Button>
            )}
          </View>
        </View>
      </ThemedView>
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
  const paymentCondition = useWatch({ control, name: "pricing.paymentCondition" });
  const customPaymentText = useWatch({ control, name: "pricing.customPaymentText" });
  const guaranteeYears = useWatch({ control, name: "pricing.guaranteeYears" });
  const customGuaranteeText = useWatch({ control, name: "pricing.customGuaranteeText" });

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

  const handleValidityChange = useCallback((period: string) => {
    setValidityPeriod(period);
    const days = Number(period);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    expiryDate.setHours(23, 59, 59, 999);
    setValue("pricing.expiresAt", expiryDate);
  }, [setValue]);

  const handlePaymentChange = useCallback((value: string) => {
    if (value === "CUSTOM") {
      setShowCustomPayment(true);
      setValue("pricing.paymentCondition", "CUSTOM");
    } else {
      setShowCustomPayment(false);
      setValue("pricing.customPaymentText", null);
      setValue("pricing.paymentCondition", value);
    }
  }, [setValue]);

  const handleGuaranteeChange = useCallback((value: string) => {
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
    <View style={styles.stepContainer}>
      <ThemedText style={[styles.stepTitle, { color: colors.foreground }]}>
        {"Configura\u00e7\u00e3o do Or\u00e7amento"}
      </ThemedText>
      <ThemedText style={[styles.stepDescription, { color: colors.mutedForeground }]}>
        {"Defina status, validade, desconto, pagamento e garantia."}
      </ThemedText>

      {/* Status & Validity */}
      <View style={styles.fieldSection}>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <ThemedText style={[styles.label, { color: colors.foreground }]}>Status</ThemedText>
            <Combobox
              value={pricingStatus || "DRAFT"}
              onValueChange={(v) => setValue("pricing.status", v)}
              disabled={!canEditStatus}
              options={STATUS_OPTIONS}
              placeholder="Selecione"
              searchable={false}
            />
          </View>
          <View style={styles.halfField}>
            <View style={styles.labelWithIcon}>
              <IconCalendar size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, marginBottom: 0 }]}>
                Validade <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
              </ThemedText>
            </View>
            <Combobox
              value={validityPeriod}
              onValueChange={handleValidityChange}
              options={VALIDITY_PERIOD_OPTIONS}
              placeholder="Per\u00edodo"
              searchable={false}
            />
          </View>
        </View>
      </View>

      {/* Discount */}
      <View style={styles.fieldSection}>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <ThemedText style={[styles.label, { color: colors.foreground }]}>Tipo de Desconto</ThemedText>
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
            />
          </View>
          <View style={styles.halfField}>
            <ThemedText style={[styles.label, { color: colors.foreground }]}>
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

      {/* Payment & Guarantee */}
      <View style={[styles.fieldSection, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }]}>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <ThemedText style={[styles.label, { color: colors.foreground }]}>{"Condi\u00e7\u00e3o de Pagamento"}</ThemedText>
            <Combobox
              value={currentPaymentCondition}
              onValueChange={handlePaymentChange}
              options={PAYMENT_CONDITIONS.map((o) => ({ value: o.value, label: o.label }))}
              placeholder="Selecione"
              searchable={false}
            />
          </View>
          <View style={styles.halfField}>
            <ThemedText style={[styles.label, { color: colors.foreground }]}>{"Per\u00edodo de Garantia"}</ThemedText>
            <Combobox
              value={currentGuaranteeOption}
              onValueChange={handleGuaranteeChange}
              options={GUARANTEE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              placeholder="Selecione"
              searchable={false}
            />
          </View>
        </View>
      </View>

      {/* Custom Payment Text */}
      {showCustomPayment && (
        <View style={styles.fieldSection}>
          <ThemedText style={[styles.label, { color: colors.foreground }]}>Texto Personalizado de Pagamento</ThemedText>
          <TextInput
            value={customPaymentText || ""}
            onChangeText={(t) => setValue("pricing.customPaymentText", t || null)}
            placeholder="Descreva as condi\u00e7\u00f5es de pagamento..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            style={[styles.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>
      )}

      {/* Custom Guarantee Text */}
      {showCustomGuarantee && (
        <View style={styles.fieldSection}>
          <ThemedText style={[styles.label, { color: colors.foreground }]}>Texto Personalizado de Garantia</ThemedText>
          <TextInput
            value={customGuaranteeText || ""}
            onChangeText={(t) => setValue("pricing.customGuaranteeText", t || null)}
            placeholder="Descreva as condi\u00e7\u00f5es de garantia..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            style={[styles.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>
      )}

      {/* Layout Approved */}
      <View style={[styles.fieldSection, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }]}>
        <View style={styles.labelWithIcon}>
          <IconPhoto size={14} color={colors.mutedForeground} />
          <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, marginBottom: 0 }]}>
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
  const { setValue, getValues, clearErrors } = useFormContext();

  const { fields, append, prepend, remove } = useFieldArray({
    control,
    name: "pricing.items",
  });

  const pricingItems = useWatch({ control, name: "pricing.items" });
  const discountType = useWatch({ control, name: "pricing.discountType" }) || "NONE";
  const discountValue = useWatch({ control, name: "pricing.discountValue" });

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
    prepend({ description: "", observation: null, amount: undefined });
  }, [prepend, clearErrors]);

  return (
    <View style={styles.stepContainer}>
      <ThemedText style={[styles.stepTitle, { color: colors.foreground }]}>
        {"Servi\u00e7os e Valores"}
      </ThemedText>
      <ThemedText style={[styles.stepDescription, { color: colors.mutedForeground }]}>
        {"Adicione os servi\u00e7os e defina os valores de cada item."}
      </ThemedText>

      {/* Add Service Button */}
      <Button variant="outline" size="sm" onPress={handleAddItem} style={styles.addButton}>
        <IconPlus size={16} color={colors.foreground} />
        <ThemedText style={{ marginLeft: 4, fontSize: 14, color: colors.foreground }}>{"Adicionar Servi\u00e7o"}</ThemedText>
      </Button>

      {/* Service items */}
      {fields.map((field, index) => (
        <ServiceItemRow
          key={field.id}
          control={control}
          index={index}
          onRemove={() => remove(index)}
        />
      ))}

      {/* Totals */}
      {pricingItems && pricingItems.length > 0 && (
        <View style={[styles.fieldSection, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }]}>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <View style={styles.labelWithIcon}>
                <IconCurrencyReal size={14} color={colors.mutedForeground} />
                <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4 }]}>Subtotal</ThemedText>
              </View>
              <View style={[styles.readOnlyField, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "500", color: colors.foreground }}>{formatCurrency(subtotal)}</ThemedText>
              </View>
            </View>
            <View style={styles.halfField}>
              <View style={styles.labelWithIcon}>
                <IconCurrencyReal size={14} color={colors.primary} />
                <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4 }]}>Valor Total</ThemedText>
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
    return getServiceDescriptionsByType(SERVICE_ORDER_TYPE.PRODUCTION).map((desc) => ({
      value: desc,
      label: desc,
    }));
  }, []);

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
          placeholder="Selecione o servi\u00e7o..."
          searchable
          clearable={false}
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
              <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>{"Observa\u00e7\u00e3o"}</ThemedText>
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
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  stepContainer: {
    gap: spacing.md,
  },
  stepTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  stepDescription: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
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
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
