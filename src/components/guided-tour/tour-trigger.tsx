import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { isTeamLeader } from "@/utils/user";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useTour } from "./tour-context";
import { tourStorage } from "./tour-storage";

/**
 * Detects first-launch for production-sector users and auto-starts the tour.
 * Renders nothing.
 */
export function TourFirstLaunchTrigger() {
  const { user, isAuthReady } = useAuth();
  const tour = useTour();
  const triggered = useRef(false);

  useEffect(() => {
    if (!isAuthReady || !user || triggered.current) return;
    if (user.sector?.privileges !== SECTOR_PRIVILEGES.PRODUCTION) return;

    let cancelled = false;
    (async () => {
      const completed = await tourStorage.isCompleted();
      if (cancelled || completed) return;
      triggered.current = true;
      // small delay so initial screen has rendered
      setTimeout(() => {
        tour.start();
      }, 1200);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, user?.id]);

  return null;
}
