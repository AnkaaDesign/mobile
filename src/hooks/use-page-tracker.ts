import { useCallback } from "react";
import { usePathname } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { trackPageAccess } from "@/utils/page-tracker";

interface UsePageTrackerOptions {
  title: string;
  icon?: string;
  trackingEnabled?: boolean;
}

export function usePageTracker({ title, icon, trackingEnabled = true }: UsePageTrackerOptions) {
  const pathname = usePathname();

  // useFocusEffect runs every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (trackingEnabled && title) {
        trackPageAccess(pathname, title, icon);
      }
    }, [pathname, title, icon, trackingEnabled])
  );
}
