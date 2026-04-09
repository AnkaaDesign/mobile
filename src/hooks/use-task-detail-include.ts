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
  const isProductionManagerUser = userPrivilege === SECTOR_PRIVILEGES.PRODUCTION_MANAGER;
  const isWarehouseUser = userPrivilege === SECTOR_PRIVILEGES.WAREHOUSE;
  const isProductionUser = userPrivilege === SECTOR_PRIVILEGES.PRODUCTION;

  return {
    canViewRestrictedFields: isAdminUser || isFinancialUser || isCommercialUser || isLogisticUser || isProductionManagerUser || isDesignerUser,
    canViewObservation: !isWarehouseUser && !isFinancialUser && !isDesignerUser && !isLogisticUser && !isProductionManagerUser && !isCommercialUser,
    canViewBaseFiles: isAdminUser || isCommercialUser || isLogisticUser || isProductionManagerUser || isDesignerUser,
    canViewProjectFiles: isAdminUser || isCommercialUser || isLogisticUser || isProductionManagerUser || isDesignerUser,
    canViewCheckinCheckout: isAdminUser || isCommercialUser || isFinancialUser || isLogisticUser || isProductionManagerUser,
    canViewArtworks: true, // All sectors can view artworks (filtered by approval status in UI)
    canViewPricingSection: isAdminUser || isFinancialUser || isCommercialUser,
    canViewPaintSections: !isWarehouseUser && !isFinancialUser && !isLogisticUser && !isProductionManagerUser,
    canViewLogoPaints: !isWarehouseUser && !isFinancialUser && !isLogisticUser && !isProductionManagerUser && !isCommercialUser,
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
    canViewProjectFiles,
    canViewCheckinCheckout,
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
        // Include checkin/checkout files per service order when user has permission
        ...(canViewCheckinCheckout && {
          checkinFiles: { select: { id: true, filename: true, size: true, mimetype: true, thumbnailUrl: true } },
          checkoutFiles: { select: { id: true, filename: true, size: true, mimetype: true, thumbnailUrl: true } },
        }),
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
    ...(canViewProjectFiles && {
      projectFiles: {
        select: { id: true, filename: true, size: true, mimetype: true },
        take: 20,
      },
    }),
    ...(canViewArtworks && {
      artworks: {
        select: {
          id: true,
          status: true,
          file: {
            select: { id: true, filename: true, mimetype: true, size: true, thumbnailUrl: true },
          },
        },
        take: 20,
      },
    }),
    ...(canViewPricingSection && {
      quote: {
        select: {
          id: true,
          total: true,
          status: true,
          subtotal: true,
          expiresAt: true,
          budgetNumber: true,
          guaranteeYears: true,
          customGuaranteeText: true,
          customForecastDays: true,
          simultaneousTasks: true,
          layoutFileId: true,
          layoutFile: true,
          services: {
            select: {
              id: true,
              description: true,
              amount: true,
              position: true,
              observation: true,
            },
            take: 10,
          },
          customerConfigs: {
            select: {
              id: true,
              customerId: true,
              subtotal: true,
              total: true,
              customPaymentText: true,
              paymentCondition: true,
              generateInvoice: true,
              orderNumber: true,
              responsibleId: true,
              customerSignatureId: true,
              customerSignature: true,
              customer: { select: { id: true, fantasyName: true, cnpj: true } },
              installments: { orderBy: { number: 'asc' as const } },
            },
          },
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
    canViewProjectFiles,
    canViewCheckinCheckout,
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
