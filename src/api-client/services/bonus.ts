import { apiClient } from '../axiosClient';
import type { BatchOperationResult } from '../../types';

// Import proper types from packages
import type {
  Bonus,
  BonusIncludes,
  BonusGetManyParams as BonusGetManyParamsType,
  BonusGetManyResponse as BonusGetManyResponseType,
  BonusGetByIdParams
} from '../../types';

import type {
  BonusCreateFormData,
  BonusUpdateFormData
} from '../../schemas';

// Interfaces for live bonus calculation and payroll data
interface BonusPayrollFilters {
  year?: string;
  month?: string | string[];
  includeInactive?: boolean;
}

interface BonusPayrollParams {
  year?: string;
  month?: string;
  userId?: string;
}

interface PayrollData {
  meta: {
    period: string;
    totalUsers: number;
    eligibleUsers: number;
    averageTaskPerUser: number;
    totalTasks: number;
    calculatedAt: string;
  };
  bonuses: {
    userId: string;
    userName: string;
    userCpf: string;
    positionName: string;
    level: number;
    baseBonus: number;
    netBonus: number;
    weightedTasks: number;
    averageTaskPerUser: number;
    performance: number;
    sector: {
      id: string;
      name: string;
    };
  }[];
  summary: {
    totalBonus: number;
    averageBonus: number;
    minBonus: number;
    maxBonus: number;
  };
}

interface BonusDiscountCreateFormData {
  bonusId?: string;
  reference: string;
  percentage: number;
  value?: number | null;
  calculationOrder?: number;
}

// Interfaces for bonus calculation and batch operations
export interface BonusCalculationParams {
  year: string;
  month: string;
}

/**
 * Request shape for the salary-based logistic bonus simulation. Mirrors the
 * web client and the API `bonusSimulateSchema` exactly so the same algorithm
 * runs everywhere.
 */
export interface BonusSimulateInput {
  averageTasksPerUser: number;
  users: Array<{
    id?: string;
    name?: string;
    positionName?: string;
    positionId?: string;
    sectorName?: string;
    /** Either `salary` or `positionId`/`positionName` must be provided; the
     * API resolves the salary from the position when only that is given. */
    salary?: number;
    performanceLevel: number;
  }>;
  config?: {
    k?: number;
    x0?: number;
    piso?: number;
    pscale?: number;
    ceil?: number;
    adjustment?: number;
  };
  /** Period the simulation targets. When set (and no explicit
   * config.adjustment), the API injects the saved period reajuste. */
  year?: number;
  month?: number;
  salaryRange?: { min: number; max: number };
}

export interface SimulateResponseUser {
  id?: string;
  name?: string;
  positionName?: string;
  positionId?: string;
  sectorName?: string;
  salary: number;
  performanceLevel: number;
  bonus: number;
  baseBonus: number;
  ratio: number;
  x: number;
  anchor: number;
  performanceMultiplier: number;
}

export interface SimulateResponse {
  averageTasksPerUser: number;
  salaryRange: { min: number; max: number };
  config: { k: number; x0: number; piso: number; pscale: number; ceil: number; adjustment: number };
  anchor: number;
  users: SimulateResponseUser[];
  totals: { totalBonus: number; userCount: number; eligibleCount: number };
}

export interface BonusCalculationResult {
  success: boolean;
  message: string;
  data: {
    totalProcessed: number;
    totalSuccess: number;
    totalFailed: number;
    details: Array<{
      userId: string;
      userName: string;
      status: 'success' | 'failed';
      error?: string;
      calculatedBonus?: number;
    }>;
  };
}

