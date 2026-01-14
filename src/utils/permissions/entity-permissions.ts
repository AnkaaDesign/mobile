/**
 * Centralized entity permission utilities
 * Determines if users can perform write operations (edit, delete) on entities
 * This controls visibility of checkboxes, swipe actions, and bulk action buttons
 *
 * NOTE: LEADER privilege was removed. Team leadership is now determined by
 * the managedSector relationship (Sector.managerId points to the user).
 * Use isTeamLeader(user) to check if a user manages a sector.
 */

import { SECTOR_PRIVILEGES, SERVICE_ORDER_TYPE } from '@/constants';
import type { User } from '@/types';
import { hasAnyPrivilege, isTeamLeader } from '@/utils';

// =====================
// SERVICE ORDER PERMISSIONS
// =====================

/**
 * Get visible service order types based on user's sector privilege
 * This controls which service order types a user can view in task details
 *
 * Permission Matrix (VISIBILITY):
 * | Sector          | PRODUCTION | NEGOTIATION | ARTWORK    | FINANCIAL  |
 * |-----------------|------------|-------------|------------|------------|
 * | ADMIN           | ✓          | ✓           | ✓          | ✓          |
 * | COMMERCIAL      | ✓          | ✓           | -          | ✓          |
 * | DESIGNER        | ✓          | -           | ✓          | -          |
 * | FINANCIAL       | ✓          | -           | -          | ✓          |
 * | LOGISTIC        | ✓          | ✓           | ✓          | -          |
 * | PRODUCTION      | ✓          | -           | -          | -          |
 * | WAREHOUSE       | ✓          | -           | -          | -          |
 * | HUMAN_RESOURCES | ✓          | -           | -          | -          |
 * | Others          | ✓          | -           | -          | -          |
 */
export function getVisibleServiceOrderTypes(user: User | null): SERVICE_ORDER_TYPE[] {
  if (!user?.sector?.privileges) return [];

  const privilege = user.sector.privileges;

  switch (privilege) {
    case SECTOR_PRIVILEGES.ADMIN:
      return [
        SERVICE_ORDER_TYPE.PRODUCTION,
        SERVICE_ORDER_TYPE.NEGOTIATION,
        SERVICE_ORDER_TYPE.ARTWORK,
        SERVICE_ORDER_TYPE.FINANCIAL,
      ];

    case SECTOR_PRIVILEGES.COMMERCIAL:
      return [
        SERVICE_ORDER_TYPE.PRODUCTION,
        SERVICE_ORDER_TYPE.NEGOTIATION,
        SERVICE_ORDER_TYPE.FINANCIAL,
      ];

    case SECTOR_PRIVILEGES.DESIGNER:
      return [
        SERVICE_ORDER_TYPE.PRODUCTION,
        SERVICE_ORDER_TYPE.ARTWORK,
      ];

    case SECTOR_PRIVILEGES.FINANCIAL:
      return [
        SERVICE_ORDER_TYPE.PRODUCTION,
        SERVICE_ORDER_TYPE.FINANCIAL,
      ];

    case SECTOR_PRIVILEGES.LOGISTIC:
      return [
        SERVICE_ORDER_TYPE.PRODUCTION,
        SERVICE_ORDER_TYPE.NEGOTIATION,
        SERVICE_ORDER_TYPE.ARTWORK,
      ];

    case SECTOR_PRIVILEGES.HUMAN_RESOURCES:
    case SECTOR_PRIVILEGES.PRODUCTION:
    case SECTOR_PRIVILEGES.WAREHOUSE:
    case SECTOR_PRIVILEGES.BASIC:
    case SECTOR_PRIVILEGES.EXTERNAL:
    case SECTOR_PRIVILEGES.MAINTENANCE:
    case SECTOR_PRIVILEGES.PLOTTING:
    default:
      // All other sectors see only production
      return [SERVICE_ORDER_TYPE.PRODUCTION];
  }
}

