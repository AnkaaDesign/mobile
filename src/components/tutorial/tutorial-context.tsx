import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
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
import {
  bumpMeasureTickStore,
  getActiveTargetId as getStoreActiveTargetId,
  getActiveTargetRect as getStoreActiveTargetRect,
  resetTutorialStore,
  setActiveTargetId,
  setActiveTargetRect as setStoreActiveTargetRect,
} from "./tutorial-store";
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

/**
 * Split contexts. The provider used to ship one giant value memo whose
 * identity changed on every state mutation — re-rendering all 39 consumer
 * files and all 140+ target hooks ~7 times per step transition.
 *
 *   - `TutorialActionsContext` — stable callbacks. Identity changes only
 *     when `user.id` changes. Consumers reading actions never re-render
 *     on phase/rect/awaitingAction churn.
 *   - `TutorialStateContext` — full state for the overlay + tooltip. The
 *     overlay is the ONLY consumer that needs to react to every state
 *     mutation. Wrapping the heavy paint surface here means the 39 screen
 *     files don't pay for state churn.
 *
 * Per-target re-renders use the external store in `tutorial-store.ts` so
 * only the 2 affected hooks (the one becoming active, the one leaving)
 * re-render per step instead of all 140.
 */
interface TutorialActionsValue {
  start: (opts?: { fromStepIndex?: number }) => Promise<void>;
  stop: () => Promise<void>;
  next: () => void;
  goToStep: (index: number) => void;
  skip: () => Promise<void>;
  complete: () => Promise<void>;
  reset: () => Promise<void>;
  setPendingStart: (pending: boolean) => void;
  registerTarget: (id: string, rect: TutorialTargetRect) => void;
  unregisterTarget: (id: string) => void;
  registerAction: (id: string, fn: () => void) => void;
  unregisterAction: (id: string) => void;
  invokeTargetAction: (id: string) => void;
  notifyAction: (
    action: TutorialActionType,
    payload?: { targetId?: string; eventId?: string },
  ) => void;
  registerOpenDrawerCallback: (fn: (() => void) | null) => void;
  registerCloseDrawerCallback: (fn: (() => void) | null) => void;
  bumpMeasureTick: () => void;
}

const TutorialActionsContext = createContext<TutorialActionsValue | null>(null);
const TutorialStateContext = createContext<TutorialContextValue | null>(null);

/**
 * Boolean-only context used by the overlay gate. Carries just `isActive`,
 * so when `phase`, `activeTargetRect`, etc. churn the value reference stays
 * `true === true` and React skips the re-render via Object.is. The gate
 * uses this to conditionally MOUNT the overlay subtree (SVG, tooltip,
 * Reanimated values, picker modal) only while the tutorial is running.
 */
const TutorialActiveFlagContext = createContext<boolean>(false);

export function useTutorialIsActive(): boolean {
  return useContext(TutorialActiveFlagContext);
}

/**
 * Verbose logging gate. Off by default — `console.log` calls in the tutorial
 * fire across step entry, register, measure and ghost-layer taps; even in
 * dev they cross the JS bridge to the metro server and can drop FPS by a
 * meaningful amount once the user is inside the tutorial. Flip to true
 * locally when diagnosing a specific tutorial behavior.
 */
const TUTORIAL_VERBOSE = false;
const tlog = TUTORIAL_VERBOSE
  ? (msg: string, ...args: any[]) => {
      if (__DEV__) console.log(`[tutorial] ${msg}`, ...args);
    }
  : (_msg: string, ..._args: any[]) => {};

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

/**
 * Walk forward from step 0 to `targetIndex` and reconstruct the expected
 * navigation stack at the target step. Returns an ordered list of routes
 * — the first is the "base" (replaceable), the rest are pushes.
 *
 * Algorithm:
 *   - Seed with the first step's `screen` (or root).
 *   - For each step from 1..targetIndex:
 *       a) If the previous step has `navigatesTo`, push it (the user's
 *          tap action would have navigated us forward).
 *       b) Else if the previous step has `popsOnAction` and a `tap`
 *          expected action, pop the stack (back button).
 *       c) If the current step has `navigateOnEnter`, push it.
 *       d) Else if the current step has a `screen` that differs from
 *          the current stack top, treat it as an implicit push — keeps
 *          un-annotated steps working as a graceful default.
 *
 * Empty stacks (e.g., the welcome narration with no screen) collapse so
 * the engine just stays on the current route.
 */
