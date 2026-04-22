import { SECTOR_PRIVILEGES, SERVICE_ORDER_TYPE, SERVICE_ORDER_STATUS } from "@/constants";

/**
 * Service Order Permission Utility
 *
 * Defines visibility and edit permissions for service order columns based on sector privileges.
 *
 * Permission Matrix (VISIBILITY):
 * | Sector          | PRODUCTION | COMMERCIAL | LOGISTIC   | ARTWORK    |
 * |-----------------|------------|------------|------------|------------|
 * | ADMIN           | view+edit  | view+edit  | view+edit  | view+edit  |
 * | COMMERCIAL      | view only  | view+edit* | view only  | view only  |
 * | DESIGNER        | view only  | -          | -          | view+edit* |
 * | FINANCIAL       | -          | view+edit* | view only  | -          |
 * | LOGISTIC        | view+edit  | view only  | view+edit* | view only  |
 * | PRODUCTION      | view+edit  | -          | -          | -          |
 * | WAREHOUSE       | view only  | -          | -          | -          |
 * | HUMAN_RESOURCES | view only  | -          | -          | -          |
 * | Others          | view only  | -          | -          | -          |
 *
 * * = edit only own/unassigned service orders
 */

export interface ServiceOrderPermissions {
  canView: boolean;
  canEdit: boolean;
  /** Can only edit if no assignment or assigned to current user */
  editOnlyOwnOrUnassigned: boolean;
}

/**
 * Check if user can edit service orders of a specific type
 */
export function canEditServiceOrderOfType(
  sectorPrivilege: SECTOR_PRIVILEGES | undefined,
  serviceOrderType: SERVICE_ORDER_TYPE
): boolean {
  if (!sectorPrivilege) return false;

  if (sectorPrivilege === SECTOR_PRIVILEGES.ADMIN) return true;

  switch (serviceOrderType) {
    case SERVICE_ORDER_TYPE.PRODUCTION:
      return sectorPrivilege === SECTOR_PRIVILEGES.LOGISTIC ||
             sectorPrivilege === SECTOR_PRIVILEGES.PRODUCTION_MANAGER ||
             sectorPrivilege === SECTOR_PRIVILEGES.PRODUCTION;

    case SERVICE_ORDER_TYPE.COMMERCIAL:
      return sectorPrivilege === SECTOR_PRIVILEGES.COMMERCIAL ||
             sectorPrivilege === SECTOR_PRIVILEGES.FINANCIAL;

    case SERVICE_ORDER_TYPE.LOGISTIC:
      return sectorPrivilege === SECTOR_PRIVILEGES.LOGISTIC ||
             sectorPrivilege === SECTOR_PRIVILEGES.PRODUCTION_MANAGER;

    case SERVICE_ORDER_TYPE.ARTWORK:
      return sectorPrivilege === SECTOR_PRIVILEGES.DESIGNER;

    default:
      return false;
  }
}

/**
 * Check if user can cancel service orders.
 * - ADMIN: can cancel any SO
 * - PRODUCTION_MANAGER: can cancel PRODUCTION and LOGISTIC SOs
 * - COMMERCIAL / FINANCIAL: can cancel COMMERCIAL SOs
 */
export function canCancelServiceOrder(sectorPrivilege: SECTOR_PRIVILEGES | undefined): boolean {
  if (!sectorPrivilege) return false;
  return sectorPrivilege === SECTOR_PRIVILEGES.FINANCIAL ||
         sectorPrivilege === SECTOR_PRIVILEGES.COMMERCIAL ||
         sectorPrivilege === SECTOR_PRIVILEGES.PRODUCTION_MANAGER ||
         sectorPrivilege === SECTOR_PRIVILEGES.ADMIN;
}

/**
 * Check if user can mark ARTWORK service orders as COMPLETED
 * Only ADMIN can complete artwork service orders
 */
export function canCompleteArtworkServiceOrder(sectorPrivilege: SECTOR_PRIVILEGES | undefined): boolean {
  if (!sectorPrivilege) return false;
  return sectorPrivilege === SECTOR_PRIVILEGES.ADMIN;
}

