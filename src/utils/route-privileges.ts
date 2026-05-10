/**
 * Route privilege resolver.
 *
 * Backward-compatible API surface — every existing caller of
 * `getRequiredPrivilegeForRoute`, `routeRequiresPrivilege`,
 * `routeRequiresAdmin`, `getPrivilegeDisplayText`, and `getRoutePrivilegeInfo`
 * keeps working unchanged. The internal map is now derived from:
 *
 *   GENERATED_ROUTE_PRIVILEGES (route-privileges.generated.ts) — directory-tree
 *     baseline maintained by `scripts/generate-route-privileges.ts`
 *
 * merged with
 *
 *   ROUTE_PRIVILEGE_OVERRIDES (route-privileges.overrides.ts) — hand-tuned
 *     exceptions for cross-domain reads, "list = HR but create = ADMIN"
 *     patterns, etc.
 *
 * The 464-line manual map this file used to contain is gone — that drift
 * was the #1 source of audit-confirmed permission bugs.
 */
import { SECTOR_PRIVILEGES } from "@/constants";
import { GENERATED_ROUTE_PRIVILEGES } from "./route-privileges.generated";
import { ROUTE_PRIVILEGE_OVERRIDES } from "./route-privileges.overrides";

/**
 * Final per-route privilege map. Override entries win over generated ones.
 * Exported for diagnostics; consumers should call the helpers below.
 */
export const ROUTE_PRIVILEGES: Record<
  string,
  keyof typeof SECTOR_PRIVILEGES | (keyof typeof SECTOR_PRIVILEGES)[]
> = {
  ...GENERATED_ROUTE_PRIVILEGES,
  ...ROUTE_PRIVILEGE_OVERRIDES,
};

/**
 * Get required privilege(s) for a route.
 * Returns single privilege or array of privileges.
 * For unmatched routes, defaults to ADMIN (safe default).
 */
export function getRequiredPrivilegeForRoute(
  pathname: string,
): keyof typeof SECTOR_PRIVILEGES | (keyof typeof SECTOR_PRIVILEGES)[] {
  // Remove query params if present
  const cleanPath = pathname.split("?")[0];

  // First check for exact match
  if (ROUTE_PRIVILEGES[cleanPath]) {
    return ROUTE_PRIVILEGES[cleanPath];
  }

  // Then check for dynamic routes with [id], [token], etc. parameters.
  // Sort by specificity (longer pattern first) so /a/b/[id] beats /a/[id].
  const dynamicRoutes = Object.entries(ROUTE_PRIVILEGES)
    .filter(([routePattern]) => routePattern.includes("["))
    .sort(([a], [b]) => b.length - a.length);

  for (const [routePattern, privilege] of dynamicRoutes) {
    const regexPattern = routePattern
      .replace(/\[([^\]]+)\]/g, "[^/]+")
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPattern}$`);
    if (regex.test(cleanPath)) {
      return privilege;
    }
  }

  // Default to ADMIN for unmatched routes (safe default)
  return "ADMIN";
}

export function routeRequiresPrivilege(pathname: string): boolean {
  const requiredPrivilege = getRequiredPrivilegeForRoute(pathname);
  if (Array.isArray(requiredPrivilege)) {
    return requiredPrivilege.some((privilege) => privilege !== "BASIC");
  }
  return requiredPrivilege !== "BASIC";
}

export function routeRequiresAdmin(pathname: string): boolean {
  const requiredPrivilege = getRequiredPrivilegeForRoute(pathname);
  if (Array.isArray(requiredPrivilege)) {
    return requiredPrivilege.includes("ADMIN");
  }
  return requiredPrivilege === "ADMIN";
}

export function getPrivilegeDisplayText(
  privilege: keyof typeof SECTOR_PRIVILEGES | (keyof typeof SECTOR_PRIVILEGES)[],
): string {
  if (Array.isArray(privilege)) {
    return privilege.join(" ou ");
  }
  return privilege;
}

export function getRoutePrivilegeInfo(pathname: string) {
  const privilege = getRequiredPrivilegeForRoute(pathname);
  return {
    route: pathname,
    privilege,
    isArray: Array.isArray(privilege),
    requiresPrivilege: routeRequiresPrivilege(pathname),
    requiresAdmin: routeRequiresAdmin(pathname),
    displayText: getPrivilegeDisplayText(privilege),
  };
}
