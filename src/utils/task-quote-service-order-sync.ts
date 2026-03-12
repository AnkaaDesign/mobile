/**
 * Task Quote and Production Service Order Bidirectional Synchronization Utilities
 *
 * This module provides synchronization logic between
 * TaskQuoteServices and Production Service Orders.
 *
 * Sync Rules:
 * 1. Service Order (PRODUCTION) -> Task Quote Service:
 *    - description -> quote service description (1:1)
 *    - observation -> quote service observation (1:1)
 *    - Amount defaults to 0
 *
 * 2. Task Quote Service -> Service Order (PRODUCTION):
 *    - description -> SO description (1:1)
 *    - observation -> SO observation (1:1)
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

export interface SyncQuoteService {
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
export function getQuoteServicesToAddFromServiceOrders(
  serviceOrders: SyncServiceOrder[],
  existingQuoteServices: SyncQuoteService[],
): SyncQuoteService[] {
  const servicesToAdd: SyncQuoteService[] = [];
  const existingDescriptions = new Set(
    existingQuoteServices.map(svc => normalizeDescription(svc.description))
  );

  const noSyncDescriptions = new Set(
    existingQuoteServices
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
export function getServiceOrdersToAddFromQuoteServices(
  quoteServices: SyncQuoteService[],
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

  for (const svc of quoteServices) {
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
export function syncObservationsFromServiceOrdersToQuote(
  serviceOrders: SyncServiceOrder[],
  quoteServices: SyncQuoteService[],
): SyncQuoteService[] {
  const soObservationMap = new Map<string, string | null>();
  for (const so of serviceOrders) {
    if (so.type !== SERVICE_ORDER_TYPE.PRODUCTION) continue;
    if (!so.description || so.description.trim().length < 3) continue;
    const normalizedDesc = normalizeDescription(so.description);
    const observationValue = so.observation && so.observation.trim() ? so.observation : null;
    soObservationMap.set(normalizedDesc, observationValue);
  }

  return quoteServices.map(item => {
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
export function syncObservationsFromQuoteToServiceOrders(
  quoteServices: SyncQuoteService[],
  serviceOrders: SyncServiceOrder[],
): SyncServiceOrder[] {
  const quoteObservationMap = new Map<string, string | null>();
  for (const item of quoteServices) {
    if (!item.description || item.description.trim().length < 3) continue;
    const normalizedDesc = normalizeDescription(item.description);
    const observationValue = item.observation && item.observation.trim() ? item.observation : null;
    quoteObservationMap.set(normalizedDesc, observationValue);
  }

  return serviceOrders.map(so => {
    if (so.type !== SERVICE_ORDER_TYPE.PRODUCTION) return so;
    if (!so.description || so.description.trim().length < 3) return so;
    const normalizedDesc = normalizeDescription(so.description);
    if (quoteObservationMap.has(normalizedDesc)) {
      const quoteObservation = quoteObservationMap.get(normalizedDesc);
      const currentObs = so.observation && so.observation.trim() ? so.observation : null;
      if (currentObs !== quoteObservation) {
        return { ...so, observation: quoteObservation };
      }
    }
    return so;
  });
}