/**
 * Get allowed status transitions for a user editing a specific service order
 * Returns array of statuses the user is allowed to set
 *
 * Status availability by service order type:
 * - ARTWORK: PENDING, IN_PROGRESS, PAUSED, WAITING_APPROVE, COMPLETED (approval workflow)
 * - PRODUCTION, COMMERCIAL, LOGISTIC: PENDING, IN_PROGRESS, PAUSED, COMPLETED (simple workflow)
 *
 * IMPORTANT:
 * - CANCELLED is available to users who can cancel (ADMIN, PRODUCTION_MANAGER, COMMERCIAL, FINANCIAL)
 * - PAUSED is NOT available to PRODUCTION sector team leaders (must ask PM or admin)
 * - WAITING_APPROVE is ONLY for ARTWORK (designer → admin approval workflow)
 * - DESIGNER can only set WAITING_APPROVE, not COMPLETED (admin approves)
 */
export function getAllowedServiceOrderStatuses(
  sectorPrivilege: SECTOR_PRIVILEGES | undefined,
  serviceOrderType: SERVICE_ORDER_TYPE,
  isTeamLeader?: boolean,
): SERVICE_ORDER_STATUS[] {
  if (!sectorPrivilege) return [];

  if (!canEditServiceOrderOfType(sectorPrivilege, serviceOrderType)) return [];

  const canCancel = canCancelServiceOrder(sectorPrivilege);
  // PRODUCTION sector team leaders cannot pause — they must ask a PM or admin
  const canPause = !(sectorPrivilege === SECTOR_PRIVILEGES.PRODUCTION && isTeamLeader);

  if (serviceOrderType === SERVICE_ORDER_TYPE.ARTWORK) {
    const artworkStatuses: SERVICE_ORDER_STATUS[] = [
      SERVICE_ORDER_STATUS.PENDING,
      SERVICE_ORDER_STATUS.IN_PROGRESS,
      ...(canPause ? [SERVICE_ORDER_STATUS.PAUSED] : []),
      SERVICE_ORDER_STATUS.WAITING_APPROVE,
      SERVICE_ORDER_STATUS.COMPLETED,
    ];

    if (canCancel) {
      if (sectorPrivilege === SECTOR_PRIVILEGES.DESIGNER) {
        return [...artworkStatuses.filter(s => s !== SERVICE_ORDER_STATUS.COMPLETED), SERVICE_ORDER_STATUS.CANCELLED];
      }
      return [...artworkStatuses, SERVICE_ORDER_STATUS.CANCELLED];
    }

    if (sectorPrivilege === SECTOR_PRIVILEGES.DESIGNER) {
      return artworkStatuses.filter(s => s !== SERVICE_ORDER_STATUS.COMPLETED);
    }

    return artworkStatuses;
  }

  // PRODUCTION, COMMERCIAL, LOGISTIC: Simple workflow without WAITING_APPROVE
  const simpleStatuses: SERVICE_ORDER_STATUS[] = [
    SERVICE_ORDER_STATUS.PENDING,
    SERVICE_ORDER_STATUS.IN_PROGRESS,
    ...(canPause ? [SERVICE_ORDER_STATUS.PAUSED] : []),
    SERVICE_ORDER_STATUS.COMPLETED,
  ];

  if (canCancel) {
    return [...simpleStatuses, SERVICE_ORDER_STATUS.CANCELLED];
  }

  return simpleStatuses;
}

/**
 * Check if user can pause a service order based on their sector and team leader status.
 * PRODUCTION sector team leaders cannot pause — they must ask a PM or admin.
 */
export function canUserPauseServiceOrder(
  sectorPrivilege: SECTOR_PRIVILEGES | undefined,
  isTeamLeader: boolean
): boolean {
  if (!sectorPrivilege) return false;
  return !(sectorPrivilege === SECTOR_PRIVILEGES.PRODUCTION && isTeamLeader);
}
