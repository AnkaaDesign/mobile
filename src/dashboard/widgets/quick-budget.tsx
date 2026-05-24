// Quick-budget widget — inline form that creates a Task + TaskQuote (Budget)
// directly from the home dashboard. NO navigation to the full wizard.
//
// Mobile mirror of `web/src/dashboard/widgets/quick-budget.tsx`. Field set is
// faithfully ported and grouped into the same three sections (Tarefa /
// Informações / Serviços) so the saved config and per-quote payload match
// web's API exactly. Submission still happens in two calls:
//   1. createTaskAsync({ status: PREPARATION, customerId, name, ... })
//   2. createTaskQuote.mutateAsync({ taskId, expiresAt, services, ... })
//
// IMPORTANT — registration policy:
//   This widget is intentionally **registered but not pushed to
//   `allWidgets`** (mirrors web's commented-out line in `widgets/index.ts`).
//   The user re-enables it once the redesign is signed off. See spec §7.1
//   coordination notes — the widget definition is exported so a future
//   `widgetRegistry.register(quickBudgetWidget)` can light it up without a
//   code change.
//
// Hooks consumed (all confirmed to exist on mobile, 2026-05-10):
//   - useCustomers (mobile/src/hooks/useCustomer.ts)
//   - useTaskMutations.createAsync (mobile/src/hooks/useTask.ts)
//   - useCreateTaskQuote (mobile/src/hooks/useTaskQuote.ts)
// If any are removed in a future refactor, the Render component logs a
// warning and renders a "feature unavailable" placeholder instead of
// crashing.

import { useMemo, useState } from "react";
import { z } from "zod";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  IconReceipt,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { TASK_STATUS, SECTOR_PRIVILEGES } from "@/constants/enums";
import { useCustomers } from "@/hooks/useCustomer";
import { useTaskMutations } from "@/hooks/useTask";
import { useCreateTaskQuote } from "@/hooks/useTaskQuote";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/text-area";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { lightImpactHaptic } from "@/utils/haptics";

import { WidgetCard } from "../components/widget-card";
import {
  AccentPicker,
  makeAccentSchema,
  resolveAccent,
  borderHexFor,
  type WidgetAccentColor,
  type WidgetAccentIcon,
  type WidgetBorderColor,
} from "../components/widget-accent";
import type {
  WidgetConfigProps,
  WidgetDefinition,
  WidgetRenderProps,
} from "../types";
import {
  Section,
  ToggleRow,
  ConfigTitleInput,
  LabeledField,
} from "./_shared";
import { KeyboardAwareWidget } from "./_keyboard-aware-widget";

// ============================================================
// Config schema — mirror of web (~7 fields)
// ============================================================

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Novo Orçamento"),
  accent: makeAccentSchema({ color: "emerald", icon: "Receipt" }),
  defaultCustomerId: z.string().uuid().optional(),
  defaultGuaranteeYears: z.number().int().min(0).max(5).optional(),
  display: z
    .object({
      showHeader: z.boolean().default(true),
    })
    .default({ showHeader: true }),
});
type Config = z.infer<typeof configSchema>;

interface ServiceLine {
  description: string;
  amount: number;
}

function todayPlusDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatBRL(n: number): string {
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ============================================================
// Render
// ============================================================

function Render({ config }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const router = useRouter();
  const accent = useMemo(
    () =>
      resolveAccent({
        color: config.accent?.color as WidgetAccentColor,
        icon: config.accent?.icon as WidgetAccentIcon,
      }),
    [config.accent?.color, config.accent?.icon],
  );
  const AccentIcon = accent.Icon;

  // Hooks may be unavailable in a future refactor — guard with try/catch so
  // the widget degrades to a placeholder rather than crashing the whole
  // dashboard. (Per spec §1 risk #13.)
  let customersData: any = null;
  let createTaskAsync: ((data: any) => Promise<any>) | null = null;
  let createQuoteMutateAsync: ((data: any) => Promise<any>) | null = null;
  let isMutating = false;
  let hooksOk = true;
  try {
    const customersQuery = useCustomers({
      orderBy: { fantasyName: "asc" },
    } as any);
    customersData = customersQuery?.data;
    const taskMutations = useTaskMutations() as any;
    createTaskAsync = taskMutations?.createAsync ?? null;
    isMutating = !!taskMutations?.isLoading;
    const createQuote = useCreateTaskQuote() as any;
    createQuoteMutateAsync = createQuote?.mutateAsync ?? null;
    isMutating = isMutating || !!createQuote?.isPending;
    if (!createTaskAsync || !createQuoteMutateAsync) hooksOk = false;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[quick-budget] required hooks unavailable", err);
    hooksOk = false;
  }

  const customerOptions = useMemo(
    () =>
      ((customersData?.data ?? []) as any[]).map((c) => ({
        value: c.id,
        label: c.fantasyName || c.corporateName,
      })),
    [customersData?.data],
  );

  // ---- Tarefa
  const [customerId, setCustomerId] = useState<string | undefined>(
    config.defaultCustomerId,
  );
  const [taskName, setTaskName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [term, setTerm] = useState<Date | null>(null);
  const [forecastDate, setForecastDate] = useState<Date | null>(null);
  const [details, setDetails] = useState<string>("");

  // ---- Informações
  const [expiresAt, setExpiresAt] = useState<Date>(() => todayPlusDays(15));
  const [customGuaranteeText, setCustomGuaranteeText] = useState<string>("");
  const [customForecastDays, setCustomForecastDays] =
    useState<number | null>(null);

  // ---- Serviços
  const [services, setServices] = useState<ServiceLine[]>([
    { description: "", amount: 0 },
  ]);

  const subtotal = useMemo(
    () =>
      services.reduce(
        (sum, s) => sum + (Number.isFinite(s.amount) ? s.amount : 0),
        0,
      ),
    [services],
  );

  const canSubmit =
    hooksOk &&
    !!customerId &&
    !!expiresAt &&
    services.length > 0 &&
    services.every(
      (s) => s.description.trim().length > 0 && s.amount >= 0,
    ) &&
    subtotal > 0 &&
    !isMutating;

  const reset = () => {
    setTaskName("");
    setSerialNumber("");
    setTerm(null);
    setForecastDate(null);
    setDetails("");
    setExpiresAt(todayPlusDays(15));
    setCustomGuaranteeText("");
    setCustomForecastDays(null);
    setServices([{ description: "", amount: 0 }]);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !customerId || !createTaskAsync || !createQuoteMutateAsync)
      return;
    try {
      lightImpactHaptic();
      const taskRes: any = await createTaskAsync({
        status: TASK_STATUS.PREPARATION,
        customerId,
        name: taskName || undefined,
        serialNumber: serialNumber || undefined,
        term: term ?? undefined,
        forecastDate: forecastDate ?? undefined,
        details: details || undefined,
      });
      const taskId = taskRes?.data?.id ?? taskRes?.id;
      if (!taskId) {
        Alert.alert("Erro", "Tarefa criada mas ID não retornado.");
        return;
      }
      await createQuoteMutateAsync({
        taskId,
        expiresAt,
        status: "PENDING",
        subtotal,
        total: subtotal,
        guaranteeYears: config.defaultGuaranteeYears ?? null,
        customGuaranteeText: customGuaranteeText || null,
        customForecastDays:
          customForecastDays != null ? customForecastDays : null,
        customerConfigs: [{ customerId, subtotal, total: subtotal }],
        services: services.map((s) => ({
          description: s.description.trim(),
          amount: s.amount,
        })),
      });
      Alert.alert("Orçamento criado", "Você pode abrir o detalhe para finalizar.", [
        { text: "OK", style: "cancel" },
        {
          text: "Abrir",
          onPress: () => router.push(`/financeiro/orcamento/detalhes/${taskId}` as any),
        },
      ]);
      reset();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[quick-budget] submit failed", err);
      Alert.alert("Erro", "Não foi possível criar o orçamento. Tente novamente.");
    }
  };

  if (!hooksOk) {
    return (
      <WidgetCard
        title={config.title || "Novo Orçamento"}
        icon={<AccentIcon size={16} color={accent.hex} />}
        showHeader={config.display?.showHeader ?? true}
        accentColor={accent.hex}
        borderColor={borderHexFor(
          config.accent?.borderColor as WidgetBorderColor | undefined,
        )}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            gap: 6,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.foreground,
              textAlign: "center",
            }}
          >
            Indisponível neste app
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: colors.mutedForeground,
              textAlign: "center",
            }}
          >
            Os hooks de criação de tarefa/orçamento ainda não foram portados
            para este aparelho. Use o aplicativo web para gerar orçamentos.
          </Text>
        </View>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title={config.title || "Novo Orçamento"}
      icon={<AccentIcon size={16} color={accent.hex} />}
      showHeader={config.display?.showHeader ?? true}
      accentColor={accent.hex}
      borderColor={borderHexFor(
        config.accent?.borderColor as WidgetBorderColor | undefined,
      )}
      bodyPadded={false}
      // Footer mirrors web's "Formulário completo" link — pushes to the
      // full /financeiro/orcamento/cadastrar wizard for fields not exposed
      // here (file uploads, multi-customer billing, payment terms, etc.).
      viewAllHref="/financeiro/orcamento/cadastrar"
    >
      <KeyboardAwareWidget>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* === Tarefa === */}
          <SectionHeader label="Tarefa" />
          <LabeledField label="Cliente">
            <Combobox
              mode="single"
              value={customerId}
              onValueChange={(v: any) => {
                const id =
                  typeof v === "string"
                    ? v
                    : Array.isArray(v)
                      ? v[0]
                      : undefined;
                setCustomerId(id);
              }}
              options={customerOptions}
              placeholder="Selecione o cliente..."
              searchPlaceholder="Buscar cliente..."
            />
          </LabeledField>
          <LabeledField label="Nome / logomarca">
            <Input
              value={taskName}
              onChangeText={setTaskName}
              placeholder="Identificação da tarefa"
            />
          </LabeledField>
          <LabeledField label="Identificador (chassi/placa)">
            <Input
              value={serialNumber}
              onChangeText={setSerialNumber}
              placeholder="Opcional"
            />
          </LabeledField>
          <LabeledField label="Prazo">
            <DatePicker
              type="date"
              value={term ?? undefined}
              onChange={(d: any) => setTerm(d ?? null)}
              placeholder="Selecionar prazo"
            />
          </LabeledField>
          <LabeledField label="Previsão de entrega">
            <DatePicker
              type="date"
              value={forecastDate ?? undefined}
              onChange={(d: any) => setForecastDate(d ?? null)}
              placeholder="Selecionar previsão"
            />
          </LabeledField>
          <LabeledField label="Descrição / observações">
            <TextArea
              value={details}
              onChangeText={setDetails}
              placeholder="Detalhes do serviço a executar"
              numberOfLines={3}
            />
          </LabeledField>

          {/* === Informações === */}
          <SectionHeader label="Informações" />
          <LabeledField label="Validade do orçamento">
            <DatePicker
              type="date"
              value={expiresAt}
              onChange={(d: any) => d && setExpiresAt(d)}
              placeholder="Selecionar validade"
            />
          </LabeledField>
          <LabeledField label="Garantia personalizada (texto)">
            <Input
              value={customGuaranteeText}
              onChangeText={setCustomGuaranteeText}
              placeholder="Ex.: 90 dias contra defeitos"
            />
          </LabeledField>
          <LabeledField label="Dias de previsão (custom)">
            <Input
              keyboardType="number-pad"
              value={customForecastDays != null ? String(customForecastDays) : ""}
              onChangeText={(v: string) => {
                const cleaned = v.replace(/[^0-9]/g, "");
                if (cleaned === "") setCustomForecastDays(null);
                else {
                  const n = Number(cleaned);
                  setCustomForecastDays(Number.isFinite(n) ? n : null);
                }
              }}
              placeholder="Opcional"
            />
          </LabeledField>

          {/* === Serviços === */}
          <SectionHeader label="Serviços" />
          <Text
            style={{
              fontSize: 11,
              color: colors.mutedForeground,
              lineHeight: 14,
            }}
          >
            Pelo menos uma linha. Total = soma dos valores.
          </Text>
          {services.map((s, i) => (
            <View
              key={i}
              style={{
                gap: 6,
                padding: 8,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 11,
                    fontWeight: "600",
                    color: colors.mutedForeground,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Serviço {i + 1}
                </Text>
                {services.length > 1 && (
                  // Cardinal-rule fix: chrome on outer View, Pressable is a tap surface.
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        lightImpactHaptic();
                        setServices(services.filter((_, idx) => idx !== i));
                      }}
                      hitSlop={8}
                      android_ripple={{ color: "rgba(0,0,0,0.08)" }}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      accessibilityLabel="Remover serviço"
                    >
                      <IconTrash size={14} color={colors.destructive} />
                    </Pressable>
                  </View>
                )}
              </View>
              <Input
                value={s.description}
                onChangeText={(v: string) => {
                  const next = services.slice();
                  next[i] = { ...next[i], description: v };
                  setServices(next);
                }}
                placeholder="Descrição do serviço"
              />
              <Input
                keyboardType="decimal-pad"
                value={s.amount > 0 ? String(s.amount) : ""}
                onChangeText={(v: string) => {
                  const cleaned = v.replace(/[^0-9.,]/g, "").replace(",", ".");
                  const n = Number(cleaned);
                  const next = services.slice();
                  next[i] = {
                    ...next[i],
                    amount: Number.isFinite(n) ? n : 0,
                  };
                  setServices(next);
                }}
                placeholder="Valor (R$)"
              />
            </View>
          ))}
          <Button
            variant="outline"
            onPress={() => {
              lightImpactHaptic();
              setServices([...services, { description: "", amount: 0 }]);
            }}
            icon={<IconPlus size={14} color={colors.foreground} />}
            iconPosition="left"
          >
            Adicionar serviço
          </Button>

          {/* === Subtotal + submit === */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.mutedForeground,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Total
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.foreground,
                fontVariant: ["tabular-nums"],
              }}
            >
              {formatBRL(subtotal)}
            </Text>
          </View>
          <Button
            variant="default"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={isMutating}
          >
            Criar orçamento
          </Button>
        </ScrollView>
      </KeyboardAwareWidget>
    </WidgetCard>
  );
}

