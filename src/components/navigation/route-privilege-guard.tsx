import React, { ReactNode } from "react";
import { useSegments } from "expo-router";
import { SECTOR_PRIVILEGES } from '../../constants';
import { PrivilegeGuard } from "./privilege-guard";
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes } from '../../constants';

interface RoutePrivilegeGuardProps {
  children: ReactNode;
  fallbackScreen?: string;
}

/**
 * Route-based privilege mapping for mobile app
 * Maps route segments to required privileges
 */
const MOBILE_ROUTE_PRIVILEGES: Record<string, SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[]> = {
  // Administration routes
  administration: SECTOR_PRIVILEGES.ADMIN,

  // Inventory routes
  inventory: SECTOR_PRIVILEGES.WAREHOUSE,

  // Production routes
  production: SECTOR_PRIVILEGES.PRODUCTION,

  // Paint routes
  painting: SECTOR_PRIVILEGES.WAREHOUSE,

  // Human Resources routes
  "human-resources": SECTOR_PRIVILEGES.HUMAN_RESOURCES,

  // Statistics routes
  statistics: SECTOR_PRIVILEGES.LEADER,

  // Personal routes (accessible to all authenticated users)
  personal: SECTOR_PRIVILEGES.BASIC,

  // Home/Dashboard (accessible to all authenticated users)
  home: SECTOR_PRIVILEGES.BASIC,

  // Examples of array-based privileges (can be uncommented and customized)
  // 'maintenance': [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.MAINTENANCE, SECTOR_PRIVILEGES.ADMIN],
  // 'ppe': [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
};

/**
 * Sensitive operations that require elevated privileges
 * These routes require higher privileges regardless of their parent module
 */
const SENSITIVE_OPERATIONS: Record<string, SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[]> = {
  create: SECTOR_PRIVILEGES.LEADER, // Creation operations
  edit: SECTOR_PRIVILEGES.LEADER, // Edit operations
  delete: SECTOR_PRIVILEGES.ADMIN, // Delete operations (admin only)

  // Specific sensitive operations
  employees: SECTOR_PRIVILEGES.ADMIN, // Employee management
  sectors: SECTOR_PRIVILEGES.ADMIN, // Department management
  positions: SECTOR_PRIVILEGES.ADMIN, // Position management
  commissions: SECTOR_PRIVILEGES.LEADER, // Commission management
  automatic: SECTOR_PRIVILEGES.ADMIN, // Automatic orders
  deliveries: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN], // PPE deliveries
};

/**
 * Get required privilege for current route
 */
function getRequiredPrivilegeForRoute(segments: string[]): SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[] | null {
  if (!segments.length) return null;

  // Check for sensitive operations first (highest priority)
  for (const segment of segments) {
    if (SENSITIVE_OPERATIONS[segment]) {
      return SENSITIVE_OPERATIONS[segment];
    }
  }

  // Check main route privileges
  for (const segment of segments) {
    if (MOBILE_ROUTE_PRIVILEGES[segment]) {
      return MOBILE_ROUTE_PRIVILEGES[segment];
    }
  }

  // Default: if no specific privilege found, require BASIC (authenticated access)
  return SECTOR_PRIVILEGES.BASIC;
}

/**
 * Route Privilege Guard Component for Mobile
 * Automatically determines required privileges based on current route
 * Similar to web AutoPrivilegeRoute but optimized for mobile navigation
 */
export function RoutePrivilegeGuard({ children, fallbackScreen = routeToMobilePath(routes.authentication.login) }: RoutePrivilegeGuardProps) {
  const segments = useSegments();

  // Get required privilege for current route
  const requiredPrivilege = getRequiredPrivilegeForRoute(segments);

  // Use the base PrivilegeGuard with route-determined privileges
  return (
    <PrivilegeGuard requiredPrivilege={requiredPrivilege} fallbackScreen={fallbackScreen} showUnauthorized={true}>
      {children}
    </PrivilegeGuard>
  );
}

/**
 * Higher-Order Component for protecting screens
 * Usage: export default withPrivilegeGuard(MyScreen, [SECTOR_PRIVILEGES.ADMIN]);
 */
export function withPrivilegeGuard<T extends object>(
  Component: React.ComponentType<T>,
  requiredPrivilege: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[],
  options?: {
    requireAll?: boolean;
    fallbackScreen?: string;
    showUnauthorized?: boolean;
  },
) {
  return function ProtectedComponent(props: T) {
    return (
      <PrivilegeGuard requiredPrivilege={requiredPrivilege} requireAll={options?.requireAll} fallbackScreen={options?.fallbackScreen} showUnauthorized={options?.showUnauthorized}>
        <Component {...props} />
      </PrivilegeGuard>
    );
  };
}

/**
 * Export route privilege mapping for external use
 */
export { MOBILE_ROUTE_PRIVILEGES, SENSITIVE_OPERATIONS };
