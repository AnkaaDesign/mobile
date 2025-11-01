import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface SwipeRowContextType {
  activeRowId: string | null;
  setActiveRowId: (rowId: string | null) => void;
  closeActiveRow: () => void;
  // Legacy compatibility methods for brand/category components
  setOpenRow: (closeFunction: () => void) => void;
  closeOpenRow: () => void;
}

const SwipeRowContext = createContext<SwipeRowContextType | undefined>(undefined);

interface SwipeRowProviderProps {
  children: ReactNode;
}

export const SwipeRowProvider = ({ children }: SwipeRowProviderProps) => {
  const [activeRowId, setActiveRowIdState] = useState<string | null>(null);
  const [openRowCloseFunction, setOpenRowCloseFunction] = useState<(() => void) | null>(null);

  const setActiveRowId = useCallback((rowId: string | null) => {
    setActiveRowIdState(rowId);
  }, []);

  const closeActiveRow = useCallback(() => {
    setActiveRowIdState(null);
  }, []);

  // Legacy compatibility methods
  const setOpenRow = useCallback((closeFunction: () => void) => {
    setOpenRowCloseFunction(() => closeFunction);
  }, []);

  const closeOpenRow = useCallback(() => {
    if (openRowCloseFunction) {
      openRowCloseFunction();
      setOpenRowCloseFunction(null);
    }
    // Also close any active row managed by the modern system
    setActiveRowIdState(null);
  }, [openRowCloseFunction]);

  const value = {
    activeRowId,
    setActiveRowId,
    closeActiveRow,
    setOpenRow,
    closeOpenRow,
  };

  return <SwipeRowContext.Provider value={value}>{children}</SwipeRowContext.Provider>;
};

export const useSwipeRow = () => {
  const context = useContext(SwipeRowContext);
  if (context === undefined) {
    throw new Error("useSwipeRow must be used within a SwipeRowProvider");
  }
  return context;
};
