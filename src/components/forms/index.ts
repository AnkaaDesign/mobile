/**
 * Standardized Form Components
 *
 * This module exports reusable form components for multi-step workflows
 * with item selection capabilities. Used across:
 * - Borrow forms
 * - Activity forms
 * - Order forms
 * - External Withdrawal forms
 * - Paint forms
 *
 * STANDARDIZED COMPONENTS (NEW):
 * - StandardizedFormContainer: Single-step form wrapper with consistent layout
 * - SimpleFormActionBar: Cancel/Submit buttons for single-step forms
 *
 * Usage:
 * ```tsx
 * import { StandardizedFormContainer, SimpleFormActionBar } from "@/components/forms";
 * ```
 */

// Standardized Container for Single-Step Forms (NEW)
export { StandardizedFormContainer } from "./StandardizedFormContainer";
export type { StandardizedFormContainerProps } from "./StandardizedFormContainer";

// Standardized Action Bar for Single-Step Forms (NEW)
export { SimpleFormActionBar } from "./SimpleFormActionBar";
export type { SimpleFormActionBarProps } from "./SimpleFormActionBar";

// Multi-Step Container Components
export { MultiStepFormContainer } from "./MultiStepFormContainer";
export type { MultiStepFormContainerProps } from "./MultiStepFormContainer";

// Multi-Step Action Bar
export { FormActionBar } from "./FormActionBar";
export type { FormActionBarProps } from "./FormActionBar";

// Item Selection
export { ItemSelectorTable } from "./ItemSelectorTable";
export type { ItemSelectorTableProps } from "./ItemSelectorTable";

export { ItemSelectorTableV2 } from "./ItemSelectorTableV2";

export { ItemSelectorFilters } from "./ItemSelectorFilters";
export type { ItemSelectorFiltersProps } from "./ItemSelectorFilters";
