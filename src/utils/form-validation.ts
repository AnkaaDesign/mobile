// packages/utils/src/form-validation.ts
// Comprehensive form validation utilities for cross-field validation, duplicate detection, and error categorization

import { useWatch } from 'react-hook-form';
import { useCallback, useEffect, useMemo } from 'react';
import { createFileHash } from './file-utils';

// =====================
// Error Categorization
// =====================

export type ErrorCategory = 'stock' | 'permission' | 'business' | 'data' | 'network' | 'validation' | 'unknown';

export interface CategorizedError {
  message: string;
  category: ErrorCategory;
  field?: string;
  code?: string;
  recoverable: boolean;
  suggestion?: string;
}

export function categorizeError(error: any, field?: string): CategorizedError {
  const message = error?.message || error?.toString() || 'Erro desconhecido';
  const code = error?.code || error?.response?.data?.code;

  // Stock-related errors
  if (
    message.toLowerCase().includes('estoque') ||
    message.toLowerCase().includes('stock') ||
    message.toLowerCase().includes('quantidade insuficiente') ||
    code === 'INSUFFICIENT_STOCK'
  ) {
    return {
      message,
      category: 'stock',
      field,
      code,
      recoverable: true,
      suggestion: 'Verifique a disponibilidade em estoque antes de continuar',
    };
  }

  // Permission errors
  if (
    message.toLowerCase().includes('permiss') ||
    message.toLowerCase().includes('autoriza') ||
    message.toLowerCase().includes('acesso negado') ||
    error?.response?.status === 403 ||
    code === 'FORBIDDEN' ||
    code === 'UNAUTHORIZED'
  ) {
    return {
      message,
      category: 'permission',
      field,
      code,
      recoverable: false,
      suggestion: 'Entre em contato com o administrador para obter as permissões necessárias',
    };
  }

  // Business rule violations
  if (
    message.toLowerCase().includes('regra de negócio') ||
    message.toLowerCase().includes('business rule') ||
    message.toLowerCase().includes('violação') ||
    message.toLowerCase().includes('não permitido') ||
    code?.startsWith('BUSINESS_')
  ) {
    return {
      message,
      category: 'business',
      field,
      code,
      recoverable: true,
      suggestion: 'Verifique se todos os requisitos de negócio estão sendo atendidos',
    };
  }

  // Data validation errors
  if (
    message.toLowerCase().includes('inválido') ||
    message.toLowerCase().includes('formato') ||
    message.toLowerCase().includes('obrigatório') ||
    message.toLowerCase().includes('required') ||
    error?.response?.status === 400 ||
    code === 'VALIDATION_ERROR'
  ) {
    return {
      message,
      category: 'data',
      field,
      code,
      recoverable: true,
      suggestion: 'Corrija os dados informados e tente novamente',
    };
  }

  // Network errors
  if (
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('timeout') ||
    message.toLowerCase().includes('conexão') ||
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNABORTED'
  ) {
    return {
      message,
      category: 'network',
      field,
      code,
      recoverable: true,
      suggestion: 'Verifique sua conexão com a internet e tente novamente',
    };
  }

  // Validation errors (Zod, etc.)
  if (
    message.toLowerCase().includes('validation') ||
    error?.name === 'ZodError' ||
    error?.issues
  ) {
    return {
      message,
      category: 'validation',
      field,
      code,
      recoverable: true,
      suggestion: 'Corrija os campos marcados em vermelho',
    };
  }

  // Unknown errors
  return {
    message,
    category: 'unknown',
    field,
    code,
    recoverable: true,
    suggestion: 'Tente novamente ou entre em contato com o suporte',
  };
}

export function groupErrorsByCategory(errors: CategorizedError[]): Record<ErrorCategory, CategorizedError[]> {
  const grouped: Record<ErrorCategory, CategorizedError[]> = {
    stock: [],
    permission: [],
    business: [],
    data: [],
    network: [],
    validation: [],
    unknown: [],
  };

  errors.forEach(error => {
    grouped[error.category].push(error);
  });

  return grouped;
}

