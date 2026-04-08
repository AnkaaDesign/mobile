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
import { useNavigationHistory } from "@/contexts/navigation-history-context";
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

function formatDocumentNumber(value: string | null | undefined): string {
  if (!value) return "";
  const clean = value.replace(/\D/g, "");
  if (clean.length === 11) return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (clean.length === 14) return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return value;
}

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
  quote: taskQuoteCreateNestedSchema,
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
  /** 'budget' shows all fields (validade, garantia, tarefas simultaneas, prazo, layout).
   *  'billing' hides budget-only fields. Default: 'budget'. */
  mode?: 'budget' | 'billing';
}

export function TaskQuoteWizard({ taskId, mode = 'budget' }: TaskQuoteWizardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { goBack } = useNavigationHistory();
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
    data: quoteResponse,
    isLoading: quoteLoading,
  } = useTaskQuoteByTask(taskId);
  const existingQuote = quoteResponse?.data;

  // Task mutations for saving
  const { updateAsync } = useTaskMutations();

  // Form setup
  const methods = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      quote: {
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
    if (!existingQuote) return;

    const p = existingQuote;
    setValue("quote.status", p.status || "PENDING");
    setValue("quote.expiresAt", p.expiresAt ? new Date(p.expiresAt) : (() => {
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 30);
      defaultExpiry.setHours(23, 59, 59, 999);
      return defaultExpiry;
    })());
    setValue("quote.subtotal", p.subtotal || 0);
    setValue("quote.total", p.total || 0);
    setValue("quote.guaranteeYears", p.guaranteeYears ?? null);
    setValue("quote.customGuaranteeText", p.customGuaranteeText ?? null);
    setValue("quote.layoutFileId", p.layoutFileId ?? null);
    setValue("quote.customForecastDays", p.customForecastDays ?? null);
    setValue("quote.simultaneousTasks", p.simultaneousTasks ?? null);
    setValue("quote.customerConfigs", p.customerConfigs?.map((c: any) => ({
      customerId: c.customerId || c.id || c,
      subtotal: c.subtotal ?? 0,
      total: c.total ?? 0,
      paymentCondition: c.paymentCondition ?? null,
      customPaymentText: c.customPaymentText ?? null,
      responsibleId: c.responsibleId ?? null,
      generateInvoice: c.generateInvoice ?? true,
      orderNumber: c.orderNumber ?? null,
    })) || []);

    if (p.services && p.services.length > 0) {
      setValue(
        "quote.services",
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
  }, [existingQuote, setValue]);

  // Dynamic steps based on customer count
  const customerConfigs = watch("quote.customerConfigs");
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
  const quoteData = watch("quote");
  const formValues = watch();

  const customerCount = Array.isArray(customerConfigs) ? customerConfigs.length : 0;

  // Build preview pricing object
  const previewQuote = (() => {
    if (!quoteData) return null;

    let layoutFileForPreview = null;
    if (layoutFiles.length > 0) {
      const pickedFile = layoutFiles[0];
      layoutFileForPreview = pickedFile.uploaded && pickedFile.id
        ? { id: pickedFile.id }
        : { uri: pickedFile.uri };
    } else if (quoteData.layoutFileId) {
      layoutFileForPreview = { id: quoteData.layoutFileId };
    } else if (existingQuote?.layoutFile) {
      layoutFileForPreview = existingQuote.layoutFile;
    }

    return {
      ...quoteData,
      services: quoteData.services ? [...quoteData.services] : [],
      budgetNumber: existingQuote?.budgetNumber,
      createdAt: existingQuote?.createdAt || new Date(),
      layoutFile: layoutFileForPreview,
    };
  })();

  // Validation
  const canProceedFromStep1 = useMemo(() => {
    const configs = Array.isArray(customerConfigs) ? customerConfigs : [];
    return configs.length > 0 && !!quoteData?.expiresAt;
  }, [customerConfigs, quoteData]);

  const canProceedFromStep2 = useMemo(() => {
    const allItems = formValues?.quote?.services || [];
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
      const items = (quoteData?.services || []).filter(
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
  }, [currentStep, canProceedFromStep1, canProceedFromStep2, quoteData, customerConfigs, totalSteps]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  // Handle save
  const onSave = useCallback(async () => {
    const data = getValues();
    const items = data.quote?.services || [];

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

    if (!data.quote?.expiresAt) {
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
      const quotePayload = { ...data.quote };
      quotePayload.subtotal = toNumber(quotePayload.subtotal) ?? 0;
      quotePayload.total = toNumber(quotePayload.total) ?? 0;
      quotePayload.guaranteeYears = toNumber(quotePayload.guaranteeYears);
      quotePayload.customForecastDays = toNumber(quotePayload.customForecastDays);
      quotePayload.simultaneousTasks = toNumber(quotePayload.simultaneousTasks);
      if (quotePayload.services) {
        quotePayload.services = (Array.isArray(quotePayload.services)
          ? quotePayload.services
          : Object.values(quotePayload.services)
        ).map((svc: any) => ({
          ...svc,
          amount: toNumber(svc.amount) ?? 0,
        }));
      }
      if (quotePayload.customerConfigs) {
        if (!Array.isArray(quotePayload.customerConfigs)) {
          quotePayload.customerConfigs = Object.values(quotePayload.customerConfigs);
        }
        quotePayload.customerConfigs = quotePayload.customerConfigs.map((config: any) => ({
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
        formData.append('quote', JSON.stringify(quotePayload));

        await updateAsync({
          id: taskId,
          data: formData as any,
        });
      } else {
        await updateAsync({
          id: taskId,
          data: { quote: quotePayload } as any,
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
    goBack();
  }, [goBack]);

  // Loading state
  if (taskLoading || quoteLoading) {
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
                <CardTitle>{mode === 'billing' ? 'Informações do Faturamento' : 'Informações do Orçamento'}</CardTitle>
              </CardHeader>
              <CardContent>
                <Step1Info
                  control={control}
                  task={task}
                  canEditStatus={canEditStatus}
                  layoutFiles={layoutFiles}
                  onLayoutFilesChange={setLayoutFiles}
                  mode={mode}
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
        {currentStep === totalSteps && previewQuote && (
          <View style={styles.stepContainer}>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>{mode === 'billing' ? 'Resumo do Faturamento' : 'Prévia do Orçamento'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ThemedText style={[styles.stepDescription, { color: colors.mutedForeground, marginBottom: spacing.md }]}>
                  {mode === 'billing' ? 'Revise o faturamento antes de salvar.' : 'Revise o orçamento antes de salvar.'}
                </ThemedText>
                <BudgetPreview
                  mode={mode}
                  quote={previewQuote as any}
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
  mode: 'budget' | 'billing';
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
  mode,
}: Step1Props) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();
  const { setValue, getValues } = useFormContext();
  const keyboardContext = useKeyboardAwareForm();
  const [validityPeriod, setValidityPeriod] = useState<string>("");
  const [showCustomGuarantee, setShowCustomGuarantee] = useState(false);
  const [showLayoutUploadMode, setShowLayoutUploadMode] = useState(false);

  const quoteStatus = useWatch({ control, name: "quote.status" }) || "PENDING";
  const guaranteeYears = useWatch({ control, name: "quote.guaranteeYears" });
  const customGuaranteeText = useWatch({ control, name: "quote.customGuaranteeText" });
  const simultaneousTasks = useWatch({ control, name: "quote.simultaneousTasks" });
  const customForecastDays = useWatch({ control, name: "quote.customForecastDays" });
  const customerConfigsValue = useWatch({ control, name: "quote.customerConfigs" }) || [];

  // Initialize
  useEffect(() => {
    const expiresAt = getValues("quote.expiresAt");
    if (expiresAt) {
      const diffDays = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const closest = [15, 30, 60, 90].find(d => Math.abs(d - diffDays) <= 3);
      setValidityPeriod(closest ? closest.toString() : "30");
    } else {
      setValidityPeriod("30");
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      expiryDate.setHours(23, 59, 59, 999);
      setValue("quote.expiresAt", expiryDate);
      setValue("quote.status", "PENDING");
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
    setValue("quote.expiresAt", expiryDate);
  }, [setValue]);

  const handleGuaranteeChange = useCallback((val: string | string[] | null | undefined) => {
    const value = typeof val === 'string' ? val : '';
    if (value === "CUSTOM") {
      setShowCustomGuarantee(true);
      setValue("quote.guaranteeYears", null);
    } else {
      setShowCustomGuarantee(false);
      setValue("quote.customGuaranteeText", null);
      setValue("quote.guaranteeYears", value ? Number(value) : null);
    }
  }, [setValue]);

  const handleLayoutChange = useCallback((files: FilePickerItem[]) => {
    onLayoutFilesChange(files);
    if (files.length > 0 && files[0].id && files[0].uploaded) {
      setValue("quote.layoutFileId", files[0].id);
    } else if (files.length === 0) {
      setValue("quote.layoutFileId", null);
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
        setValue("quote.layoutFileId", artwork.id);
        setShowLayoutUploadMode(false);
      }
    } else {
      onLayoutFilesChange([]);
      setValue("quote.layoutFileId", null);
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

  const currentLayoutFileId = useWatch({ control, name: "quote.layoutFileId" });

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
        orderNumber: null,
      };
    });
    setValue("quote.customerConfigs", newConfigs);

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
          hideDefaultBadges
          async
          queryKey={["customers", "quote-invoice-selector"]}
          queryFn={searchCustomers}
          initialOptions={customerOptions}
          placeholder="Selecione clientes para faturamento..."
          searchable
          minSearchLength={0}
          debounceMs={500}
        />
        {/* Selected Customer Cards */}
        {selectedCustomers.size > 0 && (
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            {Array.from(selectedCustomers.entries()).map(([id, customer], index) => {
              const docValue = customer.cnpj || customer.cpf;
              const docLabel = customer.cnpj ? "CNPJ" : customer.cpf ? "CPF" : "";
              const formattedDoc = formatDocumentNumber(docValue);
              const hasLogo = customer.logo?.id || customer.logoId;
              const logoUrl = hasLogo ? `${ONLINE_API_URL}/files/thumbnail/${customer.logo?.id || customer.logoId}` : null;

              return (
                <View
                  key={id}
                  style={[styles.infoCard, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    {/* Customer Logo */}
                    <View style={{
                      width: 36, height: 36, borderRadius: 8,
                      backgroundColor: colors.muted, alignItems: "center", justifyContent: "center", overflow: "hidden",
                    }}>
                      {logoUrl ? (
                        <Image source={{ uri: logoUrl }} style={{ width: 36, height: 36 }} contentFit="cover" />
                      ) : (
                        <IconUser size={18} color={colors.mutedForeground} />
                      )}
                    </View>
                    {/* Name & Doc */}
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 13, fontWeight: "600" }} numberOfLines={1}>
                        {customer.corporateName || customer.fantasyName || `Cliente ${index + 1}`}
                      </ThemedText>
                      {formattedDoc ? (
                        <ThemedText style={{ fontSize: 11, color: colors.mutedForeground }} numberOfLines={1}>
                          {docLabel}: {formattedDoc}
                        </ThemedText>
                      ) : null}
                    </View>
                    {/* Remove button */}
                    <TouchableOpacity
                      onPress={() => {
                        const newIds = selectedCustomerIds.filter((cid: string) => cid !== customer.id);
                        handleCustomerChange(newIds);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <IconX size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Status & Validity */}
      <View style={[styles.row, { marginTop: spacing.md }]}>
        <View style={mode === 'billing' ? { flex: 1 } : styles.halfField}>
          <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Status</ThemedText>
          <Combobox
            value={quoteStatus || "PENDING"}
            onValueChange={(v) => setValue("quote.status", v)}
            disabled={!canEditStatus}
            options={STATUS_OPTIONS}
            placeholder="Selecione"
            searchable={false}
            avoidKeyboard={false}
            onOpen={() => {}}
            onClose={() => {}}
          />
        </View>
        {mode === 'budget' && (
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
        )}
      </View>

      {/* Budget-only fields: Guarantee, Simultaneous Tasks, Forecast, Layout */}
      {mode === 'budget' && (
        <>
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
                  onChangeText={(t) => setValue("quote.customGuaranteeText", t || null)}
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
                    setValue("quote.simultaneousTasks", numVal);
                  }}
                  placeholder="1-100"
                />
              </View>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Prazo Entrega (dias)</ThemedText>
                <Combobox
                  value={customForecastDays ? String(customForecastDays) : ""}
                  onValueChange={(value) => setValue("quote.customForecastDays", value ? Number(value) : null)}
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
        </>
      )}

      {/* Layout Approved — budget only */}
      {mode === 'budget' && (
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
      )}
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
    name: "quote.services",
  });

  const quoteItems = useWatch({ control, name: "quote.services" });
  const watchedCustomerConfigs = useWatch({ control, name: "quote.customerConfigs" });

  // Service order sync on mount
  useEffect(() => {
    if (syncedOnMount || !task) return;
    setSyncedOnMount(true);

    const serviceOrders: SyncServiceOrder[] = (task.serviceOrders || []).filter(
      (so: any) => so.type === SERVICE_ORDER_TYPE.PRODUCTION,
    );
    if (serviceOrders.length === 0) return;

    const currentServices = getValues("quote.services") || [];
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
    if (!Array.isArray(configs) || configs.length < 1 || !quoteItems) return;

    const isSingleConfig = configs.length === 1;
    let updated = false;
    const newConfigs = configs.map((config: any) => {
      if (!config?.customerId) return config;
      const { subtotal, total } = computeCustomerConfigTotals(
        quoteItems,
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
      setValue("quote.customerConfigs", newConfigs, { shouldDirty: false });
    }
  }, [quoteItems, watchedCustomerConfigs, setValue]);

  // Calculate subtotal
  const subtotal = useMemo(() => {
    if (!quoteItems || quoteItems.length === 0) return 0;
    return quoteItems.reduce((sum: number, item: any) => {
      const amount = typeof item.amount === "number" ? item.amount : Number(item.amount) || 0;
      return sum + amount;
    }, 0);
  }, [quoteItems]);

  // Calculate aggregate total from customer configs (accounts for per-service discounts)
  const aggregateTotal = useMemo(() => {
    if (!Array.isArray(watchedCustomerConfigs) || watchedCustomerConfigs.length === 0) {
      // No configs: compute total from services directly
      if (!quoteItems || quoteItems.length === 0) return 0;
      return quoteItems.reduce(
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
  }, [watchedCustomerConfigs, quoteItems]);

  // Update form subtotal/total
  useEffect(() => {
    if (quoteItems && quoteItems.length > 0) {
      const configSubtotalSum =
        Array.isArray(watchedCustomerConfigs) && watchedCustomerConfigs.length > 0
          ? watchedCustomerConfigs.reduce(
              (sum: number, c: any) => sum + (Number(c?.subtotal) || 0),
              0,
            )
          : subtotal;
      setValue("quote.subtotal", configSubtotalSum, { shouldDirty: false });
      setValue("quote.total", aggregateTotal, { shouldDirty: false });
    }
  }, [subtotal, aggregateTotal, quoteItems, watchedCustomerConfigs, setValue]);

  // Clear orphaned service assignments when customer configs change
  useEffect(() => {
    const configs = watchedCustomerConfigs || [];
    const currentIds = Array.isArray(configs)
      ? configs.map((c: any) => c?.customerId).filter(Boolean)
      : [];
    const items = getValues("quote.services") || [];
    items.forEach((item: any, index: number) => {
      if (
        item.invoiceToCustomerId &&
        !currentIds.includes(item.invoiceToCustomerId)
      ) {
        setValue(`quote.services.${index}.invoiceToCustomerId`, null);
      }
    });
  }, [watchedCustomerConfigs, getValues, setValue]);

  const handleAddItem = useCallback(() => {
    clearErrors("quote");
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
      {quoteItems && quoteItems.length > 0 && (
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
    name: `quote.customerConfigs.${configIndex}`,
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
          `quote.customerConfigs.${configIndex}.responsibleId`,
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
      setValue(`quote.customerConfigs.${configIndex}.paymentCondition`, "CUSTOM");
    } else {
      setShowCustomPayment(false);
      setValue(`quote.customerConfigs.${configIndex}.customPaymentText`, null);
      setValue(`quote.customerConfigs.${configIndex}.paymentCondition`, value || null);
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
            onValueChange={(v) => setValue(`quote.customerConfigs.${configIndex}.responsibleId`, v || null)}
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
            onCheckedChange={(v) => setValue(`quote.customerConfigs.${configIndex}.generateInvoice`, v)}
          />
          <ThemedText style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>
            {config?.generateInvoice !== false ? "Sim" : "Não"}
          </ThemedText>
        </View>
      </View>

      {/* Order Number */}
      <View style={[styles.fieldSection, { marginTop: spacing.md }]}>
        <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">N° do Pedido</ThemedText>
        <View onLayout={keyboardContext ? (e) => keyboardContext.onFieldLayout(`pricing-order-number-${configIndex}`, e) : undefined}>
          <TextInput
            value={config?.orderNumber || ""}
            onChangeText={(t) => setValue(`quote.customerConfigs.${configIndex}.orderNumber`, t || null)}
            placeholder="Ex: PED-001"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground, minHeight: undefined }]}
            onFocus={() => keyboardContext?.onFieldFocus(`pricing-order-number-${configIndex}`)}
          />
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
              onChangeText={(t) => setValue(`quote.customerConfigs.${configIndex}.customPaymentText`, t || null)}
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

  const description = useWatch({ control, name: `quote.services.${index}.description` });
  const amount = useWatch({ control, name: `quote.services.${index}.amount` });
  const observation = useWatch({ control, name: `quote.services.${index}.observation` });
  const discountType = useWatch({ control, name: `quote.services.${index}.discountType` }) || "NONE";
  const discountValue = useWatch({ control, name: `quote.services.${index}.discountValue` });
  const invoiceToCustomerId = useWatch({ control, name: `quote.services.${index}.invoiceToCustomerId` });

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
    setValue(`quote.services.${index}.observation`, observationModal.text || null);
    setObservationModal({ visible: false, text: observationModal.text });
  };

  const hasObservation = !!observation && observation.trim().length > 0;

  return (
    <View style={styles.itemRow}>
      {/* Description */}
      <View style={{ width: "100%" }}>
        <Combobox
          value={description || ""}
          onValueChange={(v) => setValue(`quote.services.${index}.description`, v || "")}
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
            onChange={(v) => setValue(`quote.services.${index}.amount`, v)}
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
            onValueChange={(v) => setValue(`quote.services.${index}.invoiceToCustomerId`, v || null)}
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
                setValue(`quote.services.${index}.discountType`, safeType);
                if (safeType === "NONE") {
                  setValue(`quote.services.${index}.discountValue`, null);
                  setValue(`quote.services.${index}.discountReference`, null);
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
              onChange={(v) => setValue(`quote.services.${index}.discountValue`, v === "" || v == null ? null : Number(v))}
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
            value={useWatch({ control, name: `quote.services.${index}.discountReference` }) || ""}
            onChange={(v) => setValue(`quote.services.${index}.discountReference`, v || null)}
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
