/**
 * Auth-route helpers — bridge between typed `routes.authentication.X` (which
 * are `/autenticacao/...`) and the expo-router group form `/(autenticacao)/...`
 * that the runtime navigator expects.
 *
 * `mobileRoute()` (foundation) already passes `/(autenticacao)/...` strings
 * through unchanged, but typed route values from `@/constants/routes`
 * lack the parenthesized group prefix. This helper bridges them without
 * touching the foundation route map.
 *
 * Usage:
 *   nav.push(authRoute(routes.authentication.login));
 *   nav.replace(authRoute(routes.authentication.resetPassword(token), { contact, code }));
 */
import { mobileRoute, type AppRoute } from "@/constants/routes.types";

/**
 * Convert a typed `/autenticacao/...` path to `/(autenticacao)/...` and brand it.
 *
 * Optional `params` are appended as a query string (URL-encoded). Use this for
 * passing `contact`, `returnTo`, etc. to verification screens.
 */
export function authRoute(
  path: string,
  params?: Record<string, string | undefined>,
): AppRoute {
  const stripped = path.startsWith("/autenticacao")
    ? path.slice("/autenticacao".length)
    : path;
  const base = `/(autenticacao)${stripped}`;

  if (params) {
    const entries = Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    );
    if (entries.length > 0) {
      const qs = entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");
      return mobileRoute(`${base}?${qs}` as AppRoute);
    }
  }

  return mobileRoute(base as AppRoute);
}
