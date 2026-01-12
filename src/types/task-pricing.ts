// Same as web types
export type TASK_PRICING_STATUS = 'DRAFT' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type TaskPricingItem = {
  id?: string;
  description: string;
  amount: number;
  pricingId?: string;
};

export type TaskPricing = {
  id?: string;
  total: number;
  expiresAt: Date;
  status: TASK_PRICING_STATUS;
  taskId: string;
  items?: TaskPricingItem[];
  createdAt?: Date;
  updatedAt?: Date;
};
