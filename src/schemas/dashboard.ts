import { z } from "zod";
import { DASHBOARD_TIME_PERIOD } from '../constants';

// Base dashboard query schema with date filtering
const baseDashboardQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  timePeriod: z
    .enum(Object.values(DASHBOARD_TIME_PERIOD) as [string, ...string[]])
    .optional()
    .default(DASHBOARD_TIME_PERIOD.THIS_MONTH),
});

// Inventory dashboard query
export const inventoryDashboardQuerySchema = baseDashboardQuerySchema.extend({
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  includeInactive: z.coerce.boolean().optional(),
});

export type InventoryDashboardQueryFormData = z.input<typeof inventoryDashboardQuerySchema>;

// HR dashboard query
export const hrDashboardQuerySchema = baseDashboardQuerySchema.extend({
  sectorId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  includeInactive: z.coerce.boolean().optional(),
});

export type HRDashboardQueryFormData = z.input<typeof hrDashboardQuerySchema>;

// Administration dashboard query
export const administrationDashboardQuerySchema = baseDashboardQuerySchema.extend({
  customerId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  sectorId: z.string().uuid().optional(),
});

export type AdministrationDashboardQueryFormData = z.input<typeof administrationDashboardQuerySchema>;

// Paint dashboard query
export const paintDashboardQuerySchema = baseDashboardQuerySchema.extend({
  paintTypeId: z.string().uuid().optional(),
  paintTypeIds: z.array(z.string().uuid()).optional(),
  paintId: z.string().uuid().optional(),
  paintIds: z.array(z.string().uuid()).optional(),
  formulaId: z.string().uuid().optional(),
  manufacturers: z.array(z.string()).optional(),
  includeInactive: z.coerce.boolean().optional(),
});

export type PaintDashboardQueryFormData = z.input<typeof paintDashboardQuerySchema>;

// Production dashboard query
export const productionDashboardQuerySchema = baseDashboardQuerySchema.extend({
  customerId: z.string().uuid().optional(),
  sectorId: z.string().uuid().optional(),
  garageId: z.string().uuid().optional(),
  includeServiceOrders: z.coerce.boolean().optional(),
  includeCuts: z.coerce.boolean().optional(),
  includeAirbrush: z.coerce.boolean().optional(),
  includeTrucks: z.coerce.boolean().optional(),
});

export type ProductionDashboardQueryFormData = z.input<typeof productionDashboardQuerySchema>;

// Unified dashboard query
export const unifiedDashboardQuerySchema = baseDashboardQuerySchema;

export type UnifiedDashboardQueryFormData = z.input<typeof unifiedDashboardQuerySchema>;
