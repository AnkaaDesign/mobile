// Installment widget — surfaces upcoming bank-slip / installment due dates
// so financial / commercial users can react quickly. Mirrors the web widget
// in spirit (bucket chips on top, card list below) but adapted to mobile:
// chips scroll horizontally, rows are compact cards, tap to push to the
// underlying task's billing screen.

import { useMemo, useState } from "react";
import { z } from "zod";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  IconReceipt,
  IconAlertTriangle,
  IconCalendarDue,
  IconCircleCheck,
  IconRefresh,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import {
  INSTALLMENT_STATUS,
  BANK_SLIP_STATUS,
  TASK_QUOTE_STATUS,
  SECTOR_PRIVILEGES,
} from "@/constants/enums";
import { INSTALLMENT_STATUS_LABELS } from "@/constants/enum-labels";
import { useTasks } from "@/hooks/useTask";
import {
  Section,
  ToggleRow,
  LimitInput,
  type Density,
  makeTableDisplaySchema,
  makeTableSortSchema,
  TABLE_DISPLAY_DEFAULTS,
  TableDisplayConfigSection,
  TableSortConfigSection,
  type TableDisplay,
} from "./_shared";
import {
  WidgetTableContainer,
  WidgetTableSearch,
  WidgetTableRow,
  WidgetTableHeader,
  WidgetTableMessage,
  type WidgetTableColumn,
} from "./_table";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
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

// ---------- Bucket model ----------

const BUCKETS = [
  "all",
  "overdue",
  "today",
  "tomorrow",
  "next-7-days",
  "next-30-days",
  "this-month",
] as const;
type Bucket = (typeof BUCKETS)[number];

const BUCKET_LABELS: Record<Bucket, string> = {
  all: "Todos",
  overdue: "Atrasados",
  today: "Hoje",
  tomorrow: "Amanhã",
  "next-7-days": "7 dias",
  "next-30-days": "30 dias",
  "this-month": "Mês",
};

const BUCKET_TONES: Record<Bucket, string> = {
  all: "#6b7280",
  overdue: "#b91c1c",
  today: "#ea580c",
  tomorrow: "#d97706",
  "next-7-days": "#ca8a04",
  "next-30-days": "#1d4ed8",
  "this-month": "#4f46e5",
};

// Quote statuses that yield meaningful installments. Mirrors web's intent
// using the mobile-side enum values (which differ from web naming —
// BILLING_APPROVED → UPCOMING → DUE → PARTIAL → SETTLED).
const RELEVANT_QUOTE_STATUSES = [
  TASK_QUOTE_STATUS.BILLING_APPROVED,
  TASK_QUOTE_STATUS.UPCOMING,
  TASK_QUOTE_STATUS.DUE,
  TASK_QUOTE_STATUS.PARTIAL,
  TASK_QUOTE_STATUS.SETTLED,
];

// ---------- Schema ----------

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Boletos / Parcelas"),
  showHeader: z.boolean().default(true),
  showBucketChips: z.boolean().default(true),
  filters: z
    .object({
      defaultBucket: z.enum(BUCKETS).default("next-30-days"),
      hideFullyPaid: z.boolean().default(false),
    })
    .default({ defaultBucket: "next-30-days", hideFullyPaid: false }),
  limit: z.number().int().min(5).max(50).default(20),
  sort: makeTableSortSchema(["dueDate", "amount"] as const, "dueDate", "asc"),
  display: makeTableDisplaySchema({ density: "comfortable", showRowDot: true }),
  accent: makeAccentSchema({ color: "cyan", icon: "Receipt", borderColor: "none" }),
});
type Config = z.infer<typeof configSchema>;

// ---------- Flat row ----------

