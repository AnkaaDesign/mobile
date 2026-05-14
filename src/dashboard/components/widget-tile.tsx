// Per-widget container. Wraps the widget's RenderComponent with edit-mode
// chrome (drag handle + size pill + configure gear + overflow menu in a
// floating top-right toolbar). Mirrors web/src/dashboard/components/
// widget-tile.tsx with two mobile adaptations:
//   1. Saved config is parsed through the widget's Zod schema before being
//      passed to the render component, so newly-added config fields with
//      .default() backfill cleanly on layouts saved before that field
//      existed (parsing is delegated to the widget — this file only handles
//      chrome).
//   2. The size cap (WIDGET_ROW_MAX_HEIGHT) is preserved IN EDIT MODE so the
//      user sees the actual selected height token while editing — the old
//      behaviour (uncapped height in edit mode) hid the resize feedback
//      entirely. dashboard-grid.tsx applies the matching width treatment.
//
// Edit-mode chrome layout (left → right inside the floating toolbar):
//   [grip] [size-pill 1/3·2×] [gear] [dots]
// All buttons are 26×26 with 3px padding/gap so the row reads as one unit
// (each cell is exactly 26+3+26+3+26+3+26 wide). The grip is visual-only —
// the actual drag gesture is bound to the entire tile body via the
// GestureDetector wrapper below. On span-1 tiles the size pill collapses
// to icon-only because there isn't room for the abbreviated label without
// overflowing the tile.
//
// Reordering UX: matches web — drag-and-drop only. The previous `< >` arrow
// buttons were removed because (a) web doesn't have them, (b) they cluttered
// the small mobile toolbar, and (c) they invited two ways to do the same
// thing. In edit mode the ENTIRE tile body acts as a drag handle via a
// long-press → pan composition (350ms hold to activate, matching the iOS
// home-screen rearrange affordance and giving ScrollView priority for
// short drag motions). The grip icon is a visual cue only.
//
// Edit-mode visuals:
//   - Tile scales down to 0.97 (subtle "lifted into the editor" feel) and
//     gains a 2px primary-tinted ring border, soft shadow, and the iOS-style
//     jiggle (±0.4°). The scale and ring ANIMATE in/out (220ms timing) so
//     the transition between view and edit mode is smooth, not jumpy.
//   - The floating toolbar (drag cue + size pill + gear + overflow) sits at
//     top-right with a card-tinted backdrop so its actions read clearly
//     against any widget content underneath.
//
// Drag-active visuals: when `isDragging` is true the tile body scales to
// 1.02, opacity drops to 0.95, and shadow elevation jumps to 8 — a subtle
// "lifted off the page" beat that mirrors the home-screen rearrange feel.
// Animated via Reanimated timing (220ms ease-out) so it doesn't pop.
// (sortable-grid wraps the tile in its own animated View with a stronger
// 1.04 scale + rotation, so this is the *additive* signal a consumer can
// turn on without depending on sortable-grid.)
//
// View mode interaction: long-press on the tile bubbles `onEnterEditMode`
// up to the parent screen with a `lightImpactHaptic()` beat fired before
// the callback (so the user feels the mode change land), giving users a
// discoverable shortcut to enter edit mode without hunting for the toolbar
// button.
//
// Overflow menu: this tile fires `onMoreActions(instanceId)` on overflow
// tap. The screen-root listener opens a `Sheet` (NOT ActionSheet) — the
// latter has an iOS layout bug where dimension measurement happens before
// keyboard/safe-area insets settle, leaving the menu visually offset by
// 20-40px on phones with home-indicator hardware.

import { useEffect } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  GestureDetector,
  type ComposedGesture,
  type GestureType,
} from "react-native-gesture-handler";
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
  IconDotsVertical,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { lightImpactHaptic } from "@/utils/haptics";
import { widgetRegistry } from "../registry";
import { WIDGET_ROW_MAX_HEIGHT } from "../types";
import type { WidgetInstance, WidgetRows } from "../types";
import { useTutorialTarget, useTutorialIsActive } from "@/components/tutorial";

