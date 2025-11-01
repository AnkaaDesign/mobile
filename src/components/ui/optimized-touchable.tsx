/**
 * Optimized TouchableOpacity component for better performance
 * Uses React Native Gesture Handler for smoother touch interactions
 */

import React, { memo, useCallback } from "react";
import { StyleSheet, ViewStyle, TouchableOpacity as RNTouchableOpacity } from "react-native";
import { TapGestureHandler, LongPressGestureHandler, State } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, interpolate } from "react-native-reanimated";

interface OptimizedTouchableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number;
  style?: ViewStyle;
  className?: string;
  hapticFeedback?: boolean;
  rippleEffect?: boolean;
  scaleOnPress?: boolean;
  testID?: string;
}

const OptimizedTouchable: React.FC<OptimizedTouchableProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  activeOpacity = 0.7,
  style,
  className,
  hapticFeedback = true,
  rippleEffect = false,
  scaleOnPress = true,
  testID,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rippleOpacity = useSharedValue(0);

  // Optimized press handler with haptic feedback
  const handlePress = useCallback(() => {
    if (disabled || !onPress) return;

    if (hapticFeedback) {
      // Add haptic feedback for better UX (iOS only)
      // const { HapticFeedback } = require('react-native');
      // HapticFeedback.impact(HapticFeedback.ImpactFeedbackStyle.Light);
    }

    onPress();
  }, [disabled, onPress, hapticFeedback]);

  const handleLongPress = useCallback(() => {
    if (disabled || !onLongPress) return;

    if (hapticFeedback) {
      // Add stronger haptic feedback for long press
      // const { HapticFeedback } = require('react-native');
      // HapticFeedback.impact(HapticFeedback.ImpactFeedbackStyle.Medium);
    }

    onLongPress();
  }, [disabled, onLongPress, hapticFeedback]);

  // Gesture handlers
  const onTapHandlerStateChange = useCallback(
    (event: any) => {
      const { state } = event.nativeEvent;

      if (state === State.BEGAN) {
        // Press started - animate down
        scale.value = withSpring(scaleOnPress ? 0.95 : 1, {
          damping: 15,
          stiffness: 300,
        });
        opacity.value = withSpring(activeOpacity, {
          damping: 15,
          stiffness: 300,
        });

        if (rippleEffect) {
          rippleOpacity.value = withSpring(0.3, {
            damping: 15,
            stiffness: 300,
          });
        }
      } else if (state === State.END) {
        // Press ended - animate back up and trigger action
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 300,
        });
        opacity.value = withSpring(1, {
          damping: 15,
          stiffness: 300,
        });

        if (rippleEffect) {
          rippleOpacity.value = withSpring(0, {
            damping: 15,
            stiffness: 300,
          });
        }

        runOnJS(handlePress)();
      } else if (state === State.CANCELLED || state === State.FAILED) {
        // Press cancelled - animate back to normal
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 300,
        });
        opacity.value = withSpring(1, {
          damping: 15,
          stiffness: 300,
        });

        if (rippleEffect) {
          rippleOpacity.value = withSpring(0, {
            damping: 15,
            stiffness: 300,
          });
        }
      }
    },
    [scale, opacity, rippleOpacity, handlePress, activeOpacity, scaleOnPress, rippleEffect],
  );

  const onLongPressHandlerStateChange = useCallback(
    (event: any) => {
      const { state } = event.nativeEvent;

      if (state === State.ACTIVE) {
        runOnJS(handleLongPress)();
      }
    },
    [handleLongPress],
  );

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  }, []);

  const rippleStyle = useAnimatedStyle(() => {
    return {
      opacity: rippleOpacity.value,
      transform: [
        {
          scale: interpolate(rippleOpacity.value, [0, 0.3], [0.8, 1.2]),
        },
      ],
    };
  }, []);

  // If gesture handler is not available or not needed, use regular TouchableOpacity
  if (!scaleOnPress && !rippleEffect && !hapticFeedback) {
    return (
      <RNTouchableOpacity
        onPress={handlePress}
        onLongPress={onLongPress ? handleLongPress : undefined}
        disabled={disabled}
        activeOpacity={activeOpacity}
        style={style}
        className={className}
        testID={testID}
      >
        {children}
      </RNTouchableOpacity>
    );
  }

  const GestureComponent = onLongPress ? (
    <LongPressGestureHandler onHandlerStateChange={onLongPressHandlerStateChange} minDurationMs={500} enabled={!disabled}>
      <TapGestureHandler onHandlerStateChange={onTapHandlerStateChange} enabled={!disabled}>
        <Animated.View style={StyleSheet.flatten([style, animatedStyle])} className={className}>
          {rippleEffect && (
            <Animated.View
              style={StyleSheet.flatten([
                {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
                rippleStyle,
              ])}
            />
          )}
          {children}
        </Animated.View>
      </TapGestureHandler>
    </LongPressGestureHandler>
  ) : (
    <TapGestureHandler onHandlerStateChange={onTapHandlerStateChange} enabled={!disabled}>
      <Animated.View style={StyleSheet.flatten([style, animatedStyle])} className={className}>
        {rippleEffect && (
          <Animated.View
            style={StyleSheet.flatten([
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 8,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
              rippleStyle,
            ])}
          />
        )}
        {children}
      </Animated.View>
    </TapGestureHandler>
  );

  return GestureComponent;
};

export default memo(OptimizedTouchable);

export { OptimizedTouchable };
