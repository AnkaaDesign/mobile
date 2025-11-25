/**
 * Common Components
 *
 * Shared components used across multiple features and forms.
 * These components provide consistent UX patterns and reduce code duplication.
 */

export { ConfirmationDialog } from './confirmation-dialog';
export type { ConfirmationDialogProps, ConfirmationVariant } from './confirmation-dialog';

export { BatchOperationResultDialog } from './batch-operation-result-dialog';
export type {
  BatchOperationResultDialogProps,
  BatchOperationResult
} from './batch-operation-result-dialog';

export { DateRangeFilter } from './filters/DateRangeFilter';
export type { DateRange, DateRangeFilterProps } from './filters/DateRangeFilter';

export { GenericTableRowSwipe } from './generic-table-row-swipe';
export type { GenericSwipeAction } from './generic-table-row-swipe';
