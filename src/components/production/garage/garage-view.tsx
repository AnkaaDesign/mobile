// Garage visualization component for React Native
// Displays trucks positioned in garage lanes with SVG rendering
// Intelligent scaling for patio to fit screen

import React, { useMemo, useState, useCallback, memo, useRef, useEffect } from 'react';
import { View, Dimensions, Pressable, StyleSheet, Alert, ScrollView, RefreshControl } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedReaction,
  Easing,
} from 'react-native-reanimated';
import { IconChevronLeft, IconChevronRight, IconDeviceFloppy, IconReload } from '@tabler/icons-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TRUCK_SPOT } from '@/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { formSpacing, formLayout } from '@/constants/form-styles';

// =====================
// Constants
// =====================

const AREAS = ['PATIO', 'B1', 'B2', 'B3'] as const;
const LANES = ['F1', 'F2', 'F3'] as const;

type AreaId = (typeof AREAS)[number];
type GarageId = 'B1' | 'B2' | 'B3';
type LaneId = (typeof LANES)[number];

// Individual garage configurations based on real measurements
const GARAGE_CONFIGS: {
  [K in GarageId]: {
    width: number;
    length: number;
    paddingTop: number; // Back margin from top
    paddingBottom: number; // Front margin from bottom
    laneLength: number;
    laneWidth: number;
    laneSpacing: number;
    lanePaddingX: number;
  };
} = {
  B1: {
    width: 20,
    length: 30,
    paddingTop: 2.2, // Back margin from top
    paddingBottom: 3.2, // Front margin from bottom
    laneLength: 24.6,
    laneWidth: 3,
    laneSpacing: 0, // Will be calculated
    lanePaddingX: 0, // Will be calculated
  },
  B2: {
    width: 18.5,
    length: 30.5,
    paddingTop: 3.5, // Back margin from top
    paddingBottom: 2.5, // Front margin from bottom
    laneLength: 24.5,
    laneWidth: 3,
    laneSpacing: 0, // Will be calculated
    lanePaddingX: 0, // Will be calculated
  },
  B3: {
    width: 20,
    length: 40,
    paddingTop: 3, // Back margin from top
    paddingBottom: 7, // Front margin from bottom
    laneLength: 30,
    laneWidth: 3,
    laneSpacing: 0, // Will be calculated
    lanePaddingX: 0, // Will be calculated
  },
};

// Calculate lane spacing and padding for each garage
// Formula: totalLaneSpace = 3 lanes * 3m = 9m
// remainingSpace = garageWidth - 9m
// lanePaddingX = remainingSpace / 4 (equal padding on sides and between lanes)
// laneSpacing = lanePaddingX
Object.keys(GARAGE_CONFIGS).forEach((key) => {
  const config = GARAGE_CONFIGS[key as GarageId];
  const totalLaneSpace = 3 * config.laneWidth; // 9m
  const remainingSpace = config.width - totalLaneSpace;
  const padding = remainingSpace / 4;
  config.lanePaddingX = padding;
  config.laneSpacing = padding;
});

// Shared constants for all garages
const GARAGE_CONFIG = {
  TRUCK_MIN_SPACING: 1, // meters minimum between trucks (matches web)
  TRUCK_MARGIN_TOP: 0.2,
  TRUCK_WIDTH_TOP_VIEW: 2.5,
  PATIO_PADDING: 1.5, // Outer padding
  PATIO_LANE_WIDTH: 2.9, // Truck width + small margin
  PATIO_LANE_SPACING: 1.5, // Spacing between patio lanes
  PATIO_TRUCK_MARGIN: 0.5, // Margin inside lanes (top and bottom)
  PATIO_MIN_LANES: 5, // Minimum number of lanes in patio
  PATIO_MIN_LANE_LENGTH: 25, // Minimum lane length in meters
} as const;

const COLORS = {
  LANE_FILL: '#FEF3C7',
  LANE_STROKE: '#D97706',
  GARAGE_FILL: '#F5F5F4',
  GARAGE_STROKE: '#78716C',
  PATIO_STROKE: '#0284C7',
} as const;

// =====================
// Types
// =====================

export interface GarageTruck {
  id: string;
  truckId?: string;
  spot: TRUCK_SPOT | null;
  taskName?: string;
  serialNumber?: string | null;
  paintHex?: string | null;
  length: number;
  originalLength?: number;
}

interface PositionedTruck extends GarageTruck {
  yPosition: number;
  xPosition: number;
}

interface LaneLayout {
  id: LaneId;
  xPosition: number;
  trucks: PositionedTruck[];
}

interface AreaLayout {
  id: AreaId;
  isPatio: boolean;
  lanes: LaneLayout[];
  patioTrucks?: PositionedTruck[];
}

// =====================
// Utility Functions
// =====================

function parseSpot(spot: TRUCK_SPOT): { garage: GarageId | null; lane: LaneId | null; spotNumber: number | null } {
  if (spot === TRUCK_SPOT.PATIO) return { garage: null, lane: null, spotNumber: null };
  const match = spot.match(/^B(\d)_F(\d)_V(\d)$/);
  if (!match) return { garage: null, lane: null, spotNumber: null };
  return {
    garage: `B${match[1]}` as GarageId,
    lane: `F${match[2]}` as LaneId,
    spotNumber: parseInt(match[3], 10),
  };
}

function calculateLaneXPosition(laneIndex: number, garageId: GarageId): number {
  const config = GARAGE_CONFIGS[garageId];
  return config.lanePaddingX + laneIndex * (config.laneWidth + config.laneSpacing);
}

function calculateGarageWidth(garageId: GarageId): number {
  return GARAGE_CONFIGS[garageId].width;
}