interface WidgetTileProps {
  instance: WidgetInstance;
  isEditing: boolean;
  /**
   * When set, the bottom-right ⋮ overflow button is wired as a tutorial
   * target with this ID. Used by the home-widget-options step to spotlight
   * the per-widget actions menu while the user is in edit mode.
   */
  moreActionsTutorialTargetId?: string;
  onRemove: () => void;
  /** Open the configuration modal for this instance. When provided in edit
   *  mode the toolbar shows a gear button next to the size pill; when not
   *  provided (some lightweight widgets have no configurable surface) the
   *  gear is hidden so the toolbar collapses cleanly. */
  onConfigure?: (instanceId: string) => void;
  /** Open the overflow Sheet for this instance. Lifted to the screen because
   *  RN Modal cannot portal correctly out of nested Reanimated transforms
   *  (this tile lives inside the SortableGrid AND inside an Animated.View
   *  with the jiggle rotateZ). The screen renders ONE Sheet at root and
   *  shows it for whichever instance fired this callback. We use Sheet
   *  here, NOT ActionSheet — ActionSheet has an iOS layout bug where it
   *  measures dimensions before the keyboard / safe-area insets settle and
   *  ends up vertically misaligned by 20-40px. Sheet sidesteps this with
   *  its own Modal+animation pipeline. */
  onMoreActions?: (instanceId: string) => void;
  /** Open the inline-resize sheet for this instance. Lifted to the screen
   *  for the same Modal-portaling reason as `onMoreActions`. The sheet
   *  shows just the SizeSelector (cuts resize from "open configure modal,
   *  scroll to Tamanho, change size, Aplicar" to a single sheet open). */
  onResize?: (instanceId: string) => void;
  /** Pan gesture from SortableGrid. When provided in edit mode, the entire
   *  tile body becomes the drag activator (long-press → pan). The visible
   *  grip icon is a cue only — the gesture is not bound to it. */
  dragGesture?: GestureType | ComposedGesture;
  /** Called from the view-mode long-press gesture. Lets the parent screen
   *  flip the global isEditing flag so the user enters edit mode without
   *  hunting for a toolbar button. */
  onEnterEditMode?: () => void;
  /** True when this instance's persisted config failed Zod validation at
   *  load time and was replaced with the widget's defaultConfig. Drives
   *  the inline "config restored" banner shown only in edit mode. */
  wasConfigRestored?: boolean;
  /** Reset this instance's config to the widget's defaultConfig. Wired to
   *  the banner's "Restaurar padrões" button. */
  onResetConfig?: () => void;
  /** When true, the tile body animates to a "lifted off the page" pose
   *  (scale 1.02, opacity 0.95, shadow elevation 8) — used by sortable
   *  consumers that want the inner tile to react to a drag without owning
   *  their own animated wrapper. Optional: sortable-grid already provides
   *  a stronger outer-wrapper lift, so most callers can omit this. */
  isDragging?: boolean;
}

// Toolbar button cell — fixed 26×26 with 3px gap so the row reads as one
// rhythm-aligned unit (per CRITICAL FACTS: 26×26 buttons, 3px padding/gap).
// Bumped from 26 → 32 so the dots button has a comfortable tap target
// (32×32 visible + hitSlop = ~50×50 effective). The previous 26×26 made
// it easy to mis-tap and hit the body area below, which used to open
// configure directly — now the body tap is removed, but a larger button
// also reduces the chance of users feeling like they have to be precise.
const TOOLBAR_BTN = 32;
const TOOLBAR_GAP = 4;
const TOOLBAR_RADIUS = 6;

