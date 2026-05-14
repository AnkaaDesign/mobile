/**
 * Game-style tutorial system for PRODUCTION sector users.
 *
 * Covers every screen a base-PRODUCTION user can access — from the home tab
 * through cronograma, aerografia, recorte, garagens, histórico, observações
 * (full create flow), ordens de serviço, notificações and perfil.
 *
 * Three step kinds drive the engine:
 *   - `narration`   — full-screen tooltip, advance with CTA.
 *   - `showcase`    — spotlight + auto-advance.
 *   - `interactive` — spotlight + blocks until the user performs the
 *                     `expectedAction` (tap, drawer-open, input, submit).
 */
export {
  TutorialProvider,
  useTutorial,
  useOptionalTutorial,
  useTutorialActions,
  useOptionalTutorialActions,
  useTutorialIsActive,
} from "./tutorial-context";
export { TutorialOverlay } from "./tutorial-overlay";
export {
  getMeasureTick,
  subscribeMeasureTick,
  getActiveTargetId as getTutorialActiveTargetId,
  subscribeIsActiveTarget as subscribeTutorialActiveTargetId,
} from "./tutorial-store";
export { TutorialFirstLaunchTrigger } from "./tutorial-trigger";
export { useTutorialTarget } from "./use-tutorial-target";
export { TUTORIAL_TARGETS } from "./target-ids";
export type { TutorialTargetId } from "./target-ids";
export type {
  TutorialStep,
  TutorialState,
  TutorialStepKind,
  TutorialPlacement,
  TutorialActionType,
  TutorialContextValue,
  TutorialTargetRect,
} from "./types";
