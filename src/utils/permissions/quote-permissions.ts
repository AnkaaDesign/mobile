import { SECTOR_PRIVILEGES, TASK_QUOTE_STATUS } from "@/constants/enums";

export function canViewQuote(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

/** @deprecated Use canViewQuote instead */
export const canViewPricing = canViewQuote;

export function canCreateQuote(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

/** @deprecated Use canCreateQuote instead */
export const canCreatePricing = canCreateQuote;

export function canEditQuote(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

/** @deprecated Use canEditQuote instead */
export const canEditPricing = canEditQuote;

export function canApproveQuote(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

/** @deprecated Use canApproveQuote instead */
export const canApprovePricing = canApproveQuote;

export function canDeleteQuote(userRole: string): boolean {
  return userRole === SECTOR_PRIVILEGES.ADMIN;
}

/** @deprecated Use canDeleteQuote instead */
export const canDeletePricing = canDeleteQuote;

/**
 * Check if user can update task quote status.
 * ADMIN, FINANCIAL, and COMMERCIAL can update status.
 * FINANCIAL cannot set BILLING_APPROVED (only ADMIN/COMMERCIAL can).
 */
export function canUpdateQuoteStatus(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

/** @deprecated Use canUpdateQuoteStatus instead */
export const canUpdatePricingStatus = canUpdateQuoteStatus;

/**
 * Valid status transitions for task quote.
 *
 * Typical flow:
 *   PENDING -> BUDGET_APPROVED -> VERIFIED_BY_FINANCIAL -> BILLING_APPROVED -> UPCOMING -> PARTIAL -> SETTLED
 *
 * DUE: When installments are overdue
 * UPCOMING: No paid, no overdue installments
 *
 * BILLING_APPROVED is a critical transition: it triggers automatic invoice
 * and boleto generation, which is hard to reverse. The UI should confirm
 * before allowing this transition.
 *
 * Currently all statuses can transition to any other status (except themselves)
 * to allow administrative corrections.
 */
const VALID_TRANSITIONS: Record<TASK_QUOTE_STATUS, TASK_QUOTE_STATUS[]> = {
  PENDING: [TASK_QUOTE_STATUS.BUDGET_APPROVED],
  BUDGET_APPROVED: [TASK_QUOTE_STATUS.VERIFIED, TASK_QUOTE_STATUS.PENDING],
  VERIFIED: [TASK_QUOTE_STATUS.BILLING_APPROVED, TASK_QUOTE_STATUS.BUDGET_APPROVED],
  BILLING_APPROVED: [TASK_QUOTE_STATUS.UPCOMING],
  UPCOMING: [TASK_QUOTE_STATUS.PARTIAL, TASK_QUOTE_STATUS.BILLING_APPROVED],
  PARTIAL: [TASK_QUOTE_STATUS.SETTLED, TASK_QUOTE_STATUS.UPCOMING],
  // SETTLED -> PARTIAL is intentionally allowed to handle payment reversal
  // (chargeback/estorno) scenarios where a previously settled invoice has
  // a payment reversed and returns to partial payment state.
  SETTLED: [TASK_QUOTE_STATUS.PARTIAL],
};

/**
 * Get available next statuses for a given quote status and user role.
 * Returns only statuses the user is allowed to transition to.
 */
export function getAvailableQuoteStatusTransitions(
  currentStatus: TASK_QUOTE_STATUS,
  userRole: string,
): TASK_QUOTE_STATUS[] {
  const transitions = VALID_TRANSITIONS[currentStatus] || [];

  // FINANCIAL cannot set BILLING_APPROVED
  if (userRole === SECTOR_PRIVILEGES.FINANCIAL) {
    return transitions.filter((s) => s !== TASK_QUOTE_STATUS.BILLING_APPROVED);
  }

  return transitions;
}

/** @deprecated Use getAvailableQuoteStatusTransitions instead */
export const getAvailablePricingStatusTransitions = getAvailableQuoteStatusTransitions;
