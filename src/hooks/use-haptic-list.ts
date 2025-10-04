import { useCallback } from "react";
import { selectionHaptic, longPressHaptic, scrollBoundaryHaptic, successHaptic, errorHaptic, warningHaptic } from "@/utils/haptics";

/**
 * Hook for list interactions with haptic feedback
 *
 * @example
 * ```tsx
 * const hapticList = useHapticList();
 *
 * <FlatList
 *   data={items}
 *   onScroll={hapticList.handleScroll}
 *   renderItem={({ item }) => (
 *     <Pressable
 *       onPress={() => hapticList.handleItemPress(item)}
 *       onLongPress={() => hapticList.handleItemLongPress(item)}
 *     >
 *       <ItemCard item={item} />
 *     </Pressable>
 *   )}
 * />
 * ```
 */
export function useHapticList() {
  const handleItemPress = useCallback(async (item: any) => {
    await selectionHaptic();
  }, []);

  const handleItemLongPress = useCallback(async (item: any) => {
    await longPressHaptic();
  }, []);

  const handleItemSwipe = useCallback(async (direction: "left" | "right") => {
    if (direction === "left") {
      // Usually delete action
      await warningHaptic();
    } else {
      // Usually archive/complete action
      await successHaptic();
    }
  }, []);

  const handleItemDelete = useCallback(async () => {
    await errorHaptic();
  }, []);

  const handleReorder = useCallback(async (action: "pickup" | "drop") => {
    if (action === "pickup") {
      await longPressHaptic();
    } else {
      await successHaptic();
    }
  }, []);

  const handleScroll = useCallback(async (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    // Check if at top
    if (contentOffset.y <= 0) {
      await scrollBoundaryHaptic();
    }

    // Check if at bottom
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 5;
    if (isAtBottom) {
      await scrollBoundaryHaptic();
    }
  }, []);

  const handlePullToRefresh = useCallback(async () => {
    await scrollBoundaryHaptic();
  }, []);

  return {
    handleItemPress,
    handleItemLongPress,
    handleItemSwipe,
    handleItemDelete,
    handleReorder,
    handleScroll,
    handlePullToRefresh,
  };
}
