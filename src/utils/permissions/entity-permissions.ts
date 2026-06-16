/**
 * Centralized entity permission utilities
 * Determines if users can perform write operations (edit, delete) on entities
 * This controls visibility of checkboxes, swipe actions, and bulk action buttons
 *
 * NOTE: LEADER privilege was removed. Team leadership is now determined by
 * the ledSector relationship (Sector.leaderId points to the user).
 * Use isTeamLeader(user) to check if a user leads a sector.
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
 * MATCHES WEB: /web/src/utils/permissions/service-order-permissions.ts
 *
 * Permission Matrix (VISIBILITY):
 * | Sector             | PRODUCTION | COMMERCIAL | LOGISTIC | ARTWORK |
 * |--------------------|------------|------------|----------|---------|
 * | ADMIN              | ✓          | ✓          | ✓        | ✓       |
 * | COMMERCIAL         | ✓          | ✓          | ✓        | ✓       |
 * | DESIGNER           | ✓          | -          | -        | ✓       |
 * | FINANCIAL          | -          | ✓          | ✓        | -       |
 * | LOGISTIC           | ✓          | ✓          | ✓        | ✓       |
 * | PRODUCTION_MANAGER | ✓          | ✓          | ✓        | ✓       |
 * | PRODUCTION         | ✓          | -          | -        | -       |
 * | WAREHOUSE          | ✓          | -          | -        | -       |
 * | HUMAN_RESOURCES    | ✓          | -          | -        | -       |
 * | Others             | ✓          | -          | -        | -       |
 */
