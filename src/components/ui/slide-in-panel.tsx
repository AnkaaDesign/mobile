import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, TouchableOpacity, Pressable } from 'react-native';
import { useTheme } from '@/lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.8;

interface SlideInPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * SlideInPanel - A performant slide-in panel component
 *
 * This component provides a slide-in panel from the right side of the screen
 * using Animated API for smooth performance.
 *
 * Benefits:
 * - Direct component rendering (no modal/drawer overhead)
 * - Animated API for smooth transitions
 * - Simple implementation
 * - Easy to customize
 */
export function SlideInPanel({ isOpen, onClose, children }: SlideInPanelProps) {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      // Animate panel sliding in from right
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate panel sliding out to right
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, translateX, overlayOpacity]);

  // Don't render when closed to save memory
  if (!isOpen) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Backdrop/Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          { opacity: overlayOpacity }
        ]}
      >
        <Pressable
          style={styles.overlayPressable}
          onPress={onClose}
        />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: colors.background,
            transform: [{ translateX }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayPressable: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
});
