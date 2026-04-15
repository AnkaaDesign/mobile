/**
 * Shared constants for budget (orçamento) and billing (faturamento) wizards.
 * Eliminates duplication between create and edit flows.
 */

import { TASK_STATUS, IMPLEMENT_TYPE, SERVICE_ORDER_STATUS, SERVICE_ORDER_TYPE } from "@/constants/enums";

// Payment condition options (legacy – kept for display of old quotes)
export const PAYMENT_CONDITIONS = [
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

// Preset options for payment condition combobox
export const PAYMENT_PRESET_OPTIONS = [
  { value: "CASH_5",  label: "À vista (5 dias)"                   },
  { value: "CASH_10", label: "À vista (10 dias)"                  },
  { value: "CASH_20", label: "À vista (20 dias)"                  },
  { value: "CASH_40", label: "À vista (40 dias)"                  },
  { value: "INST_2",  label: "Parcelado 2x — 5/25"               },
  { value: "INST_3",  label: "Parcelado 3x — 5/25/45"            },
  { value: "INST_4",  label: "Parcelado 4x — 5/25/45/65"         },
  { value: "INST_5",  label: "Parcelado 5x — 5/25/45/65/85"      },
  { value: "INST_6",  label: "Parcelado 6x — 5/25/45/65/85/105"  },
  { value: "CUSTOM",  label: "Personalizado"                       },
] as const;

// Preset configs for quick lookup
export const PRESET_CONFIGS: Record<string, { type: "CASH" | "INSTALLMENTS"; cashDays?: number; installmentCount?: number; installmentStep?: number; entryDays?: number }> = {
  CASH_5:  { type: "CASH", cashDays: 5  },
  CASH_10: { type: "CASH", cashDays: 10 },
  CASH_20: { type: "CASH", cashDays: 20 },
  CASH_40: { type: "CASH", cashDays: 40 },
  INST_2:  { type: "INSTALLMENTS", installmentCount: 2, installmentStep: 20, entryDays: 5 },
  INST_3:  { type: "INSTALLMENTS", installmentCount: 3, installmentStep: 20, entryDays: 5 },
  INST_4:  { type: "INSTALLMENTS", installmentCount: 4, installmentStep: 20, entryDays: 5 },
  INST_5:  { type: "INSTALLMENTS", installmentCount: 5, installmentStep: 20, entryDays: 5 },
  INST_6:  { type: "INSTALLMENTS", installmentCount: 6, installmentStep: 20, entryDays: 5 },
};

// New structured payment config options
export const CASH_DAYS_OPTIONS = [
  { value: "5",  label: "5 dias" },
  { value: "10", label: "10 dias" },
  { value: "20", label: "20 dias" },
  { value: "40", label: "40 dias" },
] as const;

export const INSTALLMENT_COUNT_OPTIONS = [
  { value: "2", label: "2x" },
  { value: "3", label: "3x" },
  { value: "4", label: "4x" },
  { value: "5", label: "5x" },
  { value: "6", label: "6x" },
] as const;

export const INSTALLMENT_STEP_OPTIONS = [
  { value: "7",  label: "7 dias" },
  { value: "10", label: "10 dias" },
  { value: "14", label: "14 dias" },
  { value: "15", label: "15 dias" },
  { value: "20", label: "20 dias" },
  { value: "25", label: "25 dias" },
  { value: "30", label: "30 dias" },
  { value: "45", label: "45 dias" },
  { value: "60", label: "60 dias" },
] as const;

export const ENTRY_DAYS_OPTIONS = [
  { value: "1",  label: "1 dia" },
  { value: "3",  label: "3 dias" },
  { value: "5",  label: "5 dias" },
  { value: "7",  label: "7 dias" },
  { value: "10", label: "10 dias" },
  { value: "14", label: "14 dias" },
  { value: "15", label: "15 dias" },
  { value: "20", label: "20 dias" },
  { value: "30", label: "30 dias" },
] as const;

// Validity period options
export const VALIDITY_PERIOD_OPTIONS = [
  { value: "15", label: "15 dias" },
  { value: "30", label: "30 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
] as const;

// Guarantee options
export const GUARANTEE_OPTIONS = [
  { value: "5", label: "5 anos" },
  { value: "10", label: "10 anos" },
  { value: "15", label: "15 anos" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

// Quote status options
export const QUOTE_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendente" },
  { value: "BUDGET_APPROVED", label: "Orçamento Aprovado" },
  { value: "COMMERCIAL_APPROVED", label: "Aprovado pelo Comercial" },
  { value: "BILLING_APPROVED", label: "Faturamento Aprovado" },
  { value: "UPCOMING", label: "A Vencer" },
  { value: "DUE", label: "Vencido" },
  { value: "PARTIAL", label: "Parcial" },
  { value: "SETTLED", label: "Liquidado" },
] as const;

// Forecast days options (1-30)
export const FORECAST_DAYS_OPTIONS = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} ${i + 1 === 1 ? "dia" : "dias"}`,
}));

// Default service orders for new tasks
export const DEFAULT_TASK_SERVICE_ORDERS = [
  { description: "Em Negociação", type: SERVICE_ORDER_TYPE.COMMERCIAL, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
  { description: "Elaborar Layout", type: SERVICE_ORDER_TYPE.ARTWORK, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
  { description: "Elaborar Projeto", type: SERVICE_ORDER_TYPE.ARTWORK, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
  { description: "Preparar Arquivos para Plotagem", type: SERVICE_ORDER_TYPE.ARTWORK, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
  { description: "Checklist Entrada", type: SERVICE_ORDER_TYPE.LOGISTIC, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
  { description: "Checklist Saída", type: SERVICE_ORDER_TYPE.LOGISTIC, status: SERVICE_ORDER_STATUS.PENDING, statusOrder: 1, assignedToId: null },
] as const;

// Helpers
export function getDefaultExpiresAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export function formatDocumentNumber(value: string | null | undefined): string {
  if (!value) return "";
  const clean = value.replace(/\D/g, "");
  if (clean.length === 11) return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (clean.length === 14) return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return value;
}

// Default form values for budget creation
export function getDefaultBudgetCreateValues() {
  return {
    // Task fields
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
    serviceOrders: [...DEFAULT_TASK_SERVICE_ORDERS] as any[],
    artworkIds: [] as string[],
    baseFileIds: [] as string[],
    // Quote fields
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
  };
}

// Default form values for quote editing
export function getDefaultQuoteEditValues() {
  return {
    quote: {
      status: "PENDING",
      services: [] as any[],
      subtotal: 0,
      total: 0,
      expiresAt: getDefaultExpiresAt(),
      guaranteeYears: null as number | null,
      customGuaranteeText: null as string | null,
      layoutFileId: null as string | null,
      customForecastDays: null as number | null,
      simultaneousTasks: null as number | null,
      customerConfigs: [] as any[],
    },
  };
}