// =====================
// Cross-Field Validation
// =====================

export interface CrossFieldRule<T = any> {
  fields: (keyof T)[];
  validate: (values: Partial<T>) => string | undefined;
  message?: string;
}

export function useCrossFieldValidation<T>(
  control: any,
  rules: CrossFieldRule<T>[]
) {
  const errors: Record<string, string> = {};

  rules.forEach(rule => {
    // Watch all fields involved in this rule
    const watchedValues = useWatch({
      control,
      name: rule.fields as any,
    });

    // Convert array of values to object
    const values: Partial<T> = {};
    rule.fields.forEach((field, index) => {
      values[field] = watchedValues[index];
    });

    // Validate
    const error = rule.validate(values);
    if (error) {
      // Assign error to the last field in the rule
      const lastField = rule.fields[rule.fields.length - 1] as string;
      errors[lastField] = error;
    }
  });

  return errors;
}

// Common cross-field validation rules
export const crossFieldValidators = {
  dateRange: <T,>(startField: keyof T, endField: keyof T, message?: string): CrossFieldRule<T> => ({
    fields: [startField, endField],
    validate: (values) => {
      const start = values[startField] as any;
      const end = values[endField] as any;

      if (start && end && new Date(start) > new Date(end)) {
        return message || 'A data final deve ser posterior à data inicial';
      }
      return undefined;
    },
  }),

  numericRange: <T,>(minField: keyof T, maxField: keyof T, message?: string): CrossFieldRule<T> => ({
    fields: [minField, maxField],
    validate: (values) => {
      const min = values[minField] as any;
      const max = values[maxField] as any;

      if (min != null && max != null && Number(min) > Number(max)) {
        return message || 'O valor máximo deve ser maior que o valor mínimo';
      }
      return undefined;
    },
  }),

  requiredIf: <T,>(field: keyof T, conditionField: keyof T, conditionValue: any, message?: string): CrossFieldRule<T> => ({
    fields: [field, conditionField],
    validate: (values) => {
      const value = values[field];
      const condition = values[conditionField];

      if (condition === conditionValue && !value) {
        return message || 'Este campo é obrigatório';
      }
      return undefined;
    },
  }),

  mutuallyExclusive: <T,>(field1: keyof T, field2: keyof T, message?: string): CrossFieldRule<T> => ({
    fields: [field1, field2],
    validate: (values) => {
      const value1 = values[field1];
      const value2 = values[field2];

      if (value1 && value2) {
        return message || 'Apenas um destes campos pode ser preenchido';
      }
      return undefined;
    },
  }),

  atLeastOne: <T,>(...fields: (keyof T)[]): CrossFieldRule<T> => ({
    fields,
    validate: (values) => {
      const hasValue = fields.some(field => {
        const value = values[field];
        return value != null && value !== '' && value !== false;
      });

      if (!hasValue) {
        return 'Pelo menos um campo deve ser preenchido';
      }
      return undefined;
    },
  }),
};

// =====================
// Duplicate Detection
// =====================

export interface DuplicateDetectionOptions {
  fields: string[];
  caseInsensitive?: boolean;
  trimWhitespace?: boolean;
  ignoreId?: string;
}

export function createItemHash(item: any, fields: string[], options: DuplicateDetectionOptions = { fields }): string {
  const { caseInsensitive = true, trimWhitespace = true } = options;

  const values = fields.map(field => {
    let value = item[field];

    if (typeof value === 'string') {
      if (trimWhitespace) value = value.trim();
      if (caseInsensitive) value = value.toLowerCase();
    }

    return String(value || '');
  });

  return values.join('|');
}

export function findDuplicates<T extends Record<string, any>>(
  items: T[],
  options: DuplicateDetectionOptions
): { duplicates: T[][]; uniqueItems: T[] } {
  const hashMap = new Map<string, T[]>();
  const { ignoreId } = options;

  items.forEach(item => {
    // Skip if this is the item being edited (by ID)
    if (ignoreId && item.id === ignoreId) {
      return;
    }

    const hash = createItemHash(item, options.fields, options);

    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }

    hashMap.get(hash)!.push(item);
  });

  const duplicates: T[][] = [];
  const uniqueItems: T[] = [];

  hashMap.forEach(group => {
    if (group.length > 1) {
      duplicates.push(group);
    } else {
      uniqueItems.push(group[0]);
    }
  });

  return { duplicates, uniqueItems };
}