/**
 * Check if a user can view a specific service order type
 */
export function canViewServiceOrderType(user: User | null, serviceOrderType: SERVICE_ORDER_TYPE): boolean {
  const visibleTypes = getVisibleServiceOrderTypes(user);
  return visibleTypes.includes(serviceOrderType);
}

/**
 * Check if user can edit service orders of a specific type
 *
 * Edit Permission Matrix:
 * | Sector          | PRODUCTION | NEGOTIATION | ARTWORK | FINANCIAL |
 * |-----------------|------------|-------------|---------|-----------|
 * | ADMIN           | ✓          | ✓           | ✓       | ✓         |
 * | COMMERCIAL      | -          | ✓           | -       | -         |
 * | DESIGNER        | -          | -           | ✓       | -         |
 * | FINANCIAL       | -          | -           | -       | ✓         |
 * | LOGISTIC        | ✓          | -           | -       | -         |
 * | Leader          | ✓          | -           | -       | -         |
 * | Others          | -          | -           | -       | -         |
 */
export function canEditServiceOrderOfType(user: User | null, serviceOrderType: SERVICE_ORDER_TYPE): boolean {
  if (!user?.sector?.privileges) return false;

  const privilege = user.sector.privileges;

  // ADMIN can edit all types
  if (privilege === SECTOR_PRIVILEGES.ADMIN) return true;

  // Type-specific edit permissions
  switch (serviceOrderType) {
    case SERVICE_ORDER_TYPE.PRODUCTION:
      // LOGISTIC and team leaders can edit production service orders
      return privilege === SECTOR_PRIVILEGES.LOGISTIC || isTeamLeader(user);

    case SERVICE_ORDER_TYPE.NEGOTIATION:
      // Only COMMERCIAL can edit negotiation service orders
      return privilege === SECTOR_PRIVILEGES.COMMERCIAL;

    case SERVICE_ORDER_TYPE.ARTWORK:
      // Only DESIGNER can edit artwork service orders
      return privilege === SECTOR_PRIVILEGES.DESIGNER;

    case SERVICE_ORDER_TYPE.FINANCIAL:
      // Only FINANCIAL can edit financial service orders
      return privilege === SECTOR_PRIVILEGES.FINANCIAL;

    default:
      return false;
  }
}

/**
 * Check if user should see detailed service order view
 * Detailed view includes: assigned user, start/finish dates, observation indicator
 * Simplified view: only description and status badge in same row
 *
 * Users with detailed view: ADMIN, COMMERCIAL, DESIGNER, FINANCIAL, LOGISTIC
 * Users with simplified view: PRODUCTION, WAREHOUSE, HUMAN_RESOURCES, Others
 */
export function hasDetailedServiceOrderView(user: User | null): boolean {
  if (!user?.sector?.privileges) return false;

  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.LOGISTIC,
  ]);
}

/**
 * Check if user can cancel any service order
 * Only ADMIN can cancel service orders
 */
export function canCancelServiceOrder(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN]);
}

/**
 * Check if user can mark ARTWORK service orders as COMPLETED
 * Only ADMIN can complete artwork service orders
 * Designers can only mark them as WAITING_APPROVE
 */
export function canCompleteArtworkServiceOrder(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN]);
}

/**
 * Get allowed status transitions for a user editing a specific service order
 * Returns array of statuses the user is allowed to set
 *
 * IMPORTANT: Only ADMIN can see/set CANCELLED status
 */
