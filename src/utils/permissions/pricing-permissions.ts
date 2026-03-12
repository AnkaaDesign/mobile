import { SECTOR_PRIVILEGES, TASK_PRICING_STATUS } from "@/constants/enums";

export function canViewPricing(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

export function canCreatePricing(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

export function canEditPricing(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

export function canApprovePricing(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

export function canDeletePricing(userRole: string): boolean {
  return userRole === SECTOR_PRIVILEGES.ADMIN;
}

/**
 * Check if user can update task pricing status.
 * ADMIN, FINANCIAL, and COMMERCIAL can update status.
 * FINANCIAL cannot set INTERNAL_APPROVED (only ADMIN/COMMERCIAL can).
 */
export function canUpdatePricingStatus(userRole: string): boolean {
  return [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ].includes(userRole as SECTOR_PRIVILEGES);
}

/**
 * Valid status transitions for task pricing.
 *
 * Typical flow:
 *   PENDING → BUDGET_APPROVED → VERIFIED → INTERNAL_APPROVED → UPCOMING → PARTIAL → SETTLED
 *
 * INTERNAL_APPROVED is a critical transition: it triggers automatic invoice
 * and boleto generation, which is hard to reverse. The UI should confirm
 * before allowing this transition.
 *
 * Currently all statuses can transition to any other status (except themselves)
 * to allow administrative corrections.
 */
const VALID_TRANSITIONS: Record<TASK_PRICING_STATUS, TASK_PRICING_STATUS[]> = {
  PENDING: [TASK_PRICING_STATUS.BUDGET_APPROVED],
  BUDGET_APPROVED: [TASK_PRICING_STATUS.VERIFIED, TASK_PRICING_STATUS.PENDING],
  VERIFIED: [TASK_PRICING_STATUS.INTERNAL_APPROVED, TASK_PRICING_STATUS.BUDGET_APPROVED],
  INTERNAL_APPROVED: [TASK_PRICING_STATUS.UPCOMING],
  UPCOMING: [TASK_PRICING_STATUS.PARTIAL, TASK_PRICING_STATUS.INTERNAL_APPROVED],
  PARTIAL: [TASK_PRICING_STATUS.SETTLED, TASK_PRICING_STATUS.UPCOMING],
  // SETTLED → PARTIAL is intentionally allowed to handle payment reversal
  // (chargeback/estorno) scenarios where a previously settled invoice has
  // a payment reversed and returns to partial payment state.
  SETTLED: [TASK_PRICING_STATUS.PARTIAL],
};

/**
 * Get available next statuses for a given pricing status and user role.
 * Returns only statuses the user is allowed to transition to.
 */
export function getAvailablePricingStatusTransitions(
  currentStatus: TASK_PRICING_STATUS,
  userRole: string,
): TASK_PRICING_STATUS[] {
  const transitions = VALID_TRANSITIONS[currentStatus] || [];

  // FINANCIAL cannot set INTERNAL_APPROVED
  if (userRole === SECTOR_PRIVILEGES.FINANCIAL) {
    return transitions.filter((s) => s !== TASK_PRICING_STATUS.INTERNAL_APPROVED);
  }

  return transitions;
}
