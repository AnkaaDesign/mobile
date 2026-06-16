import { SECTOR_PRIVILEGES } from "@/constants/enums";
import type { TASK_QUOTE_STATUS } from "@/types/task-quote";

export function canViewQuote(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

export function canCreateQuote(userRole: string): boolean {
  return [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.COMMERCIAL].includes(userRole as SECTOR_PRIVILEGES);
}

export function canEditQuote(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

export function canApproveQuote(userRole: string): boolean {
  return [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL].includes(userRole as SECTOR_PRIVILEGES);
}

export function canDeleteQuote(userRole: string): boolean {
  return userRole === SECTOR_PRIVILEGES.ADMIN;
}

/**
 * Check if user can update task quote status.
 * ADMIN, FINANCIAL, and COMMERCIAL can update status.
 * COMMERCIAL cannot set BILLING_APPROVED (only ADMIN/FINANCIAL can).
 */
export function canUpdateQuoteStatus(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

/**
 * Valid status transitions for task quote.
 *
 * Typical flow:
 *   PENDING -> BUDGET_APPROVED -> BILLING_APPROVED -> UPCOMING -> PARTIAL -> SETTLED
 *
 * DUE status represents overdue installments:
 *   UPCOMING -> DUE (when installments become overdue)
 *   DUE -> PARTIAL (when overdue installment gets paid but not all)
 *   DUE -> SETTLED (when last installment gets paid)
 *   PARTIAL -> DUE (when another installment becomes overdue)
 *
 * BILLING_APPROVED is a critical transition: it triggers automatic invoice
 * and boleto generation, which is hard to reverse. The UI should confirm
 * before allowing this transition.
 *
 * Currently all statuses can transition to any other status (except themselves)
 * to allow administrative corrections.
 */
const VALID_TRANSITIONS: Record<TASK_QUOTE_STATUS, TASK_QUOTE_STATUS[]> = {
  PENDING: ['BUDGET_APPROVED'],
  // SETTLED from BUDGET_APPROVED covers "direct" quotes (orçamento direto)
  // paid upfront with no billing/installment phase; settleManually is safe here.
  BUDGET_APPROVED: ['BILLING_APPROVED', 'PENDING', 'SETTLED'],
  // BILLING_APPROVED -> SETTLED supports prepayment + stuck-quote recovery.
  BILLING_APPROVED: ['UPCOMING', 'SETTLED'],
  UPCOMING: ['PARTIAL', 'DUE', 'BILLING_APPROVED', 'SETTLED'],
  DUE: ['PARTIAL', 'SETTLED', 'UPCOMING'],
  PARTIAL: ['SETTLED', 'DUE', 'UPCOMING'],
  // SETTLED -> PARTIAL is intentionally allowed to handle payment reversal
  // (chargeback/estorno) scenarios where a previously settled invoice has
  // a payment reversed and returns to partial payment state.
  SETTLED: ['PARTIAL'],
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

  // COMMERCIAL can approve the budget (BUDGET_APPROVED) but cannot approve
  // billing (BILLING_APPROVED) — that belongs to ADMIN/FINANCIAL.
  if (userRole === SECTOR_PRIVILEGES.COMMERCIAL) {
    return transitions.filter((s) => s !== 'BILLING_APPROVED');
  }

  return transitions;
}
