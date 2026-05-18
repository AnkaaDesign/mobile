/**
 * Lightweight runtime flag + mock lookup that lets api-client services
 * short-circuit their real network calls and return tutorial demo data
 * when the tutorial is active.
 *
 * Why this exists: react-query's `setQueryDefaults` sets a default queryFn,
 * but `createEntityHooks`'s `useInfiniteList` provides an inline queryFn
 * that takes precedence. So the mock queryFn never runs for the task-
 * detail cuts/observations/airbrushings tables — they hit the real
 * `service.getMany` and either fail (no backend) or return empty.
 *
 * Instead of redesigning the hook factory, services check `getTutorialMockList`
 * at the top of their getMany methods. If the tutorial is active AND demo
 * records exist for the entity, the service returns them directly. This
 * gives us a single, surgical bypass per entity without touching the
 * react-query layer.
 */

type Records = ReadonlyArray<any> | Record<string, any> | null | undefined;

interface ListEnvelope {
  success: true;
  message: "ok";
  data: any[];
  meta: {
    page: number;
    limit: number;
    totalRecords: number;
    hasNextPage: boolean;
    totalPages: number;
  };
}

let active = false;
const recordsByEntity = new Map<string, Records>();

export function setTutorialRuntimeActive(
  isActive: boolean,
  recordsByEntityArg?: Record<string, Records>,
): void {
  active = isActive;
  recordsByEntity.clear();
  if (isActive && recordsByEntityArg) {
    for (const [k, v] of Object.entries(recordsByEntityArg)) {
      recordsByEntity.set(k, v);
    }
  }
}

export function isTutorialRuntimeActive(): boolean {
  return active;
}

function wrap(data: any[]): ListEnvelope {
  return {
    success: true,
    message: "ok",
    data,
    meta: {
      page: 1,
      limit: 50,
      totalRecords: data.length,
      hasNextPage: false,
      totalPages: 1,
    },
  };
}

/**
 * Return a list envelope for the given entity if the tutorial is active,
 * filtered by `where.taskId` (or returning all records) when applicable.
 * Pass null/undefined if the entity isn't registered — the service should
 * then fall through to its real network call.
 */
export function getTutorialMockList(
  entity: string,
  params?: any,
): ListEnvelope | null {
  if (!active) return null;
  const records = recordsByEntity.get(entity);
  if (!records || !Array.isArray(records)) return null;
  const taskId = params?.where?.taskId;
  if (typeof taskId === "string") {
    const filtered = records.filter(
      (r: any) => r?.task?.id === taskId || r?.taskId === taskId,
    );
    return wrap(filtered);
  }
  return wrap([...records]);
}

/**
 * Return a single record by id, or the first record as a fallback. Used
 * by detail endpoints that fetch one entity by primary key.
 */
export function getTutorialMockDetail<T = any>(
  entity: string,
  id: string,
): T | null {
  if (!active) return null;
  const records = recordsByEntity.get(entity);
  if (!records || !Array.isArray(records)) return null;
  const match = records.find((r: any) => r?.id === id) ?? records[0] ?? null;
  return match as T | null;
}

// ─── Secullum / Personal endpoints ─────────────────────────────────────────
// These don't fit the generic entity-list shape — Secullum returns
// nested `{ data: { data: [...] } }` payloads or per-date singletons.
// Helpers below short-circuit the api-client's network calls for the four
// endpoints used by the Justificar Ausência / Ajustar Ponto tutorial flow.

export function getTutorialMockSecullumMissingDays(): {
  data: {
    success: boolean;
    message: string;
    data?: Array<{
      date: string;
      weekdayPt: string;
      saldo?: string | null;
      totalFaltas?: string | null;
      existePeriodoEncerrado: boolean;
    }>;
  };
} | null {
  if (!active) return null;
  if (!recordsByEntity.has("secullumMissingDays")) return null;
  const records = recordsByEntity.get("secullumMissingDays") as any[] | undefined;
  if (!records) return null;
  return {
    data: { success: true, message: "ok", data: records as any },
  };
}

export function getTutorialMockSecullumJustificativas(): {
  data: {
    success: boolean;
    message: string;
    data: Array<{
      id: number;
      nomeCompleto: string;
      exigirFotoAtestado: boolean;
      naoPermitirFuncionariosUtilizar: boolean;
    }>;
  };
} | null {
  if (!active) return null;
  if (!recordsByEntity.has("secullumJustificativas")) return null;
  const records = recordsByEntity.get("secullumJustificativas") as any[] | undefined;
  if (!records) return null;
  return {
    data: { success: true, message: "ok", data: records as any },
  };
}

export function getTutorialMockSecullumBatidasForDate(_date: string): {
  data: { success: boolean; message: string; data: any };
} | null {
  if (!active) return null;
  if (!recordsByEntity.has("secullumBatidas")) return null;
  const records = recordsByEntity.get("secullumBatidas") as any;
  return { data: { success: true, message: "ok", data: records } };
}

export function getTutorialMockSecullumSolicitacaoByDate(_date: string): {
  data: { success: boolean; message: string; data: any };
} | null {
  if (!active) return null;
  if (!recordsByEntity.has("secullumSolicitacao")) return null;
  const records = recordsByEntity.get("secullumSolicitacao") as any;
  // null means "no existing solicitação for this date" — render the form.
  return { data: { success: true, message: "ok", data: records } };
}

/**
 * Mock the personal "my-calculations" Secullum endpoint. The hook
 * (`useMySecullumCalculations`) attaches its own queryFn, which beats
 * react-query's `setQueryDefaults` mock fallback — so without this
 * short-circuit at the service layer, real users in tutorial mode hit
 * the real backend (and unregistered users get an error page that hides
 * the icons the tutorial spotlights).
 */
export function getTutorialMockSecullumCalculations(): {
  data: any;
} | null {
  if (!active) return null;
  if (!recordsByEntity.has("secullumCalculations")) return null;
  const records = recordsByEntity.get("secullumCalculations") as any;
  return { data: records };
}

/**
 * Mock the Inclusão de Ponto config endpoint. Returns a believable shape with
 * no `funcionarioAfastado` flag and an empty perimeter list so the capture
 * screen would render in "no perimeter restriction" mode if the user ever
 * lands there. The tutorial deliberately stays on the list screen — capture
 * needs real GPS/camera and isn't safe to drive from the tutorial.
 */
export function getTutorialMockInclusaoPontoConfig(): {
  data: { success: boolean; message: string; data: any };
} | null {
  if (!active) return null;
  if (!recordsByEntity.has("inclusaoPontoConfig")) return null;
  const records = recordsByEntity.get("inclusaoPontoConfig") as any;
  return { data: { success: true, message: "ok", data: records } };
}

/**
 * Mock the Inclusão de Ponto pendências endpoint. Returns a list with one
 * Aceita, one Processando and one Rejeitada entry so the tutorial can teach
 * all three badge states from the same screen.
 */
export function getTutorialMockInclusaoPontoPendencias(): {
  data: { success: boolean; message: string; data: any[] };
} | null {
  if (!active) return null;
  if (!recordsByEntity.has("inclusaoPontoPendencias")) return null;
  const records = recordsByEntity.get("inclusaoPontoPendencias") as any[] | undefined;
  if (!records) return null;
  return { data: { success: true, message: "ok", data: records } };
}
