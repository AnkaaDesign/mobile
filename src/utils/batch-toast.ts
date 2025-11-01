// Batch toast utilities - Currently disabled for React Native
// This file uses web-only toast library APIs that are not compatible with React Native
// For React Native, components should handle toast display using the useToast hook

import type { BatchOperationResult, BatchOperationSuccess, BatchOperationError } from '../types';

export interface BatchToastOptions {
  entityName: string; // e.g., "empréstimo", "atividade"
  entityNamePlural: string; // e.g., "empréstimos", "atividades"
  showDetails?: boolean;
  maxDetailsToShow?: number;
}

export interface DetailedBatchResult<T, U = unknown> extends BatchOperationResult<T, U> {
  successDetails?: BatchOperationSuccess<T>[];
  failedDetails?: BatchOperationError<U>[];
}

// Disabled for React Native - Components should handle toast display
export function showBatchOperationToast<T, U = unknown>(_result: DetailedBatchResult<T, U>, _options: BatchToastOptions) {
  console.warn('showBatchOperationToast is disabled for React Native. Use useToast hook in components instead.');
  // Components using this should call useToast() and display toasts manually
}

export function showBorrowBatchToast<T, U = unknown>(_result: DetailedBatchResult<T, U>, _showDetails = true) {
  console.warn('showBorrowBatchToast is disabled for React Native. Use useToast hook in components instead.');
}

export function showActivityBatchToast<T, U = unknown>(_result: DetailedBatchResult<T, U>, _showDetails = true) {
  console.warn('showActivityBatchToast is disabled for React Native. Use useToast hook in components instead.');
}

export function showGenericBatchToast<T, U = unknown>(_result: DetailedBatchResult<T, U>, _entityName: string, _entityNamePlural: string, _showDetails = true) {
  console.warn('showGenericBatchToast is disabled for React Native. Use useToast hook in components instead.');
}
