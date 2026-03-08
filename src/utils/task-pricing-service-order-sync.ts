/**
 * Task Pricing and Production Service Order Bidirectional Synchronization Utilities
 *
 * This module provides synchronization logic for the mobile form between
 * TaskPricingServices and Production Service Orders. The sync happens in real-time
 * as the user edits the form.
 *
 * Sync Rules:
 * 1. Service Order (PRODUCTION) → Task Pricing Service:
 *    - description → pricing service description (1:1)
 *    - observation → pricing service observation (1:1)
 *    - Amount defaults to 0
 *
 * 2. Task Pricing Service → Service Order (PRODUCTION):
 *    - description → SO description (1:1)
 *    - observation → SO observation (1:1)
 */

import { SERVICE_ORDER_TYPE, SERVICE_ORDER_STATUS } from '../constants/enums';

export interface SyncServiceOrder {
  id?: string;
  description: string;
  observation?: string | null;
  type: string;
  status?: string;
  statusOrder?: number;
  assignedToId?: string | null;
  shouldSync?: boolean;
}

export interface SyncPricingService {
  id?: string;
  description: string;
  observation?: string | null;
  amount?: number | null;
  shouldSync?: boolean;
}

/**
 * Normalizes a description for comparison purposes.
 */
export function normalizeDescription(description: string | null | undefined): string {
  if (!description) return '';
  return description.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Gets pricing services that should be added based on PRODUCTION service orders.
 */
export function getPricingServicesToAddFromServiceOrders(
  serviceOrders: SyncServiceOrder[],
  existingPricingServices: SyncPricingService[],
): SyncPricingService[] {
  const servicesToAdd: SyncPricingService[] = [];
  const existingDescriptions = new Set(
    existingPricingServices.map(svc => normalizeDescription(svc.description))
  );

  const noSyncDescriptions = new Set(
    existingPricingServices
      .filter(svc => svc.shouldSync === false)
      .map(svc => normalizeDescription(svc.description))
  );

  for (const so of serviceOrders) {
    if (so.type !== SERVICE_ORDER_TYPE.PRODUCTION) continue;
    if (!so.description || so.description.trim().length < 3) continue;
    if (so.shouldSync === false) continue;

    const normalizedDesc = normalizeDescription(so.description);

    if (!existingDescriptions.has(normalizedDesc) && !noSyncDescriptions.has(normalizedDesc)) {
      servicesToAdd.push({
        description: so.description.trim(),
        observation: so.observation || null,
        amount: 0,
      });
      existingDescriptions.add(normalizedDesc);
    }
  }

  return servicesToAdd;
}

/**
 * Gets service orders that should be added based on pricing services.
 */
export function getServiceOrdersToAddFromPricingServices(
  pricingServices: SyncPricingService[],
  existingServiceOrders: SyncServiceOrder[],
): SyncServiceOrder[] {
  const ordersToAdd: SyncServiceOrder[] = [];

  const existingDescriptions = new Set(
    existingServiceOrders
      .filter(so => so.type === SERVICE_ORDER_TYPE.PRODUCTION)
      .map(so => normalizeDescription(so.description))
  );

  const noSyncDescriptions = new Set(
    existingServiceOrders
      .filter(so => so.type === SERVICE_ORDER_TYPE.PRODUCTION && so.shouldSync === false)
      .map(so => normalizeDescription(so.description))
  );

  for (const svc of pricingServices) {
    if (!svc.description || svc.description.trim().length < 3) continue;
    if (svc.shouldSync === false) continue;

    const normalizedDesc = normalizeDescription(svc.description);

    if (existingDescriptions.has(normalizedDesc) || noSyncDescriptions.has(normalizedDesc)) {
      continue;
    }

    ordersToAdd.push({
      description: svc.description.trim(),
      observation: svc.observation || null,
      type: SERVICE_ORDER_TYPE.PRODUCTION,
      status: SERVICE_ORDER_STATUS.PENDING,
      statusOrder: 1,
    });

    existingDescriptions.add(normalizedDesc);
  }

  return ordersToAdd;
}

/**
 * Syncs observations from service orders to matching pricing services.
 * This function propagates both set and cleared observations.
 */
export function syncObservationsFromServiceOrdersToPricing(
  serviceOrders: SyncServiceOrder[],
  pricingServices: SyncPricingService[],
): SyncPricingService[] {
  const soObservationMap = new Map<string, string | null>();
  for (const so of serviceOrders) {
    if (so.type !== SERVICE_ORDER_TYPE.PRODUCTION) continue;
    if (!so.description || so.description.trim().length < 3) continue;
    const normalizedDesc = normalizeDescription(so.description);
    const observationValue = so.observation && so.observation.trim() ? so.observation : null;
    soObservationMap.set(normalizedDesc, observationValue);
  }

  return pricingServices.map(item => {
    if (!item.description || item.description.trim().length < 3) return item;
    const normalizedDesc = normalizeDescription(item.description);
    if (soObservationMap.has(normalizedDesc)) {
      const soObservation = soObservationMap.get(normalizedDesc);
      const currentObs = item.observation && item.observation.trim() ? item.observation : null;
      if (currentObs !== soObservation) {
        return { ...item, observation: soObservation };
      }
    }
    return item;
  });
}

/**
 * Syncs observations from pricing services to matching service orders.
 * This function propagates both set and cleared observations.
 */
export function syncObservationsFromPricingToServiceOrders(
  pricingServices: SyncPricingService[],
  serviceOrders: SyncServiceOrder[],
): SyncServiceOrder[] {
  const pricingObservationMap = new Map<string, string | null>();
  for (const item of pricingServices) {
    if (!item.description || item.description.trim().length < 3) continue;
    const normalizedDesc = normalizeDescription(item.description);
    const observationValue = item.observation && item.observation.trim() ? item.observation : null;
    pricingObservationMap.set(normalizedDesc, observationValue);
  }

  return serviceOrders.map(so => {
    if (so.type !== SERVICE_ORDER_TYPE.PRODUCTION) return so;
    if (!so.description || so.description.trim().length < 3) return so;
    const normalizedDesc = normalizeDescription(so.description);
    if (pricingObservationMap.has(normalizedDesc)) {
      const pricingObservation = pricingObservationMap.get(normalizedDesc);
      const currentObs = so.observation && so.observation.trim() ? so.observation : null;
      if (currentObs !== pricingObservation) {
        return { ...so, observation: pricingObservation };
      }
    }
    return so;
  });
}
