import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/contexts/favorites-context";
import { buildTutorialSteps } from "./tutorial-steps";
import { tutorialStorage } from "./tutorial-storage";
import { clearTutorialMocks, injectTutorialMocks } from "./tutorial-mocks";
import type {
  TutorialActionType,
  TutorialContextValue,
  TutorialProviderProps,
  TutorialState,
  TutorialStep,
  TutorialTargetRect,
} from "./types";

const TutorialContext = createContext<TutorialContextValue | null>(null);

/**
 * expo-router's `usePathname()` strips group segments like `(tabs)` from the
 * URL, while our ROUTES constants include them for readability. Normalize both
 * sides before comparing so step navigation doesn't trigger redundant pushes.
 */
function normalizeRoute(path: string | undefined | null): string {
  if (!path) return "";
  return path.replace(/\/\([^)]+\)/g, "") || "/";
}

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used inside TutorialProvider");
  return ctx;
}

export function useOptionalTutorial(): TutorialContextValue | null {
  return useContext(TutorialContext);
}

const haptic = (type: "light" | "medium" | "success" = "light") => {
  try {
    if (type === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (type === "medium") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  } catch {}
};

export function TutorialProvider({ children }: TutorialProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { reloadFromStorage: reloadFavorites } = useFavorites();

  const [state, setState] = useState<TutorialState>({
    isActive: false,
    isPendingStart: false,
    currentStepIndex: 0,
    steps: [],
    completedStepIds: [],
    awaitingAction: false,
    isCelebrating: false,
  });

  const targetsRef = useRef<Map<string, TutorialTargetRect>>(new Map());
  const [, forceTick] = useState(0);
  const triggerRerender = useCallback(() => forceTick((n) => n + 1), []);

  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    if (navTimer.current) {
      clearTimeout(navTimer.current);
      navTimer.current = null;
    }
  }, []);

  const stop = useCallback(async () => {
    clearTimers();
    setState((s) => ({
      ...s,
      isActive: false,
      isPendingStart: false,
      awaitingAction: false,
      isCelebrating: false,
    }));
    targetsRef.current.clear();
    clearTutorialMocks(queryClient);
    // Mock cleanup writes the user's previous favorites back to AsyncStorage
    // asynchronously. The `isActive` effect below reloads the in-memory list
    // once the storage write has had a chance to land.
  }, [clearTimers, queryClient]);

  const setPendingStart = useCallback((pending: boolean) => {
    setState((s) =>
      s.isPendingStart === pending ? s : { ...s, isPendingStart: pending }
    );
  }, []);

  const complete = useCallback(async () => {
    if (user?.id) await tutorialStorage.markCompleted(user.id);
    haptic("success");
    await stop();
  }, [stop, user?.id]);

  const skip = useCallback(async () => {
    if (user?.id) await tutorialStorage.markCompleted(user.id);
    await stop();
  }, [stop, user?.id]);

  const next = useCallback(() => {
    clearTimers();
    haptic("light");
    setState((s) => {
      const currentStep = s.steps[s.currentStepIndex];
      const nextIndex = s.currentStepIndex + 1;
      const completedStepIds = currentStep
        ? Array.from(new Set([...s.completedStepIds, currentStep.id]))
        : s.completedStepIds;

      if (nextIndex >= s.steps.length) {
        // Last step done — mark completion
        if (user?.id) {
          tutorialStorage.markCompleted(user.id).catch(() => {});
        }
        clearTutorialMocks(queryClient);
        return {
          ...s,
          isActive: false,
          isPendingStart: false,
          awaitingAction: false,
          isCelebrating: false,
          completedStepIds,
        };
      }

      return {
        ...s,
        currentStepIndex: nextIndex,
        awaitingAction: false,
        isCelebrating: false,
        completedStepIds,
      };
    });
  }, [clearTimers, queryClient, user?.id]);

  const start = useCallback(
    async (opts?: { fromStepIndex?: number }) => {
      const steps = buildTutorialSteps();
      injectTutorialMocks(queryClient);
      haptic("medium");
      setState({
        isActive: true,
        isPendingStart: false,
        currentStepIndex: opts?.fromStepIndex ?? 0,
        steps,
        completedStepIds: [],
        awaitingAction: false,
        isCelebrating: false,
      });
    },
    [queryClient]
  );

  const reset = useCallback(async () => {
    if (user?.id) await tutorialStorage.reset(user.id);
  }, [user?.id]);

  const registerTarget = useCallback(
    (id: string, rect: TutorialTargetRect) => {
      const existing = targetsRef.current.get(id);
      if (
        existing &&
        Math.abs(existing.x - rect.x) < 0.5 &&
        Math.abs(existing.y - rect.y) < 0.5 &&
        Math.abs(existing.width - rect.width) < 0.5 &&
        Math.abs(existing.height - rect.height) < 0.5
      ) {
        // No meaningful change — skip the re-render to avoid the
        // measure → register → re-render → measure loop.
        return;
      }
      targetsRef.current.set(id, rect);
      triggerRerender();
    },
    [triggerRerender]
  );

  const unregisterTarget = useCallback(
    (id: string) => {
      if (!targetsRef.current.has(id)) return;
      targetsRef.current.delete(id);
      triggerRerender();
    },
    [triggerRerender]
  );

  const notifyAction = useCallback(
    (
      action: TutorialActionType,
      payload?: { targetId?: string; eventId?: string }
    ) => {
      setState((s) => {
        if (!s.isActive) return s;
        const step = s.steps[s.currentStepIndex];
        if (!step) return s;
        if (step.kind !== "interactive") return s;
        if (step.expectedAction !== action) return s;

        // For tap/drawer-open, the targetId must match.
        if (
          (action === "tap" || action === "drawer-open") &&
          step.targetId &&
          payload?.targetId &&
          step.targetId !== payload.targetId
        ) {
          return s;
        }

        // For form events, the eventId must match.
        if (
          (action === "input" || action === "submit") &&
          step.expectedEventId &&
          payload?.eventId !== step.expectedEventId
        ) {
          return s;
        }

        // Mark satisfied — schedule advance after small delay (visual feedback).
        return { ...s, awaitingAction: false };
      });

      // Advance after a brief delay so the user sees their tap effect.
      setTimeout(() => {
        haptic("light");
        next();
      }, 220);
    },
    [next]
  );

  const currentStep: TutorialStep | null = state.isActive
    ? state.steps[state.currentStepIndex] ?? null
    : null;

  const currentTargetRect = currentStep?.targetId
    ? targetsRef.current.get(currentStep.targetId) ?? null
    : null;

  // ─── Side-effects on entering a step ─────────────────────────────────────
  // 1. Programmatic navigation (navigateOnEnter / screen).
  useEffect(() => {
    if (!state.isActive || !currentStep) return;
    if (navTimer.current) clearTimeout(navTimer.current);

    const targetRoute = currentStep.navigateOnEnter ?? currentStep.screen;
    if (targetRoute && normalizeRoute(pathname) !== normalizeRoute(targetRoute)) {
      navTimer.current = setTimeout(() => {
        try {
          router.push(targetRoute as any);
        } catch {}
      }, 150);
    }
  }, [state.isActive, state.currentStepIndex, currentStep, pathname, router]);

  // 2. Auto-advance for showcase steps (only after we're on the right screen).
  useEffect(() => {
    if (!state.isActive || !currentStep) return;
    if (currentStep.kind !== "showcase") return;

    // Wait until we're actually on the target screen (if specified) before timing.
    if (
      currentStep.screen &&
      normalizeRoute(pathname) !== normalizeRoute(currentStep.screen)
    )
      return;

    const ms = currentStep.autoAdvanceMs ?? 4500;
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => next(), ms);
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = null;
      }
    };
  }, [state.isActive, state.currentStepIndex, currentStep, pathname, next]);

  // 3. Interactive step → flag "awaiting action".
  useEffect(() => {
    if (!state.isActive || !currentStep) return;
    if (currentStep.kind === "interactive") {
      setState((s) =>
        s.awaitingAction ? s : { ...s, awaitingAction: true }
      );
    }
  }, [state.isActive, state.currentStepIndex, currentStep]);

  // 4. Listen for drawer state to detect the "drawer-open" expected action.
  useEffect(() => {
    if (!state.isActive || !currentStep) return;
    if (currentStep.expectedAction !== "drawer-open") return;
    const unsubscribe = navigation.addListener?.("state", () => {
      const navState = navigation.getState?.();
      const isDrawerOpen = (navState as any)?.history?.some?.(
        (h: any) => h?.type === "drawer"
      );
      if (isDrawerOpen) {
        notifyAction("drawer-open", { targetId: currentStep.targetId });
      }
    });
    return () => {
      try {
        unsubscribe?.();
      } catch {}
    };
  }, [state.isActive, currentStep, navigation, notifyAction]);

  // 5. Auto-skip if a step's target never measures (missing element, screen
  //    didn't render the expected component, etc.). Watches the current step
  //    + its measured rect; arms a 2.5s timer when we're waiting for a rect
  //    and clears it as soon as the rect arrives or the step changes.
  useEffect(() => {
    if (!state.isActive || !currentStep) return;
    if (!currentStep.targetId) return;
    if (currentTargetRect) return;

    const stepId = currentStep.id;
    const stepIdx = state.currentStepIndex;
    const handle = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.warn(
        `[tutorial] step "${stepId}" (index ${stepIdx}) target "${currentStep.targetId}" never measured after 2500ms — auto-advancing`
      );
      next();
    }, 2500);

    return () => clearTimeout(handle);
  }, [
    state.isActive,
    state.currentStepIndex,
    currentStep,
    currentTargetRect,
    next,
  ]);

  // 6. When the tutorial activates or deactivates, the mocks module writes
  //    AsyncStorage in the background. The FavoritesContext doesn't observe
  //    storage on its own, so we explicitly trigger a reload after a couple
  //    of staggered ticks to guarantee the in-memory list reflects the
  //    demo favorites (on start) or the restored real ones (on stop).
  useEffect(() => {
    const handles = [
      setTimeout(() => reloadFavorites().catch(() => {}), 120),
      setTimeout(() => reloadFavorites().catch(() => {}), 600),
    ];
    return () => handles.forEach(clearTimeout);
  }, [state.isActive, reloadFavorites]);

  // 7. Cleanup on unmount.
  useEffect(() => {
    return () => {
      clearTimers();
      clearTutorialMocks(queryClient);
    };
  }, [clearTimers, queryClient]);

  const value = useMemo<TutorialContextValue>(
    () => ({
      ...state,
      currentStep,
      totalSteps: state.steps.length,
      currentTargetRect,
      start,
      stop,
      next,
      skip,
      complete,
      reset,
      setPendingStart,
      registerTarget,
      unregisterTarget,
      notifyAction,
    }),
    [
      state,
      currentStep,
      currentTargetRect,
      start,
      stop,
      next,
      skip,
      complete,
      reset,
      setPendingStart,
      registerTarget,
      unregisterTarget,
      notifyAction,
    ]
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

/**
 * Helper to programmatically open the drawer from anywhere — used by the
 * tutorial step library to "demonstrate" navigation when needed.
 */
export function openDrawerFromTutorial(navigation: any) {
  try {
    navigation.dispatch(DrawerActions.openDrawer());
  } catch {}
}
