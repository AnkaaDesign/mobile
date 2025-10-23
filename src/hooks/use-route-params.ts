/**
 * Custom hooks for type-safe route parameter handling
 * Provides safer alternatives to useLocalSearchParams with proper error handling
 */

import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import {
  IdParams,
  NestedIdParams,
  FormulaComponentParams,
  UserIdParams,
  TokenParams,
  EntityParams,
  extractParam,
  isValidUUID,
  requireIdParam,
  requireNestedIdParams,
  requireFormulaComponentParams,
  extractOptionalParam,
  type RouteParam,
} from '../types/route-params';

/**
 * Hook to safely extract and validate a single ID parameter
 * Returns the ID and a validation state
 */
export function useIdParam() {
  const params = useLocalSearchParams<Partial<IdParams>>();

  return useMemo(() => {
    try {
      const id = extractParam(params.id);

      return {
        id,
        isValid: isValidUUID(id),
        error: !id ? 'ID parameter is missing' : !isValidUUID(id) ? 'Invalid ID format' : null,
      };
    } catch (error) {
      return {
        id: '',
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to extract ID parameter',
      };
    }
  }, [params.id]);
}

/**
 * Hook to safely extract and validate a single ID parameter (throws on error)
 * Use this when the ID is required for the component to function
 */
export function useRequiredIdParam(): string {
  const params = useLocalSearchParams<Partial<IdParams>>();

  return useMemo(() => {
    try {
      return requireIdParam(params);
    } catch (error) {
      // In production, you might want to navigate to an error page or show a modal
      console.error('Required ID parameter error:', error);
      throw error;
    }
  }, [params.id]);
}

/**
 * Hook to safely extract and validate nested ID parameters (e.g., order items)
 * Returns both IDs and validation state
 */
export function useNestedIdParams() {
  const params = useLocalSearchParams<Partial<NestedIdParams>>();

  return useMemo(() => {
    try {
      const orderId = extractParam(params.orderId);
      const id = extractParam(params.id);

      const orderIdValid = isValidUUID(orderId);
      const idValid = isValidUUID(id);

      return {
        orderId,
        id,
        isValid: orderIdValid && idValid,
        error:
          !orderId
            ? 'orderId parameter is missing'
            : !orderIdValid
            ? 'Invalid orderId format'
            : !id
            ? 'id parameter is missing'
            : !idValid
            ? 'Invalid id format'
            : null,
      };
    } catch (error) {
      return {
        orderId: '',
        id: '',
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to extract nested ID parameters',
      };
    }
  }, [params.orderId, params.id]);
}

/**
 * Hook to safely extract and validate nested ID parameters (throws on error)
 * Use this when both IDs are required for the component to function
 */
export function useRequiredNestedIdParams(): NestedIdParams {
  const params = useLocalSearchParams<Partial<NestedIdParams>>();

  return useMemo(() => {
    try {
      return requireNestedIdParams(params);
    } catch (error) {
      console.error('Required nested ID parameters error:', error);
      throw error;
    }
  }, [params.orderId, params.id]);
}

/**
 * Hook to safely extract and validate formula component parameters
 */
export function useFormulaComponentParams() {
  const params = useLocalSearchParams<Partial<FormulaComponentParams>>();

  return useMemo(() => {
    try {
      const formulaId = extractParam(params.formulaId);
      const id = extractParam(params.id);

      const formulaIdValid = isValidUUID(formulaId);
      const idValid = isValidUUID(id);

      return {
        formulaId,
        id,
        isValid: formulaIdValid && idValid,
        error:
          !formulaId
            ? 'formulaId parameter is missing'
            : !formulaIdValid
            ? 'Invalid formulaId format'
            : !id
            ? 'id parameter is missing'
            : !idValid
            ? 'Invalid id format'
            : null,
      };
    } catch (error) {
      return {
        formulaId: '',
        id: '',
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to extract formula component parameters',
      };
    }
  }, [params.formulaId, params.id]);
}

/**
 * Hook to safely extract and validate formula component parameters (throws on error)
 */
export function useRequiredFormulaComponentParams(): FormulaComponentParams {
  const params = useLocalSearchParams<Partial<FormulaComponentParams>>();

  return useMemo(() => {
    try {
      return requireFormulaComponentParams(params);
    } catch (error) {
      console.error('Required formula component parameters error:', error);
      throw error;
    }
  }, [params.formulaId, params.id]);
}

/**
 * Hook to extract user ID parameter
 */
export function useUserIdParam() {
  const params = useLocalSearchParams<Partial<UserIdParams>>();

  return useMemo(() => {
    const userId = extractParam(params.userId);
    const isValid = isValidUUID(userId);

    return {
      userId,
      isValid,
      error: !userId ? 'userId parameter is missing' : !isValid ? 'Invalid userId format' : null,
    };
  }, [params.userId]);
}

/**
 * Hook to extract token parameter (for password reset, etc.)
 */
export function useTokenParam() {
  const params = useLocalSearchParams<Partial<TokenParams>>();

  return useMemo(() => {
    const token = extractParam(params.token);

    return {
      token,
      isValid: !!token && token.length > 0,
      error: !token ? 'Token parameter is missing' : null,
    };
  }, [params.token]);
}

/**
 * Hook to extract entity type and entity ID parameters (for change logs)
 */
export function useEntityParams() {
  const params = useLocalSearchParams<Partial<EntityParams>>();

  return useMemo(() => {
    const entityType = extractParam(params.entityType);
    const entityId = extractParam(params.entityId);
    const entityIdValid = isValidUUID(entityId);

    return {
      entityType,
      entityId,
      isValid: !!entityType && entityIdValid,
      error:
        !entityType
          ? 'entityType parameter is missing'
          : !entityId
          ? 'entityId parameter is missing'
          : !entityIdValid
          ? 'Invalid entityId format'
          : null,
    };
  }, [params.entityType, params.entityId]);
}

/**
 * Generic hook to extract any optional parameter
 */
export function useOptionalParam(paramName: string): string | undefined {
  const params = useLocalSearchParams();

  return useMemo(() => {
    return extractOptionalParam(params[paramName] as RouteParam);
  }, [params, paramName]);
}

/**
 * Generic hook to extract query parameters with type safety
 */
export function useQueryParams<T extends Record<string, any>>(): Partial<T> {
  const params = useLocalSearchParams();

  return useMemo(() => {
    const result: Record<string, any> = {};

    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== undefined) {
        result[key] = Array.isArray(value) ? value[0] : value;
      }
    });

    return result as Partial<T>;
  }, [params]);
}