export function getVisibleServiceOrderTypes(user: User | null): SERVICE_ORDER_TYPE[] {
  if (!user?.sector?.privileges) return [];

  const privilege = user.sector.privileges;

  switch (privilege) {
    case SECTOR_PRIVILEGES.ADMIN:
      // ADMIN can see all service order types
      return [
        SERVICE_ORDER_TYPE.PRODUCTION,
        SERVICE_ORDER_TYPE.COMMERCIAL,
        SERVICE_ORDER_TYPE.LOGISTIC,
        SERVICE_ORDER_TYPE.ARTWORK,
      ];

    case SECTOR_PRIVILEGES.COMMERCIAL:
      // COMMERCIAL can see all service order types (matches web)
      return [
        SERVICE_ORDER_TYPE.PRODUCTION,
        SERVICE_ORDER_TYPE.COMMERCIAL,
        SERVICE_ORDER_TYPE.LOGISTIC,
        SERVICE_ORDER_TYPE.ARTWORK,
      ];

    case SECTOR_PRIVILEGES.DESIGNER:
      // DESIGNER can see PRODUCTION and ARTWORK
      return [
        SERVICE_ORDER_TYPE.PRODUCTION,
        SERVICE_ORDER_TYPE.ARTWORK,
      ];

    case SECTOR_PRIVILEGES.FINANCIAL:
      // FINANCIAL can see COMMERCIAL and LOGISTIC (matches web)
      return [
        SERVICE_ORDER_TYPE.COMMERCIAL,
        SERVICE_ORDER_TYPE.LOGISTIC,
      ];

    case SECTOR_PRIVILEGES.LOGISTIC:
    case SECTOR_PRIVILEGES.PRODUCTION_MANAGER:
      // LOGISTIC / PRODUCTION_MANAGER can see PRODUCTION, LOGISTIC, COMMERCIAL, ARTWORK (matches web)
      return [
        SERVICE_ORDER_TYPE.PRODUCTION,
        SERVICE_ORDER_TYPE.LOGISTIC,
        SERVICE_ORDER_TYPE.COMMERCIAL,
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
 * | Sector             | PRODUCTION | COMMERCIAL | LOGISTIC | ARTWORK |
 * |--------------------|------------|------------|----------|---------|
 * | ADMIN              | ✓          | ✓          | ✓        | ✓       |
 * | COMMERCIAL         | -          | ✓          | -        | -       |
 * | DESIGNER           | -          | -          | -        | ✓       |
 * | FINANCIAL          | -          | -          | -        | -       |
 * | LOGISTIC           | ✓          | -          | ✓        | -       |
 * | PRODUCTION_MANAGER | ✓          | -          | ✓        | -       |
 * | Leader             | ✓          | -          | -        | -       |
 * | Others             | -          | -          | -        | -       |
 */
export function canEditServiceOrderOfType(user: User | null, serviceOrderType: SERVICE_ORDER_TYPE): boolean {
  if (!user?.sector?.privileges) return false;

  const privilege = user.sector.privileges;

  // ADMIN can edit all types
  if (privilege === SECTOR_PRIVILEGES.ADMIN) return true;

  // Type-specific edit permissions
  switch (serviceOrderType) {
    case SERVICE_ORDER_TYPE.PRODUCTION:
      // LOGISTIC, PRODUCTION_MANAGER, and team leaders can edit production service orders
      return privilege === SECTOR_PRIVILEGES.LOGISTIC || privilege === SECTOR_PRIVILEGES.PRODUCTION_MANAGER || isTeamLeader(user);

    case SERVICE_ORDER_TYPE.COMMERCIAL:
      // Only COMMERCIAL can edit commercial service orders
      return privilege === SECTOR_PRIVILEGES.COMMERCIAL;

    case SERVICE_ORDER_TYPE.LOGISTIC:
      // LOGISTIC and PRODUCTION_MANAGER can edit logistic service orders
      return privilege === SECTOR_PRIVILEGES.LOGISTIC || privilege === SECTOR_PRIVILEGES.PRODUCTION_MANAGER;

    case SERVICE_ORDER_TYPE.ARTWORK:
      // Only DESIGNER can edit artwork service orders
      return privilege === SECTOR_PRIVILEGES.DESIGNER;

    default:
      return false;
  }
}

/**
 * Check if user should see detailed service order view
 * Detailed view includes: assigned user, start/finish dates, observation indicator, status combobox
 * Simplified view: only description and status badge in same row
 *
 * Users with detailed view: ADMIN, COMMERCIAL, DESIGNER, FINANCIAL, LOGISTIC, PRODUCTION_MANAGER, Team Leaders
 * Users with simplified view: PRODUCTION (non-leaders), WAREHOUSE, HUMAN_RESOURCES, Others
 *
 * Note: Team leaders need detailed view to see observation indicators and change service order status
 */
export function hasDetailedServiceOrderView(user: User | null): boolean {
  if (!user?.sector?.privileges) return false;

  // Team leaders always get detailed view (needed for observation indicator and status changes)
  if (isTeamLeader(user)) return true;

  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
  ]);
}

/**
 * Check if user can edit (update) service orders.
 * Mirrors API PUT /service-orders/:id roles
 * (service-order.controller.ts): ADMIN, FINANCIAL, COMMERCIAL, PRODUCTION,
 * DESIGNER, LOGISTIC, PRODUCTION_MANAGER.
 */
export function canEditServiceOrders(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.PRODUCTION,
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
  ]);
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
 * Get allowed status transitions for a user editing a specific service order.
 *
 * SOURCE OF TRUTH: this lives in `@/utils/permissions/service-order-permissions.ts`
 * (signature: (sectorPrivilege, serviceOrderType, isTeamLeader?)), which matches web.
 * The previous User-based copy here diverged (omitted PAUSED for ARTWORK and lacked
 * team-leader PAUSED gating) and has been removed to keep a single source of truth.
 *
 * The TASK DETAIL services card now drives its status dropdown from the web
 * state-machine inline (see task-services-card.tsx), and the standalone SO detail
 * card consumes the service-order-permissions.ts helpers directly.
 */

// =====================
// TASK PERMISSIONS
// =====================

/**
 * Can user create tasks?
 * ADMIN, COMMERCIAL, FINANCIAL, LOGISTIC, and PRODUCTION_MANAGER can create new tasks
 */
