// Installment widget — surfaces upcoming bank-slip / installment due dates so
// financial / commercial users can react quickly. Mirrors the web widget in
// spirit and now in feature set: bucket chips on top, search box, layoutMode
// (flat / grouped-by-bucket / grouped-by-status), six filters, multi-sort,
// configurable column visibility, refetch interval, and per-widget accent.
//
// Backend: read-only — flattens Task → Quote → CustomerConfig → Installment
// from the existing /tasks endpoint. Web does the same; once a dedicated
// /installments endpoint exists, swap `useFlatInstallments` for it.

import { useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  IconReceipt,
  IconAlertTriangle,
  IconCalendarDue,
  IconCircleCheck,
  IconCash,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import {
  INSTALLMENT_STATUS,
  BANK_SLIP_STATUS,
  TASK_QUOTE_STATUS,
  SECTOR_PRIVILEGES,
} from "@/constants/enums";
import {
  INSTALLMENT_STATUS_LABELS,
  BANK_SLIP_STATUS_LABELS,
  TASK_QUOTE_STATUS_LABELS,
} from "@/constants/enum-labels";
import { useTasks } from "@/hooks/useTask";
import { useCustomers } from "@/hooks/useCustomer";
import {
  Section,
  ToggleRow,
  LimitInput,
  ConfigTitleInput,
  TableRefreshSection,
  computeBodyMaxHeight,
  densityClasses,
  DensitySegmented,
  DENSITY_VALUES,
  type Density,
  LabeledField,
} from "./_shared";
import { ColumnPicker } from "../components/column-picker";
import { Input } from "@/components/ui/input";
import {
  WidgetTableContainer,
  WidgetTableSearch,
  WidgetTableRow,
  WidgetTableHeader,
  WidgetTableMessage,
  cellStyleForColumn,
  type WidgetTableColumn,
} from "./_table";
import { Combobox } from "@/components/ui/combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollView } from "react-native-gesture-handler";
import {
  toneForBucket,
  toneForInstallmentStatus,
  toneForBankSlipStatus,
  toneForTaskQuoteStatus,
  type Tone,
} from "./_status-tones";
import { SkeletonRows } from "./_skeleton";
import { WidgetErrorState } from "./_error-state";
import { selectionHaptic } from "@/utils/haptics";
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
  "paid-recent",
] as const;
type Bucket = (typeof BUCKETS)[number];

const BUCKET_LABELS: Record<Bucket, string> = {
  all: "Todas",
  overdue: "Vencidas",
  today: "Hoje",
  tomorrow: "Amanhã",
  "next-7-days": "7 dias",
  "next-30-days": "30 dias",
  "this-month": "Mês",
  "paid-recent": "Pagas",
};

// ---------- Layout mode ----------

const LAYOUT_MODES = ["flat", "grouped-by-bucket", "grouped-by-status"] as const;
type LayoutMode = (typeof LAYOUT_MODES)[number];

const LAYOUT_LABELS: Record<LayoutMode, string> = {
  flat: "Lista única",
  "grouped-by-bucket": "Agrupar por vencimento",
  "grouped-by-status": "Agrupar por status",
};

// ---------- Columns ----------

// 12 keys, mirrors web. The mobile renderer can't fit all of them on a phone
// at once; the user picks 2–4 in the column picker. The defaults are the same
// composite ones the legacy mobile widget shipped with so existing layouts
// migrate cleanly.
const COLUMN_KEYS = [
  "customer",
  "task",
  "installment",
  "dueDate",
  "countdown",
  "amount",
  "paidAmount",
  "installmentStatus",
  "bankSlipStatus",
  "nossoNumero",
  "paymentMethod",
  "quoteStatus",
] as const;
type ColumnKey = (typeof COLUMN_KEYS)[number];

