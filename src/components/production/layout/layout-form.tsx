import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SvgXml } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import { IconZoomIn, IconZoomOut, IconZoomReset } from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { FilePicker, FilePickerItem } from "@/components/ui/file-picker";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import type { LayoutCreateFormData } from "@/schemas";
// import { showToast } from "@/components/ui/toast";
import { getApiBaseUrl } from "@/utils/file";

// MeasurementInput component with local state (like web version)
const MeasurementInput = React.memo(({
  value,
  onChange,
  placeholder = "0,00",
  disabled = false,
  min,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
}) => {
  const { colors } = useTheme();
  const [localValue, setLocalValue] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);

  // Format number for display (cm to m with comma)
  const formatValue = (val: number): string => {
    if (val === 0) return "";
    const meters = val / 100;
    return meters.toFixed(2).replace(".", ",");
  };

  // Parse display value to cm
  const parseValue = (val: string): number => {
    if (!val || val === "") return 0;
    const normalized = val.replace(",", ".");
    const parsed = parseFloat(normalized);
    if (isNaN(parsed)) return 0;

    // If value looks like whole number > 10, treat as cm
    if (!val.includes(",") && !val.includes(".") && parsed > 10) {
      return parsed;
    }

    return parsed * 100; // Convert meters to cm
  };

  // Update local value when external value changes (but not while focused)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(formatValue(value));
    }
  }, [value, isFocused]);

  const handleChange = (text: string) => {
    // Allow only numbers, comma, and dot
    if (!/^[0-9.,]*$/.test(text)) return;

    // Check for multiple separators
    const commaCount = (text.match(/,/g) || []).length;
    const dotCount = (text.match(/\./g) || []).length;
    if (commaCount + dotCount > 1) return;

    setLocalValue(text.replace(".", ","));
  };

  const handleBlur = () => {
    setIsFocused(false);

    let cmValue = parseValue(localValue);

    // Apply min/max constraints
    if (min !== undefined) cmValue = Math.max(min, cmValue);
    if (max !== undefined) cmValue = Math.min(max, cmValue);

    const newValue = Math.round(cmValue);
    if (newValue !== value) {
      onChange(newValue);
    }
    setLocalValue(formatValue(cmValue));
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <TextInput
      value={localValue}
      onChangeText={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      keyboardType="decimal-pad"
      editable={!disabled}
      style={[
        styles.rowInput,
        {
          color: colors.foreground,
          borderColor: colors.border,
          backgroundColor: disabled ? colors.muted : colors.background,
        }
      ]}
    />
  );
});

// Extended type to include photoUri for new photos that haven't been uploaded yet
type LayoutDataWithPhoto = LayoutCreateFormData & { photoUri?: string };

interface LayoutFormProps {
  selectedSide: 'left' | 'right' | 'back';
  layouts: {
    left?: LayoutDataWithPhoto;
    right?: LayoutDataWithPhoto;
    back?: LayoutDataWithPhoto;
  };
  onChange: (side: 'left' | 'right' | 'back', data: LayoutDataWithPhoto) => void;
  disabled?: boolean;
  /** When true, disables the internal ScrollView and KeyboardAvoidingView (use when nested in another scrollable) */
  embedded?: boolean;
}

interface Door {
  id: string;
  position: number; // Position from left edge in cm
  width: number; // Door width in cm
  doorHeight: number; // Height of the door from bottom of layout in cm
}

interface SideState {
  height: number;
  totalWidth: number;
  doors: Door[];
}

// Store photo state separately (like web implementation) to avoid sync issues
// Using FilePickerItem[] for consistency with FilePicker component
interface PhotoState {
  file?: FilePickerItem;  // File item (either new from picker or existing from backend)
  photoId?: string | null;  // ID from backend (existing photo)
}

// Helper function to convert photoId to URL
const getPhotoUrl = (photoId: string | null): string | undefined => {
  if (!photoId) return undefined;
  const apiUrl = getApiBaseUrl();
  return `${apiUrl}/files/serve/${photoId}`;
};