export function canCreateTasks(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
  ]);
}

/**
 * Can user edit tasks?
 * ADMIN can edit all fields
 * COMMERCIAL, DESIGNER, FINANCIAL, LOGISTIC, PRODUCTION_MANAGER can edit limited fields (form handles field visibility)
 * Team leaders can start/finish tasks but NOT edit details
 * PRODUCTION is view-only
 */
export function canEditTasks(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
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
 * Team leaders can start/finish tasks in their led sector (or tasks without sector)
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
 * Can user finish/complete tasks?
 * Only PRODUCTION_MANAGER and ADMIN can finish tasks
 */
export function canFinishTask(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
  ]);
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
 * Can user view cancelled tasks in task history?
 * ADMIN, COMMERCIAL, and FINANCIAL can view cancelled tasks via status filter
 * By default, only COMPLETED tasks are shown - user must explicitly select CANCELLED
 */
export function canViewCancelledTasks(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
  ]);
}

/**
 * Can user release tasks (set forecastDate to today)?
 * PRODUCTION, LOGISTIC, PRODUCTION_MANAGER, COMMERCIAL, and ADMIN can release tasks
 * Matches API prepare endpoint permissions
 */
export function canReleaseTasks(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.PRODUCTION,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Can user access advanced task menu options (artworks, copy from task)?
 * ADMIN, COMMERCIAL, FINANCIAL, LOGISTIC, PRODUCTION_MANAGER can access advanced menu
 * Matches web canAccessAdvancedMenu permission
 */
export function canAccessAdvancedTaskMenu(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
  ]);
}

/**
 * Can user add artworks to tasks?
 * ADMIN, COMMERCIAL, FINANCIAL can add artworks (LOGISTIC excluded)
 */
export function canAddArtworks(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
  ]);
}

/**
 * Can user change task sector?
 * ADMIN, LOGISTIC, and PRODUCTION_MANAGER can change task sector
 */
export function canChangeTaskSector(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
  ]);
}

/**
 * Can user view/edit check-in and check-out files on tasks?
 * ADMIN, LOGISTIC, PRODUCTION_MANAGER can view and edit
 */
export function canViewCheckinCheckout(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
  ]);
}

/**
 * Can user cancel tasks (set status to CANCELLED)?
 * ADMIN, LOGISTIC, PRODUCTION_MANAGER, FINANCIAL, COMMERCIAL can cancel tasks
 * Different from delete - cancel just changes status
 */
export function canCancelTasks(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ]);
}

/**
 * Check if team leader can manage a specific task (start/finish) (sector-based validation)
 * Team leaders can manage tasks in their LED sector OR tasks without a sector
 * When starting a task without sector, it will be assigned to leader's led sector
 * ADMIN can manage any task
 */
export function canLeaderManageTask(user: User | null, taskSectorId: string | null | undefined): boolean {
  if (!user) return false;

  // ADMIN can manage any task
  if (user.sector?.privileges === SECTOR_PRIVILEGES.ADMIN) return true;

  // Team leaders can only manage tasks assigned to their LED sector
  // Leaders cannot manage unassigned tasks — PM/COMMERCIAL/ADMIN must assign a sector first
  if (isTeamLeader(user)) {
    if (!taskSectorId) return false;
    return user.ledSector?.id === taskSectorId;
  }

  return false;
}

/**
 * Check if team leader can update service orders for a specific task
 * Team leaders can ONLY update service orders for tasks in their LED sector
 * Tasks with null sector are NOT allowed (unlike task start/finish)
 * ADMIN can update any service order
 */
export function canLeaderUpdateServiceOrder(user: User | null, taskSectorId: string | null | undefined): boolean {
  if (!user) return false;

  // ADMIN can update any service order
  if (user.sector?.privileges === SECTOR_PRIVILEGES.ADMIN) return true;

  // Team leaders can ONLY update service orders for tasks in their LED sector
  // NOT for tasks with null sector
  if (isTeamLeader(user)) {
    if (!taskSectorId) return false; // Cannot update service orders for tasks without sector
    return user.ledSector?.id === taskSectorId;
  }

  return false;
}

