import { createContext, useContext, type ReactNode } from "react";
import { useSlot, type SlotRegistry } from "../use-slot";

const SlotContext = createContext<SlotRegistry | null>(null);

export function SlotProvider({ children }: { children: ReactNode }) {
  const slot = useSlot();
  return <SlotContext.Provider value={slot}>{children}</SlotContext.Provider>;
}

export function useSlotContext(): SlotRegistry {
  const ctx = useContext(SlotContext);
  if (!ctx) {
    throw new Error("useSlotContext must be used inside a SlotProvider (tutorial Stage)");
  }
  return ctx;
}
