/**
 * Tutorial v5 — fake-pages engine.
 *
 * A pure synchronous state machine over a flat step array. There is no
 * router, no queryClient, no precondition handlers, no screen-ready
 * signalling, no target polling. Every transition is a zustand setState.
 *
 * Forward walk and jump-to-step are the same code path: set the current
 * index, mirror the step's scene/state/highlight into the store, the stage
 * re-renders, and the slot's onLayout fires the spotlight rect.
 *
 * The only async surface is the showcase auto-advance timer.
 */
import { tutorialStorage } from "./tutorial-storage";
import { useTutorialStore } from "./engine-store";
import { TUTORIAL_TIMINGS, type TutorialStep, type TutorialUserContext } from "./engine-types";

export interface TutorialEngineDeps {
  getUser: () => any;
}

function computeUserContext(user: any): TutorialUserContext {
  const isLeader =
    user?.sectorPosition === "LEADER" ||
    user?.position?.name?.toLowerCase?.().includes("líder") ||
    user?.position?.name?.toLowerCase?.().includes("lider") ||
    false;
  const isBonifiable = user?.position?.bonifiable === true;
  return { user, isLeader, isBonifiable };
}

export class TutorialEngine {
  private destroyed = false;
  private autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  private stuckTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private deps: TutorialEngineDeps) {}

  async start(opts?: { fromStepIndex?: number }): Promise<void> {
    if (this.destroyed) return;
    const ctx = computeUserContext(this.deps.getUser());
    const { buildSteps } = await import("./steps");
    const steps = buildSteps(ctx);
    if (steps.length === 0) return;

    const store = useTutorialStore.getState();
    store.setSteps(steps);
    store.setPendingStart(false);
    store.setActive(true);

    const startIndex = Math.max(
      0,
      Math.min(opts?.fromStepIndex ?? 0, steps.length - 1),
    );
    this.applyStep(startIndex);
  }

  async stop(): Promise<void> {
    this.clearTimers();
    useTutorialStore.getState().resetAll();
  }

  async skip(): Promise<void> {
    this.clearTimers();
    useTutorialStore.getState().resetAll();
  }

  async complete(): Promise<void> {
    const user = this.deps.getUser();
    if (user?.id) await tutorialStorage.markCompleted(user.id);
    this.clearTimers();
    useTutorialStore.getState().resetAll();
  }

  async reset(): Promise<void> {
    const user = this.deps.getUser();
    if (user?.id) await tutorialStorage.reset(user.id);
    this.clearTimers();
    useTutorialStore.getState().resetAll();
  }

  next(): void {
    const { currentStepIndex, steps } = useTutorialStore.getState();
    const stepId = steps[currentStepIndex]?.id;
    if (stepId) useTutorialStore.getState().markCompleted(stepId);
    if (currentStepIndex >= steps.length - 1) {
      void this.complete();
      return;
    }
    this.applyStep(currentStepIndex + 1);
  }

  goToStep(index: number): void {
    const { steps } = useTutorialStore.getState();
    if (steps.length === 0) return;
    const clamped = Math.max(0, Math.min(index, steps.length - 1));
    this.applyStep(clamped);
  }

  notifyAction(action: "tap" | "continue"): void {
    const { steps, currentStepIndex } = useTutorialStore.getState();
    const step = steps[currentStepIndex];
    if (!step) return;
    const expected = step.expectedAction ?? "continue";
    // Interactive steps with tap expectation: only "tap" advances.
    // Non-interactive steps: any action ("continue" from CTA) advances.
    if (step.kind === "interactive" && expected === "tap" && action !== "tap") {
      return;
    }
    this.next();
  }

  setPendingStart(pending: boolean): void {
    useTutorialStore.getState().setPendingStart(pending);
  }

  destroy(): void {
    this.destroyed = true;
    this.clearTimers();
  }

  // ── internals ─────────────────────────────────────────────────────────

  private applyStep(index: number): void {
    this.clearTimers();
    const store = useTutorialStore.getState();
    const step = store.steps[index];
    if (!step) return;

    store.setCurrentStepIndex(index);
    store.setActiveSceneState(step.sceneState ?? {});
    store.setActiveSlot(step.highlight ?? null);
    store.setInteractiveStuck(false);
    store.setAwaitingAction(step.kind === "interactive");

    if (step.kind === "showcase" && step.autoAdvanceMs) {
      this.autoAdvanceTimer = setTimeout(() => {
        this.autoAdvanceTimer = null;
        this.next();
      }, step.autoAdvanceMs);
    }

    if (step.kind === "interactive") {
      this.stuckTimer = setTimeout(() => {
        this.stuckTimer = null;
        useTutorialStore.getState().setInteractiveStuck(true);
      }, TUTORIAL_TIMINGS.STUCK_RECOVERY_MS);
    }
  }

  private clearTimers(): void {
    if (this.autoAdvanceTimer != null) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    if (this.stuckTimer != null) {
      clearTimeout(this.stuckTimer);
      this.stuckTimer = null;
    }
  }
}

export type { TutorialStep };