export function LayoutForm({ selectedSide, layouts, onChange, disabled = false, embedded = false }: LayoutFormProps) {
  const { colors, isDark } = useTheme();

  // Zoom/pan state for preview
  const zoomScale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      zoomScale.value = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = zoomScale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedZoomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: zoomScale.value },
    ],
  } as any));

  const handleZoomIn = () => {
    const newScale = Math.min(zoomScale.value + 0.5, MAX_SCALE);
    zoomScale.value = withSpring(newScale);
    savedScale.value = newScale;
  };

  const handleZoomOut = () => {
    const newScale = Math.max(zoomScale.value - 0.5, MIN_SCALE);
    zoomScale.value = withSpring(newScale);
    savedScale.value = newScale;
  };

  const handleResetZoom = () => {
    zoomScale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Theme-aware SVG colors (matching truck-layout-preview)
  const svgColors = useMemo(() => ({
    stroke: isDark ? '#e5e5e5' : '#171717',
    divider: isDark ? '#a3a3a3' : '#525252',
    dimension: isDark ? '#60a5fa' : '#0066cc',
  }), [isDark]);

  // Keyboard-aware scrolling (only used when not embedded)
  const { handlers, refs } = useKeyboardAwareScroll();

  // Memoize keyboard context value
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  // Track if we're currently saving to prevent state reset during save
  const isSavingRef = useRef(false);

  // Track last user interaction timestamp to prevent unwanted resets
  // Initialize to 0 to allow initial sync from backend
  const lastUserInteractionRef = useRef<number>(0);

  // Track if there are pending changes that shouldn't be overwritten
  const hasPendingChangesRef = useRef<boolean>(false);

  // Track which sides have had their initial state emitted
  const initialStateEmittedRef = useRef<Record<'left' | 'right' | 'back', boolean>>({
    left: false,
    right: false,
    back: false,
  });

  // Measured container width for accurate door button overlay positioning
  const [svgContainerWidth, setSvgContainerWidth] = useState(0);

  // Store photo state SEPARATELY from layout state (like web implementation)
  // This prevents sync issues when layout state updates
  const [photoState, setPhotoState] = useState<PhotoState>({});

  // Initialize side states from layouts prop
  const [sideStates, setSideStates] = useState<Record<'left' | 'right' | 'back', SideState>>(() => {
    const initialStates: Record<'left' | 'right' | 'back', SideState> = {
      left: { height: 240, totalWidth: 800, doors: [] },
      right: { height: 240, totalWidth: 800, doors: [] },
      back: { height: 242, totalWidth: 242, doors: [] }
    };

    // Initialize from layouts prop if available
    Object.keys(layouts).forEach((side) => {
      const layoutData = layouts[side as 'left' | 'right' | 'back'];
      if (layoutData?.layoutSections) {
        // Photo is handled separately in photoState
        const state: SideState = {
          height: (layoutData.height || 2.4) * 100,
          totalWidth: 0,
          doors: [],
        };

        const layoutSections = layoutData.layoutSections;
        const total = layoutSections.reduce((sum, s) => sum + s.width * 100, 0);
        state.totalWidth = total || 800;

        // Extract doors from sections
        const extractedDoors: Door[] = [];
        let currentPos = 0;

        layoutSections.forEach((section, idx) => {
          if (section.isDoor) {
            extractedDoors.push({
              id: `door-${side}-${idx}-${Date.now()}`,
              position: currentPos,
              width: section.width * 100,
              doorHeight: (section.doorHeight || 1.9) * 100
            });
          }
          currentPos += section.width * 100;
        });

        state.doors = extractedDoors;
        initialStates[side as 'left' | 'right' | 'back'] = state;
      }
    });

    return initialStates;
  });

  const currentState = sideStates[selectedSide];

  // CRITICAL: Sync state when layouts prop changes (e.g., when backend data arrives)
  // Photo state is synced separately below
  useEffect(() => {
    if (!layouts) return;

    // Don't sync if user has pending changes
    if (hasPendingChangesRef.current) {
      console.log('[LayoutForm Mobile] Skipping sync - user has pending changes');
      return;
    }

    // Don't sync if currently saving
    if (isSavingRef.current) {
      console.log('[LayoutForm Mobile] Skipping sync - currently saving');
      return;
    }

    console.log('[LayoutForm Mobile] Syncing state from layouts prop:', layouts);

    setSideStates(prev => {
      const newStates = { ...prev };
      let hasChanges = false;

      // Sync each side that has data in layouts prop
      Object.keys(layouts).forEach((side) => {
        const layoutData = layouts[side as 'left' | 'right' | 'back'];
        if (layoutData?.layoutSections && Array.isArray(layoutData.layoutSections)) {
          // Photo is handled separately in photoState
          const state: SideState = {
            height: (layoutData.height || 2.4) * 100,
            totalWidth: 0,
            doors: [],
          };

          const layoutSections = layoutData.layoutSections;
          const total = layoutSections.reduce((sum, s) => sum + s.width * 100, 0);
          state.totalWidth = total || (side === 'back' ? 242 : 800);

          // Extract doors from sections
          const extractedDoors: Door[] = [];
          let currentPos = 0;

          layoutSections.forEach((section, idx) => {
            if (section.isDoor) {
              extractedDoors.push({
                id: `door-${side}-${idx}-${Date.now()}-${Math.random()}`,
                position: currentPos,
                width: section.width * 100,
                doorHeight: (section.doorHeight || 1.9) * 100
              });
            }
            currentPos += section.width * 100;
          });

          state.doors = extractedDoors;
          newStates[side as 'left' | 'right' | 'back'] = state;
          hasChanges = true;

          console.log(`[LayoutForm Mobile] Synced ${side} side:`, {
            height: state.height,
            totalWidth: state.totalWidth,
            doorsCount: state.doors.length,
          });
        }
      });

      return hasChanges ? newStates : prev;
    });
  }, [layouts]);

  // Separate effect for syncing photo state from layout (back side only)
  // This runs independently to avoid circular dependency issues (like web implementation)
  useEffect(() => {
    if (!layouts) return;

    // For back side only, sync photo from layout
    if (selectedSide !== 'back') {
      return;
    }

    const backLayout = layouts.back;

    console.log('[LayoutForm Mobile PHOTO SYNC] Checking photo sync', {
      hasBackLayout: !!backLayout,
      backLayoutPhotoId: backLayout?.photoId,
      backLayoutPhotoUri: backLayout?.photoUri,
      currentPhotoStateId: photoState.photoId,
      currentPhotoStateUri: photoState.file?.uri,
    });

    // If user has selected a new file (has imageUri but no photoId), don't overwrite it
    if (photoState.file?.uri && !photoState.photoId) {
      console.log('[LayoutForm Mobile PHOTO SYNC] ⏭️ Skipping - user has selected a new photo');
      return;
    }

    // Check if parent has a new photo URI (from user selection in this session)
    if (backLayout?.photoUri) {
      if (photoState.file?.uri === backLayout.photoUri) {
        console.log('[LayoutForm Mobile PHOTO SYNC] ⏭️ Skipping - photo already synced');
        return;
      }

      console.log('[LayoutForm Mobile PHOTO SYNC] ✅ Syncing new photo from parent:', backLayout.photoUri);
      setPhotoState({
        file: {
          uri: backLayout.photoUri,
          name: `layout-photo-${Date.now()}.jpg`,
          type: 'image/jpeg',
        },
        photoId: backLayout.photoId || null,
      });
      return;
    }

    // Check if backend has an existing photo (photoId)
    if (backLayout?.photoId) {
      if (photoState.photoId === backLayout.photoId) {
        console.log('[LayoutForm Mobile PHOTO SYNC] ⏭️ Skipping - backend photo already synced');
        return;
      }

      console.log('[LayoutForm Mobile PHOTO SYNC] ✅ Syncing existing photo from backend:', backLayout.photoId);
      const photoUrl = getPhotoUrl(backLayout.photoId);
      setPhotoState({
        file: photoUrl ? {
          uri: photoUrl,
          name: `layout-photo-${backLayout.photoId}.jpg`,
          type: 'image/jpeg',
          id: backLayout.photoId,
          uploaded: true,
          thumbnailUrl: photoUrl,
        } : undefined,
        photoId: backLayout.photoId,
      });
      return;
    }

    // Layout has no photo - clear photoState only if it had a photoId (not a new user-selected photo)
    if (photoState.photoId && !photoState.file?.uri) {
      console.log('[LayoutForm Mobile PHOTO SYNC] ❌ Clearing photo state - layout has no photo');
      setPhotoState({});
    }
  }, [layouts, selectedSide, photoState.photoId, photoState.file?.uri]);

  // CRITICAL: Emit initial state to parent when selected side changes
  // This ensures parent knows the default values
  // Using setTimeout to avoid "Cannot update a component while rendering" error
  useEffect(() => {
    console.log('[LayoutForm Mobile] Initial state emission check', {
      selectedSide,
      hasOnChange: !!onChange,
      alreadyEmitted: initialStateEmittedRef.current[selectedSide],
    });

    // Skip if no onChange handler
    if (!onChange) {
      return;
    }

    // Skip if we've already emitted initial state for this side
    if (initialStateEmittedRef.current[selectedSide]) {
      return;
    }

    // Skip if we have a layout prop with layoutSections (already synced)
    const layoutData = layouts[selectedSide];
    if (layoutData && layoutData.layoutSections) {
      initialStateEmittedRef.current[selectedSide] = true;
      return;
    }

    // Use requestAnimationFrame to defer the state update and avoid the React warning
    // "Cannot update a component while rendering a different component"
    // requestAnimationFrame ensures the update happens after React finishes rendering
    const frameId = requestAnimationFrame(() => {
      const state = sideStates[selectedSide];
      const segments = calculateSegments(state.doors, state.totalWidth);

      const layoutSections = segments.map((segment, index) => ({
        width: segment.width / 100,
        isDoor: segment.type === 'door',
        doorHeight: segment.type === 'door' && segment.door ? segment.door.doorHeight / 100 : null,
        position: index
      }));

      // Include photo from separate photoState (only for back side)
      const layoutDataToEmit: LayoutDataWithPhoto = {
        height: state.height / 100,
        layoutSections,
        photoId: selectedSide === 'back' ? (photoState.photoId || null) : null,
        photoUri: selectedSide === 'back' ? photoState.file?.uri : undefined,
      };

      console.log('[LayoutForm Mobile] Emitting initial state:', {
        selectedSide,
        layoutSectionsCount: layoutSections.length,
        height: layoutDataToEmit.height,
        hasPhotoUri: !!layoutDataToEmit.photoUri,
      });

      // Mark this side as having emitted state
      initialStateEmittedRef.current[selectedSide] = true;

      // Emit to parent
      onChange(selectedSide, layoutDataToEmit);
    });

    return () => cancelAnimationFrame(frameId);
  }, [selectedSide, onChange, photoState]);

  // Calculate segments (sections between doors)
  const calculateSegments = (doors: Door[], totalWidth: number) => {
    if (doors.length === 0) {
      return [{
        type: 'segment',
        start: 0,
        end: totalWidth,
        width: Math.round(totalWidth)
      }];
    }

    const sortedDoors = [...doors].sort((a, b) => a.position - b.position);
    const segments: any[] = [];
    let currentPos = 0;

    sortedDoors.forEach((door) => {
      if (door.position > currentPos) {
        segments.push({
          type: 'segment',
          start: currentPos,
          end: door.position,
          width: Math.round(door.position - currentPos)
        });
      }

      segments.push({
        type: 'door',
        start: door.position,
        end: door.position + door.width,
        width: Math.round(door.width),
        door: door
      });

      currentPos = door.position + door.width;
    });

    if (currentPos < totalWidth) {
      segments.push({
        type: 'segment',
        start: currentPos,
        end: totalWidth,
        width: Math.round(totalWidth - currentPos)
      });
    }

    return segments;
  };

  const segments = useMemo(() => {
    if (!currentState) return [];
    return calculateSegments(currentState.doors, currentState.totalWidth);
  }, [currentState]);

  // Update current side and emit changes
  const updateCurrentSide = useCallback((updates: Partial<SideState>) => {
    console.log('[LayoutForm Mobile] User made a change:', {
      selectedSide,
      updates: Object.keys(updates),
    });

    // CRITICAL: Record timestamp of user interaction and mark as having pending changes
    lastUserInteractionRef.current = Date.now();
    hasPendingChangesRef.current = true;
    console.log('[LayoutForm Mobile] Recorded user interaction');

    // Set saving flag to prevent state reset during save
    isSavingRef.current = true;

    setSideStates(prev => {
      const newState = {
        ...prev,
        [selectedSide]: {
          ...prev[selectedSide],
          ...updates
        }
      };

      // Sync height between left and right sides (not back)
      if (updates.height !== undefined && selectedSide !== 'back') {
        const oppositeSide = selectedSide === 'left' ? 'right' : 'left';
        newState[oppositeSide] = {
          ...newState[oppositeSide],
          height: updates.height
        };
      }

      // Schedule the onChange callback to run after state update completes
      // This avoids the "Cannot update a component while rendering" warning
      setTimeout(() => {
        const state = newState[selectedSide];
        const updatedSegments = calculateSegments(state.doors, state.totalWidth);

        const layoutSections = updatedSegments.map((segment, index) => ({
          width: segment.width / 100,
          isDoor: segment.type === 'door',
          doorHeight: segment.type === 'door' && segment.door ? segment.door.doorHeight / 100 : null,
          position: index
        }));

        // Include photo from separate photoState (only for back side)
        const layoutData: LayoutDataWithPhoto = {
          height: state.height / 100,
          layoutSections,
          photoId: selectedSide === 'back' ? (photoState.photoId || null) : null,
          photoUri: selectedSide === 'back' ? photoState.file?.uri : undefined,
        };

        console.log('[LayoutForm Mobile] ✅ Emitting changes:', {
          selectedSide,
          layoutSectionsCount: layoutSections.length,
          totalWidth: layoutSections.reduce((sum, s) => sum + s.width, 0),
          hasPhotoUri: !!layoutData.photoUri,
        });

        onChange(selectedSide, layoutData);

        // Also emit changes for the opposite side if height was synced
        if (updates.height !== undefined && selectedSide !== 'back') {
          const oppositeSide = selectedSide === 'left' ? 'right' : 'left';
          const oppositeState = newState[oppositeSide];
          const oppositeSegments = calculateSegments(oppositeState.doors, oppositeState.totalWidth);

          const oppositeLayoutSections = oppositeSegments.map((segment, index) => ({
            width: segment.width / 100,
            isDoor: segment.type === 'door',
            doorHeight: segment.type === 'door' && segment.door ? segment.door.doorHeight / 100 : null,
            position: index
          }));

          const oppositeLayoutData: LayoutDataWithPhoto = {
            height: oppositeState.height / 100,
            layoutSections: oppositeLayoutSections,
            photoId: null,
            photoUri: undefined,
          };

          console.log('[LayoutForm Mobile] ✅ Emitting synced height to opposite side:', oppositeSide);
          onChange(oppositeSide, oppositeLayoutData);
        }

        // Reset saving flag after a delay
        setTimeout(() => {
          isSavingRef.current = false;
        }, 500);
      }, 0);

      return newState;
    });
  }, [selectedSide, onChange, photoState]);

  // Add a new door with smart positioning (matches web implementation)
  const addDoor = useCallback(() => {
    if (!currentState || selectedSide === 'back') return;

    const doorWidth = 100; // Default door width in cm
    const defaultDoorHeight = 190; // Default door height from bottom in cm (1.90m)

    let position: number;
    const doors = currentState.doors;

    if (doors.length === 0) {
      // First door - center it
      position = currentState.totalWidth / 2 - doorWidth / 2;
    } else if (doors.length === 1) {
      // Second door - distribute evenly
      const spacing = Math.round(currentState.totalWidth / 3);
      const firstDoorNewPosition = Math.round(spacing - doorWidth / 2);
      position = Math.round((spacing * 2) - doorWidth / 2);

      // Update both doors at once
      const updatedDoors = [
        {
          ...doors[0],
          position: Math.round(Math.max(0, firstDoorNewPosition))
        },
        {
          id: `door-${selectedSide}-${Date.now()}-${Math.random()}`,
          position: Math.round(Math.max(0, Math.min(position, currentState.totalWidth - doorWidth))),
          width: Math.round(doorWidth),
          doorHeight: Math.round(defaultDoorHeight)
        }
      ];

      updateCurrentSide({ doors: updatedDoors });
      return;
    } else {
      // Third+ door - find best empty space
      const sortedDoors = [...doors].sort((a, b) => a.position - b.position);
      let bestGap = 0;
      let bestPosition = 0;

      // Check gap at the beginning (allow doors at edge - no minimum buffer required)
      if (sortedDoors[0].position >= doorWidth) {
        bestGap = sortedDoors[0].position;
        bestPosition = Math.round((sortedDoors[0].position - doorWidth) / 2);
      }

      // Check gaps between doors
      for (let i = 0; i < sortedDoors.length - 1; i++) {
        const gapStart = sortedDoors[i].position + sortedDoors[i].width;
        const gapEnd = sortedDoors[i + 1].position;
        const gapSize = gapEnd - gapStart;

        if (gapSize > bestGap && gapSize >= doorWidth) {
          bestGap = gapSize;
          bestPosition = Math.round(gapStart + (gapSize - doorWidth) / 2);
        }
      }

      // Check gap at the end (allow doors at edge - no minimum buffer required)
      const lastDoor = sortedDoors[sortedDoors.length - 1];
      const endGap = currentState.totalWidth - (lastDoor.position + lastDoor.width);
      if (endGap > bestGap && endGap >= doorWidth) {
        bestPosition = Math.round(lastDoor.position + lastDoor.width + (endGap - doorWidth) / 2);
      }

      position = bestPosition;
    }

    // Add the door
    const newDoor = {
      id: `door-${selectedSide}-${Date.now()}-${Math.random()}`,
      position: Math.round(Math.max(0, Math.min(position, currentState.totalWidth - doorWidth))),
      width: Math.round(doorWidth),
      doorHeight: Math.round(defaultDoorHeight)
    };

    updateCurrentSide({ doors: [...doors, newDoor] });
  }, [currentState, selectedSide, updateCurrentSide]);

  // Remove door
  const removeDoor = useCallback((doorId: string) => {
    if (!currentState) return;
    updateCurrentSide({ doors: currentState.doors.filter(d => d.id !== doorId) });
  }, [currentState, updateCurrentSide]);

  // Update door height (direct value in cm)
  const updateDoorHeight = useCallback((doorId: string, heightCm: number) => {
    if (!currentState) return;

    // Door height must be between 50cm and the layout height
    const clampedHeight = Math.max(50, Math.min(currentState.height, heightCm));

    const updatedDoors = currentState.doors.map(d =>
      d.id === doorId ? { ...d, doorHeight: clampedHeight } : d
    );
    updateCurrentSide({ doors: updatedDoors });
  }, [currentState, updateCurrentSide]);

  // Update segment width (direct value in cm)
  const updateSegmentWidth = useCallback((index: number, widthCm: number) => {
    const segment = segments[index];
    if (!segment) return;

    widthCm = Math.max(50, widthCm); // Minimum 50cm

    const oldWidth = segment.width;
    const widthDiff = widthCm - oldWidth;

    if (segment.type === 'door' && segment.door) {
      // Update door width
      const updatedDoors = currentState.doors.map(d =>
        d.id === segment.door.id ? { ...d, width: widthCm } : d
      );
      updateCurrentSide({
        doors: updatedDoors,
        totalWidth: Math.max(100, currentState.totalWidth + widthDiff)
      });
    } else {
      // Update segment - if last segment, change total width
      if (index === segments.length - 1) {
        updateCurrentSide({ totalWidth: Math.max(100, currentState.totalWidth + widthDiff) });
      } else {
        // Shift doors after this segment
        const sortedDoors = [...currentState.doors].sort((a, b) => a.position - b.position);
        const newDoors = sortedDoors.map(door => {
          if (door.position >= segment.end) {
            return { ...door, position: Math.max(0, door.position + widthDiff) };
          }
          return door;
        });

        updateCurrentSide({
          doors: newDoors,
          totalWidth: Math.max(100, currentState.totalWidth + widthDiff)
        });
      }
    }
  }, [segments, currentState, updateCurrentSide]);

  // Update height (direct value in cm)
  const updateHeight = useCallback((heightCm: number) => {
    heightCm = Math.max(100, Math.min(400, heightCm));
    updateCurrentSide({ height: heightCm });
  }, [updateCurrentSide]);

  // Handle photo change from FilePicker (for back side layout photo)
  const handlePhotoChange = useCallback((files: FilePickerItem[]) => {
    const file = files[0]; // Single file mode

    if (!file) {
      // Photo was removed
      console.log('[LayoutForm Mobile] Photo removed');
      setPhotoState({});

      // Notify parent about photo removal
      if (!currentState) return;

      const segments = calculateSegments(currentState.doors, currentState.totalWidth);
      const layoutSections = segments.map((segment, index) => ({
        width: segment.width / 100,
        isDoor: segment.type === 'door',
        doorHeight: segment.type === 'door' && segment.door ? segment.door.doorHeight / 100 : null,
        position: index
      }));

      const layoutData: LayoutDataWithPhoto = {
        height: currentState.height / 100,
        layoutSections,
        photoId: null,
        photoUri: undefined,
      };

      onChange(selectedSide, layoutData);
      return;
    }

    console.log('[LayoutForm Mobile] Photo selected:', file.uri);

    // Store photo in separate photoState
    setPhotoState({
      file,
      photoId: file.id || null, // Keep existing ID if it's an already-uploaded file
    });

    // CRITICAL: Mark as having pending changes to prevent backend resets
    lastUserInteractionRef.current = Date.now();
    hasPendingChangesRef.current = true;
    console.log('[LayoutForm Mobile] Photo upload - marked as pending changes');

    // Trigger parent notification to include the photo
    if (!currentState) return;

    const segments = calculateSegments(currentState.doors, currentState.totalWidth);
    const layoutSections = segments.map((segment, index) => ({
      width: segment.width / 100,
      isDoor: segment.type === 'door',
      doorHeight: segment.type === 'door' && segment.door ? segment.door.doorHeight / 100 : null,
      position: index
    }));

    const layoutData: LayoutDataWithPhoto = {
      height: currentState.height / 100,
      layoutSections,
      photoId: file.id || null, // Keep existing ID if it's an already-uploaded file
      photoUri: file.uploaded ? undefined : file.uri, // Only include URI for new photos
    };

    console.log('[LayoutForm Mobile] Emitting layout with photo:', {
      hasPhotoUri: !!layoutData.photoUri,
      hasPhotoId: !!layoutData.photoId,
      layoutSectionsCount: layoutSections.length,
    });

    // Notify parent immediately with photo
    onChange(selectedSide, layoutData);
  }, [selectedSide, currentState, onChange]);

  // Generate SVG preview string (matching truck-layout-preview.tsx pattern)
  const previewSvgContent = useMemo(() => {
    if (!currentState) return null;

    const height = currentState.height; // Already in cm
    const totalWidth = currentState.totalWidth; // Already in cm
    const margin = 60;
    const extraSpace = 40;
    const svgWidth = totalWidth + margin * 2;
    const svgHeight = height + margin * 2 + extraSpace;

    let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`;

    // Main container rectangle
    svg += `\n<rect x="${margin}" y="${margin}" width="${totalWidth}" height="${height}" fill="none" stroke="${svgColors.stroke}" stroke-width="3"/>`;

    // Section dividers (vertical lines between non-door segments)
    let currentPos = 0;
    segments.forEach((segment: any, index: number) => {
      if (index > 0) {
        const prevSegment = segments[index - 1];
        if (segment.type !== 'door' && prevSegment.type !== 'door') {
          const lineX = margin + currentPos;
          svg += `\n<line x1="${lineX}" y1="${margin}" x2="${lineX}" y2="${margin + height}" stroke="${svgColors.divider}" stroke-width="2"/>`;
        }
      }
      currentPos += segment.width;
    });

    // Doors (only for sides, not back)
    if (selectedSide !== 'back') {
      currentState.doors.forEach((door) => {
        const doorX = margin + door.position;
        const doorWidth = door.width;
        const doorTopY = margin + (height - door.doorHeight);

        svg += `\n<line x1="${doorX}" y1="${doorTopY}" x2="${doorX}" y2="${margin + height}" stroke="${svgColors.stroke}" stroke-width="3"/>`;
        svg += `\n<line x1="${doorX + doorWidth}" y1="${doorTopY}" x2="${doorX + doorWidth}" y2="${margin + height}" stroke="${svgColors.stroke}" stroke-width="3"/>`;
        svg += `\n<line x1="${doorX}" y1="${doorTopY}" x2="${doorX + doorWidth}" y2="${doorTopY}" stroke="${svgColors.stroke}" stroke-width="3"/>`;
      });
    }

    // Width dimensions with arrows (per segment)
    currentPos = 0;
    segments.forEach((segment: any) => {
      const sectionWidth = segment.width;
      const startX = margin + currentPos;
      const endX = margin + currentPos + sectionWidth;
      const centerX = startX + sectionWidth / 2;
      const dimY = margin + height + 20;

      svg += `\n<line x1="${startX}" y1="${dimY}" x2="${endX}" y2="${dimY}" stroke="${svgColors.dimension}" stroke-width="2"/>`;
      svg += `\n<polygon points="${startX},${dimY} ${startX + 5},${dimY - 3} ${startX + 5},${dimY + 3}" fill="${svgColors.dimension}"/>`;
      svg += `\n<polygon points="${endX},${dimY} ${endX - 5},${dimY - 3} ${endX - 5},${dimY + 3}" fill="${svgColors.dimension}"/>`;
      svg += `\n<text x="${centerX}" y="${dimY + 18}" text-anchor="middle" font-size="16" font-weight="bold" fill="${svgColors.dimension}">${Math.round(sectionWidth)}</text>`;

      currentPos += sectionWidth;
    });

    // Height dimension (left side)
    const dimX = margin - 30;
    svg += `\n<line x1="${dimX}" y1="${margin}" x2="${dimX}" y2="${margin + height}" stroke="${svgColors.dimension}" stroke-width="2"/>`;
    svg += `\n<polygon points="${dimX},${margin} ${dimX - 3},${margin + 5} ${dimX + 3},${margin + 5}" fill="${svgColors.dimension}"/>`;
    svg += `\n<polygon points="${dimX},${margin + height} ${dimX - 3},${margin + height - 5} ${dimX + 3},${margin + height - 5}" fill="${svgColors.dimension}"/>`;
    svg += `\n<text x="${dimX - 10}" y="${margin + height / 2}" text-anchor="middle" font-size="16" font-weight="bold" fill="${svgColors.dimension}" transform="rotate(-90, ${dimX - 10}, ${margin + height / 2})">${Math.round(height)}</text>`;

    svg += `\n</svg>`;
    return svg;
  }, [currentState, segments, svgColors, selectedSide]);

  // Scale for positioning overlay remove buttons on top of SVG
  // Must account for preserveAspectRatio="xMidYMid meet" which scales to fit
  // the smaller dimension and centers the content
  const SVG_DISPLAY_HEIGHT = 200;
  const svgNativeWidth = currentState ? currentState.totalWidth + 120 : 600; // totalWidth + margin*2
  const svgNativeHeight = currentState ? currentState.height + 160 : 400; // height + margin*2 + extraSpace
  const svgDisplayWidth = svgContainerWidth > 0 ? svgContainerWidth - 2 * spacing.sm : 0; // subtract zoomableContent padding
  const scaleX = svgDisplayWidth > 0 ? svgDisplayWidth / svgNativeWidth : 0;
  const scaleY = SVG_DISPLAY_HEIGHT / svgNativeHeight;
  const svgActualScale = Math.min(scaleX, scaleY);
  // Centering offsets from "xMidYMid meet"
  const svgOffsetX = svgDisplayWidth > 0 ? (svgDisplayWidth - svgNativeWidth * svgActualScale) / 2 : 0;
  const svgOffsetY = (SVG_DISPLAY_HEIGHT - svgNativeHeight * svgActualScale) / 2;

  // Copy from another side
  const copyFromSide = useCallback((fromSide: 'left' | 'right' | 'back') => {
    if (fromSide === selectedSide) return;

    const sourceState = sideStates[fromSide];

    // Deep copy the source state (photo is handled separately, not copied)
    const copiedState: SideState = {
      height: sourceState.height,
      totalWidth: sourceState.totalWidth,
      doors: sourceState.doors.map(door => ({
        ...door,
        id: `door-${selectedSide}-${Date.now()}-${Math.random()}` // New IDs for copied doors
      })),
    };

    updateCurrentSide(copiedState);
    // Layout copy is a local operation, no API call
  }, [selectedSide, sideStates, updateCurrentSide]);

  // Mirror from another side
  const mirrorFromSide = useCallback((fromSide: 'left' | 'right' | 'back') => {
    if (fromSide === selectedSide) return;

    const sourceState = sideStates[fromSide];

    // Mirror the layout (flip door positions)
    const mirroredDoors = sourceState.doors.map(door => {
      // Mirror position: new position = total width - (original position + door width)
      const mirroredPosition = sourceState.totalWidth - (door.position + door.width);

      return {
        ...door,
        id: `door-${selectedSide}-${Date.now()}-${Math.random()}`,
        position: Math.max(0, mirroredPosition)
      };
    });

    // Photo is handled separately, not mirrored
    const mirroredState: SideState = {
      height: sourceState.height,
      totalWidth: sourceState.totalWidth,
      doors: mirroredDoors,
    };

    updateCurrentSide(mirroredState);
    // Layout mirror is a local operation, no API call
  }, [selectedSide, sideStates, updateCurrentSide]);

  if (!currentState) {
    return (
      <View style={styles.container}>
        <ThemedText>Carregando layout...</ThemedText>
      </View>
    );
  }

  // The main form content
  const formContent = (
    <>
      {/* Visual Layout Preview with Zoom/Pan (SVG-based, matching task detail preview) */}
      <View style={[styles.previewContainer, { borderColor: colors.border, backgroundColor: colors.muted }]}>
        {/* Zoom Controls with Total Width */}
        <View style={[styles.zoomControls, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={[styles.totalWidthLabel, { flex: 1 }]}>
            {Math.round(currentState.totalWidth)} x {Math.round(currentState.height)}cm
          </ThemedText>
          <Button variant="ghost" size="sm" onPress={handleZoomOut} style={styles.zoomButton}>
            <IconZoomOut size={20} color={colors.foreground} />
          </Button>
          <Button variant="ghost" size="sm" onPress={handleResetZoom} style={styles.zoomButton}>
            <IconZoomReset size={20} color={colors.foreground} />
          </Button>
          <Button variant="ghost" size="sm" onPress={handleZoomIn} style={styles.zoomButton}>
            <IconZoomIn size={20} color={colors.foreground} />
          </Button>
        </View>

        <GestureHandlerRootView style={styles.gestureContainer} onLayout={(e) => setSvgContainerWidth(e.nativeEvent.layout.width)}>
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.zoomableContent, animatedZoomStyle]}>
              <View style={styles.svgWithButtonsContainer}>
                {previewSvgContent && (
                  <SvgXml
                    xml={previewSvgContent}
                    width="100%"
                    height={SVG_DISPLAY_HEIGHT}
                    preserveAspectRatio="xMidYMid meet"
                  />
                )}
                {/* Door remove buttons overlaid on SVG, inside Animated.View so they zoom/pan together */}
                {selectedSide !== 'back' && currentState.doors.length > 0 && svgActualScale > 0 && (
                  <View style={styles.doorButtonsOverlay} pointerEvents="box-none">
                    {currentState.doors.map(door => {
                      // Door center in SVG native coordinates (matching the SVG viewBox)
                      const doorSvgCenterX = 60 + door.position + door.width / 2;
                      const doorTopPosition = currentState.height - door.doorHeight;
                      const clampedTopPosition = Math.max(0, doorTopPosition);
                      const doorSvgCenterY = 60 + clampedTopPosition + door.doorHeight / 2;

                      // Map to screen pixels relative to the SVG element
                      const buttonLeft = svgOffsetX + doorSvgCenterX * svgActualScale;
                      const buttonTop = svgOffsetY + doorSvgCenterY * svgActualScale;

                      return (
                        <TouchableOpacity
                          key={door.id}
                          style={[
                            styles.removeDoorButton,
                            {
                              left: buttonLeft - 12,
                              top: buttonTop - 12,
                              backgroundColor: colors.destructive,
                            }
                          ]}
                          onPress={() => removeDoor(door.id)}
                          disabled={disabled}
                        >
                          <Icon name="x" size={16} color={colors.destructiveForeground} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </View>

      {/* Copy and Mirror Buttons (only for left/right sides) */}
      {selectedSide !== 'back' && (
        <View style={styles.actionButtonsRow}>
          <Button
            variant="outline"
            onPress={() => copyFromSide(selectedSide === 'left' ? 'right' : 'left')}
            disabled={disabled}
            style={styles.actionButton}
          >
            <Icon name="copy" size={14} color={colors.foreground} />
            <ThemedText style={{ marginLeft: spacing.xs, fontSize: fontSize.xs }}>
              Copiar {selectedSide === 'left' ? 'Sapo' : 'Motorista'}
            </ThemedText>
          </Button>
          <Button
            variant="outline"
            onPress={() => mirrorFromSide(selectedSide === 'left' ? 'right' : 'left')}
            disabled={disabled}
            style={styles.actionButton}
          >
            <Icon name="flip-horizontal" size={14} color={colors.foreground} />
            <ThemedText style={{ marginLeft: spacing.xs, fontSize: fontSize.xs }}>
              Espelhar {selectedSide === 'left' ? 'Sapo' : 'Motorista'}
            </ThemedText>
          </Button>
        </View>
      )}

      {/* Height Input */}
      <Card style={styles.inputCard}>
        <View style={styles.fieldRow}>
          <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>Altura</ThemedText>
          <MeasurementInput
            value={currentState.height}
            onChange={updateHeight}
            placeholder="2,40"
            disabled={disabled}
            min={100}
            max={400}
          />
        </View>
      </Card>

      {/* Sections/Doors Width Inputs */}
      {(() => {
        let sectionCounter = 0;
        let doorCounter = 0;

        return segments.map((segment, index) => {
          if (segment.type === 'door') {
            doorCounter++;
            return (
              <Card key={`segment-${index}`} style={styles.inputCard}>
                <View style={styles.fieldRow}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Porta {doorCounter}
                  </ThemedText>
                  <MeasurementInput
                    value={segment.width}
                    onChange={(value) => updateSegmentWidth(index, value)}
                    placeholder="1,00"
                    disabled={disabled}
                    min={0}
                  />
                </View>
              </Card>
            );
          } else {
            sectionCounter++;
            return (
              <Card key={`segment-${index}`} style={styles.inputCard}>
                <View style={styles.fieldRow}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                    Seção {sectionCounter}
                  </ThemedText>
                  <MeasurementInput
                    value={segment.width}
                    onChange={(value) => updateSegmentWidth(index, value)}
                    placeholder="1,00"
                    disabled={disabled}
                    min={0}
                  />
                </View>
              </Card>
            );
          }
        });
      })()}

      {/* Door Height Inputs - Only shown for doors on sides */}
      {selectedSide !== 'back' && currentState.doors.map((door, index) => (
        <Card key={door.id} style={styles.inputCard}>
          <View style={styles.fieldRow}>
            <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
              Altura Porta {index + 1}
            </ThemedText>
            <MeasurementInput
              value={door.doorHeight}
              onChange={(value) => updateDoorHeight(door.id, value)}
              placeholder="1,90"
              disabled={disabled}
              min={50}
              max={currentState.height}
            />
          </View>
        </Card>
      ))}

      {/* Add Door Button (only for sides) */}
      {selectedSide !== 'back' && (
        <Button
          variant="outline"
          onPress={addDoor}
          disabled={disabled}
          style={styles.addButton}
        >
          <Icon name="plus" size={16} color={colors.foreground} />
          <ThemedText style={{ marginLeft: spacing.xs }}>Adicionar Porta</ThemedText>
        </Button>
      )}

      {/* Photo picker for back side layout */}
      {selectedSide === 'back' && (
        <View style={styles.photoPickerContainer}>
          <FilePicker
            value={photoState.file ? [photoState.file] : []}
            onChange={handlePhotoChange}
            maxFiles={1}
            placeholder="Adicionar Foto do Layout"
            helperText="Foto da traseira do caminhão"
            showCamera={true}
            showVideoCamera={false}
            showGallery={true}
            showFilePicker={false}
            disabled={disabled}
            confirmRemove={true}
          />
        </View>
      )}

      {!embedded && <View style={{ height: spacing.xl }} />}
    </>
  );

  // When embedded, just return the content without wrapper ScrollView/KeyboardAvoidingView
  if (embedded) {
    return (
      <View style={styles.embeddedContainer}>
        {formContent}
      </View>
    );
  }

  // Standalone mode with its own scrolling
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        ref={refs.scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onLayout={handlers.handleScrollViewLayout}
        onScroll={handlers.handleScroll}
        scrollEventThrottle={16}
      >
        <KeyboardAwareFormProvider value={keyboardContextValue}>
          {formContent}
        </KeyboardAwareFormProvider>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  embeddedContainer: {
    // No flex: 1 when embedded - let parent control sizing
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  totalWidthLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  previewContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
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
    minHeight: 200,
    overflow: 'hidden',
  },
  zoomableContent: {
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  svgWithButtonsContainer: {
    width: '100%',
    position: 'relative',
  },
  doorButtonsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  removeDoorButton: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  inputCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  rowInput: {
    width: 100,
    height: 36,
    minHeight: 36,
    textAlign: 'right',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.sm,
  },
  addButton: {
    marginBottom: spacing.md,
  },
  photoPickerContainer: {
    marginBottom: spacing.md,
  },
});