// Calculate optimal patio layout based on truck count and screen size
function calculatePatioLayout(trucks: GarageTruck[], screenWidth: number, maxHeight: number) {
  const patioTrucks = trucks
    .filter((t) => !t.spot || t.spot === TRUCK_SPOT.PATIO)
    .sort((a, b) => b.length - a.length); // Sort by length descending

  const laneWidth = GARAGE_CONFIG.PATIO_LANE_WIDTH;
  const laneSpacing = GARAGE_CONFIG.PATIO_LANE_SPACING;
  const padding = GARAGE_CONFIG.PATIO_PADDING;
  const truckMargin = GARAGE_CONFIG.PATIO_TRUCK_MARGIN;
  const minLanes = GARAGE_CONFIG.PATIO_MIN_LANES;
  const minLaneLength = GARAGE_CONFIG.PATIO_MIN_LANE_LENGTH;

  // Helper function to position trucks at top with minimum lane dimensions
  const positionTrucksInColumns = (cols: number) => {
    const width = padding * 2 + cols * laneWidth + (cols - 1) * laneSpacing;

    // First pass: calculate content heights (trucks + margins within lane)
    const columnContentHeights: number[] = Array(cols).fill(truckMargin);

    patioTrucks.forEach((truck, index) => {
      const col = index % cols;
      columnContentHeights[col] += truck.length + GARAGE_CONFIG.TRUCK_MIN_SPACING;
    });

    // Calculate actual content height (replace last spacing with bottom margin)
    const maxContentHeight = patioTrucks.length > 0
      ? Math.max(...columnContentHeights) - GARAGE_CONFIG.TRUCK_MIN_SPACING + truckMargin
      : truckMargin * 2;

    // Apply minimum lane length (25m)
    const actualLaneLength = Math.max(maxContentHeight, minLaneLength);

    // Position trucks at top (no centering offset)
    const columnHeights: number[] = Array(cols).fill(padding + truckMargin);
    const positioned: PositionedTruck[] = [];

    patioTrucks.forEach((truck, index) => {
      const col = index % cols;
      const truckOffset = (laneWidth - GARAGE_CONFIG.TRUCK_WIDTH_TOP_VIEW) / 2;
      const laneX = padding + col * (laneWidth + laneSpacing);

      positioned.push({
        ...truck,
        xPosition: laneX + truckOffset,
        yPosition: columnHeights[col],
      });

      columnHeights[col] += truck.length + GARAGE_CONFIG.TRUCK_MIN_SPACING;
    });

    const height = actualLaneLength + padding * 2;
    return { width, height, trucks: positioned };
  };

  // Always use minimum 5 lanes
  const cols = minLanes;
  const layout = positionTrucksInColumns(cols);

  return { columns: cols, ...layout };
}

function calculateGarageLayout(areaId: GarageId, trucks: GarageTruck[]): AreaLayout {
  const config = GARAGE_CONFIGS[areaId];
  const garageTrucks = trucks.filter((t) => {
    if (!t.spot) return false;
    const parsed = parseSpot(t.spot);
    return parsed.garage === areaId;
  });

  const lanes: LaneLayout[] = (LANES as readonly LaneId[]).map((laneId, index) => {
    const laneTrucks = garageTrucks
      .filter((t) => {
        const parsed = parseSpot(t.spot!);
        return parsed.lane === laneId;
      })
      .sort((a, b) => {
        const aSpot = parseSpot(a.spot!);
        const bSpot = parseSpot(b.spot!);
        return (aSpot.spotNumber || 0) - (bSpot.spotNumber || 0);
      });

    const truckOffset = (config.laneWidth - GARAGE_CONFIG.TRUCK_WIDTH_TOP_VIEW) / 2;
    const availableLength = config.laneLength - GARAGE_CONFIG.TRUCK_MARGIN_TOP * 2;

    // Position trucks based on their SPOT NUMBER (V1, V2, V3)
    // V1: Always top aligned
    // V2: Bottom aligned when alone, middle when V3 exists
    // V3: Always bottom aligned
    const v1Truck = laneTrucks.find(t => parseSpot(t.spot!).spotNumber === 1);
    const v2Truck = laneTrucks.find(t => parseSpot(t.spot!).spotNumber === 2);
    const v3Truck = laneTrucks.find(t => parseSpot(t.spot!).spotNumber === 3);

    const positionedTrucks: PositionedTruck[] = laneTrucks.map((truck) => {
      const parsed = parseSpot(truck.spot!);
      const spotNumber = parsed.spotNumber || 1;

      let yPosition: number;

      if (spotNumber === 1) {
        // V1: Always top aligned
        yPosition = GARAGE_CONFIG.TRUCK_MARGIN_TOP;
      } else if (spotNumber === 3) {
        // V3: Always bottom aligned
        yPosition = config.laneLength - GARAGE_CONFIG.TRUCK_MARGIN_TOP - truck.length;
      } else {
        // V2: Bottom aligned when alone, middle when V3 exists
        if (v3Truck) {
          // V2 with V3: position in the middle
          const v1Bottom = v1Truck
            ? GARAGE_CONFIG.TRUCK_MARGIN_TOP + v1Truck.length + GARAGE_CONFIG.TRUCK_MIN_SPACING
            : GARAGE_CONFIG.TRUCK_MARGIN_TOP;
          const v3Top = config.laneLength - GARAGE_CONFIG.TRUCK_MARGIN_TOP - v3Truck.length - GARAGE_CONFIG.TRUCK_MIN_SPACING;
          // Center V2 between V1's bottom and V3's top
          yPosition = v1Bottom + (v3Top - v1Bottom - truck.length) / 2;
        } else {
          // V2 alone: bottom aligned (same logic as V3)
          yPosition = config.laneLength - GARAGE_CONFIG.TRUCK_MARGIN_TOP - truck.length;
        }
      }

      return {
        ...truck,
        yPosition,
        xPosition: calculateLaneXPosition(index, areaId) + truckOffset,
      };
    });

    return { id: laneId, xPosition: calculateLaneXPosition(index, areaId), trucks: positionedTrucks };
  });

  return { id: areaId, isPatio: false, lanes };
}

// =====================
// Memoized Truck Component
// =====================

interface TruckElementProps {
  truck: PositionedTruck;
  scale: number;
  garageId?: GarageId;
  lanePositions?: number[]; // Pre-calculated lane X positions (scaled)
  laneWidth?: number; // Lane width (scaled)
  garageWidth?: number; // Total garage width (scaled) for boundary detection
  garageHeight?: number; // Total garage height (scaled) for snap decision
  onDragEnd?: (targetLane: LaneId | null, dropY: number | null) => void;
  onNavigatePrev?: () => void; // Called when truck dragged past left boundary
  onNavigateNext?: () => void; // Called when truck dragged past right boundary
  onNavigateWithTruck?: (direction: 'prev' | 'next') => void; // Navigate AND move truck
  disabled?: boolean; // Disable dragging (read-only mode)
}

