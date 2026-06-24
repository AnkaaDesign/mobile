import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useNav } from "@/contexts/nav";
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
import { useQueryClient } from "@tanstack/react-query";
import { useTaskDetail, useTaskMutations } from "@/hooks/useTask";
import { useTaskQuoteByTask, taskQuoteKeys } from "@/hooks/useTaskQuote";
import { taskKeys } from "@/hooks/queryKeys";
import { taskQuoteService } from "@/api-client/task-quote";
import { uploadSingleFile } from "@/api-client/file";
import type { TASK_QUOTE_STATUS } from "@/types/task-quote";
import { canUpdateQuoteStatus } from "@/utils/permissions/quote-permissions";
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
  const nav = useNav();
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
  const queryClient = useQueryClient();

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
        layoutFileIds: [],
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
    setValue("quote.layoutFileIds", (p.layoutFiles ?? []).map((f: any) => f.id));
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
      // Preserve the structured installment plan + signature so a save that
      // doesn't re-render them never nulls them (I07). Absence = preserve.
      paymentConfig: c.paymentConfig ?? null,
      customPaymentText: c.customPaymentText ?? null,
      responsibleId: c.responsibleId ?? null,
      customerSignatureId: c.customerSignatureId ?? null,
      generateInvoice: c.generateInvoice ?? true,
      generateBankSlip: c.generateBankSlip ?? true,
      orderNumber: c.orderNumber ?? null,
      installments: c.installments?.map((inst: any) => ({
        ...(inst.id ? { id: inst.id } : {}),
        number: inst.number,
        dueDate: inst.dueDate ? new Date(inst.dueDate) : new Date(),
        amount: typeof inst.amount === "number" ? inst.amount : Number(inst.amount) || 0,
      })) ?? [],
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

    // Build the layout file array from quote.layoutFiles (ordered, up to 2).
    const initialLayoutFiles: FilePickerItem[] = (p.layoutFiles ?? [])
      .slice(0, 2)
      .map((lf: any, i: number) => ({
        id: lf.id,
        name: lf.filename || lf.originalName || `Layout ${i + 1}`,
        uri: "",
        type: lf.mimetype || "image/jpeg",
        size: lf.size || 0,
        uploaded: true,
      }));
    if (initialLayoutFiles.length > 0) {
      setLayoutFiles(initialLayoutFiles);
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

  // Auto-populate default billing customer from task.customer when no configs exist.
  // Matches web behavior: the task's cliente becomes the default billing cliente,
  // removing the step where users must manually re-select the same customer.
  const autoSetDefaultBillingRef = useRef(false);
  useEffect(() => {
    if (autoSetDefaultBillingRef.current) return;
    if (taskLoading || quoteLoading) return;
    if (!task?.customer?.id) return;
    const currentConfigs = getValues("quote.customerConfigs");
    if (Array.isArray(currentConfigs) && currentConfigs.length > 0) return;

    autoSetDefaultBillingRef.current = true;
    const customer = task.customer;
    const defaultConfig = {
      customerId: customer.id,
      subtotal: 0,
      total: 0,
      discountType: "NONE" as const,
      discountValue: null,
      discountReference: null,
      paymentCondition: null,
      customPaymentText: null,
      responsibleId: null,
      generateInvoice: true,
      generateBankSlip: true,
      orderNumber: null,
    };
    setValue("quote.customerConfigs", [defaultConfig], { shouldDirty: false });
    customersCache.current.set(customer.id, customer);
    setSelectedCustomers(new Map([[customer.id, customer]]));
  }, [task, taskLoading, quoteLoading, getValues, setValue]);

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

    // Build the layout files array for preview: prefer the picked files (which
    // may be brand-new local uris), else fall back to the existing quote's files.
    const layoutFilesForPreview = (
      layoutFiles.length > 0
        ? layoutFiles.map(f =>
            f.uploaded && f.id ? { id: f.id } : { uri: f.uri },
          )
        : existingQuote?.layoutFiles ?? []
    ).slice(0, 2);

    return {
      ...quoteData,
      services: quoteData.services ? [...quoteData.services] : [],
      budgetNumber: existingQuote?.budgetNumber,
      createdAt: existingQuote?.createdAt || new Date(),
      layoutFiles: layoutFilesForPreview,
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

    // Multi-customer quotes must assign every service to a customer, otherwise the
    // unassigned amounts are silently dropped from each per-customer config total
    // (and the API approval guard would block billing later anyway). Parity with web.
    if (
      (data.quote?.customerConfigs || []).length >= 2 &&
      items.some((item: any) => !item.invoiceToCustomerId)
    ) {
      Alert.alert(
        "Cliente não atribuído",
        "Atribua um cliente a todos os serviços antes de salvar (orçamento com múltiplos clientes).",
      );
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
      // statusReason is captured UI-side only (the API ignores it on every
      // quote path); never forward it in the payload.
      delete (quotePayload as any).statusReason;
      // "Keep approval, don't reset": status rides INLINE with the value update
      // on the non-locked path, so the backend skips its auto-revert-to-PENDING
      // (it only reverts when no status is sent) — editing a price keeps the
      // existing approval. targetStatus is also used by the locked path below,
      // which must route status through the dedicated /status endpoint.
      const targetStatus = (quotePayload as any).status as
        | TASK_QUOTE_STATUS
        | undefined;
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
      // Resolve the ordered FILE ids for the layout array. Uploaded files keep
      // their id; new files are uploaded individually via the dedicated file
      // endpoint (mirrors the locked path) so we always carry FILE ids. The
      // ordering of `layoutFiles` is preserved.
      const resolvedLayoutIds: string[] = [];
      for (const f of layoutFiles.slice(0, 2)) {
        if (f.uploaded && f.id) {
          resolvedLayoutIds.push(f.id);
          continue;
        }
        const uploadResponse = await uploadSingleFile(
          { uri: f.uri, type: f.type, name: f.name } as any,
          { fileContext: 'quote-layout' },
        );
        if (uploadResponse.success && uploadResponse.data?.id) {
          resolvedLayoutIds.push(uploadResponse.data.id);
        }
      }
      // Wire the ordered File ids as the layout array. Always FILE ids.
      quotePayload.layoutFileIds = resolvedLayoutIds;

      // Layout-change detection (canonical web fix): a pure layout change/removal
      // must still trigger an update even when no other field is dirty. Compare
      // the resolved id array against the existing quote's stored layout files.
      const existingLayoutIds = (existingQuote?.layoutFiles ?? []).map((f: any) => f.id);
      const layoutChanged =
        resolvedLayoutIds.length !== existingLayoutIds.length ||
        resolvedLayoutIds.some((id, i) => id !== existingLayoutIds[i]);

      // Quotes that have reached BILLING_APPROVED or later are "locked": the API
      // rejects edits to billing-structural fields (subtotal/total/services/
      // customerConfigs) on these statuses (SAFE_AFTER_BILLING_FIELDS guard) and
      // requires status changes to go through the dedicated /status endpoint.
      // Mirror web: only send the locked-safe quote fields, and route the
      // status change separately. We use the dedicated task-quote endpoints here
      // (not the nested task.update path) because the nested path requires a
      // services array and would otherwise drop a reduced locked payload.
      const BILLING_LOCKED_STATUSES = [
        'BILLING_APPROVED',
        'UPCOMING',
        'DUE',
        'PARTIAL',
        'SETTLED',
      ];
      const existingStatus = existingQuote?.status as TASK_QUOTE_STATUS | undefined;
      const isQuoteLocked =
        !!existingStatus && BILLING_LOCKED_STATUSES.includes(existingStatus);

      if (isQuoteLocked && existingQuote?.id) {
        // Layout ids were already resolved (and any new files uploaded) above.
        // Reduced payload: ONLY the fields the API allows on a locked quote
        // (SAFE_AFTER_BILLING_FIELDS). The layout array is included so a layout
        // change/removal still persists.
        const lockedPayload: Record<string, any> = {
          expiresAt: quotePayload.expiresAt,
          guaranteeYears: quotePayload.guaranteeYears,
          customGuaranteeText: quotePayload.customGuaranteeText,
          customForecastDays: quotePayload.customForecastDays,
          simultaneousTasks: quotePayload.simultaneousTasks,
          layoutFileIds: resolvedLayoutIds,
        };
        await taskQuoteService.update(existingQuote.id, lockedPayload as any);

        // Status change (if any) goes through the dedicated endpoint. The API
        // ignores any reason on this path (see report), so statusReason is not
        // forwarded here.
        if (targetStatus && targetStatus !== existingStatus) {
          await taskQuoteService.updateStatus(existingQuote.id, targetStatus);
        }

        // Refresh quote + task caches so the reverted/advanced status shows.
        queryClient.invalidateQueries({ queryKey: taskQuoteKeys.all });
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });

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
        return;
      }

      // Short-circuit: skip sending `quote` in the payload when no quote
      // form field is dirty. Mobile uses task.update() with a nested quote,
      // and the inline-quote path on the API still touches services/configs
      // even on no-op submissions. The API has a defensive filter too, but
      // skipping the field is cheaper and clearer.
      const dirty = methods.formState.dirtyFields as Record<string, any>;
      const dq = (dirty.quote || {}) as Record<string, unknown>;
      const quoteFieldDirty =
        layoutChanged ||
        Boolean(
          dq.status ||
            dq.expiresAt ||
            dq.subtotal ||
            dq.total ||
            dq.guaranteeYears ||
            dq.customGuaranteeText ||
            dq.customForecastDays ||
            dq.layoutFileIds ||
            dq.simultaneousTasks ||
            dq.customerConfigs ||
            dq.services,
        );

      // Layout files are already uploaded and their ids are on quotePayload, so
      // the nested quote update is a plain JSON payload (no multipart needed).
      if (quoteFieldDirty) {
        await updateAsync({
          id: taskId,
          data: { quote: quotePayload } as any,
        });
      }

      // Refresh quote + task caches so the saved status/values are reflected
      // (the task-update mutation alone does not invalidate task-quote queries).
      queryClient.invalidateQueries({ queryKey: taskQuoteKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });

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
  }, [getValues, taskId, updateAsync, router, methods, layoutFiles, existingQuote, queryClient]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    nav.goBack();
  }, [nav]);

  // Full wizard reset: step + local pickers/caches. react-hook-form fields
  // are reset automatically by MultiStepFormContainer via useFormContext.
  // Runs on cancel and after a successful submit.
  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setLayoutFiles([]);
    setSelectedCustomers(new Map());
    customersCache.current = new Map();
  }, []);

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
  const canEditStatus = canUpdateQuoteStatus(userRole);

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
        onReset={handleReset}
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
            canEditStatus={canEditStatus}
            userRole={userRole}
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