export function isDuplicate<T extends Record<string, any>>(
  newItem: T,
  existingItems: T[],
  options: DuplicateDetectionOptions
): { isDuplicate: boolean; duplicateOf?: T } {
  const newHash = createItemHash(newItem, options.fields, options);

  for (const item of existingItems) {
    // Skip if this is the item being edited
    if (options.ignoreId && item.id === options.ignoreId) {
      continue;
    }

    const existingHash = createItemHash(item, options.fields, options);

    if (newHash === existingHash) {
      return { isDuplicate: true, duplicateOf: item };
    }
  }

  return { isDuplicate: false };
}

// =====================
// Real-Time Validation Hook
// =====================

export interface RealTimeValidationOptions<T> {
  control: any;
  field: keyof T;
  validate: (value: any) => Promise<string | undefined>;
  debounceMs?: number;
  deps?: any[];
}

export function useRealTimeValidation<T>({
  control,
  field,
  validate,
  debounceMs = 500,
  deps = [],
}: RealTimeValidationOptions<T>) {
  const watchedValue = useWatch({
    control,
    name: field as string,
  });

  const [error, setError] = React.useState<string | undefined>(undefined);
  const [isValidating, setIsValidating] = React.useState(false);

  // Debounced validation
  useEffect(() => {
    if (!watchedValue) {
      setError(undefined);
      return;
    }

    setIsValidating(true);
    const timeoutId = setTimeout(async () => {
      try {
        const validationError = await validate(watchedValue);
        setError(validationError);
      } catch (err) {
        console.error('Validation error:', err);
        setError('Erro ao validar campo');
      } finally {
        setIsValidating(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [watchedValue, validate, debounceMs, ...deps]);

  return { error, isValidating };
}

// =====================
// Stock Validation
// =====================

export interface StockValidationResult {
  available: boolean;
  currentStock: number;
  requested: number;
  message?: string;
}

export async function validateStock(
  itemId: string,
  requestedQuantity: number,
  fetchStock: (itemId: string) => Promise<number>
): Promise<StockValidationResult> {
  try {
    const currentStock = await fetchStock(itemId);

    if (requestedQuantity > currentStock) {
      return {
        available: false,
        currentStock,
        requested: requestedQuantity,
        message: `Estoque insuficiente. Disponível: ${currentStock}, Solicitado: ${requestedQuantity}`,
      };
    }

    return {
      available: true,
      currentStock,
      requested: requestedQuantity,
    };
  } catch (error) {
    console.error('Stock validation error:', error);
    return {
      available: false,
      currentStock: 0,
      requested: requestedQuantity,
      message: 'Erro ao verificar estoque',
    };
  }
}

// Hook for real-time stock validation
export function useStockValidation(
  control: any,
  itemIdField: string,
  quantityField: string,
  fetchStock: (itemId: string) => Promise<number>,
  debounceMs = 1000
) {
  const itemId = useWatch({ control, name: itemIdField });
  const quantity = useWatch({ control, name: quantityField });

  const [stockResult, setStockResult] = React.useState<StockValidationResult | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  useEffect(() => {
    if (!itemId || !quantity || quantity <= 0) {
      setStockResult(null);
      return;
    }

    setIsValidating(true);
    const timeoutId = setTimeout(async () => {
      try {
        const result = await validateStock(itemId, quantity, fetchStock);
        setStockResult(result);
      } catch (error) {
        console.error('Stock validation error:', error);
        setStockResult({
          available: false,
          currentStock: 0,
          requested: quantity,
          message: 'Erro ao validar estoque',
        });
      } finally {
        setIsValidating(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [itemId, quantity, fetchStock, debounceMs]);

  return { stockResult, isValidating };
}

// Import React for hooks
import React from 'react';
