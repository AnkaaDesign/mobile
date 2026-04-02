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
  View,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, FormProvider, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconPlus,
  IconTrash,
  IconNote,
  IconCurrencyReal,
} from "@tabler/icons-react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import { MultiStepFormContainer } from "@/components/forms";
import { DatePicker } from "@/components/ui/date-picker";
import { BudgetPreview } from "@/components/production/task/quote/budget-preview";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { useTaskMutations } from "@/hooks/useTask";
import { useCreateTaskQuote, taskQuoteKeys } from "@/hooks/useTaskQuote";
import { taskCreateSchema } from "@/schemas/task";
import { taskQuoteCreateNestedSchema } from "@/schemas/task-quote";
import { uploadSingleFile } from "@/api-client/file";
import { getCustomers, customerService } from "@/api-client/customer";
import { useQueryClient } from "@tanstack/react-query";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import {
  TASK_STATUS,
  IMPLEMENT_TYPE,
  SERVICE_ORDER_STATUS,
  SERVICE_ORDER_TYPE,
  DISCOUNT_TYPE,
} from "@/constants/enums";
import { DISCOUNT_TYPE_LABELS } from "@/constants/enum-labels";
import { DEFAULT_TASK_SERVICE_ORDER, getServiceDescriptionsByType } from "@/constants/service-descriptions";
import { formatCurrency } from "@/utils";
import {
  computeServiceNet,
  computeCustomerConfigTotals,
} from "@/utils/task-quote-calculations";
import type { FormStep } from "@/components/ui/form-steps";

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

