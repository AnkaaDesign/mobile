/**
 * useFormFlow — single hook the new <FormScreen> template (and direct
 * area-agent screens) consume to coordinate submit, cancel, dirty-form
 * confirmation, terminal-status blocking, and post-submit navigation.
 *
 * Closes 3 audit-confirmed bug classes:
 *   1. `goBack()` in mutation `finally` — moved into success-only path.
 *   2. `router.push` on cancel — replaced by `nav.goBack({ fallback })`.
 *   3. Terminal-status entities being silently editable — `isBlocked` flag
 *      is consumed by <FormScreen> to render a read-only banner.
 *
 * Multi-step (`steps: [...]`) variant is exposed via the `steps` typed
 * surface so RH wizards (`bonus/simulacao`, `nivel-de-desempenho`) can
 * build on it. The per-step UX (next/prev animation, validation gating,
 * progress bar) is owned by Area 4 — TODO marker below.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import type { UseFormReturn } from "react-hook-form";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { useNav } from "@/contexts/nav";
import type { AppRoute } from "@/constants/routes.types";
import { isEditableStatus } from "@/constants/editable-statuses";

/**
 * Accept either a `UseMutationResult` (legacy form, when the caller already
 * has a `useMutation` instance) or a callback `(data) => Promise<TResult>`.
 *
 * Most real-world entity hooks expose `createAsync` / `updateAsync` callbacks
 * with bespoke argument shapes (`{ data, include }` etc.) that don't fit a
 * raw `mutateAsync(formData)` signature. The callback form lets the caller
 * write `mutation: (data) => createAsync(data)` and skip the wrapper boilerplate.
 */
export type FormFlowMutation<TForm, TResult> =
  | UseMutationResult<TResult, unknown, TForm>
  | ((data: TForm) => Promise<TResult>);

export interface FormFlowStep<TForm = any> {
  /** Stable id for telemetry / progress display. */
  id: string;
  /** Visible step title. */
  title: string;
  /** Optional subtitle / hint. */
  subtitle?: string;
  /**
   * Field paths that this step owns. The default `submit()` runs RHF
   * validation only against these fields when advancing past the step.
   */
  fields?: Array<keyof TForm | string>;
}

export interface UseFormFlowOpts<TForm extends Record<string, any>, TResult> {
  /** RHF form instance — needed for dirty-state checks and step validation. */
  form?: UseFormReturn<TForm>;
  /**
   * Either a `UseMutationResult` (when the caller already has a
   * `useMutation` instance) or a `(data) => Promise<TResult>` callback.
   * Discriminated at runtime via `'mutateAsync' in input`.
   */
  mutation: FormFlowMutation<TForm, TResult>;
  /** Where to navigate on success. */
  successRoute?: (result: TResult) => AppRoute;
  /** push, replace, or dismissTo. Default: 'dismissTo'. */
  successAction?: "replace" | "dismissTo" | "push";
  /** Where to fall back on cancel when history is empty. */
  cancelFallback?: AppRoute;
  /** Confirmation copy for the dirty-form cancel dialog. */
  dirtyConfirmText?: string;
  onSuccess?: (result: TResult) => void;
  onError?: (err: unknown) => void;
  /**
   * Block submit/edit when the supplied entity is in a terminal status.
   * Consumed by <FormScreen> to render a read-only banner.
   */
  blockOnTerminalStatus?: {
    entity: any;
    editable: readonly string[];
    field?: string;
  };
  /**
   * Multi-step wizard configuration. When provided, `currentStepIndex`,
   * `nextStep`, `prevStep`, `isFirstStep`, `isLastStep` are populated.
   * TODO(area-4): wizard UX (validation gating, animated transitions,
   * progress bar) is the area-4 RH agent's job — this hook only owns the
   * step-state plumbing.
   */
  steps?: FormFlowStep<TForm>[];
}

export interface UseFormFlowResult<TForm, TResult> {
  /** Submit the form (validates → runs mutation → navigates on success). */
  submit: () => Promise<void>;
  /** Cancel — confirms if dirty, then `nav.goBack({ fallback })`. */
  cancel: () => Promise<void>;
  isSubmitting: boolean;
  /** True iff `blockOnTerminalStatus` matches and entity is non-editable. */
  isBlocked: boolean;

  // Multi-step surface (only meaningful when `steps` was supplied).
  steps: FormFlowStep<TForm>[];
  currentStepIndex: number;
  currentStep: FormFlowStep<TForm> | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextStep: () => Promise<boolean>;
  prevStep: () => void;
  goToStep: (index: number) => void;

  // Underlying primitives, exposed for templates that need them.
  mutation: UseMutationResult<TResult, unknown, TForm>;
}

/**
 * Default copy for the dirty-form cancel confirmation.
 */
const DEFAULT_DIRTY_TEXT =
  "Você tem alterações não salvas. Deseja descartá-las e sair?";

function isMutationResult<TForm, TResult>(
  m: FormFlowMutation<TForm, TResult>,
): m is UseMutationResult<TResult, unknown, TForm> {
  return typeof m === "object" && m !== null && "mutateAsync" in m;
}