const COLUMN_LABELS: Record<ColumnKey, string> = {
  customer: "Cliente",
  task: "Tarefa",
  installment: "Parcela",
  dueDate: "Vencimento",
  countdown: "Restante",
  amount: "Valor",
  paidAmount: "Valor pago",
  installmentStatus: "Status parcela",
  bankSlipStatus: "Status boleto",
  nossoNumero: "Nosso nº",
  paymentMethod: "Forma",
  quoteStatus: "Status orç.",
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

// Display schema mirrors web's installment-table where bucket chips, count
// toggle, layoutMode, and empty-state copy live UNDER `display` (not as
// top-level config keys). Extends the shared TableDisplay shape with the
// installment-specific extras so saved configs round-trip with web.
interface InstallmentDisplay {
  density: Density;
  striping: boolean;
  gridLines: boolean;
  hoverHighlight: boolean;
  stickyHeader: boolean;
  showHeader: boolean;
  showSearchBox: boolean;
  showRowDot: boolean;
  showColumnHeaders: boolean;
  showBucketChips: boolean;
  showCount: boolean;
  showViewAllLink: boolean;
  layoutMode: LayoutMode;
  emptyStateMessage: string;
  refetchInterval: string;
}

const INSTALLMENT_DISPLAY_DEFAULTS: InstallmentDisplay = {
  density: "comfortable",
  striping: true,
  gridLines: true,
  hoverHighlight: true,
  stickyHeader: false,
  showHeader: true,
  showSearchBox: true,
  showRowDot: false,
  showColumnHeaders: true,
  showBucketChips: true,
  showCount: true,
  showViewAllLink: true,
  layoutMode: "flat",
  emptyStateMessage: "",
  refetchInterval: "0",
};

const installmentDisplaySchema = z
  .object({
    density: z.enum(DENSITY_VALUES).default("comfortable"),
    striping: z.boolean().default(true),
    gridLines: z.boolean().default(true),
    hoverHighlight: z.boolean().default(true),
    stickyHeader: z.boolean().default(false),
    showHeader: z.boolean().default(true),
    showSearchBox: z.boolean().default(true),
    showRowDot: z.boolean().default(false),
    showColumnHeaders: z.boolean().default(true),
    showBucketChips: z.boolean().default(true),
    showCount: z.boolean().default(true),
    showViewAllLink: z.boolean().default(true),
    layoutMode: z.enum(LAYOUT_MODES).default("flat"),
    emptyStateMessage: z.string().max(160).default(""),
    refetchInterval: z
      .string()
      .regex(/^\d+$/, "Intervalo inválido")
      .default("0"),
  })
  .default(INSTALLMENT_DISPLAY_DEFAULTS) as z.ZodType<InstallmentDisplay>;

const configSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(80)
    .default("Boletos")
    .describe("Título exibido no cabeçalho do widget."),

  display: installmentDisplaySchema.describe(
    "Aparência da tabela: densidade, listras, divisórias, busca, chips de prazo, modo de exibição, mensagem vazia, refresh.",
  ),

  /** Visible column keys, in display order. Default mirrors web (8 columns). */
  columns: z
    .array(z.enum(COLUMN_KEYS))
    .default([
      "customer",
      "task",
      "installment",
      "dueDate",
      "countdown",
      "amount",
      "installmentStatus",
      "bankSlipStatus",
    ])
    .describe("Colunas visíveis no widget. Ordem da esquerda para a direita.")
    .transform((cols) =>
      cols.length > 0
        ? cols
        : [
            "customer",
            "task",
            "installment",
            "dueDate",
            "countdown",
            "amount",
            "installmentStatus",
            "bankSlipStatus",
          ],
    ),

  filters: z
    .object({
      defaultBucket: z
        .enum(BUCKETS)
        .default("next-30-days")
        .describe("Filtro de vencimento aplicado ao abrir."),
      installmentStatuses: z
        .array(z.nativeEnum(INSTALLMENT_STATUS))
        .default([])
        .describe("Restringe a parcelas com estes status."),
      bankSlipStatuses: z
        .array(z.nativeEnum(BANK_SLIP_STATUS))
        .default([])
        .describe("Restringe a parcelas com boleto nestes status."),
      customerIds: z
        .array(z.string())
        .default([])
        .describe("Restringe a parcelas destes clientes."),
      hideFullyPaid: z
        .boolean()
        .default(false)
        .describe("Esconde parcelas já pagas."),
      hideMissingBankSlip: z
        .boolean()
        .default(false)
        .describe("Esconde parcelas sem boleto emitido."),
    })
    .default({
      defaultBucket: "next-30-days",
      installmentStatuses: [],
      bankSlipStatuses: [],
      customerIds: [],
      hideFullyPaid: false,
      hideMissingBankSlip: false,
    })
    .describe("Filtros aplicados antes da ordenação."),

  /** Multi-sort. Limit 3 entries on mobile to keep the UI sane (web allows 5). */
  sorts: z
    .array(
      z.object({
        key: z.string(),
        direction: z.enum(["asc", "desc"]),
      }),
    )
    .default([{ key: "dueDate", direction: "asc" }])
    .describe("Ordenação multi-coluna. A primeira chave tem maior prioridade."),

  limit: z
    .number()
    .int()
    .min(5)
    .max(200)
    .default(50)
    .describe("Número máximo de parcelas exibidas."),

  accent: makeAccentSchema({ color: "blue", icon: "Receipt", borderColor: "none" }),
});
type Config = z.infer<typeof configSchema>;

// ---------- Flat row ----------

