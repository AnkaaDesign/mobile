// =====================================================
// Application Contexts
// =====================================================

export * from "./auth-context";
export * from "./theme-context";
export * from "./favorites-context";
export * from "./navigation-history-context";
export * from "./swipe-row-context";
export * from "./sidebar-context";

// =====================================================
// Network & Connectivity Contexts
// =====================================================
export * from "./network-context";

// =====================================================
// Form & Keyboard Contexts
// =====================================================
export * from "./KeyboardAwareFormContext";

// =====================================================
// Foundation: consolidated navigation hook
// =====================================================
// Prefer `useNav` for new code — it composes loading-overlay + history
// + dismissTo + withLoading behind a single typed surface.
//
// `useNavigationLoading` and `useNavigationHistory` (re-exported above)
// are kept and marked @deprecated for the migration window — removed
// in Phase 3 cleanup once area agents have migrated their imports.
export { useNav, MODAL_SEGMENTS } from "./nav";
export type { UseNavReturn } from "./nav";
