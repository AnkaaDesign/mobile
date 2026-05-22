/**
 * v4 → v5 compat shim. The v5 engine has no shared target registry — slot
 * names are scoped per fake scene. A proxy returns the property name as a
 * string so legacy `TUTORIAL_TARGETS.foo` calls evaluate to "foo" without
 * runtime errors. The slot system in v5 ignores these values entirely.
 */
export const TUTORIAL_TARGETS: Record<string, string> = new Proxy(
  {},
  {
    get: (_target, prop) => String(prop),
  },
) as Record<string, string>;

export type TutorialTargetId = string;
