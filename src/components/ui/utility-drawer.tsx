import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
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

  // The onOpen is called by gesture/swipe, which we don't use
  // The drawers are controlled programmatically via the context
  const handleFilterOpen = () => {
    // No-op since we control via context
  };

  const handleColumnOpen = () => {
    // No-op since we control via context
  };

  return (
    <Drawer
      open={isFilterDrawerOpen}
      onOpen={handleFilterOpen}
      onClose={closeFilterDrawer}
      drawerPosition="right"
      drawerType="front"
      drawerStyle={{
        width: SCREEN_WIDTH * 0.8,
        backgroundColor: colors.background,
      }}
      renderDrawerContent={() => (
        <View style={[styles.drawerContainer, { backgroundColor: colors.background }]}>
          {filterDrawerContent && filterDrawerContent()}
        </View>
      )}
    >
      <Drawer
        open={isColumnDrawerOpen}
        onOpen={handleColumnOpen}
        onClose={closeColumnDrawer}
        drawerPosition="right"
        drawerType="front"
        drawerStyle={{
          width: SCREEN_WIDTH * 0.8,
          backgroundColor: colors.background,
        }}
        renderDrawerContent={() => (
          <View style={[styles.drawerContainer, { backgroundColor: colors.background }]}>
            {columnDrawerContent && columnDrawerContent()}
          </View>
        )}
      >
        {children}
      </Drawer>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
});
