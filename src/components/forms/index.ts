/**
 * Form Components
 *
 * This module exports reusable form components for single-step and multi-step workflows
 * with item selection capabilities. Used across:
 * - Borrow forms
 * - Activity forms
 * - Order forms
 * - External Withdrawal forms
 * - Paint forms
 *
 * FORM CONTAINERS:
 * - FormContainer: Single-step form wrapper with consistent layout and keyboard handling
 * - MultiStepFormContainer: Multi-step form wrapper with progress indicator
 *
 * Both containers include intelligent keyboard handling via KeyboardAwareFormProvider.
 *
 * Usage:
 * ```tsx
 * import { FormContainer, MultiStepFormContainer } from "@/components/forms";
 * ```
 */

// Single-Step Form Container
export { FormContainer } from "./FormContainer";
export type { FormContainerProps } from "./FormContainer";

// Action Bar for Single-Step Forms
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

export { ItemSelectorFilters } from "./ItemSelectorFilters";
export type { ItemSelectorFiltersProps } from "./ItemSelectorFilters";