export const bonusService = {
  // Standard CRUD operations using proper types
  getMany: async (params?: BonusGetManyParamsType) => {
    return apiClient.get<BonusGetManyResponseType>('/bonus', { params });
  },

  getById: async (id: string, params?: BonusGetByIdParams) => {
    return apiClient.get<Bonus>(`/bonus/${id}`, { params });
  },

  create: (data: BonusCreateFormData) =>
    apiClient.post<Bonus>('/bonus', data),

  update: (id: string, data: BonusUpdateFormData) =>
    apiClient.put<Bonus>(`/bonus/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/bonus/${id}`),

  // Batch operations
  batchCreate: (data: BonusCreateFormData[]) =>
    apiClient.post<BatchOperationResult<Bonus>>('/bonus/batch', { bonuses: data }),

  batchUpdate: (data: { id: string; data: BonusUpdateFormData }[]) =>
    apiClient.put<BatchOperationResult<Bonus>>('/bonus/batch', { updates: data }),

  batchDelete: (ids: string[]) =>
    apiClient.delete<BatchOperationResult<Bonus>>('/bonus/batch', { data: { ids } }),

  // Personal bonus operations (no admin privileges required)
  /**
   * Get current user's saved bonuses
   * Returns only bonuses belonging to the authenticated user
   * No admin/HR privileges required - accessible to all users
   */
  getMyBonuses: (params?: BonusGetManyParamsType) =>
    apiClient.get<BonusGetManyResponseType>('/bonuses/my-bonuses', { params }),

  /**
   * Get current user's bonus detail
   * Returns only if the bonus belongs to the authenticated user
   * No admin/HR privileges required - accessible to all users
   */
  getMyBonusDetail: (id: string, params?: BonusGetByIdParams) =>
    apiClient.get<Bonus>(`/bonuses/my-bonuses/${id}`, { params }),

  /**
   * Get current user's live bonus calculation
   * Returns real-time bonus calculation for the authenticated user
   * No admin/HR privileges required - accessible to all users
   */
  getMyLiveBonus: (params?: BonusPayrollParams) =>
    apiClient.get<{ success: boolean; message: string; data: any | null }>('/bonuses/my-live-bonus', { params }),

  /**
   * Get period task stats for bonus simulation (no admin privileges required)
   * Returns lightweight task counts and averages without Secullum
   */
  getMyPeriodTaskStats: (year: number, month: number) =>
    apiClient.get<any>(`/bonuses/my-period-stats/${year}/${month}`),

  /**
   * Run the salary-based logistic bonus simulation (HR/admin).
   *
   * The bonus ALGORITHM lives in exactly one place — the API. Mobile must NOT
   * recompute bonuses client-side; both simulators POST here. Passing
   * `year`/`month` makes the API inject the saved period reajuste so the
   * simulated value matches the real, saved bonus to the cent.
   */
  simulate: (data: BonusSimulateInput) =>
    apiClient.post<any>('/bonus/simulate', data),

  /**
   * Personal ("my bonus") simulation for the authenticated employee.
   * Identical algorithm/parameters to `simulate`, on a route open to all
   * roles (a regular employee can't hit the HR-only POST /bonus/simulate).
   */
  simulateMyBonus: (data: BonusSimulateInput) =>
    apiClient.post<any>('/bonuses/my-bonus-simulate', data),

  // =====================================================
  // Live Bonus Calculation Endpoints (NEW - Clean Implementation)
  // =====================================================

  /**
   * Get lightweight period task stats for bonus simulation (no Secullum)
   * Uses endpoint: GET /bonus/period-stats/:year/:month
   */
  getPeriodTaskStats: (year: number, month: number) =>
    apiClient.get<any>(`/bonus/period-stats/${year}/${month}`),

  /**
   * Get live bonus calculations for a specific period
   * Uses new clean endpoint: GET /bonus/live/:year/:month
   */
  getLiveBonuses: (year: number, month: number) =>
    apiClient.get<PayrollData>(`/bonus/live/${year}/${month}`),

  /**
   * Get live bonus calculation for a specific user
   * Uses new clean endpoint: GET /bonus/live/:userId/:year/:month
   */
  getLiveBonusForUser: (userId: string, year: number, month: number) =>
    apiClient.get<any>(`/bonus/live/${userId}/${year}/${month}`),

  /**
   * Calculate and save bonuses for a specific period (Admin only)
   * Uses new clean endpoint: POST /bonus/calculate/:year/:month
   */
  calculateAndSaveBonuses: (params: BonusCalculationParams) =>
    apiClient.post<BonusCalculationResult>(`/bonus/calculate/${params.year}/${params.month}`),

  calculateBonuses: (params: BonusCalculationParams) =>
    apiClient.post<BonusCalculationResult>(`/bonus/calculate/${params.year}/${params.month}`),

  saveMonthlyBonuses: (params: BonusCalculationParams) =>
    apiClient.post<BonusCalculationResult>(`/bonus/calculate/${params.year}/${params.month}`),

  getPayroll: (params: BonusPayrollParams) => {
    const year = params.year || new Date().getFullYear().toString();
    const month = params.month || (new Date().getMonth() + 1).toString();
    return apiClient.get<PayrollData>(`/bonus/live/${year}/${month}`);
  },

  // =====================================================
  // Filtering Endpoints
  // =====================================================

  /**
   * Get bonuses by user
   * Uses new clean endpoint: GET /bonus/user/:userId
   */
  getByUser: (userId: string, params?: BonusGetManyParamsType) =>
    apiClient.get<BonusGetManyResponseType>(`/bonus/user/${userId}`, { params }),

  /**
   * Get bonuses by month
   * Uses new clean endpoint: GET /bonus/month/:year/:month
   */
  getByMonth: (year: number, month: number, params?: BonusGetManyParamsType) =>
    apiClient.get<BonusGetManyResponseType>(`/bonus/month/${year}/${month}`, { params }),

  /**
   * Get bonus by user and month
   * Uses new clean endpoint: GET /bonus/user/:userId/month/:year/:month
   */
  getByUserAndMonth: (userId: string, year: number, month: number) =>
    apiClient.get<any>(`/bonus/user/${userId}/month/${year}/${month}`),

  /**
   * Export payroll data to Excel
   */
  exportPayroll: (params: BonusPayrollParams) =>
    apiClient.get('/bonus/export-payroll', {
      params,
      responseType: 'blob'
    }),

  // Bonus discount operations
  /**
   * Create discount for a bonus
   */
  createDiscount: (data: BonusDiscountCreateFormData) => {
    if (!data.bonusId) {
      throw new Error('bonusId is required in discount data');
    }
    return apiClient.post(`/bonus/${data.bonusId}/discounts`, data);
  },

  deleteDiscount: (discountId: string) =>
    apiClient.delete(`/bonus/discounts/${discountId}`),
};

// Export the types for use in hooks
export type {
  // Standard types from packages
  Bonus,
  BonusIncludes,
  BonusGetManyParamsType as BonusGetManyParams,
  BonusGetManyResponseType as BonusGetManyResponse,
  BonusGetByIdParams,

  // Payroll and calculation types
  BonusPayrollParams,
  BonusPayrollFilters,
  PayrollData,
  BonusDiscountCreateFormData,
};

// Re-export form data types from schemas package
export type { BonusCreateFormData, BonusUpdateFormData } from '../../schemas';