// ---------------------------------------------------------------------------
// Payment condition options (matching web & TaskQuoteWizard)
// ---------------------------------------------------------------------------
const PAYMENT_CONDITIONS = [
  { value: "CASH_5", label: "A vista (5 dias)" },
  { value: "CASH_40", label: "A vista (40 dias)" },
  { value: "INSTALLMENTS_2", label: "Entrada + 20" },
  { value: "INSTALLMENTS_3", label: "Entrada + 20/40" },
  { value: "INSTALLMENTS_4", label: "Entrada + 20/40/60" },
  { value: "INSTALLMENTS_5", label: "Entrada + 20/40/60/80" },
  { value: "INSTALLMENTS_6", label: "Entrada + 20/40/60/80/100" },
  { value: "INSTALLMENTS_7", label: "Entrada + 20/40/60/80/100/120" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

const VALIDITY_PERIOD_OPTIONS = [
  { value: "15", label: "15 dias" },
  { value: "30", label: "30 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
];

const GUARANTEE_OPTIONS = [
  { value: "5", label: "5 anos" },
  { value: "10", label: "10 anos" },
  { value: "15", label: "15 anos" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

const FORECAST_DAYS_OPTIONS = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} ${i + 1 === 1 ? "dia" : "dias"}`,
}));

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
  const { colors } = useTheme();
  const router = useRouter();
  const { goBack } = useNavigationHistory();
  const { user } = useAuth();
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
        { description: "Em Negociacao", type: SERVICE_ORDER_TYPE.COMMERCIAL, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
        { description: "Elaborar Layout", type: SERVICE_ORDER_TYPE.ARTWORK, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
        { description: "Elaborar Projeto", type: SERVICE_ORDER_TYPE.ARTWORK, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
        { description: "Preparar Arquivos para Plotagem", type: SERVICE_ORDER_TYPE.ARTWORK, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
        { description: "Checklist Entrada", type: SERVICE_ORDER_TYPE.LOGISTIC, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
        { description: "Checklist Saida", type: SERVICE_ORDER_TYPE.LOGISTIC, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
      ] as any[],
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
        { description: "", amount: null, observation: null, invoiceToCustomerId: null, discountType: "NONE", discountValue: null, discountReference: null },
      ] as any[],
    },
  });

  const { control, getValues, setValue, watch } = form;

  // Watch key fields - these trigger re-renders for canProceed reactivity
  const customerConfigs = useWatch({ control, name: "customerConfigs" }) || [];
  const services = useWatch({ control, name: "services" }) || [];
  const watchedCustomerId = watch("customerId");
  const watchedName = useWatch({ control, name: "name" });
  const watchedPlates = useWatch({ control, name: "plates" });
  const watchedSerialNumbers = useWatch({ control, name: "serialNumbers" });
  const watchedExpiresAt = useWatch({ control, name: "expiresAt" });

  // Service field array
  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control,
    name: "services",
  });

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
        paymentCondition: null,
        customPaymentText: null,
        generateInvoice: true,
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
      { id: 2, name: "Informacoes", description: "Prazos e clientes" },
      { id: 3, name: "Servicos", description: "Itens e valores" },
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
      description: "Revisao final",
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
          return "Preencha: Nome, Cliente, Placas ou N de serie.";
        }
      }
      if (step === 2) {
        if (!data.customerConfigs || data.customerConfigs.length === 0) {
          return "Selecione pelo menos um cliente para faturamento.";
        }
        if (!data.expiresAt) {
          return "A data de validade e obrigatoria.";
        }
      }
      if (step === 3) {
        const validServices = (data.services || []).filter((s: any) => s.description?.trim());
        if (validServices.length === 0) {
          return "Adicione pelo menos um servico.";
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

  // ---------------------------------------------------------------------------
  // Recalculate totals when services change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let subtotal = 0;
    let total = 0;
    (services || []).forEach((s: any) => {
      const amt = Number(s.amount) || 0;
      subtotal += amt;
      total += computeServiceNet({ amount: amt, discountType: s.discountType, discountValue: Number(s.discountValue) || 0 });
    });
    setValue("subtotal", subtotal);
    setValue("total", total);

    // Distribute per-customer totals
    const configs = getValues("customerConfigs") || [];
    if (configs.length > 0) {
      const isSingleConfig = configs.length === 1;
      const newConfigs = configs.map((c: any) => {
        const totals = computeCustomerConfigTotals(services || [], c.customerId, isSingleConfig);
        return { ...c, subtotal: totals.subtotal, total: totals.total };
      });
      setValue("customerConfigs", newConfigs);
    }
  }, [services, setValue, getValues]);

  // ---------------------------------------------------------------------------
  // Submit – Create task then quote
  // ---------------------------------------------------------------------------
  const handleSubmit = useCallback(async () => {
    const data = getValues();

    // Final validation
    const servicesValid = (data.services || []).filter((s: any) => s.description?.trim());
    if (servicesValid.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um servico ao orcamento.");
      return;
    }
    if (!data.expiresAt) {
      Alert.alert("Erro", "A data de validade e obrigatoria.");
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
            paymentCondition: c.paymentCondition || null,
            customPaymentText: c.customPaymentText || null,
            generateInvoice: c.generateInvoice ?? true,
            responsibleId: c.responsibleId || null,
          })),
          services: servicesValid.map((s: any) => ({
            description: s.description,
            amount: Number(s.amount) || 0,
            observation: s.observation || null,
            invoiceToCustomerId: s.invoiceToCustomerId || null,
            discountType: s.discountType || "NONE",
            discountValue: toNumber(s.discountValue),
            discountReference: s.discountReference || null,
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
            ? "Orcamento criado com sucesso!"
            : `${successCount} orcamentos criados com sucesso!`,
        );
        if (firstCreatedTaskId) {
          router.replace(`/(tabs)/financeiro/orcamento/detalhes/${firstCreatedTaskId}` as any);
        } else {
          router.replace("/(tabs)/financeiro/orcamento/listar" as any);
        }
      }
    } catch (error: any) {
      console.error("[BudgetCreate] Error:", error);
      Alert.alert("Erro", error?.message || "Erro ao criar orcamento.");
    } finally {
      setIsSubmitting(false);
    }
  }, [getValues, createTaskAsync, createQuoteMutation, queryClient, router, layoutFiles]);

  // ---------------------------------------------------------------------------
  // Render helpers for quote steps
  // ---------------------------------------------------------------------------

  /** Step 2 – Info: customer selection, validity, guarantee, layout */
  const renderInfoStep = () => (
    <View style={{ gap: 16 }}>
      {/* Customer selection for billing */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes para Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Combobox
            label="Selecionar Clientes"
            placeholder="Buscar cliente..."
            mode="multiple"
            async
            value={(customerConfigs || []).map((c: any) => c.customerId)}
            onValueChange={(ids) => {
              const idList = (ids as string[]) || [];
              const newConfigs = idList.map((id) => {
                const existing = (customerConfigs || []).find((c: any) => c.customerId === id);
                if (existing) return existing;
                return {
                  customerId: id,
                  subtotal: 0,
                  total: 0,
                  paymentCondition: null,
                  customPaymentText: null,
                  generateInvoice: true,
                  responsibleId: null,
                };
              });
              setValue("customerConfigs", newConfigs, { shouldDirty: true });
            }}
            queryFn={async (search) => {
              const res = await getCustomers({ search, take: 50 });
              const data = (res?.data || []).map((c: any) => {
                customersCache.current.set(c.id, c);
                return { value: c.id, label: c.fantasyName || c.corporateName || c.id };
              });
              return { data };
            }}
          />
        </CardContent>
      </Card>

      {/* Validity period */}
      <Card>
        <CardHeader>
          <CardTitle>Validade do Orcamento</CardTitle>
        </CardHeader>
        <CardContent style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {VALIDITY_PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant="outline"
                size="sm"
                onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + Number(opt.value));
                  d.setHours(23, 59, 59, 999);
                  setValue("expiresAt", d, { shouldDirty: true });
                }}
              >
                {opt.label}
              </Button>
            ))}
          </View>
          <DatePicker
            label="Data de Validade"
            value={watch("expiresAt") ?? undefined}
            onChange={(d) => { if (d) setValue("expiresAt", d, { shouldDirty: true }); }}
          />
        </CardContent>
      </Card>

      {/* Guarantee */}
      <Card>
        <CardHeader>
          <CardTitle>Garantia</CardTitle>
        </CardHeader>
        <CardContent style={{ gap: 12 }}>
          <Combobox
            label="Periodo de Garantia"
            placeholder="Selecionar..."
            value={watch("guaranteeYears") ? String(watch("guaranteeYears")) : undefined}
            onValueChange={(val) => {
              const v = val as string | undefined;
              if (v === "CUSTOM") {
                setValue("guaranteeYears", null, { shouldDirty: true });
              } else {
                setValue("guaranteeYears", v ? Number(v) : null, { shouldDirty: true });
                setValue("customGuaranteeText", null);
              }
            }}
            options={GUARANTEE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          {watch("guaranteeYears") === null && (
            <View style={{ gap: 4 }}>
              <Label>Texto de Garantia Personalizado</Label>
              <Input
                placeholder="Descreva a garantia..."
                value={watch("customGuaranteeText") || ""}
                onChangeText={(t) => setValue("customGuaranteeText", t || null, { shouldDirty: true })}
                multiline
              />
            </View>
          )}
        </CardContent>
      </Card>

      {/* Forecast days & simultaneous tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Configuracoes</CardTitle>
        </CardHeader>
        <CardContent style={{ gap: 12 }}>
          <Combobox
            label="Prazo de Entrega"
            placeholder="Selecionar..."
            value={watch("customForecastDays") ? String(watch("customForecastDays")) : undefined}
            onValueChange={(v) => {
              const val = v as string | undefined;
              setValue("customForecastDays", val ? Number(val) : null, { shouldDirty: true });
            }}
            options={FORECAST_DAYS_OPTIONS}
          />
          <View style={{ gap: 4 }}>
            <Label>Tarefas Simultaneas</Label>
            <Input
              placeholder="Ex: 1"
              value={watch("simultaneousTasks") ? String(watch("simultaneousTasks")) : ""}
              onChangeText={(t) => setValue("simultaneousTasks", t ? Number(t) : null, { shouldDirty: true })}
              keyboardType="numeric"
            />
          </View>
        </CardContent>
      </Card>

      {/* Layout file */}
      <Card>
        <CardHeader>
          <CardTitle>Layout Aprovado</CardTitle>
        </CardHeader>
        <CardContent>
          <FilePicker
            value={layoutFiles}
            onChange={setLayoutFiles}
            maxFiles={1}
            placeholder="Selecionar layout..."
          />
        </CardContent>
      </Card>
    </View>
  );

  /** Step 3 – Services with pricing */
  const renderServicesStep = () => (
    <View style={{ gap: 16 }}>
      <Card>
        <CardHeader>
          <CardTitle>Servicos</CardTitle>
        </CardHeader>
        <CardContent style={{ gap: 12 }}>
          {serviceFields.map((field, index) => (
            <View
              key={field.id}
              style={{
                gap: 8,
                padding: 12,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Combobox
                label="Descricao"
                placeholder="Selecionar servico..."
                value={watch(`services.${index}.description`) || undefined}
                onValueChange={(v) => {
                  const val = v as string | undefined;
                  setValue(`services.${index}.description`, val || "", { shouldDirty: true });
                }}
                options={getServiceDescriptionsByType(SERVICE_ORDER_TYPE.PRODUCTION).map((d: string) => ({
                  value: d,
                  label: d,
                }))}
                allowCreate
              />
              <View style={{ gap: 4 }}>
                <Label>Valor (R$)</Label>
                <Input
                  placeholder="0,00"
                  value={watch(`services.${index}.amount`) != null ? String(watch(`services.${index}.amount`)) : ""}
                  onChangeText={(t) => {
                    const cleaned = t.replace(/[^0-9.,]/g, "").replace(",", ".");
                    setValue(`services.${index}.amount`, cleaned ? Number(cleaned) : null, { shouldDirty: true });
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
              <Combobox
                label="Desconto"
                placeholder="Sem desconto"
                value={watch(`services.${index}.discountType`) || "NONE"}
                onValueChange={(v) => {
                  const val = v as string | undefined;
                  setValue(`services.${index}.discountType`, val || "NONE", { shouldDirty: true });
                }}
                options={Object.entries(DISCOUNT_TYPE_LABELS).map(([k, l]) => ({ value: k, label: l }))}
              />
              {watch(`services.${index}.discountType`) !== "NONE" && (
                <View style={{ gap: 4 }}>
                  <Label>{watch(`services.${index}.discountType`) === "PERCENTAGE" ? "Desconto (%)" : "Desconto (R$)"}</Label>
                  <Input
                    placeholder="0"
                    value={watch(`services.${index}.discountValue`) != null ? String(watch(`services.${index}.discountValue`)) : ""}
                    onChangeText={(t) => {
                      const cleaned = t.replace(/[^0-9.,]/g, "").replace(",", ".");
                      setValue(`services.${index}.discountValue`, cleaned ? Number(cleaned) : null, { shouldDirty: true });
                    }}
                    keyboardType="decimal-pad"
                  />
                </View>
              )}
              {customerConfigs.length > 1 && (
                <Combobox
                  label="Faturar para"
                  placeholder="Selecionar cliente..."
                  value={watch(`services.${index}.invoiceToCustomerId`) || undefined}
                  onValueChange={(v) => {
                    const val = v as string | undefined;
                    setValue(`services.${index}.invoiceToCustomerId`, val || null, { shouldDirty: true });
                  }}
                  options={customerConfigs.map((c: any) => {
                    const cust = customersCache.current.get(c.customerId);
                    return { value: c.customerId, label: cust?.fantasyName || c.customerId };
                  })}
                />
              )}
              <Button variant="ghost" size="sm" onPress={() => removeService(index)}>
                <IconTrash size={16} color={colors.destructive} />
                <ThemedText style={{ color: colors.destructive, fontSize: fontSize.sm }}>Remover</ThemedText>
              </Button>
            </View>
          ))}

          <Button
            variant="outline"
            onPress={() =>
              appendService({
                description: "",
                amount: null,
                observation: null,
                invoiceToCustomerId: null,
                discountType: "NONE",
                discountValue: null,
                discountReference: null,
              })
            }
          >
            <IconPlus size={16} color={colors.primary} />
            <ThemedText style={{ color: colors.primary }}>Adicionar Servico</ThemedText>
          </Button>

          {/* Totals */}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <ThemedText style={{ fontWeight: "500" }}>Subtotal</ThemedText>
              <ThemedText>{formatCurrency(watch("subtotal") || 0)}</ThemedText>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <ThemedText style={{ fontWeight: "600" }}>Total</ThemedText>
              <ThemedText style={{ fontWeight: "600" }}>{formatCurrency(watch("total") || 0)}</ThemedText>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  /** Steps 4+ – Customer payment details */
  const renderCustomerPaymentStep = (configIndex: number) => {
    const config = customerConfigs[configIndex];
    if (!config) return null;
    const customer = customersCache.current.get(config.customerId);

    return (
      <View style={{ gap: 16 }}>
        <Card>
          <CardHeader>
            <CardTitle>{customer?.fantasyName || customer?.corporateName || "Cliente"}</CardTitle>
          </CardHeader>
          <CardContent style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <ThemedText>Subtotal</ThemedText>
              <ThemedText>{formatCurrency(config.subtotal || 0)}</ThemedText>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <ThemedText style={{ fontWeight: "600" }}>Total</ThemedText>
              <ThemedText style={{ fontWeight: "600" }}>{formatCurrency(config.total || 0)}</ThemedText>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Switch
                value={config.generateInvoice ?? true}
                onValueChange={(v) => {
                  const configs = [...(getValues("customerConfigs") || [])];
                  configs[configIndex] = { ...configs[configIndex], generateInvoice: v };
                  setValue("customerConfigs", configs, { shouldDirty: true });
                }}
              />
              <Label>Gerar Fatura</Label>
            </View>

            <Combobox
              label="Condicao de Pagamento"
              placeholder="Selecionar..."
              value={config.paymentCondition || undefined}
              onValueChange={(v) => {
                const val = v as string | undefined;
                const configs = [...(getValues("customerConfigs") || [])];
                configs[configIndex] = { ...configs[configIndex], paymentCondition: val || null };
                setValue("customerConfigs", configs, { shouldDirty: true });
              }}
              options={PAYMENT_CONDITIONS.map((o) => ({ value: o.value, label: o.label }))}
            />

            {config.paymentCondition === "CUSTOM" && (
              <View style={{ gap: 4 }}>
                <Label>Texto de Pagamento Personalizado</Label>
                <Input
                  placeholder="Descreva as condicoes..."
                  value={config.customPaymentText || ""}
                  onChangeText={(t) => {
                    const configs = [...(getValues("customerConfigs") || [])];
                    configs[configIndex] = { ...configs[configIndex], customPaymentText: t || null };
                    setValue("customerConfigs", configs, { shouldDirty: true });
                  }}
                  multiline
                />
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    );
  };

  /** Final step – Review */
  const renderReviewStep = () => {
    const data = getValues();
    const quoteData = {
      expiresAt: data.expiresAt,
      status: data.budgetStatus,
      subtotal: data.subtotal,
      total: data.total,
      guaranteeYears: data.guaranteeYears,
      customGuaranteeText: data.customGuaranteeText,
      customForecastDays: data.customForecastDays,
      simultaneousTasks: data.simultaneousTasks,
      services: data.services,
      customerConfigs: data.customerConfigs,
    };

    return (
      <View style={{ gap: 16 }}>
        {/* Task summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Tarefa</CardTitle>
          </CardHeader>
          <CardContent style={{ gap: 8 }}>
            {data.name ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <ThemedText style={{ color: colors.mutedForeground }}>Nome</ThemedText>
                <ThemedText>{data.name}</ThemedText>
              </View>
            ) : null}
            {data.plates?.length ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <ThemedText style={{ color: colors.mutedForeground }}>Placas</ThemedText>
                <ThemedText>{data.plates.join(", ")}</ThemedText>
              </View>
            ) : null}
            {data.serialNumbers?.length ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <ThemedText style={{ color: colors.mutedForeground }}>Nos de Serie</ThemedText>
                <ThemedText>{data.serialNumbers.join(", ")}</ThemedText>
              </View>
            ) : null}
          </CardContent>
        </Card>

        {/* Quote preview */}
        <BudgetPreview quote={quoteData} selectedCustomers={selectedCustomers} />
      </View>
    );
  };

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
    if (currentStep === 2) return renderInfoStep();
    if (currentStep === 3) return renderServicesStep();
    if (currentStep === totalSteps) return renderReviewStep();
    // Customer payment steps (4 to totalSteps-1)
    const configIndex = currentStep - 4;
    return renderCustomerPaymentStep(configIndex);
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
        isSubmitting={isSubmitting}
        canProceed={canProceed}
        canSubmit={isLastStep && canProceed}
        submitLabel="Criar Orcamento"
        cancelLabel="Cancelar"
        scrollable
      >
        {renderStepContent()}
      </MultiStepFormContainer>
    </FormProvider>
  );
}
