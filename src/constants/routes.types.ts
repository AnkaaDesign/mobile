/**
 * Branded route type — forces all navigation APIs in the new foundation
 * layer to consume routes that have been piped through `mobileRoute()`.
 *
 * Plain strings will fail to type-check, catching missing `(tabs)` prefixes
 * and other route-format mistakes at compile time rather than at runtime.
 *
 * Usage:
 *   import { routes } from '@/constants/routes';
 *   import { mobileRoute } from '@/constants/routes.types';
 *   nav.push(mobileRoute(routes.inventory.products.list));
 */
import { routes } from "@/constants/routes";

declare const AppRouteBrand: unique symbol;
export type AppRoute = string & { readonly [AppRouteBrand]: "AppRoute" };

/**
 * Wraps a route string with the mobile `/(tabs)/` prefix and brands it as
 * an `AppRoute`.
 *
 * Mirrors the behavior of `routeToMobilePath` (in `@/utils/route-mapper`)
 * but produces a type-safe value. The legacy helper is `@deprecated` —
 * call sites should migrate to `mobileRoute`.
 */
export function mobileRoute(route: string): AppRoute {
  if (route === "/" || route === routes.home) {
    return "/(tabs)/inicio" as AppRoute;
  }

  // Already-prefixed routes (e.g., from a previous mobileRoute call) pass through.
  if (route.startsWith("/(tabs)/") || route.startsWith("/(autenticacao)")) {
    return route as AppRoute;
  }

  const cleanPath = route.startsWith("/") ? route.slice(1) : route;
  return `/(tabs)/${cleanPath}` as AppRoute;
}