export function getAllowedServiceOrderStatuses(
  user: User | null,
  serviceOrderType: SERVICE_ORDER_TYPE,
  currentStatus: string
): string[] {
  if (!user) return [];

  // Check if user can edit this type at all
  if (!canEditServiceOrderOfType(user, serviceOrderType)) return [];

  // Base statuses available to all authorized users (no CANCELLED)
  const baseStatuses = ['PENDING', 'IN_PROGRESS', 'WAITING_APPROVE', 'COMPLETED'];

  // ADMIN can set any status including CANCELLED
  if (user.sector?.privileges === SECTOR_PRIVILEGES.ADMIN) {
    return [...baseStatuses, 'CANCELLED'];
  }

  // For ARTWORK service orders, DESIGNER cannot set COMPLETED (only WAITING_APPROVE)
  if (serviceOrderType === SERVICE_ORDER_TYPE.ARTWORK &&
      user.sector?.privileges === SECTOR_PRIVILEGES.DESIGNER) {
    return baseStatuses.filter(s => s !== 'COMPLETED');
  }

  // All other authorized users: base statuses only (no CANCELLED, no restrictions)
  return baseStatuses;
}

// =====================
// TASK PERMISSIONS
// =====================

/**
 * Can user create tasks?
 * Only ADMIN can create new tasks
 */
export function canCreateTasks(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Can user edit tasks?
 * ADMIN can edit all fields
 * DESIGNER, FINANCIAL, LOGISTIC can edit limited fields (form handles field visibility)
 * LEADER can start/finish tasks but NOT edit details
 * PRODUCTION is view-only
 */
export function canEditTasks(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.LOGISTIC,
  ]);
}

/**
 * Can user delete tasks?
 * Only ADMIN can delete tasks
 */
export function canDeleteTasks(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Can user start/finish tasks?
 * Team leaders can start/finish tasks in their managed sector (or tasks without sector)
 * ADMIN can start/finish any task
 */
export function canManageTaskStatus(user: User | null): boolean {
  if (!user) return false;
  // ADMIN can always manage task status
  if (hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN])) return true;
  // Team leaders (users who manage a sector) can manage task status
  return isTeamLeader(user);
}

/**
 * Can user perform batch operations on tasks?
 * Only ADMIN can batch operate tasks
 */
