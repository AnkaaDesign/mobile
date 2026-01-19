import React, { Suspense, lazy } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useDrawerMode } from '@/contexts/drawer-mode-context';
import { useTheme } from '@/lib/theme';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

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
  const { drawerMode } = useDrawerMode();

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