interface FlatInstallment {
  id: string;
  installmentNumber: number;
  totalInstallments: number;
  taskId: string;
  taskName: string;
  taskSerial: string | null;
  quoteStatus: TASK_QUOTE_STATUS | null;
  customerId: string;
  customerName: string;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  paidAt: Date | null;
  installmentStatus: INSTALLMENT_STATUS;
  paymentMethod: string | null;
  bankSlipId: string | null;
  nossoNumero: string | null;
  bankSlipStatus: BANK_SLIP_STATUS | null;
  daysUntilDue: number;
  bucket: Exclude<Bucket, "all" | "paid-recent">;
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
): FlatInstallment["bucket"] {
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
          installmentNumber: inst.number,
          totalInstallments: totalForTask,
          taskId: task.id,
          taskName: task.name ?? "—",
          taskSerial: task.serialNumber ?? null,
          quoteStatus: (quote.status ?? null) as TASK_QUOTE_STATUS | null,
          customerId: cfg.customer?.id ?? cfg.customerId ?? "",
          customerName: customerLabel(cfg.customer),
          dueDate: due,
          amount: Number(inst.amount ?? 0),
          paidAmount: Number(inst.paidAmount ?? 0),
          paidAt: inst.paidAt ? new Date(inst.paidAt) : null,
          installmentStatus: status,
          paymentMethod: inst.paymentMethod ?? null,
          bankSlipId: bs?.id ?? null,
          nossoNumero: bs?.nossoNumero ?? null,
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
  if (days < 0) return `${Math.abs(days)}d atraso`;
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

// ---------- Filtering / sorting / grouping ----------

function applyFilters(
  rows: FlatInstallment[],
  config: Config,
  bucket: Bucket,
  search: string,
): FlatInstallment[] {
  const term = search.trim().toLowerCase();
  const f = config.filters;
  const today = startOfToday();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const lastDayDays = diffDays(lastDay, today);
  return rows.filter((r) => {
    // Bucket
    if (bucket === "overdue" && r.bucket !== "overdue") return false;
    if (bucket === "today" && r.bucket !== "today") return false;
    if (bucket === "tomorrow" && r.bucket !== "tomorrow") return false;
    if (bucket === "next-7-days" && (r.daysUntilDue < 0 || r.daysUntilDue > 7))
      return false;
    if (bucket === "next-30-days" && (r.daysUntilDue < 0 || r.daysUntilDue > 30))
      return false;
    if (bucket === "this-month") {
      if (r.daysUntilDue < 0 || r.daysUntilDue > lastDayDays) return false;
    }
    if (bucket === "paid-recent") {
      if (r.installmentStatus !== INSTALLMENT_STATUS.PAID) return false;
      if (!r.paidAt) return false;
      if (diffDays(r.paidAt, today) < -30) return false;
    }
    // Filter chips
    if (
      f.installmentStatuses.length &&
      !f.installmentStatuses.includes(r.installmentStatus)
    ) {
      return false;
    }
    if (f.bankSlipStatuses.length) {
      if (!r.bankSlipStatus || !f.bankSlipStatuses.includes(r.bankSlipStatus))
        return false;
    }
    if (f.customerIds.length && !f.customerIds.includes(r.customerId)) return false;
    if (f.hideFullyPaid && r.installmentStatus === INSTALLMENT_STATUS.PAID)
      return false;
    if (f.hideMissingBankSlip && !r.bankSlipId) return false;
    if (term) {
      const hay =
        `${r.customerName} ${r.taskName} ${r.taskSerial ?? ""} ${r.nossoNumero ?? ""}`.toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });
}

function compareRows(a: FlatInstallment, b: FlatInstallment, key: string): number {
  switch (key) {
    case "dueDate":
      return a.dueDate.getTime() - b.dueDate.getTime();
    case "amount":
      return a.amount - b.amount;
    case "customer":
      return a.customerName.localeCompare(b.customerName);
    case "installmentStatus":
      return a.installmentStatus.localeCompare(b.installmentStatus);
    case "bankSlipStatus":
      return (a.bankSlipStatus ?? "ZZZ").localeCompare(b.bankSlipStatus ?? "ZZZ");
    default:
      return 0;
  }
}

function applySort(
  rows: FlatInstallment[],
  sorts: Config["sorts"],
): FlatInstallment[] {
  if (!sorts || sorts.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const s of sorts) {
      const sign = s.direction === "asc" ? 1 : -1;
      const c = compareRows(a, b, s.key);
      if (c !== 0) return sign * c;
    }
    return 0;
  });
}

// Group key extractor for layoutMode. "flat" returns a single empty-string
// group so the renderer collapses to a non-grouped pass.
function groupKeyFor(
  row: FlatInstallment,
  mode: LayoutMode,
): { key: string; label: string } {
  if (mode === "grouped-by-bucket") {
    return { key: row.bucket, label: BUCKET_LABELS[row.bucket] };
  }
  if (mode === "grouped-by-status") {
    return {
      key: row.installmentStatus,
      label: INSTALLMENT_STATUS_LABELS[row.installmentStatus] ?? String(row.installmentStatus),
    };
  }
  return { key: "__flat__", label: "" };
}

// ---------- Column rendering ----------