const TruckElement = memo(function TruckElement({
  truck,
  scale,
  garageId,
  lanePositions,
  laneWidth,
  garageWidth,
  garageHeight,
  onDragEnd,
  onNavigatePrev,
  onNavigateNext,
  onNavigateWithTruck,
  disabled = false,
}: TruckElementProps) {
  const width = GARAGE_CONFIG.TRUCK_WIDTH_TOP_VIEW * scale;
  const height = truck.length * scale;
  const baseX = truck.xPosition * scale;
  const baseY = truck.yPosition * scale;
  const bgColor = truck.paintHex || '#ffffff';

  const getBrightness = (hex: string) => {
    try {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = rgb & 0xff;
      return (r * 299 + g * 587 + b * 114) / 1000;
    } catch {
      return 255;
    }
  };
  const textColor = getBrightness(bgColor) > 128 ? '#000000' : '#ffffff';

  const displayLength = truck.originalLength ?? truck.length;
  const maxChars = Math.max(Math.floor(height / 9), 5);
  const displayName = truck.taskName
    ? truck.taskName.length > maxChars
      ? truck.taskName.slice(0, maxChars - 2) + '..'
      : truck.taskName
    : 'N/A';

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const hasNavigated = useSharedValue(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // NOTE: We intentionally DON'T reset translation when baseX/baseY changes
  // This allows trucks to stay under the finger during garage transitions
  // The position update happens naturally when the carousel animates

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: isDragging.value ? 0.8 : 1,
    zIndex: isDragging.value ? 100 : 0,
  }));

  // Function to detect target lane from X position - runs on JS thread
  const detectTargetLane = useCallback(
    (adjustedX: number): LaneId | null => {
      if (!lanePositions || !laneWidth) return null;
      for (let i = 0; i < LANES.length; i++) {
        const laneX = lanePositions[i];
        if (adjustedX >= laneX - laneWidth / 2 && adjustedX <= laneX + laneWidth * 1.5) {
          return (['F1', 'F2', 'F3'] as LaneId[])[i];
        }
      }
      return null;
    },
    [lanePositions, laneWidth]
  );

  // Handle navigation during drag - runs on JS thread
  const handleNavigationCheck = useCallback(
    (translationX: number, setNavigated: () => void) => {
      const adjustedX = baseX + translationX;
      // Lower threshold = easier to trigger (closer to edge)
      const leftThreshold = -15;
      const rightThreshold = (garageWidth || 200) + 15;

      // Clear any existing timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }

      // Check if dragged past left boundary - navigate WITH truck
      if (adjustedX < leftThreshold) {
        navigationTimeoutRef.current = setTimeout(() => {
          setNavigated(); // Mark as navigated BEFORE calling navigation
          if (onNavigateWithTruck) {
            console.log('[TruckElement] Navigating prev with truck');
            onNavigateWithTruck('prev');
          } else if (onNavigatePrev) {
            onNavigatePrev();
          }
        }, 200); // Faster response
      }
      // Check if dragged past right boundary - navigate WITH truck
      else if (adjustedX > rightThreshold) {
        navigationTimeoutRef.current = setTimeout(() => {
          setNavigated(); // Mark as navigated BEFORE calling navigation
          if (onNavigateWithTruck) {
            console.log('[TruckElement] Navigating next with truck');
            onNavigateWithTruck('next');
          } else if (onNavigateNext) {
            onNavigateNext();
          }
        }, 200); // Faster response
      }
    },
    [baseX, garageWidth, onNavigatePrev, onNavigateNext, onNavigateWithTruck]
  );

  // Handle drag end - runs on JS thread
  const handleDragEnd = useCallback(
    (translationX: number, translationY: number) => {
      // Clear navigation timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }

      const adjustedX = baseX + translationX;
      const adjustedY = baseY + translationY;

      // Check if dragged past left boundary (navigate to previous) - fallback if timeout didn't trigger
      if (adjustedX < -15 && onNavigatePrev) {
        onNavigatePrev();
        return;
      }

      // Check if dragged past right boundary (navigate to next) - fallback if timeout didn't trigger
      if (garageWidth && adjustedX > garageWidth + 15 && onNavigateNext) {
        onNavigateNext();
        return;
      }

      // Normal lane detection - pass Y position for snap decision
      if (!onDragEnd || !garageId) return;
      const targetLane = detectTargetLane(adjustedX);
      onDragEnd(targetLane, adjustedY);
    },
    [onDragEnd, garageId, baseX, baseY, detectTargetLane, garageWidth, onNavigatePrev, onNavigateNext]
  );

  // Spring config for smoother animation with less bounce
  const springConfig = {
    damping: 20,
    stiffness: 200,
    mass: 0.8,
  };

  // Callback to mark navigation as happened (called from JS thread)
  // NOTE: We do NOT reset translation here - let the truck stay under the finger
  // The translation will be reset in onEnd after the user lifts their finger
  const markAsNavigated = useCallback(() => {
    hasNavigated.value = true;
    // Keep truck under finger during navigation - don't reset translation
    // The gesture will continue to track the finger position
  }, [hasNavigated]);

  const panGesture = Gesture.Pan()
    .enabled(!disabled) // Disable gesture in read-only mode
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      hasNavigated.value = false;
    })
    .onUpdate((event) => {
      'worklet';
      // Always update translation to keep truck under finger
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // Check for boundary navigation during drag (only if not already navigated)
      if (!hasNavigated.value) {
        runOnJS(handleNavigationCheck)(event.translationX, markAsNavigated);
      }
    })
    .onEnd((event) => {
      'worklet';
      isDragging.value = false;

      // If we navigated, the truck is now in a new garage
      // Animate back to its new base position smoothly
      if (hasNavigated.value) {
        translateX.value = withSpring(0, springConfig);
        translateY.value = withSpring(0, springConfig);
        return;
      }

      // Normal drag end - animate back and call handler
      const finalTranslationX = event.translationX;
      const finalTranslationY = event.translationY;
      translateX.value = withSpring(0, springConfig);
      translateY.value = withSpring(0, springConfig);
      runOnJS(handleDragEnd)(finalTranslationX, finalTranslationY);
    });

  // Add stroke padding to prevent clipping
  const strokeWidth = 1.5;
  const strokePadding = strokeWidth;
  const svgWidth = width + strokePadding * 2;
  const svgHeight = height + strokePadding * 2;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ position: 'absolute', left: baseX - strokePadding, top: baseY - strokePadding, width: svgWidth, height: svgHeight }, animatedStyle]}>
        <Svg width={svgWidth} height={svgHeight}>
          <Rect
            x={strokePadding}
            y={strokePadding}
            width={width}
            height={height}
            fill={bgColor}
            stroke="#333"
            strokeWidth={strokeWidth}
            rx={3}
          />
          <G rotation={-90} origin={`${svgWidth / 2}, ${svgHeight / 2}`}>
            <SvgText
              x={svgWidth / 2}
              y={svgHeight / 2}
              textAnchor="middle"
              alignmentBaseline="middle"
              fill={textColor}
              fontSize={9}
              fontWeight="bold"
            >
              {displayName}
            </SvgText>
          </G>
          <SvgText x={svgWidth / 2} y={strokePadding + 9} textAnchor="middle" fill={textColor} fontSize={6}>
            {`${displayLength.toFixed(1).replace('.', ',')}m`}
          </SvgText>
          {truck.serialNumber && (
            <SvgText x={svgWidth / 2} y={svgHeight - strokePadding - 3} textAnchor="middle" fill={textColor} fontSize={6}>
              {truck.serialNumber}
            </SvgText>
          )}
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
});

// =====================
// Ruler Component with tick marks
// =====================

interface RulerProps {
  length: number;
  scale: number;
  orientation: 'vertical' | 'horizontal';
  position: { x: number; y: number };
}