/**
 * Check if user is a team leader (leads a sector)
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
 * ADMIN, LOGISTIC, PRODUCTION_MANAGER can edit truck layouts
 */
export function canEditLayouts(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER]);
}

/**
 * Can user view truck layouts?
 * ADMIN, LOGISTIC, PRODUCTION_MANAGER can view truck layouts
 */
export function canViewLayouts(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER]);
}

/**
 * Can user edit ONLY layouts (not other task fields)?
 * This is for users who can edit layouts but NOT other task fields
 * ADMIN has full edit access, so they should use the regular edit page
 */
export function canEditLayoutsOnly(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER]);
}

/**
 * Can user edit layout for a specific task?
 * ADMIN, LOGISTIC, PRODUCTION_MANAGER can edit any task's layout
 */
export function canEditLayoutForTask(user: User | null, _taskSectorId: string | null | undefined): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER]);
}

// =====================
// CUT PERMISSIONS
// =====================

/**
 * Can user create cuts?
 * Mirrors API POST /cuts roles: DESIGNER, ADMIN.
 */
export function canCreateCuts(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Can user edit cuts?
 * Mirrors API PUT /cuts/:id roles: DESIGNER, PLOTTING, ADMIN.
 */
export function canEditCuts(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.PLOTTING,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Can user delete cuts?
 * Mirrors API DELETE /cuts/:id roles: DESIGNER, ADMIN.
 */
export function canDeleteCuts(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Can user start/finish cuts (change status)?
 * Mirrors API PUT /cuts/:id roles: DESIGNER, PLOTTING, ADMIN.
 */
export function canManageCutStatus(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.PLOTTING,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Can user request a new cut?
 * Mirrors API POST /cuts roles: DESIGNER, ADMIN.
 * (Team-leader cut requests were removed — the API never allowed them.)
 */
export function canRequestCut(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

/**
 * Can user request a cut for a specific task?
 * Mirrors API POST /cuts roles: DESIGNER, ADMIN.
 * (Signature kept for existing call sites; taskSectorId no longer
 * influences the decision — the API has no sector-scoped cut create.)
 */
export function canRequestCutForTask(user: User | null, _taskSectorId: string | null | undefined): boolean {
  return canRequestCut(user);
}

// =====================
// AIRBRUSHING PERMISSIONS
// =====================

/**
 * Can user create/edit/delete airbrushings?
 * ADMIN, COMMERCIAL, and FINANCIAL can manage airbrushings
 */
export function canCreateAirbrushings(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
  ]);
}

export function canEditAirbrushings(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
  ]);
}

export function canDeleteAirbrushings(user: User | null): boolean {
  // Mirrors API DELETE /airbrushings/:id roles: ADMIN, COMMERCIAL, FINANCIAL.
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
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
 * Can user create observations?
 * Decided matrix (2026-06-10 audit, parity with API + web):
 * create = ADMIN, COMMERCIAL, FINANCIAL, WAREHOUSE, PRODUCTION_MANAGER.
 * PRODUCTION is read-only (view only).
 */
export function canCreateObservations(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
  ]);
}

export function canEditObservations(user: User | null): boolean {
  if (!user) return false;
  // Decided matrix (2026-06-10 audit): create/update = ADMIN, COMMERCIAL,
  // FINANCIAL, WAREHOUSE, PRODUCTION_MANAGER. PRODUCTION is read-only.
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
  ]);
}

