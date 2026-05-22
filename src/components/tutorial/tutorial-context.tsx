/**
 * v4 → v5 compat shim. Re-exports the v5 provider/hooks under the v4 names
 * so deep imports of `@/components/tutorial/tutorial-context` keep working.
 */
export {
  TutorialProvider,
  useTutorial,
  useOptionalTutorial,
  useTutorialActions,
  useOptionalTutorialActions,
  useTutorialIsActive,
} from "./provider";
