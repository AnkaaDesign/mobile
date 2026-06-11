/**
 * Editable status allowlists.
 *
 * Allowlists rather than denylists by intent: when a new status enum value
 * lands, the safer failure mode is "screen treats it as non-editable" —
 * users get a read-only banner instead of a silently-broken edit form.
 *
 * Used by `useStatusGuard` (src/hooks/use-status-guard.ts) and the
 * `editGuard` slot of <DetailScreen> / <FormScreen>.
 */
import {
  TASK_STATUS,
  BONUS_STATUS,
  ORDER_STATUS,
  BORROW_STATUS,
  PPE_DELIVERY_STATUS,
  AIRBRUSHING_STATUS,
  SERVICE_ORDER_STATUS,
  EXTERNAL_OPERATION_STATUS,
  INVOICE_STATUS,
} from "@/constants/enums";

export const EDITABLE_TASK_STATUSES = [
  TASK_STATUS.PREPARATION,
  TASK_STATUS.WAITING_PRODUCTION,
  TASK_STATUS.IN_PRODUCTION,
] as const;

// BONUS_STATUS only has DRAFT and CONFIRMED — once CONFIRMED the bonus is
// locked. There is no PAID status in this codebase (verified 2026-05-09).
export const EDITABLE_BONUS_STATUSES = [BONUS_STATUS.DRAFT] as const;

export const EDITABLE_ORDER_STATUSES = [
  ORDER_STATUS.CREATED,
  ORDER_STATUS.PARTIALLY_FULFILLED,
  ORDER_STATUS.FULFILLED,
] as const;

export const EDITABLE_BORROW_STATUSES = [BORROW_STATUS.ACTIVE] as const;

export const EDITABLE_PPE_DELIVERY_STATUSES = [
  PPE_DELIVERY_STATUS.PENDING,
  PPE_DELIVERY_STATUS.APPROVED,
  PPE_DELIVERY_STATUS.WAITING_SIGNATURE,
] as const;

// COMPLETED stays editable: paymentStatus can only be set once the
// airbrushing is COMPLETED (painters are paid after completion), so the
// edit screen must remain reachable. Only CANCELLED is terminal.
// Web has no status gate for airbrushing edits, so this also keeps parity.
export const EDITABLE_AIRBRUSHING_STATUSES = [
  AIRBRUSHING_STATUS.PENDING,
  AIRBRUSHING_STATUS.IN_PRODUCTION,
  AIRBRUSHING_STATUS.COMPLETED,
] as const;

export const EDITABLE_SERVICE_ORDER_STATUSES = [
  SERVICE_ORDER_STATUS.PENDING,
  SERVICE_ORDER_STATUS.IN_PROGRESS,
  SERVICE_ORDER_STATUS.WAITING_ARTWORK,
  SERVICE_ORDER_STATUS.PAUSED,
  SERVICE_ORDER_STATUS.WAITING_APPROVE,
] as const;

export const EDITABLE_EXTERNAL_OPERATION_STATUSES = [
  EXTERNAL_OPERATION_STATUS.PENDING,
  EXTERNAL_OPERATION_STATUS.PARTIALLY_RETURNED,
] as const;

export const EDITABLE_INVOICE_STATUSES = [
  INVOICE_STATUS.DRAFT,
  INVOICE_STATUS.ACTIVE,
  INVOICE_STATUS.PARTIALLY_PAID,
] as const;

/**
 * Generic helper — `isEditableStatus(entity?.status, EDITABLE_TASK_STATUSES)`.
 * Templates use this internally; surface code should prefer `useStatusGuard`.
 */
export function isEditableStatus<S extends string>(
  status: S | null | undefined,
  allowlist: readonly S[],
): boolean {
  if (!status) return false;
  return (allowlist as readonly string[]).includes(status);
}
