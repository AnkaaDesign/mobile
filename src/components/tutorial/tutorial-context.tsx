import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/contexts/favorites-context";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { isTutorialRuntimeActive } from "./tutorial-runtime-state";
import { tutorialStorage } from "./tutorial-storage";
import type {
  TutorialActionType,
  TutorialContextValue,
  TutorialPhase,
  TutorialProviderProps,
  TutorialState,
  TutorialStep,
  TutorialTargetRect,
  TutorialUserContext,
} from "./types";

const TutorialContext = createContext<TutorialContextValue | null>(null);

const tlog = (msg: string, ...args: any[]) => {
  if (__DEV__) console.log(`[tutorial] ${msg}`, ...args);
};

/**
 * Central timing config. All step transition delays, spotlight cross-fades,
 * fallback timers and re-measure schedules live here so a single edit retunes
 * the entire engine. Old code had ~9 hardcoded `setTimeout` values scattered
 * across 4 files; in aggregate they made a single step transition take up to
 * 2.2 seconds. These values target ≤300ms end-to-end.
 */
export const TUTORIAL_TIMINGS = {
  /** Cutout opacity fade-out before swapping to the new target's rect. */
  spotlightFadeOut: 120,
  /** Cutout opacity fade-in after the new target's rect lands. */
  spotlightFadeIn: 160,
  /** Tooltip content cross-fade between steps. */
  tooltipCrossFade: 180,
  /** Delay before invoking the drawer-open bridge — gives the route a frame to mount. */
  drawerOpenDelay: 60,
  /** Time after which a never-measured target falls back to a centred tooltip.
   *  Long enough to ride out a cross-route push: expo-router takes a few
   *  hundred ms to unmount the old screen + mount the new one, and the
   *  destination's `useTutorialTarget` can't fire `onLayout` until the View
   *  is laid out. 500ms was too aggressive — the fallback fired before the
   *  target ever had a chance to register, leaving interactive steps with
   *  no spotlight (and the showcase fallback tooltip is fine, but a tap
   *  step needs the spotlight to be useful). 1200ms covers slow screens
   *  while still rescuing genuinely-stuck users in well under 2s. */
  fallbackAfter: 1200,
  /** Re-measure schedule after a step change for the active target only. */
  remeasureActive: 60,
  /** Settle delay after an animated scroll before re-measuring. */
  postScrollRemeasure: 280,
  /** Pulse animation half-cycle on interactive targets. */
  pulseHalf: 600,
  /**
   * SG2: time before an interactive step surfaces a manual-advance link.
   * Long enough that a normal user finishes reading + tapping; short
   * enough to rescue stuck users. Earlier value (5s) fired while users
   * were still reading the description on screens with longer copy.
   */
  interactiveStuckAfter: 8000,
} as const;

/**
 * expo-router's `usePathname()` strips group segments like `(tabs)` from the
 * URL, while our ROUTES constants include them. Normalize both sides before
 * comparing so step navigation doesn't trigger redundant pushes.
 *
 * Also drops the trailing `/listar` (list pages live at e.g.
 * `/producao/cronograma/listar`, but `cronograma/index.tsx` redirects to it
 * — so a step that declares `screen: "/producao/cronograma"` is on the same
 * page as a user whose live pathname is `/producao/cronograma/listar`).
 * Without this canonicalisation the engine would think it needs to re-push,
 * triggering a redirect round-trip that re-mounts the route AND clears all
 * registered tutorial target rects — the user then waits the full fallback
 * window (and possibly longer) before any tooltip surfaces.
 */
function normalizeRoute(path: string | undefined | null): string {
  if (!path) return "";
  const stripped = path.replace(/\/\([^)]+\)/g, "") || "/";
  return stripped.replace(/\/listar$/, "") || "/";
}

