import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';

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

  // Store timeout refs to clear them when needed
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const columnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openFilterDrawer = useCallback((renderContent: () => ReactNode) => {
    // Clear any pending content cleanup for filter drawer
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
      filterTimeoutRef.current = null;
    }

    // Close column drawer if open (but don't clear its content yet)
    if (isColumnDrawerOpen) {
      setIsColumnDrawerOpen(false);
      // Clear column content after its close animation
      if (columnTimeoutRef.current) {
        clearTimeout(columnTimeoutRef.current);
      }
      columnTimeoutRef.current = setTimeout(() => {
        setColumnDrawerContent(null);
        columnTimeoutRef.current = null;
      }, 300);
    }

    // Set content and open drawer synchronously
    setFilterDrawerContent(() => renderContent);
    setIsFilterDrawerOpen(true);
  }, [isColumnDrawerOpen]);

  const closeFilterDrawer = useCallback(() => {
    setIsFilterDrawerOpen(false);
    // Don't clear content immediately - wait for animation
    filterTimeoutRef.current = setTimeout(() => {
      setFilterDrawerContent(null);
      filterTimeoutRef.current = null;
    }, 300);
  }, []);

  const openColumnDrawer = useCallback((renderContent: () => ReactNode) => {
    // Clear any pending content cleanup for column drawer
    if (columnTimeoutRef.current) {
      clearTimeout(columnTimeoutRef.current);
      columnTimeoutRef.current = null;
    }

    // Close filter drawer if open (but don't clear its content yet)
    if (isFilterDrawerOpen) {
      setIsFilterDrawerOpen(false);
      // Clear filter content after its close animation
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
      filterTimeoutRef.current = setTimeout(() => {
        setFilterDrawerContent(null);
        filterTimeoutRef.current = null;
      }, 300);
    }

    // Set content and open drawer synchronously
    setColumnDrawerContent(() => renderContent);
    setIsColumnDrawerOpen(true);
  }, [isFilterDrawerOpen]);

  const closeColumnDrawer = useCallback(() => {
    setIsColumnDrawerOpen(false);
    // Don't clear content immediately - wait for animation
    columnTimeoutRef.current = setTimeout(() => {
      setColumnDrawerContent(null);
      columnTimeoutRef.current = null;
    }, 300);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
      if (columnTimeoutRef.current) {
        clearTimeout(columnTimeoutRef.current);
      }
    };
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
