import type { Termination, TerminationItem } from "@/types";
import { TERMINATION_STATUS } from "@/constants";

const FINAL_STATUSES: TERMINATION_STATUS[] = [
  TERMINATION_STATUS.COMPLETED,
  TERMINATION_STATUS.CANCELLED,
];

export function isTerminationFinal(t: Termination): boolean {
  return FINAL_STATUSES.includes(t.status);
}

/**
 * Pagamento em atraso: prazo no passado, rescisão ainda em andamento e ainda
 * não paga (paga em atraso deixa de ser "atrasado"). Mirror do web
 * (isPaymentOverdue em termination-table-columns).
 */
export function isPaymentOverdue(t: Termination): boolean {
  if (!t.paymentDueDate) return false;
  if (isTerminationFinal(t)) return false;
  if (t.paymentDate) return false;
  return new Date(t.paymentDueDate).getTime() < Date.now();
}

/** Líquido = soma de items[].amount; null quando não há verbas. Mirror do web. */
export function getTerminationNet(t: Termination): number | null {
  const items = (t.items ?? []) as TerminationItem[];
  if (items.length === 0) return null;
  return items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
}
