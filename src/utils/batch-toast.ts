// Batch toast utilities - Updated to use Alert.alert() for React Native
// This file previously used web-only toast library APIs
// Now uses React Native's Alert.alert() API for native alerts

import { Alert } from 'react-native';
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

// Updated to use Alert.alert() for React Native
export function showBatchOperationToast<T, U = unknown>(result: DetailedBatchResult<T, U>, options: BatchToastOptions) {
  const { entityNamePlural, showDetails = false, maxDetailsToShow = 3 } = options;
  const { totalSuccess, totalFailed } = result;

  if (totalFailed === 0) {
    Alert.alert(
      'Sucesso',
      `${totalSuccess} ${entityNamePlural} processado(s) com sucesso!`,
      [{ text: 'OK' }]
    );
  } else if (totalSuccess === 0) {
    let message = `Falha ao processar ${totalFailed} ${entityNamePlural}`;

    if (showDetails && result.failedDetails && result.failedDetails.length > 0) {
      const details = result.failedDetails
        .slice(0, maxDetailsToShow)
        .map(f => `- ${f.error}`)
        .join('\n');
      message += `:\n\n${details}`;

      if (result.failedDetails.length > maxDetailsToShow) {
        message += `\n\n... e mais ${result.failedDetails.length - maxDetailsToShow} erro(s)`;
      }
    }

    Alert.alert('Erro', message, [{ text: 'OK' }]);
  } else {
    Alert.alert(
      'Atenção',
      `${totalSuccess} sucesso(s), ${totalFailed} falha(s)`,
      [{ text: 'OK' }]
    );
  }
}

export function showBorrowBatchToast<T, U = unknown>(result: DetailedBatchResult<T, U>, showDetails = true) {
  showBatchOperationToast(result, {
    entityName: 'empréstimo',
    entityNamePlural: 'empréstimos',
    showDetails,
  });
}

export function showActivityBatchToast<T, U = unknown>(result: DetailedBatchResult<T, U>, showDetails = true) {
  showBatchOperationToast(result, {
    entityName: 'atividade',
    entityNamePlural: 'atividades',
    showDetails,
  });
}

export function showGenericBatchToast<T, U = unknown>(result: DetailedBatchResult<T, U>, entityName: string, entityNamePlural: string, showDetails = true) {
  showBatchOperationToast(result, {
    entityName,
    entityNamePlural,
    showDetails,
  });
}
