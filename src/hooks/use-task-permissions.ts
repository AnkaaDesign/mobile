import { SECTOR_PRIVILEGES } from '../constants/enums';
import { usePrivileges } from './usePrivileges';
import { isTeamLeader } from '../utils/user';

/**
 * Centralized task permission hook.
 * Replaces scattered inline privilege checks (isFinancialUser, isWarehouseUser, etc.)
 * with descriptive, self-documenting permission flags.
 */
export function useTaskPermissions() {
  const {
    user,
    isAdmin,
    hasAnyPrivilegeAccess,
  } = usePrivileges();

  const privilege = user?.sector?.privileges as SECTOR_PRIVILEGES | undefined;
  const isTeamLeaderUser = user ? isTeamLeader(user) : false;

  // EXACT match — hasPrivilegeAccess() treats ADMIN as matching every privilege,
  // which breaks the negation-based flags below (e.g. !isFinancial → false for ADMIN).
  const is = (p: SECTOR_PRIVILEGES) => privilege === p;
  const isFinancial = is(SECTOR_PRIVILEGES.FINANCIAL);
  const isWarehouse = is(SECTOR_PRIVILEGES.WAREHOUSE);
  const isDesigner = is(SECTOR_PRIVILEGES.DESIGNER);
  const isLogistic = is(SECTOR_PRIVILEGES.LOGISTIC);
  const isProductionManager = is(SECTOR_PRIVILEGES.PRODUCTION_MANAGER);
  const isPlotting = is(SECTOR_PRIVILEGES.PLOTTING);
  const isCommercial = is(SECTOR_PRIVILEGES.COMMERCIAL);
  const isProduction = is(SECTOR_PRIVILEGES.PRODUCTION);

  // CRUD
  const canCreate = hasAnyPrivilegeAccess([
    SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
  ]);
  const canEdit = hasAnyPrivilegeAccess([
    SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
  ]);
  const canDelete = isAdmin;
  const canBatchOperate = isAdmin;

  // Status
  const canManageStatus = isAdmin || isTeamLeaderUser;
  const canFinish = hasAnyPrivilegeAccess([SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.PRODUCTION_MANAGER]);
  const canCancel = hasAnyPrivilegeAccess([
    SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ]);

  // Section visibility
  const canViewQuote = isAdmin || isFinancial || isCommercial;
  const canViewRestrictedFields = isAdmin || isFinancial || isCommercial || isLogistic || isProductionManager || isDesigner;
  const canViewCommission = isAdmin || isFinancial || isCommercial || isProduction;
  const canViewDates = !isWarehouse;
  const canViewServices = !isWarehouse && !isPlotting;
  const canViewLayout = isAdmin || isLogistic || isProductionManager || (isProduction && isTeamLeaderUser);
  const canViewTruckSpot = isAdmin || isLogistic || isProductionManager;
  const canViewPaint = !isWarehouse && !isFinancial && !isLogistic && !isProductionManager;
  const canViewLogoPaint = canViewPaint && !isCommercial;
  const canViewCuts = !isFinancial && !isLogistic && !isProductionManager && !isCommercial;
  const canViewAirbrushing = !isWarehouse && !isFinancial && !isDesigner && !isLogistic && !isProductionManager && !isCommercial;
  const canViewBaseFiles = !isWarehouse && !isFinancial;
  const canViewProjectFiles = !isWarehouse && !isFinancial;
  const canViewCheckinCheckout = isAdmin || isLogistic || isProductionManager;
  const canViewReimbursement = !isWarehouse && !isFinancial && !isLogistic && !isProductionManager;
  const canViewObservation = !isWarehouse && !isFinancial && !isDesigner && !isLogistic && !isProductionManager && !isCommercial;
  const canViewArtworkBadges = isAdmin || isCommercial || isFinancial || isLogistic || isProductionManager || isDesigner;
  const canViewDocuments = isAdmin || isFinancial;
  // Mobile-specific
  const canViewArtworks = !isWarehouse && !isFinancial && !isLogistic && !isProductionManager;
  const canViewTruckDetails = !isProduction || isTeamLeaderUser;

  // Field editability
  const canEditIdentity = !isFinancial && !isWarehouse && !isDesigner;
  const canEditSector = !isFinancial && !isWarehouse && !isDesigner && !isCommercial;
  const canEditCommission = !isFinancial && !isDesigner && !isLogistic && !isProductionManager && !isWarehouse;
  const canEditDates = !isWarehouse && !isFinancial && !isDesigner;
  const canEditResponsibles = !isFinancial && !isDesigner && !isLogistic && !isProductionManager;
  const canEditServices = !isWarehouse;
  const canEditLayout = !isFinancial && !isDesigner;
  const canEditPaint = !isWarehouse && !isDesigner;

  return {
    user, privilege, isAdmin, isTeamLeader: isTeamLeaderUser,
    isDesigner,
    canCreate, canEdit, canDelete, canBatchOperate,
    canManageStatus, canFinish, canCancel,
    canViewQuote, canViewRestrictedFields, canViewCommission,
    canViewDates, canViewServices, canViewLayout, canViewTruckSpot,
    canViewPaint, canViewLogoPaint, canViewCuts,
    canViewAirbrushing, canViewBaseFiles, canViewProjectFiles,
    canViewCheckinCheckout, canViewReimbursement, canViewObservation,
    canViewArtworkBadges, canViewDocuments,
    canViewArtworks, canViewTruckDetails,
    canEditIdentity, canEditSector, canEditCommission,
    canEditDates, canEditResponsibles, canEditServices,
    canEditLayout, canEditPaint,
  };
}

export type TaskPermissions = ReturnType<typeof useTaskPermissions>;
