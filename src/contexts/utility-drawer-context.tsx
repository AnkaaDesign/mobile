import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface UtilityDrawerContextValue {
  // Filter drawer state
  isFilterDrawerOpen: boolean;
  openFilterDrawer: (renderContent: () => ReactNode) => void;
  closeFilterDrawer: () => void;
  filterDrawerContent: (() => ReactNode) | null;

  // Column drawer state
  isColumnDrawerOpen: boolean;
  openColumnDrawer: (renderContent: () => ReactNode) => void;
  closeColumnDrawer: () => void;
  columnDrawerContent: (() => ReactNode) | null;
}

const UtilityDrawerContext = createContext<UtilityDrawerContextValue | undefined>(undefined);

export function UtilityDrawerProvider({ children }: { children: ReactNode }) {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterDrawerContent, setFilterDrawerContent] = useState<(() => ReactNode) | null>(null);

  const [isColumnDrawerOpen, setIsColumnDrawerOpen] = useState(false);
  const [columnDrawerContent, setColumnDrawerContent] = useState<(() => ReactNode) | null>(null);

  const openFilterDrawer = useCallback((renderContent: () => ReactNode) => {
    // Close column drawer if open
    setIsColumnDrawerOpen(false);
    setFilterDrawerContent(() => renderContent);
    setIsFilterDrawerOpen(true);
  }, []);

  const closeFilterDrawer = useCallback(() => {
    setIsFilterDrawerOpen(false);
    // Clear content after animation
    setTimeout(() => setFilterDrawerContent(null), 300);
  }, []);

  const openColumnDrawer = useCallback((renderContent: () => ReactNode) => {
    // Close filter drawer if open
    setIsFilterDrawerOpen(false);
    setColumnDrawerContent(() => renderContent);
    setIsColumnDrawerOpen(true);
  }, []);

  const closeColumnDrawer = useCallback(() => {
    setIsColumnDrawerOpen(false);
    // Clear content after animation
    setTimeout(() => setColumnDrawerContent(null), 300);
  }, []);

  return (
    <UtilityDrawerContext.Provider
      value={{
        isFilterDrawerOpen,
        openFilterDrawer,
        closeFilterDrawer,
        filterDrawerContent,
        isColumnDrawerOpen,
        openColumnDrawer,
        closeColumnDrawer,
        columnDrawerContent,
      }}
    >
      {children}
    </UtilityDrawerContext.Provider>
  );
}

export function useUtilityDrawer() {
  const context = useContext(UtilityDrawerContext);
  if (!context) {
    throw new Error('useUtilityDrawer must be used within UtilityDrawerProvider');
  }
  return context;
}