export function canDeleteObservations(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.FINANCIAL,
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

/**
 * Can user DELETE inventory items (and their categories/brands)?
 * WAREHOUSE manages inventory but must NEVER delete it — only ADMIN may delete.
 * Deletion is intentionally decoupled from editing. Category and brand deletes
 * reuse this function, inheriting the same ADMIN-only rule.
 */
export function canDeleteItems(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
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
 * Mirrors API paint-production update/delete roles: WAREHOUSE, ADMIN.
 */
export function canEditPaintProductions(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
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
 * FINANCIAL, COMMERCIAL, LOGISTIC, PRODUCTION_MANAGER, and ADMIN manage customers
 */
export function canEditCustomers(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canDeleteCustomers(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canBatchOperateCustomers(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

// =====================
// RESPONSIBLE PERMISSIONS
// =====================

/**
 * Can user edit/delete responsibles?
 * ADMIN and COMMERCIAL manage responsibles
 */
export function canEditResponsibles(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ]);
}

export function canDeleteResponsibles(user: User | null): boolean {
  // API DELETE /responsibles is ADMIN-only (responsible.controller.ts).
  if (!user) return false;
  return hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN]);
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

/**
 * Can user DELETE orders (and order schedules)?
 * WAREHOUSE manages orders but must NEVER delete them — only ADMIN may delete.
 * Order schedule deletes reuse this function, inheriting the same ADMIN-only rule.
 */
export function canDeleteOrders(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
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
// EXTERNAL OPERATION PERMISSIONS
// =====================

/**
 * Can user edit/delete external operations?
 * ADMIN-only while the billing feature stabilizes
 */
export function canEditExternalOperations(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN]);
}

export function canDeleteExternalOperations(user: User | null): boolean {
  return canEditExternalOperations(user);
}

export function canBatchOperateExternalOperations(user: User | null): boolean {
  return canEditExternalOperations(user);
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

/**
 * Can user DELETE suppliers?
 * WAREHOUSE manages suppliers but must NEVER delete them — only ADMIN may delete.
 */
export function canDeleteSuppliers(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

// =====================
// PRICE VISIBILITY
// =====================

/**
 * Can user see monetary values (prices, costs, totals)?
 * WAREHOUSE manages inventory but must NEVER see prices. Every other privilege
 * keeps access. Plain predicate mirroring the `useCanViewPrices()` hook so it can
 * be used in static list-config `canView` column guards.
 */
export function canViewPrices(user: User | null): boolean {
  return !!user && user.sector?.privileges !== SECTOR_PRIVILEGES.WAREHOUSE;
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

/**
 * Can user manage Medicina do Trabalho entities (medical exams / ASO, leaves,
 * work-accident reports / CAT)? Mirrors the web occupational-health pages, which
 * gate to ACCOUNTING + HUMAN_RESOURCES + ADMIN (the api controllers are gated the
 * same way — these records carry restricted clinical fields such as CID).
 */
export function canManageOccupationalHealth(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ACCOUNTING,
    SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    SECTOR_PRIVILEGES.ADMIN,
  ]);
}

export function canEditOccupationalHealth(user: User | null): boolean {
  return canManageOccupationalHealth(user);
}

export function canDeleteOccupationalHealth(user: User | null): boolean {
  return canManageOccupationalHealth(user);
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
// GENERAL UTILITY
// =====================

/**
 * Should interactive elements (swipe actions, long-press menus) be shown?
 * This is the main function to use in list/table components
 */
export function shouldShowInteractiveElements(
  user: User | null,
  entityType: 'task' | 'cut' | 'item' | 'paint' | 'customer' | 'order' |
               'borrow' | 'ppe' | 'maintenance' | 'externalOperation' |
               'supplier' | 'hr' | 'user' | 'paintBrand' | 'paintType' |
               'paintFormula' | 'airbrushing' | 'observation'
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
    case 'externalOperation':
      return canEditExternalOperations(user);
    case 'supplier':
      return canEditSuppliers(user);
    case 'hr':
      return canEditHrEntities(user);
    case 'user':
      return canEditUsers(user);
    case 'airbrushing':
      return canEditAirbrushings(user);
    case 'observation':
      return canEditObservations(user);
    default:
      return false;
  }
}
