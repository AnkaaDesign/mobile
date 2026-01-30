import React, { useState, useMemo } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { SvgXml } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { useLayoutsByTruck } from "@/hooks";
import { IconZoomIn, IconZoomOut, IconZoomReset } from "@tabler/icons-react-native";

interface TruckLayoutPreviewProps {
  truckId: string;
  taskName?: string;
}

export function TruckLayoutPreview({ truckId, taskName }: TruckLayoutPreviewProps) {
  const { colors, isDark } = useTheme();
  const { data: layouts } = useLayoutsByTruck(truckId, {
    include: { layoutSections: true },
    enabled: !!truckId,
  });
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | 'back'>('left');

  // Zoom state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Pan gesture for moving around when zoomed
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Animated style for zoom and pan
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    } as any;
  });

  // Zoom control functions
  const handleZoomIn = () => {
    const newScale = Math.min(scale.value + 0.5, MAX_SCALE);
    scale.value = withSpring(newScale);
    savedScale.value = newScale;
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale.value - 0.5, MIN_SCALE);
    scale.value = withSpring(newScale);
    savedScale.value = newScale;
  };

  const handleResetZoom = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Check if any layouts exist
  const hasLayouts = useMemo(() => {
    if (!layouts) return false;
    return !!(layouts.leftSideLayout || layouts.rightSideLayout || layouts.backSideLayout);
  }, [layouts]);

  // Get current layout
  const currentLayout = useMemo(() => {
    if (!layouts) return null;
    switch (selectedSide) {
      case 'left': return layouts.leftSideLayout;
      case 'right': return layouts.rightSideLayout;
      case 'back': return layouts.backSideLayout;
      default: return null;
    }
  }, [layouts, selectedSide]);

  // Theme-aware SVG colors
  const svgColors = useMemo(() => ({
    // Main border color - use foreground color for good contrast
    stroke: isDark ? '#e5e5e5' : '#171717',
    // Section divider color - slightly lighter/darker than main stroke
    divider: isDark ? '#a3a3a3' : '#525252',
    // Dimension lines and text color
    dimension: isDark ? '#60a5fa' : '#0066cc',
  }), [isDark]);

  // Generate SVG for preview
  const generatePreviewSVG = (layout: any, side: string, strokeColors: typeof svgColors) => {
    const getSideLabel = (s: string) => {
      switch (s) {
        case 'left': return 'Motorista';
        case 'right': return 'Sapo';
        case 'back': return 'Traseira';
        default: return s;
      }
    };

    const height = layout.height * 100; // Convert to cm
    const sections = layout.layoutSections || [];
    const totalWidth = sections.reduce((sum: number, s: any) => sum + s.width * 100, 0);
    const margin = 60; // Increased margin to accommodate dimension labels
    const extraSpace = 40;
    const svgWidth = totalWidth + margin * 2;
    const svgHeight = height + margin * 2 + extraSpace;

    let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`;

    svg += `
      <!-- Main container -->
      <rect x="${margin}" y="${margin}" width="${totalWidth}" height="${height}" fill="none" stroke="${strokeColors.stroke}" stroke-width="3"/>`;

    // Add section dividers (vertical lines between non-door sections)
    let currentPos = 0;
    sections.forEach((section: any, index: number) => {
      const sectionWidth = section.width * 100;

      // Only draw vertical divider lines between regular sections (not for doors)
      if (index > 0) {
        const prevSection = sections[index - 1];
        if (!section.isDoor && !prevSection.isDoor) {
          const lineX = margin + currentPos;
          svg += `
          <line x1="${lineX}" y1="${margin}" x2="${lineX}" y2="${margin + height}"
                stroke="${strokeColors.divider}" stroke-width="2"/>`;
        }
      }

      currentPos += sectionWidth;
    });

    // Add doors
    if (layout.doors && layout.doors.length > 0) {
      // New format with doors array
      layout.doors.forEach((door: any) => {
        const doorX = margin + (door.position || 0) * 100;
        const doorWidth = (door.width || 0) * 100;
        const doorOffsetTop = (door.offsetTop || door.topOffset || 0) * 100;
        const doorY = margin + doorOffsetTop;

        // Left vertical line of door
        svg += `
        <line x1="${doorX}" y1="${doorY}" x2="${doorX}" y2="${margin + height}"
              stroke="${strokeColors.stroke}" stroke-width="3"/>`;

        // Right vertical line of door
        svg += `
        <line x1="${doorX + doorWidth}" y1="${doorY}" x2="${doorX + doorWidth}" y2="${margin + height}"
              stroke="${strokeColors.stroke}" stroke-width="3"/>`;

        // Top horizontal line of door
        svg += `
        <line x1="${doorX}" y1="${doorY}" x2="${doorX + doorWidth}" y2="${doorY}"
              stroke="${strokeColors.stroke}" stroke-width="3"/>`;
      });
    } else if (layout.layoutSections) {
      // Handle LayoutSection entity format with doorHeight
      let sectionPos = 0;
      sections.forEach((section: any) => {
        const sectionWidth = section.width * 100;
        const sectionX = margin + sectionPos;

        // Check if this section is a door
        // doorHeight is measured from bottom of layout to top of door opening
        if (section.isDoor && section.doorHeight !== null && section.doorHeight !== undefined) {
          const doorHeightCm = section.doorHeight * 100;
          const doorTopY = margin + (height - doorHeightCm);

          // Left vertical line of door
          svg += `
          <line x1="${sectionX}" y1="${doorTopY}" x2="${sectionX}" y2="${margin + height}"
                stroke="${strokeColors.stroke}" stroke-width="3"/>`;

          // Right vertical line of door
          svg += `
          <line x1="${sectionX + sectionWidth}" y1="${doorTopY}" x2="${sectionX + sectionWidth}" y2="${margin + height}"
                stroke="${strokeColors.stroke}" stroke-width="3"/>`;

          // Top horizontal line of door
          svg += `
          <line x1="${sectionX}" y1="${doorTopY}" x2="${sectionX + sectionWidth}" y2="${doorTopY}"
                stroke="${strokeColors.stroke}" stroke-width="3"/>`;
        }

        sectionPos += sectionWidth;
      });
    }

    // Add dimensions with arrows
    currentPos = 0;
    sections.forEach((section: any) => {
      const sectionWidth = section.width * 100;
      const startX = margin + currentPos;
      const endX = margin + currentPos + sectionWidth;
      const centerX = startX + sectionWidth / 2;
      const dimY = margin + height + 20;

      svg += `
      <line x1="${startX}" y1="${dimY}" x2="${endX}" y2="${dimY}" stroke="${strokeColors.dimension}" stroke-width="2"/>
      <polygon points="${startX},${dimY} ${startX + 5},${dimY - 3} ${startX + 5},${dimY + 3}" fill="${strokeColors.dimension}"/>
      <polygon points="${endX},${dimY} ${endX - 5},${dimY - 3} ${endX - 5},${dimY + 3}" fill="${strokeColors.dimension}"/>
      <text x="${centerX}" y="${dimY + 18}" text-anchor="middle" font-size="16" font-weight="bold" fill="${strokeColors.dimension}">${Math.round(sectionWidth)}</text>`;

      currentPos += sectionWidth;
    });

    // Height dimension
    const dimX = margin - 30;
    svg += `
    <line x1="${dimX}" y1="${margin}" x2="${dimX}" y2="${margin + height}" stroke="${strokeColors.dimension}" stroke-width="2"/>
    <polygon points="${dimX},${margin} ${dimX - 3},${margin + 5} ${dimX + 3},${margin + 5}" fill="${strokeColors.dimension}"/>
    <polygon points="${dimX},${margin + height} ${dimX - 3},${margin + height - 5} ${dimX + 3},${margin + height - 5}" fill="${strokeColors.dimension}"/>
    <text x="${dimX - 10}" y="${margin + height / 2}" text-anchor="middle" font-size="16" font-weight="bold" fill="${strokeColors.dimension}" transform="rotate(-90, ${dimX - 10}, ${margin + height / 2})">${Math.round(height)}</text>
    </svg>`;

    return svg;
  };

  // Download SVG
  const downloadSVG = async () => {
    if (!currentLayout) return;

    try {
      const svgContent = generatePreviewSVG(currentLayout, selectedSide, svgColors);

      const getSideLabel = (s: string) => {
        switch (s) {
          case 'left': return 'motorista';
          case 'right': return 'sapo';
          case 'back': return 'traseira';
          default: return s;
        }
      };

      const taskPrefix = taskName ? `${taskName}-` : '';
      const sections = currentLayout.layoutSections || [];
      const totalWidth = sections.reduce((sum: number, s: any) => sum + s.width * 100, 0);
      const filename = `${taskPrefix}layout-${getSideLabel(selectedSide)}-${Math.round(totalWidth)}mm.svg`;

      // Save to file system
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, svgContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Erro", "Compartilhamento não disponível");
      }
    } catch (error) {
      console.error("Error downloading SVG:", error);
      Alert.alert("Erro", "Erro ao gerar o layout");
    }
  };

  // Get side label
  const getSideLabel = (side: 'left' | 'right' | 'back') => {
    switch (side) {
      case 'left': return 'Motorista';
      case 'right': return 'Sapo';
      case 'back': return 'Traseira';
    }
  };

  if (!layouts || !hasLayouts) {
    return null;
  }

  const svgContent = currentLayout ? generatePreviewSVG(currentLayout, selectedSide, svgColors) : null;

  return (
    <View style={styles.container}>
      {/* Side selector buttons */}
      <View style={styles.sideSelector}>
        <Button
          variant={selectedSide === 'left' ? 'default' : 'outline'}
          size="sm"
          onPress={() => setSelectedSide('left')}
          disabled={!layouts.leftSideLayout}
          style={{ flex: 1 }}
        >
          <ThemedText style={{
            fontSize: fontSize.sm,
            color: selectedSide === 'left' ? colors.primaryForeground : colors.foreground
          }}>
            {getSideLabel('left')}
          </ThemedText>
        </Button>
        <Button
          variant={selectedSide === 'right' ? 'default' : 'outline'}
          size="sm"
          onPress={() => setSelectedSide('right')}
          disabled={!layouts.rightSideLayout}
          style={{ flex: 1 }}
        >
          <ThemedText style={{
            fontSize: fontSize.sm,
            color: selectedSide === 'right' ? colors.primaryForeground : colors.foreground
          }}>
            {getSideLabel('right')}
          </ThemedText>
        </Button>
        <Button
          variant={selectedSide === 'back' ? 'default' : 'outline'}
          size="sm"
          onPress={() => setSelectedSide('back')}
          disabled={!layouts.backSideLayout}
          style={{ flex: 1 }}
        >
          <ThemedText style={{
            fontSize: fontSize.sm,
            color: selectedSide === 'back' ? colors.primaryForeground : colors.foreground
          }}>
            {getSideLabel('back')}
          </ThemedText>
        </Button>
      </View>

      {/* SVG Preview with Zoom */}
      {svgContent && (
        <View style={[styles.previewWrapper, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          {/* Zoom Controls */}
          <View style={[styles.zoomControls, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleZoomOut}
              style={styles.zoomButton}
            >
              <IconZoomOut size={20} color={colors.foreground} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleResetZoom}
              style={styles.zoomButton}
            >
              <IconZoomReset size={20} color={colors.foreground} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleZoomIn}
              style={styles.zoomButton}
            >
              <IconZoomIn size={20} color={colors.foreground} />
            </Button>
          </View>

          {/* Zoomable SVG Container */}
          <GestureHandlerRootView style={styles.gestureContainer}>
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.previewContainer, animatedStyle]}>
                <SvgXml
                  xml={svgContent}
                  width="100%"
                  height={300}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ maxWidth: '100%' }}
                />
              </Animated.View>
            </GestureDetector>
          </GestureHandlerRootView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  sideSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  downloadButton: {
    alignSelf: 'flex-start',
  },
  previewWrapper: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  zoomControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    gap: spacing.xs,
  },
  zoomButton: {
    padding: spacing.xs,
    minWidth: 36,
    minHeight: 36,
  },
  gestureContainer: {
    minHeight: 300,
    overflow: 'hidden',
  },
  previewContainer: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
});