interface CellRender {
  col: WidgetTableColumn;
  render: (r: FlatInstallment, fontSize: number, metaFontSize: number, fgColor: string, mutedColor: string) => React.ReactNode;
}

// Small inline status pill — solid-tone background with white text, sized for
// dense table rows. Mirrors the visual weight of web's Badge components without
// pulling in a heavy badge primitive on mobile.
function StatusPill({
  label,
  tone,
  fontSize,
}: {
  label: string;
  tone: Tone;
  fontSize: number;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: tone.bg,
        alignSelf: "flex-start",
        maxWidth: "100%",
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: Math.max(10, fontSize - 1),
          fontWeight: "600",
          color: tone.fg,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function makeCellRenders(isDark: boolean): Record<ColumnKey, CellRender> {
  return {
    customer: {
      col: { key: "customer", label: COLUMN_LABELS.customer, flex: 1.6 },
      render: (r, fs, _ms, fg) => (
        <Text
          numberOfLines={1}
          style={{ fontSize: fs, fontWeight: "600", color: fg }}
        >
          {r.customerName}
        </Text>
      ),
    },
    task: {
      col: { key: "task", label: COLUMN_LABELS.task, flex: 1.4 },
      render: (r, fs, ms, fg, muted) => (
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: fs, color: fg }}>
            {r.taskName}
          </Text>
          {r.taskSerial && (
            <Text
              numberOfLines={1}
              style={{ fontSize: ms, color: muted, fontVariant: ["tabular-nums"] }}
            >
              {r.taskSerial}
            </Text>
          )}
        </View>
      ),
    },
    installment: {
      col: { key: "installment", label: COLUMN_LABELS.installment, width: 56, align: "center" },
      render: (r, fs, _ms, fg) => (
        <Text style={{ fontSize: fs, color: fg, fontVariant: ["tabular-nums"] }}>
          {r.installmentNumber}/{r.totalInstallments}
        </Text>
      ),
    },
    dueDate: {
      col: { key: "dueDate", label: COLUMN_LABELS.dueDate, width: 70 },
      render: (r, fs, _ms, fg) => (
        <Text style={{ fontSize: fs, color: fg, fontVariant: ["tabular-nums"] }}>
          {formatDate(r.dueDate)}
        </Text>
      ),
    },
    countdown: {
      col: { key: "countdown", label: COLUMN_LABELS.countdown, width: 80, align: "center" },
      render: (r, fs, _ms) => {
        const isPaid = r.installmentStatus === INSTALLMENT_STATUS.PAID;
        const color = countdownColor(r.daysUntilDue, r.installmentStatus);
        return (
          <Text style={{ fontSize: fs, color, fontWeight: "600" }} numberOfLines={1}>
            {isPaid ? "Pago" : countdownText(r.daysUntilDue)}
          </Text>
        );
      },
    },
    amount: {
      col: { key: "amount", label: COLUMN_LABELS.amount, width: 90, align: "right" },
      render: (r, fs, _ms, fg) => (
        <Text
          style={{
            fontSize: fs,
            fontWeight: "700",
            color: fg,
            fontVariant: ["tabular-nums"],
          }}
          numberOfLines={1}
        >
          {formatBRL(r.amount)}
        </Text>
      ),
    },
    paidAmount: {
      col: { key: "paidAmount", label: COLUMN_LABELS.paidAmount, width: 90, align: "right" },
      render: (r, fs, _ms, fg, muted) => (
        <Text
          style={{
            fontSize: fs,
            color: r.paidAmount > 0 ? fg : muted,
            fontVariant: ["tabular-nums"],
          }}
          numberOfLines={1}
        >
          {formatBRL(r.paidAmount)}
        </Text>
      ),
    },
    installmentStatus: {
      col: { key: "installmentStatus", label: COLUMN_LABELS.installmentStatus, width: 110 },
      render: (r, fs) => (
        <StatusPill
          label={INSTALLMENT_STATUS_LABELS[r.installmentStatus] ?? r.installmentStatus}
          tone={toneForInstallmentStatus(r.installmentStatus, isDark)}
          fontSize={fs}
        />
      ),
    },
    bankSlipStatus: {
      col: { key: "bankSlipStatus", label: COLUMN_LABELS.bankSlipStatus, width: 110 },
      render: (r, fs, _ms, _fg, muted) =>
        r.bankSlipStatus ? (
          <StatusPill
            label={BANK_SLIP_STATUS_LABELS[r.bankSlipStatus] ?? r.bankSlipStatus}
            tone={toneForBankSlipStatus(r.bankSlipStatus, isDark)}
            fontSize={fs}
          />
        ) : (
          <Text numberOfLines={1} style={{ fontSize: fs, color: muted, fontStyle: "italic" }}>
            Sem boleto
          </Text>
        ),
    },
    nossoNumero: {
      col: { key: "nossoNumero", label: COLUMN_LABELS.nossoNumero, width: 100 },
      render: (r, fs, _ms, fg, muted) => (
        <Text
          numberOfLines={1}
          style={{
            fontSize: fs,
            color: r.nossoNumero ? fg : muted,
            fontVariant: ["tabular-nums"],
          }}
        >
          {r.nossoNumero ?? "—"}
        </Text>
      ),
    },
    paymentMethod: {
      col: { key: "paymentMethod", label: COLUMN_LABELS.paymentMethod, width: 90 },
      render: (r, fs, _ms, fg, muted) => (
        <Text numberOfLines={1} style={{ fontSize: fs, color: r.paymentMethod ? fg : muted }}>
          {r.paymentMethod ?? "—"}
        </Text>
      ),
    },
    quoteStatus: {
      col: { key: "quoteStatus", label: COLUMN_LABELS.quoteStatus, width: 100 },
      render: (r, fs, _ms, _fg, muted) =>
        r.quoteStatus ? (
          <StatusPill
            label={TASK_QUOTE_STATUS_LABELS[r.quoteStatus] ?? r.quoteStatus}
            tone={toneForTaskQuoteStatus(r.quoteStatus, isDark)}
            fontSize={fs}
          />
        ) : (
          <Text numberOfLines={1} style={{ fontSize: fs, color: muted }}>
            —
          </Text>
        ),
    },
  };
}