export function WidgetTile({
  instance,
  isEditing,
  moreActionsTutorialTargetId,
  onRemove,
  onConfigure,
  onMoreActions,
  onResize,
  dragGesture,
  onEnterEditMode,
  wasConfigRestored,
  onResetConfig,
  isDragging,
}: WidgetTileProps) {
  const { colors } = useTheme();
  // Tutorial wiring for the ⋮ overflow button. Always called (hooks rules)
  // with a sentinel id when no tutorial target is requested for this tile.
  const moreActionsTutorialTarget = useTutorialTarget(
    moreActionsTutorialTargetId ?? `noop.widget.moreActions.${instance.instanceId}`,
  );
  const hasMoreActionsTutorialTarget = !!moreActionsTutorialTargetId;
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const def = widgetRegistry.get(instance.widgetId);

  // iOS-style jiggle while editing. The instanceId-derived offset desyncs the
  // animation across tiles so the dashboard doesn't feel mechanical. We
  // oscillate ±0.4° on a 220ms half-cycle. Stops cleanly when isEditing flips.
  const jiggle = useSharedValue(0);
  // Edit-mode scale ramp — 1 in view mode, 0.97 in edit mode. Animated with
  // a 220ms timing so the transition feels deliberate, not jumpy.
  const editScale = useSharedValue(1);
  // Ring opacity — 0 in view mode, 1 in edit mode. Sets the alpha on the
  // primary-tinted border so it fades in instead of popping.
  const ringOpacity = useSharedValue(0);
  // Drag-active progress (0 → 1). Drives scale 1.02 / opacity 0.95 / shadow
  // elevation 8 simultaneously so the tile reads as "picked up" without
  // fighting the outer sortable wrapper's bigger 1.04 lift.
  const dragProgress = useSharedValue(0);

  // Pause jiggle during tutorial. The ±0.4° rotation oscillation desyncs the
  // tile from a captured tutorial spotlight rect (which is static window
  // coordinates), so the user sees the tile's contents — especially the
  // 3-dots Pressable — slipping in and out of the cutout's clear area. On
  // home-widget-options that read as a "circle blinking inside the spotlight"
  // because the three dots of IconDotsVertical rotated into the dim band.
  // Edit-mode signalling is still carried by the persistent primary ring +
  // editScale ramp; the jiggle is purely decorative.
  const tutorialActive = useTutorialIsActive();
  useEffect(() => {
    if (isEditing && !tutorialActive) {
      const offset = (instance.instanceId.charCodeAt(0) % 5) * 30;
      jiggle.value = withRepeat(
        withSequence(
          // Per spec §2.5: jiggle half-cycle is 220ms with
          // Easing.inOut(Easing.ease). The instanceId-derived offset desyncs
          // the animation across tiles so the dashboard doesn't feel
          // mechanical.
          withTiming(-0.4, {
            duration: 220 + offset,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.4, {
            duration: 220 + offset,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      );
      editScale.value = withTiming(0.97, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      ringOpacity.value = withTiming(1, { duration: 220 });
    } else if (isEditing) {
      // Tutorial active: hold edit-mode visual state but freeze the jiggle.
      jiggle.value = withTiming(0, { duration: 120 });
      editScale.value = withTiming(0.97, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      ringOpacity.value = withTiming(1, { duration: 220 });
    } else {
      jiggle.value = withTiming(0, { duration: 120 });
      editScale.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      ringOpacity.value = withTiming(0, { duration: 160 });
    }
  }, [isEditing, tutorialActive, instance.instanceId, jiggle, editScale, ringOpacity]);

  useEffect(() => {
    dragProgress.value = withTiming(isDragging ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [isDragging, dragProgress]);

  const containerAnimStyle = useAnimatedStyle(() => {
    // Drag scale layers ON TOP of the edit-mode 0.97 baseline so the two
    // animations compose: edit mode = 0.97 × (1 + 0.02·drag) ≈ 0.99 mid-drag.
    const dragScale = 1 + 0.02 * dragProgress.value;
    return {
      transform: [
        { rotateZ: `${jiggle.value}deg` },
        { scale: editScale.value * dragScale },
      ],
      // Per spec §2.4 / §3.2: active drag tile keeps opacity 1.0. Web sets
      // opacity 0.6 on the dnd-kit source; mobile inverts that — the lifted
      // tile stays full-opacity and the affordance is shadow + scale only.
      opacity: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 * dragProgress.value },
      shadowOpacity: 0.18 * dragProgress.value,
      shadowRadius: 8 * dragProgress.value,
      elevation: 8 * dragProgress.value,
    };
  });

  const ringAnimStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
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
  // Always clamp the rendered widget body to the configured rows-height.
  const rowsToken = (instance.size?.rows ?? def.defaultRows) as WidgetRows;
  const tokenHeight = WIDGET_ROW_MAX_HEIGHT[rowsToken];
  // Cap the rendered height to whatever fits within the visible viewport
  // so a rows=4 (608px) widget on a 740-tall iPhone doesn't overflow the
  // screen with a blank tail. The reserve accounts for: greeting card
  // (~76px with the new compact two-row layout that absorbs the Editar
  // pill on row 2), the 16px gap above and below the grid, and the
  // bottom tab bar (~50px visible above insets.bottom). Total ≈ 160.
  // The previous 210 assumed a separate Editar row beneath the greeting
  // card; now that the pill lives inside the card, that ~50px is reclaimed
  // so rows=4 widgets fill more of the visible viewport. Minimum 140 so
  // a widget never collapses. Status bar (insets.top) and bottom safe
  // area (insets.bottom) are subtracted separately below.
  const CHROME_RESERVE = 160;
  const viewportFit = Math.max(
    140,
    windowHeight - insets.top - insets.bottom - CHROME_RESERVE,
  );
  const maxHeight = Math.min(tokenHeight, viewportFit);
  const showGear = !!onConfigure;
  const showMore = !!onMoreActions;

  // Both modes force `height: maxHeight` so the WidgetCard's internal
  // flex:1 body has a height context to fill. The borderRadius matches
  // CARD_RADIUS (8) in widget-card.tsx — previously this wrapper used 12
  // which clipped the WidgetCard's coloured accent border at the bottom
  // corners (the "border bottom edges the color doesn't apply on the
  // edges" bug). Matching the radii keeps the corners clean.
  const body = (
    <View
      style={{ height: maxHeight, overflow: "hidden", borderRadius: 8 }}
      // In edit mode the body itself MUST stay interactive — this is the View
      // that GestureDetector attaches the drag recognizer to. `pointerEvents:
      // "none"` would set `userInteractionEnabled=false` on iOS, blocking the
      // recognizer from ever firing (the "drag and drop doesn't reposition"
      // bug). `box-only` keeps the View interactive for the gesture while
      // preventing the widget's content (task rows, etc.) from intercepting
      // taps during edit. View mode is unchanged.
      pointerEvents={isEditing ? "box-only" : "auto"}
    >
      {isEditing && wasConfigRestored && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: colors.warning + "22",
            borderBottomWidth: 1,
            borderBottomColor: colors.warning + "55",
          }}
        >
          <View style={{ flex: 1, flexDirection: "row", gap: 6, alignItems: "center" }}>
            <IconAlertTriangle size={14} color={colors.warning} />
            <Text
              style={{ flex: 1, fontSize: 11, color: colors.foreground }}
              numberOfLines={2}
            >
              Configuração inválida foi restaurada para os padrões.
            </Text>
          </View>
          {onResetConfig && (
            <Pressable
              onPress={onResetConfig}
              hitSlop={6}
              accessibilityLabel="Restaurar configuração padrão"
              style={({ pressed }) => ({
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: pressed ? colors.warning + "33" : "transparent",
              })}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.warning }}>
                Restaurar
              </Text>
            </Pressable>
          )}
        </View>
      )}
      <Render
        instanceId={instance.instanceId}
        config={instance.config}
        size={instance.size}
        isEditing={isEditing}
      />
    </View>
  );

  // EDIT MODE: no tap-to-configure on the body. The 3-dots button is the
  // explicit entry point for all per-tile actions. Previously a body tap
  // opened the configure modal directly — but it conflicted with taps
  // near the dots button (taps that slightly missed the dots fell through
  // to the body and skipped the overflow sheet, matching the user's
  // "sometimes goes direct to configurar without showing the menu" bug).
  // Long-press is captured by the GestureDetector below (350ms → drag).
  //
  // VIEW MODE: long-press → onEnterEditMode (discoverable edit entry).
  const wrapped = isEditing ? (
    body
  ) : (
    <Pressable
      onLongPress={
        onEnterEditMode
          ? () => {
              // Per spec §3.1: view-mode long-press fires lightImpactHaptic
              // BEFORE flipping into edit mode so the user feels the mode
              // change land. Without this, the jiggle starts silently.
              void lightImpactHaptic();
              onEnterEditMode();
            }
          : undefined
      }
      delayLongPress={400}
      onPress={undefined}
      android_disableSound
    >
      {body}
    </Pressable>
  );

  // The gesture detector spans the whole tile in edit mode so a 350ms hold
  // anywhere on the widget activates the drag. Toolbar Pressables sit above
  // (zIndex 20) and capture taps before the gesture activates.
  const dragWrapped =
    isEditing && dragGesture ? (
      <GestureDetector gesture={dragGesture}>{wrapped}</GestureDetector>
    ) : (
      wrapped
    );

  return (
    <Animated.View
      style={[
        {
          position: "relative",
          borderRadius: 12,
        },
        containerAnimStyle,
      ]}
    >
      {/* Animated ring — sits ABOVE the tile, fades in/out with edit mode.
          Using a separate absolutely-positioned overlay keeps the
          border-width from changing the layout box (otherwise the row
          would shift 2px when entering edit mode). */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            // Per spec §2.4: edit-mode primary ring at 0.4 alpha
            // (`${primary}66` → 0x66/0xff ≈ 0.40), 1.5px thick. Mirrors web's
            // `ring-2 ring-primary/40` visually — RN doesn't have CSS ring
            // so we render an absolutely-positioned overlay so the
            // border-width doesn't shift the layout box.
            position: "absolute",
            top: -1,
            left: -1,
            right: -1,
            bottom: -1,
            borderRadius: 9,
            borderWidth: 1.5,
            borderColor: colors.primary + "66",
            // Subtle shadow ring under edit-mode tile.
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 6,
            elevation: 2,
            zIndex: 1,
          },
          ringAnimStyle,
        ]}
      />
      {dragWrapped}
      {isEditing && (
        <View
          // Toolbar floats at the BOTTOM-right of the tile so the widget's
          // own header (icon + title + count) remains visible in edit mode.
          // Previously the toolbar lived at top-right and physically
          // overlapped the 36px header strip — on narrow span-1 tiles this
          // hid the widget's title entirely (the "why doesn't Favoritos
          // show its header in edit mode" bug).
          pointerEvents="box-none"
          style={{
            position: "absolute",
            bottom: 6,
            right: 6,
            flexDirection: "row",
            alignItems: "center",
            // 3px gap matches the 3px paddingHorizontal/paddingVertical so
            // the buttons are visually rhythm-aligned.
            gap: TOOLBAR_GAP,
            backgroundColor: colors.card,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: TOOLBAR_GAP,
            paddingVertical: TOOLBAR_GAP,
            zIndex: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          {/* Consolidated edit chrome — just one menu button. Previously
              the toolbar had four entries (drag affordance + size pill +
              gear + dots). The size pill and gear were redundant with the
              dots menu, which now contains: Configurar, Tamanho, Remover.
              Drag is bound to the tile body via GestureDetector — the
              grip icon was visual-only and removing it makes the toolbar
              chrome read as a single tap target, not a cluster. */}
          {showMore ? (
            <View
              ref={
                hasMoreActionsTutorialTarget
                  ? (moreActionsTutorialTarget.ref as any)
                  : undefined
              }
              onLayout={
                hasMoreActionsTutorialTarget
                  ? moreActionsTutorialTarget.onLayout
                  : undefined
              }
              collapsable={hasMoreActionsTutorialTarget ? false : undefined}
            >
              <Pressable
                onPress={() => {
                  void lightImpactHaptic();
                  onMoreActions!(instance.instanceId);
                }}
                accessibilityLabel="Ações do widget"
                hitSlop={6}
                style={({ pressed }) => ({
                  width: TOOLBAR_BTN,
                  height: TOOLBAR_BTN,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: TOOLBAR_RADIUS,
                  backgroundColor: pressed ? colors.muted : "transparent",
                })}
              >
                <IconDotsVertical size={15} color={colors.foreground} />
              </Pressable>
            </View>
          ) : (
            // Fallback: when onMoreActions isn't wired by the host, fall
            // back to the legacy gear shortcut so the tile is still
            // configurable. Should never happen in practice (inicio.tsx
            // always wires it) but keeps the tile safe-by-default.
            showGear && (
              <Pressable
                onPress={() => {
                  void lightImpactHaptic();
                  onConfigure!(instance.instanceId);
                }}
                accessibilityLabel="Configurar widget"
                hitSlop={6}
                style={({ pressed }) => ({
                  width: TOOLBAR_BTN,
                  height: TOOLBAR_BTN,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: TOOLBAR_RADIUS,
                  backgroundColor: pressed ? colors.muted : "transparent",
                })}
              >
                <IconSettings size={14} color={colors.foreground} />
              </Pressable>
            )
          )}
        </View>
      )}
    </Animated.View>
  );
}

// Re-export icons consumed by the parent screen if it needs to compose its
// own edit toolbar action items.
export { IconSettings, IconTrash };
