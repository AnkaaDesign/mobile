// Same as web types
import type { BaseEntity } from './common';
import type { File } from './file';
import type { Installment } from './invoice';

export type TASK_QUOTE_STATUS = 'PENDING' | 'BUDGET_APPROVED' | 'BILLING_APPROVED' | 'UPCOMING' | 'DUE' | 'PARTIAL' | 'SETTLED' | 'CANCELLED';
export type DISCOUNT_TYPE = 'NONE' | 'PERCENTAGE' | 'FIXED_VALUE';

export interface PaymentConfig {
  type: 'CASH' | 'INSTALLMENTS';
  cashDays?: number;
  installmentCount?: number;
  installmentStep?: number;
  entryDays?: number;
  specificDate?: string; // YYYY-MM-DD
}

export interface TaskQuoteService extends BaseEntity {
  description: string;
  observation?: string | null;
  amount: number;
  quoteId: string;
  invoiceToCustomerId?: string | null;
  invoiceToCustomer?: { id: string; corporateName?: string; fantasyName: string; cnpj?: string | null };
  quote?: TaskQuote;
}

export interface TaskQuoteCustomerConfig extends BaseEntity {
  quoteId: string;
  customerId: string;
  subtotal: number;
  total: number;
  discountType: DISCOUNT_TYPE;
  discountValue?: number | null;
  discountReference?: string | null;
  customPaymentText: string | null;
  responsibleId?: string | null;
  paymentCondition?: string | null;
  paymentConfig?: PaymentConfig | null;
  generateInvoice?: boolean;
  generateBankSlip?: boolean;
  orderNumber?: string | null;
  customerSignatureId?: string | null;
  customerSignature?: File;
  customer?: { id: string; corporateName?: string; fantasyName: string; cnpj?: string | null };
  responsible?: { id: string; name: string; role: string };
  installments?: Installment[];
}

export interface TaskQuote extends BaseEntity {
  budgetNumber: number; // Auto-generated sequential number for display
  subtotal: number; // Aggregate: sum of config subtotals
  total: number; // Aggregate: sum of config totals
  expiresAt: Date;
  status: TASK_QUOTE_STATUS;
  statusOrder: number;
  // Anchor for installment due date calculation; set when status transitions to BILLING_APPROVED
  billingApprovedAt?: Date | null;

  // Guarantee Terms
  guaranteeYears: number | null;
  customGuaranteeText: string | null;

  // Custom Forecast - manual override for production days displayed in budget
  customForecastDays: number | null;

  // Layout Files (up to 2)
  layoutFiles?: File[];

  simultaneousTasks: number | null; // Number of simultaneous tasks (1-100)

  task?: any;  // One-to-one relationship with task
  services?: TaskQuoteService[];
  customerConfigs?: TaskQuoteCustomerConfig[];
}
