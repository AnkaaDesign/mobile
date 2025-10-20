import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PAINT_FINISH } from "../../constants/enums";

interface PaintPreviewProps {
  baseColor: string;
  finish: PAINT_FINISH;
  width: number;
  height: number;
  borderRadius?: number;
}

export const PaintPreview: React.FC<PaintPreviewProps> = ({
  baseColor,
  finish,
  width,
  height,
  borderRadius = 8,
}) => {
  // Helper to lighten/darken color
  const adjustColor = (color: string, percent: number): string => {
    // Remove # if present
    const hex = color.replace("#", "");

    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Adjust
    const adjust = (value: number) => {
      const adjusted = value + (255 - value) * (percent / 100);
      return Math.min(255, Math.max(0, Math.round(adjusted)));
    };

    const newR = adjust(r);
    const newG = adjust(g);
    const newB = adjust(b);

    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  const renderFinish = () => {
    switch (finish) {
      case PAINT_FINISH.SOLID:
        // Simple flat color
        return (
          <View
            style={[
              styles.preview,
              {
                backgroundColor: baseColor,
                width,
                height,
                borderRadius,
              },
            ]}
          />
        );

      case PAINT_FINISH.METALLIC:
        // Metallic with anisotropic bands and highlights
        const metallicLight = adjustColor(baseColor, 40);
        const metallicDark = adjustColor(baseColor, -20);
        return (
          <View style={{ width, height, borderRadius, overflow: "hidden" }}>
            <LinearGradient
              colors={[metallicLight, baseColor, metallicDark, baseColor, metallicLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.3, 0.5, 0.7, 1]}
              style={[styles.preview, { width, height }]}
            />
            {/* Add sparkle effect overlay */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  opacity: 0.6,
                },
              ]}
            />
          </View>
        );

      case PAINT_FINISH.PEARL:
        // Pearl with multi-directional gradient
        const pearlLight = adjustColor(baseColor, 50);
        const pearlMid = adjustColor(baseColor, 25);
        return (
          <View style={{ width, height, borderRadius, overflow: "hidden" }}>
            <LinearGradient
              colors={[pearlLight, pearlMid, baseColor, pearlMid, pearlLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.25, 0.5, 0.75, 1]}
              style={[styles.preview, { width, height }]}
            />
            {/* Add pearl shimmer overlay */}
            <LinearGradient
              colors={["rgba(255, 255, 255, 0.3)", "transparent", "rgba(255, 255, 255, 0.2)"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        );

      case PAINT_FINISH.MATTE:
        // Matte with flat, non-reflective appearance
        return (
          <View
            style={[
              styles.preview,
              {
                backgroundColor: baseColor,
                width,
                height,
                borderRadius,
                opacity: 0.9,
              },
            ]}
          />
        );

      case PAINT_FINISH.SATIN:
        // Satin with subtle directional lighting
        const satinLight = adjustColor(baseColor, 15);
        return (
          <View style={{ width, height, borderRadius, overflow: "hidden" }}>
            <LinearGradient
              colors={[satinLight, baseColor, baseColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.5, 1]}
              style={[styles.preview, { width, height }]}
            />
          </View>
        );

      default:
        return (
          <View
            style={[
              styles.preview,
              {
                backgroundColor: baseColor,
                width,
                height,
                borderRadius,
              },
            ]}
          />
        );
    }
  };

  return <View style={{ width, height, borderRadius, overflow: "hidden" }}>{renderFinish()}</View>;
};

const styles = StyleSheet.create({
  preview: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
