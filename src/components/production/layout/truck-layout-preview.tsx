import React, { useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { SvgXml } from "react-native-svg";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { useLayoutsByTruck } from "@/hooks";
import { showToast } from "@/components/ui/toast";

interface TruckLayoutPreviewProps {
  truckId: string;
  taskName?: string;
}

export function TruckLayoutPreview({ truckId, taskName }: TruckLayoutPreviewProps) {
  const { colors } = useTheme();
  const { data: layouts } = useLayoutsByTruck(truckId, {
    include: { layoutSections: true },
    enabled: !!truckId,
  });
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | 'back'>('left');

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

  // Generate SVG for preview
  const generatePreviewSVG = (layout: any, side: string) => {
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
      <rect x="${margin}" y="${margin}" width="${totalWidth}" height="${height}" fill="none" stroke="#000" stroke-width="3"/>`;

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
                stroke="#333" stroke-width="2"/>`;
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
              stroke="#000" stroke-width="3"/>`;

        // Right vertical line of door
        svg += `
        <line x1="${doorX + doorWidth}" y1="${doorY}" x2="${doorX + doorWidth}" y2="${margin + height}"
              stroke="#000" stroke-width="3"/>`;

        // Top horizontal line of door
        svg += `
        <line x1="${doorX}" y1="${doorY}" x2="${doorX + doorWidth}" y2="${doorY}"
              stroke="#000" stroke-width="3"/>`;
      });
    } else if (layout.layoutSections) {
      // Handle both new LayoutSection entity format and old sections format
      let sectionPos = 0;
      sections.forEach((section: any) => {
        const sectionWidth = section.width * 100;
        const sectionX = margin + sectionPos;

        // Check if this section is a door
        if (section.isDoor && section.doorOffset !== null && section.doorOffset !== undefined) {
          const doorOffsetTop = section.doorOffset * 100;
          const doorY = margin + doorOffsetTop;

          // Left vertical line of door
          svg += `
          <line x1="${sectionX}" y1="${doorY}" x2="${sectionX}" y2="${margin + height}"
                stroke="#000" stroke-width="3"/>`;

          // Right vertical line of door
          svg += `
          <line x1="${sectionX + sectionWidth}" y1="${doorY}" x2="${sectionX + sectionWidth}" y2="${margin + height}"
                stroke="#000" stroke-width="3"/>`;

          // Top horizontal line of door
          svg += `
          <line x1="${sectionX}" y1="${doorY}" x2="${sectionX + sectionWidth}" y2="${doorY}"
                stroke="#000" stroke-width="3"/>`;
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
      <line x1="${startX}" y1="${dimY}" x2="${endX}" y2="${dimY}" stroke="#0066cc" stroke-width="2"/>
      <polygon points="${startX},${dimY} ${startX + 5},${dimY - 3} ${startX + 5},${dimY + 3}" fill="#0066cc"/>
      <polygon points="${endX},${dimY} ${endX - 5},${dimY - 3} ${endX - 5},${dimY + 3}" fill="#0066cc"/>
      <text x="${centerX}" y="${dimY + 18}" text-anchor="middle" font-size="16" font-weight="bold" fill="#0066cc">${Math.round(sectionWidth)}</text>`;

      currentPos += sectionWidth;
    });

    // Height dimension
    const dimX = margin - 30;
    svg += `
    <line x1="${dimX}" y1="${margin}" x2="${dimX}" y2="${margin + height}" stroke="#0066cc" stroke-width="2"/>
    <polygon points="${dimX},${margin} ${dimX - 3},${margin + 5} ${dimX + 3},${margin + 5}" fill="#0066cc"/>
    <polygon points="${dimX},${margin + height} ${dimX - 3},${margin + height - 5} ${dimX + 3},${margin + height - 5}" fill="#0066cc"/>
    <text x="${dimX - 10}" y="${margin + height / 2}" text-anchor="middle" font-size="16" font-weight="bold" fill="#0066cc" transform="rotate(-90, ${dimX - 10}, ${margin + height / 2})">${Math.round(height)}</text>
    </svg>`;

    return svg;
  };

  // Download SVG
  const downloadSVG = async () => {
    if (!currentLayout) return;

    try {
      const svgContent = generatePreviewSVG(currentLayout, selectedSide);

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
        showToast({ message: "Compartilhamento não disponível", type: "error" });
      }
    } catch (error) {
      console.error("Error downloading SVG:", error);
      showToast({ message: "Erro ao gerar o layout", type: "error" });
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

  const svgContent = currentLayout ? generatePreviewSVG(currentLayout, selectedSide) : null;

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

      {/* SVG Preview */}
      {svgContent && (
        <View style={[styles.previewContainer, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <SvgXml
            xml={svgContent}
            width="100%"
            height={300}
            preserveAspectRatio="xMidYMid meet"
            style={{ maxWidth: '100%' }}
          />
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
  previewContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    overflow: 'hidden',
  },
});