function computeNavigationStack(
  steps: TutorialStep[],
  targetIndex: number,
): string[] {
  if (targetIndex < 0 || targetIndex >= steps.length) return [];
  const stack: string[] = [];
  const seed = steps[0]?.navigateOnEnter ?? steps[0]?.screen;
  if (seed) stack.push(seed);

  for (let i = 1; i <= targetIndex; i++) {
    const prev = steps[i - 1];
    const cur = steps[i];
    if (!cur) continue;

    // (a) prior step's tap-to-navigate pushed us forward
    if (prev?.navigatesTo) {
      stack.push(prev.navigatesTo);
    }
    // (b) prior step popped (back button tap, modal dismiss, etc.)
    else if (prev?.popsOnAction && prev?.expectedAction === "tap") {
      if (stack.length > 1) stack.pop();
    }

    // (c) explicit navigation on entry overrides everything
    if (cur.navigateOnEnter) {
      // If the step's navigateOnEnter equals the current top, it's a no-op.
      if (
        stack.length === 0 ||
        stack[stack.length - 1] !== cur.navigateOnEnter
      ) {
        stack.push(cur.navigateOnEnter);
      }
    } else if (cur.screen) {
      // (d) implicit: step lives on a route differing from the stack top.
      // This is the legacy default that keeps un-annotated steps working.
      const top = stack[stack.length - 1];
      if (top !== cur.screen) {
        stack.push(cur.screen);
      }
    }
  }
  return stack;
}

/**
 * Execute the planned navigation chain. Uses `router.replace` for the
 * base route (resetting the stack) then `router.push` for each
 * subsequent route. Pushes are sequenced via RAF chains because
 * expo-router stacks need each route to mount before the next push to
 * preserve back history.
 *
 * If the live pathname already matches the planned stack's tail, this
 * is a no-op — we don't re-push when the user is already where the
 * tutorial expects them.
 */
function replayNavigationStack(
  router: ReturnType<typeof useRouter>,
  stack: string[],
  livePathname: string,
): void {
  if (stack.length === 0) return;
  const target = stack[stack.length - 1];
  // Fast path: if the live pathname already matches the target AND we
  // can't easily verify the rest of the stack, just trust the user is
  // where they should be. Avoids destroying their current back stack
  // for what would have been a no-op jump.
  if (
    stack.length === 1 &&
    normalizeRoute(livePathname) === normalizeRoute(target)
  ) {
    return;
  }
  // Replace the base, then push the remaining routes in order. Each
  // push is sequenced one frame after the previous so expo-router can
  // commit the screen and update its internal navigation state before
  // the next push lands.
  try {
    router.replace(stack[0] as any);
  } catch {}
  if (stack.length === 1) return;

  const pushRest = (i: number) => {
    if (i >= stack.length) return;
    try {
      router.push(stack[i] as any);
    } catch {}
    // 80ms between pushes is enough for the stack screen to mount on
    // mid-range devices; faster than the user can perceive.
    setTimeout(() => pushRest(i + 1), 80);
  };
  setTimeout(() => pushRest(1), 80);
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

/**
 * Full composed value. Re-renders on every state mutation. Only the overlay
 * + tooltip + dev step picker should call this. Screen files that need to
 * register a target should use `useTutorialTarget`, which subscribes to
 * the much narrower actions + per-id external store.
 */
export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialStateContext);
  if (!ctx) throw new Error("useTutorial must be used inside TutorialProvider");
  return ctx;
}

export function useOptionalTutorial(): TutorialContextValue | null {
  return useContext(TutorialStateContext);
}

/**
 * Subscribes only to the stable callback bag. Use this in screen files
 * that need to call `notifyAction`, `registerAction`, etc. without
 * re-rendering on every state mutation.
 */
export function useTutorialActions(): TutorialActionsValue {
  const ctx = useContext(TutorialActionsContext);
  if (!ctx)
    throw new Error("useTutorialActions must be used inside TutorialProvider");
  return ctx;
}