const Ruler = memo(function Ruler({ length, scale, orientation, position }: RulerProps) {
  const isVertical = orientation === 'vertical';
  const rulerLength = length * scale;
  const ticks: React.ReactNode[] = [];

  // Generate tick marks: small ticks every 1m, large ticks every 5m
  for (let i = 0; i <= length; i++) {
    const pos = i * scale;
    const is5m = i % 5 === 0;
    const tickSize = is5m ? 6 : 3;
    // Show label at 0 and every 5m
    const showLabel = is5m;

    if (isVertical) {
      ticks.push(
        <G key={i}>
          <Line x1={-tickSize} y1={pos} x2={0} y2={pos} stroke="#78716C" strokeWidth={is5m ? 1.5 : 0.5} />
          {showLabel && (
            <SvgText x={-tickSize - 6} y={pos + 3} textAnchor="end" fontSize={8} fill="#78716C">
              {i}m
            </SvgText>
          )}
        </G>
      );
    } else {
      ticks.push(
        <G key={i}>
          <Line x1={pos} y1={0} x2={pos} y2={tickSize} stroke="#78716C" strokeWidth={is5m ? 1.5 : 0.5} />
          {showLabel && (
            <SvgText x={pos} y={tickSize + 10} textAnchor="middle" fontSize={8} fill="#78716C">
              {i}m
            </SvgText>
          )}
        </G>
      );
    }
  }

  return (
    <G transform={`translate(${position.x}, ${position.y})`}>
      {/* Ruler line */}
      {isVertical ? (
        <Line x1={0} y1={0} x2={0} y2={rulerLength} stroke="#78716C" strokeWidth={1} />
      ) : (
        <Line x1={0} y1={0} x2={rulerLength} y2={0} stroke="#78716C" strokeWidth={1} />
      )}
      {ticks}
    </G>
  );
});

// =====================
// Main Component
// =====================

// Pending spot change tracking
interface PendingSpotChange {
  truckId: string;
  originalSpot: TRUCK_SPOT | null;
  newSpot: TRUCK_SPOT;
}

// Active drag tracking for cross-garage dragging
interface ActiveDrag {
  truck: PositionedTruck;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  sourceGarageIndex: number;
}

interface GarageViewProps {
  trucks: GarageTruck[];
  onTruckMove?: (truckId: string, newSpot: TRUCK_SPOT) => void;
  onSaveChanges?: (changes: Array<{ truckId: string; newSpot: TRUCK_SPOT }>) => Promise<void>;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  isSaving?: boolean;
  readOnly?: boolean;
}

