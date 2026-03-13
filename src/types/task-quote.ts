// Same as web types
import type { File } from './file';
import type { Installment } from './invoice';

export type TASK_QUOTE_STATUS = 'PENDING' | 'BUDGET_APPROVED' | 'VERIFIED_BY_FINANCIAL' | 'BILLING_APPROVED' | 'UPCOMING' | 'DUE' | 'PARTIAL' | 'SETTLED';
export type DISCOUNT_TYPE = 'NONE' | 'PERCENTAGE' | 'FIXED_VALUE';

export type TaskQuoteService = {
  id?: string;
  description: string;
  observation?: string | null;
  amount: number;
  shouldSync?: boolean;
  quoteId?: string;
  invoiceToCustomerId?: string | null;
  invoiceToCustomer?: { id: string; corporateName?: string; fantasyName: string; cnpj?: string | null };
};

export type TaskQuoteCustomerConfig = {
  id?: string;
  quoteId?: string;
  customerId: string;
  subtotal: number;
  discountType: DISCOUNT_TYPE;
  discountValue: number | null;
  total: number;
  responsibleId?: string | null;
  discountReference?: string | null;
  paymentCondition?: string | null;
  downPaymentDate?: Date | null;
  customPaymentText: string | null;
  installments?: Installment[];
  customer?: { id: string; corporateName?: string; fantasyName: string; cnpj?: string | null };
  responsible?: { id: string; name: string; role: string };
  customerSignatureId?: string | null;
  customerSignature?: File;
};

export type TaskQuote = {
  id?: string;
  budgetNumber: number; // Auto-generated sequential number for display
  subtotal: number;
  total: number;
  expiresAt: Date;
  status: TASK_QUOTE_STATUS;
  statusOrder: number;

  // Guarantee Terms
  guaranteeYears: number | null;
  customGuaranteeText: string | null;

  // Custom Forecast - manual override for production days displayed in budget
  customForecastDays: number | null;

  // Layout File
  layoutFileId: string | null;
  layoutFile?: any; // File type

  // Advanced pricing features
  simultaneousTasks: number | null; // Number of tasks being quoted together (for bulk discounts)

  task?: any; // One-to-one relationship with task
  services?: TaskQuoteService[];
  customerConfigs?: TaskQuoteCustomerConfig[];
  createdAt?: Date;
  updatedAt?: Date;
};
