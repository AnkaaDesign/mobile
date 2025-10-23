/**
 * Route parameter types for dynamic routes
 * Provides type-safe access to route parameters from useLocalSearchParams
 */

/**
 * Base type for all route parameters
 * All route parameters from URL come as strings or string arrays
 */
export type RouteParam = string | string[] | undefined;

/**
 * Single ID parameter - most common dynamic route pattern
 */
export interface IdParams {
  id: string;
}

/**
 * Multiple nested parameters (e.g., order items, formula components)
 */
export interface NestedIdParams {
  orderId: string;
  id: string;
}

/**
 * Formula and component parameters
 */
export interface FormulaComponentParams {
  formulaId: string;
  id: string;
}

/**
 * User ID parameter (for payroll, etc.)
 */
export interface UserIdParams {
  userId: string;
}

/**
 * Token parameter (for password reset)
 */
export interface TokenParams {
  token: string;
}

/**
 * Entity type and entity ID parameters (for change logs)
 */
export interface EntityParams {
  entityType: string;
  entityId: string;
}

/**
 * Optional query parameters
 */
export interface QueryParams {
  [key: string]: string | string[] | undefined;
}

/**
 * Combined params with query strings
 */
export type ParamsWithQuery<T> = T & QueryParams;

/**
 * Type guard to check if a parameter is a valid non-empty string
 */
export function isValidParam(param: RouteParam): param is string {
  return typeof param === 'string' && param.length > 0;
}

/**
 * Type guard to check if a parameter is a valid UUID
 */
export function isValidUUID(param: RouteParam): param is string {
  if (typeof param !== 'string') return false;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(param);
}

/**
 * Extracts a single string from route parameter (handles arrays)
 */
export function extractParam(param: RouteParam): string {
  if (Array.isArray(param)) {
    return param[0] || '';
  }
  return param || '';
}

/**
 * Safely extracts and validates an ID parameter
 * @throws Error if ID is invalid or missing
 */
export function requireIdParam(params: Partial<IdParams>): string {
  const id = extractParam(params.id);

  if (!id) {
    throw new Error('Required parameter "id" is missing');
  }

  if (!isValidUUID(id)) {
    throw new Error(`Invalid ID format: ${id}`);
  }

  return id;
}

/**
 * Safely extracts and validates nested ID parameters
 * @throws Error if any ID is invalid or missing
 */
export function requireNestedIdParams(params: Partial<NestedIdParams>): NestedIdParams {
  const orderId = extractParam(params.orderId);
  const id = extractParam(params.id);

  if (!orderId) {
    throw new Error('Required parameter "orderId" is missing');
  }

  if (!id) {
    throw new Error('Required parameter "id" is missing');
  }

  if (!isValidUUID(orderId)) {
    throw new Error(`Invalid orderId format: ${orderId}`);
  }

  if (!isValidUUID(id)) {
    throw new Error(`Invalid id format: ${id}`);
  }

  return { orderId, id };
}

/**
 * Safely extracts and validates formula component parameters
 * @throws Error if any parameter is invalid or missing
 */
export function requireFormulaComponentParams(params: Partial<FormulaComponentParams>): FormulaComponentParams {
  const formulaId = extractParam(params.formulaId);
  const id = extractParam(params.id);

  if (!formulaId) {
    throw new Error('Required parameter "formulaId" is missing');
  }

  if (!id) {
    throw new Error('Required parameter "id" is missing');
  }

  if (!isValidUUID(formulaId)) {
    throw new Error(`Invalid formulaId format: ${formulaId}`);
  }

  if (!isValidUUID(id)) {
    throw new Error(`Invalid id format: ${id}`);
  }

  return { formulaId, id };
}

/**
 * Optional parameter extraction (returns undefined if not present or invalid)
 */
export function extractOptionalParam(param: RouteParam): string | undefined {
  const extracted = extractParam(param);
  return extracted || undefined;
}

/**
 * Extracts multiple parameters as an array
 */
export function extractArrayParam(param: RouteParam): string[] {
  if (Array.isArray(param)) {
    return param.filter(p => typeof p === 'string' && p.length > 0);
  }
  return param ? [param] : [];
}

/**
 * Type-safe parameter extractor with default value
 */
export function extractParamWithDefault(param: RouteParam, defaultValue: string): string {
  const extracted = extractParam(param);
  return extracted || defaultValue;
}
