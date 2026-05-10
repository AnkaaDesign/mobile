/**
 * @deprecated Use `<PrivilegeGate>` from `@/components/auth/privilege-gate`
 * combined with route-derived `getRequiredPrivilegeForRoute` from
 * `@/utils/route-privileges`.
 *
 * Kept as a thin shim that pipes the segment-derived privilege into the new
 * <PrivilegeGate>. Removed in Phase 3.
 */
import React, { ReactNode } from "react";
import { useSegments } from "expo-router";

import { SECTOR_PRIVILEGES } from "@/constants";
import { PrivilegeGuard } from "./privilege-guard";

interface RoutePrivilegeGuardProps {
  children: ReactNode;
  fallbackScreen?: string;
}

const MOBILE_ROUTE_PRIVILEGES: Record<string, SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[]> = {
  administration: SECTOR_PRIVILEGES.ADMIN,
  inventory: SECTOR_PRIVILEGES.WAREHOUSE,
  production: SECTOR_PRIVILEGES.PRODUCTION,
  painting: SECTOR_PRIVILEGES.WAREHOUSE,
  "human-resources": SECTOR_PRIVILEGES.HUMAN_RESOURCES,
  personal: SECTOR_PRIVILEGES.BASIC,
  home: SECTOR_PRIVILEGES.BASIC,
};

const SENSITIVE_OPERATIONS: Record<string, SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[]> = {
  create: SECTOR_PRIVILEGES.BASIC,
  edit: SECTOR_PRIVILEGES.BASIC,
  delete: SECTOR_PRIVILEGES.ADMIN,
  employees: SECTOR_PRIVILEGES.ADMIN,
  sectors: SECTOR_PRIVILEGES.ADMIN,
  positions: SECTOR_PRIVILEGES.ADMIN,
  commissions: SECTOR_PRIVILEGES.BASIC,
  automatic: SECTOR_PRIVILEGES.ADMIN,
  deliveries: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
};

function getRequiredPrivilegeForRoute(
  segments: string[],
): SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[] | null {
  if (!segments.length) return null;
  for (const segment of segments) {
    if (SENSITIVE_OPERATIONS[segment]) return SENSITIVE_OPERATIONS[segment];
  }
  for (const segment of segments) {
    if (MOBILE_ROUTE_PRIVILEGES[segment]) return MOBILE_ROUTE_PRIVILEGES[segment];
  }
  return SECTOR_PRIVILEGES.BASIC;
}

/** @deprecated Use `<PrivilegeGate>` directly. */
export function RoutePrivilegeGuard({
  children,
  fallbackScreen = "/(autenticacao)/entrar",
}: RoutePrivilegeGuardProps) {
  const segments = useSegments();
  const requiredPrivilege = getRequiredPrivilegeForRoute(segments);

  return (
    <PrivilegeGuard
      requiredPrivilege={requiredPrivilege || undefined}
      fallbackScreen={fallbackScreen}
      showUnauthorized
    >
      {children}
    </PrivilegeGuard>
  );
}

/** @deprecated Compose `<PrivilegeGate>` directly instead. */
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
      <PrivilegeGuard
        requiredPrivilege={requiredPrivilege}
        requireAll={options?.requireAll}
        fallbackScreen={options?.fallbackScreen}
        showUnauthorized={options?.showUnauthorized}
      >
        <Component {...props} />
      </PrivilegeGuard>
    );
  };
}

/** @deprecated Use the new generated/overrides map in `@/utils/route-privileges`. */
export { MOBILE_ROUTE_PRIVILEGES, SENSITIVE_OPERATIONS };