function rectsAreEqual(
  a: TutorialTargetRect | null,
  b: TutorialTargetRect | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
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

/** Lazy-loaded modules cached after first start so subsequent starts are sync. */
type StepsModule = typeof import("./tutorial-steps");
type MocksModule = typeof import("./tutorial-mocks");
let cachedStepsModule: StepsModule | null = null;
let cachedMocksModule: MocksModule | null = null;

async function loadStepsModule(): Promise<StepsModule> {
  if (cachedStepsModule) return cachedStepsModule;
  cachedStepsModule = await import("./tutorial-steps");
  return cachedStepsModule;
}

async function loadMocksModule(): Promise<MocksModule> {
  if (cachedMocksModule) return cachedMocksModule;
  cachedMocksModule = await import("./tutorial-mocks");
  return cachedMocksModule;
}

const INITIAL_STATE: TutorialState = {
  isActive: false,
  isPendingStart: false,
  currentStepIndex: 0,
  steps: [],
  completedStepIds: [],
  awaitingAction: false,
  isCelebrating: false,
  phase: "idle",
  activeTargetRect: null,
  interactiveStuck: false,
};

export function TutorialProvider({ children }: TutorialProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { reloadFromStorage: reloadFavorites } = useFavorites();
  // Pulled in so `goToStep` can reset the loading-overlay state when the
  // dev step picker jumps directly to a route. Without this, a destination
  // screen whose `useScreenReady(false)` runs while `isNavigatingRef` is
  // briefly true (from an earlier nav) can latch `overlayClaimedRef.current`
  // and trap the overlay on every subsequent navigation. Held in a ref so
  // the goToStep callback identity stays stable.
  const navLoading = useNavigationLoading();
  const navLoadingRef = useRef(navLoading);
  navLoadingRef.current = navLoading;

  // Stash router in a ref so the step-entry effect doesn't react to it as a
  // dependency. expo-router's `useRouter()` returns a NEW object every
  // render, which used to retrigger the effect on every render → setState
  // → new state object → new render → effect → INFINITE.
  const routerRef = useRef(router);
  routerRef.current = router;
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const [state, setState] = useState<TutorialState>(INITIAL_STATE);

  // Refs that don't drive the spotlight directly. `targetsRef` is a CACHE for
  // cross-step lookups (same-screen transitions can re-use an already-measured
  // rect without waiting for re-registration). The spotlight is driven off
  // `state.activeTargetRect`, NOT off this ref.
  const targetsRef = useRef<Map<string, TutorialTargetRect>>(new Map());
  const actionsRef = useRef<Map<string, () => void>>(new Map());
  const openDrawerCallbackRef = useRef<(() => void) | null>(null);
  const closeDrawerCallbackRef = useRef<(() => void) | null>(null);
  // `currentStepRef` mirrors state for use inside callbacks (avoids stale closure).
  const currentStepRef = useRef<TutorialStep | null>(null);

  const [measureTick, setMeasureTick] = useState(0);
  const pendingMeasureBumpRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bumpMeasureTick = useCallback(() => {
    if (pendingMeasureBumpRef.current) return;
    pendingMeasureBumpRef.current = setTimeout(() => {
      pendingMeasureBumpRef.current = null;
      setMeasureTick((n) => n + 1);
    }, 50);
  }, []);

  const registerOpenDrawerCallback = useCallback(
    (fn: (() => void) | null) => {
      openDrawerCallbackRef.current = fn;
    },
    [],
  );

  const registerCloseDrawerCallback = useCallback(
    (fn: (() => void) | null) => {
      closeDrawerCallbackRef.current = fn;
    },
    [],
  );

  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stuckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    [autoAdvanceTimer, navTimer, drawerTimer, fallbackTimer, stuckTimer].forEach((t) => {
      if (t.current) {
        clearTimeout(t.current);
        t.current = null;
      }
    });
  }, []);

  const stop = useCallback(async () => {
    clearTimers();
    setState((s) => ({
      ...s,
      isActive: false,
      isPendingStart: false,
      awaitingAction: false,
      isCelebrating: false,
      phase: "idle",
      activeTargetRect: null,
    }));
    targetsRef.current.clear();
    cachedMocksModule?.clearTutorialMocks(queryClient);
  }, [clearTimers, queryClient]);

  const setPendingStart = useCallback((pending: boolean) => {
    setState((s) =>
      s.isPendingStart === pending ? s : { ...s, isPendingStart: pending },
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

  const goToStep = useCallback((index: number) => {
    tlog(`goToStep → ${index}`);
    clearTimers();
    // Self-heal the tutorial runtime state if Fast Refresh / hot reload
    // wiped it (the `active` flag and records map live in module scope on
    // `tutorial-runtime-state.ts`, which re-evaluates independently of
    // React state). Without this, the dev step picker takes the user to a
    // page that hits the REAL API — getMyCalculations 404s, isLoading
    // stays true, `useScreenReady(false)` latches the loading overlay,
    // and the next nav.push appears to "infinitely load".
    if (cachedMocksModule && !isTutorialRuntimeActive()) {
      try {
        cachedMocksModule.injectTutorialMocks(queryClient, user);
      } catch {}
    }
    // Wipe the navigation-loading overlay state up-front. The dev step picker
    // pushes a route directly (NOT through `pushWithLoading`), and the
    // destination screen's `useScreenReady(false)` would otherwise call
    // `claimOverlay()` while `isNavigatingRef.current` happens to be true
    // from any in-flight navigation. That claim then survives the
    // subsequent `pushWithLoading` because `useFocusEffect` re-fires
    // `claimOverlay()` on focus, and the overlay traps every nav after
    // the jump. Resetting first guarantees `isNavigatingRef.current` is
    // false when the destination screen mounts, so any `claimOverlay()`
    // call is a no-op.
    try {
      navLoadingRef.current.endNavigation();
    } catch {}
    // Read state synchronously via a single setState to validate the jump and
    // resolve a fallback route in one pass. The router push happens OUTSIDE
    // the updater so React's potential double-invocation never triggers two
    // navigations.
    let routeToPush: string | undefined;
    setState((s) => {
      if (!s.isActive) return s;
      if (index < 0 || index >= s.steps.length) return s;
      if (index === s.currentStepIndex) return s;

      // If the target step declares its own route, the step-entry effect will
      // navigate to it after this state update lands — leave it alone here to
      // avoid pushing the same route twice. Only walk BACK through preceding
      // steps to find a fallback when the target step has no route of its
      // own (continuation steps that inherit their page from a previous tap).
      const targetStep = s.steps[index];
      const targetHasRoute = !!(
        targetStep?.navigateOnEnter ?? targetStep?.screen
      );
      if (!targetHasRoute) {
        for (let i = index - 1; i >= 0; i--) {
          const candidate = s.steps[i];
          const route = candidate?.navigateOnEnter ?? candidate?.screen;
          if (route) {
            routeToPush = route;
            break;
          }
        }
      }

      return {
        ...s,
        currentStepIndex: index,
        awaitingAction: false,
        isCelebrating: false,
        activeTargetRect: null,
        phase: "navigating",
        interactiveStuck: false,
      };
    });
    if (
      routeToPush &&
      normalizeRoute(pathnameRef.current) !== normalizeRoute(routeToPush)
    ) {
      tlog(`goToStep push route=${routeToPush} from=${pathnameRef.current}`);
      try {
        routerRef.current.push(routeToPush as any);
      } catch (e) {
        tlog(`goToStep push EXCEPTION`, e);
      }
    }
  }, [clearTimers]);

  const next = useCallback(() => {
    tlog(`next() called`);
    clearTimers();
    haptic("light");
    // Mirror goToStep's defensive cleanup of the navigation-loading overlay
    // state. Without this, a `claimOverlay()` from a previous screen's
    // useScreenReady can survive a cross-route step transition and trap the
    // user behind the dim overlay forever, with no tutorial UI surfacing.
    try {
      navLoadingRef.current.endNavigation();
    } catch {}
    setState((s) => {
      const currentStep = s.steps[s.currentStepIndex];
      const nextIndex = s.currentStepIndex + 1;
      const completedStepIds = currentStep
        ? Array.from(new Set([...s.completedStepIds, currentStep.id]))
        : s.completedStepIds;

      if (nextIndex >= s.steps.length) {
        if (user?.id) tutorialStorage.markCompleted(user.id).catch(() => {});
        cachedMocksModule?.clearTutorialMocks(queryClient);
        return {
          ...INITIAL_STATE,
          completedStepIds,
        };
      }

      // Clear the spotlight rect on step change. The next step's effect will
      // either pick up a cached rect (same-screen transition) or wait for the
      // target to register (cross-screen transition). This guarantees no
      // "previous step's rect lingers under the new step's tooltip" bug.
      return {
        ...s,
        currentStepIndex: nextIndex,
        awaitingAction: false,
        isCelebrating: false,
        completedStepIds,
        activeTargetRect: null,
        phase: "navigating",
        interactiveStuck: false,
      };
    });
  }, [clearTimers, queryClient, user?.id]);

  const start = useCallback(
    async (opts?: { fromStepIndex?: number }) => {
      // Lazy-load both modules. After the first start they're cached so
      // re-running the tutorial is synchronous. Saves ~35KB JS parse on the
      // app cold-start for users who never run the tutorial.
      const [stepsModule, mocksModule] = await Promise.all([
        loadStepsModule(),
        loadMocksModule(),
      ]);

      const ctx: TutorialUserContext = {
        user,
        isLeader: !!user?.ledSector?.id,
        isBonifiable:
          !!user?.position?.bonifiable && user?.status === "EFFECTED",
      };
      const allSteps = stepsModule.buildTutorialSteps(ctx);
      // Filter the leader-only steps when not a leader (or any other
      // conditional steps a step author marks).
      const steps = allSteps.filter((s) => !s.condition || s.condition(ctx));

      mocksModule.injectTutorialMocks(queryClient, user);
      haptic("medium");
      setState({
        ...INITIAL_STATE,
        isActive: true,
        currentStepIndex: opts?.fromStepIndex ?? 0,
        steps,
        phase: "navigating",
      });
    },
    [queryClient, user],
  );

  const reset = useCallback(async () => {
    if (user?.id) await tutorialStorage.reset(user.id);
  }, [user?.id]);

  // Register: the cache is always updated. State (activeTargetRect) is only
  // updated when the registered id is the active step's target — that's the
  // ONLY trigger for a re-render, eliminating the old forceTick storm where
  // every register call re-rendered the whole provider subtree (140+ consumers).
  const registerTarget = useCallback(
    (id: string, rect: TutorialTargetRect) => {
      const existing = targetsRef.current.get(id);
      const sameRect = !!existing && rectsAreEqual(existing, rect);
      if (!sameRect) {
        targetsRef.current.set(id, rect);
      }

      // CRITICAL: we MUST NOT early-return on `sameRect` when this id matches
      // the active step's target. A screen kept mounted across step
      // transitions (React Navigation tab cache) re-fires `measure` on each
      // measureTick bump, but the rect is unchanged from its previous
      // registration. The earlier short-circuit then skipped the React
      // setState that flips phase: "waiting" → "active", leaving the engine
      // stuck in `waiting` until the 1200ms fallback fired with no
      // spotlight — exactly the "Toque em Ajustar" bug from the logs.
      const activeId = currentStepRef.current?.targetId;
      const isActive = activeId === id;
      tlog(`registerTarget id=${id} activeStepTarget=${activeId} isActive=${isActive} sameRect=${sameRect}`);
      if (!isActive) return;
      setState((s) => {
        const sameInState = rectsAreEqual(s.activeTargetRect, rect) && s.phase === "active";
        if (sameInState) {
          tlog(`registerTarget setState NOOP id=${id} (rect+phase already match)`);
          return s;
        }
        tlog(`registerTarget setState APPLY id=${id} prevPhase=${s.phase} → active`);
        return { ...s, activeTargetRect: rect, phase: "active" };
      });
    },
    [],
  );

  const unregisterTarget = useCallback((id: string) => {
    if (!targetsRef.current.has(id)) return;
    targetsRef.current.delete(id);
    // If the active target is the one being unregistered, drop it from state
    // and re-arm the fallback + stuck timers so the user isn't left in
    // limbo (waiting phase with no tooltip, no escape). Without re-arming,
    // a target that unmounts mid-step is a permanent soft-trap.
    const liveStep = currentStepRef.current;
    tlog(`unregisterTarget id=${id} liveStepTarget=${liveStep?.targetId} isLive=${liveStep?.targetId === id}`);
    if (!liveStep || liveStep.targetId !== id) return;
    // Always transition to waiting + clear rect. The previous guard
    // (`s.activeTargetRect == null ? s : ...`) skipped the phase update
    // when the rect was already null — leaving the engine stuck in
    // `navigating` (no tooltip visible) with the fallback timer never
    // advancing it, since the inner `s.phase === "waiting"` check fails.
    setState((s) =>
      s.activeTargetRect == null && s.phase === "waiting"
        ? s
        : { ...s, activeTargetRect: null, phase: "waiting" },
    );
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    fallbackTimer.current = setTimeout(() => {
      if (currentStepRef.current?.id !== liveStep.id) return;
      setState((s) => (s.phase === "waiting" ? { ...s, phase: "fallback" } : s));
    }, TUTORIAL_TIMINGS.fallbackAfter);
    if (liveStep.kind === "interactive") {
      if (stuckTimer.current) clearTimeout(stuckTimer.current);
      stuckTimer.current = setTimeout(() => {
        if (currentStepRef.current?.id !== liveStep.id) return;
        setState((s) =>
          s.interactiveStuck ? s : { ...s, interactiveStuck: true },
        );
      }, TUTORIAL_TIMINGS.interactiveStuckAfter);
    }
  }, []);

  const registerAction = useCallback((id: string, fn: () => void) => {
    actionsRef.current.set(id, fn);
  }, []);

  const unregisterAction = useCallback((id: string) => {
    actionsRef.current.delete(id);
  }, []);

  const invokeTargetAction = useCallback((id: string) => {
    const fn = actionsRef.current.get(id);
    tlog(`invokeTargetAction id=${id} found=${!!fn} actions=`, Array.from(actionsRef.current.keys()));
    if (!fn) return;
    // CRITICAL: clear the navigation-loading ref BEFORE invoking the
    // registered action. The action is typically `nav.push(...)` which
    // calls `pushWithLoading` → `navigateWithLoading`. That function
    // early-returns if `isNavigatingRef.current` is true. In tutorial
    // mode the ref can latch true (because the overlay's visual is
    // bypassed but the ref still flips on `showOverlay()`) and never
    // clear — so subsequent `nav.push`es from spotlight taps silently
    // drop, leaving the user with a dim screen, no navigation, and the
    // tutorial advancing past a step whose target was never reached.
    try {
      navLoadingRef.current.endNavigation();
    } catch {}
    try {
      fn();
    } catch (e) {
      tlog(`invokeTargetAction EXCEPTION id=${id}`, e);
    }
  }, []);

  const notifyAction = useCallback(
    (
      action: TutorialActionType,
      payload?: { targetId?: string; eventId?: string },
    ) => {
      // React 18 batches setState calls and runs updater functions during
      // the render phase, not synchronously inside the event handler. A
      // flag set inside a setState updater and read immediately after is
      // ALWAYS false — that's why every interactive step looked stuck on
      // tap (the underlying check matched, awaitingAction was cleared in
      // the updater, but the `if (shouldAdvance) next()` after it read
      // the pre-update flag and skipped the advance).
      //
      // Fix: do the matching decision OUTSIDE setState by reading the
      // current step from a ref (kept in sync via useEffect). Then call
      // next() unconditionally if the action matches — next() handles
      // the state update for currentStepIndex + awaitingAction itself.
      const step = currentStepRef.current;
      tlog(`notifyAction action=${action} payload=`, payload, `stepId=${step?.id} expected=${step?.expectedAction} stepTarget=${step?.targetId}`);
      if (!step || step.kind !== "interactive") return;
      if (step.expectedAction !== action) return;
      if (
        (action === "tap" || action === "drawer-open") &&
        step.targetId &&
        payload?.targetId &&
        step.targetId !== payload.targetId
      ) {
        return;
      }
      if (
        (action === "input" || action === "submit") &&
        step.expectedEventId &&
        payload?.eventId !== step.expectedEventId
      ) {
        return;
      }
      haptic("light");
      const fromStepId = step.id;
      next();
      // Dev-mode invariant: after notifyAction matches, the engine MUST
      // advance within one frame. If it doesn't, we've reintroduced the
      // React-18 batching bug (or a regression of the same shape) and
      // need to find out fast. Logs a loud warning instead of silently
      // trapping the user.
      if (__DEV__) {
        setTimeout(() => {
          if (currentStepRef.current?.id === fromStepId) {
            // eslint-disable-next-line no-console
            console.warn(
              `[tutorial] notifyAction(${action}, targetId=${payload?.targetId}) matched step "${fromStepId}" but the step did not advance within 32ms — check next()/setState ordering and React 18 batching.`,
            );
          }
        }, 32);
      }
    },
    [next],
  );

  // ─── Active step derivation ──────────────────────────────────────────────
  const currentStep: TutorialStep | null = useMemo(
    () =>
      state.isActive ? state.steps[state.currentStepIndex] ?? null : null,
    [state.isActive, state.currentStepIndex, state.steps],
  );

  // useLayoutEffect (not useEffect) so the ref leads commit instead of
  // trailing it. Without this, registerTarget callbacks fired during the
  // same commit as a step transition would see the previous step's
  // targetId and silently drop the new measurement.
  useLayoutEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // ─── Step entry effect ───────────────────────────────────────────────────
  // Single orchestrator that runs whenever the active step changes. Handles:
  //   1. Route navigation (navigateOnEnter / screen)
  //   2. Drawer-open bridge
  //   3. Picking up a cached rect for same-screen transitions
  //   4. Setting phase=waiting until target registers
  //   5. Scheduling the fallback timeout for unreachable targets
  //   6. Flipping awaitingAction for interactive steps
  // Effect 1 — step-entry side effects (nav, drawer, timers, awaitingAction).
  // Runs ONLY when the active step itself changes. Pathname is intentionally
  // excluded from deps (handled by Effect 2). setState calls use functional
  // updates that no-op when the resulting state is identity-equal — this
  // prevents the "always-new-state-object → re-render → effect-runs-again"
  // cascade that produced Maximum-update-depth crashes.
  useEffect(() => {
    if (!state.isActive || !currentStep) return;
    tlog(`step-entry id=${currentStep.id} idx=${state.currentStepIndex} target=${currentStep.targetId} screen=${currentStep.screen} navigateOnEnter=${currentStep.navigateOnEnter} pathname=${pathnameRef.current}`);

    // Same self-heal as goToStep: if the runtime-state module was wiped by
    // Fast Refresh, re-inject before the step's screen-mounted code can
    // hit a real API. This effect re-runs on every step entry, so it's
    // also a steady recovery point during a long tutorial session.
    if (cachedMocksModule && !isTutorialRuntimeActive()) {
      try {
        cachedMocksModule.injectTutorialMocks(queryClient, user);
      } catch {}
    }

    clearTimers();

    // 1. Route push. Two competing concerns:
    //   (a) when the previous step's spotlight onAction used `pushWithLoading`,
    //       the real `router.push` is queued on a RAF — we run this effect
    //       BEFORE that frame fires, so a synchronous push here would stack
    //       the destination twice and corrupt back-navigation history.
    //   (b) when there's no in-flight nav (the dev step picker, drawer-open
    //       steps, or any narration that didn't tap a card), we MUST push
    //       or the tutorial sits on the wrong screen waiting for a target
    //       that isn't mounted.
    // Reconciling both: defer the push by one RAF, then re-check the live
    // pathname. The in-flight RAF push (if any) lands first and updates
    // pathname; if pathname already matches the target, we skip; otherwise
    // we push. This is dedup-safe AND never strands the user.
    const targetRoute = currentStep.navigateOnEnter ?? currentStep.screen;
    const needsNav =
      !!targetRoute &&
      normalizeRoute(pathnameRef.current) !== normalizeRoute(targetRoute);
    if (needsNav) {
      tlog(`step-entry needsNav target=${targetRoute} current=${pathnameRef.current}`);
      // Defer by one RAF: an in-flight `pushWithLoading` from the prior
      // step's onAction also defers via RAF, and pushing here synchronously
      // would stack the destination twice. After the deferred frame we
      // re-check the live pathname — push only if still wrong.
      requestAnimationFrame(() => {
        if (
          currentStepRef.current?.id !== currentStep.id ||
          !state.isActive
        ) {
          tlog(`step-entry RAF abort (step changed or inactive)`);
          return;
        }
        if (
          normalizeRoute(pathnameRef.current) !==
          normalizeRoute(targetRoute as string)
        ) {
          tlog(`step-entry RAF push target=${targetRoute} from=${pathnameRef.current}`);
          try {
            routerRef.current.push(targetRoute as any);
          } catch (e) {
            tlog(`step-entry RAF push EXCEPTION`, e);
          }
        } else {
          tlog(`step-entry RAF skip (pathname already matches)`);
        }
      });
    }

    // 2. Drawer
    if (currentStep.openDrawerOnEnter) {
      drawerTimer.current = setTimeout(() => {
        try {
          openDrawerCallbackRef.current?.();
        } catch {}
      }, TUTORIAL_TIMINGS.drawerOpenDelay);
    } else if (currentStep.closeDrawerOnEnter) {
      // Dismiss any open drawer (e.g. the notifications panel that
      // remained open after the notifications block) so the next target
      // — typically the chrome header — is visible and tappable.
      try {
        closeDrawerCallbackRef.current?.();
      } catch {}
    }

    // 3+4. Resolve the spotlight rect — guarded setState so we don't churn.
    if (currentStep.targetId) {
      const cached = targetsRef.current.get(currentStep.targetId) ?? null;
      tlog(`step-entry resolveTarget id=${currentStep.targetId} cached=${!!cached} needsNav=${needsNav}`);
      if (cached) {
        // Use the cached rect optimistically — even when crossing routes.
        // The new screen's `registerTarget` call (fired by the target's
        // onLayout or the re-measure effect on the active target) will
        // overwrite this rect with the fresh measurement. If the target
        // never re-registers (e.g. because the screen layout shifted),
        // the cached rect is still a far better fallback than a dim
        // screen with no spotlight for 1200ms+.
        //
        // ALSO schedule the fallback timer in case the optimistic rect
        // ends up wrong AND no fresh measure comes — phase will only
        // transition to "fallback" if it's still "waiting" by then, so
        // an in-flight `registerTarget` that lands first wins.
        setState((s) =>
          s.activeTargetRect === cached && s.phase === "active"
            ? s
            : { ...s, activeTargetRect: cached, phase: "active" },
        );
      } else {
        setState((s) =>
          s.activeTargetRect == null && s.phase === "waiting"
            ? s
            : { ...s, activeTargetRect: null, phase: "waiting" },
        );
        fallbackTimer.current = setTimeout(() => {
          if (currentStepRef.current?.id !== currentStep.id) {
            tlog(`fallback fire ABORT (step changed)`);
            return;
          }
          tlog(`fallback fire → phase=fallback (target ${currentStep.targetId} never registered)`);
          setState((s) => (s.phase === "waiting" ? { ...s, phase: "fallback" } : s));
        }, TUTORIAL_TIMINGS.fallbackAfter);
      }
    } else {
      setState((s) =>
        s.activeTargetRect == null && s.phase === "active"
          ? s
          : { ...s, activeTargetRect: null, phase: "active" },
      );
    }

    // 5. Interactive flag + SG2 stuck timer
    if (currentStep.kind === "interactive") {
      setState((s) => (s.awaitingAction ? s : { ...s, awaitingAction: true }));
      stuckTimer.current = setTimeout(() => {
        if (currentStepRef.current?.id !== currentStep.id) return;
        setState((s) =>
          s.interactiveStuck ? s : { ...s, interactiveStuck: true },
        );
      }, TUTORIAL_TIMINGS.interactiveStuckAfter);
    }

    // 6. autoAdvanceMs (legacy showcase auto-advance — opt-in per step)
    if (
      currentStep.kind === "showcase" &&
      typeof currentStep.autoAdvanceMs === "number" &&
      currentStep.autoAdvanceMs > 0
    ) {
      const ms = currentStep.autoAdvanceMs;
      autoAdvanceTimer.current = setTimeout(() => next(), ms);
    }
    // 7. Kick the per-target hooks to re-measure. Critical when the dev step
    // picker jumps mid-flow and the destination screen was already mounted
    // (e.g. user navigated back to it manually) — without a measure bump,
    // hooks whose `isActiveTarget` was already true don't re-fire their
    // measure effect, so the spotlight pins to the previous step's rect (or
    // never resolves). Escalating attempts cover slow re-renders and
    // late-mount cases (a cross-route push can take 800-1000ms before the
    // destination's `useTutorialTarget` first runs) without spamming
    // measureInWindow.
    setTimeout(() => bumpMeasureTick(), 80);
    setTimeout(() => bumpMeasureTick(), 320);
    setTimeout(() => bumpMeasureTick(), 700);
    setTimeout(() => bumpMeasureTick(), 1500);
    // pathname / router / clearTimers / next intentionally NOT in deps:
    // pathname is read via ref above; router via refs; clearTimers and next
    // are stable useCallbacks. Including them caused this effect to run on
    // every render (because expo-router's useRouter returns a fresh object
    // each render) which produced the Maximum-update-depth crash.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isActive, state.currentStepIndex, currentStep]);

  // Drawer-open / drawer-close detection. Reads currentStepRef.current
  // (NOT the captured currentStep) so a fast drawer animation that fires
  // "state" events across a step transition matches against the CURRENT
  // step, not the previous one.
  const lastDrawerOpenRef = useRef<boolean>(false);
  useEffect(() => {
    if (!state.isActive) return;
    const unsubscribe = navigation.addListener?.("state", () => {
      const liveStep = currentStepRef.current;
      if (!liveStep) return;
      const navState = navigation.getState?.();
      const isDrawerOpen = (navState as any)?.history?.some?.(
        (h: any) => h?.type === "drawer",
      );
      const wasOpen = lastDrawerOpenRef.current;
      lastDrawerOpenRef.current = !!isDrawerOpen;
      if (liveStep.expectedAction === "drawer-open" && isDrawerOpen) {
        notifyAction("drawer-open", { targetId: liveStep.targetId });
        return;
      }
      if (
        liveStep.expectedAction === "drawer-close" &&
        wasOpen &&
        !isDrawerOpen
      ) {
        notifyAction("drawer-close", { targetId: liveStep.targetId });
      }
    });
    return () => {
      try {
        unsubscribe?.();
      } catch {}
    };
  }, [state.isActive, navigation, notifyAction]);

  // SG3 — Route-change auto-advance. Baseline pathname captured ONCE per
  // step change. Previously `pathname` was in the deps array, which meant
  // the baseline updated on every navigation — including the navigation
  // we wanted to detect — defeating the auto-advance entirely.
  //
  // SETTLE WINDOW: The previous step's onAction often chains a navigation
  // (e.g. an Alert's "OK" handler calling nav.goBack) that fires AFTER the
  // notifyAction("tap") that already advanced us into this step. Without
  // a settle window, the leftover pathname change would trigger SG3 here
  // and cascade-skip this step too. We therefore gate SG3 by a `settledRef`
  // that flips true ~700ms after step entry. Genuine user taps (which take
  // longer than 700ms after step entry to read the tooltip + locate the
  // target) still trigger SG3 normally; cascading transitions don't.
  const stepEntryPathnameRef = useRef<string>("");
  const sg3SettledRef = useRef<boolean>(false);
  const sg3SettleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!state.isActive || !currentStep) return;
    if (currentStep.kind !== "interactive") return;
    if (currentStep.expectedAction !== "tap") return;
    stepEntryPathnameRef.current = normalizeRoute(pathname);
    sg3SettledRef.current = false;
    if (sg3SettleTimer.current) clearTimeout(sg3SettleTimer.current);
    sg3SettleTimer.current = setTimeout(() => {
      sg3SettledRef.current = true;
    }, 700);
    return () => {
      if (sg3SettleTimer.current) clearTimeout(sg3SettleTimer.current);
    };
    // Intentionally omit `pathname` from deps: we want the baseline frozen
    // at step entry, then compared to live pathname in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isActive, state.currentStepIndex, currentStep]);

  useEffect(() => {
    if (!state.isActive || !currentStep) return;
    if (!state.awaitingAction) return;
    if (currentStep.kind !== "interactive") return;
    if (currentStep.expectedAction !== "tap") return;
    // Settle gate: skip until the post-entry navigation chain has had time
    // to flush. Otherwise the previous step's onAction Alert-then-goBack
    // would auto-skip this step.
    if (!sg3SettledRef.current) return;
    const baseline = stepEntryPathnameRef.current;
    const current = normalizeRoute(pathname);
    if (baseline && current !== baseline) {
      // Side effect observed: forward-advance the tutorial regardless of
      // whether the screen's onPress chained through.
      notifyAction("tap", { targetId: currentStep.targetId });
    }
  }, [state.isActive, state.awaitingAction, currentStep, pathname, notifyAction]);

  // Favorites repaint on tutorial start/stop.
  useEffect(() => {
    const handle = setTimeout(() => reloadFavorites().catch(() => {}), 200);
    return () => clearTimeout(handle);
  }, [state.isActive, reloadFavorites]);

  // Unmount cleanup.
  useEffect(() => {
    return () => {
      clearTimers();
      cachedMocksModule?.clearTutorialMocks(queryClient);
    };
  }, [clearTimers, queryClient]);

  const currentTargetRect = state.activeTargetRect;

  const value = useMemo<TutorialContextValue>(
    () => ({
      ...state,
      currentStep,
      totalSteps: state.steps.length,
      currentTargetRect,
      start,
      stop,
      next,
      goToStep,
      skip,
      complete,
      reset,
      setPendingStart,
      registerTarget,
      unregisterTarget,
      registerAction,
      unregisterAction,
      invokeTargetAction,
      notifyAction,
      registerOpenDrawerCallback,
      registerCloseDrawerCallback,
      measureTick,
      bumpMeasureTick,
    }),
    [
      state,
      currentStep,
      currentTargetRect,
      start,
      stop,
      next,
      goToStep,
      skip,
      complete,
      reset,
      setPendingStart,
      registerTarget,
      unregisterTarget,
      registerAction,
      unregisterAction,
      invokeTargetAction,
      notifyAction,
      registerOpenDrawerCallback,
      registerCloseDrawerCallback,
      measureTick,
      bumpMeasureTick,
    ],
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function openDrawerFromTutorial(navigation: any) {
  try {
    navigation.dispatch(DrawerActions.openDrawer());
  } catch {}
}
