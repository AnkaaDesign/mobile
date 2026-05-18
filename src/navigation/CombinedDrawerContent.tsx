import React, { Suspense, lazy, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useDrawerStatus } from '@react-navigation/drawer';
import { DrawerActions } from '@react-navigation/native';
import { useDrawerMode } from '@/contexts/drawer-mode-context';
import { useTheme } from '@/lib/theme';
import { useOptionalTutorial, TUTORIAL_TARGETS } from '@/components/tutorial';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

// Matches the drawerStyle width in privilege-optimized-full-fixed.tsx. The
// notifications panel slides in from the right occupying this many px, so
// the dim backdrop strip (where the user taps to close) is the remainder.
const DRAWER_WIDTH_PX = 280;

// Lazy load drawer contents for performance
const OriginalMenuDrawer = lazy(() => import('./OriginalMenuDrawer'));
const NotificationDrawerContent = lazy(() => import('./NotificationDrawerContent'));

// Loading fallback component
function LoadingFallback() {
  const { isDark } = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: isDark ? "#212121" : "#fafafa" }]}>
      <ActivityIndicator size="large" color="#15803d" />
    </View>
  );
}

export default function CombinedDrawerContent(props: DrawerContentComponentProps) {
  const { drawerMode, setDrawerMode } = useDrawerMode();
  const tutorial = useOptionalTutorial();
  const drawerStatus = useDrawerStatus();

  // Bridge: register an open-drawer callback with the tutorial context so
  // tutorial steps with `openDrawerOnEnter: true` can dispatch the open
  // action against the actual drawer navigator (the TutorialProvider lives
  // ABOVE the drawer in the tree and would otherwise warn "OPEN_DRAWER not
  // handled by any navigator").
  const registerOpenDrawerCallback = tutorial?.registerOpenDrawerCallback;
  useEffect(() => {
    if (!registerOpenDrawerCallback) return;
    registerOpenDrawerCallback(() => {
      try {
        setDrawerMode('menu');
        props.navigation.dispatch(DrawerActions.openDrawer());
      } catch {}
    });
    return () => registerOpenDrawerCallback(null);
  }, [registerOpenDrawerCallback, props.navigation, setDrawerMode]);

  // Mirror of the open bridge for closing. Used by steps that follow the
  // notifications block — the panel may still be open and would otherwise
  // occlude the header chrome that the next step targets.
  const registerCloseDrawerCallback = tutorial?.registerCloseDrawerCallback;
  useEffect(() => {
    if (!registerCloseDrawerCallback) return;
    registerCloseDrawerCallback(() => {
      try {
        props.navigation.dispatch(DrawerActions.closeDrawer());
      } catch {}
    });
    return () => registerCloseDrawerCallback(null);
  }, [registerCloseDrawerCallback, props.navigation]);

  // Jump-replay handlers — used by the dev step picker so jumping into a
  // step that expects the drawer (menu or notifications) to be open
  // actually opens it. Idempotent: re-firing while already open is a no-op
  // at the navigator level.
  const registerJumpHandler = tutorial?.registerJumpHandler;
  useEffect(() => {
    if (!registerJumpHandler) return;
    registerJumpHandler("open-side-drawer-menu", async () => {
      try {
        setDrawerMode("menu");
        props.navigation.dispatch(DrawerActions.openDrawer());
        // Give the slide-in a frame so the menu items have rects.
        await new Promise<void>((r) => setTimeout(r, 280));
      } catch {}
    });
    registerJumpHandler("open-side-drawer-notifications", async () => {
      try {
        setDrawerMode("notifications");
        props.navigation.dispatch(DrawerActions.openDrawer());
        await new Promise<void>((r) => setTimeout(r, 280));
      } catch {}
    });
    registerJumpHandler("close-side-drawer", async () => {
      try {
        props.navigation.dispatch(DrawerActions.closeDrawer());
        await new Promise<void>((r) => setTimeout(r, 200));
      } catch {}
    });
    return () => {
      registerJumpHandler("open-side-drawer-menu", null);
      registerJumpHandler("open-side-drawer-notifications", null);
      registerJumpHandler("close-side-drawer", null);
    };
  }, [registerJumpHandler, props.navigation, setDrawerMode]);

  // Re-measure all tutorial targets when the drawer transitions to "open".
  // Drawer items mount before the slide-in animation completes; without
  // this bump the rects captured by useTutorialTarget land at the
  // mid-animation position and the spotlight is offset.
  const bumpMeasureTick = tutorial?.bumpMeasureTick;
  useEffect(() => {
    if (!bumpMeasureTick) return;
    if (drawerStatus !== 'open') return;
    // Two ticks: one immediately for the transition, one after the
    // animation typically completes (~250ms) for the final rect.
    const t1 = setTimeout(() => bumpMeasureTick(), 60);
    const t2 = setTimeout(() => bumpMeasureTick(), 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [drawerStatus, bumpMeasureTick]);

  // Synthetic "close backdrop" target — the dim area to the LEFT of the
  // notifications drawer. There is no RN element to attach a tutorial
  // target to (the dim is drawn by react-navigation/drawer's overlay), so
  // we register a precomputed rect with the engine and let the user tap
  // anywhere in that strip.
  const registerTarget = tutorial?.registerTarget;
  const unregisterTarget = tutorial?.unregisterTarget;
  const notifyAction = tutorial?.notifyAction;
  const currentStep = tutorial?.currentStep;
  const currentStepId = currentStep?.id ?? null;
  useEffect(() => {
    if (!registerTarget || !unregisterTarget) return;
    if (currentStepId !== 'notifications-close') return;
    if (drawerStatus !== 'open' || drawerMode !== 'notifications') return;
    const screen = Dimensions.get('window');
    registerTarget(TUTORIAL_TARGETS.notificationsCloseBackdrop, {
      x: 0,
      y: 0,
      width: Math.max(40, screen.width - DRAWER_WIDTH_PX),
      height: screen.height,
    });
    return () =>
      unregisterTarget(TUTORIAL_TARGETS.notificationsCloseBackdrop);
  }, [
    currentStepId,
    drawerStatus,
    drawerMode,
    registerTarget,
    unregisterTarget,
  ]);

  // Local detection of drawer close. The engine's navigation-state listener
  // sits above the drawer navigator in the tree and doesn't always receive
  // drawer state events. useDrawerStatus is local to the drawer navigator
  // and ALWAYS fires on open/close — so we own the drawer-close handoff
  // here. Once the panel closes during the `notifications-close` step we
  // fire the action that advances the engine.
  const prevDrawerStatusRef = React.useRef(drawerStatus);
  useEffect(() => {
    const prev = prevDrawerStatusRef.current;
    prevDrawerStatusRef.current = drawerStatus;
    if (!notifyAction) return;
    if (prev !== 'open' || drawerStatus !== 'closed') return;
    if (currentStep?.expectedAction !== 'drawer-close') return;
    notifyAction('drawer-close', {
      targetId: currentStep?.targetId,
    });
  }, [drawerStatus, notifyAction, currentStep]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      {drawerMode === 'notifications' ? (
        <NotificationDrawerContent {...props} />
      ) : (
        <OriginalMenuDrawer {...props} />
      )}
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
