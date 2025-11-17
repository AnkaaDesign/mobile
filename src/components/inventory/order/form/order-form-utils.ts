// Mobile version of order-form-utils.ts
// Core business logic for order form calculations and validations

import { formatCurrency, formatCurrencyWithoutSymbol, parseCurrency, roundToDecimals, isValidNumber, isPositiveNumber, calculateSum } from "@/utils";
import type { Item, Order, OrderItem } from "@/types";
import { ORDER_STATUS } from "@/constants";

// =====================
// TYPE DEFINITIONS
// =====================

export interface OrderFormItem {
  id: string;
  name: string;
  uniCode?: string | null;
  quantity: number;
  price?: number | null;
  category?: {
    id: string;
    name: string;
    type?: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  supplier?: {
    id: string;
    fantasyName: string;
  };
  prices?: Array<{
    id: string;
    value: number;
    createdAt: Date;
  }>;
  availableQuantity?: number;
  minOrderQuantity?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  type: "required" | "supplier" | "business" | "data" | "price" | "quantity";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
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

// =====================
// PRICE CALCULATION FUNCTIONS
// =====================

/**
 * Get the best available price for an item
 * Priority: manual price > latest price > 0
 */
export function getBestItemPrice(item: OrderFormItem, manualPrice?: number | null): number {
  // If manual price is set and valid, use it
  if (manualPrice !== null && manualPrice !== undefined && isValidNumber(manualPrice) && manualPrice >= 0) {
    return manualPrice;
  }

  // Try to get the latest price from item's price history
  if (item.prices && item.prices.length > 0) {
    const sortedPrices = [...item.prices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sortedPrices[0].value;
  }

  // Use item's current price
  if (item.price !== null && item.price !== undefined) {
    return item.price;
  }

  return 0;
}

/**
 * Calculate individual item total with ICMS and IPI
 */
export function calculateItemTotal(item: OrderFormItem, quantity: number, manualPrice?: number | null, icmsRate: number = 0, ipiRate: number = 0): ItemCalculation {
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
 * Calculate totals for all selected items
 */
export function calculateOrderTotals(
  selectedItems: Map<string, OrderFormItem>,
  quantities: Record<string, number>,
  prices: Record<string, number>,
  icmses: Record<string, number>,
  ipis: Record<string, number>,
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
// VALIDATION FUNCTIONS
// =====================

/**
 * Validate order description
 */
export function validateDescription(description: string): ValidationError | null {
  if (!description || description.trim().length === 0) {
    return {
      field: "description",
      message: "Descrição é obrigatória",
      type: "required",
    };
  }

  if (description.trim().length < 3) {
    return {
      field: "description",
      message: "Descrição deve ter pelo menos 3 caracteres",
      type: "data",
    };
  }

  if (description.trim().length > 500) {
    return {
      field: "description",
      message: "Descrição deve ter no máximo 500 caracteres",
      type: "data",
    };
  }

  return null;
}

/**
 * Validate forecast date
 */
export function validateForecast(forecast: Date | null | undefined): ValidationError | null {
  if (!forecast) {
    return null; // Optional field
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (forecast < today) {
    return {
      field: "forecast",
      message: "Data de previsão não pode ser no passado",
      type: "business",
    };
  }

  // Warn if forecast is too far in the future (e.g., more than 1 year)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (forecast > oneYearFromNow) {
    return {
      field: "forecast",
      message: "Data de previsão muito distante (mais de 1 ano)",
      type: "business",
    };
  }

  return null;
}

/**
 * Validate item selection and quantities
 */
export function validateItemSelection(selectedItems: Map<string, OrderFormItem>, quantities: Record<string, number>, supplierId?: string | null): ValidationError[] {
  const errors: ValidationError[] = [];

  if (selectedItems.size === 0) {
    errors.push({
      field: "items",
      message: "Pelo menos um item deve ser selecionado",
      type: "required",
    });
    return errors;
  }

  // Validate each selected item
  selectedItems.forEach((item: OrderFormItem, itemId: string) => {
    const quantity = quantities[itemId] || 1;

    // Validate quantity
    if (!isPositiveNumber(quantity)) {
      errors.push({
        field: `quantity-${itemId}`,
        message: `Quantidade do item "${item.name}" deve ser maior que zero`,
        type: "data",
      });
    }

    if (quantity > 999999) {
      errors.push({
        field: `quantity-${itemId}`,
        message: `Quantidade do item "${item.name}" não pode exceder 999.999`,
        type: "business",
      });
    }

    // Validate minimum order quantity
    if (item.minOrderQuantity && quantity < item.minOrderQuantity) {
      errors.push({
        field: `quantity-${itemId}`,
        message: `Quantidade mínima para "${item.name}" é ${item.minOrderQuantity}`,
        type: "quantity",
      });
    }

    // Validate supplier consistency if supplier is specified
    if (supplierId && item.supplier && item.supplier.id !== supplierId) {
      errors.push({
        field: `item-${itemId}`,
        message: `Item "${item.name}" não pertence ao fornecedor selecionado`,
        type: "supplier",
      });
    }
  });

  return errors;
}

/**
 * Validate item prices
 */
export function validateItemPrices(selectedItems: Map<string, OrderFormItem>, prices: Record<string, number>): ValidationError[] {
  const errors: ValidationError[] = [];

  selectedItems.forEach((item: OrderFormItem, itemId: string) => {
    const manualPrice = prices[itemId];
    const bestPrice = getBestItemPrice(item, manualPrice);

    // Check if item has any price
    if (bestPrice <= 0) {
      errors.push({
        field: `price-${itemId}`,
        message: `Item "${item.name}" não possui preço definido`,
        type: "price",
      });
    }

    // Validate manual price if provided
    if (manualPrice !== undefined && manualPrice !== null) {
      if (!isValidNumber(manualPrice)) {
        errors.push({
          field: `price-${itemId}`,
          message: `Preço do item "${item.name}" deve ser um número válido`,
          type: "data",
        });
      } else if (manualPrice < 0) {
        errors.push({
          field: `price-${itemId}`,
          message: `Preço do item "${item.name}" não pode ser negativo`,
          type: "data",
        });
      } else if (manualPrice > 1000000) {
        errors.push({
          field: `price-${itemId}`,
          message: `Preço do item "${item.name}" não pode exceder R$ 1.000.000,00`,
          type: "business",
        });
      }
    }
  });

  return errors;
}

/**
 * Validate item ICMS
 */
export function validateItemIcms(selectedItems: Map<string, OrderFormItem>, icmses: Record<string, number>): ValidationError[] {
  const errors: ValidationError[] = [];

  selectedItems.forEach((item: OrderFormItem, itemId: string) => {
    const icms = icmses[itemId];

    if (icms !== undefined && icms !== null) {
      if (!isValidNumber(icms)) {
        errors.push({
          field: `icms-${itemId}`,
          message: `ICMS do item "${item.name}" deve ser um número válido`,
          type: "data",
        });
      } else if (icms < 0) {
        errors.push({
          field: `icms-${itemId}`,
          message: `ICMS do item "${item.name}" não pode ser negativo`,
          type: "data",
        });
      } else if (icms > 100) {
        errors.push({
          field: `icms-${itemId}`,
          message: `ICMS do item "${item.name}" não pode exceder 100%`,
          type: "business",
        });
      }
    }
  });

  return errors;
}

/**
 * Validate item IPI
 */
export function validateItemIpi(selectedItems: Map<string, OrderFormItem>, ipis: Record<string, number>): ValidationError[] {
  const errors: ValidationError[] = [];

  selectedItems.forEach((item: OrderFormItem, itemId: string) => {
    const ipi = ipis[itemId];

    if (ipi !== undefined && ipi !== null) {
      if (!isValidNumber(ipi)) {
        errors.push({
          field: `ipi-${itemId}`,
          message: `IPI do item "${item.name}" deve ser um número válido`,
          type: "data",
        });
      } else if (ipi < 0) {
        errors.push({
          field: `ipi-${itemId}`,
          message: `IPI do item "${item.name}" não pode ser negativo`,
          type: "data",
        });
      } else if (ipi > 100) {
        errors.push({
          field: `ipi-${itemId}`,
          message: `IPI do item "${item.name}" não pode exceder 100%`,
          type: "business",
        });
      }
    }
  });

  return errors;
}

// =====================
// BUSINESS RULE HELPERS
// =====================

/**
 * Check if order can be received
 */
export function canReceiveOrder(status: ORDER_STATUS): boolean {
  return [ORDER_STATUS.CREATED, ORDER_STATUS.PARTIALLY_FULFILLED, ORDER_STATUS.FULFILLED, ORDER_STATUS.OVERDUE, ORDER_STATUS.PARTIALLY_RECEIVED].includes(status);
}

/**
 * Check if order can be cancelled
 */
export function canCancelOrder(status: ORDER_STATUS): boolean {
  return status !== ORDER_STATUS.RECEIVED && status !== ORDER_STATUS.CANCELLED;
}

/**
 * Calculate fulfillment percentage
 */
export function calculateFulfillmentPercentage(items: OrderItem[]): number {
  if (!items || items.length === 0) return 0;

  const totalOrdered = items.reduce((sum: number, item: OrderItem) => sum + item.orderedQuantity, 0);
  const totalReceived = items.reduce((sum: number, item: OrderItem) => sum + item.receivedQuantity, 0);

  if (totalOrdered === 0) return 0;
  return Math.round((totalReceived / totalOrdered) * 100);
}

// =====================
// UTILITY FUNCTIONS
// =====================

/**
 * Format price for input
 */
export function formatPriceForInput(value: number | null | undefined): string {
  if (value === null || value === undefined || !isValidNumber(value)) {
    return "";
  }
  return formatCurrencyWithoutSymbol(value);
}

/**
 * Format price for display
 */
export function formatPriceForDisplay(value: number | null | undefined): string {
  if (value === null || value === undefined || !isValidNumber(value)) {
    return formatCurrency(0);
  }
  return formatCurrency(value);
}

/**
 * Parse price input
 */
export function parsePriceInput(value: string): number {
  if (!value || value.trim() === "") {
    return 0;
  }

  const parsed = parseCurrency(value);
  return isValidNumber(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * Format items count
 */
export function formatItemsCount(count: number): string {
  if (count === 0) return "Nenhum item";
  if (count === 1) return "1 item";
  return `${count.toLocaleString("pt-BR")} itens`;
}

/**
 * Generate selection summary
 */
export function generateSelectionSummary(selectedItems: Map<string, OrderFormItem>, quantities: Record<string, number>): string {
  const totalItems = selectedItems.size;
  const totalQuantity = Array.from(selectedItems.keys()).reduce((sum: number, itemId: string) => sum + (quantities[itemId] || 1), 0);

  if (totalItems === 0) {
    return "Nenhum item selecionado";
  }

  const itemText = formatItemsCount(totalItems);
  const quantityText = `${totalQuantity.toLocaleString("pt-BR")} unidades`;

  return `${itemText} - ${quantityText}`;
}

// =====================
// EXPORT UTILITY OBJECT
// =====================

export const orderFormUtils = {
  // Calculation functions
  calculateOrderTotals,
  calculateItemTotal,
  getBestItemPrice,
  calculateFulfillmentPercentage,

  // Validation
  validateDescription,
  validateForecast,
  validateItemSelection,
  validateItemPrices,
  validateItemIcms,
  validateItemIpi,

  // Currency helpers
  formatPriceForInput,
  formatPriceForDisplay,
  parsePriceInput,

  // Business rules
  canReceiveOrder,
  canCancelOrder,

  // Utilities
  formatItemsCount,
  generateSelectionSummary,
};
