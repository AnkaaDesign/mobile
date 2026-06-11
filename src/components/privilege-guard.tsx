/**
 * @deprecated Use `<PrivilegeGate>` from `@/components/auth/privilege-gate`.
 *
 * This file is now a back-compat shim that adapts the old
 * `<PrivilegeGuard requiredPrivilege requireAll fallbackScreen showUnauthorized>`
 * API to the new `<PrivilegeGate required fallback redirectTo>` API. It will
 * be removed in Phase 3 cleanup once area agents have migrated their imports.
 */
import { ReactNode } from "react";

import { SECTOR_PRIVILEGES } from "@/constants";
import { PrivilegeGate, type PrivilegeGateFallback } from "@/components/auth/privilege-gate";
import { hasPrivilege, hasAnyPrivilege, hasAllPrivileges } from "@/utils";
import { isTeamLeader } from "@/utils/user";
import { useAuth } from "@/contexts/auth-context";
import { mobileRoute } from "@/constants/routes.types";
import { routes } from "@/constants/routes";
import type { PrivilegeReq } from "@/hooks/use-privilege-gate";
import type { User } from "@/types/user";

interface PrivilegeGuardProps {
  children: ReactNode;
  requiredPrivilege?: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[];
  requireAll?: boolean;
  fallbackScreen?: string;
  showUnauthorized?: boolean;
}

/** @deprecated Use `<PrivilegeGate>` directly. */
export function PrivilegeGuard({
  children,
  requiredPrivilege,
  requireAll = false,
  fallbackScreen,
  showUnauthorized = true,
}: PrivilegeGuardProps) {
  // No required privilege → render children unguarded (mirrors legacy behavior).
  if (!requiredPrivilege) return <>{children}</>;

  const required: PrivilegeReq = Array.isArray(requiredPrivilege)
    ? requireAll
      ? { all: requiredPrivilege }
      : { any: requiredPrivilege }
    : requiredPrivilege;

  const fallback: PrivilegeGateFallback = showUnauthorized ? "unauthorized" : "redirect";
  // `as any` avoids unioning two AppRoute values (TS2590 — generated Href union too complex)
  const redirectTo = fallbackScreen ? mobileRoute(fallbackScreen) : (mobileRoute(routes.home) as any);

  return (
    <PrivilegeGate required={required} fallback={fallback} redirectTo={redirectTo}>
      {children}
    </PrivilegeGate>
  );
}

/**
 * @deprecated Use `usePrivilegeGate` from `@/hooks/use-privilege-gate`
 * combined with `useAuth` for imperative checks.
 *
 * Kept for back-compat — internally identical to the legacy implementation.
 */
export function usePrivilegeCheck() {
  const { user } = useAuth();

  const hasPrivilegeAccess = (privilege: SECTOR_PRIVILEGES) => hasPrivilege(user, privilege);
  const hasAnyPrivilegeAccess = (privileges: SECTOR_PRIVILEGES[]) =>
    hasAnyPrivilege(user, privileges);
  const hasAllPrivilegeAccess = (privileges: SECTOR_PRIVILEGES[]) =>
    hasAllPrivileges(user, privileges);

  const canAccess = (
    privilege: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[],
    requireAll: boolean = false,
  ) => checkUserPrivileges(user, privilege, requireAll);

  return {
    user,
    hasPrivilegeAccess,
    hasAnyPrivilegeAccess,
    hasAllPrivilegeAccess,
    canAccess,
    isAdmin: user ? hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) : false,
    isTeamLeader: isTeamLeader(user),
  };
}

function checkUserPrivileges(
  user: User | null,
  requiredPrivilege: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[],
  requireAll: boolean = false,
): boolean {
  if (!user || !requiredPrivilege) return false;
  if (Array.isArray(requiredPrivilege)) {
    return requireAll
      ? hasAllPrivileges(user, requiredPrivilege)
      : hasAnyPrivilege(user, requiredPrivilege);
  }
  return hasPrivilege(user, requiredPrivilege);
}
