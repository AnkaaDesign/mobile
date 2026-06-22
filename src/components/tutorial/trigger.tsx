/**
 * Tutorial first-launch trigger (v5).
 *
 * Auto-starts the tutorial for PRODUCTION-sector users on first login, once each
 * (per-user completion is persisted in `tutorialStorage`).
 */
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useTutorialActions } from "./provider";
import { tutorialStorage } from "./tutorial-storage";

export function TutorialFirstLaunchTrigger() {
  const { user, isAuthReady } = useAuth() as any;
  // Pull the individual actions, NOT the whole tutorial context object.
  // `start` and `setPendingStart` come from useCallback([]) in the provider, so
  // their identity is stable across renders. The aggregated context object, by
  // contrast, is rebuilt whenever any store value in its memo deps changes —
  // including isPendingStart. Previously this effect depended on that whole
  // object, so calling setPendingStart(true) below flipped isPendingStart,
  // rebuilt the context, changed this effect's dep, fired the cleanup
  // (cancelled = true) and re-ran the effect — which then bailed at the
  // triggeredRef guard without rescheduling. The net result: the pending
  // start() was cancelled before it ever ran, the tutorial never showed, and
  // isPendingStart stayed stuck true (which also permanently suppressed the
  // post-tutorial messages modal). Depending on the stable callbacks fixes it.
  const { start, setPendingStart } = useTutorialActions();
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user?.id) {
      triggeredRef.current = false;
      setPendingStart(false);
      return;
    }
    // Tutorial is restricted to the PRODUCTION sector. Non-production users get
    // no tutorial — clear the pending flag so the messages modal isn't blocked.
    if (user.sector?.privileges !== SECTOR_PRIVILEGES.PRODUCTION) {
      setPendingStart(false);
      return;
    }
    if (triggeredRef.current) return;
    triggeredRef.current = true;

    setPendingStart(true);
    let cancelled = false;
    (async () => {
      const completed = await tutorialStorage.isCompleted(user.id);
      if (cancelled) return;
      if (completed) {
        setPendingStart(false);
        return;
      }
      setTimeout(() => {
        if (!cancelled) void start();
      }, 150);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, user?.id, user?.sector?.privileges, start, setPendingStart]);

  return null;
}
