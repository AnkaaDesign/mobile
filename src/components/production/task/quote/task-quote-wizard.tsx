import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import { navigationTracker } from "@/utils/navigation-tracker";
import { useForm, FormProvider, useFieldArray, useWatch, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconPlus, IconTrash, IconNote, IconCalendar, IconCurrencyReal, IconPhoto, IconFileInvoice, IconFileSearch, IconUpload, IconArrowLeft, IconX, IconUser, IconInfoCircle, IconCreditCard } from "@tabler/icons-react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import { MultiStepFormContainer } from "@/components/forms";
import { DatePicker } from "@/components/ui/date-picker";
import { BudgetPreview } from "./budget-preview";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTaskDetail, useTaskMutations } from "@/hooks/useTask";
import { useTaskQuoteByTask } from "@/hooks/useTaskQuote";
import { taskQuoteCreateNestedSchema } from "@/schemas/task-quote";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SERVICE_ORDER_TYPE, DISCOUNT_TYPE } from "@/constants/enums";
import { DISCOUNT_TYPE_LABELS } from "@/constants/enum-labels";
import { RESPONSIBLE_ROLE_LABELS } from "@/types/responsible";
import { getServiceDescriptionsByType } from "@/constants/service-descriptions";
import { formatCurrency } from "@/utils";
import { ONLINE_API_URL } from "@/constants/api";
import { Image } from "expo-image";
import { useFileViewer } from "@/components/file";
import { useKeyboardAwareForm } from "@/contexts/KeyboardAwareFormContext";
import { getCustomers } from "@/api-client/customer";
import {
  computeServiceDiscount,
  computeServiceNet,
  computeCustomerConfigTotals,
} from "@/utils/task-quote-calculations";
import {
  getQuoteServicesToAddFromServiceOrders,
  type SyncServiceOrder,
} from "@/utils/task-quote-service-order-sync";
import type { FormStep } from "@/components/ui/form-steps";

interface ArtworkOption {
  id: string;
  artworkId?: string;
  filename?: string;
  originalName?: string;
  thumbnailUrl?: string | null;
  status?: string;
  mimetype?: string;
  size?: number;
}

// Wizard form schema wrapping the nested quote schema
const wizardSchema = z.object({
  pricing: taskQuoteCreateNestedSchema,
});

type WizardFormData = z.infer<typeof wizardSchema>;

// Payment condition options
const PAYMENT_CONDITIONS = [
  { value: "CASH_5", label: "À vista (5 dias)" },
  { value: "CASH_40", label: "À vista (40 dias)" },
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
  { value: "PENDING", label: "Pendente" },
  { value: "BUDGET_APPROVED", label: "Orçamento Aprovado" },
  { value: "VERIFIED_BY_FINANCIAL", label: "Verificado pelo Financeiro" },
  { value: "BILLING_APPROVED", label: "Faturamento Aprovado" },
  { value: "UPCOMING", label: "A Vencer" },
  { value: "DUE", label: "Vencido" },
  { value: "PARTIAL", label: "Parcial" },
  { value: "SETTLED", label: "Liquidado" },
];

