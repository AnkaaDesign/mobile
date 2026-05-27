/**
 * Tutorial v5 — provider.
 *
 * One TutorialEngine per provider mount, no router/queryClient dependencies.
 * The engine reads the current user lazily through a ref so its identity is
 * stable across re-renders.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTutorialStore } from "./engine-store";
import { TutorialEngine } from "./engine";
import type {
  TutorialActions,
  TutorialContextValue,
  TutorialProviderProps,
} from "./engine-types";

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: TutorialProviderProps) {
  const { user } = useAuth() as any;
  const userRef = useRef(user);
  userRef.current = user;

  const engineRef = useRef<TutorialEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new TutorialEngine({
      getUser: () => userRef.current,
    });
  }

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  const isActive = useTutorialStore((s) => s.isActive);
  const isPendingStart = useTutorialStore((s) => s.isPendingStart);
  const currentStepIndex = useTutorialStore((s) => s.currentStepIndex);
  const steps = useTutorialStore((s) => s.steps);
  const completedStepIds = useTutorialStore((s) => s.completedStepIds);
  const awaitingAction = useTutorialStore((s) => s.awaitingAction);
  const activeSlot = useTutorialStore((s) => s.activeSlot);
  const activeTargetRect = useTutorialStore((s) => s.activeTargetRect);

  const currentStep = steps[currentStepIndex] ?? null;
  const totalSteps = steps.length;

  const start = useCallback(
    (opts?: { fromStepIndex?: number }) => engineRef.current!.start(opts),
    [],
  );
  const stop = useCallback(() => engineRef.current!.stop(), []);
  const next = useCallback(() => engineRef.current!.next(), []);
  const goToStep = useCallback(
    (index: number) => engineRef.current!.goToStep(index),
    [],
  );
  const skip = useCallback(() => engineRef.current!.skip(), []);
  const complete = useCallback(() => engineRef.current!.complete(), []);
  const reset = useCallback(() => engineRef.current!.reset(), []);
  const notifyAction = useCallback<TutorialActions["notifyAction"]>(
    (action) => engineRef.current!.notifyAction(action),
    [],
  );
  const setPendingStart = useCallback(
    (pending: boolean) => useTutorialStore.getState().setPendingStart(pending),
    [],
  );

  // v4 compat: no-op shims for legacy real-page calls (useTutorialTarget,
  // registerPrecondition, markScreenReady, etc.). v5 fake scenes own their
  // own state, so these never need to do anything.
  const noop = useCallback(() => {}, []);
  const noopReturnsCleanup = useCallback(() => () => {}, []);

  const contextValue = useMemo<TutorialContextValue>(
    () => ({
      isActive,
      isPendingStart,
      currentStepIndex,
      steps,
      completedStepIds,
      awaitingAction,
      activeSlot,
      activeTargetId: activeSlot,
      activeTargetRect,
      runtimeStatus: isActive ? "running" : "idle",
      isCelebrating: false,
      currentStep,
      totalSteps,
      currentTargetRect: activeTargetRect,
      start,
      stop,
      next,
      goToStep,
      skip,
      complete,
      reset,
      notifyAction,
      setPendingStart,
      // v4 no-op shims
      registerTarget: noop,
      unregisterTarget: noop,
      registerAction: noop,
      unregisterAction: noop,
      registerPrecondition: noopReturnsCleanup,
      invokeTargetAction: noop,
      registerOpenDrawerCallback: noop,
      registerCloseDrawerCallback: noop,
      markScreenReady: noop,
    }),
    [
      isActive,
      isPendingStart,
      currentStepIndex,
      steps,
      completedStepIds,
      awaitingAction,
      activeSlot,
      activeTargetRect,
      currentStep,
      totalSteps,
      start,
      stop,
      next,
      goToStep,
      skip,
      complete,
      reset,
      notifyAction,
      setPendingStart,
      noop,
      noopReturnsCleanup,
    ],
  );

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used inside TutorialProvider");
  return ctx;
}

export function useOptionalTutorial(): TutorialContextValue | null {
  return useContext(TutorialContext);
}

export function useTutorialActions(): TutorialActions {
  const ctx = useContext(TutorialContext);
  if (!ctx)
    throw new Error("useTutorialActions must be used inside TutorialProvider");
  return ctx;
}

export function useOptionalTutorialActions(): TutorialActions | null {
  return useContext(TutorialContext);
}

export function useTutorialIsActive(): boolean {
  return useTutorialStore((s) => s.isActive);
}

export function useActiveSceneState() {
  return useTutorialStore((s) => s.activeSceneState);
}
