/**
 * Budget Create Wizard - Combined task + quote creation form
 *
 * Follows the web pattern:
 *  Step 1 "Tarefa"       – Task fields (name, customer, plates, serials, forecast, services, files)
 *  Step 2 "Informações"  – Quote info (customers for billing, validity, guarantee, layout)
 *  Step 3 "Serviços"     – Quote services with pricing
 *  Step 4+ "Pagamento"   – Per-customer payment details
 *  Final  "Resumo"       – Preview / review
 */

import { useState, useCallback, useMemo, useRef, useEffect, Suspense, lazy } from "react";
import {
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { type FilePickerItem } from "@/components/ui/file-picker";
import { MultiStepFormContainer } from "@/components/forms";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { useTaskMutations } from "@/hooks/useTask";
import { useCreateTaskQuote, taskQuoteKeys } from "@/hooks/useTaskQuote";
import { uploadSingleFile } from "@/api-client/file";
import { getCustomers, customerService } from "@/api-client/customer";
import { useQueryClient } from "@tanstack/react-query";
import {
  TASK_STATUS,
  IMPLEMENT_TYPE,
  SERVICE_ORDER_STATUS,
  SERVICE_ORDER_TYPE,
} from "@/constants/enums";
import {
  computeCustomerConfigTotals,
} from "@/utils/task-quote-calculations";
import type { FormStep } from "@/components/ui/form-steps";

// Step components
import { StepQuoteInfo } from "./steps/step-quote-info";
import { StepServices } from "./steps/step-services";
import { StepCustomerPayment } from "./steps/step-customer-payment";
import { StepReview } from "./steps/step-review";

// Lazy-load the task form sections to keep initial bundle lean
const BasicInfoSection = lazy(
  () => import("@/components/production/task/form/sections/BasicInfoSection"),
);
const ResponsiblesSection = lazy(
  () => import("@/components/production/task/form/sections/ResponsiblesSection"),
);
const DatesSection = lazy(
  () => import("@/components/production/task/form/sections/DatesSection"),
);
const ServicesSection = lazy(
  () => import("@/components/production/task/form/sections/ServicesSection"),
);
const FilesSection = lazy(
  () => import("@/components/production/task/form/sections/FilesSection"),
);

// Constants moved to step components and @/constants/budget-billing

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getDefaultExpiresAt() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  date.setHours(23, 59, 59, 999);
  return date;
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function BudgetCreateWizard() {
  const router = useRouter();
  const { goBack } = useNavigationHistory();
  const queryClient = useQueryClient();

  // Mutations
  const { createAsync: createTaskAsync } = useTaskMutations();
  const createQuoteMutation = useCreateTaskQuote();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [layoutFiles, setLayoutFiles] = useState<FilePickerItem[]>([]);
  const customersCache = useRef<Map<string, any>>(new Map());
  const [selectedCustomers, setSelectedCustomers] = useState<Map<string, any>>(new Map());

  // ---------------------------------------------------------------------------
  // Combined form – task fields + quote fields (no zodResolver for combined)
  // ---------------------------------------------------------------------------
  const form = useForm({
    mode: "onChange",
    defaultValues: {
      // ---- Task fields ----
      status: TASK_STATUS.PREPARATION,
      name: "",
      customerId: "",
      details: "",
      plates: [] as string[],
      serialNumbers: [] as number[],
      category: "",
      implementType: IMPLEMENT_TYPE.REFRIGERATED,
      forecastDate: null as Date | null,
      term: null as Date | null,
      paintId: null as string | null,
      paintIds: [] as string[],
      serviceOrders: [
        { description: "Em Negociação", type: SERVICE_ORDER_TYPE.COMMERCIAL, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
        { description: "Elaborar Layout", type: SERVICE_ORDER_TYPE.ARTWORK, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
        { description: "Elaborar Projeto", type: SERVICE_ORDER_TYPE.ARTWORK, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
        { description: "Preparar Arquivos para Plotagem", type: SERVICE_ORDER_TYPE.ARTWORK, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
        { description: "Checklist Entrada", type: SERVICE_ORDER_TYPE.LOGISTIC, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
        { description: "Checklist Saída", type: SERVICE_ORDER_TYPE.LOGISTIC, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
      ] as any[],
      responsibles: [] as any[],
      artworkIds: [] as string[],
      baseFileIds: [] as string[],

      // ---- Quote fields ----
      expiresAt: getDefaultExpiresAt(),
      budgetStatus: "PENDING" as string,
      subtotal: 0,
      total: 0,
      guaranteeYears: null as number | null,
      customGuaranteeText: null as string | null,
      customForecastDays: null as number | null,
      layoutFileId: null as string | null,
      simultaneousTasks: null as number | null,
      customerConfigs: [] as any[],
      services: [
        { description: "", amount: null, observation: null, invoiceToCustomerId: null },
      ] as any[],
    },
  });

  const { control, getValues, setValue } = form;

  // Watch key fields - these trigger re-renders for canProceed reactivity
  const customerConfigs = useWatch({ control, name: "customerConfigs" }) || [];
  const services = useWatch({ control, name: "services" }) || [];
  const watchedCustomerId = useWatch({ control, name: "customerId" });
  const watchedName = useWatch({ control, name: "name" });
  const watchedPlates = useWatch({ control, name: "plates" });
  const watchedSerialNumbers = useWatch({ control, name: "serialNumbers" });
  const watchedExpiresAt = useWatch({ control, name: "expiresAt" });

  // ---------------------------------------------------------------------------
  // Auto-populate billing customer from task customer
  // ---------------------------------------------------------------------------
  const autoSetBillingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!watchedCustomerId) return;
    const currentConfigs = getValues("customerConfigs") || [];
    const shouldAutoSet =
      currentConfigs.length === 0 ||
      (currentConfigs.length === 1 && autoSetBillingRef.current === currentConfigs[0]?.customerId);
    if (!shouldAutoSet) return;

    autoSetBillingRef.current = watchedCustomerId;
    const cached = customersCache.current.get(watchedCustomerId);

    const setConfig = (customerData: any) => {
      const config = {
        customerId: watchedCustomerId,
        subtotal: 0,
        total: 0,
        discountType: "NONE",
        discountValue: null,
        discountReference: null,
        paymentCondition: null,
        customPaymentText: null,
        generateInvoice: true,
        generateBankSlip: true,
        orderNumber: null,
        responsibleId: null,
        customerData: {
          corporateName: customerData?.corporateName || "",
          fantasyName: customerData?.fantasyName || "",
          cnpj: customerData?.cnpj || "",
          cpf: customerData?.cpf || "",
          address: customerData?.address || "",
          addressNumber: customerData?.addressNumber || "",
          addressComplement: customerData?.addressComplement || "",
          neighborhood: customerData?.neighborhood || "",
          city: customerData?.city || "",
          state: customerData?.state || "",
          zipCode: customerData?.zipCode || "",
          stateRegistration: customerData?.stateRegistration || "",
          streetType: customerData?.streetType || null,
        },
      };
      setValue("customerConfigs", [config], { shouldDirty: true });
      const newMap = new Map<string, any>();
      newMap.set(watchedCustomerId, customerData);
      setSelectedCustomers(newMap);
    };

    if (cached) {
      setConfig(cached);
    } else {
      getCustomers({ where: { id: watchedCustomerId }, take: 1 })
        .then((res) => {
          const c = res?.data?.[0];
          if (c) {
            customersCache.current.set(c.id, c);
            setConfig(c);
          }
        })
        .catch(() => {});
    }
  }, [watchedCustomerId, getValues, setValue]);

  // ---------------------------------------------------------------------------
  // Steps
  // ---------------------------------------------------------------------------
  const steps = useMemo<FormStep[]>(() => {
    const base: FormStep[] = [
      { id: 1, name: "Tarefa", description: "Dados da tarefa" },
      { id: 2, name: "Informações", description: "Prazos e clientes" },
      { id: 3, name: "Serviços", description: "Itens e valores" },
    ];
    (customerConfigs || []).forEach((config: any, i: number) => {
      const customer = customersCache.current.get(config?.customerId);
      base.push({
        id: 4 + i,
        name: `Pagamento`,
        description: customer?.fantasyName || `Cliente ${i + 1}`,
      });
    });
    base.push({
      id: base.length + 1,
      name: "Resumo",
      description: "Revisão final",
    });
    return base;
  }, [customerConfigs]);

  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps;

  // Clamp current step when customer count changes
  useEffect(() => {
    if (currentStep > totalSteps) setCurrentStep(totalSteps);
  }, [totalSteps, currentStep]);

  // ---------------------------------------------------------------------------
  // Validation per step
  // ---------------------------------------------------------------------------
  const validateStep = useCallback(
    (step: number): string | null => {
      const data = getValues();
      if (step === 1) {
        if (!data.name && !data.customerId && (!data.plates || data.plates.length === 0) && (!data.serialNumbers || data.serialNumbers.length === 0)) {
          return "Preencha: Nome, Cliente, Placas ou Nº de série.";
        }
      }
      if (step === 2) {
        if (!data.customerConfigs || data.customerConfigs.length === 0) {
          return "Selecione pelo menos um cliente para faturamento.";
        }
        if (!data.expiresAt) {
          return "A data de validade é obrigatória.";
        }
      }
      if (step === 3) {
        const validServices = (data.services || []).filter((s: any) => s.description?.trim());
        if (validServices.length === 0) {
          return "Adicione pelo menos um serviço.";
        }
      }
      return null;
    },
    [getValues],
  );

  const canProceed = useMemo(
    () => !validateStep(currentStep),
    [currentStep, validateStep, services, customerConfigs, watchedName, watchedPlates, watchedSerialNumbers, watchedExpiresAt],
  );

  const goNext = useCallback(() => {
    const error = validateStep(currentStep);
    if (error) {
      Alert.alert("Atenção", error);
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, totalSteps));
  }, [currentStep, totalSteps, validateStep]);

  const goPrev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, []);

  const handleCancel = useCallback(() => {
    goBack();
  }, [goBack]);

  // Full wizard reset: step, local pickers/caches, and file selections.
  // react-hook-form fields are reset automatically by MultiStepFormContainer
  // (via useFormContext). Called on cancel and after a successful submit so
  // re-opening the wizard shows a fresh form at step 1.
  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setLayoutFiles([]);
    setSelectedCustomers(new Map());
    customersCache.current = new Map();
    autoSetBillingRef.current = null;
  }, []);

  // ---------------------------------------------------------------------------
  // Recalculate totals when services change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const configs = getValues("customerConfigs") || [];
    const isSingleConfig = configs.length === 1;

    let aggregateSubtotal = 0;
    let aggregateTotal = 0;

    if (configs.length > 0) {
      const newConfigs = configs.map((c: any) => {
        const totals = computeCustomerConfigTotals(
          services || [],
          c.customerId,
          isSingleConfig,
          c.discountType,
          c.discountValue,
        );
        aggregateSubtotal += totals.subtotal;
        aggregateTotal += totals.total;
        return { ...c, subtotal: totals.subtotal, total: totals.total };
      });
      setValue("customerConfigs", newConfigs);
    } else {
      // No configs: subtotal = total (no discount without config)
      (services || []).forEach((s: any) => {
        aggregateSubtotal += Number(s.amount) || 0;
      });
      aggregateTotal = aggregateSubtotal;
    }

    setValue("subtotal", aggregateSubtotal);
    setValue("total", aggregateTotal);
  }, [services, setValue, getValues]);

  // ---------------------------------------------------------------------------
  // Submit – Create task then quote
  // ---------------------------------------------------------------------------
  const handleSubmit = useCallback(async () => {
    const data = getValues();

    // Final validation
    const servicesValid = (data.services || []).filter((s: any) => s.description?.trim());
    if (servicesValid.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um serviço ao orçamento.");
      return;
    }
    if (!data.expiresAt) {
      Alert.alert("Erro", "A data de validade é obrigatória.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload layout file if needed
      let layoutFileId = data.layoutFileId || null;
      const newLayoutFiles = layoutFiles.filter((f) => !f.uploaded);
      if (newLayoutFiles.length > 0) {
        const file = newLayoutFiles[0];
        const formData = new FormData();
        formData.append("file", {
          uri: file.uri,
          name: file.name || "layout.jpg",
          type: file.mimeType || "image/jpeg",
        } as any);
        const result = await uploadSingleFile(formData, { fileContext: "quote-layout" });
        if (result?.id) layoutFileId = result.id;
      }

      // 2. Build service orders
      const serviceOrders = (data.serviceOrders || []).filter(
        (so: any) => so.description?.trim().length >= 3,
      );

      // 3. Build plate/serial combinations
      const plates = data.plates || [];
      const serialNumbers = data.serialNumbers || [];
      let combinations: Array<{ plate?: string; serialNumber?: number }> = [];

      if (plates.length > 0 && serialNumbers.length > 0) {
        for (const plate of plates) {
          for (const sn of serialNumbers) {
            combinations.push({ plate, serialNumber: sn });
          }
        }
      } else if (plates.length > 0) {
        combinations = plates.map((p) => ({ plate: p }));
      } else if (serialNumbers.length > 0) {
        combinations = serialNumbers.map((sn) => ({ serialNumber: sn }));
      } else {
        combinations = [{}];
      }

      let firstCreatedTaskId: string | null = null;
      let successCount = 0;

      for (let i = 0; i < combinations.length; i++) {
        const combo = combinations[i];

        // Build task data
        const taskData: any = {
          status: data.status || TASK_STATUS.PREPARATION,
          name: data.name || "",
          customerId: data.customerId || undefined,
          details: data.details || undefined,
          forecastDate: data.forecastDate || undefined,
          term: data.term || undefined,
          paintId: data.paintId || undefined,
          paintIds: data.paintIds?.length ? data.paintIds : undefined,
          artworkIds: data.artworkIds?.length ? data.artworkIds : undefined,
          baseFileIds: data.baseFileIds?.length ? data.baseFileIds : undefined,
          serviceOrders,
        };

        if (combo.serialNumber) taskData.serialNumber = combo.serialNumber;
        if (combo.plate) {
          taskData.truck = {
            plate: combo.plate,
            category: data.category || undefined,
            implementType: data.implementType || undefined,
          };
        }

        // Create task
        const taskResult = await createTaskAsync(taskData);
        if (!taskResult?.success || !taskResult?.data) {
          Alert.alert("Erro", taskResult?.message || "Falha ao criar tarefa.");
          continue;
        }

        const createdTaskId = taskResult.data.id;
        if (i === 0) firstCreatedTaskId = createdTaskId;
        successCount++;

        // Update customer data if needed
        for (const config of data.customerConfigs || []) {
          if (config.customerData && config.customerId) {
            try {
              await customerService.updateCustomer(config.customerId, config.customerData);
            } catch {
              // non-critical
            }
          }
        }

        // Create quote for this task
        const quotePayload: any = {
          taskId: createdTaskId,
          expiresAt: data.expiresAt,
          status: "PENDING",
          subtotal: data.subtotal || 0,
          total: data.total || 0,
          guaranteeYears: toNumber(data.guaranteeYears),
          customGuaranteeText: data.customGuaranteeText || null,
          customForecastDays: toNumber(data.customForecastDays),
          layoutFileId: layoutFileId || null,
          simultaneousTasks: toNumber(data.simultaneousTasks),
          customerConfigs: (data.customerConfigs || []).map((c: any) => ({
            customerId: c.customerId,
            subtotal: c.subtotal || 0,
            total: c.total || 0,
            discountType: c.discountType || "NONE",
            discountValue: toNumber(c.discountValue),
            discountReference: c.discountReference || null,
            paymentCondition: c.paymentCondition || null,
            customPaymentText: c.customPaymentText || null,
            generateInvoice: c.generateInvoice ?? true,
            generateBankSlip: c.generateBankSlip ?? true,
            responsibleId: c.responsibleId || null,
            orderNumber: c.orderNumber || null,
          })),
          services: servicesValid.map((s: any) => ({
            description: s.description,
            amount: Number(s.amount) || 0,
            observation: s.observation || null,
            invoiceToCustomerId: s.invoiceToCustomerId || null,
          })),
        };

        try {
          await createQuoteMutation.mutateAsync(quotePayload);
        } catch (err: any) {
          console.error("[BudgetCreate] Quote creation failed:", err);
        }
      }

      // Post-submit
      if (successCount > 0) {
        queryClient.invalidateQueries({ queryKey: taskQuoteKeys.all });
        Alert.alert(
          "Sucesso",
          successCount === 1
            ? "Orçamento criado com sucesso!"
            : `${successCount} orçamentos criados com sucesso!`,
        );
        if (firstCreatedTaskId) {
          router.replace(`/(tabs)/financeiro/orcamento/detalhes/${firstCreatedTaskId}` as any);
        } else {
          router.replace("/(tabs)/financeiro/orcamento/listar" as any);
        }
      }
    } catch (error: any) {
      console.error("[BudgetCreate] Error:", error);
      Alert.alert("Erro", error?.message || "Erro ao criar orçamento.");
    } finally {
      setIsSubmitting(false);
    }
  }, [getValues, createTaskAsync, createQuoteMutation, queryClient, router, layoutFiles]);

  // ---------------------------------------------------------------------------
  // Render current step content
  // ---------------------------------------------------------------------------
  const renderStepContent = () => {
    if (currentStep === 1) {
      // Step 1 – Task form sections (matching TaskForm layout)
      return (
        <Suspense fallback={<ActivityIndicator style={{ marginTop: 40 }} />}>
          <BasicInfoSection mode="create" />
          <DatesSection mode="create" />
          <ServicesSection />
          <FilesSection mode="create" />
        </Suspense>
      );
    }
    if (currentStep === 2) {
      return (
        <StepQuoteInfo
          control={control}
          mode="create"
          layoutFiles={layoutFiles}
          onLayoutFilesChange={setLayoutFiles}
          customersCache={customersCache}
          selectedCustomers={selectedCustomers}
          setSelectedCustomers={setSelectedCustomers}
          fieldPrefix=""
        />
      );
    }
    if (currentStep === 3) {
      return (
        <StepServices
          control={control}
          task={null}
          selectedCustomers={selectedCustomers}
          mode="create"
          fieldPrefix=""
        />
      );
    }
    if (currentStep === totalSteps) {
      return (
        <StepReview
          mode="create"
          selectedCustomers={selectedCustomers}
          layoutFiles={layoutFiles}
          fieldPrefix=""
        />
      );
    }
    // Customer payment steps (4 to totalSteps-1)
    const configIndex = currentStep - 4;
    const config = customerConfigs[configIndex];
    if (!config) return null;
    const customer = customersCache.current.get(config.customerId);
    const taskResponsibles = getValues("responsibles") || [];

    return (
      <StepCustomerPayment
        control={control}
        configIndex={configIndex}
        customer={customer}
        taskResponsibles={taskResponsibles.filter((r: any) => !r.id?.startsWith("temp-"))}
        fieldPrefix=""
      />
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <FormProvider {...form}>
      <MultiStepFormContainer
        steps={steps}
        currentStep={currentStep}
        onPrevStep={goPrev}
        onNextStep={goNext}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onReset={handleReset}
        isSubmitting={isSubmitting}
        canProceed={canProceed}
        canSubmit={isLastStep && canProceed}
        submitLabel="Criar Orçamento"
        cancelLabel="Cancelar"
        scrollable
      >
        {renderStepContent()}
      </MultiStepFormContainer>
    </FormProvider>
  );
}