function SectionHeader({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: "700",
        color: colors.foreground,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        marginTop: 4,
      }}
    >
      {label}
    </Text>
  );
}

// ============================================================
// Config component
// ============================================================

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });

  const accentColor = (config.accent?.color ?? "emerald") as WidgetAccentColor;
  const accentIcon = (config.accent?.icon ?? "Receipt") as WidgetAccentIcon;
  const accentBorder = (config.accent?.borderColor ?? "none") as WidgetBorderColor;

  // Customer hook may be unavailable; guard.
  let customerOptions: { value: string; label: string }[] = [];
  try {
    const customersQuery = useCustomers({
      orderBy: { fantasyName: "asc" },
    } as any);
    customerOptions = ((customersQuery?.data?.data ?? []) as any[]).map(
      (c) => ({
        value: c.id,
        label: c.fantasyName || c.corporateName,
      }),
    );
  } catch {
    customerOptions = [];
  }

  const guaranteeOptions = [
    { value: "none", label: "Sem padrão" },
    { value: "0", label: "Sem garantia (0 anos)" },
    { value: "1", label: "1 ano" },
    { value: "2", label: "2 anos" },
    { value: "3", label: "3 anos" },
    { value: "4", label: "4 anos" },
    { value: "5", label: "5 anos" },
  ];

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => set("title", v)}
        placeholder="Novo Orçamento"
      />

      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: accentColor,
            icon: accentIcon,
            borderColor: accentBorder,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
      </Section>

      <Section title="Cabeçalho">
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.display?.showHeader ?? true}
          onCheckedChange={(v) =>
            set(
              "display",
              { ...(config.display ?? {}), showHeader: v } as Config["display"],
            )
          }
        />
      </Section>

      <Section title="Valores padrão">
        <LabeledField label="Cliente padrão" helper="Aplicado automaticamente em novos orçamentos.">
          <Combobox
            mode="single"
            value={config.defaultCustomerId}
            onValueChange={(v: any) => {
              const id =
                typeof v === "string"
                  ? v
                  : Array.isArray(v)
                    ? v[0]
                    : undefined;
              set("defaultCustomerId", id);
            }}
            options={customerOptions}
            placeholder="Sem cliente padrão"
            searchPlaceholder="Buscar cliente..."
          />
        </LabeledField>
        <LabeledField label="Garantia padrão (anos)">
          <Combobox
            mode="single"
            value={
              config.defaultGuaranteeYears == null
                ? "none"
                : String(config.defaultGuaranteeYears)
            }
            onValueChange={(v: any) => {
              const raw =
                typeof v === "string"
                  ? v
                  : Array.isArray(v)
                    ? v[0]
                    : "none";
              if (!raw || raw === "none") {
                set("defaultGuaranteeYears", undefined);
              } else {
                const n = Number(raw);
                set(
                  "defaultGuaranteeYears",
                  Number.isFinite(n) ? n : undefined,
                );
              }
            }}
            options={guaranteeOptions}
            placeholder="Sem padrão"
          />
        </LabeledField>
      </Section>
    </View>
  );
}

// ============================================================
// Definition — registered but kept out of `allWidgets` (see widgets/index.ts)
// ============================================================

export const quickBudgetWidget: WidgetDefinition<Config> = {
  id: "quick-action.budget",
  name: "Novo Orçamento",
  description:
    "Crie um orçamento sem sair do painel — agrupado em Tarefa, Informações e Serviços, exatamente como o formulário completo.",
  icon: IconReceipt,
  category: "other",
  // Mirror /financeiro/orcamento page privileges. PRODUCTION_MANAGER is
  // intentionally excluded — managers don't create budgets.
  allowedSectors: [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
  ],
  // Form-heavy widget — the keyboard takes ~half the screen and the user
  // needs vertical room to fill multiple fields. Lock to full-width and
  // tall heights only.
  allowedSpans: [3],
  defaultSpan: 3,
  allowedHeights: [3, 4],
  defaultRows: 4,
  configSchema,
  defaultConfig: {
    title: "Novo Orçamento",
    accent: { color: "emerald", icon: "Receipt" },
    display: { showHeader: true },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
