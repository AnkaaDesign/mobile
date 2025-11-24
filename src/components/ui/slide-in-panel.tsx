import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, Pressable } from 'react-native';
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Make visible immediately
      setIsVisible(true);
      // Start with panel off-screen and overlay transparent
      translateX.setValue(SCREEN_WIDTH);
      overlayOpacity.setValue(0);

      // Animate in after a brief delay for layout
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 10);
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
      });
    }
  }, [isOpen]);

  // Don't render if not visible
  if (!isVisible) {
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
        pointerEvents={isOpen ? "auto" : "none"}
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
        pointerEvents="box-none"
      >
        <View style={{ flex: 1 }} pointerEvents="auto">
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9998,
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
    zIndex: 9999,
    elevation: 999,
  },
});
