// Per-widget container. Wraps the widget's RenderComponent with edit-mode
// chrome (drag handle + overflow menu in a floating top-right toolbar).
// Mirrors web/src/dashboard/components/widget-tile.tsx with three mobile
// adaptations:
//   1. Saved config is parsed through the widget's Zod schema before being
//      passed to the render component, so newly-added config fields with
//      .default() backfill cleanly on layouts saved before that field
//      existed.
//   2. The size cap (WIDGET_ROW_MAX_HEIGHT) is preserved IN EDIT MODE so the
//      user sees the actual selected height token while editing — the old
//      behaviour (uncapped height in edit mode) hid the resize feedback
//      entirely. dashboard-grid.tsx applies the matching width treatment.
//   3. The IconDots overflow button does NOT host its own ActionSheet — that
//      was a portaling bug: an RN <Modal> mounted inside both an Animated.View
//      with a live rotateZ transform AND a DraggableFlatList cell
//      (also reanimated) gets clipped/misplaced on iOS. The tile instead
//      fires `onMoreActions(instanceId)` and the parent screen hosts the
//      ActionSheet at the root. Same pattern as `onConfigure`.
//
// View-mode interaction: long-press on the tile bubbles `onEnterEditMode`
// up to the parent screen, giving users a discoverable shortcut to enter
// edit mode without hunting for the toolbar button. iOS-style jiggle
// (small rotation oscillation) is applied to every tile while editing for
// affordance.

