/**
 * usePrivilegeGate — single hook the new <PrivilegeGate> component (and
 * area-agent screens needing imperative checks) consume.
 *
 * Replaces the inline `hasPrivilege(user, ...)` early-returns and the
 * mixture of <PrivilegeGuard> / <RoutePrivilegeGuard> that the audit
 * flagged as the #1 source of permission-check drift across the app.
 */
import { useMemo } from "react";

import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES, TEAM_LEADER } from "@/constants";
import { hasPrivilege, hasAnyPrivilege, hasAllPrivileges } from "@/utils";
import type { User } from "@/types/user";

/** A sector privilege or the virtual TEAM_LEADER (sector leader) privilege. */
export type PrivilegeValue = SECTOR_PRIVILEGES | typeof TEAM_LEADER;

export type PrivilegeReq =
  | PrivilegeValue
  | { any: PrivilegeValue[] }
  | { all: PrivilegeValue[] }
  | { self: true; otherwise: PrivilegeReq };

export type PrivilegeReason =
  | "unauthenticated"
  | "insufficient"
  | "wrong-owner";

export interface UsePrivilegeGateOpts {
  /** When the requirement involves `self`, supply the resource's owner id. */
  resource?: { ownerId?: string | null };
  /**
   * Phase: `pre` (default) — evaluated immediately. `post` — gate stays
   * "pending" while the resource is still loading (useful for self-edit
   * checks on detail pages).
   */
  when?: "pre" | "post";
}

export interface UsePrivilegeGateResult {
  allowed: boolean;
  /** True only when `when: 'post'` and the resource hasn't loaded yet. */
  pending: boolean;
  reason?: PrivilegeReason;
  user: User | null;
}

function evaluate(
  user: User | null,
  req: PrivilegeReq,
  resource?: { ownerId?: string | null },
): { allowed: boolean; reason?: PrivilegeReason } {
  if (!user) return { allowed: false, reason: "unauthenticated" };

  // Single privilege string
  if (typeof req === "string") {
    return hasPrivilege(user, req)
      ? { allowed: true }
      : { allowed: false, reason: "insufficient" };
  }

  // { self: true, otherwise }
  if ("self" in req) {
    const ownerId = resource?.ownerId;
    if (ownerId && ownerId === user.id) {
      return { allowed: true };
    }
    // Not the owner — fall back to the otherwise privilege check
    const fallback = evaluate(user, req.otherwise, resource);
    if (fallback.allowed) return { allowed: true };
    return { allowed: false, reason: ownerId ? "wrong-owner" : fallback.reason ?? "insufficient" };
  }

  // { any: [...] } — OR
  if ("any" in req) {
    return hasAnyPrivilege(user, req.any)
      ? { allowed: true }
      : { allowed: false, reason: "insufficient" };
  }

  // { all: [...] } — AND
  if ("all" in req) {
    return hasAllPrivileges(user, req.all)
      ? { allowed: true }
      : { allowed: false, reason: "insufficient" };
  }

  return { allowed: false, reason: "insufficient" };
}

export function usePrivilegeGate(
  req: PrivilegeReq,
  opts?: UsePrivilegeGateOpts,
): UsePrivilegeGateResult {
  const { user, isLoading, isAuthReady } = useAuth();
  const when = opts?.when ?? "pre";

  return useMemo(() => {
    // Auth still loading — neither allow nor deny yet
    if (!isAuthReady || isLoading) {
      return { allowed: false, pending: true, user };
    }

    // post-mode and self requirement: wait for the resource to load
    if (when === "post" && reqMentionsSelf(req) && !opts?.resource) {
      return { allowed: false, pending: true, user };
    }
    if (when === "post" && reqMentionsSelf(req) && opts?.resource && opts.resource.ownerId === undefined) {
      return { allowed: false, pending: true, user };
    }

    const r = evaluate(user, req, opts?.resource);
    return { allowed: r.allowed, pending: false, reason: r.reason, user };
  }, [user, isLoading, isAuthReady, req, opts, when]);
}

function reqMentionsSelf(req: PrivilegeReq): boolean {
  if (typeof req === "string") return false;
  if ("self" in req) return true;
  return false;
}