// Tone helper for buckets that includes paid-recent (the shared helper's
// type doesn't list it; treat paid-recent as emerald/green visually).
function bucketChipColor(bucket: Bucket, isDark: boolean): string {
  if (bucket === "paid-recent") return isDark ? "#34d399" : "#059669";
  return toneForBucket(bucket as any, isDark).bg;
}

// ---------- Render ----------

function Render({ config, size }: WidgetRenderProps<Config>) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;
  const display = config.display ?? INSTALLMENT_DISPLAY_DEFAULTS;
  const density = display.density as Density;
  const layoutMode = (display.layoutMode ?? "flat") as LayoutMode;
  const showBucketChips = display.showBucketChips !== false;
  const showCount = display.showCount !== false;
  const visibleColumns: ColumnKey[] = (config.columns?.length
    ? config.columns
    : ([
        "customer",
        "task",
        "installment",
        "dueDate",
        "countdown",
        "amount",
        "installmentStatus",
        "bankSlipStatus",
      ] as ColumnKey[])) as ColumnKey[];

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

  const refetchMs = Number(display.refetchInterval ?? "0");
  const { data, isLoading, isError, refetch, isRefetching } = useTasks(
    queryParams as any,
    refetchMs > 0 ? { refetchInterval: refetchMs } : undefined,
  );

  const allRows = useMemo(
    () => flattenTasksToInstallments(data?.data),
    [data?.data],
  );

  const filtered = useMemo(
    () => applyFilters(allRows, config, bucket, search),
    [allRows, config, bucket, search],
  );

  const sorted = useMemo(() => applySort(filtered, config.sorts), [filtered, config.sorts]);
  const visibleRows = sorted.slice(0, config.limit);

  // Group rows by layoutMode for sectioned rendering. Empty group => flat.
  const grouped = useMemo(() => {
    if (layoutMode === "flat") {
      return [{ key: "__flat__", label: "", rows: visibleRows }];
    }
    const map = new Map<string, { label: string; rows: FlatInstallment[] }>();
    for (const r of visibleRows) {
      const g = groupKeyFor(r, layoutMode);
      const bucketEntry = map.get(g.key);
      if (bucketEntry) bucketEntry.rows.push(r);
      else map.set(g.key, { label: g.label, rows: [r] });
    }
    return Array.from(map.entries()).map(([key, v]) => ({
      key,
      label: v.label,
      rows: v.rows,
    }));
  }, [visibleRows, layoutMode]);

  const bucketCounts = useMemo(() => {
    const today = startOfToday();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const lastDayDays = diffDays(lastDay, today);
    const map: Record<Bucket, number> = {
      all: allRows.length,
      overdue: 0,
      today: 0,
      tomorrow: 0,
      "next-7-days": 0,
      "next-30-days": 0,
      "this-month": 0,
      "paid-recent": 0,
    };
    for (const r of allRows) {
      if (r.bucket === "overdue") map.overdue++;
      if (r.bucket === "today") map.today++;
      if (r.bucket === "tomorrow") map.tomorrow++;
      if (r.daysUntilDue >= 0 && r.daysUntilDue <= 7) map["next-7-days"]++;
      if (r.daysUntilDue >= 0 && r.daysUntilDue <= 30) map["next-30-days"]++;
      if (r.daysUntilDue >= 0 && r.daysUntilDue <= lastDayDays) map["this-month"]++;
      if (
        r.installmentStatus === INSTALLMENT_STATUS.PAID &&
        r.paidAt &&
        diffDays(r.paidAt, today) >= -30
      ) {
        map["paid-recent"]++;
      }
    }
    return map;
  }, [allRows]);

  const cells = useMemo(() => makeCellRenders(isDark), [isDark]);
  const tableColumns = visibleColumns.map((k) => cells[k].col);

  return (
    <WidgetCard
      title={config.title || "Boletos"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref={
        display.showViewAllLink !== false ? "/(tabs)/financeiro/boletos" : undefined
      }
      showHeader={display.showHeader !== false}
      density={density}
      bodyPadded={false}
      bodyMaxHeight={computeBodyMaxHeight(size.rows)}
      onRefresh={refetch}
      refreshing={isRefetching}
      accentColor={accent.hex}
      borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      count={showCount ? visibleRows.length : null}
    >
      <WidgetTableContainer density={density}>
        {display.showSearchBox && (
          <WidgetTableSearch
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar cliente, tarefa ou nosso nº..."
          />
        )}

        {showBucketChips && (
          // Horizontal scroll strip — fits the 8 buckets without forcing a
          // wrap on phones. The previous wrap implementation collapsed to two
          // rows and felt more like a tag cloud than a filter.
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingBottom: 8, paddingRight: 8 }}
            // Disable nested scroll-gesture conflict with parent dashboard scroll.
            // The chips are a single horizontal row.
          >
            {BUCKETS.map((b) => {
              const active = b === bucket;
              const tone = bucketChipColor(b, isDark);
              return (
                <Pressable
                  key={b}
                  onPress={() => {
                    selectionHaptic();
                    setBucket(b);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Filtro ${BUCKET_LABELS[b]}`}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: active ? tone : colors.border,
                    backgroundColor: active
                      ? tone
                      : pressed
                        ? colors.muted
                        : "transparent",
                  })}
                >
                  {b === "overdue" && (
                    <IconAlertTriangle size={11} color={active ? "#fff" : tone} />
                  )}
                  {b === "today" && (
                    <IconCalendarDue size={11} color={active ? "#fff" : tone} />
                  )}
                  {b === "paid-recent" && (
                    <IconCircleCheck size={11} color={active ? "#fff" : tone} />
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
                  {bucketCounts[b] > 0 && (
                    <Text
                      style={{
                        fontSize: 10,
                        color: active ? "#fff" : colors.mutedForeground,
                        fontVariant: ["tabular-nums"],
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

        {display.showColumnHeaders && layoutMode === "flat" && (
          <WidgetTableHeader
            columns={tableColumns}
            reserveRowDot={display.showRowDot}
            density={density}
          />
        )}

        {isLoading ? (
          <SkeletonRows count={5} density={density} />
        ) : isError ? (
          <WidgetErrorState
            message="Erro ao carregar parcelas."
            onRetry={() => refetch()}
          />
        ) : visibleRows.length === 0 ? (
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
          grouped.map((group) => (
            <View key={group.key}>
              {/* Group header — only render when grouping is enabled. */}
              {layoutMode !== "flat" && group.label !== "" && (
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingTop: 10,
                    paddingBottom: 4,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: colors.mutedForeground,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    }}
                  >
                    {group.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: colors.mutedForeground,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {group.rows.length}
                  </Text>
                </View>
              )}
              {/* Per-group header row — only when columns are visible AND
                  grouping mode (top header rendered above otherwise). */}
              {display.showColumnHeaders && layoutMode !== "flat" && (
                <WidgetTableHeader
                  columns={tableColumns}
                  reserveRowDot={display.showRowDot}
                  density={density}
                />
              )}
              {group.rows.map((r, idx) => {
                const cellFontSize = densityClasses(density).fontSize;
                const metaFontSize = Math.max(10, cellFontSize - 2);
                return (
                  <WidgetTableRow
                    key={r.id}
                    density={density}
                    index={idx}
                    striping={display.striping}
                    gridLines={display.gridLines}
                    hoverHighlight={display.hoverHighlight}
                    rowDotColor={
                      display.showRowDot
                        ? toneForInstallmentStatus(r.installmentStatus, isDark).bg
                        : undefined
                    }
                    onPress={() =>
                      router.push(
                        `/(tabs)/financeiro/orcamento/detalhes/${r.taskId}` as any,
                      )
                    }
                  >
                    {visibleColumns.map((key) => {
                      const cell = cells[key];
                      return (
                        <View key={key} style={cellStyleForColumn(cell.col)}>
                          {cell.render(
                            r,
                            cellFontSize,
                            metaFontSize,
                            colors.foreground,
                            colors.mutedForeground,
                          )}
                        </View>
                      );
                    })}
                  </WidgetTableRow>
                );
              })}
            </View>
          ))
        )}
      </WidgetTableContainer>
    </WidgetCard>
  );
}

// ---------- Config ----------

const INSTALLMENT_STATUS_OPTIONS = Object.values(INSTALLMENT_STATUS).map((v) => ({
  value: v,
  label: INSTALLMENT_STATUS_LABELS[v as INSTALLMENT_STATUS] ?? String(v),
}));

const BANK_SLIP_STATUS_OPTIONS = Object.values(BANK_SLIP_STATUS).map((v) => ({
  value: v,
  label: BANK_SLIP_STATUS_LABELS[v as BANK_SLIP_STATUS] ?? String(v),
}));

const LAYOUT_MODE_OPTIONS = LAYOUT_MODES.map((m) => ({
  value: m,
  label: LAYOUT_LABELS[m],
}));

const BUCKET_OPTIONS = BUCKETS.map((b) => ({ value: b, label: BUCKET_LABELS[b] }));

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const { colors } = useTheme();
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });
  const setFilter = <K extends keyof Config["filters"]>(
    key: K,
    value: Config["filters"][K],
  ) => onChange({ ...config, filters: { ...config.filters, [key]: value } });
  const display = (config.display ?? INSTALLMENT_DISPLAY_DEFAULTS) as InstallmentDisplay;
  const setDisplay = <K extends keyof InstallmentDisplay>(
    key: K,
    value: InstallmentDisplay[K],
  ) =>
    onChange({
      ...config,
      display: { ...display, [key]: value } as Config["display"],
    });

  // Customer dropdown — fetches a small slice for the picker. Empty on error.
  const { data: customersData } = useCustomers(
    { take: 200, orderBy: { fantasyName: "asc" } } as any,
  );
  const customerOptions = useMemo(
    () =>
      ((customersData?.data as any[]) ?? []).map((c) => ({
        value: c.id as string,
        label: (c.corporateName || c.fantasyName || "—") as string,
      })),
    [customersData?.data],
  );

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => set("title", v)}
        placeholder="Boletos"
      />

      <Tabs defaultValue="appearance">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabsList style={{ minWidth: 360 }}>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="columns">Colunas</TabsTrigger>
            <TabsTrigger value="filters">Filtros</TabsTrigger>
            <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          </TabsList>
        </ScrollView>

        <TabsContent value="appearance">
          <Section title="Aparência" defaultOpen>
            <AccentPicker
              value={{
                color: (config.accent?.color ?? "blue") as WidgetAccentColor,
                icon: (config.accent?.icon ?? "Receipt") as WidgetAccentIcon,
                borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
              }}
              onChange={(next) => set("accent", next as Config["accent"])}
            />
          </Section>

          <Section title="Cabeçalho">
            <ToggleRow
              label="Exibir cabeçalho"
              checked={display.showHeader !== false}
              onCheckedChange={(v) => setDisplay("showHeader", v)}
            />
            <ToggleRow
              label="Exibir contagem"
              hint="Mostra o número de parcelas no cabeçalho."
              checked={display.showCount}
              onCheckedChange={(v) => setDisplay("showCount", v)}
            />
            <ToggleRow
              label='Link "Ver todos"'
              hint="Mostra o rodapé com atalho para a tela completa."
              checked={display.showViewAllLink !== false}
              onCheckedChange={(v) => setDisplay("showViewAllLink", v)}
            />
            <ToggleRow
              label="Caixa de busca"
              checked={display.showSearchBox}
              onCheckedChange={(v) => setDisplay("showSearchBox", v)}
            />
          </Section>

          <Section title="Densidade" defaultOpen>
            <LabeledField label="Densidade">
              <DensitySegmented
                label=""
                value={display.density as Density}
                onChange={(d) => setDisplay("density", d)}
              />
            </LabeledField>
          </Section>

          <Section title="Aparência da tabela" defaultOpen>
            <LabeledField
              label="Modo de exibição"
              helper="Lista única ou agrupada por vencimento / status."
            >
              <Combobox
                value={display.layoutMode}
                onValueChange={(v: any) =>
                  setDisplay(
                    "layoutMode",
                    (typeof v === "string" ? v : "flat") as LayoutMode,
                  )
                }
                options={LAYOUT_MODE_OPTIONS}
              />
            </LabeledField>
            <ToggleRow
              label="Listras zebra"
              checked={display.striping}
              onCheckedChange={(v) => setDisplay("striping", v)}
            />
            <ToggleRow
              label="Linhas divisórias"
              checked={display.gridLines}
              onCheckedChange={(v) => setDisplay("gridLines", v)}
            />
            <ToggleRow
              label="Cabeçalho fixo"
              checked={display.stickyHeader}
              onCheckedChange={(v) => setDisplay("stickyHeader", v)}
            />
            <ToggleRow
              label="Cabeçalho de colunas"
              checked={display.showColumnHeaders}
              onCheckedChange={(v) => setDisplay("showColumnHeaders", v)}
            />
            <ToggleRow
              label="Filtros rápidos por prazo"
              checked={display.showBucketChips}
              onCheckedChange={(v) => setDisplay("showBucketChips", v)}
            />
            <LabeledField
              label="Mensagem quando vazio"
              helper="Texto exibido quando os filtros não retornam linhas. Deixe em branco para usar o padrão."
            >
              <Input
                placeholder="Nenhuma parcela neste filtro."
                value={display.emptyStateMessage}
                onChangeText={(v: string) =>
                  setDisplay("emptyStateMessage", v.slice(0, 160))
                }
              />
            </LabeledField>
          </Section>
        </TabsContent>

        <TabsContent value="columns">
          <ColumnPicker
            catalog={(COLUMN_KEYS as readonly ColumnKey[]).map((k) => ({
              key: k,
              label: COLUMN_LABELS[k],
            }))}
            selected={
              (config.columns ?? [
                "customer",
                "task",
                "installment",
                "dueDate",
                "countdown",
                "amount",
                "installmentStatus",
                "bankSlipStatus",
              ]) as ColumnKey[]
            }
            onChange={(next) => set("columns", next as Config["columns"])}
            sorts={
              (config.sorts ?? []) as { key: ColumnKey; direction: "asc" | "desc" }[]
            }
            onSortsChange={(next) => set("sorts", next as Config["sorts"])}
            maxSorts={3}
            minVisible={1}
            title="Colunas e ordenação"
          />
        </TabsContent>

        <TabsContent value="filters">
          <Section title="Filtros" defaultOpen>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: colors.foreground }}>
                Filtro inicial
              </Text>
              <Combobox
                value={config.filters.defaultBucket}
                onValueChange={(v: any) =>
                  setFilter(
                    "defaultBucket",
                    (typeof v === "string" ? v : "next-30-days") as Bucket,
                  )
                }
                options={BUCKET_OPTIONS}
              />
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: colors.foreground }}>
                Status da parcela
              </Text>
              <Combobox
                mode="multiple"
                value={config.filters.installmentStatuses as any}
                onValueChange={(v: any) =>
                  setFilter("installmentStatuses", (Array.isArray(v) ? v : []) as any)
                }
                options={INSTALLMENT_STATUS_OPTIONS}
              />
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: colors.foreground }}>
                Status do boleto
              </Text>
              <Combobox
                mode="multiple"
                value={config.filters.bankSlipStatuses as any}
                onValueChange={(v: any) =>
                  setFilter("bankSlipStatuses", (Array.isArray(v) ? v : []) as any)
                }
                options={BANK_SLIP_STATUS_OPTIONS}
              />
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: colors.foreground }}>Clientes</Text>
              <Combobox
                mode="multiple"
                value={config.filters.customerIds as any}
                onValueChange={(v: any) =>
                  setFilter("customerIds", (Array.isArray(v) ? v : []) as any)
                }
                options={customerOptions}
              />
            </View>

            <ToggleRow
              label="Ocultar parcelas pagas"
              checked={config.filters.hideFullyPaid}
              onCheckedChange={(v) => setFilter("hideFullyPaid", v)}
            />
            <ToggleRow
              label="Ocultar parcelas sem boleto"
              checked={config.filters.hideMissingBankSlip}
              onCheckedChange={(v) => setFilter("hideMissingBankSlip", v)}
            />

            <LimitInput
              value={config.limit}
              onChange={(v) => set("limit", v)}
              min={5}
              max={200}
            />
          </Section>
        </TabsContent>

        <TabsContent value="behavior">
          <TableRefreshSection
            value={display.refetchInterval ?? "0"}
            onChange={(v) => setDisplay("refetchInterval", v)}
          />
        </TabsContent>
      </Tabs>
    </View>
  );
}

// ---------- Definition ----------

export const installmentTableWidget: WidgetDefinition<Config> = {
  // Keep web's id so existing layouts persist cleanly.
  id: "financial.installments",
  name: "Boletos",
  description:
    "Acompanhe parcelas e boletos por vencimento. Filtros rápidos, busca, ordenação e colunas configuráveis. Toque em uma linha para abrir o orçamento.",
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
  defaultRows: 2,
  configSchema,
  defaultConfig: {
    title: "Boletos",
    columns: [
      "customer",
      "task",
      "installment",
      "dueDate",
      "countdown",
      "amount",
      "installmentStatus",
      "bankSlipStatus",
    ],
    filters: {
      defaultBucket: "next-30-days",
      installmentStatuses: [],
      bankSlipStatuses: [],
      customerIds: [],
      hideFullyPaid: false,
      hideMissingBankSlip: false,
    },
    sorts: [{ key: "dueDate", direction: "asc" }],
    limit: 50,
    display: { ...INSTALLMENT_DISPLAY_DEFAULTS },
    accent: { color: "blue", icon: "Receipt", borderColor: "none" },
  } as Config,
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
