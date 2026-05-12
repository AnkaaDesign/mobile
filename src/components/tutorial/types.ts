import type { ReactNode } from "react";

export type TutorialStepKind = "narration" | "showcase" | "interactive";

export type TutorialPlacement = "top" | "bottom" | "center";

export type TutorialActionType =
  | "tap"
  | "navigate"
  | "input"
  | "submit"
  | "drawer-open"
  | "drawer-close"
  | "continue";

/**
 * Phase machine. Drives the overlay's spotlight + tooltip visibility so step
 * transitions are deterministic instead of fanned out across parallel
 * setTimeouts. Replaces the old "read currentTargetRect from a ref every
 * render and tween between arbitrary rects" approach.
 *
 *   idle        - tutorial not running
 *   navigating  - route change requested; target rect intentionally null
 *   waiting     - on the right screen, waiting for the target to register
 *   active      - target measured; spotlight visible
 *   fallback    - waited too long; render centred tooltip with no spotlight
 */
export type TutorialPhase =
  | "idle"
  | "navigating"
  | "waiting"
  | "active"
  | "fallback";

export interface TutorialTargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Context passed to a step's `condition` predicate. The tutorial filters out
 * steps whose condition returns false at start time — used to branch the
 * leader-only path (Layout, Dossiê, Changelog, cut requests, service-order
 * status edit, Minha Equipe) on `user.ledSector` without maintaining two
 * separate step lists.
 */
export interface TutorialUserContext {
  user: any;
  isLeader: boolean;
  /**
   * True when the user's position is marked bonifiable AND status is
   * EFFECTED — gates the entire bonus-walkthrough branch so non-bonifiable
   * users don't get trapped on a card that isn't rendered for them.
   */
  isBonifiable: boolean;
}

export interface TutorialStep {
  id: string;
  kind: TutorialStepKind;
  screen?: string;
  targetId?: string;
  title: string;
  description: string;
  placement?: TutorialPlacement;
  ctaLabel?: string;
  hint?: string;
  autoAdvanceMs?: number;
  expectedAction?: TutorialActionType;
  expectedEventId?: string;
  navigateOnEnter?: string;
  openDrawerOnEnter?: boolean;
  /**
   * When true, close any open drawer (menu or notifications) as the step
   * activates. Use this when the previous step left the notifications
   * panel open and the next target is in the header chrome, which the
   * open panel would otherwise occlude.
   */
  closeDrawerOnEnter?: boolean;
  pulseTarget?: boolean;
  celebrate?: boolean;
  /**
   * Force the tooltip card to render anchored to the TOP of the screen,
   * ignoring the target rect's position. Use for showcase steps whose
   * target sits in the lower half of the viewport (e.g. the bottom-right
   * ⋮ overflow on a widget tile, or the last-added widget tile itself) —
   * the default "above the target" anchoring would still place the
   * tooltip in the lower half and crowd the spotlight.
   */
  tooltipPinToScreenTop?: boolean;
  /**
   * Optional predicate. Steps whose condition returns false at start time
   * are filtered out — used to branch the leader-only path without splitting
   * the step library.
   */
  condition?: (ctx: TutorialUserContext) => boolean;
  /**
   * Defaults to true. When false, the engine skips the SVG dim mask so the
   * underlying screen (e.g. an open drawer or sheet panel) stays clearly
   * visible behind the tooltip. Use for narration steps that describe a
   * panel the user already opened in the previous interactive step.
   */
  dimBackground?: boolean;
}

export interface TutorialState {
  isActive: boolean;
  isPendingStart: boolean;
  currentStepIndex: number;
  steps: TutorialStep[];
  completedStepIds: string[];
  awaitingAction: boolean;
  isCelebrating: boolean;
  phase: TutorialPhase;
  /**
   * The active target's measured rect. Promoted from a ref-derived value to
   * explicit state so the overlay can drive its fade-in/fade-out off a
   * deterministic React update instead of trying to detect changes through
   * a mutable Map.
   */
  activeTargetRect: TutorialTargetRect | null;
  /**
   * Universal stuck-recovery flag. Set 5s after an interactive step
   * activates without `notifyAction` firing. When true, the tooltip
   * surfaces a "Pular este passo" link that advances (next()), NEVER
   * skips the whole tutorial. Critical invariant: no interactive step
   * keeps awaitingAction true for >5s without an advance button visible.
   */
  interactiveStuck: boolean;
}

export interface TutorialActions {
  start: (opts?: { fromStepIndex?: number }) => Promise<void>;
  stop: () => Promise<void>;
  next: () => void;
  /**
   * DEV-ONLY. Jump the running tutorial to an arbitrary step index. Used by
   * the in-overlay step picker (only rendered when `__DEV__`) so we can land
   * on a specific step without walking through the whole flow each test.
   * No-op when the tutorial isn't active or the index is out of range.
   */
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
  notifyAction: (action: TutorialActionType, payload?: { targetId?: string; eventId?: string }) => void;
  registerOpenDrawerCallback: (fn: (() => void) | null) => void;
  registerCloseDrawerCallback: (fn: (() => void) | null) => void;
  measureTick: number;
  bumpMeasureTick: () => void;
}

export interface TutorialContextValue extends TutorialState, TutorialActions {
  currentStep: TutorialStep | null;
  totalSteps: number;
  currentTargetRect: TutorialTargetRect | null;
}

export interface TutorialProviderProps {
  children: ReactNode;
}