// Forecast days options (1-30)
const FORECAST_DAYS_OPTIONS = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} ${i + 1 === 1 ? 'dia' : 'dias'}`,
}));

interface TaskQuoteWizardProps {
  taskId: string;
}

export function TaskQuoteWizard({ taskId }: TaskQuoteWizardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [layoutFiles, setLayoutFiles] = useState<FilePickerItem[]>([]);
  const customersCache = useRef<Map<string, any>>(new Map());
  const [selectedCustomers, setSelectedCustomers] = useState<Map<string, any>>(new Map());

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
          stateRegistration: true,
          address: true,
          addressNumber: true,
          neighborhood: true,
          city: true,
          state: true,
          zipCode: true,
        },
      },
      truck: {
        select: {
          id: true,
          plate: true,
          chassisNumber: true,
          model: true,
        },
      },
      sector: {
        select: {
          id: true,
          name: true,
        },
      },
      responsibles: true,
      artworks: {
        include: {
          file: true,
        },
      },
      serviceOrders: true,
    },
  });
  const task = taskResponse?.data;

  // Fetch existing pricing for edit mode
  const {
    data: pricingResponse,
    isLoading: pricingLoading,
  } = useTaskQuoteByTask(taskId);
  const existingPricing = pricingResponse?.data;

  // Task mutations for saving
  const { updateAsync } = useTaskMutations();

  // Form setup
  const methods = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      pricing: {
        status: "PENDING",
        services: [],
        subtotal: 0,
        total: 0,
        expiresAt: (() => {
          const defaultExpiry = new Date();
          defaultExpiry.setDate(defaultExpiry.getDate() + 30);
          defaultExpiry.setHours(23, 59, 59, 999);
          return defaultExpiry;
        })(),
        guaranteeYears: null,
        customGuaranteeText: null,
        layoutFileId: null,
        customForecastDays: null,
        simultaneousTasks: null,
        customerConfigs: [],
      },
    },
    mode: "onChange",
  });

  const { control, setValue, getValues, watch } = methods;

  // Pre-populate form when existing pricing loads
  useEffect(() => {
    if (!existingPricing) return;

    const p = existingPricing;
    setValue("pricing.status", p.status || "PENDING");
    setValue("pricing.expiresAt", p.expiresAt ? new Date(p.expiresAt) : (() => {
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 30);
      defaultExpiry.setHours(23, 59, 59, 999);
      return defaultExpiry;
    })());
    setValue("pricing.subtotal", p.subtotal || 0);
    setValue("pricing.total", p.total || 0);
    setValue("pricing.guaranteeYears", p.guaranteeYears ?? null);
    setValue("pricing.customGuaranteeText", p.customGuaranteeText ?? null);
    setValue("pricing.layoutFileId", p.layoutFileId ?? null);
    setValue("pricing.customForecastDays", p.customForecastDays ?? null);
    setValue("pricing.simultaneousTasks", p.simultaneousTasks ?? null);
    setValue("pricing.customerConfigs", p.customerConfigs?.map((c: any) => ({
      customerId: c.customerId || c.id || c,
      subtotal: c.subtotal ?? 0,
      total: c.total ?? 0,
      paymentCondition: c.paymentCondition ?? null,
      customPaymentText: c.customPaymentText ?? null,
      responsibleId: c.responsibleId ?? null,
      generateInvoice: c.generateInvoice ?? true,
    })) || []);

    if (p.services && p.services.length > 0) {
      setValue(
        "pricing.services",
        p.services.map((item: any) => ({
          id: item.id,
          description: item.description || "",
          observation: item.observation ?? null,
          amount: item.amount ?? null,
          discountType: item.discountType || 'NONE',
          discountValue: item.discountValue ?? null,
          discountReference: item.discountReference ?? null,
          invoiceToCustomerId: item.invoiceToCustomerId ?? null,
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

    // Initialize customers cache from existing configs
    if (p.customerConfigs && p.customerConfigs.length > 0) {
      const customers = p.customerConfigs
        .map((c: any) => c.customer)
        .filter(Boolean);
      customers.forEach((c: any) => customersCache.current.set(c.id, c));
      setSelectedCustomers(new Map(customers.map((c: any) => [c.id, c])));
    }
  }, [existingPricing, setValue]);

  // Dynamic steps based on customer count
  const customerConfigs = watch("pricing.customerConfigs");
  const steps = useMemo(() => {
    const base: FormStep[] = [
      { id: 1, name: "Informações", description: "Dados e clientes" },
      { id: 2, name: "Serviços", description: "Itens e valores" },
    ];
    if (Array.isArray(customerConfigs)) {
      customerConfigs.forEach((config: any, i: number) => {
        const customer = customersCache.current.get(config?.customerId);
        base.push({
          id: 3 + i,
          name: "Pagamento",
          description: customer?.fantasyName || "Cliente",
        });
      });
    }
    base.push({
      id: base.length + 1,
      name: "Resumo",
      description: "Prévia",
    });
    return base;
  }, [customerConfigs]);

  const totalSteps = steps.length;

  // Clamp current step when customer count changes
  useEffect(() => {
    if (currentStep > totalSteps) {
      setCurrentStep(totalSteps);
    }
  }, [totalSteps, currentStep]);

  // Watch pricing data for preview
  const pricingData = watch("pricing");
  const formValues = watch();

  const customerCount = Array.isArray(customerConfigs) ? customerConfigs.length : 0;

  // Build preview pricing object
  const previewPricing = (() => {
    if (!pricingData) return null;

    let layoutFileForPreview = null;
    if (layoutFiles.length > 0) {
      const pickedFile = layoutFiles[0];
      layoutFileForPreview = pickedFile.uploaded && pickedFile.id
        ? { id: pickedFile.id }
        : { uri: pickedFile.uri };
    } else if (pricingData.layoutFileId) {
      layoutFileForPreview = { id: pricingData.layoutFileId };
    } else if (existingPricing?.layoutFile) {
      layoutFileForPreview = existingPricing.layoutFile;
    }

    return {
      ...pricingData,
      services: pricingData.services ? [...pricingData.services] : [],
      budgetNumber: existingPricing?.budgetNumber,
      createdAt: existingPricing?.createdAt || new Date(),
      layoutFile: layoutFileForPreview,
    };
  })();

  // Validation
  const canProceedFromStep1 = useMemo(() => {
    const configs = Array.isArray(customerConfigs) ? customerConfigs : [];
    return configs.length > 0 && !!pricingData?.expiresAt;
  }, [customerConfigs, pricingData]);

  const canProceedFromStep2 = useMemo(() => {
    const allItems = formValues?.pricing?.services || [];
    const items = allItems.filter(
      (item: any) => item && item.description && item.description.trim() !== ''
    );
    if (items.length === 0) return false;
    return items.every((item: any) => {
      const hasDescription = !!(item.description?.trim());
      const numAmount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
      const hasValidAmount =
        numAmount == null ||
        (typeof numAmount === 'number' && !isNaN(numAmount) && numAmount >= 0);
      return hasDescription && hasValidAmount;
    });
  }, [formValues]);

  const isLastStep = currentStep === totalSteps;
  const canSubmit = useMemo(() => {
    return canProceedFromStep2 && isLastStep;
  }, [canProceedFromStep2, isLastStep]);

  // Step navigation
  const goNext = useCallback(() => {
    if (currentStep === 1 && !canProceedFromStep1) {
      const configs = Array.isArray(customerConfigs) ? customerConfigs : [];
      if (configs.length === 0) {
        Alert.alert("Cliente obrigatório", "Selecione pelo menos um cliente para faturamento.");
      } else {
        Alert.alert("Campo obrigatório", "Selecione o período de validade do orçamento.");
      }
      return;
    }
    if (currentStep === 2 && !canProceedFromStep2) {
      const items = (pricingData?.services || []).filter(
        (item: any) => item && item.description && item.description.trim() !== ''
      );
      if (items.length === 0) {
        Alert.alert("Orçamento vazio", "Adicione pelo menos um serviço antes de continuar.");
      } else {
        Alert.alert("Dados incompletos", "Todos os serviços precisam ter descrição e valor.");
      }
      return;
    }
    if (currentStep < totalSteps) setCurrentStep((s) => s + 1);
  }, [currentStep, canProceedFromStep1, canProceedFromStep2, pricingData, customerConfigs, totalSteps]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  // Handle save
  const onSave = useCallback(async () => {
    const data = getValues();
    const items = data.pricing?.services || [];

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

      const toNumber = (v: any): number | null => {
        if (v === null || v === undefined || v === '') return null;
        if (typeof v === 'number') return v;
        const n = Number(v);
        return isNaN(n) ? null : n;
      };
      const pricingPayload = { ...data.pricing };
      pricingPayload.subtotal = toNumber(pricingPayload.subtotal) ?? 0;
      pricingPayload.total = toNumber(pricingPayload.total) ?? 0;
      pricingPayload.guaranteeYears = toNumber(pricingPayload.guaranteeYears);
      pricingPayload.customForecastDays = toNumber(pricingPayload.customForecastDays);
      pricingPayload.simultaneousTasks = toNumber(pricingPayload.simultaneousTasks);
      if (pricingPayload.services) {
        pricingPayload.services = (Array.isArray(pricingPayload.services)
          ? pricingPayload.services
          : Object.values(pricingPayload.services)
        ).map((svc: any) => ({
          ...svc,
          amount: toNumber(svc.amount) ?? 0,
        }));
      }
      if (pricingPayload.customerConfigs) {
        if (!Array.isArray(pricingPayload.customerConfigs)) {
          pricingPayload.customerConfigs = Object.values(pricingPayload.customerConfigs);
        }
        pricingPayload.customerConfigs = pricingPayload.customerConfigs.map((config: any) => ({
          ...config,
          subtotal: toNumber(config.subtotal) ?? 0,
          total: toNumber(config.total) ?? 0,
        }));
      }
      const newLayoutFiles = layoutFiles.filter(f => !f.uploaded);

      if (newLayoutFiles.length > 0) {
        const formData = new FormData();
        const layoutFile = newLayoutFiles[0];
        formData.append('quoteLayoutFile', {
          uri: layoutFile.uri,
          type: layoutFile.type,
          name: layoutFile.name,
        } as any);
        formData.append('quote', JSON.stringify(pricingPayload));

        await updateAsync({
          id: taskId,
          data: formData as any,
        });
      } else {
        await updateAsync({
          id: taskId,
          data: { quote: pricingPayload } as any,
        });
      }

      methods.reset();
      setCurrentStep(1);
      setLayoutFiles([]);

      const source = navigationTracker.getSource();
      let detailRoute: string;
      if (source?.includes('/agenda')) {
        detailRoute = `/(tabs)/producao/agenda/detalhes/${taskId}`;
      } else if (source?.includes('/historico')) {
        detailRoute = `/(tabs)/producao/historico/detalhes/${taskId}`;
      } else {
        detailRoute = `/(tabs)/producao/cronograma/detalhes/${taskId}`;
      }
      router.replace(detailRoute as any);
    } catch (error: any) {
      console.error("[TaskQuoteWizard] Save failed:", error);
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

  const canProceed = currentStep === 1
    ? canProceedFromStep1
    : currentStep === 2
    ? canProceedFromStep2
    : true;

  return (
    <FormProvider {...methods}>
      <MultiStepFormContainer
        steps={steps}
        currentStep={currentStep}
        onPrevStep={goPrev}
        onNextStep={goNext}
        onSubmit={onSave}
        onCancel={handleCancel}
        isSubmitting={isSaving}
        canProceed={canProceed}
        canSubmit={canSubmit}
        submitLabel="Salvar"
        cancelLabel="Cancelar"
        scrollable={true}
      >
        {/* Step 1 - Info & Customers */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Informações do Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <Step1Info
                  control={control}
                  task={task}
                  canEditStatus={canEditStatus}
                  layoutFiles={layoutFiles}
                  onLayoutFilesChange={setLayoutFiles}
                  artworks={(task?.artworks || []).map((artwork: any) => {
                    const file = artwork.file || artwork;
                    return {
                      id: file.id,
                      artworkId: artwork.artworkId || artwork.id,
                      filename: file.filename,
                      originalName: file.originalName,
                      thumbnailUrl: file.thumbnailUrl,
                      status: artwork.status,
                      mimetype: file.mimetype,
                      size: file.size,
                    };
                  })}
                  customersCache={customersCache}
                  selectedCustomers={selectedCustomers}
                  setSelectedCustomers={setSelectedCustomers}
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
                <Step2Services
                  control={control}
                  task={task}
                  selectedCustomers={selectedCustomers}
                />
              </CardContent>
            </Card>
          </View>
        )}

        {/* Steps 3..N - Customer Payment (dynamic) */}
        {currentStep > 2 && currentStep <= 2 + customerCount && (() => {
          const configIndex = currentStep - 3;
          const config = customerConfigs?.[configIndex];
          const customer = config
            ? customersCache.current.get(config.customerId)
            : null;
          return (
            <View style={styles.stepContainer}>
              <Card style={styles.card}>
                <CardHeader>
                  <CardTitle>
                    Pagamento - {customer?.fantasyName || customer?.corporateName || "Cliente"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StepCustomerPayment
                    key={`customer-config-${configIndex}`}
                    control={control}
                    configIndex={configIndex}
                    customer={customer}
                    taskResponsibles={task?.responsibles}
                  />
                </CardContent>
              </Card>
            </View>
          );
        })()}

        {/* Last Step - Preview */}
        {currentStep === totalSteps && previewPricing && (
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
                    responsibles: task.responsibles,
                  } : undefined}
                  selectedCustomers={selectedCustomers}
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
// Step 1 - Info & Customers
// ============================================================================

interface Step1Props {
  control: any;
  task: any;
  canEditStatus: boolean;
  layoutFiles: FilePickerItem[];
  onLayoutFilesChange: (files: FilePickerItem[]) => void;
  artworks?: ArtworkOption[];
  customersCache: React.MutableRefObject<Map<string, any>>;
  selectedCustomers: Map<string, any>;
  setSelectedCustomers: (customers: Map<string, any>) => void;
}

function Step1Info({
  control,
  task,
  canEditStatus,
  layoutFiles,
  onLayoutFilesChange,
  artworks,
  customersCache,
  selectedCustomers,
  setSelectedCustomers,
}: Step1Props) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();
  const { setValue, getValues } = useFormContext();
  const keyboardContext = useKeyboardAwareForm();
  const [validityPeriod, setValidityPeriod] = useState<string>("");
  const [showCustomGuarantee, setShowCustomGuarantee] = useState(false);
  const [showLayoutUploadMode, setShowLayoutUploadMode] = useState(false);

  const pricingStatus = useWatch({ control, name: "pricing.status" }) || "PENDING";
  const guaranteeYears = useWatch({ control, name: "pricing.guaranteeYears" });
  const customGuaranteeText = useWatch({ control, name: "pricing.customGuaranteeText" });
  const simultaneousTasks = useWatch({ control, name: "pricing.simultaneousTasks" });
  const customForecastDays = useWatch({ control, name: "pricing.customForecastDays" });
  const customerConfigsValue = useWatch({ control, name: "pricing.customerConfigs" }) || [];

  // Initialize
  useEffect(() => {
    const expiresAt = getValues("pricing.expiresAt");
    if (expiresAt) {
      const diffDays = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const closest = [15, 30, 60, 90].find(d => Math.abs(d - diffDays) <= 3);
      setValidityPeriod(closest ? closest.toString() : "30");
    } else {
      setValidityPeriod("30");
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      expiryDate.setHours(23, 59, 59, 999);
      setValue("pricing.expiresAt", expiryDate);
      setValue("pricing.status", "PENDING");
    }
    if (customGuaranteeText) setShowCustomGuarantee(true);
  }, []);

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

  // Handle artwork selection as layout file
  const UPLOAD_NEW_SENTINEL = "__UPLOAD_NEW__";
  const handleArtworkSelect = useCallback((value: string | string[] | null | undefined) => {
    const fileId = typeof value === "string" ? value : null;
    if (fileId === "__UPLOAD_NEW__") {
      setShowLayoutUploadMode(true);
      return;
    }
    if (fileId) {
      const artwork = artworks?.find(a => a.id === fileId);
      if (artwork) {
        const fileItem: FilePickerItem = {
          id: artwork.id,
          name: artwork.originalName || artwork.filename || "artwork",
          size: artwork.size || 0,
          type: artwork.mimetype || "image/png",
          uploaded: true,
          uri: `${ONLINE_API_URL}/files/thumbnail/${artwork.id}`,
        };
        onLayoutFilesChange([fileItem]);
        setValue("pricing.layoutFileId", artwork.id);
        setShowLayoutUploadMode(false);
      }
    } else {
      onLayoutFilesChange([]);
      setValue("pricing.layoutFileId", null);
    }
  }, [artworks, setValue, onLayoutFilesChange]);

  // Artwork options (image artworks + "upload new" action)
  const artworkOptions = useMemo(() => {
    if (!artworks || artworks.length === 0) return [];
    const imageArtworks = artworks.filter(a => {
      const mime = a.mimetype || "";
      return mime.startsWith("image/");
    });
    if (imageArtworks.length === 0) return [];
    return [
      ...imageArtworks,
      { id: UPLOAD_NEW_SENTINEL, filename: "Enviar novo arquivo" } as ArtworkOption,
    ];
  }, [artworks]);

  const renderArtworkOption = useCallback((artwork: ArtworkOption) => {
    if (artwork.id === UPLOAD_NEW_SENTINEL) {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 }}>
          <View style={{
            width: 48, height: 48, borderRadius: 8, overflow: "hidden",
            backgroundColor: colors.muted + "50", borderWidth: 1, borderStyle: "dashed",
            borderColor: colors.border, alignItems: "center", justifyContent: "center",
          }}>
            <IconUpload size={20} color={colors.mutedForeground} />
          </View>
          <ThemedText style={{ fontSize: 13, color: colors.mutedForeground }}>
            Enviar novo arquivo
          </ThemedText>
        </View>
      );
    }
    const thumbnailSrc = artwork.thumbnailUrl
      ? artwork.thumbnailUrl
      : `${ONLINE_API_URL}/files/thumbnail/${artwork.id}`;
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 }}>
        <View style={{
          width: 48, height: 48, borderRadius: 8, overflow: "hidden",
          backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border,
        }}>
          <Image source={{ uri: thumbnailSrc }} style={{ width: 48, height: 48 }} contentFit="cover" />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontSize: 13 }} numberOfLines={1} ellipsizeMode="tail">
            {artwork.originalName || artwork.filename || "Arquivo"}
          </ThemedText>
          {artwork.status && (
            <ThemedText style={{ fontSize: 11, color: colors.mutedForeground }}>
              {artwork.status === "APPROVED" ? "Aprovado" : artwork.status === "REPROVED" ? "Reprovado" : "Rascunho"}
            </ThemedText>
          )}
        </View>
      </View>
    );
  }, [colors]);

  const currentLayoutFileId = useWatch({ control, name: "pricing.layoutFileId" });

  // Customer search (async queryFn for Combobox)
  const searchCustomers = useCallback(async (search: string, page: number = 1) => {
    try {
      const params: any = {
        orderBy: { fantasyName: "asc" },
        page,
        take: 50,
      };
      if (search?.trim()) params.searchingFor = search.trim();
      const response = await getCustomers(params);
      const customers = response.data || [];
      customers.forEach((c: any) => customersCache.current.set(c.id, c));
      return {
        data: customers.map((c: any) => ({
          value: c.id,
          label: c.fantasyName || c.corporateName || "Cliente",
        })),
        hasMore: response.meta?.hasNextPage || false,
      };
    } catch {
      return { data: [], hasMore: false };
    }
  }, [customersCache]);

  // Handle customer selection change
  const handleCustomerChange = useCallback((newIds: string | string[] | null | undefined) => {
    const ids = Array.isArray(newIds) ? newIds : newIds ? [newIds] : [];
    const currentConfigs: any[] = Array.isArray(customerConfigsValue) ? customerConfigsValue : [];
    const newConfigs = ids.map((id: string) => {
      const existing = currentConfigs.find((c: any) => c.customerId === id);
      if (existing) return existing;
      return {
        customerId: id,
        subtotal: 0,
        total: 0,
        paymentCondition: null,
        customPaymentText: null,
        responsibleId: null,
        generateInvoice: true,
      };
    });
    setValue("pricing.customerConfigs", newConfigs);

    const newMap = new Map<string, any>();
    ids.forEach((id: string) => {
      const cached = customersCache.current.get(id);
      if (cached) newMap.set(id, cached);
    });
    setSelectedCustomers(newMap);
  }, [customerConfigsValue, setValue, customersCache, setSelectedCustomers]);

  const selectedCustomerIds = useMemo(() => {
    if (!Array.isArray(customerConfigsValue)) return [];
    return customerConfigsValue.map((c: any) => c.customerId).filter(Boolean);
  }, [customerConfigsValue]);

  // Customer options for combobox - combine cached selected customers with search results
  const customerOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    selectedCustomers.forEach((c, id) => {
      options.push({
        value: id,
        label: c.fantasyName || c.corporateName || "Cliente",
      });
    });
    return options;
  }, [selectedCustomers]);

  return (
    <View style={styles.fieldSection}>
      {/* Task Info Card (read-only) */}
      {task && (
        <View style={[styles.infoCard, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm }}>
            <IconInfoCircle size={14} color={colors.mutedForeground} />
            <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "600", color: colors.foreground }}>
              Dados da Tarefa
            </ThemedText>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            <View style={{ minWidth: 80 }}>
              <ThemedText style={{ fontSize: 11, color: colors.mutedForeground }}>Tarefa</ThemedText>
              <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "500" }}>{task.name || "-"}</ThemedText>
            </View>
            <View style={{ minWidth: 80 }}>
              <ThemedText style={{ fontSize: 11, color: colors.mutedForeground }}>Cliente</ThemedText>
              <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "500" }}>
                {task.customer?.fantasyName || task.customer?.corporateName || "-"}
              </ThemedText>
            </View>
            {task.serialNumber && (
              <View style={{ minWidth: 80 }}>
                <ThemedText style={{ fontSize: 11, color: colors.mutedForeground }}>Nº Série</ThemedText>
                <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "500" }}>{task.serialNumber}</ThemedText>
              </View>
            )}
            {task.truck?.plate && (
              <View style={{ minWidth: 80 }}>
                <ThemedText style={{ fontSize: 11, color: colors.mutedForeground }}>Placa</ThemedText>
                <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "500" }}>{task.truck.plate.toUpperCase()}</ThemedText>
              </View>
            )}
            {task.truck?.chassisNumber && (
              <View style={{ minWidth: 80 }}>
                <ThemedText style={{ fontSize: 11, color: colors.mutedForeground }}>Chassi</ThemedText>
                <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "500" }}>{task.truck.chassisNumber}</ThemedText>
              </View>
            )}
            {task.finishedAt && (
              <View style={{ minWidth: 80 }}>
                <ThemedText style={{ fontSize: 11, color: colors.mutedForeground }}>Finalização</ThemedText>
                <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "500" }}>
                  {new Date(task.finishedAt).toLocaleDateString("pt-BR")}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Customer Selection */}
      <View style={[styles.fieldSection, { marginTop: spacing.md }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.xs }}>
          <IconUser size={14} color={colors.mutedForeground} />
          <ThemedText style={[styles.label, { color: colors.foreground, marginBottom: 0 }]}>
            Faturar Para (Clientes) <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
          </ThemedText>
        </View>
        <Combobox
          value={selectedCustomerIds}
          onValueChange={handleCustomerChange}
          mode="multiple"
          async
          queryKey={["customers", "quote-invoice-selector"]}
          queryFn={searchCustomers}
          initialOptions={customerOptions}
          placeholder="Selecione clientes para faturamento..."
          searchable
          minSearchLength={0}
          debounceMs={500}
        />
        {selectedCustomers.size > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs }}>
            {Array.from(selectedCustomers.values()).map((customer) => (
              <TouchableOpacity
                key={customer.id}
                onPress={() => {
                  const newIds = selectedCustomerIds.filter((id: string) => id !== customer.id);
                  handleCustomerChange(newIds);
                }}
                style={[styles.customerBadge, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <ThemedText style={{ fontSize: 12, fontWeight: "500" }}>
                  {customer.fantasyName || customer.corporateName}
                </ThemedText>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Customer NFS-e/Invoice Data Cards */}
        {selectedCustomers.size > 0 && (
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            {Array.from(selectedCustomers.entries()).map(([id, customer], index) => {
              const missingFields: string[] = [];
              if (!customer.cnpj && !customer.cpf) missingFields.push("CNPJ/CPF");
              if (!customer.corporateName) missingFields.push("Razão Social");
              if (!customer.city || !customer.state) missingFields.push("Cidade/Estado");
              if (!customer.address) missingFields.push("Endereço");

              return (
                <View
                  key={id}
                  style={[styles.infoCard, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs }}>
                    <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "600" }}>
                      Cliente {index + 1}
                    </ThemedText>
                    {missingFields.length > 0 && (
                      <View style={{ backgroundColor: colors.destructive, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <ThemedText style={{ fontSize: 10, color: "#fff", fontWeight: "600" }}>
                          Dados incompletos
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <ThemedText style={{ fontSize: 12, color: colors.mutedForeground }}>Razão Social</ThemedText>
                      <ThemedText style={{ fontSize: 12, fontWeight: "500" }} numberOfLines={1}>
                        {customer.corporateName || customer.fantasyName || "-"}
                      </ThemedText>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <ThemedText style={{ fontSize: 12, color: colors.mutedForeground }}>
                        {customer.cnpj ? "CNPJ" : "CPF"}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, fontWeight: "500" }}>
                        {customer.cnpj || customer.cpf || (
                          <ThemedText style={{ fontSize: 11, color: colors.destructive }}>Não informado</ThemedText>
                        )}
                      </ThemedText>
                    </View>
                    {customer.stateRegistration ? (
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <ThemedText style={{ fontSize: 12, color: colors.mutedForeground }}>IE</ThemedText>
                        <ThemedText style={{ fontSize: 12, fontWeight: "500" }}>{customer.stateRegistration}</ThemedText>
                      </View>
                    ) : null}
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <ThemedText style={{ fontSize: 12, color: colors.mutedForeground }}>Endereço</ThemedText>
                      <ThemedText style={{ fontSize: 12, fontWeight: "500", flex: 1, textAlign: "right", marginLeft: spacing.md }} numberOfLines={2}>
                        {[customer.address, customer.addressNumber, customer.neighborhood, customer.city, customer.state].filter(Boolean).join(", ") || (
                          <ThemedText style={{ fontSize: 11, color: colors.destructive }}>Não informado</ThemedText>
                        )}
                        {customer.zipCode ? ` — ${customer.zipCode}` : ""}
                      </ThemedText>
                    </View>
                  </View>

                  {missingFields.length > 0 && (
                    <ThemedText style={{ fontSize: 11, color: colors.destructive, marginTop: spacing.xs }}>
                      Campos faltantes: {missingFields.join(", ")}
                    </ThemedText>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Status & Validity */}
      <View style={[styles.row, { marginTop: spacing.md }]}>
        <View style={styles.halfField}>
          <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Status</ThemedText>
          <Combobox
            value={pricingStatus || "PENDING"}
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
          <View onLayout={keyboardContext ? (e) => keyboardContext.onFieldLayout('pricing-custom-guarantee', e) : undefined}>
            <TextInput
              value={customGuaranteeText || ""}
              onChangeText={(t) => setValue("pricing.customGuaranteeText", t || null)}
              placeholder="Descreva as condições de garantia..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={[styles.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              onFocus={() => keyboardContext?.onFieldFocus('pricing-custom-guarantee')}
            />
          </View>
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

        {/* Artwork selector mode */}
        {artworkOptions.length > 0 && !showLayoutUploadMode && (
          <>
            <Combobox<ArtworkOption>
              value={currentLayoutFileId || ""}
              onValueChange={handleArtworkSelect}
              options={artworkOptions}
              getOptionValue={(a) => a.id}
              getOptionLabel={(a) => a.originalName || a.filename || "Arquivo"}
              renderOption={renderArtworkOption}
              placeholder="Selecionar uma arte existente..."
              emptyText="Nenhuma arte de imagem encontrada"
              clearable
              searchable
            />

            {/* Selected artwork full image preview */}
            {currentLayoutFileId && artworkOptions.some(a => a.id === currentLayoutFileId) && (
              <View style={{
                backgroundColor: colors.muted + "30",
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginTop: spacing.sm,
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
                  <ThemedText style={{ fontSize: 11, color: colors.mutedForeground, flex: 1 }} numberOfLines={1}>
                    {artworkOptions.find(a => a.id === currentLayoutFileId)?.originalName
                      || artworkOptions.find(a => a.id === currentLayoutFileId)?.filename
                      || "Layout selecionado"}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => handleArtworkSelect(null)}
                    style={{ padding: 4 }}
                  >
                    <IconX size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    const selectedArtwork = artworkOptions.find(a => a.id === currentLayoutFileId);
                    if (selectedArtwork) {
                      fileViewer.actions.viewFile({
                        id: selectedArtwork.id,
                        filename: selectedArtwork.filename,
                        originalName: selectedArtwork.originalName,
                        mimetype: selectedArtwork.mimetype || "image/png",
                        size: selectedArtwork.size,
                      } as any);
                    }
                  }}
                >
                  <Image
                    source={{ uri: `${ONLINE_API_URL}/files/thumbnail/${currentLayoutFileId}` }}
                    style={{ height: 192, width: "100%", borderRadius: borderRadius.md }}
                    contentFit="contain"
                  />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* File upload mode */}
        {(artworkOptions.length === 0 || showLayoutUploadMode) && (
          <>
            {artworkOptions.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowLayoutUploadMode(false)}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}
              >
                <IconArrowLeft size={13} color={colors.mutedForeground} />
                <ThemedText style={{ fontSize: 12, color: colors.mutedForeground }}>
                  Voltar para seleção de artes
                </ThemedText>
              </TouchableOpacity>
            )}
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
          </>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Step 2 - Services
// ============================================================================

interface Step2ServicesProps {
  control: any;
  task: any;
  selectedCustomers: Map<string, any>;
}

function Step2Services({ control, task, selectedCustomers }: Step2ServicesProps) {
  const { colors } = useTheme();
  const { setValue, getValues, clearErrors } = useFormContext();
  const [syncedOnMount, setSyncedOnMount] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pricing.services",
  });

  const pricingItems = useWatch({ control, name: "pricing.services" });
  const watchedCustomerConfigs = useWatch({ control, name: "pricing.customerConfigs" });

  // Service order sync on mount
  useEffect(() => {
    if (syncedOnMount || !task) return;
    setSyncedOnMount(true);

    const serviceOrders: SyncServiceOrder[] = (task.serviceOrders || []).filter(
      (so: any) => so.type === SERVICE_ORDER_TYPE.PRODUCTION,
    );
    if (serviceOrders.length === 0) return;

    const currentServices = getValues("pricing.services") || [];
    const toAdd = getQuoteServicesToAddFromServiceOrders(
      serviceOrders,
      currentServices,
    );
    if (toAdd.length > 0) {
      toAdd.forEach((svc) => {
        append(
          {
            description: svc.description,
            observation: svc.observation || null,
            amount: svc.amount ?? 0,
            invoiceToCustomerId: null,
            discountType: "NONE",
            discountValue: null,
            discountReference: null,
          },
          { shouldFocus: false },
        );
      });
    }
  }, [task, syncedOnMount, getValues, append]);

  // Auto-calculate per-customer subtotals/totals
  useEffect(() => {
    const configs = watchedCustomerConfigs;
    if (!Array.isArray(configs) || configs.length < 1 || !pricingItems) return;

    const isSingleConfig = configs.length === 1;
    let updated = false;
    const newConfigs = configs.map((config: any) => {
      if (!config?.customerId) return config;
      const { subtotal, total } = computeCustomerConfigTotals(
        pricingItems,
        config.customerId,
        isSingleConfig,
      );
      if (config.subtotal !== subtotal || config.total !== total) {
        updated = true;
        return { ...config, subtotal, total };
      }
      return config;
    });
    if (updated) {
      setValue("pricing.customerConfigs", newConfigs, { shouldDirty: false });
    }
  }, [pricingItems, watchedCustomerConfigs, setValue]);

  // Calculate subtotal
  const subtotal = useMemo(() => {
    if (!pricingItems || pricingItems.length === 0) return 0;
    return pricingItems.reduce((sum: number, item: any) => {
      const amount = typeof item.amount === "number" ? item.amount : Number(item.amount) || 0;
      return sum + amount;
    }, 0);
  }, [pricingItems]);

  // Calculate aggregate total from customer configs (accounts for per-service discounts)
  const aggregateTotal = useMemo(() => {
    if (!Array.isArray(watchedCustomerConfigs) || watchedCustomerConfigs.length === 0) {
      // No configs: compute total from services directly
      if (!pricingItems || pricingItems.length === 0) return 0;
      return pricingItems.reduce(
        (sum: number, item: any) => sum + computeServiceNet({
          amount: typeof item.amount === "number" ? item.amount : Number(item.amount) || 0,
          discountType: item.discountType,
          discountValue: item.discountValue,
        }),
        0,
      );
    }
    return watchedCustomerConfigs.reduce(
      (sum: number, config: any) =>
        sum + (typeof config?.total === "number" ? config.total : Number(config?.total) || 0),
      0,
    );
  }, [watchedCustomerConfigs, pricingItems]);

  // Update form subtotal/total
  useEffect(() => {
    if (pricingItems && pricingItems.length > 0) {
      const configSubtotalSum =
        Array.isArray(watchedCustomerConfigs) && watchedCustomerConfigs.length > 0
          ? watchedCustomerConfigs.reduce(
              (sum: number, c: any) => sum + (Number(c?.subtotal) || 0),
              0,
            )
          : subtotal;
      setValue("pricing.subtotal", configSubtotalSum, { shouldDirty: false });
      setValue("pricing.total", aggregateTotal, { shouldDirty: false });
    }
  }, [subtotal, aggregateTotal, pricingItems, watchedCustomerConfigs, setValue]);

  // Clear orphaned service assignments when customer configs change
  useEffect(() => {
    const configs = watchedCustomerConfigs || [];
    const currentIds = Array.isArray(configs)
      ? configs.map((c: any) => c?.customerId).filter(Boolean)
      : [];
    const items = getValues("pricing.services") || [];
    items.forEach((item: any, index: number) => {
      if (
        item.invoiceToCustomerId &&
        !currentIds.includes(item.invoiceToCustomerId)
      ) {
        setValue(`pricing.services.${index}.invoiceToCustomerId`, null);
      }
    });
  }, [watchedCustomerConfigs, getValues, setValue]);

  const handleAddItem = useCallback(() => {
    clearErrors("pricing");
    append({
      description: "",
      observation: null,
      amount: undefined,
      invoiceToCustomerId: null,
      discountType: "NONE",
      discountValue: null,
      discountReference: null,
    });
  }, [append, clearErrors]);

  const hasMultipleCustomers =
    Array.isArray(watchedCustomerConfigs) && watchedCustomerConfigs.length >= 2;
  const customerConfigCustomers = Array.from(selectedCustomers.values());

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

      {/* Service Rows */}
      {fields.map((field, index) => (
        <ServiceItemRow
          key={field.id}
          control={control}
          index={index}
          onRemove={() => remove(index)}
          customerConfigCustomers={hasMultipleCustomers ? customerConfigCustomers : undefined}
        />
      ))}

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
                <ThemedText style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.primary }}>{formatCurrency(aggregateTotal)}</ThemedText>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Step Customer Payment (dynamic, one per customer)
// ============================================================================

interface StepCustomerPaymentProps {
  control: any;
  configIndex: number;
  customer: any;
  taskResponsibles?: Array<{ id: string; name: string; role: string }>;
}

function StepCustomerPayment({ control, configIndex, customer, taskResponsibles }: StepCustomerPaymentProps) {
  const { colors } = useTheme();
  const { setValue } = useFormContext();
  const keyboardContext = useKeyboardAwareForm();
  const [showCustomPayment, setShowCustomPayment] = useState(false);

  const config = useWatch({
    control,
    name: `pricing.customerConfigs.${configIndex}`,
  });

  // Initialize custom payment state
  useEffect(() => {
    if (config?.customPaymentText && !showCustomPayment) {
      setShowCustomPayment(true);
    }
  }, [config?.customPaymentText, showCustomPayment]);

  // Default budget responsible to the first task responsible (only on mount)
  const hasAutoDefaulted = useRef(false);
  useEffect(() => {
    if (hasAutoDefaulted.current) return;
    if (
      taskResponsibles &&
      taskResponsibles.length > 0 &&
      !config?.responsibleId
    ) {
      hasAutoDefaulted.current = true;
      const firstValid = taskResponsibles.find((r) => !r.id.startsWith("temp-"));
      if (firstValid) {
        setValue(
          `pricing.customerConfigs.${configIndex}.responsibleId`,
          firstValid.id,
          { shouldDirty: false },
        );
      }
    }
  }, [taskResponsibles, config?.responsibleId, setValue, configIndex]);

  const handlePaymentConditionChange = useCallback((val: string | string[] | null | undefined) => {
    const value = typeof val === 'string' ? val : '';
    if (value === "CUSTOM") {
      setShowCustomPayment(true);
      setValue(`pricing.customerConfigs.${configIndex}.paymentCondition`, "CUSTOM");
    } else {
      setShowCustomPayment(false);
      setValue(`pricing.customerConfigs.${configIndex}.customPaymentText`, null);
      setValue(`pricing.customerConfigs.${configIndex}.paymentCondition`, value || null);
    }
  }, [setValue, configIndex]);

  const configSubtotal = config?.subtotal || 0;
  const configTotal = config?.total || 0;
  const currentCondition = config?.customPaymentText
    ? "CUSTOM"
    : config?.paymentCondition || "";

  return (
    <View style={styles.fieldSection}>
      {/* Customer Header */}
      {customer && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.md }}>
          <IconCreditCard size={18} color={colors.primary} />
          <View>
            <ThemedText style={{ fontSize: fontSize.md, fontWeight: "600" }}>
              {customer.fantasyName || customer.corporateName || "Cliente"}
            </ThemedText>
            {customer.cnpj && (
              <ThemedText style={{ fontSize: 12, color: colors.mutedForeground }}>
                CNPJ: {customer.cnpj}
              </ThemedText>
            )}
          </View>
        </View>
      )}

      {/* Read-only Subtotal & Total */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <View style={styles.labelWithIcon}>
            <IconCurrencyReal size={14} color={colors.mutedForeground} style={{ flexShrink: 0 }} />
            <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
              Subtotal
            </ThemedText>
          </View>
          <View style={[styles.readOnlyField, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "500", color: colors.foreground }}>
              {formatCurrency(configSubtotal)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.halfField}>
          <View style={styles.labelWithIcon}>
            <IconCurrencyReal size={14} color={colors.primary} style={{ flexShrink: 0 }} />
            <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
              Valor Total
            </ThemedText>
          </View>
          <View style={[styles.readOnlyField, { borderColor: colors.primary, borderWidth: 2 }]}>
            <ThemedText style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.primary }}>
              {formatCurrency(configTotal)}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Budget Responsible */}
      {taskResponsibles && taskResponsibles.length > 0 && (
        <View style={[styles.fieldSection, { marginTop: spacing.md }]}>
          <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Responsável do Orçamento</ThemedText>
          <Combobox
            value={config?.responsibleId || ""}
            onValueChange={(v) => setValue(`pricing.customerConfigs.${configIndex}.responsibleId`, v || null)}
            options={taskResponsibles
              .filter((r: any) => !r.id.startsWith('temp-'))
              .map((r: any) => ({
                value: r.id,
                label: `${r.name} (${RESPONSIBLE_ROLE_LABELS[r.role as keyof typeof RESPONSIBLE_ROLE_LABELS] || r.role})`,
              }))}
            placeholder="Selecione o responsável"
            searchable={false}
            avoidKeyboard={false}
            onOpen={() => {}}
            onClose={() => {}}
          />
        </View>
      )}

      {/* Generate Invoice Toggle */}
      <View style={[styles.fieldSection, { marginTop: spacing.md }]}>
        <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Emitir Nota Fiscal</ThemedText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Switch
            checked={config?.generateInvoice !== false}
            onCheckedChange={(v) => setValue(`pricing.customerConfigs.${configIndex}.generateInvoice`, v)}
          />
          <ThemedText style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>
            {config?.generateInvoice !== false ? "Sim" : "Não"}
          </ThemedText>
        </View>
      </View>

      {/* Payment Condition */}
      <View style={[styles.fieldSection, { marginTop: spacing.md }]}>
        <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Condição de Pagamento</ThemedText>
        <Combobox
          value={currentCondition}
          onValueChange={handlePaymentConditionChange}
          options={PAYMENT_CONDITIONS.map((o) => ({ value: o.value, label: o.label }))}
          placeholder="Selecione"
          searchable={false}
          avoidKeyboard={false}
          onOpen={() => {}}
          onClose={() => {}}
        />
      </View>


      {/* Custom Payment Text */}
      {showCustomPayment && (
        <View style={[styles.fieldSection, { marginTop: spacing.md }]}>
          <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Texto Personalizado de Pagamento</ThemedText>
          <View onLayout={keyboardContext ? (e) => keyboardContext.onFieldLayout(`pricing-custom-payment-${configIndex}`, e) : undefined}>
            <TextInput
              value={config?.customPaymentText || ""}
              onChangeText={(t) => setValue(`pricing.customerConfigs.${configIndex}.customPaymentText`, t || null)}
              placeholder="Descreva as condições de pagamento..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={[styles.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              onFocus={() => keyboardContext?.onFieldFocus(`pricing-custom-payment-${configIndex}`)}
            />
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Service Item Row
// ============================================================================

interface ServiceItemRowProps {
  control: any;
  index: number;
  onRemove: () => void;
  customerConfigCustomers?: Array<{
    id: string;
    fantasyName?: string;
    corporateName?: string;
  }>;
}

function ServiceItemRow({ control, index, onRemove, customerConfigCustomers }: ServiceItemRowProps) {
  const { colors } = useTheme();
  const { setValue } = useFormContext();
  const [observationModal, setObservationModal] = useState({ visible: false, text: "" });

  const description = useWatch({ control, name: `pricing.services.${index}.description` });
  const amount = useWatch({ control, name: `pricing.services.${index}.amount` });
  const observation = useWatch({ control, name: `pricing.services.${index}.observation` });
  const discountType = useWatch({ control, name: `pricing.services.${index}.discountType` }) || "NONE";
  const discountValue = useWatch({ control, name: `pricing.services.${index}.discountValue` });
  const invoiceToCustomerId = useWatch({ control, name: `pricing.services.${index}.invoiceToCustomerId` });

  const hasMultipleCustomers = customerConfigCustomers && customerConfigCustomers.length >= 2;

  const descriptionOptions = useMemo(() => {
    const baseOptions = getServiceDescriptionsByType(SERVICE_ORDER_TYPE.PRODUCTION).map((desc) => ({
      value: desc,
      label: desc,
    }));

    if (description && description.trim().length > 0) {
      const descriptionExists = baseOptions.some(opt => opt.value === description);
      if (!descriptionExists) {
        return [{ value: description, label: description }, ...baseOptions];
      }
    }

    return baseOptions;
  }, [description]);

  const handleSaveObservation = () => {
    setValue(`pricing.services.${index}.observation`, observationModal.text || null);
    setObservationModal({ visible: false, text: observationModal.text });
  };

  const hasObservation = !!observation && observation.trim().length > 0;

  return (
    <View style={styles.itemRow}>
      {/* Description */}
      <View style={{ width: "100%" }}>
        <Combobox
          value={description || ""}
          onValueChange={(v) => setValue(`pricing.services.${index}.description`, v || "")}
          options={descriptionOptions}
          placeholder="Selecione o serviço..."
          searchable
          clearable={false}
        />
      </View>

      {/* Amount Row */}
      <View style={styles.amountRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Input
            type="currency"
            value={amount ?? ""}
            onChange={(v) => setValue(`pricing.services.${index}.amount`, v)}
            placeholder="R$ 0,00"
            fieldKey={`pricing-item-${index}-amount`}
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

      {/* Invoice To Customer (when multiple customers) */}
      {hasMultipleCustomers && (
        <View style={{ marginTop: spacing.xs }}>
          <ThemedText style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 2 }}>Faturar para</ThemedText>
          <Combobox
            value={invoiceToCustomerId || ""}
            onValueChange={(v) => setValue(`pricing.services.${index}.invoiceToCustomerId`, v || null)}
            options={customerConfigCustomers!.map((c) => ({
              value: c.id,
              label: c.fantasyName || c.corporateName || "Cliente",
            }))}
            placeholder="Selecione cliente"
            searchable={false}
          />
        </View>
      )}

      {/* Discount Row */}
      <View style={{ marginTop: spacing.xs }}>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <ThemedText style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 2 }}>Desconto</ThemedText>
            <Combobox
              value={discountType}
              onValueChange={(v) => {
                const safeType = v || "NONE";
                setValue(`pricing.services.${index}.discountType`, safeType);
                if (safeType === "NONE") {
                  setValue(`pricing.services.${index}.discountValue`, null);
                  setValue(`pricing.services.${index}.discountReference`, null);
                }
              }}
              options={Object.values(DISCOUNT_TYPE).map((type) => ({
                value: type,
                label: DISCOUNT_TYPE_LABELS[type],
              }))}
              placeholder="Nenhum"
              searchable={false}
            />
          </View>
          <View style={styles.halfField}>
            <ThemedText style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 2 }}>
              Vlr. Desc.{" "}
              {discountType === "PERCENTAGE" && "(%)"}
              {discountType === "FIXED_VALUE" && "(R$)"}
            </ThemedText>
            <Input
              type={discountType === "FIXED_VALUE" ? "currency" : "number"}
              value={discountValue ?? ""}
              onChange={(v) => setValue(`pricing.services.${index}.discountValue`, v === "" || v == null ? null : Number(v))}
              disabled={discountType === "NONE"}
              placeholder={discountType === "NONE" ? "-" : discountType === "FIXED_VALUE" ? "R$ 0,00" : "0"}
              fieldKey={`pricing-item-${index}-discount`}
            />
          </View>
        </View>
      </View>

      {/* Discount Reference */}
      {discountType !== "NONE" && (
        <View style={{ marginTop: spacing.xs }}>
          <ThemedText style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 2 }}>Referência do Desconto</ThemedText>
          <Input
            value={useWatch({ control, name: `pricing.services.${index}.discountReference` }) || ""}
            onChange={(v) => setValue(`pricing.services.${index}.discountReference`, v || null)}
            placeholder="Justificativa..."
            fieldKey={`pricing-item-${index}-discount-ref`}
          />
        </View>
      )}

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
  infoCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  customerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.DEFAULT,
    borderWidth: 1,
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
