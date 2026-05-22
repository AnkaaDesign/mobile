/**
 * v4 → v5 compat shim. Real screens still import `tutorialMocks` from here,
 * but v5 fake scenes carry their own fixtures; this module is now an
 * empty record kept to satisfy old imports until callers are removed.
 */
export const tutorialMocks: Record<string, unknown> = {};

export function injectTutorialMocks(_queryClient: unknown, _user: unknown): void {
  /* no-op */
}

export function clearTutorialMocks(_queryClient: unknown): void {
  /* no-op */
}