export function useOptionalTutorialActions(): TutorialActionsValue | null {
  return useContext(TutorialActionsContext);
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

  // Measure tick lives in the external store, not React state — so bumping
  // it only re-renders the SINGLE currently-active target hook (via
  // `useSyncExternalStore` in `use-tutorial-target.ts`) instead of every
  // consumer of the tutorial context. The 50ms debounce stays so a burst of
  // bumps in the same frame collapses to one re-measure.
  const pendingMeasureBumpRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bumpMeasureTick = useCallback(() => {
    if (pendingMeasureBumpRef.current) return;
    pendingMeasureBumpRef.current = setTimeout(() => {
      pendingMeasureBumpRef.current = null;
      bumpMeasureTickStore();
    }, 50);
  }, []);

  // Cascade timer refs — tracked so `clearTimers` can cancel them on stop
  // (was previously leaking past tutorial end).
  const cascadeTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

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
    // Cancel any pending measure-tick cascade bumps. Previously these
    // ran as naked setTimeouts and leaked past `stop()` — firing
    // `bumpMeasureTickStore` after the tutorial ended (harmless but
    // wasteful).
    if (cascadeTimersRef.current.length) {
      cascadeTimersRef.current.forEach((t) => clearTimeout(t));
      cascadeTimersRef.current = [];
    }
    if (pendingMeasureBumpRef.current) {
      clearTimeout(pendingMeasureBumpRef.current);
      pendingMeasureBumpRef.current = null;
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
      phase: "idle",
      activeTargetRect: null,
    }));
    targetsRef.current.clear();
    resetTutorialStore();
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
    // Compute the expected navigation chain by walking forward from the
    // first step. This is the REAL fix for "jump to a deep step":
    // previously goToStep would only push the most-recent preceding
    // screen, but interactive tap-then-navigate sequences left implicit
    // pushes that the walker missed — so jumping to e.g. a task-detail
    // step landed on /cronograma with no back-stack to /detail, and
    // jumping to a back-button step landed on /home so back went home
    // instead of the section hub.
    //
    // The walker simulates each preceding step:
    //   - The first step's `screen` (or "/" if none) seeds the stack.
    //   - For each subsequent step i:
    //       * If steps[i-1].navigatesTo: the previous step's expected
    //         action would have pushed a route → push it.
    //       * If steps[i-1].popsOnAction: the previous step popped → pop.
    //       * If step i has navigateOnEnter: engine pushes on entry.
    //       * Else if step i has a `screen` differing from the top of
    //         the stack: treat as an implicit push (gives older un-
    //         annotated steps a sensible default).
    //
    // Result is the expected stack at the target step. We REPLACE the
    // current navigation with the first route then PUSH the rest so the
    // back stack ends up exactly as the tutorial expects.
    let plannedStack: string[] = [];
    setState((s) => {
      if (!s.isActive) return s;
      if (index < 0 || index >= s.steps.length) return s;
      if (index === s.currentStepIndex) return s;

      plannedStack = computeNavigationStack(s.steps, index);

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
    if (plannedStack.length > 0) {
      replayNavigationStack(routerRef.current, plannedStack, pathnameRef.current);
    }
  }, [clearTimers, queryClient, user]);

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
      // Authority for "is this id the active target" comes from BOTH the
      // React-side ref (currentStepRef) AND the external store
      // (getStoreActiveTargetId). They are kept in sync inside the same
      // useLayoutEffect, but state-update timing in React 18 means a
      // measureInWindow callback firing across a step transition can land
      // in a microtask gap where one of them has been refreshed and the
      // other has not. Accepting either authority eliminates the silent
      // drop that left `state.activeTargetRect` permanently null until
      // something external (AppState foreground, picker open) bumped the
      // engine. This is the root of the "spotlight missing until I open
      // the Passos modal" report.
      const refActiveId = currentStepRef.current?.targetId;
      const storeActiveId = getStoreActiveTargetId();
      const isActive = refActiveId === id || storeActiveId === id;
      tlog(`registerTarget id=${id} refActive=${refActiveId} storeActive=${storeActiveId} isActive=${isActive} sameRect=${sameRect}`);
      if (!isActive) return;
      // Push to the external rect store FIRST. The spotlight overlay
      // subscribes to this store via useSyncExternalStore, so the cutout
      // and pulse ring update the moment we have a valid rect — without
      // waiting for the React setState below to flush through context.
      // This is what closes the persistent "rect committed to provider
      // state but spotlight still missing" gap on slow JS frames.
      setStoreActiveTargetRect(rect);
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
    // Clear the store rect too — spotlight overlay subscribes to the
    // store, so without this the cutout would linger over the unmounted
    // target's last position.
    setStoreActiveTargetRect(null);
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
  //
  // ALSO syncs the external `activeTargetId` store — this is what every
  // mounted `useTutorialTarget` hook subscribes to. Only the two affected
  // hooks (the one losing active status, the one gaining it) re-render
  // per step change; the other 138+ stay quiet. This is the single
  // biggest re-render reduction in the engine.
  useLayoutEffect(() => {
    currentStepRef.current = currentStep;
    setActiveTargetId(currentStep?.targetId ?? null);
    // Clear the store rect on step change. The new step's hook will repopulate
    // it via registerTarget once its measure lands. Without this clear the
    // spotlight would briefly paint at the previous step's rect under the new
    // step's tooltip.
    setStoreActiveTargetRect(null);
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
        setStoreActiveTargetRect(cached);
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
    // never resolves).
    //
    // Extended cascade (7 bumps over 4s) covers a known race: chrome-header
    // targets like `chromeHeaderMenu` can have a window-relative measure
    // returning 0×0 if the navigation header is still settling. The old
    // 4-bump cascade ending at 1500ms wasn't long enough — measures fired
    // before the layout had truly settled, the bad rect was rejected by
    // SG1, and no further re-measure happened until SOMETHING external
    // triggered an onLayout (e.g. opening the dev step picker modal). The
    // user's workaround of "open the picker to get the spotlight back" is
    // a symptom of that race; the 2500ms and 4000ms bumps below remove it.
    //
    // Tracked in `cascadeTimersRef` so `clearTimers` can cancel them when
    // the tutorial stops mid-step.
    [80, 200, 400, 800, 1500, 2500, 4000].forEach((ms) => {
      const t = setTimeout(() => bumpMeasureTick(), ms);
      cascadeTimersRef.current.push(t);
    });
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

  // AppState foreground re-measure. When the app returns from background
  // the OS triggers a full native re-layout pass that updates the bounds
  // of every visible view. Users discovered they could "unstick" a missing
  // spotlight by minimizing the app and bringing it back — that workaround
  // is a symptom of `measureInWindow` returning stale 0×0 coordinates on
  // the initial mount of certain React Navigation header children
  // (chromeDrawerToggle, chromeNotificationsBell, chromeHeaderBack) while
  // the navigator was still settling.
  //
  // The fix: subscribe to AppState here and bump the measure tick on every
  // `active` transition. The active target's hook reacts by re-measuring,
  // which now succeeds because the native layout pass that fires on
  // background→foreground has produced valid coords. We also issue a
  // short cascade after foreground because some screens take 1–2 frames
  // to commit the re-layout (e.g., drawers re-attach asynchronously).
  useEffect(() => {
    if (!state.isActive) return;
    const handle = (next: AppStateStatus) => {
      if (next !== "active") return;
      // Immediate + short cascade. We're not relying on the per-target
      // polling here because foreground transitions are an explicit
      // recovery point — pump a few bumps directly so the active hook
      // re-measures within ~250ms of return.
      bumpMeasureTickStore();
      const t1 = setTimeout(() => bumpMeasureTickStore(), 80);
      const t2 = setTimeout(() => bumpMeasureTickStore(), 250);
      cascadeTimersRef.current.push(t1, t2);
    };
    const sub = AppState.addEventListener("change", handle);
    return () => sub.remove();
  }, [state.isActive]);

  // Phase-driven recovery. When the engine flips into `waiting` (target
  // not yet measured) or `fallback` (target unreachable), kick the
  // measure tick on a short delay so a hook that missed its initial
  // measure window gets another nudge without depending on the
  // per-target polling cadence. Cheap — one notify to the active hook
  // only — and decouples spotlight recovery from the polling loop,
  // which was the only retry path before.
  useEffect(() => {
    if (!state.isActive) return;
    if (state.phase !== "waiting" && state.phase !== "fallback") return;
    const t = setTimeout(() => bumpMeasureTickStore(), 120);
    cascadeTimersRef.current.push(t);
    return () => clearTimeout(t);
  }, [state.isActive, state.phase]);

  // Unmount cleanup.
  useEffect(() => {
    return () => {
      clearTimers();
      cachedMocksModule?.clearTutorialMocks(queryClient);
    };
  }, [clearTimers, queryClient]);

  const currentTargetRect = state.activeTargetRect;

  // Stable-identity actions bag. The wrapped useCallbacks already have
  // stable deps (most are empty or `[user?.id]`), so this memo's identity
  // only churns when `user` changes — once per session. Screen files that
  // only need callbacks (register, notify, invoke) subscribe here and
  // never re-render on state mutations.
  const actions = useMemo<TutorialActionsValue>(
    () => ({
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
      bumpMeasureTick,
    }),
    [
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
      bumpMeasureTick,
    ],
  );

  // Full composed value. The overlay + tooltip + dev step picker subscribe
  // here. Identity changes on every state mutation — by design. Keeping
  // them in a separate context isolates the heavy paint surface from the
  // 39 consumer screens.
  //
  // `measureTick: 0` is a back-compat shim — the value is now driven by
  // the external store and any consumer that still reads it from the
  // composed context can ignore it. Real subscribers use
  // `subscribeMeasureTick` via `useTutorialTarget`.
  const value = useMemo<TutorialContextValue>(
    () => ({
      ...state,
      currentStep,
      totalSteps: state.steps.length,
      currentTargetRect,
      ...actions,
      measureTick: 0,
    }),
    [state, currentStep, currentTargetRect, actions],
  );

  return (
    <TutorialActionsContext.Provider value={actions}>
      <TutorialActiveFlagContext.Provider value={state.isActive}>
        <TutorialStateContext.Provider value={value}>
          <TutorialContext.Provider value={value}>
            {children}
          </TutorialContext.Provider>
        </TutorialStateContext.Provider>
      </TutorialActiveFlagContext.Provider>
    </TutorialActionsContext.Provider>
  );
}

export function openDrawerFromTutorial(navigation: any) {
  try {
    navigation.dispatch(DrawerActions.openDrawer());
  } catch {}
}
