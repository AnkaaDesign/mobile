import { createContext, useContext, useState, useCallback, useMemo, memo, ReactNode } from "react";

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = memo(({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      isOpen,
      toggle,
      setIsOpen,
    }),
    [isOpen, toggle],
  );

  return <SidebarContext.Provider value={contextValue}>{children}</SidebarContext.Provider>;
});

SidebarProvider.displayName = "SidebarProvider";

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
