// Patio visualization component for trucks without assigned spots (React Native)
// Displays trucks in a grid layout that have entered but not yet assigned to a garage

import React, { useMemo } from 'react';
import { View, Dimensions, Pressable } from 'react-native';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { GarageTruck } from './garage-view';

// =====================
// Constants
// =====================

const PATIO_CONFIG = {
  TRUCK_WIDTH: 2.8,
  TRUCK_MIN_SPACING: 2,
  DEFAULT_TRUCK_LENGTH: 12,
  TARGET_WIDTH: 25,
} as const;

// =====================
// Types
// =====================

interface PositionedTruck extends GarageTruck {
  xPosition: number;
  yPosition: number;
}

interface PatioLayout {
  trucks: PositionedTruck[];
  width: number;
  height: number;
  columns: number;
  rows: number;
}

// =====================
// Layout Calculation
// =====================

function calculatePatioLayout(trucks: GarageTruck[]): PatioLayout {
  if (trucks.length === 0) {
    return {
      trucks: [],
      width: 0,
      height: 0,
      columns: 0,
      rows: 0,
    };
  }

  const avgTruckLength =
    trucks.reduce((sum, t) => sum + t.length, 0) / trucks.length;
  const truckWidth = PATIO_CONFIG.TRUCK_WIDTH;
  const spacing = PATIO_CONFIG.TRUCK_MIN_SPACING;

  // Calculate columns to fit in a reasonable width
  const columns = Math.max(
    1,
    Math.floor(PATIO_CONFIG.TARGET_WIDTH / (truckWidth + spacing))
  );
  const rows = Math.ceil(trucks.length / columns);

  // Position trucks in grid
  const positionedTrucks: PositionedTruck[] = trucks.map((truck, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    return {
      ...truck,
      xPosition: col * (truckWidth + spacing) + spacing,
      yPosition: row * (avgTruckLength + spacing) + spacing,
    };
  });

  const totalWidth = columns * (truckWidth + spacing) + spacing;
  const totalHeight = rows * (avgTruckLength + spacing) + spacing;

  return {
    trucks: positionedTrucks,
    width: totalWidth,
    height: totalHeight,
    columns,
    rows,
  };
}

// =====================
// Sub-components
// =====================

interface TruckElementProps {
  truck: PositionedTruck;
  scale: number;
  avgLength: number;
  onPress?: () => void;
}

function TruckElement({ truck, scale, avgLength, onPress }: TruckElementProps) {
  const width = PATIO_CONFIG.TRUCK_WIDTH * scale;
  const height = avgLength * scale;
  const x = truck.xPosition * scale;
  const y = truck.yPosition * scale;
  const bgColor = truck.paintHex || '#ffffff';

  // Determine text color based on background brightness
  const getBrightness = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    return (r * 299 + g * 587 + b * 114) / 1000;
  };
  const textColor = getBrightness(bgColor) > 128 ? '#000000' : '#ffffff';

  return (
    <G onPress={onPress}>
      {/* Truck body */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={bgColor}
        stroke="#333"
        strokeWidth={2}
        rx={4}
      />
      {/* Task name (rotated 90deg) */}
      <G rotation={-90} origin={`${x + width / 2}, ${y + height / 2}`}>
        <SvgText
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill={textColor}
          fontSize={Math.min(10, width * 0.8)}
          fontWeight="bold"
        >
          {truck.taskName?.slice(0, 15) || 'N/A'}
        </SvgText>
      </G>
      {/* Length label at top */}
      <SvgText
        x={x + width / 2}
        y={y + 10}
        textAnchor="middle"
        fill={textColor}
        fontSize={8}
      >
        {truck.length.toFixed(1).replace('.', ',')}m
      </SvgText>
      {/* Serial number at bottom */}
      {truck.serialNumber && (
        <SvgText
          x={x + width / 2}
          y={y + height - 4}
          textAnchor="middle"
          fill={textColor}
          fontSize={6}
        >
          {truck.serialNumber}
        </SvgText>
      )}
    </G>
  );
}

// =====================
// Main Component
// =====================

interface PatioViewProps {
  trucks: GarageTruck[];
  onTruckSelect?: (truckId: string) => void;
  className?: string;
}

export function PatioView({ trucks, onTruckSelect, className }: PatioViewProps) {
  const patioLayout = useMemo(() => calculatePatioLayout(trucks), [trucks]);

  const screenWidth = Dimensions.get('window').width;
  const containerWidth = Math.min(screenWidth - 32, 400);
  const containerHeight = 400;
  const padding = 40;

  if (trucks.length === 0) {
    return (
      <View className={cn('flex flex-col items-center gap-4 p-8', className)}>
        <Text className="text-xl font-bold">Pátio</Text>
        <Text className="text-muted-foreground text-center">
          Nenhum caminhão no pátio.{'\n'}
          Caminhões aparecem aqui quando entram mas ainda não têm vaga atribuída.
        </Text>
      </View>
    );
  }

  // Calculate scale to fit container
  const scaleX = (containerWidth - padding * 2) / patioLayout.width;
  const scaleY = (containerHeight - padding * 2) / patioLayout.height;
  const scale = Math.min(scaleX, scaleY, 15); // Cap scale to prevent too large trucks

  const avgLength =
    trucks.reduce((sum, t) => sum + t.length, 0) / trucks.length;

  const svgWidth = Math.min(patioLayout.width * scale + padding * 2, containerWidth);
  const svgHeight = Math.min(patioLayout.height * scale + padding * 2, containerHeight);

  return (
    <View className={cn('flex flex-col items-center gap-4', className)}>
      {/* Header */}
      <View className="flex-row items-center gap-4">
        <Text className="text-xl font-bold">Pátio</Text>
        <Text className="text-sm text-muted-foreground">
          ({trucks.length} caminhão{trucks.length !== 1 ? 'ões' : ''})
        </Text>
      </View>

      {/* Patio SVG */}
      <View
        className="border rounded-lg bg-muted/20 p-4"
        style={{ width: containerWidth, height: containerHeight }}
      >
        <Svg width={svgWidth - 32} height={svgHeight - 32}>
          <G transform={`translate(${padding - 16}, ${padding - 16})`}>
            {/* Patio boundary */}
            <Rect
              x={0}
              y={0}
              width={patioLayout.width * scale}
              height={patioLayout.height * scale}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="8"
            />

            {/* Trucks */}
            {patioLayout.trucks.map((truck) => (
              <TruckElement
                key={truck.id}
                truck={truck}
                scale={scale}
                avgLength={avgLength}
                onPress={() => onTruckSelect?.(truck.id)}
              />
            ))}

            {/* Grid info */}
            <SvgText
              x={(patioLayout.width * scale) / 2}
              y={-8}
              textAnchor="middle"
              fontSize={8}
              fill="#666"
            >
              {patioLayout.columns} x {patioLayout.rows} ({trucks.length} total)
            </SvgText>
          </G>
        </Svg>
      </View>

      {/* Legend */}
      <Text className="text-sm text-muted-foreground text-center px-4">
        Toque em um caminhão para atribuir uma vaga
      </Text>
    </View>
  );
}

export default PatioView;
