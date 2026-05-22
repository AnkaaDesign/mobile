/**
 * v4 → v5 compat shim. Real-page calls to `useTutorialTarget({ id, ... })`
 * are now inert — the v5 fake-pages engine measures slots inside its own
 * scene components and never touches real screens.
 */
export function useTutorialTarget(_opts: unknown): void {
  /* no-op */
}
