import { SERVICE_ORDER_STATUS_LABELS } from '../constants';
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_TYPE } from '../constants';
import type { ServiceOrder } from '../types';

/**
 * Checkout/finish gating helpers. Photos live on the PRODUCTION SOs and the
 * LOGISTIC checklist SOs are auto-completed from them (API-side), so these
 * derived predicates drive when the checkout step appears and when the
 * "Finalizar" action becomes available.
 */
export const areAllProductionServiceOrdersComplete = (
  serviceOrders?: Pick<ServiceOrder, 'type' | 'status'>[] | null,
): boolean => {
  const active = (serviceOrders ?? []).filter(
    (so) => so.type === SERVICE_ORDER_TYPE.PRODUCTION && so.status !== SERVICE_ORDER_STATUS.CANCELLED,
  );
  return active.length > 0 && active.every((so) => so.status === SERVICE_ORDER_STATUS.COMPLETED);
};

export const areAllServiceOrdersComplete = (
  serviceOrders?: Pick<ServiceOrder, 'status'>[] | null,
): boolean => {
  const active = (serviceOrders ?? []).filter((so) => so.status !== SERVICE_ORDER_STATUS.CANCELLED);
  return active.length > 0 && active.every((so) => so.status === SERVICE_ORDER_STATUS.COMPLETED);
};


/**
 * Map SERVICE_ORDER_STATUS enum to Prisma ServiceOrderStatus enum
 * This is needed because TypeScript doesn't recognize that the string values are compatible
 */
export function mapServiceOrderStatusToPrisma(status: SERVICE_ORDER_STATUS | string): string {
  return status as string;
}

export const isServiceOrderStarted = (serviceOrder: Pick<ServiceOrder, "startedAt">): boolean => {
  return serviceOrder.startedAt !== null;
};

export const isServiceOrderFinished = (serviceOrder: Pick<ServiceOrder, "finishedAt">): boolean => {
  return serviceOrder.finishedAt !== null;
};

export const getServiceOrderStatus = (serviceOrder: Pick<ServiceOrder, "startedAt" | "finishedAt">): "pending" | "in_progress" | "completed" => {
  if (serviceOrder.finishedAt) return "completed";
  if (serviceOrder.startedAt) return "in_progress";
  return "pending";
};

export const calculateServiceOrderDuration = (serviceOrder: Pick<ServiceOrder, "startedAt" | "finishedAt">): number | null => {
  if (!serviceOrder.startedAt) return null;

  const endTime = serviceOrder.finishedAt || new Date();
  return endTime.getTime() - serviceOrder.startedAt.getTime();
};

export const canStartServiceOrder = (serviceOrder: Pick<ServiceOrder, "startedAt" | "finishedAt">): boolean => {
  return !serviceOrder.startedAt && !serviceOrder.finishedAt;
};

export const canFinishServiceOrder = (serviceOrder: Pick<ServiceOrder, "startedAt" | "finishedAt">): boolean => {
  return serviceOrder.startedAt !== null && !serviceOrder.finishedAt;
};

export function getServiceOrderStatusLabel(status: SERVICE_ORDER_STATUS): string {
  return SERVICE_ORDER_STATUS_LABELS[status] || status;
}

export const isServiceOrderPaused = (serviceOrder: Pick<ServiceOrder, "status">): boolean => {
  return serviceOrder.status === SERVICE_ORDER_STATUS.PAUSED;
};

/**
 * Check if a service order's status allows pausing (status-only check).
 * Note: does NOT check user permissions — use canUserPauseServiceOrder from
 * utils/permissions/service-order-permissions for the full permission check.
 */
export const canPauseServiceOrder = (serviceOrder: Pick<ServiceOrder, "status">): boolean => {
  return serviceOrder.status === SERVICE_ORDER_STATUS.IN_PROGRESS;
};

export const canResumeServiceOrder = (serviceOrder: Pick<ServiceOrder, "status">): boolean => {
  return serviceOrder.status === SERVICE_ORDER_STATUS.PAUSED;
};

export const getServiceOrderTotalActiveTimeSeconds = (
  serviceOrder: Pick<ServiceOrder, "status" | "lastStartedAt" | "totalActiveTimeSeconds">
): number => {
  const accumulated = serviceOrder.totalActiveTimeSeconds || 0;
  if (serviceOrder.status === SERVICE_ORDER_STATUS.IN_PROGRESS && serviceOrder.lastStartedAt) {
    const now = new Date();
    const sessionSeconds = Math.floor(
      (now.getTime() - new Date(serviceOrder.lastStartedAt).getTime()) / 1000
    );
    return accumulated + sessionSeconds;
  }
  return accumulated;
};

export const formatActiveTime = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '0min';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
};
