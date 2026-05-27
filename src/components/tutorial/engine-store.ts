/**
 * Tutorial v5 — central state store.
 *
 * Stripped-down zustand store: no precondition handlers, no screen-ready
 * signals, no measure-tick scheduling, no drawer callbacks. All side-channels
 * removed — the engine talks directly to React via store state, period.
 */
import { create } from "zustand";
import type {
  TutorialEngineState,
  TutorialStep,
  TutorialTargetRect,
  TutorialSceneState,
} from "./engine-types";

export interface TutorialStoreState extends TutorialEngineState {
  /** Mirrors the current step's sceneState so React can react to changes
   *  immediately on `goToStep`/`next`, without re-deriving from steps[index]. */
  activeSceneState: TutorialSceneState;
  /** Slot rect cache, keyed by slot name. Populated by useSlot's onLayout. */
  registeredSlots: Map<string, TutorialTargetRect>;
}

export interface TutorialStoreActions {
  setActive(active: boolean): void;
  setPendingStart(pending: boolean): void;
  setCurrentStepIndex(index: number): void;
  setSteps(steps: TutorialStep[]): void;
  setActiveSlot(slot: string | null): void;
  setActiveTargetRect(rect: TutorialTargetRect | null): void;
  setActiveSceneState(state: TutorialSceneState): void;
  setAwaitingAction(awaiting: boolean): void;
  markCompleted(stepId: string): void;
  resetAll(): void;

  registerSlot(slot: string, rect: TutorialTargetRect): void;
  unregisterSlot(slot: string): void;
}

export type TutorialStore = TutorialStoreState & TutorialStoreActions;

const INITIAL: TutorialStoreState = {
  isActive: false,
  isPendingStart: false,
  currentStepIndex: 0,
  steps: [],
  completedStepIds: [],
  awaitingAction: false,
  activeSlot: null,
  activeTargetId: null,
  activeTargetRect: null,
  activeSceneState: {},
  runtimeStatus: "idle",
  isCelebrating: false,
  registeredSlots: new Map(),
};

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  ...INITIAL,

  setActive: (isActive) => set({ isActive }),
  setPendingStart: (isPendingStart) => set({ isPendingStart }),
  setCurrentStepIndex: (currentStepIndex) => set({ currentStepIndex }),
  setSteps: (steps) => set({ steps }),

  setActiveSlot: (slot) => {
    const cached =
      slot != null ? get().registeredSlots.get(slot) ?? null : null;
    set({ activeSlot: slot, activeTargetRect: cached });
  },

  setActiveTargetRect: (activeTargetRect) => set({ activeTargetRect }),
  setActiveSceneState: (activeSceneState) => set({ activeSceneState }),
  setAwaitingAction: (awaitingAction) => set({ awaitingAction }),

  markCompleted: (stepId) =>
    set((state) =>
      state.completedStepIds.includes(stepId)
        ? state
        : { completedStepIds: [...state.completedStepIds, stepId] },
    ),

  resetAll: () =>
    set((state) => ({
      ...INITIAL,
      completedStepIds: state.completedStepIds,
      registeredSlots: new Map(),
    })),

  registerSlot: (slot, rect) =>
    set((state) => {
      const nextSlots = new Map(state.registeredSlots);
      nextSlots.set(slot, rect);
      // If this slot is the one currently being highlighted, mirror the rect
      // so the spotlight updates in the same tick the scene mounts.
      if (slot === state.activeSlot) {
        return { registeredSlots: nextSlots, activeTargetRect: rect };
      }
      return { registeredSlots: nextSlots };
    }),

  unregisterSlot: (slot) =>
    set((state) => {
      if (!state.registeredSlots.has(slot)) return state;
      const nextSlots = new Map(state.registeredSlots);
      nextSlots.delete(slot);
      if (slot === state.activeSlot) {
        return { registeredSlots: nextSlots, activeTargetRect: null };
      }
      return { registeredSlots: nextSlots };
    }),
}));