export function GarageView({ trucks, onTruckMove, onSaveChanges, onRefresh, isRefreshing = false, isSaving = false, readOnly = false }: GarageViewProps) {
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingSpotChange>>(new Map());
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Layout constants - all elements have consistent padding
  const CONTAINER_PADDING = 16;
  const ACTION_BAR_HEIGHT = 72; // Action bar height when visible
  const ACTION_BAR_MARGIN = 8; // Gap between card and action bar
  const HEADER_DOTS_HEIGHT = 56; // Title + dots inside card
  const COUNTS_HEIGHT = 44; // Labels section inside card
  const CARD_INTERNAL_PADDING = 32; // Card padding (16 top + 16 bottom)
  const SAFE_AREA_BOTTOM = Math.max(insets.bottom, 16);

  // Calculate available height for garage visualization
  // Total screen height minus: top inset, container padding, card internal elements, safe area, action bar space
  const fixedOverhead = insets.top + (CONTAINER_PADDING * 2) + HEADER_DOTS_HEIGHT + COUNTS_HEIGHT + CARD_INTERNAL_PADDING + SAFE_AREA_BOTTOM + ACTION_BAR_HEIGHT + ACTION_BAR_MARGIN;
  const availableGarageHeight = screenHeight - fixedOverhead;
  const maxContainerHeight = Math.max(availableGarageHeight, 300); // Minimum 300px

  // Container width - full width minus padding
  const containerWidth = screenWidth - (CONTAINER_PADDING * 2);

  // Carousel offset for horizontal scrolling (shared value for smooth animations)
  const carouselOffset = useSharedValue(0);

  const currentAreaId = AREAS[currentAreaIndex];
  const isPatio = currentAreaId === 'PATIO';

  // Calculate layouts - get dimensions for current garage
  const currentGarageConfig = isPatio ? null : GARAGE_CONFIGS[currentAreaId as GarageId];
  const garageWidth = isPatio ? 0 : calculateGarageWidth(currentAreaId as GarageId);
  const garageHeight = isPatio ? 0 : currentGarageConfig!.length;

  // Apply pending changes to trucks list for display
  const trucksWithPendingChanges = useMemo(() => {
    if (pendingChanges.size === 0) return trucks;
    return trucks.map((truck) => {
      const change = pendingChanges.get(truck.id);
      if (change) {
        return { ...truck, spot: change.newSpot };
      }
      return truck;
    });
  }, [trucks, pendingChanges]);

  // Calculate ORIGINAL layout (without pending changes) - trucks stay in original positions
  const originalPatioLayout = useMemo(
    () => calculatePatioLayout(trucks, containerWidth, maxContainerHeight),
    [trucks, containerWidth, maxContainerHeight]
  );

  const originalGarageLayout = useMemo(() => {
    if (isPatio) return null;
    return calculateGarageLayout(currentAreaId as GarageId, trucks);
  }, [currentAreaId, trucks, isPatio]);

  // Calculate layout WITH pending changes - to get positions for moved trucks at their new locations
  const newGarageLayout = useMemo(() => {
    if (isPatio || pendingChanges.size === 0) return null;
    return calculateGarageLayout(currentAreaId as GarageId, trucksWithPendingChanges);
  }, [currentAreaId, trucksWithPendingChanges, isPatio, pendingChanges.size]);

  const newPatioLayout = useMemo(() => {
    if (pendingChanges.size === 0) return null;
    return calculatePatioLayout(trucksWithPendingChanges, containerWidth, maxContainerHeight);
  }, [trucksWithPendingChanges, containerWidth, maxContainerHeight, pendingChanges.size]);

  // Merge layouts: For patio, we need full recalculation when trucks change
  // because patio uses dynamic column layout based on sorting by length
  const patioLayout = useMemo(() => {
    if (pendingChanges.size === 0) return originalPatioLayout;

    // Patio: Use fully recalculated layout when trucks change
    // This ensures proper reallocation of all trucks when new ones are added
    return newPatioLayout || originalPatioLayout;
  }, [originalPatioLayout, newPatioLayout, pendingChanges]);

  const garageLayout = useMemo(() => {
    if (isPatio) return null;
    if (pendingChanges.size === 0 || !originalGarageLayout) return originalGarageLayout;

    // Get IDs of trucks that were moved
    const movedTruckIds = new Set(pendingChanges.keys());

    // For each lane, merge: original positions for non-moved, new positions for moved
    const mergedLanes = originalGarageLayout.lanes.map((originalLane, laneIndex) => {
      // Trucks from original that weren't moved
      const trucksFromOriginal = originalLane.trucks.filter(t => !movedTruckIds.has(t.id));

      // Trucks that were moved TO this lane (from new layout)
      const newLane = newGarageLayout?.lanes[laneIndex];
      const trucksMovedToLane = (newLane?.trucks || []).filter(t => movedTruckIds.has(t.id));

      return {
        ...originalLane,
        trucks: [...trucksFromOriginal, ...trucksMovedToLane],
      };
    });

    return {
      ...originalGarageLayout,
      lanes: mergedLanes,
    };
  }, [isPatio, originalGarageLayout, newGarageLayout, pendingChanges]);

  // Pre-calculate lane positions for TruckElement (to avoid worklet issues)
  const lanePositions = useMemo(() => {
    if (isPatio || !currentGarageConfig) return undefined;
    return LANES.map((_, index) => calculateLaneXPosition(index, currentAreaId as GarageId));
  }, [currentAreaId, isPatio, currentGarageConfig]);

  // Calculate dimensions and scale
  const contentWidth = isPatio ? patioLayout.width : garageWidth;
  const contentHeight = isPatio ? patioLayout.height : garageHeight;

  // Ruler offsets - apply to both garage and patio
  const rulerOffset = 12; // Space for left ruler (minimal gap)
  const labelPadding = 32; // Extra padding for ruler labels on the left (needs space for "30m" etc)
  const bottomRulerOffset = 25; // Space for bottom ruler
  const rulerTotalWidth = rulerOffset + labelPadding; // Total ruler space on left

  const padding = 8; // Reduced padding for more space
  const navButtonsWidth = 70; // Reduced nav button space
  const availableWidth = containerWidth - padding * 2 - navButtonsWidth - rulerTotalWidth;
  const availableHeight = maxContainerHeight - 40 - bottomRulerOffset; // More vertical space
  const scale = Math.min(availableWidth / contentWidth, availableHeight / contentHeight, 20); // Higher max scale

  // Scaled lane positions for TruckElement
  const scaledLanePositions = useMemo(() => {
    if (!lanePositions) return undefined;
    return lanePositions.map((pos) => pos * scale);
  }, [lanePositions, scale]);

  const scaledLaneWidth = currentGarageConfig ? currentGarageConfig.laneWidth * scale : undefined;

  const svgWidth = contentWidth * scale + padding + rulerTotalWidth;
  const svgHeight = contentHeight * scale + bottomRulerOffset + padding;
  const containerHeight = svgHeight + 50;

  // Offset to center the garage (not the ruler+garage group)
  // Shift left by 65% of ruler width so garage appears centered
  const centeringOffset = -rulerTotalWidth * 0.65;

  // Calculate the visible area width for carousel animation
  const visibleAreaWidth = containerWidth - 80; // Subtract nav button widths

  const handlePrevArea = useCallback(() => {
    const newIndex = currentAreaIndex > 0 ? currentAreaIndex - 1 : AREAS.length - 1;
    setCurrentAreaIndex(newIndex);
    // Animate carousel to show new area
    carouselOffset.value = withTiming(newIndex * visibleAreaWidth, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [currentAreaIndex, visibleAreaWidth, carouselOffset]);

  const handleNextArea = useCallback(() => {
    const newIndex = currentAreaIndex < AREAS.length - 1 ? currentAreaIndex + 1 : 0;
    setCurrentAreaIndex(newIndex);
    // Animate carousel to show new area
    carouselOffset.value = withTiming(newIndex * visibleAreaWidth, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [currentAreaIndex, visibleAreaWidth, carouselOffset]);

  // Navigate with truck - moves truck to new garage when dragging across boundaries
  // This function animates the carousel while keeping the truck under the finger
  const handleNavigateWithTruck = useCallback(
    (truckId: string, direction: 'prev' | 'next') => {
      const newIndex = direction === 'prev'
        ? (currentAreaIndex > 0 ? currentAreaIndex - 1 : AREAS.length - 1)
        : (currentAreaIndex < AREAS.length - 1 ? currentAreaIndex + 1 : 0);

      const newAreaId = AREAS[newIndex];
      const originalTruck = trucks.find((t) => t.id === truckId);
      const originalSpot = originalTruck?.spot || null;

      // If navigating to PATIO, move truck to PATIO
      if (newAreaId === 'PATIO') {
        setPendingChanges((prev) => {
          const next = new Map(prev);
          next.set(truckId, { truckId, originalSpot, newSpot: TRUCK_SPOT.PATIO });
          return next;
        });
        setCurrentAreaIndex(newIndex);
        // Animate carousel smoothly - truck stays under finger
        carouselOffset.value = withTiming(newIndex * visibleAreaWidth, {
          duration: 250,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
        console.log(`[GarageView] Navigated ${direction} to PATIO, moved truck ${truckId} to PATIO`);
        return;
      }

      // If navigating to a garage, try to find an available spot in that garage
      const targetGarageId = newAreaId as GarageId;

      // Get all trucks in target garage (considering pending changes)
      const trucksInTargetGarage = trucksWithPendingChanges.filter((t) => {
        if (!t.spot || t.id === truckId) return false;
        const parsed = parseSpot(t.spot);
        return parsed.garage === targetGarageId;
      });

      // Find first available spot in target garage (try each lane, V1 and V2 only - typical usage)
      let newSpot: TRUCK_SPOT | null = null;
      for (const laneId of LANES) {
        const trucksInLane = trucksInTargetGarage.filter((t) => {
          const parsed = parseSpot(t.spot!);
          return parsed.lane === laneId;
        });
        const occupiedSpots = new Set(trucksInLane.map((t) => parseSpot(t.spot!).spotNumber));

        // Only use V1 and V2 (typical lane capacity is 2 trucks)
        for (let spotNum = 1; spotNum <= 2; spotNum++) {
          if (!occupiedSpots.has(spotNum)) {
            const spotKey = `${targetGarageId}_${laneId}_V${spotNum}` as keyof typeof TRUCK_SPOT;
            newSpot = TRUCK_SPOT[spotKey];
            break;
          }
        }
        if (newSpot) break;
      }

      // If no spot found in target garage, move to PATIO instead
      if (!newSpot) {
        newSpot = TRUCK_SPOT.PATIO;
        console.log(`[GarageView] No available spot in ${targetGarageId}, moving truck ${truckId} to PATIO`);
      } else {
        console.log(`[GarageView] Navigated ${direction} to ${targetGarageId}, moved truck ${truckId} to ${newSpot}`);
      }

      // Add pending change
      setPendingChanges((prev) => {
        const next = new Map(prev);
        next.set(truckId, { truckId, originalSpot, newSpot: newSpot! });
        return next;
      });

      // Navigate to new area with smooth animation
      setCurrentAreaIndex(newIndex);
      carouselOffset.value = withTiming(newIndex * visibleAreaWidth, {
        duration: 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    },
    [currentAreaIndex, trucks, trucksWithPendingChanges, visibleAreaWidth, carouselOffset]
  );

  // Swipe gesture for navigation with smooth carousel animation
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Only activate after 20px horizontal movement
    .onUpdate((event) => {
      'worklet';
      // Preview the swipe by partially moving the carousel
      const targetOffset = currentAreaIndex * visibleAreaWidth - event.translationX * 0.3;
      carouselOffset.value = Math.max(0, Math.min(targetOffset, (AREAS.length - 1) * visibleAreaWidth));
    })
    .onEnd((event) => {
      'worklet';
      // Swipe left to go next, swipe right to go previous
      if (event.velocityX < -500 || event.translationX < -80) {
        runOnJS(handleNextArea)();
      } else if (event.velocityX > 500 || event.translationX > 80) {
        runOnJS(handlePrevArea)();
      } else {
        // Snap back to current position
        carouselOffset.value = withTiming(currentAreaIndex * visibleAreaWidth, {
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    });

  const handleTruckDragEnd = useCallback(
    (truckId: string, targetLane: LaneId | null, dropY: number | null) => {
      if (isPatio || !targetLane) return;

      // Find the truck (use trucksWithPendingChanges for current state)
      const draggedTruck = trucksWithPendingChanges.find((t) => t.id === truckId);
      if (!draggedTruck) return;

      const targetGarageId = currentAreaId as GarageId;
      const targetConfig = GARAGE_CONFIGS[targetGarageId];

      // Get original spot info (from original trucks list)
      const originalTruck = trucks.find((t) => t.id === truckId);
      const originalSpot = originalTruck?.spot || null;

      // Get dragged truck's current spot info (with pending changes applied)
      const draggedTruckParsed = draggedTruck.spot ? parseSpot(draggedTruck.spot) : null;
      const draggedTruckCurrentSpot = draggedTruck.spot;

      // Build map of spot -> truck for target lane (excluding dragged truck)
      // Also calculate Y positions for direct hit detection
      const spotToTruck = new Map<number, typeof trucksWithPendingChanges[0]>();
      const truckYPositions: Array<{ truck: typeof trucksWithPendingChanges[0]; spotNumber: number; yStart: number; yEnd: number }> = [];

      trucksWithPendingChanges.forEach((t) => {
        if (!t.spot || t.id === truckId) return;
        const parsed = parseSpot(t.spot);
        if (parsed.garage === targetGarageId && parsed.lane === targetLane && parsed.spotNumber) {
          spotToTruck.set(parsed.spotNumber, t);

          // Calculate Y position for this truck (same logic as calculateGarageLayout)
          let yPosition: number;
          const v1Truck = parsed.spotNumber === 1 ? t : trucksWithPendingChanges.find(tr => tr.spot && parseSpot(tr.spot).garage === targetGarageId && parseSpot(tr.spot).lane === targetLane && parseSpot(tr.spot).spotNumber === 1);
          const v3Truck = trucksWithPendingChanges.find(tr => tr.spot && parseSpot(tr.spot).garage === targetGarageId && parseSpot(tr.spot).lane === targetLane && parseSpot(tr.spot).spotNumber === 3);

          if (parsed.spotNumber === 1) {
            yPosition = GARAGE_CONFIG.TRUCK_MARGIN_TOP;
          } else if (parsed.spotNumber === 3) {
            yPosition = targetConfig.laneLength - GARAGE_CONFIG.TRUCK_MARGIN_TOP - t.length;
          } else {
            if (v3Truck) {
              const v1Bottom = v1Truck
                ? GARAGE_CONFIG.TRUCK_MARGIN_TOP + v1Truck.length + GARAGE_CONFIG.TRUCK_MIN_SPACING
                : GARAGE_CONFIG.TRUCK_MARGIN_TOP;
              const v3Top = targetConfig.laneLength - GARAGE_CONFIG.TRUCK_MARGIN_TOP - v3Truck.length - GARAGE_CONFIG.TRUCK_MIN_SPACING;
              yPosition = v1Bottom + (v3Top - v1Bottom - t.length) / 2;
            } else {
              yPosition = targetConfig.laneLength - GARAGE_CONFIG.TRUCK_MARGIN_TOP - t.length;
            }
          }

          truckYPositions.push({
            truck: t,
            spotNumber: parsed.spotNumber,
            yStart: yPosition * scale,
            yEnd: (yPosition + t.length) * scale,
          });
        }
      });

      // PRIORITY 1: Check for direct hit on any truck in the lane
      // If dropping directly on a truck, swap with that specific truck regardless of snap preference
      let directHitTruck: { truck: typeof trucksWithPendingChanges[0]; spotNumber: number } | null = null;
      const TOLERANCE = 0.5 * scale; // 0.5 meters tolerance for hit detection

      if (dropY !== null) {
        for (const tp of truckYPositions) {
          if (dropY >= tp.yStart - TOLERANCE && dropY <= tp.yEnd + TOLERANCE) {
            directHitTruck = { truck: tp.truck, spotNumber: tp.spotNumber };
            break;
          }
        }
      }

      // If direct hit on another truck, swap with that truck
      if (directHitTruck) {
        const targetTruckSpot = directHitTruck.truck.spot!;
        const swapTargetSpot = draggedTruckCurrentSpot && draggedTruckCurrentSpot !== TRUCK_SPOT.PATIO
          ? draggedTruckCurrentSpot
          : TRUCK_SPOT.PATIO;

        // Don't swap if it's the same truck (shouldn't happen but safety check)
        if (directHitTruck.truck.id === truckId) return;

        // Get original spot for the truck being swapped
        const originalSwapTruck = trucks.find((t) => t.id === directHitTruck!.truck.id);
        const originalSwapSpot = originalSwapTruck?.spot || null;

        setPendingChanges((prev) => {
          const next = new Map(prev);

          // Move dragged truck to target truck's spot
          if (originalSpot !== targetTruckSpot) {
            next.set(truckId, { truckId, originalSpot, newSpot: targetTruckSpot });
          } else {
            next.delete(truckId);
          }

          // Move target truck to dragged truck's current spot
          if (originalSwapSpot !== swapTargetSpot) {
            next.set(directHitTruck!.truck.id, {
              truckId: directHitTruck!.truck.id,
              originalSpot: originalSwapSpot,
              newSpot: swapTargetSpot,
            });
          } else {
            next.delete(directHitTruck!.truck.id);
          }

          return next;
        });
        return;
      }

      // PRIORITY 2: No direct hit - use snap-to-lane logic based on lane position
      const laneHeight = targetConfig.laneLength;
      const scaledLaneHeight = laneHeight * scale;
      const isDroppedInTopHalf = dropY !== null && dropY < scaledLaneHeight / 2;
      const preferredSpotNum = isDroppedInTopHalf ? 1 : 2;

      // Check if dragged truck is already in the target lane at the preferred spot
      const isAlreadyAtPreferredSpot =
        draggedTruckParsed?.garage === targetGarageId &&
        draggedTruckParsed?.lane === targetLane &&
        draggedTruckParsed?.spotNumber === preferredSpotNum;

      if (isAlreadyAtPreferredSpot) {
        // Truck is being dropped at its own position - no change needed
        return;
      }

      // Check if preferred spot is occupied by another truck
      const truckAtPreferredSpot = spotToTruck.get(preferredSpotNum);

      if (truckAtPreferredSpot) {
        // SWAP: Preferred spot is occupied - swap the two trucks
        const spotKey = `${targetGarageId}_${targetLane}_V${preferredSpotNum}` as keyof typeof TRUCK_SPOT;
        const newSpotForDragged = TRUCK_SPOT[spotKey];
        const swapTargetSpot = draggedTruckCurrentSpot && draggedTruckCurrentSpot !== TRUCK_SPOT.PATIO
          ? draggedTruckCurrentSpot
          : TRUCK_SPOT.PATIO;

        // Get original spot for the truck being swapped
        const originalSwapTruck = trucks.find((t) => t.id === truckAtPreferredSpot.id);
        const originalSwapSpot = originalSwapTruck?.spot || null;

        setPendingChanges((prev) => {
          const next = new Map(prev);

          // Move dragged truck to preferred spot
          if (originalSpot !== newSpotForDragged) {
            next.set(truckId, { truckId, originalSpot, newSpot: newSpotForDragged });
          } else {
            next.delete(truckId);
          }

          // Move other truck to dragged truck's current spot
          if (originalSwapSpot !== swapTargetSpot) {
            next.set(truckAtPreferredSpot.id, {
              truckId: truckAtPreferredSpot.id,
              originalSpot: originalSwapSpot,
              newSpot: swapTargetSpot,
            });
          } else {
            next.delete(truckAtPreferredSpot.id);
          }

          return next;
        });
        return;
      }

      // Preferred spot is empty - move there
      const spotKey = `${targetGarageId}_${targetLane}_V${preferredSpotNum}` as keyof typeof TRUCK_SPOT;
      const newSpot = TRUCK_SPOT[spotKey];

      if (originalSpot !== newSpot) {
        setPendingChanges((prev) => {
          const next = new Map(prev);
          next.set(truckId, { truckId, originalSpot, newSpot });
          return next;
        });
      } else {
        // Moving back to original position - remove pending change
        setPendingChanges((prev) => {
          const next = new Map(prev);
          next.delete(truckId);
          return next;
        });
      }
    },
    [trucksWithPendingChanges, trucks, currentAreaId, isPatio, scale]
  );

  // Save all pending changes
  const handleSaveChanges = useCallback(async () => {
    if (pendingChanges.size === 0) return;

    const changes = Array.from(pendingChanges.values()).map((c) => ({
      truckId: c.truckId,
      newSpot: c.newSpot,
    }));

    if (onSaveChanges) {
      try {
        await onSaveChanges(changes);
        setPendingChanges(new Map());
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível salvar as alterações');
      }
    } else if (onTruckMove) {
      // Fallback: call onTruckMove for each change
      changes.forEach((c) => onTruckMove(c.truckId, c.newSpot));
      setPendingChanges(new Map());
    }
  }, [pendingChanges, onSaveChanges, onTruckMove]);

  // Restore all pending changes
  const handleRestoreChanges = useCallback(() => {
    setPendingChanges(new Map());
  }, []);

  const hasChanges = pendingChanges.size > 0;

  const getAreaTitle = (areaId: AreaId) => (areaId === 'PATIO' ? 'Pátio' : `Barracão ${areaId.slice(1)}`);

  // Count trucks per garage (using data with pending changes for display consistency)
  const garageCounts = useMemo(() => {
    const counts: Record<string, number> = { B1: 0, B2: 0, B3: 0, PATIO: 0 };
    trucksWithPendingChanges.forEach((t) => {
      if (!t.spot || t.spot === TRUCK_SPOT.PATIO) {
        counts.PATIO++;
      } else {
        const parsed = parseSpot(t.spot);
        if (parsed.garage) {
          counts[parsed.garage]++;
        }
      }
    });
    return counts;
  }, [trucksWithPendingChanges]);

  const inGarages = garageCounts.B1 + garageCounts.B2 + garageCounts.B3;
  const inPatio = garageCounts.PATIO;

  return (
    <View style={[styles.container, { paddingHorizontal: CONTAINER_PADDING, paddingTop: CONTAINER_PADDING }]}>
      {/* Card takes full available space, ScrollView inside for pull-to-refresh */}
      <Card style={[styles.card, { marginBottom: hasChanges ? ACTION_BAR_MARGIN : SAFE_AREA_BOTTOM }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          {/* Top section - Header and dots */}
          <View style={styles.topSection}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.foreground }]}>{getAreaTitle(currentAreaId)}</Text>
            </View>
            <View style={styles.dotsContainer}>
              {AREAS.map((area, index) => (
                <Pressable
                  key={area}
                  onPress={() => setCurrentAreaIndex(index)}
                  style={[
                    styles.dot,
                    { backgroundColor: index === currentAreaIndex ? (area === 'PATIO' ? '#0EA5E9' : '#F59E0B') : '#D1D5DB' },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Middle section - Garage visualization centered */}
          <View style={styles.middleSection}>
            <GestureDetector gesture={swipeGesture}>
              <View style={[styles.garageContainer, { width: containerWidth, height: containerHeight }]}>
            <Pressable onPress={handlePrevArea} style={styles.navButton}>
              <IconChevronLeft size={24} color="#666" />
            </Pressable>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <View style={{ width: svgWidth, height: svgHeight, marginLeft: centeringOffset }}>
              <Svg width={svgWidth} height={svgHeight}>
              <G transform={`translate(${padding / 2 + rulerTotalWidth}, ${padding / 2})`}>
                {isPatio ? (
                  <>
                    {/* Left ruler (vertical - patio height) */}
                    <Ruler
                      length={Math.ceil(patioLayout.height)}
                      scale={scale}
                      orientation="vertical"
                      position={{ x: -rulerOffset, y: 0 }}
                    />

                    <Rect
                      x={0}
                      y={0}
                      width={patioLayout.width * scale}
                      height={patioLayout.height * scale}
                      fill={COLORS.GARAGE_FILL}
                      stroke={COLORS.PATIO_STROKE}
                      strokeWidth={2}
                      rx={4}
                    />
                    {Array.from({ length: patioLayout.columns }).map((_, i) => {
                      const laneX = GARAGE_CONFIG.PATIO_PADDING + i * (GARAGE_CONFIG.PATIO_LANE_WIDTH + GARAGE_CONFIG.PATIO_LANE_SPACING);
                      return (
                        <Rect
                          key={i}
                          x={laneX * scale}
                          y={GARAGE_CONFIG.PATIO_PADDING * scale}
                          width={GARAGE_CONFIG.PATIO_LANE_WIDTH * scale}
                          height={(patioLayout.height - GARAGE_CONFIG.PATIO_PADDING * 2) * scale}
                          fill={COLORS.LANE_FILL}
                          stroke={COLORS.LANE_STROKE}
                          strokeWidth={1.5}
                          rx={3}
                        />
                      );
                    })}

                    {/* Bottom ruler (horizontal - patio width) */}
                    <Ruler
                      length={Math.ceil(patioLayout.width)}
                      scale={scale}
                      orientation="horizontal"
                      position={{ x: 0, y: patioLayout.height * scale + 5 }}
                    />
                  </>
                ) : (
                  <>
                    {/* Left ruler (vertical - garage length) */}
                    <Ruler
                      length={garageHeight}
                      scale={scale}
                      orientation="vertical"
                      position={{ x: -rulerOffset, y: 0 }}
                    />

                    {/* Garage rectangle */}
                    <Rect
                      x={0}
                      y={0}
                      width={garageWidth * scale}
                      height={garageHeight * scale}
                      fill={COLORS.GARAGE_FILL}
                      stroke={COLORS.GARAGE_STROKE}
                      strokeWidth={2}
                      rx={4}
                    />

                    {/* Lanes */}
                    {garageLayout?.lanes.map((lane) => {
                      const laneX = lane.xPosition * scale;
                      const laneY = currentGarageConfig!.paddingTop * scale;
                      const laneW = currentGarageConfig!.laneWidth * scale;
                      const laneH = currentGarageConfig!.laneLength * scale;
                      return (
                        <G key={lane.id}>
                          <Rect
                            x={laneX}
                            y={laneY}
                            width={laneW}
                            height={laneH}
                            fill={COLORS.LANE_FILL}
                            stroke={COLORS.LANE_STROKE}
                            strokeWidth={2}
                            rx={3}
                          />
                          {/* Lane label just below the lane */}
                          <SvgText
                            x={laneX + laneW / 2}
                            y={laneY + laneH + 12}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight="bold"
                            fill="#78716C"
                          >
                            {lane.id}
                          </SvgText>
                        </G>
                      );
                    })}

                    {/* Bottom ruler (horizontal - garage width) */}
                    <Ruler
                      length={garageWidth}
                      scale={scale}
                      orientation="horizontal"
                      position={{ x: 0, y: garageHeight * scale + 5 }}
                    />
                  </>
                )}
              </G>
            </Svg>

            {/* Trucks Overlay - positioned relative to SVG wrapper */}
            <View
              style={{
                position: 'absolute',
                left: padding / 2 + rulerTotalWidth,
                top: isPatio ? padding / 2 : currentGarageConfig!.paddingTop * scale + padding / 2,
                width: (isPatio ? patioLayout.width : garageWidth) * scale,
                height: (isPatio ? patioLayout.height : currentGarageConfig!.laneLength) * scale,
                overflow: 'visible', // Allow dragged trucks to be visible outside bounds
              }}
            >
              {isPatio
                ? patioLayout.trucks.map((truck) => (
                    <TruckElement
                      key={truck.id}
                      truck={truck}
                      scale={scale}
                      garageWidth={patioLayout.width * scale}
                      onNavigatePrev={handlePrevArea}
                      onNavigateNext={handleNextArea}
                      onNavigateWithTruck={readOnly ? undefined : (direction) => handleNavigateWithTruck(truck.id, direction)}
                      disabled={readOnly}
                    />
                  ))
                : garageLayout?.lanes.flatMap((lane) =>
                    lane.trucks.map((truck) => (
                      <TruckElement
                        key={truck.id}
                        truck={truck}
                        scale={scale}
                        garageId={currentAreaId as GarageId}
                        lanePositions={scaledLanePositions}
                        laneWidth={scaledLaneWidth}
                        garageWidth={garageWidth * scale}
                        garageHeight={currentGarageConfig!.laneLength * scale}
                        onDragEnd={readOnly ? undefined : (targetLane, dropY) => handleTruckDragEnd(truck.id, targetLane, dropY)}
                        onNavigatePrev={handlePrevArea}
                        onNavigateNext={handleNextArea}
                        onNavigateWithTruck={readOnly ? undefined : (direction) => handleNavigateWithTruck(truck.id, direction)}
                        disabled={readOnly}
                      />
                    ))
                  )}
              </View>
              </View>
            </View>

            <Pressable onPress={handleNextArea} style={styles.navButton}>
              <IconChevronRight size={24} color="#666" />
              </Pressable>
            </View>
          </GestureDetector>
          </View>

          {/* Bottom section - Counts always at bottom */}
          <View style={styles.bottomSection}>
            <View style={styles.countsContainer}>
          <View style={styles.countsGrid}>
            <View style={styles.countItem}>
              <View style={[styles.countSquare, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.countText, { color: colors.foreground }]}>B1: {garageCounts.B1}</Text>
            </View>
            <View style={styles.countItem}>
              <View style={[styles.countSquare, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.countText, { color: colors.foreground }]}>B2: {garageCounts.B2}</Text>
            </View>
            <View style={styles.countItem}>
              <View style={[styles.countSquare, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.countText, { color: colors.foreground }]}>B3: {garageCounts.B3}</Text>
            </View>
            <View style={styles.countItem}>
              <View style={[styles.countSquare, { backgroundColor: '#0EA5E9' }]} />
              <Text style={[styles.countText, { color: colors.foreground }]}>Pátio: {inPatio}</Text>
            </View>
            <View style={styles.countItem}>
              <View style={[styles.countSquare, { backgroundColor: '#6B7280' }]} />
              <Text style={[styles.countText, { color: colors.foreground }]}>Total: {trucks.length}</Text>
            </View>
          </View>
            </View>
          </View>
        </ScrollView>
      </Card>

      {/* Action Bar - same width as card, styled to match */}
      {hasChanges && (
        <View style={[
          styles.actionBar,
          {
            marginBottom: SAFE_AREA_BOTTOM,
            backgroundColor: colors.card,
            borderColor: colors.border,
          }
        ]}>
          <View style={styles.actionButtonWrapper}>
            <Button
              variant="outline"
              onPress={handleRestoreChanges}
              disabled={isSaving}
            >
              <IconReload size={18} color={colors.mutedForeground} />
              <Text style={[styles.actionButtonText, { color: colors.foreground }]}>Desfazer</Text>
            </Button>
          </View>
          <View style={styles.actionButtonWrapper}>
            <Button
              variant="default"
              onPress={handleSaveChanges}
              disabled={isSaving}
            >
              <IconDeviceFloppy size={18} color={colors.primaryForeground} />
              <Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>Salvar</Text>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
    overflow: 'hidden', // Clip ScrollView to card bounds
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  // Layout sections
  topSection: {
    alignItems: 'center',
    marginBottom: 4,
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    marginTop: 4,
  },
  header: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600', color: '#44403C' },
  dotsContainer: { flexDirection: 'row', gap: 6, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  garageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: { width: 40, height: '100%', justifyContent: 'center', alignItems: 'center' },
  // Counts with compact grid layout
  countsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  countsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    rowGap: 8,
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Rounded square indicator
  countSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Action bar - same width as card, styled like a card
  actionBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default GarageView;
