/**
 * Tutorial v5 — fake-pages engine type contract.
 *
 * Replaces the v4 step shape (real route + targetId + preconditions) with a
 * scene-based model: every step names a scene component the engine renders
 * inside an isolated <TutorialStage>. There is no router, no queryClient
 * coupling, no precondition handlers, no screen-ready signalling.
 *
 *   - `scene`        — id of the fake screen component to mount
 *   - `sceneState`   — declarative state the scene renders directly
 *                      (drawer open/closed, edit mode, expanded row, …)
 *   - `highlight`    — slot name inside the scene to spotlight
 *
 * The engine is a pure state machine over a flat step array. Step transitions
 * are synchronous setState calls. Jumping to any step is identical to a
 * forward walk: one zustand update, scene re-renders, slot rect updates.
 */
import type { ReactNode } from "react";

export type TutorialStepKind = "narration" | "showcase" | "interactive";
export type TutorialPlacement = "top" | "bottom" | "center";
export type TutorialActionType = "tap" | "continue";

export interface TutorialTargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TutorialUserContext {
  user: any;
  isLeader: boolean;
  isBonifiable: boolean;
}

// ─── Scene registry ────────────────────────────────────────────────────────

/**
 * Every scene component receives a fully-typed `state` prop that drives its
 * rendering — drawer visibility, edit-mode toggles, expanded rows, etc. The
 * shape is intentionally flat and free-form so each scene can pick the keys
 * it needs without growing a monster union.
 */
export interface TutorialSceneState {
  // Chrome
  drawer?: "closed" | "menu" | "notifications";

  // Home scene
  homeEditMode?: boolean;
  homeAddWidgetSheet?: boolean;
  homeWidgetPresent?: boolean;

  // Incluir-ponto scene
  incluirPontoExpandedRow?: number | null;
  incluirPontoCaptureFlow?: "idle" | "capturing" | "ready" | "submitting";

  // Justificar-ausência form
  justificarPeriodoTipo?:
    | "dia-inteiro"
    | "periodo-1"
    | "periodo-2"
    | "periodo-3"
    | "especifico";
  justificarAusenciaEm?: "dia" | "periodo";
  justificarMotivosOpen?: boolean;

  // Ajustar-ponto form
  ajustarPontoPrefilled?: boolean;

  // EPI flow
  epiSignStage?: "idle" | "biometric" | "done";

  // Mensagens modal
  mensagensModalOpen?: boolean;

  // Generic showcase flags
  [key: string]: unknown;
}

export type SceneId =
  | "home"
  | "cronograma"
  | "task-detail"
  | "historico"
  | "observacoes"
  | "recorte"
  | "cut-detail"
  | "pessoal-hub"
  | "meus-pontos"
  | "justificar-list"
  | "justificar-form"
  | "ajustar-ponto"
  | "incluir-ponto"
  | "meus-feriados"
  | "meus-epis"
  | "epis-request"
  | "epis-detail"
  | "minhas-mensagens"
  | "minhas-advertencias"
  | "meus-emprestimos"
  | "minhas-movimentacoes"
  | "meu-bonus"
  | "meu-bonus-historico"
  | "meu-bonus-simulacao"
  | "meu-pessoal"
  | "preferencias"
  | "notif-prefs"
  | "perfil";

// ─── Step shape ────────────────────────────────────────────────────────────

export interface TutorialStep {
  id: string;
  kind: TutorialStepKind;

  /** Scene component to mount in the fake stage. */
  scene: SceneId;
  /** Declarative state passed to the scene as a prop. */
  sceneState?: TutorialSceneState;
  /** Slot name inside the scene to spotlight. Omit for full-screen tooltip. */
  highlight?: string;

  title: string;
  description: string;
  placement?: TutorialPlacement;
  ctaLabel?: string;
  hint?: string;

  /** "continue" = CTA only. "tap" = user must tap the highlighted slot. */
  expectedAction?: TutorialActionType;
  /** Filter steps for non-applicable user contexts (leader / bonifiable). */
  condition?: (ctx: TutorialUserContext) => boolean;

  // Visual flair
  pulseTarget?: boolean;
  celebrate?: boolean;
  dimBackground?: boolean;
  tooltipPinToScreenTop?: boolean;
  /**
   * Pin the tooltip to the bottom of the screen even when the step has a
   * highlight (which would otherwise anchor the tooltip next to the spotlight
   * rect). The spotlight/pulse/tap on the highlighted slot stay intact — only
   * the tooltip card is detached and dropped to the bottom. Mirror of
   * `tooltipPinToScreenTop`.
   */
  tooltipPinToScreenBottom?: boolean;
  /** Nudge the tooltip card down (+) or up (−) by N px. */
  tooltipOffsetY?: number;
}

// ─── Engine state ──────────────────────────────────────────────────────────

export interface TutorialEngineState {
  isActive: boolean;
  isPendingStart: boolean;
  currentStepIndex: number;
  steps: TutorialStep[];
  completedStepIds: string[];
  awaitingAction: boolean;
  /** Mirror of currentStep.highlight for fast selector access. */
  activeSlot: string | null;
  /** v4 alias for activeSlot. */
  activeTargetId: string | null;
  /** Spotlight rect in absolute screen coords (from measureInWindow). */
  activeTargetRect: TutorialTargetRect | null;
  /** @deprecated kept for v4 compat */
  runtimeStatus: "idle" | "starting" | "running" | "stopping";
  /** @deprecated kept for v4 compat */
  isCelebrating: boolean;
}

export interface TutorialActions {
  start: (opts?: { fromStepIndex?: number }) => Promise<void>;
  stop: () => Promise<void>;
  next: () => void;
  goToStep: (index: number) => void;
  skip: () => Promise<void>;
  complete: () => Promise<void>;
  reset: () => Promise<void>;
  notifyAction: (action: TutorialActionType, payload?: unknown) => void;
  setPendingStart: (pending: boolean) => void;

  // ─── v4 compat (no-ops in v5) ───────────────────────────────────────────
  /** @deprecated v5 has no DOM target registry. */
  registerTarget: (id: string, rect: TutorialTargetRect) => void;
  /** @deprecated */
  unregisterTarget: (id: string) => void;
  /** @deprecated */
  registerAction: (id: string, fn: () => void) => void;
  /** @deprecated */
  unregisterAction: (id: string) => void;
  /** @deprecated v5 fake scenes render their own state — no precondition handlers. */
  registerPrecondition: (handler: unknown) => () => void;
  /** @deprecated */
  invokeTargetAction: (id: string) => void;
  /** @deprecated */
  registerOpenDrawerCallback: (fn: (() => void) | null) => void;
  /** @deprecated */
  registerCloseDrawerCallback: (fn: (() => void) | null) => void;
  /** @deprecated v5 never waits for real-screen ready signals. */
  markScreenReady: (route: string) => void;
}

export interface TutorialContextValue
  extends TutorialEngineState,
    TutorialActions {
  currentStep: TutorialStep | null;
  totalSteps: number;
  currentTargetRect: TutorialTargetRect | null;
}

export interface TutorialProviderProps {
  children: ReactNode;
}

// ─── Timing constants ──────────────────────────────────────────────────────

export const TUTORIAL_TIMINGS = {
  SHOWCASE_DEFAULT_MS: 2500,
  SPOTLIGHT_FADE_IN_MS: 160,
  SPOTLIGHT_FADE_OUT_MS: 120,
} as const;
