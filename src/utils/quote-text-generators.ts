import { formatCurrency } from './index';
import { PAYMENT_CONDITION } from '../constants/enums';

/**
 * Convert number to written form in Portuguese
 */
function numberToWord(n: number): string {
  const words: Record<number, string> = {
    1: 'uma',
    2: 'duas',
    3: 'três',
    4: 'quatro',
    5: 'cinco',
    6: 'seis',
    7: 'sete',
  };
  return words[n] || n.toString();
}

/**
 * Get the number of installments from payment condition
 */
function getInstallmentCount(condition: PAYMENT_CONDITION | null): number {
  if (!condition) return 0;

  const countMap: Record<PAYMENT_CONDITION, number> = {
    [PAYMENT_CONDITION.CASH_5]: 1,
    [PAYMENT_CONDITION.CASH_40]: 1,
    [PAYMENT_CONDITION.INSTALLMENTS_2]: 2,
    [PAYMENT_CONDITION.INSTALLMENTS_3]: 3,
    [PAYMENT_CONDITION.INSTALLMENTS_4]: 4,
    [PAYMENT_CONDITION.INSTALLMENTS_5]: 5,
    [PAYMENT_CONDITION.INSTALLMENTS_6]: 6,
    [PAYMENT_CONDITION.INSTALLMENTS_7]: 7,
    [PAYMENT_CONDITION.CUSTOM]: 0,
  };

  return countMap[condition] || 0;
}

interface PaymentTextData {
  customPaymentText: string | null;
  paymentCondition?: string | null;
  total: number;
}

/**
 * Generate payment terms text based on payment data
 * If customPaymentText is provided, it overrides the auto-generated text
 *
 * Payment structure:
 * - CASH_5/CASH_40: 1 payment (à vista)
 * - INSTALLMENTS_2: 2 payments (entrada + 20 days)
 * - INSTALLMENTS_3: 3 payments (entrada + 20 + 40 days)
 * - etc. (always 20 days interval between payments)
 */
export function generatePaymentText(pricing: PaymentTextData): string {
  // If custom text is provided, use it
  if (pricing.customPaymentText) {
    return pricing.customPaymentText;
  }

  const paymentCondition = pricing.paymentCondition ?? null;

  // No payment condition, return empty
  if (!paymentCondition || paymentCondition === PAYMENT_CONDITION.CUSTOM) {
    return '';
  }

  const installmentCount = getInstallmentCount(paymentCondition as PAYMENT_CONDITION | null);
  if (installmentCount === 0) return '';

  const total = pricing.total;
  const installmentValue = Math.round((total / installmentCount) * 100) / 100;
  const word = numberToWord(installmentCount);

  // CASH_5: à vista for 5 days
  if (paymentCondition === PAYMENT_CONDITION.CASH_5) {
    return `Pagamento à vista no valor de ${formatCurrency(total)} para 5 dias a partir da finalização do serviço.`;
  }

  // CASH_40: à vista for 40 days
  if (paymentCondition === PAYMENT_CONDITION.CASH_40) {
    return `Pagamento à vista no valor de ${formatCurrency(total)} para 40 dias a partir da finalização do serviço.`;
  }

  // Installment payments
  return `Fica acertado o pagamento em ${installmentCount} (${word}) parcelas de ${formatCurrency(installmentValue)}, com entrada para 5 dias a partir da finalização do serviço e as demais a cada 20 dias.`;
}

/**
 * Generate guarantee terms text based on pricing data
 * If customGuaranteeText is provided, it overrides the auto-generated text
 */
export function generateGuaranteeText(pricing: { customGuaranteeText?: string | null; guaranteeYears?: number | null }): string {
  // If custom text is provided, use it
  if (pricing.customGuaranteeText) {
    return pricing.customGuaranteeText;
  }

  // No guarantee years, return empty
  if (!pricing.guaranteeYears) {
    return '';
  }

  return `A Garantia para o serviço de pintura é de ${pricing.guaranteeYears} anos desde que seja atendido as condições de uso e cuidado do implemento.`;
}
