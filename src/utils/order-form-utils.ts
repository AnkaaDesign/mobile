// Mobile Order Form Utilities
// Ported from web for consistency

import type { OrderCreateFormData, OrderItemCreateFormData } from "@/schemas/order";
import type { Item } from "@/types";
import { ORDER_STATUS } from "@/constants";

// =====================
// TYPE DEFINITIONS
// =====================

export interface OrderFormItem extends Item {
  latestPrice?: number | null;
  manualPrice?: number | null;
}

export interface ItemCalculation {
  itemId: string;
  item: OrderFormItem;
  quantity: number;
  price: number;
  icms: number;
  ipi: number;
  subtotal: number;
  icmsAmount: number;
  ipiAmount: number;
  taxAmount: number;
  total: number;
  hasValidPrice: boolean;
}

export interface OrderTotals {
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  totalIcms: number;
  totalIpi: number;
  totalTax: number;
  grandTotal: number;
  itemCalculations: ItemCalculation[];
  hasItemsWithoutPrice: boolean;
  averageIcmsRate: number;
  averageIpiRate: number;
  averageTaxRate: number;
}

export interface OrderFormData {
  description: string;
  forecast?: Date | null;
  supplierId?: string | null;
  notes?: string | null;
  selectedItems: Map<string, OrderFormItem>;
  quantities: Record<string, number>;
  prices: Record<string, number>;
  icmses: Record<string, number>;
  ipis: Record<string, number>;
  budgetId?: string | null;
  nfeId?: string | null;
  receiptId?: string | null;
}

// =====================
// UTILITY FUNCTIONS
// =====================

/**
 * Rounds a number to specified decimal places with proper monetary rounding
 */