export function canBatchOperateTasks(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Check if team leader can manage a specific task (start/finish) (sector-based validation)
 * Team leaders can manage tasks in their MANAGED sector OR tasks without a sector
 * When starting a task without sector, it will be assigned to leader's managed sector
 * ADMIN can manage any task
 */
export function canLeaderManageTask(user: User | null, taskSectorId: string | null | undefined): boolean {
  if (!user) return false;

  // ADMIN can manage any task
  if (user.sector?.privileges === SECTOR_PRIVILEGES.ADMIN) return true;

  // Team leaders can manage tasks in their MANAGED sector OR tasks without a sector
  if (isTeamLeader(user)) {
    // Task has no sector - leader can manage it (will assign to their managed sector on start)
    if (!taskSectorId) return true;
    // Task sector matches leader's MANAGED sector (not their own sector)
    return user.managedSector?.id === taskSectorId;
  }

  return false;
}

/**
 * Check if team leader can update service orders for a specific task
 * Team leaders can ONLY update service orders for tasks in their MANAGED sector
 * Tasks with null sector are NOT allowed (unlike task start/finish)
 * ADMIN can update any service order
 */
export function canLeaderUpdateServiceOrder(user: User | null, taskSectorId: string | null | undefined): boolean {
  if (!user) return false;

  // ADMIN can update any service order
  if (user.sector?.privileges === SECTOR_PRIVILEGES.ADMIN) return true;

  // Team leaders can ONLY update service orders for tasks in their MANAGED sector
  // NOT for tasks with null sector
  if (isTeamLeader(user)) {
    if (!taskSectorId) return false; // Cannot update service orders for tasks without sector
    return user.managedSector?.id === taskSectorId;
  }

  return false;
}

/**
 * Check if user is a team leader (manages a sector)
 * @deprecated Use isTeamLeader from @/utils instead
 */
export function isLeader(user: User | null): boolean {
  if (!user) return false;
  return isTeamLeader(user);
}

// =====================
// LAYOUT PERMISSIONS
// =====================

/**
 * Can user edit truck layouts?
 * Team leaders and LOGISTIC can edit truck layouts only (not other task fields)
 * ADMIN can edit everything including layouts
 */
export function canEditLayouts(user: User | null): boolean {
  if (!user) return false;
  // ADMIN and LOGISTIC can always edit layouts
  if (hasAnyPrivilege(user, [SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.ADMIN])) return true;
  // Team leaders can also edit layouts
  return isTeamLeader(user);
}

/**
 * Can user view truck layouts?
 * Team leaders, LOGISTIC and ADMIN can view truck layouts
 */
export function canViewLayouts(user: User | null): boolean {
  if (!user) return false;
  // ADMIN and LOGISTIC can always view layouts
  if (hasAnyPrivilege(user, [SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.ADMIN])) return true;
  // Team leaders can also view layouts
  return isTeamLeader(user);
}

/**
 * Can user edit ONLY layouts (not other task fields)?
 * This is for team leaders and LOGISTIC who can only edit layouts
 * ADMIN has full edit access, so they should use the regular edit page
 */
export function canEditLayoutsOnly(user: User | null): boolean {
  if (!user) return false;
  // LOGISTIC can always edit layouts only
  if (hasAnyPrivilege(user, [SECTOR_PRIVILEGES.LOGISTIC])) return true;
  // Team leaders can also edit layouts only
  return isTeamLeader(user);
}

/**
 * Can user edit layout for a specific task?
 * Team leaders can only edit layouts for tasks in their MANAGED sector or tasks with null sector
 * Uses managedSector.id (the sector they manage), NOT their own sectorId
 * ADMIN can edit layouts for any task
 */
export function canEditLayoutForTask(user: User | null, taskSectorId: string | null | undefined): boolean {
  if (!user) return false;

  // ADMIN can edit any task's layout
  if (user.sector?.privileges === SECTOR_PRIVILEGES.ADMIN) return true;

  // Check if user has layout editing privilege (team leader or LOGISTIC)
  if (!canEditLayoutsOnly(user)) return false;

  // Task has no sector - anyone with layout privilege can edit
  if (!taskSectorId) return true;

  // Check if task is in user's MANAGED sector (not their own sector)
  // managedSector.id is the sector they supervise/manage
  return user.managedSector?.id === taskSectorId;
}

// =====================
// CUT PERMISSIONS
// =====================

/**
 * Can user create cuts?
 * Only ADMIN can create cuts directly
 */
export function canCreateCuts(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Can user edit cuts?
 * Only ADMIN can edit cut details
 */
export function canEditCuts(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Can user delete cuts?
 * Only ADMIN can delete cuts
 */
export function canDeleteCuts(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Can user start/finish cuts (change status)?
 * WAREHOUSE can start/finish cuts
 * ADMIN can also manage cut status
 */
export function canManageCutStatus(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Can user request a new cut?
 * Team leaders can request cuts for their sector
 * ADMIN can also request cuts
 */
export function canRequestCut(user: User | null): boolean {
  if (!user) return false;
  // ADMIN can always request cuts
  if (hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN])) return true;
  // Team leaders can also request cuts
  return isTeamLeader(user);
}

/**
 * Can user request a cut for a specific task?
 * Team leaders can only request cuts for tasks in their MANAGED sector
 * Tasks with null sector are NOT allowed for cut requests
 * ADMIN can request cuts for any task
 */
export function canRequestCutForTask(user: User | null, taskSectorId: string | null | undefined): boolean {
  if (!user) return false;

  // ADMIN can request cuts for any task
  if (user.sector?.privileges === SECTOR_PRIVILEGES.ADMIN) return true;

  // Team leaders can only request cuts for tasks in their MANAGED sector
  // NOT for tasks with null sector
  if (isTeamLeader(user)) {
    if (!taskSectorId) return false; // Cannot request cuts for tasks without sector
    return user.managedSector?.id === taskSectorId;
  }

  return false;
}

// =====================
// AIRBRUSHING PERMISSIONS
// =====================

/**
 * Can user create/edit/delete airbrushings?
 * Only ADMIN can manage airbrushings
 */
export function canCreateAirbrushings(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canEditAirbrushings(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeleteAirbrushings(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Can user view airbrushing financial data (price)?
 * Only ADMIN and FINANCIAL can view airbrushing prices
 */
export function canViewAirbrushingFinancials(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
  ]);
}

// =====================
// OBSERVATION PERMISSIONS
// =====================

/**
 * Can user create/edit/delete observations?
 * Only ADMIN can manage observations
 */
export function canCreateObservations(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canEditObservations(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeleteObservations(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

// =====================
// ITEM/INVENTORY PERMISSIONS
// =====================

/**
 * Can user edit/delete inventory items?
 * WAREHOUSE manages all inventory
 */
export function canEditItems(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeleteItems(user: User | null): boolean {
  return canEditItems(user);
}

export function canBatchOperateItems(user: User | null): boolean {
  return canEditItems(user);
}

// =====================
// PAINT PERMISSIONS
// =====================

/**
 * Can user edit/delete paints?
 * WAREHOUSE manages paint inventory
 */
export function canEditPaints(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeletePaints(user: User | null): boolean {
  return canEditPaints(user);
}

export function canBatchOperatePaints(user: User | null): boolean {
  return canEditPaints(user);
}

// Paint brands and types follow same rules as paints
export const canEditPaintBrands = canEditPaints;
export const canDeletePaintBrands = canDeletePaints;
export const canEditPaintTypes = canEditPaints;
export const canDeletePaintTypes = canDeletePaints;

/**
 * Can user edit/delete paint formulas?
 * WAREHOUSE manages paint formulas
 */
export function canEditPaintFormulas(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeletePaintFormulas(user: User | null): boolean {
  return canEditPaintFormulas(user);
}

/**
 * Can user edit/delete paint productions?
 * PRODUCTION and WAREHOUSE can manage paint productions
 */
export function canEditPaintProductions(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.PRODUCTION,
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeletePaintProductions(user: User | null): boolean {
  return canEditPaintProductions(user);
}

// =====================
// CUSTOMER PERMISSIONS
// =====================

/**
 * Can user edit/delete customers?
 * FINANCIAL, COMMERCIAL and team leaders manage customers
 */
export function canEditCustomers(user: User | null): boolean {
  if (!user) return false;
  // ADMIN, FINANCIAL, and COMMERCIAL can always edit customers
  if (hasAnyPrivilege(user, [SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN])) return true;
  // Team leaders can also edit customers
  return isTeamLeader(user);
}

export function canDeleteCustomers(user: User | null): boolean {
  return canEditCustomers(user);
}

export function canBatchOperateCustomers(user: User | null): boolean {
  return canEditCustomers(user);
}

// =====================
// ORDER PERMISSIONS
// =====================

/**
 * Can user edit/delete orders?
 * WAREHOUSE manages orders
 */
export function canEditOrders(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeleteOrders(user: User | null): boolean {
  return canEditOrders(user);
}

export function canBatchOperateOrders(user: User | null): boolean {
  return canEditOrders(user);
}

// =====================
// BORROW PERMISSIONS
// =====================

/**
 * Can user edit/delete borrows?
 * WAREHOUSE manages equipment borrows
 */
export function canEditBorrows(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeleteBorrows(user: User | null): boolean {
  return canEditBorrows(user);
}

export function canBatchOperateBorrows(user: User | null): boolean {
  return canEditBorrows(user);
}

// =====================
// PPE DELIVERY PERMISSIONS
// =====================

/**
 * Can user edit/delete PPE deliveries?
 * WAREHOUSE manages PPE deliveries
 */
export function canEditPpeDeliveries(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeletePpeDeliveries(user: User | null): boolean {
  return canEditPpeDeliveries(user);
}

export function canBatchOperatePpeDeliveries(user: User | null): boolean {
  return canEditPpeDeliveries(user);
}

// =====================
// MAINTENANCE PERMISSIONS
// =====================

/**
 * Can user edit/delete maintenance records?
 * WAREHOUSE and MAINTENANCE sectors manage maintenance
 */
export function canEditMaintenance(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.MAINTENANCE,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeleteMaintenance(user: User | null): boolean {
  return canEditMaintenance(user);
}

export function canBatchOperateMaintenance(user: User | null): boolean {
  return canEditMaintenance(user);
}

// =====================
// EXTERNAL WITHDRAWAL PERMISSIONS
// =====================

/**
 * Can user edit/delete external withdrawals?
 * WAREHOUSE manages external withdrawals
 */
export function canEditExternalWithdrawals(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeleteExternalWithdrawals(user: User | null): boolean {
  return canEditExternalWithdrawals(user);
}

export function canBatchOperateExternalWithdrawals(user: User | null): boolean {
  return canEditExternalWithdrawals(user);
}

// =====================
// SUPPLIER PERMISSIONS
// =====================

/**
 * Can user edit/delete suppliers?
 * WAREHOUSE manages suppliers
 */
export function canEditSuppliers(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeleteSuppliers(user: User | null): boolean {
  return canEditSuppliers(user);
}

// =====================
// HR ENTITY PERMISSIONS
// =====================

/**
 * Can user edit HR entities (vacations, warnings, positions)?
 * HUMAN_RESOURCES and ADMIN manage HR data
 */
export function canEditHrEntities(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeleteHrEntities(user: User | null): boolean {
  return canEditHrEntities(user);
}

// =====================
// USER PERMISSIONS
// =====================

/**
 * Can user edit/delete users?
 * Only ADMIN and HR can manage users
 */
export function canEditUsers(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeleteUsers(user: User | null): boolean {
  return canEditUsers(user);
}

// =====================
// GARAGE PERMISSIONS (Mobile-specific)
// =====================

/**
 * Can user edit/delete garages?
 * PRODUCTION and WAREHOUSE manage garage layouts
 */
export function canEditGarages(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.PRODUCTION,
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeleteGarages(user: User | null): boolean {
  return canEditGarages(user);
}

// =====================
// GENERAL UTILITY
// =====================

/**
 * Should interactive elements (swipe actions, long-press menus) be shown?
 * This is the main function to use in list/table components
 */
export function shouldShowInteractiveElements(
  user: User | null,
  entityType: 'task' | 'cut' | 'item' | 'paint' | 'customer' | 'order' |
               'borrow' | 'ppe' | 'maintenance' | 'externalWithdrawal' |
               'supplier' | 'hr' | 'user' | 'paintBrand' | 'paintType' | 
               'paintFormula' | 'garage' | 'airbrushing' | 'observation'
): boolean {
  switch (entityType) {
    case 'task':
      return canEditTasks(user);
    case 'cut':
      return canEditCuts(user);
    case 'item':
      return canEditItems(user);
    case 'paint':
    case 'paintBrand':
    case 'paintType':
      return canEditPaints(user);
    case 'paintFormula':
      return canEditPaintFormulas(user);
    case 'customer':
      return canEditCustomers(user);
    case 'order':
      return canEditOrders(user);
    case 'borrow':
      return canEditBorrows(user);
    case 'ppe':
      return canEditPpeDeliveries(user);
    case 'maintenance':
      return canEditMaintenance(user);
    case 'externalWithdrawal':
      return canEditExternalWithdrawals(user);
    case 'supplier':
      return canEditSuppliers(user);
    case 'hr':
      return canEditHrEntities(user);
    case 'user':
      return canEditUsers(user);
    case 'garage':
      return canEditGarages(user);
    case 'airbrushing':
      return canEditAirbrushings(user);
    case 'observation':
      return canEditObservations(user);
    default:
      return false;
  }
}
