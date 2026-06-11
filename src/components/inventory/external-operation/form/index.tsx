/**
 * External Withdrawal Form Components (Mobile)
 *
 * Complete set of form components for External Withdrawal management with 100% parity with web.
 * All components are mobile-optimized using React Native and follow the mobile design system.
 */

export { ExternalOperationCreateForm } from "./external-operation-create-form";
export { ExternalOperationEditForm } from "./external-operation-edit-form";
export { ExternalOperationItemSelector } from "./external-operation-item-selector";
export { ExternalOperationItemCard } from "./external-operation-item-card";
export { ExternalOperationSummaryCards } from "./external-operation-summary-cards";
export { ExternalOperationFormFilters } from "./external-operation-form-filters";

// Re-export utilities (note: types with same names are resolved by using form-utils as primary)
export {
  // Types
  type ExternalOperationFormItem,
  type ExternalOperationFormData,
  type ValidationError,
  type ValidationResult,
  type TotalCalculation,
  type ExternalOperationTotals,
  // Calculation functions
  calculateExternalOperationTotals,
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
  validateExternalOperationForm,
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
  externalOperationFormUtils,
} from "./external-operation-form-utils";

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
  externalOperationFormValidation,
} from "./external-operation-form-validation";