interface FlatInstallment {
  id: string;
  number: number;
  total: number;
  taskId: string;
  taskName: string;
  customerName: string;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  installmentStatus: INSTALLMENT_STATUS;
  bankSlipStatus: BANK_SLIP_STATUS | null;
  daysUntilDue: number;
  bucket: Exclude<Bucket, "all">;
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

function diffDays(target: Date, now: Date): number {
  const a = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

function bucketFor(
  installmentStatus: INSTALLMENT_STATUS,
  bankSlipStatus: BANK_SLIP_STATUS | null,
  daysUntilDue: number,
): Exclude<Bucket, "all"> {
  if (
    installmentStatus === INSTALLMENT_STATUS.OVERDUE ||
    bankSlipStatus === BANK_SLIP_STATUS.OVERDUE ||
    daysUntilDue < 0
  ) {
    return "overdue";
  }
  if (daysUntilDue === 0) return "today";
  if (daysUntilDue === 1) return "tomorrow";
  if (daysUntilDue <= 7) return "next-7-days";
  if (daysUntilDue <= 30) return "next-30-days";
  return "this-month";
}

function customerLabel(c?: { corporateName?: string; fantasyName?: string } | null): string {
  if (!c) return "—";
  return c.corporateName || c.fantasyName || "—";
}

function flattenTasksToInstallments(tasks: any[] | undefined): FlatInstallment[] {
  if (!tasks?.length) return [];
  const today = startOfToday();
  const out: FlatInstallment[] = [];
  for (const task of tasks) {
    const quote = task?.quote;
    if (!quote) continue;
    const configs = quote.customerConfigs ?? [];
    let totalForTask = 0;
    for (const cfg of configs) totalForTask += cfg?.installments?.length ?? 0;
    for (const cfg of configs) {
      for (const inst of cfg?.installments ?? []) {
        if (!inst?.dueDate) continue;
        const due = new Date(inst.dueDate);
        const days = diffDays(due, today);
        const bs = inst.bankSlip ?? null;
        const status = inst.status as INSTALLMENT_STATUS;
        const bsStatus = (bs?.status ?? null) as BANK_SLIP_STATUS | null;
        out.push({
          id: inst.id,
          number: inst.number,
          total: totalForTask,
          taskId: task.id,
          taskName: task.name ?? "—",
          customerName: customerLabel(cfg.customer),
          dueDate: due,
          amount: Number(inst.amount ?? 0),
          paidAmount: Number(inst.paidAmount ?? 0),
          installmentStatus: status,
          bankSlipStatus: bsStatus,
          daysUntilDue: days,
          bucket: bucketFor(status, bsStatus, days),
        });
      }
    }
  }
  return out;
}

const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);

const formatDate = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

function countdownText(days: number): string {
  if (days < 0) return `${Math.abs(days)}d atrasado`;
  if (days === 0) return "vence hoje";
  if (days === 1) return "vence amanhã";
  return `em ${days}d`;
}

function countdownColor(days: number, status: INSTALLMENT_STATUS): string {
  if (status === INSTALLMENT_STATUS.PAID) return "#15803d";
  if (days < 0) return "#b91c1c";
  if (days === 0) return "#ea580c";
  if (days <= 3) return "#d97706";
  return "#6b7280";
}

const TASK_INCLUDE = {
  customer: true,
  quote: {
    include: {
      customerConfigs: {
        include: {
          customer: true,
          installments: { include: { bankSlip: true } },
        },
      },
    },
  },
};

const INSTALLMENT_COLUMNS: WidgetTableColumn[] = [
  { key: "customer", label: "Cliente / Tarefa", flex: 1 },
  { key: "amount", label: "Valor", width: 90, align: "right" },
];

const INSTALLMENT_SORT_OPTIONS = [
  { value: "dueDate", label: "Vencimento" },
  { value: "amount", label: "Valor" },
];

// ---------- Render ----------

function Render({ config }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const router = useRouter();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;
  const display = config.display ?? TABLE_DISPLAY_DEFAULTS;
  const density = display.density as Density;

  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState<Bucket>(config.filters.defaultBucket);

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 200,
      where: { quote: { status: { in: [...RELEVANT_QUOTE_STATUSES] } } },
      include: TASK_INCLUDE,
      orderBy: [{ finishedAt: "desc" as const }],
    }),
    [],
  );

  const { data, isLoading, isError, refetch, isRefetching } = useTasks(
    queryParams as any,
  );
  const allRows = useMemo(
    () => flattenTasksToInstallments(data?.data),
    [data?.data],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allRows.filter((r) => {
      // Bucket filter
      if (bucket !== "all") {
        if (bucket === "this-month") {
          const lastDay = new Date(
            startOfToday().getFullYear(),
            startOfToday().getMonth() + 1,
            0,
          );
          const lastDayDays = diffDays(lastDay, startOfToday());
          if (r.daysUntilDue < 0 || r.daysUntilDue > lastDayDays) return false;
        } else if (bucket === "next-7-days") {
          if (r.daysUntilDue > 7 || r.daysUntilDue < 0) return false;
        } else if (bucket === "next-30-days") {
          if (r.daysUntilDue > 30 || r.daysUntilDue < 0) return false;
        } else if (r.bucket !== bucket) {
          return false;
        }
      }
      if (config.filters.hideFullyPaid && r.installmentStatus === INSTALLMENT_STATUS.PAID)
        return false;
      if (term) {
        const haystack =
          `${r.customerName} ${r.taskName}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [allRows, bucket, search, config.filters.hideFullyPaid]);

  const sorted = useMemo(() => {
    const dir = config.sort.direction === "desc" ? -1 : 1;
    const cmp =
      config.sort.key === "amount"
        ? (a: FlatInstallment, b: FlatInstallment) => (a.amount - b.amount) * dir
        : (a: FlatInstallment, b: FlatInstallment) =>
            (a.dueDate.getTime() - b.dueDate.getTime()) * dir;
    return [...filtered].sort(cmp);
  }, [filtered, config.sort.key, config.sort.direction]);
  const visible = sorted.slice(0, config.limit);

  const bucketCounts = useMemo(() => {
    const map: Record<Bucket, number> = {
      all: allRows.length,
      overdue: 0,
      today: 0,
      tomorrow: 0,
      "next-7-days": 0,
      "next-30-days": 0,
      "this-month": 0,
    };
    for (const r of allRows) {
      if (r.bucket === "overdue") map.overdue++;
      if (r.bucket === "today") map.today++;
      if (r.bucket === "tomorrow") map.tomorrow++;
      if (r.daysUntilDue >= 0 && r.daysUntilDue <= 7) map["next-7-days"]++;
      if (r.daysUntilDue >= 0 && r.daysUntilDue <= 30) map["next-30-days"]++;
    }
    return map;
  }, [allRows]);

  return (
    <WidgetCard
      title={config.title || "Boletos / Parcelas"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref="/(tabs)/financeiro/boletos"
      showHeader={config.showHeader}
      density={density}
      bodyPadded={false}
      borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      headerExtra={
        <Pressable
          onPress={() => refetch()}
          hitSlop={6}
          style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.5 : 1 })}
        >
          <IconRefresh
            size={16}
            color={isRefetching ? colors.primary : colors.mutedForeground}
          />
        </Pressable>
      }
      count={visible.length}
    >
      <WidgetTableContainer density={density}>
        {display.showSearchBox && (
          <WidgetTableSearch>
            <Input
              placeholder="Buscar cliente ou tarefa..."
              value={search}
              onChangeText={setSearch}
            />
          </WidgetTableSearch>
        )}

        {config.showBucketChips && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingBottom: 8 }}
          >
            {BUCKETS.map((b) => {
              const active = b === bucket;
              const tone = BUCKET_TONES[b];
              return (
                <Pressable
                  key={b}
                  onPress={() => setBucket(b)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: active ? tone : colors.border,
                    backgroundColor: active ? tone : pressed ? colors.muted : "transparent",
                  })}
                >
                  {b === "overdue" && (
                    <IconAlertTriangle size={11} color={active ? "#fff" : tone} />
                  )}
                  {b === "today" && (
                    <IconCalendarDue size={11} color={active ? "#fff" : tone} />
                  )}
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: active ? "#fff" : colors.foreground,
                    }}
                  >
                    {BUCKET_LABELS[b]}
                  </Text>
                  {b !== "all" && bucketCounts[b] > 0 && (
                    <Text
                      style={{
                        fontSize: 10,
                        color: active ? "#fff" : colors.mutedForeground,
                      }}
                    >
                      {bucketCounts[b]}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {display.showColumnHeaders && (
          <WidgetTableHeader columns={INSTALLMENT_COLUMNS} />
        )}

        {isLoading ? (
          <WidgetTableMessage>
            <ActivityIndicator color={colors.primary} />
          </WidgetTableMessage>
        ) : isError ? (
          <WidgetTableMessage>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                textAlign: "center",
              }}
            >
              Erro ao carregar parcelas.
            </Text>
          </WidgetTableMessage>
        ) : visible.length === 0 ? (
          <WidgetTableMessage>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                textAlign: "center",
              }}
            >
              {display.emptyStateMessage || "Nenhuma parcela neste filtro."}
            </Text>
          </WidgetTableMessage>
        ) : (
          visible.map((r, idx) => {
            const cdColor = countdownColor(r.daysUntilDue, r.installmentStatus);
            const isPaid = r.installmentStatus === INSTALLMENT_STATUS.PAID;
            return (
              <WidgetTableRow
                key={r.id}
                density={density}
                index={idx}
                striping={display.striping}
                gridLines={display.gridLines}
                hoverHighlight={display.hoverHighlight}
                rowDotColor={display.showRowDot ? accent.hex : undefined}
                onPress={() =>
                  router.push(`/(tabs)/financeiro/orcamento/detalhes/${r.taskId}` as any)
                }
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}
                    >
                      {r.customerName}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 11, color: colors.mutedForeground }}
                    >
                      {r.taskName}
                      {r.total > 1 ? ` · ${r.number}/${r.total}` : ""}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: colors.foreground,
                      }}
                    >
                      {formatBRL(r.amount)}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      {isPaid ? (
                        <IconCircleCheck size={11} color="#15803d" />
                      ) : null}
                      <Text style={{ fontSize: 10, color: cdColor, fontWeight: "600" }}>
                        {isPaid
                          ? INSTALLMENT_STATUS_LABELS[r.installmentStatus]
                          : `${formatDate(r.dueDate)} · ${countdownText(r.daysUntilDue)}`}
                      </Text>
                    </View>
                  </View>
                </View>
              </WidgetTableRow>
            );
          })
        )}
      </WidgetTableContainer>
    </WidgetCard>
  );
}

// ---------- Config ----------

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const { colors } = useTheme();
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });
  const setFilter = <K extends keyof Config["filters"]>(
    key: K,
    value: Config["filters"][K],
  ) => onChange({ ...config, filters: { ...config.filters, [key]: value } });

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>Título</Text>
        <Input
          value={config.title}
          onChangeText={(v: string) => set("title", v)}
          placeholder="Boletos / Parcelas"
        />
      </View>
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "cyan") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Receipt") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.showHeader}
          onCheckedChange={(v) => set("showHeader", v)}
        />
        <ToggleRow
          label="Filtros rápidos por prazo"
          hint="Mostra os botões Hoje / 7 dias / 30 dias / atrasados."
          checked={config.showBucketChips}
          onCheckedChange={(v) => set("showBucketChips", v)}
        />
      </Section>
      <TableDisplayConfigSection
        value={config.display as TableDisplay}
        onChange={(next) => set("display", next as any)}
      />
      <Section title="Filtros" defaultOpen>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Filtro inicial
          </Text>
          <Combobox
            value={config.filters.defaultBucket}
            onValueChange={(v: any) =>
              setFilter("defaultBucket", (typeof v === "string" ? v : "next-30-days") as Bucket)
            }
            options={BUCKETS.map((b) => ({ value: b, label: BUCKET_LABELS[b] }))}
          />
        </View>
        <ToggleRow
          label="Ocultar parcelas pagas"
          checked={config.filters.hideFullyPaid}
          onCheckedChange={(v) => setFilter("hideFullyPaid", v)}
        />
        <LimitInput
          value={config.limit}
          onChange={(v) => set("limit", v)}
          min={5}
          max={50}
        />
      </Section>
      <TableSortConfigSection
        value={config.sort}
        onChange={(next) => set("sort", next as any)}
        keyOptions={INSTALLMENT_SORT_OPTIONS}
      />
    </View>
  );
}

export const installmentTableWidget: WidgetDefinition<Config> = {
  id: "financial.installments",
  name: "Boletos / Parcelas",
  description:
    "Acompanhe parcelas por vencimento — atrasados, hoje, 7/30 dias. Toque em uma parcela para abrir o orçamento da tarefa.",
  icon: IconReceipt,
  category: "financial",
  // Mirror /financeiro/orcamento page privileges.
  allowedSectors: [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
  ],
  allowedSpans: [3],
  defaultSpan: 3,
  allowedHeights: [2, 3],
  defaultRows: 3,
  configSchema,
  defaultConfig: {
    title: "Boletos / Parcelas",
    showHeader: true,
    showBucketChips: true,
    filters: { defaultBucket: "next-30-days", hideFullyPaid: false },
    limit: 20,
    sort: { key: "dueDate", direction: "asc" },
    display: { ...TABLE_DISPLAY_DEFAULTS, density: "comfortable" },
    accent: { color: "cyan", icon: "Receipt", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
