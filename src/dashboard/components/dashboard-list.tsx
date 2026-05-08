// Vertical list of widget tiles. The mobile equivalent of web's DashboardGrid.
// Renders single-column always (no CSS grid auto-flow).
//
// Edit mode flips the renderer from a plain `View > .map(WidgetTile)` stack
// to a `DraggableFlatList` so users can long-press the grip handle on each
// tile and drag to reorder. Outside edit mode we don't pay the gesture-
// handler cost — the same items render in a plain View.

import { View } from "react-native";
import DraggableFlatList, {
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { WidgetTile } from "./widget-tile";
import type { WidgetInstance } from "../types";

interface DashboardListProps {
  items: WidgetInstance[];
  isEditing: boolean;
  onRemove: (instanceId: string) => void;
  /** Called whenever the user finishes a drag-reorder while editing. */
  onReorder?: (items: WidgetInstance[]) => void;
  /** Spacing between tiles. Default matches the existing home padding. */
  gap?: number;
}

export function DashboardList({
  items,
  isEditing,
  onRemove,
  onReorder,
  gap = 16,
}: DashboardListProps) {
  if (items.length === 0) return null;

  // Outside edit mode → plain stack. Avoids gesture-handler / VirtualizedList
  // overhead for a list that has no interactive reorder.
  if (!isEditing) {
    return (
      <View style={{ gap }}>
        {items.map((instance) => (
          <WidgetTile
            key={instance.instanceId}
            instance={instance}
            isEditing={false}
            onRemove={() => onRemove(instance.instanceId)}
          />
        ))}
      </View>
    );
  }

  // In edit mode → draggable list. The `drag` callback returned by
  // DraggableFlatList is what the grip handle calls onPressIn to start the
  // gesture; everything else (tap-to-config, tap-to-remove) still works on
  // the inner pressables because draggable-flatlist only intercepts long-
  // press on whatever element invokes drag.
  return (
    <DraggableFlatList
      data={items}
      keyExtractor={(item) => item.instanceId}
      onDragEnd={({ data }) => onReorder?.(data)}
      activationDistance={8}
      contentContainerStyle={{ gap }}
      // The list lives inside the parent ScrollView, so disable its own
      // scrolling — gestures only drive reorder, not scrolling.
      scrollEnabled={false}
      renderItem={({ item, drag, isActive }: RenderItemParams<WidgetInstance>) => (
        <View style={{ opacity: isActive ? 0.7 : 1 }}>
          <WidgetTile
            instance={item}
            isEditing
            onRemove={() => onRemove(item.instanceId)}
            onDragHandlePressIn={drag}
          />
        </View>
      )}
    />
  );
}