export function roundToDecimals(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Calculates sum of an array of numbers
 */
export function calculateSum(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

/**
 * Gets the best available price for an item
 * Priority: manual price > latest price > item price
 */
export function getBestItemPrice(
  item: OrderFormItem,
  manualPrice?: number | null
): number {
  if (manualPrice !== null && manualPrice !== undefined && manualPrice > 0) {
    return manualPrice;
  }

  if (item.latestPrice !== null && item.latestPrice !== undefined && item.latestPrice > 0) {
    return item.latestPrice;
  }

  return item.price || 0;
}

// =====================
// CALCULATION FUNCTIONS
// =====================

/**
 * Calculates total for a single order item including taxes
 */
export function calculateItemTotal(
  item: OrderFormItem,
  quantity: number,
  manualPrice?: number | null,
  icmsRate: number = 0,
  ipiRate: number = 0
): ItemCalculation {
  const price = getBestItemPrice(item, manualPrice);
  const subtotal = roundToDecimals(quantity * price, 2);
  const icmsAmount = roundToDecimals(subtotal * (icmsRate / 100), 2);
  const ipiAmount = roundToDecimals(subtotal * (ipiRate / 100), 2);
  const taxAmount = roundToDecimals(icmsAmount + ipiAmount, 2);
  const total = roundToDecimals(subtotal + taxAmount, 2);
  const hasValidPrice = price > 0;

  return {
    itemId: item.id,
    item,
    quantity,
    price,
    icms: icmsRate,
    ipi: ipiRate,
    subtotal,
    icmsAmount,
    ipiAmount,
    taxAmount,
    total,
    hasValidPrice,
  };
}

/**
 * Calculates total amounts for all order items including taxes
 */
export function calculateOrderTotals(
  selectedItems: Map<string, OrderFormItem>,
  quantities: Record<string, number>,
  prices: Record<string, number>,
  icmses: Record<string, number>,
  ipis: Record<string, number>
): OrderTotals {
  const itemCalculations: ItemCalculation[] = [];

  // Calculate each item
  selectedItems.forEach((item: OrderFormItem, itemId: string) => {
    const quantity = quantities[itemId] || 1;
    const manualPrice = prices[itemId];
    const icmsRate = icmses[itemId] || 0;
    const ipiRate = ipis[itemId] || 0;

    const calculation = calculateItemTotal(item, quantity, manualPrice, icmsRate, ipiRate);
    itemCalculations.push(calculation);
  });

  const totalItems = selectedItems.size;
  const totalQuantity = calculateSum(itemCalculations.map((calc: ItemCalculation) => calc.quantity));
  const subtotal = roundToDecimals(calculateSum(itemCalculations.map((calc: ItemCalculation) => calc.subtotal)), 2);
  const totalIcms = roundToDecimals(calculateSum(itemCalculations.map((calc: ItemCalculation) => calc.icmsAmount)), 2);
  const totalIpi = roundToDecimals(calculateSum(itemCalculations.map((calc: ItemCalculation) => calc.ipiAmount)), 2);
  const totalTax = roundToDecimals(totalIcms + totalIpi, 2);
  const grandTotal = roundToDecimals(subtotal + totalTax, 2);
  const hasItemsWithoutPrice = itemCalculations.some((calc: ItemCalculation) => !calc.hasValidPrice);

  // Calculate average ICMS and IPI rates
  const averageIcmsRate = subtotal > 0 ? roundToDecimals((totalIcms / subtotal) * 100, 2) : 0;
  const averageIpiRate = subtotal > 0 ? roundToDecimals((totalIpi / subtotal) * 100, 2) : 0;
  const averageTaxRate = subtotal > 0 ? roundToDecimals((totalTax / subtotal) * 100, 2) : 0;

  return {
    totalItems,
    totalQuantity,
    subtotal,
    totalIcms,
    totalIpi,
    totalTax,
    grandTotal,
    itemCalculations,
    hasItemsWithoutPrice,
    averageIcmsRate,
    averageIpiRate,
    averageTaxRate,
  };
}

// =====================
// TRANSFORMATION FUNCTIONS
// =====================

/**
 * Transforms internal form state to API-compatible payload
 */
export function transformFormDataForAPI(formData: OrderFormData): OrderCreateFormData {
  const items: OrderItemCreateFormData[] = [];

  // Transform selected items
  formData.selectedItems.forEach((item: OrderFormItem, itemId: string) => {
    const quantity = formData.quantities[itemId] || 1;
    const price = formData.prices[itemId] || getBestItemPrice(item);
    const icms = formData.icmses[itemId] || 0;
    const ipi = formData.ipis[itemId] || 0;

    items.push({
      itemId,
      orderedQuantity: quantity,
      price,
      icms,
      ipi,
    } as OrderItemCreateFormData);
  });

  return {
    description: formData.description.trim(),
    forecast: formData.forecast,
    status: ORDER_STATUS.CREATED,
    supplierId: formData.supplierId || undefined,
    notes: formData.notes?.trim() || undefined,
    budgetIds: formData.budgetId ? [formData.budgetId] : undefined,
    nfeId: formData.nfeId || undefined,
    receiptId: formData.receiptId || undefined,
    items,
  };
}

/**
 * Sanitizes directory name for file storage
 */
export function sanitizeDirectoryName(name: string): string {
  if (!name) return "";

  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s\-_]/g, "") // Remove special chars
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .substring(0, 50); // Limit length
}

/**
 * Creates FormData for order submission with files
 * Combines JSON data and file uploads in atomic request
 */
export function createOrderFormData(
  data: Record<string, any>,
  files: {
    budgets?: { uri: string; name: string; type: string }[];
    receipts?: { uri: string; name: string; type: string }[];
    invoices?: { uri: string; name: string; type: string }[];
  },
  supplier?: { id: string; name?: string; fantasyName?: string },
  user?: { name: string }
): FormData {
  const formData = new FormData();

  // Add context metadata for file organization
  const context = {
    entityType: "order",
    entityId: data.id || undefined,
    supplierName: supplier ? sanitizeDirectoryName(supplier.fantasyName || supplier.name || "") : "",
    userName: user ? sanitizeDirectoryName(user.name) : "",
  };

  formData.append("_context", JSON.stringify(context));

  // Add regular form data
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  // Add files with proper field names
  if (files.budgets && files.budgets.length > 0) {
    files.budgets.forEach((file) => {
      formData.append("budgets", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });
  }

  if (files.receipts && files.receipts.length > 0) {
    files.receipts.forEach((file) => {
      formData.append("receipts", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });
  }

  if (files.invoices && files.invoices.length > 0) {
    files.invoices.forEach((file) => {
      formData.append("invoices", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });
  }

  return formData;
}
