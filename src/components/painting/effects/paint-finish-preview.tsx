import { View, StyleSheet, Image, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { PAINT_FINISH } from '@/constants';
import { PAINT_FINISH_CONFIG } from './paint-finish-config';

interface PaintFinishPreviewProps {
  baseColor: string;
  finish: PAINT_FINISH;
  width?: number;
  height?: number;
  style?: ViewStyle;
  disableAnimations?: boolean;
}

export function PaintFinishPreview({
  baseColor,
  finish,
  width = 200,
  height = 100,
  style,
  disableAnimations = false,
}: PaintFinishPreviewProps) {
  const config = PAINT_FINISH_CONFIG[finish];

  // Animation values
  const shimmerTranslateX = useSharedValue(-width);
  const pearlHue = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);

  useEffect(() => {
    if (!disableAnimations) {
      // Shimmer animation for metallic
      if (finish === PAINT_FINISH.METALLIC) {
        shimmerTranslateX.value = withRepeat(
          withSequence(
            withTiming(width * 2, { duration: 3000, easing: Easing.ease }),
            withDelay(1000, withTiming(-width, { duration: 0 }))
          ),
          -1,
          false
        );
      }

      // Iridescent animation for pearl
      if (finish === PAINT_FINISH.PEARL) {
        pearlHue.value = withRepeat(
          withTiming(360, { duration: 4000, easing: Easing.ease }),
          -1,
          false
        );
      }

      // Sparkle animation
      if (config.effects.hasSparkle) {
        sparkleOpacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1000, easing: Easing.ease }),
            withTiming(0, { duration: 1000, easing: Easing.ease })
          ),
          -1,
          true
        );
      }
    }
  }, [finish, disableAnimations]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslateX.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  // Render finish-specific effects
  const renderFinishEffect = () => {
    switch (finish) {
      case PAINT_FINISH.METALLIC:
        return (
          <>
            {/* Base metallic layer */}
            <LinearGradient
              colors={[
                'rgba(200, 200, 200, 0.3)',
                'transparent',
                'transparent',
                'rgba(200, 200, 200, 0.2)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Animated shimmer */}
            {!disableAnimations && (
              <Animated.View style={[styles.shimmer, shimmerStyle]}>
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(255, 255, 255, 0.3)',
                    'rgba(255, 255, 255, 0.6)',
                    'rgba(255, 255, 255, 0.3)',
                    'transparent',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFill, { width: width * 0.3 }]}
                />
              </Animated.View>
            )}

            {/* Flake texture overlay */}
            <Image
              source={require('../../../../assets/images/paint-effects/flake.jpg')}
              style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}
              resizeMode="cover"
            />

            {/* Sparkles */}
            {!disableAnimations && (
              <Animated.View style={[StyleSheet.absoluteFill, sparkleStyle]}>
                {[...Array(6)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.sparkle,
                      {
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 3) * 25}%`,
                      },
                    ]}
                  />
                ))}
              </Animated.View>
            )}
          </>
        );

      case PAINT_FINISH.PEARL:
        return (
          <>
            {/* Iridescent base layer */}
            <LinearGradient
              colors={[
                'rgba(255, 192, 203, 0.3)',
                'rgba(173, 216, 230, 0.3)',
                'rgba(255, 255, 224, 0.3)',
                'rgba(221, 160, 221, 0.3)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Pearl shimmer particles */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.0)',
                'rgba(255, 192, 203, 0.2)',
                'rgba(173, 216, 230, 0.2)',
                'rgba(255, 255, 255, 0.0)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Pearl flake texture */}
            <Image
              source={require('../../../../assets/images/paint-effects/flake.jpg')}
              style={[StyleSheet.absoluteFill, { opacity: 0.1, tintColor: '#FFB6C1' }]}
              resizeMode="cover"
            />

            {/* Pearl sparkles */}
            {!disableAnimations && (
              <Animated.View style={[StyleSheet.absoluteFill, sparkleStyle]}>
                {[...Array(8)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.pearlSparkle,
                      {
                        left: `${10 + i * 11}%`,
                        top: `${15 + (i % 4) * 20}%`,
                      },
                    ]}
                  />
                ))}
              </Animated.View>
            )}
          </>
        );

      case PAINT_FINISH.MATTE:
        return (
          <>
            {/* Matte texture layer */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]} />

            {/* Subtle noise texture */}
            <View style={[StyleSheet.absoluteFill, styles.matteNoise]} />
          </>
        );

      case PAINT_FINISH.SOLID:
        return (
          <>
            {/* Glossy reflection */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.4)',
                'rgba(255, 255, 255, 0.0)',
                'rgba(0, 0, 0, 0.05)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Highlight blob */}
            <View
              style={[
                styles.glossHighlight,
                {
                  left: '20%',
                  top: '10%',
                },
              ]}
            />
          </>
        );

      case PAINT_FINISH.SATIN:
        return (
          <>
            {/* Satin soft sheen */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.15)',
                'rgba(255, 255, 255, 0.05)',
                'rgba(255, 255, 255, 0.0)',
                'rgba(0, 0, 0, 0.03)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { width, height }, style]}>
      {/* Base color layer */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: baseColor }]} />

      {/* Finish effects */}
      {renderFinishEffect()}

      {/* Clear coat layer (for glossy finishes) */}
      {config.clearCoat > 0 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(255, 255, 255, 0)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  sparkle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  pearlSparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 192, 203, 0.6)',
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  matteNoise: {
    opacity: 0.08,
  },
  glossHighlight: {
    position: 'absolute',
    width: 60,
    height: 40,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
});
