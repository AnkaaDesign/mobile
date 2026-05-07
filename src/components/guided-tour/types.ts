import type { ReactNode } from "react";

export type TourPlayMode = "auto" | "manual";
export type TourStepMode = "narrate" | "interactive";
export type TourTooltipPlacement = "top" | "bottom" | "center";

export interface TourTargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TourStep {
  id: string;
  screen: string;
  targetId?: string;
  title: string;
  description: string;
  mode?: TourStepMode;
  leaderOnly?: boolean;
  placement?: TourTooltipPlacement;
  ctaLabel?: string;
  autoAdvanceMs?: number;
  beforeEnter?: () => Promise<void> | void;
  afterExit?: () => Promise<void> | void;
}

export interface TourState {
  isActive: boolean;
  currentStepIndex: number;
  steps: TourStep[];
  playMode: TourPlayMode;
  isPaused: boolean;
  awaitingInteraction: boolean;
}

export interface TourActions {
  start: (opts?: { fromStepIndex?: number }) => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  skip: () => void;
  togglePlayMode: () => void;
  setPlayMode: (mode: TourPlayMode) => void;
  registerTarget: (id: string, rect: TourTargetRect) => void;
  unregisterTarget: (id: string) => void;
  notifyInteraction: (targetId: string) => void;
  resetCompletion: () => Promise<void>;
}

export interface TourContextValue extends TourState, TourActions {
  currentStep: TourStep | null;
  totalSteps: number;
  currentTargetRect: TourTargetRect | null;
}

export interface TourProviderProps {
  children: ReactNode;
}
