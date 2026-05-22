/**
 * Tutorial v5 — fake-pages engine.
 *
 * Game-style guided tour rendered as a self-contained modal layer. No
 * dependency on real navigation, queryClient, screens, or DOM measurement;
 * every step renders a typed fake scene with declarative state.
 */
export {
  TutorialProvider,
  useTutorial,
  useOptionalTutorial,
  useTutorialActions,
  useOptionalTutorialActions,
  useTutorialIsActive,
  useActiveSceneState,
} from "./provider";
export { TutorialStage } from "./chrome/fake-stage";
export { TutorialFirstLaunchTrigger } from "./trigger";
export { TUTORIAL_TIMINGS } from "./engine-types";
export type {
  TutorialStep,
  TutorialStepKind,
  TutorialPlacement,
  TutorialActionType,
  TutorialContextValue,
  TutorialTargetRect,
  TutorialSceneState,
  SceneId,
} from "./engine-types";

/** v4 alias: TutorialOverlay → v5 TutorialStage. _layout.tsx kept compiling. */
export { TutorialStage as TutorialOverlay } from "./chrome/fake-stage";

// ─── v4 compat shims (no-op) ──────────────────────────────────────────────
//
// Real pages across the app still import `useTutorialTarget`, `TUTORIAL_TARGETS`,
// `registerPrecondition` etc. The v5 fake-pages engine never reads real-page
// state, so these calls do nothing. Shims keep the build green while the
// cleanup PR removes them file by file.

/** @deprecated v5 measures slot rects inside fake scenes. Real-page calls are no-ops. */
export function useTutorialTarget(_opts: unknown): void {
  /* no-op */
}

/** @deprecated v5 has no shared target registry — slot names are scoped per scene. */
export const TUTORIAL_TARGETS: Record<string, string> = new Proxy(
  {},
  {
    get: (_target, prop) => String(prop),
  },
) as Record<string, string>;

export type TutorialTargetId = string;

/** @deprecated removed in v5 */
export function getMeasureTick(): number {
  return 0;
}
/** @deprecated removed in v5 */
export function subscribeMeasureTick(_cb: () => void): () => void {
  return () => {};
}
/** @deprecated removed in v5 */
export function getTutorialActiveTargetId(): string | null {
  return null;
}
/** @deprecated removed in v5 */
export function subscribeTutorialActiveTargetId(
  _id: string,
  _cb: () => void,
): () => void {
  return () => {};
}
