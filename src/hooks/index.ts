// packages/hooks/src/index.ts

// =====================================================
// Core Utilities & Factories
// =====================================================
export * from "./queryKeys";
export * from "./createEntityHooks";
export * from "./useEditForm";

// =====================================================
// Authentication Hooks
// =====================================================
export * from "./useAuth";
export * from "./usePrivileges";

// =====================================================
// Statistics & Analytics Hooks
// =====================================================
// Re-export specific functions from other files to avoid conflicts
export {
  useActivityAnalytics as useActivityAnalyticsDetailed,
  useActivityTrends,
  useActivityHeatmap,
  useActivityInsights,
  activityAnalyticsKeys
} from "./use-activity-analytics";
export {
  useStockMetrics as useStockMetricsDetailed,
  usePerformanceMetrics as usePerformanceMetricsDetailed,
  useStockForecasting,
  useStockInsights,
  stockMetricsKeys
} from "./use-stock-metrics";

// =====================================================
// Work Module Hooks
// =====================================================
export * from "./useActivity";
export * from "./useTask";
export * from "./useOrder";
export * from "./useOrderItem";
export * from "./useOrderSchedule";
export * from "./useService";
export * from "./useServiceOrder";
export * from "./useObservation";
export * from "./useCut";
export * from "./useAirbrushing";

// =====================================================
// Paint Module Hooks
// =====================================================
export * from "./paint"; // Consolidated paint hooks
export * from "./usePaint";
export * from "./paintType";
export * from "./usePaintBrand";
export * from "./usePaintFormula";
export * from "./usePaintFormulaComponent";
export * from "./usePaintProduction";
// =====================================================
// People Module Hooks
// =====================================================
export * from "./useUser";
export * from "./usePosition";
export * from "./usePositionRemuneration";
export * from "./useSector";
export * from "./bonus";
export * from "./payroll";
export type { PayrollComparison } from "./payrollDetails";
export {
  payrollDetailsKeys,
  usePayrollDetails,
  usePayrollLiveDetails,
  usePayrollUserStats,
  usePayrollTaskSummary,
  useCalculatePayrollBonuses,
  usePayrollComparison
} from "./payrollDetails";
export * from "./useHoliday";
export * from "./useVacation";
export * from "./useWarning";
export * from "./useBorrow";
export * from "./usePpe";

// =====================================================
// Stock Module Hooks
// =====================================================
export * from "./useItem";
export * from "./useItemBrand";
export * from "./useItemCategory";
export * from "./usePrice";
export * from "./useSupplier";
export * from "./useExternalWithdrawal";
export * from "./useMaintenance";

// =====================================================
// Common Module Hooks
// =====================================================
export * from "./useFile";
export * from "./useFileUploadManager";
export * from "./use-files-infinite-mobile";
export * from "./useNotification";
export * from "./usePreferences";
export * from "./useChangelog";
export * from "./dashboard";
export * from "./use-entity-details";

// =====================================================
// Other Module Hooks
// =====================================================
export * from "./useCustomer";
// export * from "./useTruck"; // Disabled - file removed
export * from "./useLayout";
export * from "./useLayoutSection";

// =====================================================
// Server Management Hooks
// =====================================================
export * from "./useServer";
export * from "./useBackup";
export * from "./deployment";

// =====================================================
// Integration Hooks
// =====================================================
export * from "./secullum";

// =====================================================
// Mobile-Optimized Infinite Scroll Hooks
// =====================================================
// Core infinite mobile utility
export * from "./use-infinite-mobile";

// Entity-specific infinite mobile hooks
export * from "./use-activities-infinite-mobile";
export * from "./use-borrows-infinite-mobile";
export * from "./use-my-activities-infinite-mobile";
export * from "./use-my-bonuses-with-live";
export * from "./use-my-borrows-infinite-mobile";
export * from "./use-change-logs-infinite-mobile";
export * from "./use-customers-infinite-mobile";
export * from "./use-external-withdrawals-infinite-mobile";
export * from "./use-files-infinite-mobile";
export * from "./use-holidays-infinite-mobile";
export * from "./use-item-brands-infinite-mobile";
export * from "./use-item-categories-infinite-mobile";
export * from "./use-items-infinite-mobile";
export * from "./use-maintenance-infinite-mobile";
export * from "./use-notifications-infinite-mobile";
export * from "./use-orders-infinite-mobile";
export * from "./use-order-items-infinite-mobile";
export * from "./use-paints-infinite-mobile";
export * from "./use-paint-formulas-infinite-mobile";
export * from "./use-paint-types-infinite-mobile";
export * from "./use-positions-infinite-mobile";
export * from "./use-ppe-deliveries-infinite-mobile";
export * from "./use-ppe-infinite-mobile";
export * from "./use-ppe-schedules-infinite-mobile";
export * from "./use-ppe-sizes-infinite-mobile";
export * from "./use-request-ppe-delivery";
export * from "./use-sectors-infinite-mobile";
export * from "./use-service-orders-infinite-mobile";
export * from "./use-services-infinite-mobile";
export * from "./use-suppliers-infinite-mobile";
export * from "./use-tasks-infinite-mobile";
export * from "./use-users-infinite-mobile";
export * from "./use-vacations-infinite-mobile";
export * from "./use-warnings-infinite-mobile";
export * from "./use-my-warnings-infinite-mobile";
export * from "./use-team-warnings-infinite-mobile";
export * from "./use-team-vacations-infinite-mobile";
export * from "./use-order-schedules-infinite-mobile";
export * from "./use-cuts-infinite-mobile";
export * from "./use-airbrushings-infinite-mobile";
export * from "./use-observations-infinite-mobile";
export * from "./use-paint-brands-infinite-mobile";
export * from "./use-deployments-infinite-mobile";
export * from "./use-paint-productions-infinite-mobile";
export * from "./use-paint-formula-components-infinite-mobile";

// =====================================================
// UI State Management Hooks
// =====================================================
export * from "./useFilterState";
export * from "./useColumnVisibility";
export * from "./useTableSort";
export * from "./useDebouncedSearch";

// =====================================================
// Form State Management Hooks
// =====================================================
export * from "./use-external-withdrawal-form-state";
export * from "./use-multi-step-form";
export * from "./use-persisted-state";

// =====================================================
// Lookup & Validation Hooks
// =====================================================
export * from "./use-cnpj-lookup";
export * from "./use-cep-lookup";

// =====================================================
// Keyboard & Form Utilities
// =====================================================
export * from "./useKeyboardAwareScroll";

// =====================================================
// Dialog & Modal Hooks
// =====================================================
export * from "./use-batch-result-dialog";

// =====================================================
// Monitoring & Utilities
// =====================================================
// NOTE: query-error-monitor is NOT exported here to prevent module initialization issues
// It should be imported directly when needed: import { queryErrorMonitor } from './query-error-monitor'
// This prevents the monitor from being bundled with every hooks import, avoiding QueryClient race conditions
