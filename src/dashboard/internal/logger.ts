// Internal framework logger for the mobile dashboard.
//
// Replaces the previous pattern of silent console.warns scattered across the
// codebase, and gives us a single seam to wire to monitoring later. Today this
// is a thin wrapper around console.warn in dev and a no-op in production.

type Area =
  | "registry"
  | "dashboard-grid"
  | "use-dashboard-layout"
  | "widget-tile"
  | "widget";

type Code =
  | "duplicate-registration"
  | "span-clamped"
  | "rows-clamped"
  | "config-restored"
  | "unknown-widget"
  | "preferences-load-failed"
  | "preferences-save-failed"
  | "instance-id-collision-fallback";

export function logFrameworkWarning(
  area: Area,
  code: Code,
  payload?: unknown,
): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(`[dashboard:${area}] ${code}`, payload);
  }
}