import { useEffect, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutGrid,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { widgetRegistry } from "../registry";
import {
  WIDGET_ROW_MAX_HEIGHT,
  WIDGET_ROW_LABELS,
  WIDGET_SPAN_LABELS,
} from "../types";
import type { WidgetInstance, WidgetRows } from "../types";

interface WidgetTileProps {
  instance: WidgetInstance;
  isEditing: boolean;
  onRemove: () => void;
  /** Open the configuration modal for this instance. Wired by the parent
   *  screen which hosts the modal state — replaces the previous
   *  router.push('/dashboard/configure/...') flow. */
  onConfigure?: (instanceId: string) => void;
  /** Open the overflow ActionSheet for this instance. Wired by the parent
   *  screen because RN Modal cannot portal correctly out of nested
   *  Reanimated transforms (this tile lives inside DraggableFlatList AND
   *  inside an Animated.View with the jiggle rotateZ). The screen renders
   *  ONE ActionSheet at root and shows it for whichever instance fired this
   *  callback. */
  onMoreActions?: (instanceId: string) => void;
  /** Open the inline-resize sheet for this instance. Lifted to the screen
   *  for the same Modal-portaling reason as `onMoreActions`. The sheet
   *  shows just the SizeSelector (cuts resize from "open configure modal,
   *  scroll to Tamanho, change size, Aplicar" to a single sheet open). */
  onResize?: (instanceId: string) => void;
  /** Drag handle press handler — wired up by DashboardGrid's
   *  DraggableFlatList. Only relevant in edit mode. Drags the WHOLE row
   *  this tile sits in (within-row reordering is handled by the arrow
   *  buttons below, since DraggableFlatList is 1-D and the rows are its
   *  list items). */
  onDragHandlePressIn?: () => void;
  /** Swap this tile with its left/right neighbour in the linear instance
   *  order. May move the tile across a row boundary — that's OK; the
   *  parent re-packs after every reorder. */
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  /** Called from the view-mode long-press gesture. Lets the parent screen
   *  flip the global isEditing flag so the user enters edit mode without
   *  hunting for a toolbar button. */
  onEnterEditMode?: () => void;
}

export function WidgetTile({
  instance,
  isEditing,
  onRemove,
  onConfigure,
  onMoreActions,
  onResize,
  onDragHandlePressIn,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
  onEnterEditMode,
}: WidgetTileProps) {
  const { colors } = useTheme();
  const def = widgetRegistry.get(instance.widgetId);

  // Parse config through the widget's schema so new fields with .default()
  // backfill on layouts saved before the field existed. Without this, adding
  // a new sub-object like `display: { density, ... }` would crash render for
  // every existing instance until the user re-saved it.
  const parsedConfig = useMemo(() => {
    if (!def) return instance.config;
    const result = def.configSchema.safeParse(instance.config);
    return result.success ? result.data : def.defaultConfig;
  }, [def, instance.config]);

  // iOS-style jiggle while editing. The instanceId-derived offset desyncs the
  // animation across tiles so the dashboard doesn't feel mechanical. We oscillate
  // ±0.4° on a 220ms half-cycle — slow enough not to read as glitchy, fast enough
  // to telegraph "drag me". Stops cleanly when isEditing flips.
  const jiggle = useSharedValue(0);
  useEffect(() => {
    if (isEditing) {
      const offset = (instance.instanceId.charCodeAt(0) % 5) * 30;
      jiggle.value = withRepeat(
        withSequence(
          withTiming(-0.4, { duration: 220 + offset, easing: Easing.linear }),
          withTiming(0.4, { duration: 220 + offset, easing: Easing.linear }),
        ),
        -1,
        true,
      );
    } else {
      jiggle.value = withTiming(0, { duration: 120 });
    }
  }, [isEditing, instance.instanceId, jiggle]);

  const jiggleStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${jiggle.value}deg` }],
  }));

  if (!def) {
    return (
      <View
        style={{
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.05)",
          padding: 12,
          borderRadius: 8,
          gap: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <IconAlertTriangle size={16} color="#ef4444" />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#ef4444" }}>
            Widget não encontrado
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
          ID “{instance.widgetId}” não está registrado.
        </Text>
        {isEditing && (
          <Pressable
            onPress={onRemove}
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              gap: 4,
              paddingVertical: 4,
              paddingHorizontal: 8,
            }}
          >
            <IconTrash size={14} color="#ef4444" />
            <Text style={{ fontSize: 12, color: "#ef4444" }}>Remover</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const Render = def.RenderComponent;
  // Always clamp the rendered widget body to the configured rows-height —
  // even in edit mode. Without this, edit mode shows every widget at its
  // intrinsic content height, hiding the user's selected height token. The
  // user-reported "doesn't display the sizes selected" complaint covers
  // BOTH width and height; dashboard-grid.tsx handles width, this handles
  // height.
  const rowsToken = (instance.size?.rows ?? def.defaultRows) as WidgetRows;
  const maxHeight = WIDGET_ROW_MAX_HEIGHT[rowsToken];

  return (
    <Animated.View
      style={[
        {
          position: "relative",
          borderRadius: 12,
          borderWidth: isEditing ? 2 : 0,
          borderColor: isEditing ? colors.primary + "66" : "transparent",
        },
        isEditing && jiggleStyle,
      ]}
    >
      <Pressable
        onLongPress={isEditing ? undefined : onEnterEditMode}
        delayLongPress={400}
        // The Pressable is purely a long-press host — let normal taps pass
        // through to the widget content so the user can still interact.
        onPress={undefined}
        android_disableSound
      >
        <View style={{ maxHeight, overflow: "hidden", borderRadius: 12 }}>
          <Render
            instanceId={instance.instanceId}
            config={parsedConfig}
            size={instance.size}
            isEditing={isEditing}
          />
        </View>
      </Pressable>
      {isEditing && (
        <View
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.card,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 4,
            paddingVertical: 4,
            zIndex: 20,
            // subtle elevation so the toolbar reads as floating chrome rather
            // than a flat patch — works on both light and dark themes
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          {onDragHandlePressIn && (
            <Pressable
              onPressIn={onDragHandlePressIn}
              accessibilityLabel={`Arrastar linha ${def.name}`}
              hitSlop={4}
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                backgroundColor: pressed ? colors.muted : "transparent",
              })}
            >
              <IconGripVertical size={18} color={colors.foreground} />
            </Pressable>
          )}
          {onMoveLeft && (
            <Pressable
              onPress={onMoveLeft}
              disabled={!canMoveLeft}
              accessibilityLabel="Mover para a esquerda"
              hitSlop={4}
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                backgroundColor: pressed && canMoveLeft ? colors.muted : "transparent",
                opacity: canMoveLeft ? 1 : 0.3,
              })}
            >
              <IconChevronLeft size={18} color={colors.foreground} />
            </Pressable>
          )}
          {onMoveRight && (
            <Pressable
              onPress={onMoveRight}
              disabled={!canMoveRight}
              accessibilityLabel="Mover para a direita"
              hitSlop={4}
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                backgroundColor: pressed && canMoveRight ? colors.muted : "transparent",
                opacity: canMoveRight ? 1 : 0.3,
              })}
            >
              <IconChevronRight size={18} color={colors.foreground} />
            </Pressable>
          )}
          {onResize && (
            <Pressable
              onPress={() => onResize(instance.instanceId)}
              accessibilityLabel="Redimensionar widget"
              hitSlop={4}
              style={({ pressed }) => ({
                paddingHorizontal: 6,
                height: 32,
                borderRadius: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: pressed ? colors.muted : "transparent",
              })}
            >
              <IconLayoutGrid size={14} color={colors.foreground} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: colors.foreground,
                  fontVariant: ["tabular-nums"],
                }}
                numberOfLines={1}
              >
                {WIDGET_SPAN_LABELS[instance.size.span]} ×{" "}
                {WIDGET_ROW_LABELS[instance.size.rows]}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => onMoreActions?.(instance.instanceId)}
            accessibilityLabel="Mais ações do widget"
            hitSlop={4}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              backgroundColor: pressed ? colors.muted : "transparent",
            })}
          >
            <IconDotsVertical size={18} color={colors.foreground} />
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

// Re-export icons consumed by the parent screen if it needs to compose its
// own edit toolbar action items.
export { IconSettings, IconTrash };
