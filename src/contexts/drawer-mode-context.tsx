import { createContext, useContext, useState, useCallback, ReactNode } from "react";

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
    // Small delay to ensure state is set before drawer opens
    requestAnimationFrame(() => {
      openDrawer();
    });
  }, []);

  return (
    <DrawerModeContext.Provider value={{ drawerMode, setDrawerMode, openDrawerWithMode }}>
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
