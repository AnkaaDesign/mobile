/**
 * External Withdrawal Form Components (Mobile)
 *
 * Complete set of form components for External Withdrawal management with 100% parity with web.
 * All components are mobile-optimized using React Native and follow the mobile design system.
 */

export { ExternalWithdrawalCreateForm } from "./external-withdrawal-create-form";
export { ExternalWithdrawalEditForm } from "./external-withdrawal-edit-form";
export { ExternalWithdrawalItemSelector } from "./external-withdrawal-item-selector";
export { ExternalWithdrawalItemCard } from "./external-withdrawal-item-card";
export { ExternalWithdrawalSummaryCards } from "./external-withdrawal-summary-cards";
export { ExternalWithdrawalFormFilters } from "./external-withdrawal-form-filters";

// Re-export utilities (note: types with same names are resolved by using form-utils as primary)
export {
  // Types
  type ExternalWithdrawalFormItem,
  type ExternalWithdrawalFormData,
  type ValidationError,
  type ValidationResult,
  type TotalCalculation,
  type ExternalWithdrawalTotals,
  // Calculation functions
  calculateExternalWithdrawalTotals,
  calculateItemTotal,
  calculatePartialTotal,
  getBestItemPrice,
  // Currency helpers
  formatPriceForInput,
  formatPriceForDisplay,
  parsePriceInput,
  validatePriceInput,
  // Data transformation
  transformFormDataForAPI,
  transformAPIDataToFormData,
  cloneFormData,
  convertItemToFormItem,
  // Validation
  validateExternalWithdrawalForm,
  validateWithdrawerName,
  validateItemSelection,
  validateItemPrices,
  validateNotes,
  // Item processing
  filterItems,
  groupItemsByCategory,
  // Utilities
  safeGet,
  safeParseNumber,
  formatItemsCount,
  generateSelectionSummary,
  externalWithdrawalFormUtils,
} from "./external-withdrawal-form-utils";

// Re-export validation (with unique names only to avoid conflicts)
export {
  type StageValidationResult,
  type ValidationContext,
  // Schemas
  stage1ValidationSchema,
  stage2ItemSchema,
  stage2ValidationSchema,
  completeFormValidationSchema,
  // Stage validation functions
  validateStage1,
  validateStage2,
  validateCompleteForm,
  // Helpers
  checkStockAvailability,
  validateItemPrice,
  validateBusinessRules,
  getValidationSummary,
  createValidationError,
  validateFieldRequired,
  externalWithdrawalFormValidation,
} from "./external-withdrawal-form-validation";
