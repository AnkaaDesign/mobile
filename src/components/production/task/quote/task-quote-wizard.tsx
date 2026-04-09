import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { navigationTracker } from "@/utils/navigation-tracker";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { type FilePickerItem } from "@/components/ui/file-picker";
import { MultiStepFormContainer } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTaskDetail, useTaskMutations } from "@/hooks/useTask";
import { useTaskQuoteByTask } from "@/hooks/useTaskQuote";
import { taskQuoteCreateNestedSchema } from "@/schemas/task-quote";
import { spacing } from "@/constants/design-system";
import type { FormStep } from "@/components/ui/form-steps";
import { StepQuoteInfo as StepQuoteInfoExtracted } from "@/components/financial/budget/steps/step-quote-info";
import { StepServices as StepServicesExtracted } from "@/components/financial/budget/steps/step-services";
import { StepCustomerPayment as StepCustomerPaymentExtracted } from "@/components/financial/budget/steps/step-customer-payment";
import { StepReview as StepReviewExtracted } from "@/components/financial/budget/steps/step-review";

// Wizard form schema wrapping the nested quote schema
const wizardSchema = z.object({
  quote: taskQuoteCreateNestedSchema,
});

type WizardFormData = z.infer<typeof wizardSchema>;

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
      discountType: c.discountType ?? 'NONE',
      discountValue: c.discountValue ?? null,
      discountReference: c.discountReference ?? null,
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
          <StepQuoteInfoExtracted
            control={control}
            task={task}
            mode={mode === 'billing' ? 'billing' : 'edit'}
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
            fieldPrefix="quote."
          />
        )}

        {/* Step 2 - Services */}
        {currentStep === 2 && (
          <StepServicesExtracted
            control={control}
            task={task}
            selectedCustomers={selectedCustomers}
            mode="edit"
            fieldPrefix="quote."
          />
        )}

        {/* Steps 3..N - Customer Payment (dynamic) */}
        {currentStep > 2 && currentStep <= 2 + customerCount && (() => {
          const configIndex = currentStep - 3;
          const config = customerConfigs?.[configIndex];
          const customer = config
            ? customersCache.current.get(config.customerId)
            : null;
          return (
            <StepCustomerPaymentExtracted
              key={`customer-config-${configIndex}`}
              control={control}
              configIndex={configIndex}
              customer={customer}
              taskResponsibles={task?.responsibles}
              fieldPrefix="quote."
            />
          );
        })()}

        {/* Last Step - Preview */}
        {currentStep === totalSteps && (
          <StepReviewExtracted
            mode={mode === 'billing' ? 'billing' : 'edit'}
            task={task}
            existingQuote={existingQuote}
            selectedCustomers={selectedCustomers}
            layoutFiles={layoutFiles}
            fieldPrefix="quote."
          />
        )}
      </MultiStepFormContainer>
    </FormProvider>
  );
}

// Old inline step components (Step1Info, Step2Services, StepCustomerPayment) removed.
// Now using extracted step components from @/components/financial/budget/steps/

// All old inline step components removed - using extracted components from @/components/financial/budget/steps/

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

