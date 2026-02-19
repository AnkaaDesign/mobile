// Same as web types
export type TASK_PRICING_STATUS = 'DRAFT' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type DISCOUNT_TYPE = 'NONE' | 'PERCENTAGE' | 'FIXED_VALUE';
export type PAYMENT_CONDITION =
  | 'CASH'           // Single payment
  | 'INSTALLMENTS_2' // Down payment + 1 installment (20 days)
  | 'INSTALLMENTS_3' // Down payment + 2 installments (20/40 days)
  | 'INSTALLMENTS_4' // Down payment + 3 installments (20/40/60 days)
  | 'INSTALLMENTS_5' // Down payment + 4 installments (20/40/60/80 days)
  | 'INSTALLMENTS_6' // Down payment + 5 installments (20/40/60/80/100 days)
  | 'INSTALLMENTS_7' // Down payment + 6 installments (20/40/60/80/100/120 days)
  | 'CUSTOM';        // Custom payment terms

export type TaskPricingItem = {
  id?: string;
  description: string;
  observation?: string | null;
  amount: number;
  pricingId?: string;
};

export type TaskPricing = {
  id?: string;
  budgetNumber: number; // Auto-generated sequential number for display
  subtotal: number;
  discountType: DISCOUNT_TYPE;
  discountValue: number | null;
  total: number;
  expiresAt: Date;
  status: TASK_PRICING_STATUS;

  // Payment Terms (simplified)
  paymentCondition: PAYMENT_CONDITION | null;
  downPaymentDate: Date | null;
  customPaymentText: string | null;

  // Guarantee Terms
  guaranteeYears: number | null;
  customGuaranteeText: string | null;

  // Custom Forecast - manual override for production days displayed in budget
  customForecastDays: number | null;

  // Layout File
  layoutFileId: string | null;
  layoutFile?: any; // File type

  // Customer Signature
  customerSignatureId: string | null;
  customerSignature?: any; // File type

  // NEW FIELDS: Multi-customer invoicing support
  invoicesToCustomerIds: string[] | null; // Array of customer IDs to invoice
  invoicesToCustomers?: any[]; // Customer entities for invoice recipients

  // NEW FIELDS: Advanced pricing features
  simultaneousTasks: number | null; // Number of tasks being quoted together (for bulk discounts)
  discountReference: string | null; // Reference text for discount justification (e.g., "Desconto por volume de 3 implementos")

  task?: any; // One-to-one relationship with task
  items?: TaskPricingItem[];
  createdAt?: Date;
  updatedAt?: Date;
};
