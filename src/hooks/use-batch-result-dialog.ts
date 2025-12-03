import { useState, useCallback } from "react";
import type { BatchOperationResult } from "@/types/common";

interface UseBatchResultDialogReturn<TSuccess = unknown, TFailed = unknown> {
  isOpen: boolean;
  result: BatchOperationResult<TSuccess, TFailed> | null;
  openDialog: (result: BatchOperationResult<TSuccess, TFailed>) => void;
  closeDialog: () => void;
}

/**
 * Hook for managing batch operation result dialog state.
 * Provides open/close controls and result data management.
 *
 * @example
 * ```tsx
 * const { isOpen, result, openDialog, closeDialog } = useBatchResultDialog<BorrowBatchResult>();
 *
 * // After batch operation completes
 * const handleSubmit = async () => {
 *   const result = await batchCreate(items);
 *   if (result.data) {
 *     openDialog(result.data);
 *   }
 * };
 *
 * // In render
 * <BorrowBatchResultModal
 *   open={isOpen}
 *   onOpenChange={closeDialog}
 *   result={result}
 *   operationType="create"
 * />
 * ```
 */
export function useBatchResultDialog<TSuccess = unknown, TFailed = unknown>(): UseBatchResultDialogReturn<TSuccess, TFailed> {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<BatchOperationResult<TSuccess, TFailed> | null>(null);

  const openDialog = useCallback((result: BatchOperationResult<TSuccess, TFailed>) => {
    setResult(result);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    // Clear result after animation completes (300ms matches modal duration)
    setTimeout(() => setResult(null), 300);
  }, []);

  return {
    isOpen,
    result,
    openDialog,
    closeDialog,
  };
}
