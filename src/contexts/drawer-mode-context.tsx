import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

export type DrawerMode = 'menu' | 'notifications';

interface DrawerModeContextType {
  drawerMode: DrawerMode;
  setDrawerMode: (mode: DrawerMode) => void;
  openDrawerWithMode: (mode: DrawerMode, openDrawer: () => void) => void;
}

const DrawerModeContext = createContext<DrawerModeContextType | undefined>(undefined);

export function DrawerModeProvider({ children }: { children: ReactNode }) {
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('menu');

  const openDrawerWithMode = useCallback((mode: DrawerMode, openDrawer: () => void) => {
    setDrawerMode(mode);
    openDrawer();
  }, []);

  // Memoize context value to prevent unnecessary re-renders of all consumers
  const value = useMemo(
    () => ({ drawerMode, setDrawerMode, openDrawerWithMode }),
    [drawerMode, setDrawerMode, openDrawerWithMode]
  );

  return (
    <DrawerModeContext.Provider value={value}>
      {children}
    </DrawerModeContext.Provider>
  );
}

export function useDrawerMode() {
  const context = useContext(DrawerModeContext);
  if (!context) {
    throw new Error('useDrawerMode must be used within a DrawerModeProvider');
  }
  return context;
}
