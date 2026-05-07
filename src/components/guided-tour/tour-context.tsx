import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { isTeamLeader } from "@/utils/user";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import type {
  TourContextValue,
  TourPlayMode,
  TourProviderProps,
  TourState,
  TourStep,
  TourTargetRect,
} from "./types";
import { buildTourSteps } from "./tour-steps";
import { tourStorage } from "./tour-storage";
import { clearTourMocks, injectTourMocks } from "./tour-mocks";

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside TourProvider");
  return ctx;
}

export function useOptionalTour(): TourContextValue | null {
  return useContext(TourContext);
}

export function TourProvider({ children }: TourProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isProduction = user?.sector?.privileges === SECTOR_PRIVILEGES.PRODUCTION;
  const isLeader = !!user && isTeamLeader(user);

  const [state, setState] = useState<TourState>({
    isActive: false,
    currentStepIndex: 0,
    steps: [],
    playMode: "auto",
    isPaused: false,
    awaitingInteraction: false,
  });

  const targetsRef = useRef<Map<string, TourTargetRect>>(new Map());
  const [, forceTick] = useState(0);
  const triggerRerender = useCallback(() => forceTick((n) => n + 1), []);

  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNavTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    if (pendingNavTimer.current) {
      clearTimeout(pendingNavTimer.current);
      pendingNavTimer.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    setState((s) => ({ ...s, isActive: false, awaitingInteraction: false }));
    targetsRef.current.clear();
    clearTourMocks(queryClient);
  }, [clearTimers, queryClient]);

  const completeAndStop = useCallback(async () => {
    await tourStorage.markCompleted();
    stop();
  }, [stop]);

  const goToStepIndex = useCallback(
    (index: number) => {
      setState((s) => {
        if (index >= s.steps.length) {
          tourStorage.markCompleted();
          clearTourMocks(queryClient);
          return { ...s, isActive: false, awaitingInteraction: false };
        }
        if (index < 0) return s;
        return { ...s, currentStepIndex: index, awaitingInteraction: false };
      });
    },
    [queryClient]
  );

  const next = useCallback(() => {
    clearTimers();
    setState((s) => {
      const nextIdx = s.currentStepIndex + 1;
      if (nextIdx >= s.steps.length) {
        tourStorage.markCompleted();
        clearTourMocks(queryClient);
        return { ...s, isActive: false, awaitingInteraction: false };
      }
      return { ...s, currentStepIndex: nextIdx, awaitingInteraction: false };
    });
  }, [clearTimers, queryClient]);

  const previous = useCallback(() => {
    clearTimers();
    setState((s) => ({
      ...s,
      currentStepIndex: Math.max(0, s.currentStepIndex - 1),
      awaitingInteraction: false,
    }));
  }, [clearTimers]);

  const skip = useCallback(() => {
    completeAndStop();
  }, [completeAndStop]);

  const start = useCallback(
    (opts?: { fromStepIndex?: number }) => {
      if (!isProduction) return;
      const steps = buildTourSteps({ isLeader });
      injectTourMocks(queryClient);
      setState({
        isActive: true,
        currentStepIndex: opts?.fromStepIndex ?? 0,
        steps,
        playMode: "auto",
        isPaused: false,
        awaitingInteraction: false,
      });
    },
    [isProduction, isLeader, queryClient]
  );

  const setPlayMode = useCallback((mode: TourPlayMode) => {
    setState((s) => ({ ...s, playMode: mode }));
  }, []);

  const togglePlayMode = useCallback(() => {
    setState((s) => ({ ...s, playMode: s.playMode === "auto" ? "manual" : "auto" }));
  }, []);

  const registerTarget = useCallback((id: string, rect: TourTargetRect) => {
    targetsRef.current.set(id, rect);
    triggerRerender();
  }, [triggerRerender]);

  const unregisterTarget = useCallback((id: string) => {
    targetsRef.current.delete(id);
    triggerRerender();
  }, [triggerRerender]);

  const notifyInteraction = useCallback(
    (targetId: string) => {
      setState((s) => {
        if (!s.isActive) return s;
        const step = s.steps[s.currentStepIndex];
        if (!step || step.mode !== "interactive" || step.targetId !== targetId) return s;
        return { ...s, awaitingInteraction: false };
      });
      // small delay so user sees their tap before advancing
      setTimeout(() => next(), 250);
    },
    [next]
  );

  const resetCompletion = useCallback(async () => {
    await tourStorage.reset();
  }, []);

  const currentStep: TourStep | null = state.isActive
    ? state.steps[state.currentStepIndex] ?? null
    : null;

  const currentTargetRect = currentStep?.targetId
    ? targetsRef.current.get(currentStep.targetId) ?? null
    : null;

  // Navigate when current step changes and we're on a different screen
  useEffect(() => {
    if (!state.isActive || !currentStep) return;
    if (pathname === currentStep.screen) return;
    if (pendingNavTimer.current) clearTimeout(pendingNavTimer.current);
    pendingNavTimer.current = setTimeout(() => {
      try {
        router.push(currentStep.screen as any);
      } catch {}
    }, 150);
  }, [state.isActive, state.currentStepIndex, currentStep, pathname, router]);

  // Auto-advance when in auto mode and current step is on the right screen
  useEffect(() => {
    if (!state.isActive || !currentStep) return;
    if (pathname !== currentStep.screen) return;
    if (state.playMode !== "auto") return;
    if (currentStep.mode === "interactive") {
      setState((s) => (s.awaitingInteraction ? s : { ...s, awaitingInteraction: true }));
      return;
    }
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => {
      next();
    }, currentStep.autoAdvanceMs ?? 4500);
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = null;
      }
    };
  }, [state.isActive, state.currentStepIndex, state.playMode, pathname, currentStep, next]);

  // For interactive steps, mark awaiting on landing
  useEffect(() => {
    if (!state.isActive || !currentStep) return;
    if (currentStep.mode === "interactive" && pathname === currentStep.screen) {
      setState((s) => (s.awaitingInteraction ? s : { ...s, awaitingInteraction: true }));
    }
  }, [state.isActive, state.currentStepIndex, currentStep, pathname]);

  useEffect(() => {
    return () => {
      clearTimers();
      clearTourMocks(queryClient);
    };
  }, [clearTimers, queryClient]);

  const value = useMemo<TourContextValue>(
    () => ({
      ...state,
      currentStep,
      totalSteps: state.steps.length,
      currentTargetRect,
      start,
      stop,
      next,
      previous,
      skip,
      togglePlayMode,
      setPlayMode,
      registerTarget,
      unregisterTarget,
      notifyInteraction,
      resetCompletion,
    }),
    [
      state,
      currentStep,
      currentTargetRect,
      start,
      stop,
      next,
      previous,
      skip,
      togglePlayMode,
      setPlayMode,
      registerTarget,
      unregisterTarget,
      notifyInteraction,
      resetCompletion,
    ]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
