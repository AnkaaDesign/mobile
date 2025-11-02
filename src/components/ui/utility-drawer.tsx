import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import DrawerLayout from 'react-native-drawer-layout';
import { useTheme } from '@/lib/theme';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface UtilityDrawerWrapperProps {
  children: React.ReactNode;
}

/**
 * UtilityDrawerWrapper - Wraps screens with utility drawers
 *
 * This component provides high-performance drawers using the same
 * react-native-drawer-layout that React Navigation uses.
 *
 * Benefits:
 * - Hardware accelerated animations
 * - Native gesture handling
 * - Page slides with drawer (push effect)
 * - Much more performant than Modal-based drawers
 */
export function UtilityDrawerWrapper({ children }: UtilityDrawerWrapperProps) {
  const { colors } = useTheme();
  const {
    isFilterDrawerOpen,
    closeFilterDrawer,
    filterDrawerContent,
    isColumnDrawerOpen,
    closeColumnDrawer,
    columnDrawerContent,
  } = useUtilityDrawer();

  const filterDrawerRef = useRef<DrawerLayout>(null);
  const columnDrawerRef = useRef<DrawerLayout>(null);

  // Control filter drawer
  useEffect(() => {
    if (isFilterDrawerOpen) {
      filterDrawerRef.current?.openDrawer();
    } else {
      filterDrawerRef.current?.closeDrawer();
    }
  }, [isFilterDrawerOpen]);

  // Control column drawer
  useEffect(() => {
    if (isColumnDrawerOpen) {
      columnDrawerRef.current?.openDrawer();
    } else {
      columnDrawerRef.current?.closeDrawer();
    }
  }, [isColumnDrawerOpen]);

  return (
    <DrawerLayout
      ref={filterDrawerRef}
      drawerWidth={SCREEN_WIDTH * 0.9}
      drawerPosition="right"
      drawerType="front"
      drawerBackgroundColor={colors.background}
      onDrawerClose={closeFilterDrawer}
      renderNavigationView={() => (
        <View style={[styles.drawerContainer, { backgroundColor: colors.background }]}>
          {filterDrawerContent?.()}
        </View>
      )}
    >
      <DrawerLayout
        ref={columnDrawerRef}
        drawerWidth={SCREEN_WIDTH * 0.9}
        drawerPosition="right"
        drawerType="front"
        drawerBackgroundColor={colors.background}
        onDrawerClose={closeColumnDrawer}
        renderNavigationView={() => (
          <View style={[styles.drawerContainer, { backgroundColor: colors.background }]}>
            {columnDrawerContent?.()}
          </View>
        )}
      >
        {children}
      </DrawerLayout>
    </DrawerLayout>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
});
