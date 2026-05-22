/**
 * v4 → v5 compat shim. Real-page code (api-client services) imports these
 * helpers to short-circuit list/detail queries when the tutorial is active.
 * In v5 the tutorial renders fake scenes — it never goes through the real
 * API — so these always return null/false.
 *
 * Callers eventually get cleaned up; this file lets them keep compiling.
 */
export function isTutorialRuntimeActive(): boolean {
  return false;
}

export function getTutorialMockList<T = unknown>(
  _entity: string,
  _params?: unknown,
): T | null {
  return null;
}

export function getTutorialMockDetail<T = unknown>(
  _entity: string,
  _id: string,
): T | null {
  return null;
}

export function getTutorialMockSecullumMissingDays(): unknown {
  return null;
}
export function getTutorialMockSecullumJustificativas(): unknown {
  return null;
}
export function getTutorialMockSecullumBatidasForDate(_date: string): unknown {
  return null;
}
export function getTutorialMockSecullumSolicitacaoByDate(_date: string): unknown {
  return null;
}
export function getTutorialMockSecullumCalculations(): unknown {
  return null;
}
export function getTutorialMockInclusaoPontoConfig(): unknown {
  return null;
}
export function getTutorialMockInclusaoPontoPendencias(): unknown {
  return null;
}

export function setTutorialRuntimeActive(_active: boolean, _records?: unknown): void {
  /* no-op */
}
