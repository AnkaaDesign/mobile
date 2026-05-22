/**
 * Tutorial first-launch trigger (v5, unchanged behavior).
 *
 * Auto-starts the tutorial for PRODUCTION users on first login. Replaces the
 * old `TutorialFirstLaunchTrigger` import path.
 */
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useTutorialActions } from "./provider";
import { tutorialStorage } from "./tutorial-storage";

export function TutorialFirstLaunchTrigger() {
  const { user, isAuthReady } = useAuth() as any;
  const tutorial = useTutorialActions();
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user?.id) {
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

    tutorial.setPendingStart(true);
    let cancelled = false;
    (async () => {
      const completed = await tutorialStorage.isCompleted(user.id);
      if (cancelled) return;
      if (completed) {
        tutorial.setPendingStart(false);
        return;
      }
      setTimeout(() => {
        if (!cancelled) void tutorial.start();
      }, 150);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, user?.id, user?.sector?.privileges, tutorial]);

  return null;
}
