// Same as web types
import type { File } from './file';
import type { Installment } from './invoice';

export type TASK_PRICING_STATUS = 'PENDING' | 'BUDGET_APPROVED' | 'VERIFIED' | 'INTERNAL_APPROVED' | 'UPCOMING' | 'PARTIAL' | 'SETTLED';
export type DISCOUNT_TYPE = 'NONE' | 'PERCENTAGE' | 'FIXED_VALUE';

export type TaskPricingService = {
  id?: string;
  description: string;
  observation?: string | null;
  amount: number;
  shouldSync?: boolean;
  pricingId?: string;
  invoiceToCustomerId?: string | null;
  invoiceToCustomer?: { id: string; corporateName?: string; fantasyName: string; cnpj?: string | null };
};

export type TaskPricingCustomerConfig = {
  id?: string;
  pricingId?: string;
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

export type TaskPricing = {
  id?: string;
  budgetNumber: number; // Auto-generated sequential number for display
  subtotal: number;
  total: number;
  expiresAt: Date;
  status: TASK_PRICING_STATUS;
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
  services?: TaskPricingService[];
  customerConfigs?: TaskPricingCustomerConfig[];
  createdAt?: Date;
  updatedAt?: Date;
};
