/**
 * Tutorial diagnostic logger — streams events to a host listener on the
 * dev PC and ALSO writes to console.log so the trace appears in the
 * Expo / Metro dev-server terminal.
 *
 * How it gets to the PC:
 *  - Every `tutorialLog(...)` call emits `console.log("[TUT] ...")`. The
 *    Expo / Metro dev server prints these to your terminal. If you pipe
 *    that terminal to a file (e.g. `npx expo start 2>&1 | tee /tmp/tut.log`)
 *    the assistant can read it directly.
 *  - In parallel, each entry is POSTed to `TUTORIAL_LOG_HOST` (set at
 *    build time or via the global). If a tiny HTTP listener is running
 *    on the PC, the trace is captured in real time without needing the
 *    Expo terminal redirect.
 *
 * Disable streaming by setting `TUTORIAL_LOG_HOST = ""` or never
 * configuring it. The console.log path still works.
 */

// Resolution order:
//   1. global.__TUTORIAL_LOG_HOST__  (set at runtime, e.g. from a launch
//      script or for testing)
//   2. process.env.EXPO_PUBLIC_TUTORIAL_LOG_HOST  (Expo public env var,
//      inlined at build time — set in .env or via the CLI)
//   3. Hard-coded fallback below. Change the IP to match the dev PC's
//      LAN address that your phone can reach. Port 9988 is the
//      assistant's listener default.
//
// LIVE STREAMING is GATED on `global.__TUTORIAL_LOG_CAPTURE__ === true`.
// Network POSTs add ~5-15 ms each; in a 2500-event tutorial session that
// is 30-40 seconds of JS-thread blocking. Enable only when capturing a
// trace for diagnostics — toggle from the dev step picker's "Dump" path
// or via a debugger.
declare const global: {
  __TUTORIAL_LOG_HOST__?: string;
  __TUTORIAL_LOG_CAPTURE__?: boolean;
};
const LOG_HOST: string =
  (typeof global !== "undefined" && global.__TUTORIAL_LOG_HOST__) ||
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_TUTORIAL_LOG_HOST) ||
  "http://192.168.0.12:9988";
const isCaptureEnabled = (): boolean =>
  typeof global !== "undefined" && global.__TUTORIAL_LOG_CAPTURE__ === true;

export type TutorialLogCategory =
  | "ENGINE"
  | "STORE"
  | "OVERLAY"
  | "TOOLTIP"
  | "TARGET"
  | "SORTABLE"
  | "PROVIDER"
  | "PRECOND";

interface LogEntry {
  t: number;
  cat: TutorialLogCategory;
  event: string;
  data?: unknown;
}

const MAX_ENTRIES = 4000;
const buffer: LogEntry[] = [];
const startedAt = Date.now();

function safeStringify(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v, (_k, val) => {
      if (typeof val === "function") return "[fn]";
      if (val instanceof Map) {
        return { __map: Array.from(val.keys()).map((k) => String(k)) };
      }
      return val;
    });
  } catch {
    return "[unserialisable]";
  }
}

function formatLine(entry: LogEntry): string {
  const dataStr = entry.data !== undefined ? ` ${safeStringify(entry.data)}` : "";
  return `[TUT +${entry.t}ms ${entry.cat}] ${entry.event}${dataStr}`;
}

// Tiny network sender. Fire-and-forget; never throws back to the caller.
let _sendError: string | null = null;
function send(entry: LogEntry): void {
  if (!LOG_HOST) return;
  if (!isCaptureEnabled()) return;
  try {
    fetch(`${LOG_HOST}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        t: entry.t,
        cat: entry.cat,
        event: entry.event,
        data: entry.data,
        clientStartedAt: startedAt,
      }),
    }).catch((e: unknown) => {
      if (!_sendError) {
        _sendError = e instanceof Error ? e.message : String(e);
        // eslint-disable-next-line no-console
        console.warn(`[TUT-LOG] send failed (host=${LOG_HOST}): ${_sendError}`);
      }
    });
  } catch (e) {
    if (!_sendError) {
      _sendError = e instanceof Error ? e.message : String(e);
    }
  }
}

export function tutorialLog(
  category: TutorialLogCategory,
  event: string,
  data?: unknown,
): void {
  const entry: LogEntry = {
    t: Date.now() - startedAt,
    cat: category,
    event,
    data,
  };
  if (buffer.length >= MAX_ENTRIES) buffer.shift();
  buffer.push(entry);
  // console.log is similarly expensive on the JS bridge in dev; only emit
  // when capturing. Use `tutorialLogger.dumpToConsole()` to print the
  // whole buffer on-demand.
  if (__DEV__ && isCaptureEnabled()) {
    // eslint-disable-next-line no-console
    console.log(formatLine(entry));
  }
  send(entry);
}

function getLogsAsText(): string {
  const header = [
    "═══ Tutorial diagnostic log ═══",
    `started   : ${new Date(startedAt).toISOString()}`,
    `host      : ${LOG_HOST || "(disabled)"}`,
    `entries   : ${buffer.length} (cap ${MAX_ENTRIES})`,
    `send error: ${_sendError ?? "(none)"}`,
    `dumped    : ${new Date().toISOString()}`,
    "───",
    "",
  ].join("\n");
  return header + buffer.map(formatLine).join("\n") + "\n";
}

export const tutorialLogger = {
  /** Total entries in the buffer. */
  size(): number {
    return buffer.length;
  },
  /** Print the entire buffer to console.log at once. Useful when the dev
   *  server is filtering; one `[TUT-DUMP-BEGIN]` … `[TUT-DUMP-END]` block
   *  is easier to grep than scattered lines. */
  dumpToConsole(): void {
    // eslint-disable-next-line no-console
    console.log("[TUT-DUMP-BEGIN]");
    // eslint-disable-next-line no-console
    console.log(getLogsAsText());
    // eslint-disable-next-line no-console
    console.log("[TUT-DUMP-END]");
  },
  /** Clear the buffer. */
  clear(): void {
    buffer.length = 0;
    tutorialLog("ENGINE", "LOG_CLEARED");
  },
  /** Current host URL the logger is POSTing to (empty string = disabled). */
  host(): string {
    return LOG_HOST;
  },
  /** Last network error encountered when POSTing, if any. */
  lastSendError(): string | null {
    return _sendError;
  },
  /** Is live-streaming + per-event console.log currently on? */
  isCaptureEnabled(): boolean {
    return isCaptureEnabled();
  },
  /** Toggle live capture (network POST + per-event console.log). When
   *  disabled, events are still buffered in memory and can be inspected
   *  via `dumpToConsole`. */
  setCaptureEnabled(on: boolean): void {
    if (typeof global !== "undefined") {
      global.__TUTORIAL_LOG_CAPTURE__ = on;
    }
  },
};
