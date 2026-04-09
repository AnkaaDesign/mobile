import { createContext, useContext, useCallback, useMemo, useRef, useState, ReactNode } from "react";

// ─── Actions context (STABLE — never changes, so consumers never re-render) ───
interface SwipeRowActions {
  /** Called by TableRowSwipe when a row starts to open. Imperatively closes any
   *  other open row via its registered close function (no React state update). */
  notifyRowOpened: (rowId: string, closeFn: () => void) => void;
  /** Called by TableRowSwipe when a row fully closes. */
  notifyRowClosed: (rowId: string) => void;
  /** Imperatively close the currently open row. Safe to call when nothing is
   *  open (no-op). Stable reference — consuming this does NOT cause re-renders
   *  when activeRowId changes, making it safe for table scroll/tap handlers. */
  closeActiveRow: () => void;
}

// ─── State context (reactive — table parent components subscribe to this) ───
interface SwipeRowState {
  /** Current open row id — only used by table parent components for
   *  scroll/tap-outside close guards. NOT consumed by individual rows. */
  activeRowId: string | null;
  /** Close whichever row is currently open. */
  closeActiveRow: () => void;
  /** Legacy compat: directly set the active row id. Use notifyRowOpened
   *  (via useSwipeRowActions) for new components. */
  setActiveRowId: (rowId: string | null) => void;
  /** Legacy compat for older table components. */
  setOpenRow: (closeFunction: () => void) => void;
  closeOpenRow: () => void;
}

const SwipeRowActionsContext = createContext<SwipeRowActions | undefined>(undefined);
const SwipeRowStateContext = createContext<SwipeRowState | undefined>(undefined);

interface SwipeRowProviderProps {
  children: ReactNode;
}

export const SwipeRowProvider = ({ children }: SwipeRowProviderProps) => {
  // State consumed by 38 table parent components for close-on-scroll guards.
  // Individual TableRowSwipe instances do NOT subscribe to this.
  const [activeRowId, setActiveRowIdState] = useState<string | null>(null);

  // Single ref tracking the currently open row's imperative close function.
  // Mutations here cause zero React re-renders.
  const openRowRef = useRef<{ rowId: string; closeFn: () => void } | null>(null);

  // Legacy close function ref (for older brand/category table components).
  const legacyCloseRef = useRef<(() => void) | null>(null);

  // ─── Stable actions (never re-created) ────────────────────────────────────
  const notifyRowOpened = useCallback((rowId: string, closeFn: () => void) => {
    // Imperatively close the previously open row — NO setState, zero re-renders
    if (openRowRef.current && openRowRef.current.rowId !== rowId) {
      openRowRef.current.closeFn();
    }
    openRowRef.current = { rowId, closeFn };
    // Update state so table parent components can react to the change
    setActiveRowIdState(rowId);
  }, []);

  const notifyRowClosed = useCallback((rowId: string) => {
    if (openRowRef.current?.rowId === rowId) {
      openRowRef.current = null;
      setActiveRowIdState(null);
    }
  }, []);

  // ─── State context methods ─────────────────────────────────────────────────

  // Legacy shim for RowActions.tsx, position-table.tsx, order-schedule-table.tsx
  // which call setActiveRowId(id) / setActiveRowId(null) directly.
  const setActiveRowId = useCallback((rowId: string | null) => {
    if (rowId) {
      if (openRowRef.current && openRowRef.current.rowId !== rowId) {
        openRowRef.current.closeFn();
      }
      // Legacy callers don't register a close function, so store a no-op.
      openRowRef.current = { rowId, closeFn: () => {} };
      setActiveRowIdState(rowId);
    } else {
      openRowRef.current = null;
      setActiveRowIdState(null);
    }
  }, []);

  const closeActiveRow = useCallback(() => {
    if (openRowRef.current) {
      openRowRef.current.closeFn();
      openRowRef.current = null;
      setActiveRowIdState(null);
    }
    legacyCloseRef.current?.();
    legacyCloseRef.current = null;
  }, []);

  const setOpenRow = useCallback((closeFn: () => void) => {
    legacyCloseRef.current = closeFn;
  }, []);

  const closeOpenRow = useCallback(() => {
    legacyCloseRef.current?.();
    legacyCloseRef.current = null;
    closeActiveRow();
  }, [closeActiveRow]);

  // ─── Memoized context values ───────────────────────────────────────────────
  // Actions value is stable — these callbacks have no deps and never change.
  // Consumers of this context (TableRowSwipe + table scroll/tap handlers) will
  // NEVER re-render due to context changes.
  const actionsValue = useMemo(
    () => ({ notifyRowOpened, notifyRowClosed, closeActiveRow }),
    [notifyRowOpened, notifyRowClosed, closeActiveRow]
  );

  // State value changes when activeRowId changes. Only table parent components
  // subscribe to this (38 components), not individual row instances.
  const stateValue = useMemo(
    () => ({ activeRowId, closeActiveRow, setActiveRowId, setOpenRow, closeOpenRow }),
    [activeRowId, closeActiveRow, setActiveRowId, setOpenRow, closeOpenRow]
  );

  return (
    <SwipeRowActionsContext.Provider value={actionsValue}>
      <SwipeRowStateContext.Provider value={stateValue}>
        {children}
      </SwipeRowStateContext.Provider>
    </SwipeRowActionsContext.Provider>
  );
};

/** Used by table parent components that need to close rows on scroll/tap-outside.
 *  These components re-render when activeRowId changes — that is intentional and
 *  limited to one component per table (not per row). */
export const useSwipeRow = () => {
  const context = useContext(SwipeRowStateContext);
  if (context === undefined) {
    throw new Error("useSwipeRow must be used within a SwipeRowProvider");
  }
  return context;
};

/** Used by TableRowSwipe instances. Returns only stable functions — consumers
 *  will never re-render due to context updates, eliminating the mass re-render
 *  problem that caused jank during gesture activation. */
export const useSwipeRowActions = () => {
  const context = useContext(SwipeRowActionsContext);
  if (context === undefined) {
    throw new Error("useSwipeRowActions must be used within a SwipeRowProvider");
  }
  return context;
};
