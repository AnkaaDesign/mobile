import { useMemo } from "react";
import { SECTOR_PRIVILEGES } from "@/constants";
import { isTeamLeader } from "@/utils";

/**
 * Permission flags derived from user privilege.
 * Shared between minimal and full include computation.
 */
function useTaskPermissions(user: any) {
  const userPrivilege = user?.sector?.privileges;

  const isAdminUser = userPrivilege === SECTOR_PRIVILEGES.ADMIN;
  const isFinancialUser = userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;
  const isCommercialUser = userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL;
  const isDesignerUser = userPrivilege === SECTOR_PRIVILEGES.DESIGNER;
  const isLogisticUser = userPrivilege === SECTOR_PRIVILEGES.LOGISTIC;
  const isWarehouseUser = userPrivilege === SECTOR_PRIVILEGES.WAREHOUSE;
  const isProductionUser = userPrivilege === SECTOR_PRIVILEGES.PRODUCTION;

  return {
    canViewRestrictedFields: isAdminUser || isFinancialUser || isCommercialUser || isLogisticUser || isDesignerUser,
    canViewObservation: !isWarehouseUser && !isFinancialUser && !isDesignerUser && !isLogisticUser && !isCommercialUser,
    canViewBaseFiles: isAdminUser || isCommercialUser || isLogisticUser || isDesignerUser,
    canViewArtworks: !isWarehouseUser && !isFinancialUser && !isLogisticUser,
    canViewPricingSection: isAdminUser || isFinancialUser || isCommercialUser,
    canViewPaintSections: !isWarehouseUser && !isFinancialUser && !isLogisticUser,
    canViewLogoPaints: !isWarehouseUser && !isFinancialUser && !isLogisticUser && !isCommercialUser,
  };
}

/**
 * Minimal include for above-the-fold content (task info, dates, services, truck layout).
 * This is a fast query since it only JOINs a few lightweight relations.
 * Used for prefetch from agenda and initial render.
 */
export function useTaskDetailMinimalInclude(user: any) {
  const { canViewRestrictedFields } = useTaskPermissions(user);

  return useMemo(() => ({
    sector: {
      select: { id: true, name: true },
    },
    customer: {
      select: {
        id: true,
        fantasyName: true,
        corporateName: true,
      },
    },
    createdBy: {
      select: { id: true, name: true },
    },
    truck: true,
    serviceOrders: {
      select: {
        id: true,
        description: true,
        status: true,
        type: true,
        statusOrder: true,
        position: true,
        assignedToId: true,
        assignedTo: { select: { id: true, name: true } },
        observation: true,
        startedAt: true,
        finishedAt: true,
      },
    },
    ...(canViewRestrictedFields && {
      responsibles: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    }),
  }), [canViewRestrictedFields]);
}

/**
 * Full include for all content including below-fold sections
 * (pricing, paints, files, observation, etc.).
 * This is a heavier query used after the initial render completes.
 */
export function useTaskDetailFullInclude(user: any) {
  const {
    canViewRestrictedFields,
    canViewObservation,
    canViewBaseFiles,
    canViewArtworks,
    canViewPricingSection,
    canViewPaintSections,
    canViewLogoPaints,
  } = useTaskPermissions(user);

  return useMemo(() => ({
    sector: {
      select: { id: true, name: true },
    },
    customer: {
      select: {
        id: true,
        fantasyName: true,
        corporateName: true,
      },
    },
    createdBy: {
      select: { id: true, name: true },
    },
    truck: true,
    serviceOrders: {
      select: {
        id: true,
        description: true,
        status: true,
        type: true,
        statusOrder: true,
        position: true,
        assignedToId: true,
        assignedTo: { select: { id: true, name: true } },
        observation: true,
        startedAt: true,
        finishedAt: true,
      },
    },
    ...(canViewRestrictedFields && {
      responsibles: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    }),
    ...(canViewObservation && {
      observation: { select: { id: true, description: true } },
    }),
    ...(canViewBaseFiles && {
      baseFiles: {
        select: { id: true, filename: true, size: true, mimetype: true },
        take: 20,
      },
    }),
    ...(canViewArtworks && {
      artworks: {
        select: { id: true, file: { select: { id: true, filename: true } } },
        take: 20,
      },
    }),
    ...(canViewPricingSection && {
      pricing: {
        select: {
          id: true,
          total: true,
          status: true,
          subtotal: true,
          discountType: true,
          discountValue: true,
          discountReference: true,
          expiresAt: true,
          budgetNumber: true,
          paymentCondition: true,
          customPaymentText: true,
          guaranteeYears: true,
          customGuaranteeText: true,
          customForecastDays: true,
          simultaneousTasks: true,
          layoutFileId: true,
          layoutFile: true,
          customerSignatureId: true,
          customerSignature: true,
          items: { take: 10 },
        },
      },
    }),
    ...(canViewPaintSections && {
      generalPainting: true,
    }),
    ...(canViewLogoPaints && {
      logoPaints: { take: 10 },
    }),
  }), [
    canViewRestrictedFields,
    canViewObservation,
    canViewBaseFiles,
    canViewArtworks,
    canViewPricingSection,
    canViewPaintSections,
    canViewLogoPaints,
  ]);
}

/**
 * @deprecated Use useTaskDetailMinimalInclude for prefetch/initial render
 * and useTaskDetailFullInclude for complete data.
 */
export function useTaskDetailInclude(user: any) {
  return useTaskDetailFullInclude(user);
}
