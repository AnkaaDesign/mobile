import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useTutorialActions } from "./tutorial-context";
import { tutorialStorage } from "./tutorial-storage";

/**
 * Detects when a PRODUCTION sector user logs in for the first time and starts
 * the tutorial immediately — before any other content is reasonably visible.
 *
 * Trigger window: ~150ms after auth resolves. Short enough to feel like the
 * tutorial owns the session, long enough for the home screen to mount.
 */
export function TutorialFirstLaunchTrigger() {
  const { user, isAuthReady } = useAuth() as any;
  const tutorial = useTutorialActions();
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user?.id) {
      // logged out — clear flag so re-login of a different user can re-trigger
      triggeredRef.current = false;
      tutorial.setPendingStart(false);
      return;
    }
    if (user.sector?.privileges !== SECTOR_PRIVILEGES.PRODUCTION) {
      tutorial.setPendingStart(false);
      return;
    }
    if (triggeredRef.current) return;
    triggeredRef.current = true;

    // Mark pending synchronously so other UI (e.g. the system-message modal)
    // can suppress itself before we know whether to actually start. This
    // closes the race window between auth-ready and the async storage check.
    tutorial.setPendingStart(true);

    let cancelled = false;
    (async () => {
      const completed = await tutorialStorage.isCompleted(user.id);
      if (cancelled) return;
      if (completed) {
        tutorial.setPendingStart(false);
        return;
      }
      // Small delay so the splash/loading clears, then the tutorial overlay
      // appears immediately as the first thing the user sees.
      setTimeout(() => {
        if (!cancelled) tutorial.start();
      }, 150);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, user?.id, user?.sector?.privileges, tutorial]);

  return null;
}
