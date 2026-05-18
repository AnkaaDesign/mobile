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
  registerJumpHandler: (name: string, fn: (() => void | Promise<void>) | null) => void;
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
// Temporarily ENABLED while we hunt the spotlight-stuck bug. Set back
// to false once stable. Logs are tagged so the user can grep `[tutorial]`
// in Metro's console to capture the full transition trace.
const TUTORIAL_VERBOSE = true;
const tlog = TUTORIAL_VERBOSE
  ? (msg: string, ...args: any[]) => {
      if (__DEV__) console.log(`[tutorial ${Date.now() % 100000}] ${msg}`, ...args);
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
 * Find the route a step lands on. Walks BACKWARD from the step looking
 * for the first hint of an intended route: the step's own `navigateOnEnter`,
 * its `screen`, or — for steps that piggy-back on the prior tap action —
 * the previous step's `navigatesTo`. Returns null if no route can be
 * inferred (rare; only narration intros).
 *
 * Used by `goToStep` for single-shot navigation. The prior approach walked
 * FORWARD reconstructing the entire stack, which leaked stale pushes
 * (e.g. `/cronograma/detalhes/{id}` never popped because `task-back-to-list`
 * was a showcase without `popsOnAction`) and stranded jumps on whatever
 * screen the leaked push landed on.
 */
function findStepLandingRoute(
  steps: TutorialStep[],
  index: number,
): string | null {
  if (index < 0 || index >= steps.length) return null;
  for (let i = index; i >= 0; i--) {
    const step = steps[i];
    if (!step) continue;
    if (step.navigateOnEnter) return step.navigateOnEnter;
    if (step.screen) return step.screen;
    // The step at i lives on the route the prior interactive step
    // navigated to (e.g. `task-info-card` inherits the route from
    // `cronograma-tap-task.navigatesTo`).
    if (i > 0 && steps[i - 1]?.navigatesTo) return steps[i - 1]!.navigatesTo!;
  }
  return null;
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
  // Same pattern for `user`: useAuth often returns a fresh object on
  // every auth-context render (token refresh, profile poll). If we put
  // `user` in `start`'s deps directly, `start` rebuilds on every auth
  // re-render → the `actions` memo rebuilds → all 140 `useTutorialTarget`
  // hooks re-render → some hooks' polling effect tears down + restarts +
  // resets `hasRegisteredRef.current = false`, throwing away any
  // in-flight successful measure. Stable callback identity matters here.
  const userRef = useRef(user);
  userRef.current = user;

  const [state, setState] = useState<TutorialState>(INITIAL_STATE);

  // Refs that don't drive the spotlight directly. `targetsRef` is a CACHE for
  // cross-step lookups (same-screen transitions can re-use an already-measured
  // rect without waiting for re-registration). The spotlight is driven off
  // `state.activeTargetRect`, NOT off this ref.
  const targetsRef = useRef<Map<string, TutorialTargetRect>>(new Map());
  const actionsRef = useRef<Map<string, () => void>>(new Map());
  const openDrawerCallbackRef = useRef<(() => void) | null>(null);
  const closeDrawerCallbackRef = useRef<(() => void) | null>(null);
  // Registry of screen-local "do this state setup" handlers. Used exclusively
  // by `goToStep` to reproduce the side-effects the natural walk-forward
  // path would have built up. Keys are the names declared in step
  // `jumpSetup` arrays (e.g. "open-side-drawer", "dashboard-edit-mode").
  const jumpHandlersRef = useRef<Map<string, () => void | Promise<void>>>(new Map());
  // `currentStepRef` mirrors state for use inside callbacks (avoids stale closure).
  const currentStepRef = useRef<TutorialStep | null>(null);

  // Measure tick lives in the external store, not React state — so bumping
  // it only re-renders the SINGLE currently-active target hook (via
  // `useSyncExternalStore` in `use-tutorial-target.ts`) instead of every
  // consumer of the tutorial context. The 50ms debounce stays so a burst of
  // bumps in the same frame collapses to one re-measure.
  const pendingMeasureBumpRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bumpMeasureTick = useCallback(() => {
    // 100ms debounce. The previous 50ms window let a cascade of 7 bumps
    // (the old step-entry tail + AppState foreground + drawer state
    // bumps + per-screen onLayout bumps) collapse to maybe 5 distinct
    // ticks. 100ms collapses them to 2–3 — measurable JSI-call savings
    // on the dozens of active hooks that re-measureInWindow on each
    // tick, and a key contributor to keeping the engine responsive
    // after many step transitions on lower-end devices.
    if (pendingMeasureBumpRef.current) return;
    pendingMeasureBumpRef.current = setTimeout(() => {
      pendingMeasureBumpRef.current = null;
      bumpMeasureTickStore();
    }, 100);
  }, []);

  // Cascade timer refs — tracked so `clearTimers` can cancel them on stop
  // (was previously leaking past tutorial end).
  const cascadeTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // Pending deferred-unregister timers, keyed by target id. Used to suppress
  // the "unregister-clobbers-register" race on dynamic-target steps (the
  // home-widget-added flow is the canonical case: the previously-active
  // tile cleanup runs in the same commit as the newly-mounted tile setup,
  // and if the new tile's prerequisites aren't ready on the first effect
  // tick its registerTarget is delayed — the unregister already cleared
  // the spotlight by then, and the next register may take a measureTick
  // bump to fire). Deferring the destructive transition by one tick lets a
  // same-commit register win; if no register lands, the deferred clear
  // proceeds as before.
  const pendingUnregisterRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

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

  const registerJumpHandler = useCallback(
    (name: string, fn: (() => void | Promise<void>) | null) => {
      if (fn == null) {
        jumpHandlersRef.current.delete(name);
        return;
      }
      jumpHandlersRef.current.set(name, fn);
    },
    [],
  );

  /**
   * Run a step's `jumpSetup` hooks in declared order. Missing handlers are
   * a no-op (the relevant screen may not be mounted yet, or the hook was
   * declared optimistically). Errors are isolated per hook so one
   * misbehaving handler can't prevent subsequent ones from running.
   *
   * Hooks may be awaitable — long-running ones (e.g. add-widget that
   * needs a frame for the new tile to mount) can return a Promise and
   * the engine will yield before invoking the next hook.
   */
  const runJumpSetup = useCallback(async (hooks: ReadonlyArray<string> | undefined) => {
    if (!hooks || hooks.length === 0) return;
    for (const name of hooks) {
      const fn = jumpHandlersRef.current.get(name);
      if (!fn) continue;
      try {
        const ret = fn();
        if (ret && typeof (ret as Promise<void>).then === "function") {
          await ret;
        }
      } catch {
        // Don't let a broken handler trap the jump.
      }
    }
  }, []);

  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stuckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Watchdog stored in a dedicated ref (not cascadeTimersRef) so the
  // generic cascade-flush in clearTimers doesn't kill it prematurely
  // before it gets a chance to rescue a stuck phase.
  const phaseWatchdogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    const cancelled: string[] = [];
    if (autoAdvanceTimer.current) cancelled.push("autoAdvance");
    if (navTimer.current) cancelled.push("nav");
    if (drawerTimer.current) cancelled.push("drawer");
    if (fallbackTimer.current) cancelled.push("fallback");
    if (stuckTimer.current) cancelled.push("stuck");
    if (cascadeTimersRef.current.length) cancelled.push(`cascade(${cascadeTimersRef.current.length})`);
    if (pendingMeasureBumpRef.current) cancelled.push("measureBump");
    if (pendingUnregisterRef.current.size) cancelled.push(`unreg(${pendingUnregisterRef.current.size})`);
    if (cancelled.length) tlog(`clearTimers cancelled=[${cancelled.join(",")}]`);
    [autoAdvanceTimer, navTimer, drawerTimer, fallbackTimer, stuckTimer, phaseWatchdogTimer].forEach((t) => {
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
    // Cancel any deferred unregister-clear timers — otherwise a tutorial
    // stop() mid-step would let them fire after `phase` was already reset
    // to "idle", scheduling a stale setState into the next session.
    if (pendingUnregisterRef.current.size) {
      pendingUnregisterRef.current.forEach((t) => clearTimeout(t));
      pendingUnregisterRef.current.clear();
    }
  }, []);

  const stop = useCallback(async () => {
    clearTimers();
    // Clear the active step ref BEFORE resetting the store — an in-flight
    // measureInWindow callback that lands during stop() reads the ref in
    // registerTarget; if the ref still points at the dead session's step,
    // the callback would re-populate setStoreActiveTargetRect AFTER
    // resetTutorialStore() ran, leaking a stale rect into the next start().
    currentStepRef.current = null;
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
    // Don't leak per-target action handlers and jump handlers across
    // tutorial sessions. Without these clears, an unregistered hook
    // (e.g. on a screen the user navigated away from) could leave a
    // stale closure in the map, and the next tutorial run would
    // invoke that closure (referencing a stale `ref`) when the same
    // target id was hit. Harmless in practice but conceptually a leak.
    actionsRef.current.clear();
    jumpHandlersRef.current.clear();
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
        cachedMocksModule.injectTutorialMocks(queryClient, userRef.current);
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
    // SINGLE-SHOT navigation (was: walked-forward stack reconstruction).
    // The walker (`computeNavigationStack`) tried to rebuild the entire
    // back-stack from step 0 to the target step, then replay it via
    // `router.replace(stack[0])` followed by `router.push(...)` for each
    // remaining route 80ms apart. This approach was fragile:
    //   - Any step that pushed a route without a paired pop (e.g.
    //     `task-back-to-list` was showcase, not interactive popsOnAction)
    //     leaked the route into every subsequent jump's planned stack.
    //   - Once stale `/cronograma/detalhes/{id}` lived in the stack,
    //     expo-router couldn't push tab routes (`/historico`, `/pessoal`,
    //     etc.) on top of a stack child — pushes silently failed and the
    //     user stranded on the detail screen (the "Sobre o Bônus → lands
    //     on detalhes" bug).
    // The picker promised the user "jump to this step." A single replace
    // to the target route honors that promise robustly regardless of
    // upstream step annotations. The back-stack is shallower but the
    // dev-jump affordance doesn't need a deep history.
    let targetRoute: string | null = null;
    let cumulativeHooks: string[] = [];
    setState((s) => {
      if (!s.isActive) return s;
      if (index < 0 || index >= s.steps.length) return s;
      if (index === s.currentStepIndex) return s;

      // Use the backward-walking landing-route resolver so steps that
      // inherit their route from a prior tap (the task-detail showcase
      // chain, all the `pessoal-*-page` showcases, etc.) still resolve
      // to a concrete route. Without this, those steps would have
      // targetRoute=null and the jump would be a no-op.
      targetRoute = findStepLandingRoute(s.steps, index);

      // Walk forward through every preceding step's jumpSetup hooks so
      // cumulative state (entered edit mode → added widget → opened
      // panel) is rebuilt in the order the natural walk would have
      // produced it. Even when the TARGET step itself declares no
      // jumpSetup, earlier steps may have set up state the target
      // depends on (e.g. the home grid steps that follow widget-added
      // all need edit mode active).
      //
      // Dedupe-keep-last while preserving relative order, so a chain
      // like [enter-edit, open-sheet, enter-edit, close-sheet] collapses
      // to [open-sheet, enter-edit, close-sheet] — the terminal
      // occurrence of each hook wins so a later-step close isn't undone
      // by an earlier-step open.
      const raw: string[] = [];
      for (let i = 0; i <= index; i++) {
        const step = s.steps[i];
        if (step?.jumpSetup) raw.push(...step.jumpSetup);
      }
      const seen = new Set<string>();
      const reversed: string[] = [];
      for (let i = raw.length - 1; i >= 0; i--) {
        const name = raw[i];
        if (seen.has(name)) continue;
        seen.add(name);
        reversed.push(name);
      }
      cumulativeHooks = reversed.reverse();

      const willNavigate =
        !!targetRoute &&
        normalizeRoute(pathnameRef.current) !== normalizeRoute(targetRoute);
      return {
        ...s,
        currentStepIndex: index,
        awaitingAction: false,
        isCelebrating: false,
        activeTargetRect: null,
        phase: willNavigate ? "navigating" : "waiting",
        interactiveStuck: false,
      };
    });
    if (
      targetRoute &&
      normalizeRoute(pathnameRef.current) !== normalizeRoute(targetRoute)
    ) {
      tlog(`goToStep single-shot replace → ${targetRoute}`);
      try {
        routerRef.current.replace(targetRoute as any);
      } catch (e) {
        tlog(`goToStep replace EXCEPTION`, e);
      }
    } else {
      tlog(`goToStep no nav needed (already on ${pathnameRef.current})`);
    }
    if (cumulativeHooks.length > 0) {
      // Wait for the route to commit + first paint before running setup
      // hooks. 300ms is enough for expo-router's mount + a first render
      // cycle on most devices; the hooks (e.g. open-drawer, enter-edit-
      // mode) need the destination screen mounted to find their target
      // refs.
      const handle = setTimeout(() => {
        void runJumpSetup(cumulativeHooks);
      }, 300);
      cascadeTimersRef.current.push(handle);
    }
  }, [clearTimers, queryClient, runJumpSetup]);

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
    // Detect tutorial completion (current step is the last one) BEFORE
    // the setState updater, so side-effects (storage write, mock clear,
    // ref cleanup) don't live inside a React updater (which is required
    // to be pure and may run twice in StrictMode).
    let didComplete = false;
    setState((s) => {
      const currentStep = s.steps[s.currentStepIndex];
      const nextIndex = s.currentStepIndex + 1;
      const completedStepIds = currentStep
        ? Array.from(new Set([...s.completedStepIds, currentStep.id]))
        : s.completedStepIds;

      if (nextIndex >= s.steps.length) {
        didComplete = true;
        return {
          ...INITIAL_STATE,
          completedStepIds,
        };
      }

      // Clear the spotlight rect on step change. The next step's effect will
      // either pick up a cached rect (same-screen transition) or wait for the
      // target to register (cross-screen transition). This guarantees no
      // "previous step's rect lingers under the new step's tooltip" bug.
      //
      // Phase: "navigating" hides the tooltip; use it only when the next step
      // actually crosses routes. Same-screen advances get "waiting" so the
      // engine's transitions feel snappy (the step-entry effect promotes
      // to "active" within a frame of a cache hit).
      const nextStep = s.steps[nextIndex];
      const nextRoute = nextStep?.navigateOnEnter ?? nextStep?.screen;
      const willNavigate =
        !!nextRoute &&
        normalizeRoute(pathnameRef.current) !== normalizeRoute(nextRoute);
      return {
        ...s,
        currentStepIndex: nextIndex,
        awaitingAction: false,
        isCelebrating: false,
        completedStepIds,
        activeTargetRect: null,
        phase: willNavigate ? "navigating" : "waiting",
        interactiveStuck: false,
      };
    });
    // Completion side-effects: run AFTER setState commits the new
    // INITIAL_STATE (and after the updater has run — even twice in
    // StrictMode). Null the step ref so any in-flight measureInWindow
    // callback that races the tutorial-end doesn't write a stale rect
    // into the store on next start().
    if (didComplete) {
      currentStepRef.current = null;
      const uid = userRef.current?.id;
      if (uid) tutorialStorage.markCompleted(uid).catch(() => {});
      cachedMocksModule?.clearTutorialMocks(queryClient);
      resetTutorialStore();
    }
  }, [clearTimers, queryClient]);

  const start = useCallback(
    async (opts?: { fromStepIndex?: number }) => {
      // Lazy-load both modules. After the first start they're cached so
      // re-running the tutorial is synchronous. Saves ~35KB JS parse on the
      // app cold-start for users who never run the tutorial.
      const [stepsModule, mocksModule] = await Promise.all([
        loadStepsModule(),
        loadMocksModule(),
      ]);

      // Read user from ref so this callback's identity stays stable
      // across auth-context re-renders. See userRef declaration for the
      // full rationale.
      const liveUser = userRef.current;
      const ctx: TutorialUserContext = {
        user: liveUser,
        isLeader: !!liveUser?.ledSector?.id,
        isBonifiable:
          !!liveUser?.position?.bonifiable && liveUser?.status === "EFFECTED",
      };
      const allSteps = stepsModule.buildTutorialSteps(ctx);
      // Filter the leader-only steps when not a leader (or any other
      // conditional steps a step author marks).
      const steps = allSteps.filter((s) => !s.condition || s.condition(ctx));

      mocksModule.injectTutorialMocks(queryClient, liveUser);
      haptic("medium");
      const startIndex = opts?.fromStepIndex ?? 0;
      const firstStep = steps[startIndex] ?? null;
      // Prime the step ref + store target id synchronously BEFORE the
      // setState. The hooks listening via useSyncExternalStore react to
      // the store immediately when their snapshot changes; without this
      // priming, a measureInWindow callback racing the layout-effect
      // would read `currentStepRef.current = null` and silently drop the
      // registration (line ~815: refActiveId=undefined, storeActiveId
      // also null since setActiveTargetId hasn't run yet).
      currentStepRef.current = firstStep;
      setActiveTargetId(firstStep?.targetId ?? null);
      // Phase: if the first step has a target AND we're not already on the
      // target screen, "navigating". If we're already on the right screen,
      // "waiting" (target pending). If no target at all (narration step),
      // jump straight to "active" so the tooltip surfaces immediately.
      const firstRoute = firstStep?.navigateOnEnter ?? firstStep?.screen;
      const willNavigate =
        !!firstRoute &&
        normalizeRoute(pathnameRef.current) !== normalizeRoute(firstRoute);
      const initialPhase: TutorialPhase = !firstStep?.targetId
        ? "active"
        : willNavigate
        ? "navigating"
        : "waiting";
      setState({
        ...INITIAL_STATE,
        isActive: true,
        currentStepIndex: startIndex,
        steps,
        phase: initialPhase,
      });
    },
    [queryClient],
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
      // Cancel any deferred unregister-clear for this id. Without this, a
      // sibling-component cleanup that fired moments earlier (e.g. the
      // previous last-widget tile losing its `tileTutorialTargetId` prop
      // when a new widget gets added at the end of the SortableGrid) would
      // still flush a phase=waiting + rect=null state update after our
      // re-registration — leaving the engine in waiting until the next
      // measureTick bump. This is the precise race that left the
      // "Widget adicionado" spotlight invisible until the user minimized
      // and restored the app.
      const pending = pendingUnregisterRef.current.get(id);
      if (pending) {
        clearTimeout(pending);
        pendingUnregisterRef.current.delete(id);
      }
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
      tlog(`registerTarget setStoreRect id=${id} rect=${JSON.stringify(rect)}`);
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
    // If the active target is the one being unregistered, schedule the
    // destructive state transition for ONE TICK out — not synchronously.
    // Why: dynamic-target steps (canonical case: home-widget-added, where
    // the `homeFirstWidgetTile` id moves from the previous last tile to
    // the newly-added one) commit a sibling-cleanup of the old owner
    // followed by a fresh setup of the new owner in the same effect
    // flush. The old owner's cleanup must NOT clobber the new owner's
    // registration. By deferring, a registerTarget that lands within the
    // same tick cancels the pending clear via the timer-cancellation in
    // registerTarget, and the spotlight stays continuous across the
    // ownership swap.
    //
    // If no registerTarget shows up, the deferred handler proceeds to
    // transition phase to "waiting" + re-arm the fallback / stuck
    // timers, exactly like before — same end state, just one tick later.
    const liveStep = currentStepRef.current;
    tlog(`unregisterTarget id=${id} liveStepTarget=${liveStep?.targetId} isLive=${liveStep?.targetId === id}`);
    if (!liveStep || liveStep.targetId !== id) return;
    const liveStepId = liveStep.id;
    const liveStepKind = liveStep.kind;
    const existing = pendingUnregisterRef.current.get(id);
    if (existing) clearTimeout(existing);
    const handle = setTimeout(() => {
      pendingUnregisterRef.current.delete(id);
      if (targetsRef.current.has(id)) {
        tlog(`unregister deferred fire id=${id} CANCELLED (re-registered in same tick)`);
        return;
      }
      if (currentStepRef.current?.id !== liveStepId) {
        tlog(`unregister deferred fire id=${id} CANCELLED (step changed from ${liveStepId})`);
        return;
      }
      tlog(`unregister deferred fire id=${id} → clearing rect + arming fallbackTimer? ${!fallbackTimer.current}`);
      // Clear the store rect too — spotlight overlay subscribes to the
      // store, so without this the cutout would linger over the
      // unmounted target's last position.
      setStoreActiveTargetRect(null);
      setState((s) =>
        s.activeTargetRect == null && s.phase === "waiting"
          ? s
          : { ...s, activeTargetRect: null, phase: "waiting" },
      );
      // DON'T reset the in-flight fallbackTimer. Re-arming on every
      // unregister cycle would push out the deadline indefinitely when
      // a target's hook mounts and unmounts repeatedly (a freshly
      // pushed screen with lazy-loaded children does this: shimmer
      // mounts → registers → unmounts → real content mounts → registers
      // again, and so on for a couple seconds). The single canonical
      // fallbackTimer set by step-entry is the deadline; this branch
      // only ARMS it if step-entry didn't (the dynamic-target swap path
      // from home-widget-added enters here without going through the
      // step-entry cache-miss branch). Pairs with the post-fire null-out
      // below so a fired-but-still-set fallbackTimer doesn't block a
      // legitimate re-arm on the NEXT step.
      if (!fallbackTimer.current) {
        fallbackTimer.current = setTimeout(() => {
          fallbackTimer.current = null;
          if (currentStepRef.current?.id !== liveStepId) return;
          setState((s) => (s.phase === "waiting" ? { ...s, phase: "fallback" } : s));
        }, TUTORIAL_TIMINGS.fallbackAfter);
      }
      if (liveStepKind === "interactive") {
        // Same idempotence rule for the SG2 stuck banner — repeated
        // unregister cycles shouldn't keep pushing out the "still on
        // the same step?" timer.
        if (!stuckTimer.current) {
          stuckTimer.current = setTimeout(() => {
            stuckTimer.current = null;
            if (currentStepRef.current?.id !== liveStepId) return;
            setState((s) =>
              s.interactiveStuck ? s : { ...s, interactiveStuck: true },
            );
          }, TUTORIAL_TIMINGS.interactiveStuckAfter);
        }
      }
    }, 0);
    pendingUnregisterRef.current.set(id, handle);
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
    // CRITICAL: close the drawer BEFORE firing the action — but ONLY
    // for steps whose action is a navigation (`navigatesTo` set). The
    // drawer-item taps that route to a new screen need this because
    // the user's tap on the spotlight Pressable doesn't pass through
    // to the underlying drawer item, so React Navigation never gets
    // the close signal and expo-router won't commit the navigation
    // while the drawer is open. By contrast, `drawer-avatar-tap` opens
    // a sub-menu INSIDE the drawer — closing the drawer would dismiss
    // exactly the UI the next step needs to spotlight. The
    // `navigatesTo` gate distinguishes the two cases cleanly.
    const liveStep = currentStepRef.current;
    if (liveStep?.openDrawerOnEnter && liveStep?.navigatesTo) {
      tlog(`invokeTargetAction id=${id} step opens drawer + navigates → closing drawer first`);
      try {
        closeDrawerCallbackRef.current?.();
      } catch {}
    }
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
  const prevTargetIdRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    const nextTargetId = currentStep?.targetId ?? null;
    tlog(`useLayoutEffect step.id=${currentStep?.id} target=${nextTargetId} prevTarget=${prevTargetIdRef.current}`);
    currentStepRef.current = currentStep;
    setActiveTargetId(nextTargetId);
    // Only clear the store rect when the target id ACTUALLY changes between
    // steps. The unconditional clear that used to live here would clobber
    // a freshly-registered rect on the rare same-target consecutive steps,
    // AND would race against an in-flight measure callback from the new
    // step's hook that happened to land in the same task as this effect.
    // The next-step's hook will repopulate the rect via registerTarget
    // either way; this gate avoids the brief null window that briefly
    // collapsed the spotlight cover view to 0×0 between rect transitions.
    if (prevTargetIdRef.current !== nextTargetId) {
      setStoreActiveTargetRect(null);
      prevTargetIdRef.current = nextTargetId;
    }
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
        cachedMocksModule.injectTutorialMocks(queryClient, userRef.current);
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

    // 2. Drawer — gated close. The previous blanket-close-on-every-step
    // implementation broke legitimate panel-context narrations
    // (`drawer-overview`, `notifications-list`, `notifications-close`)
    // which need the drawer/panel to STAY open. The actual bug we're
    // fixing is "previous step opened drawer + user's spotlight tap
    // navigated via router.push but the drawer didn't close, blocking
    // the destination from mounting" — that's already handled by the
    // close-drawer call inside `invokeTargetAction`. This step-entry
    // close only fires when the legacy `closeDrawerOnEnter` flag is
    // set, preserving the original semantics.
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
        tlog(`fallbackTimer ARMED (1200ms) step=${currentStep.id} target=${currentStep.targetId}`);
        fallbackTimer.current = setTimeout(() => {
          // Null the ref AS the timer fires so the unregister deferred
          // handler's `if (!fallbackTimer.current)` idempotence check
          // sees a clean slot if it fires later in this step. Without
          // the null-out, fallbackTimer.current stayed set forever
          // after firing, defeating any future idempotence.
          fallbackTimer.current = null;
          if (currentStepRef.current?.id !== currentStep.id) {
            tlog(`fallback fire ABORT (step changed from ${currentStep.id} to ${currentStepRef.current?.id})`);
            return;
          }
          setState((s) => {
            if (s.phase === "waiting") {
              tlog(`fallback FIRE → phase=fallback step=${currentStep.id} target=${currentStep.targetId} (never registered)`);
              return { ...s, phase: "fallback" };
            }
            tlog(`fallback fire noop step=${currentStep.id} currentPhase=${s.phase}`);
            return s;
          });
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
        stuckTimer.current = null;
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
    // Tight cascade (4 bumps over 2.5s) — narration steps with no targetId
    // get NO cascade since there's nothing to measure. The earlier 7-bump
    // cascade ran for every step regardless of kind and contributed to
    // the performance degradation users saw after long step sessions.
    // The per-target polling loop (use-tutorial-target.ts) is the
    // long-tail safety net for slow-settling layouts; the cascade only
    // needs to cover the typical-case route transition (~80–400ms) and
    // the slow chrome-header layout race (~1500ms).
    //
    // Tracked in `cascadeTimersRef` so `clearTimers` can cancel them when
    // the tutorial stops mid-step. We call `bumpMeasureTickStore` directly
    // (NOT the debounced `bumpMeasureTick`) so the 100ms collapse-window
    // doesn't swallow legitimate cascade bumps when rapid step transitions
    // queue overlapping schedules. The debounce only ever made sense for
    // onLayout bursts emitted from the same frame; the step-entry cascade
    // already controls its own timing.
    if (currentStep.targetId) {
      [80, 320, 900, 1800].forEach((ms) => {
        const t = setTimeout(() => bumpMeasureTickStore(), ms);
        cascadeTimersRef.current.push(t);
      });
    }

    // 8. Hard ceiling on non-active phases. Covers two failure modes:
    //   (a) phase stuck in "navigating" (RAF push didn't update pathname,
    //       step-entry effect's nav check loops, etc.)
    //   (b) phase stuck in "waiting" (target's hook keeps mounting and
    //       unmounting, each unregister cycles fallbackTimer — even with
    //       the idempotence fix this safety net is the last line)
    // Both produce a dim screen with no tooltip and no spotlight, which
    // is the exact symptom the user reports needing to fix via minimize
    // workaround. Force-promote to "fallback" after the ceiling so the
    // tooltip always surfaces and the user has a clear path forward.
    // 2200ms is longer than fallbackAfter (1200ms) so the primary
    // mechanism gets first crack; this only fires if it failed.
    phaseWatchdogTimer.current = setTimeout(() => {
      phaseWatchdogTimer.current = null;
      if (currentStepRef.current?.id !== currentStep.id) {
        tlog(`phaseWatchdog ABORT (step changed from ${currentStep.id})`);
        return;
      }
      setState((s) => {
        if (s.phase === "navigating" || s.phase === "waiting") {
          tlog(`phaseWatchdog FIRE step=${currentStep.id} target=${currentStep.targetId} phase=${s.phase} → fallback`);
          return { ...s, phase: "fallback" };
        }
        tlog(`phaseWatchdog noop step=${currentStep.id} phase=${s.phase}`);
        return s;
      });
    }, 2200);
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
  // measure tick AGGRESSIVELY — multiple bumps over a wide horizon plus
  // a persistent interval during fallback. This is the same mechanism
  // users discovered by accident: minimize → restore triggers an
  // AppState foreground bump, which causes the active hook to re-measure
  // successfully. Doing it continuously here means the user never has to
  // perform the minimize workaround. Bumps are cheap (one notify to the
  // currently-active hook only) so we can afford to be generous.
  // Per-step recovery cascade — runs ONCE per step transition. Deps
  // reduced to `[state.isActive, state.currentStepIndex]`; the prior
  // implementation included `state.phase` and the cleanup ran on every
  // waiting↔active oscillation, killing the cascade before it could
  // fire. The persistent rescue interval inside checks phase via a ref
  // each tick and skips when phase is already "active" (no need to
  // nudge a working spotlight), preserving perf during normal flow.
  const phaseRef = useRef(state.phase);
  phaseRef.current = state.phase;
  useEffect(() => {
    if (!state.isActive) return;
    tlog(`recovery effect ARMED stepIdx=${state.currentStepIndex} target=${currentStepRef.current?.targetId}`);
    const timers: ReturnType<typeof setTimeout>[] = [];
    [60, 180, 380, 700, 1200, 1800, 2500, 3500].forEach((ms) => {
      timers.push(setTimeout(() => {
        tlog(`recovery bump fire ms=${ms} phase=${phaseRef.current}`);
        bumpMeasureTickStore();
      }, ms));
    });
    // Persistent rescue interval: fires every 1000ms but skips when
    // phase is already "active" (spotlight working — no need to nudge).
    // When phase is waiting/fallback/navigating, bumps continue
    // indefinitely until the step changes or phase reaches active.
    // This mirrors the AppState foreground workaround continuously.
    const intervalHandle = setInterval(() => {
      if (phaseRef.current === "active") return;
      tlog(`recovery interval bump phase=${phaseRef.current}`);
      bumpMeasureTickStore();
    }, 1000);
    return () => {
      tlog(`recovery effect CLEANUP stepIdx=${state.currentStepIndex}`);
      timers.forEach((t) => clearTimeout(t));
      clearInterval(intervalHandle);
    };
  }, [state.isActive, state.currentStepIndex]);

  // Unmount cleanup.
  useEffect(() => {
    return () => {
      clearTimers();
      cachedMocksModule?.clearTutorialMocks(queryClient);
      // Reset the module-scope store so a re-mounted provider doesn't
      // inherit stale active-target-id or active-rect. Hooks managed
      // their own subscriptions, so unsubscribes already ran via the
      // useSyncExternalStore lifecycle — this just clears values.
      resetTutorialStore();
      currentStepRef.current = null;
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
      registerJumpHandler,
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
      registerJumpHandler,
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
