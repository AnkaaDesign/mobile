import type { ReactNode } from "react";

export type TutorialStepKind = "narration" | "showcase" | "interactive";

export type TutorialPlacement = "top" | "bottom" | "center";

export type TutorialActionType =
  | "tap"
  | "navigate"
  | "input"
  | "submit"
  | "drawer-open"
  | "continue";

export interface TutorialTargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
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
  pulseTarget?: boolean;
  celebrate?: boolean;
}

export interface TutorialState {
  isActive: boolean;
  isPendingStart: boolean;
  currentStepIndex: number;
  steps: TutorialStep[];
  completedStepIds: string[];
  awaitingAction: boolean;
  isCelebrating: boolean;
}

export interface TutorialActions {
  start: (opts?: { fromStepIndex?: number }) => Promise<void>;
  stop: () => Promise<void>;
  next: () => void;
  skip: () => Promise<void>;
  complete: () => Promise<void>;
  reset: () => Promise<void>;
  setPendingStart: (pending: boolean) => void;
  registerTarget: (id: string, rect: TutorialTargetRect) => void;
  unregisterTarget: (id: string) => void;
  notifyAction: (action: TutorialActionType, payload?: { targetId?: string; eventId?: string }) => void;
}

export interface TutorialContextValue extends TutorialState, TutorialActions {
  currentStep: TutorialStep | null;
  totalSteps: number;
  currentTargetRect: TutorialTargetRect | null;
}

export interface TutorialProviderProps {
  children: ReactNode;
}