export function useFormFlow<TForm extends Record<string, any>, TResult>(
  opts: UseFormFlowOpts<TForm, TResult>,
): UseFormFlowResult<TForm, TResult> {
  const nav = useNav();
  const isSubmittingRef = useRef(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = opts.steps ?? [];
  const isMultiStep = steps.length > 0;

  // When the caller passes a callback, build a UseMutationResult internally
  // so `mutation.isPending` / `mutation.mutateAsync` work uniformly. The
  // callback identity is read through a ref so re-renders don't reset
  // pending state on the internal mutation. The internal mutation is only
  // exercised when the input is a callback — when a real `UseMutationResult`
  // is supplied, the internal one stays unused.
  const callbackRef = useRef<((data: TForm) => Promise<TResult>) | null>(null);
  callbackRef.current = isMutationResult(opts.mutation) ? null : opts.mutation;

  const internalMutation = useMutation<TResult, unknown, TForm>({
    mutationFn: async (data) => {
      const cb = callbackRef.current;
      if (!cb) throw new Error("useFormFlow: callback mutation invoked with no callback set");
      return cb(data);
    },
  });

  const effectiveMutation: UseMutationResult<TResult, unknown, TForm> = isMutationResult(
    opts.mutation,
  )
    ? opts.mutation
    : internalMutation;

  const isBlocked = useMemo(() => {
    if (!opts.blockOnTerminalStatus) return false;
    const { entity, editable, field } = opts.blockOnTerminalStatus;
    if (!entity) return false;
    const status = field ? entity[field] : entity.status;
    return !isEditableStatus(status, editable);
  }, [opts.blockOnTerminalStatus]);

  const performSubmit = useCallback(
    async (data: TForm): Promise<void> => {
      // Run mutation under the loading overlay. On success: navigate via the
      // requested action. On error: end overlay (withLoading does), call
      // onError, and DO NOT navigate — the user stays on the form so they
      // can retry. (Bug fix: goBack() was previously called in finally,
      // which navigated away on errors.)
      try {
        const result = await nav.withLoading(async () => effectiveMutation.mutateAsync(data));
        opts.onSuccess?.(result);
        if (opts.successRoute) {
          const target = opts.successRoute(result);
          const action = opts.successAction ?? "dismissTo";
          if (action === "replace") nav.replace(target);
          else if (action === "push") nav.push(target);
          else nav.dismissTo(target);
        }
      } catch (err) {
        opts.onError?.(err);
        // Intentionally do not navigate.
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nav, effectiveMutation, opts.successRoute, opts.successAction, opts.onSuccess, opts.onError],
  );

  const submit = useCallback(async () => {
    if (isSubmittingRef.current) return;
    if (isBlocked) return;

    isSubmittingRef.current = true;
    try {
      if (opts.form) {
        await new Promise<void>((resolve, reject) => {
          opts.form!.handleSubmit(
            async (data) => {
              try {
                await performSubmit(data as unknown as TForm);
                resolve();
              } catch (e) {
                reject(e);
              }
            },
            () => {
              // Validation failure — RHF surfaces field-level errors.
              resolve();
            },
          )();
        });
      } else {
        // No form supplied — let the caller drive mutation directly via
        // submit() with no payload. Useful for confirm-style screens.
        await performSubmit({} as TForm);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  }, [opts.form, performSubmit, isBlocked]);

  const cancel = useCallback(async () => {
    const isDirty = !!opts.form?.formState.isDirty;

    const goBack = () => {
      if (opts.cancelFallback) {
        nav.goBack({ fallback: opts.cancelFallback });
      } else {
        nav.goBack();
      }
    };

    if (!isDirty) {
      goBack();
      return;
    }

    return new Promise<void>((resolve) => {
      Alert.alert(
        "Descartar alterações?",
        opts.dirtyConfirmText ?? DEFAULT_DIRTY_TEXT,
        [
          { text: "Continuar editando", style: "cancel", onPress: () => resolve() },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => {
              goBack();
              resolve();
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolve() },
      );
    });
  }, [opts.form, opts.cancelFallback, opts.dirtyConfirmText, nav]);

  // ---------- Multi-step machinery ----------
  const currentStep = isMultiStep ? steps[stepIndex] ?? null : null;
  const isFirstStep = !isMultiStep || stepIndex === 0;
  const isLastStep = !isMultiStep || stepIndex === steps.length - 1;

  const nextStep = useCallback(async (): Promise<boolean> => {
    if (!isMultiStep) return false;
    if (isLastStep) return false;
    // Validate the fields owned by this step before advancing.
    if (opts.form && currentStep?.fields?.length) {
      const ok = await opts.form.trigger(currentStep.fields as any);
      if (!ok) return false;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    return true;
  }, [isMultiStep, isLastStep, opts.form, currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (!isMultiStep) return;
    setStepIndex((i) => Math.max(i - 1, 0));
  }, [isMultiStep]);

  const goToStep = useCallback(
    (index: number) => {
      if (!isMultiStep) return;
      const clamped = Math.max(0, Math.min(index, steps.length - 1));
      setStepIndex(clamped);
    },
    [isMultiStep, steps.length],
  );

  return {
    submit,
    cancel,
    isSubmitting: effectiveMutation.isPending,
    isBlocked,
    steps,
    currentStepIndex: stepIndex,
    currentStep,
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep,
    goToStep,
    mutation: effectiveMutation,
  };
}
