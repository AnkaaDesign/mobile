import { View, StyleSheet, ViewStyle, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PAINT_FINISH } from '@/constants';
import { useTheme } from '@/lib/theme';
import { useState, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ExpoAsset = require('expo-asset');

// Import and cache flake texture - both metallic and pearl use the same flake.jpg in web version
const FLAKE_TEXTURE = require('../../../../assets/images/flake.jpg');

interface PaintFinishPreviewProps {
  baseColor: string;
  finish: PAINT_FINISH;
  width?: number;
  height?: number;
  style?: ViewStyle;
  disableAnimations?: boolean;
}

// Preload and cache the flake texture
let flakeTextureLoaded = false;
ExpoAsset.Asset.fromModule(FLAKE_TEXTURE).downloadAsync().then(() => {
  flakeTextureLoaded = true;
});

export function PaintFinishPreview({
  baseColor,
  finish,
  width = 200,
  height = 100,
  style,
  disableAnimations = false,
}: PaintFinishPreviewProps) {
  const { colors } = useTheme();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const needsFlakeTexture = finish === PAINT_FINISH.METALLIC || finish === PAINT_FINISH.PEARL;

  // Check if image is loaded for metallic/pearl finishes
  useEffect(() => {
    if (!needsFlakeTexture) {
      setIsImageLoaded(true);
      return;
    }

    // Wait for flake texture to load
    const checkLoaded = setInterval(() => {
      if (flakeTextureLoaded) {
        setIsImageLoaded(true);
        clearInterval(checkLoaded);
      }
    }, 50);

    return () => clearInterval(checkLoaded);
  }, [needsFlakeTexture]);

  // Convert hex to RGB for calculations
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const getLighterColor = (hex: string, factor: number = 1.15): string => {
    const rgb = hexToRgb(hex);
    const r = Math.min(255, Math.floor(rgb.r * factor));
    const g = Math.min(255, Math.floor(rgb.g * factor));
    const b = Math.min(255, Math.floor(rgb.b * factor));
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Render finish-specific effects - EXACTLY matching web implementation
  const renderFinishEffect = () => {
    switch (finish) {
      case PAINT_FINISH.METALLIC:
        return (
          <View style={StyleSheet.absoluteFill}>
            {/* Base with lighter color - EXACTLY like web (line 349) */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: getLighterColor(baseColor, 1.15) }]} />

            {/* Layer 1: Main metallic gradient overlay - diagonal beam (matching web lines 385-395) */}
            <LinearGradient
              colors={[
                'transparent',
                'rgba(255, 255, 255, 0.15)',   // matching web 0.35 stop
                'rgba(255, 255, 255, 0.25)',   // matching web center 0.5 stop - increased brightness!
                'rgba(255, 255, 255, 0.15)',   // matching web 0.65 stop
                'transparent',
              ]}
              start={{ x: 0.1, y: 0.4 }}
              end={{ x: 0.9, y: 0.6 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Layer 2: Anisotropic bands - vertical stripes simulating brushed metal */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.06)',
                'rgba(255, 255, 255, 0.04)',
                'rgba(255, 255, 255, 0.01)',
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0.01)',
                'rgba(255, 255, 255, 0.04)',
                'rgba(255, 255, 255, 0.06)',
                'rgba(255, 255, 255, 0.04)',
                'rgba(255, 255, 255, 0.01)',
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0.01)',
                'rgba(255, 255, 255, 0.04)',
                'rgba(255, 255, 255, 0.06)',
                'rgba(255, 255, 255, 0.04)',
                'rgba(255, 255, 255, 0.01)',
                'rgba(255, 255, 255, 0)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}
            />

            {/* Layer 3: Flake texture overlay - matching web opacity 0.3 (line 502) */}
            <Image
              source={FLAKE_TEXTURE}
              style={[
                StyleSheet.absoluteFill,
                { opacity: 0.15 }
              ]}
              resizeMode="repeat"
            />

            {/* Layer 4: Fine sparkle particles - increased count, much smaller and more subtle */}
            <View style={StyleSheet.absoluteFill}>
              {[...Array(100)].map((_, i) => {
                const seed = i * 137.5;
                const x = (seed * 7.1) % 100;
                const y = (seed * 13.7) % 100;
                const baseRgb = hexToRgb(baseColor);
                const sparkle = 0.9;
                const r = Math.floor(baseRgb.r + (255 - baseRgb.r) * sparkle);
                const g = Math.floor(baseRgb.g + (255 - baseRgb.g) * sparkle);
                const b = Math.floor(baseRgb.b + (255 - baseRgb.b) * sparkle);
                // Much more subtle opacity
                const opacity = i % 5 === 0 ? 0.25 : i % 5 === 1 ? 0.2 : i % 5 === 2 ? 0.18 : i % 5 === 3 ? 0.15 : 0.12;
                // Smaller sizes - most tiny, very few slightly larger
                const size = i % 9 === 0 ? 1.0 : i % 9 === 1 ? 0.8 : i % 9 === 2 ? 0.7 : 0.5;

                return (
                  <View
                    key={`sparkle-${i}`}
                    style={[
                      {
                        position: 'absolute',
                        left: `${x}%`,
                        top: `${y}%`,
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
                        shadowColor: '#ffffff',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.8,
                        shadowRadius: 0.5,
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Layer 5: Clear coat glossy highlight - subtle shine */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0.03)',
                'rgba(255, 255, 255, 0.06)',
                'rgba(255, 255, 255, 0.03)',
                'rgba(255, 255, 255, 0)',
              ]}
              start={{ x: 0.2, y: 0.3 }}
              end={{ x: 0.8, y: 0.7 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.25 }]}
            />
          </View>
        );

      case PAINT_FINISH.PEARL:
        return (
          <View style={StyleSheet.absoluteFill}>
            {/* Base with lighter color - EXACTLY like web (line 349) */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: getLighterColor(baseColor, 1.15) }]} />

            {/* Iridescent pearl gradient - EXACT match from web (lines 427-439) */}
            <LinearGradient
              colors={[
                'transparent',
                'rgba(255, 182, 193, 0.25)',   // 0.2 stop - soft pink
                'rgba(255, 255, 255, 0.35)',   // 0.35 stop - white (peak)
                'rgba(173, 216, 230, 0.3)',    // 0.5 stop - light blue
                'rgba(255, 255, 255, 0.25)',   // 0.65 stop - white
                'rgba(255, 192, 203, 0.2)',    // 0.8 stop - pink
                'transparent',
              ]}
              start={{ x: 0.8, y: 0 }}
              end={{ x: 0.2, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Pearl flake texture overlay - matching web opacity 0.2 (line 502) */}
            <Image
              source={FLAKE_TEXTURE}
              style={[
                StyleSheet.absoluteFill,
                { opacity: 0.12 }
              ]}
              resizeMode="repeat"
            />

            {/* Pearl-specific iridescent overlays - very subtle color shifts */}
            {/* Purple-ish overlay */}
            <LinearGradient
              colors={[
                'transparent',
                'hsla(280, 25%, 85%, 0.04)',
                'hsla(280, 25%, 85%, 0.04)',
                'transparent',
              ]}
              start={{ x: 0.866, y: 0.5 }}
              end={{ x: 0.134, y: 0.5 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.12 }]}
            />

            {/* Blue-ish overlay */}
            <LinearGradient
              colors={[
                'transparent',
                'hsla(200, 30%, 88%, 0.04)',
                'hsla(200, 30%, 88%, 0.04)',
                'transparent',
              ]}
              start={{ x: 0.866, y: -0.5 }}
              end={{ x: 0.134, y: 0.5 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.12 }]}
            />

            {/* Pink-ish overlay */}
            <LinearGradient
              colors={[
                'transparent',
                'hsla(340, 25%, 85%, 0.04)',
                'hsla(340, 25%, 85%, 0.04)',
                'transparent',
              ]}
              start={{ x: -0.866, y: 0.5 }}
              end={{ x: 0.866, y: 0.5 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.12 }]}
            />

            {/* Fine pearl sparkles - increased count, smaller and more subtle */}
            <View style={StyleSheet.absoluteFill}>
              {[...Array(80)].map((_, i) => {
                const seed = i * 137.5;
                const x = (seed * 7.1) % 100;
                const y = (seed * 13.7) % 100;
                const baseRgb = hexToRgb(baseColor);
                const sparkle = 0.9;
                const r = Math.floor(baseRgb.r + (255 - baseRgb.r) * sparkle);
                const g = Math.floor(baseRgb.g + (255 - baseRgb.g) * sparkle);
                const b = Math.floor(baseRgb.b + (255 - baseRgb.b) * sparkle);
                // Much more subtle pearl shimmer
                const opacity = i % 5 === 0 ? 0.22 : i % 5 === 1 ? 0.18 : i % 5 === 2 ? 0.15 : i % 5 === 3 ? 0.12 : 0.1;
                // Much smaller sparkles
                const size = i % 9 === 0 ? 0.9 : i % 9 === 1 ? 0.75 : i % 9 === 2 ? 0.65 : 0.5;

                return (
                  <View
                    key={`pearl-sparkle-${i}`}
                    style={[
                      {
                        position: 'absolute',
                        left: `${x}%`,
                        top: `${y}%`,
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
                        shadowColor: '#FFB6C1',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.7,
                        shadowRadius: 0.5,
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Clear coat glossy highlight - subtle shine */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0.03)',
                'rgba(255, 255, 255, 0.06)',
                'rgba(255, 255, 255, 0.03)',
                'rgba(255, 255, 255, 0)',
              ]}
              start={{ x: 0.8, y: 0.1 }}
              end={{ x: 0.2, y: 0.9 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.25 }]}
            />
          </View>
        );

      case PAINT_FINISH.MATTE:
        return (
          <View style={StyleSheet.absoluteFill}>
            {/* Base color */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: baseColor }]} />

            {/* Matte darkening (multiply blend mode simulation) - lines 443-449 */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]} />
          </View>
        );

      case PAINT_FINISH.SOLID:
        return (
          <View style={StyleSheet.absoluteFill}>
            {/* Base color */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: baseColor }]} />

            {/* Glossy varnish gradient (overlay blend mode) - lines 451-470 */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.1)',
                'rgba(255, 255, 255, 0.05)',
                'rgba(255, 255, 255, 0.1)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}
            />
          </View>
        );

      case PAINT_FINISH.SATIN:
        return (
          <View style={StyleSheet.absoluteFill}>
            {/* Base color */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: baseColor }]} />

            {/* Soft satin sheen (overlay blend mode) - lines 472-493 */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0.1)',
                'rgba(255, 255, 255, 0.15)',
                'rgba(255, 255, 255, 0.1)',
                'rgba(255, 255, 255, 0)',
              ]}
              start={{ x: 0, y: 0.2 }}
              end={{ x: 0, y: 0.8 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.12 }]}
            />
          </View>
        );

      default:
        return <View style={[StyleSheet.absoluteFill, { backgroundColor: baseColor }]} />;
    }
  };

  // Show loading state until image is loaded
  if (!isImageLoaded) {
    return (
      <View style={[styles.container, { width, height, backgroundColor: baseColor, justifyContent: 'center', alignItems: 'center' }, style]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }, style]}>
      {renderFinishEffect()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 8,
  },
});
