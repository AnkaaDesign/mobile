// Bottom sheet to add a new widget to the dashboard. Web-parity gallery
// rebuilt to spec §3.5 of `MOBILE_WIDGETS_SPEC.md`:
//
//   • Sticky header     — title "Adicionar widget" (18/600) + description
//                         "Escolha um widget para adicionar ao seu painel."
//                         (13/400/muted) + 36×36 close (X) on the right.
//   • Search input      — sticky under header. IconSearch left affordance,
//                         placeholder "Buscar widgets...", autoFocus on open.
//   • Category tabs     — sticky pills: "Todos" + each populated category
//                         (production, hr, inventory, financial, other),
//                         each with count.
//   • Scrollable grid   — 2 cols phones (<600), 3 cols small tablets
//                         (600–900), 4 cols ≥900. Card minHeight 168,
//                         borderRadius 10, top accent stripe 4px tall.
//                         Content: 40×40 tinted icon (radius 8), category
//                         badge top-right, name 14/600 line-clamp 2,
//                         description 12/400/muted line-clamp 3.
//   • Empty state       — centered IconStar (32px, opacity 0.4) +
//                         "Nenhum widget encontrado." + sub-line if query
//                         non-empty.
//
// Visual contract:
//   - Per-category color (top stripe + icon tile + category badge) comes
//     from the local `CATEGORY_PALETTE` table — the ONE place in this file
//     where raw hexes are allowed (light/dark variants explicit).
//   - Every other color is `useTheme().colors.*`.
//
// Mobile constraints:
//   - The Sheet primitive auto-renders the drag-indicator pill. Do NOT
//     add a second one.
//   - Sheet snapPoints are integer percentages — `[90]`, never `[0.9]`.
//   - Sheet renders inside a Modal, so the outer SafeArea insets do NOT
//     apply automatically — we read `useSafeAreaInsets().bottom` and
//     pad the scroll content with it.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconHandClick,
  IconSearch,
  IconStar,
  IconX,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { Sheet } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { lightImpactHaptic } from "@/utils/haptics";
import { borderRadius, spacing } from "@/constants/design-system";
import { useOptionalTutorial } from "@/components/tutorial/tutorial-context";
import { useTutorialTarget } from "@/components/tutorial/use-tutorial-target";
import { TUTORIAL_TARGETS } from "@/components/tutorial/target-ids";
import { widgetRegistry } from "../registry";
import {
  WIDGET_CATEGORY_LABELS,
  type WidgetCategory,
  type WidgetDefinition,
} from "../types";

interface AddWidgetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (widgetId: string) => void;
}

type CategoryFilter = "all" | WidgetCategory;

// Tab order: "Todos" first, then each populated category in this fixed
// order (matches WIDGET_CATEGORY_LABELS declaration order on web).
const CATEGORY_ORDER: WidgetCategory[] = [
  "production",
  "hr",
  "inventory",
  "financial",
  "other",
];

// Per-category palette mirroring web's `add-widget-modal.tsx` Tailwind
// pairs. Each category renders with a top accent stripe, a tinted icon
// tile bg, an icon stroke color, and a tinted badge background. Light +
// dark variants explicit so contrast holds in both themes. This is the
// ONE table in this file allowed to hold raw hexes.
interface CategoryPalette {
  accent: { light: string; dark: string };
  tint: { light: string; dark: string };
  text: { light: string; dark: string };
}

const CATEGORY_PALETTE: Record<WidgetCategory, CategoryPalette> = {
  // emerald-500 / emerald-400
  inventory: {
    accent: { light: "#10b981", dark: "#34d399" },
    tint: { light: "#10b9811f", dark: "#34d3991f" },
    text: { light: "#047857", dark: "#6ee7b7" },
  },
  // violet-500 / violet-400
  hr: {
    accent: { light: "#8b5cf6", dark: "#a78bfa" },
    tint: { light: "#8b5cf61f", dark: "#a78bfa1f" },
    text: { light: "#6d28d9", dark: "#c4b5fd" },
  },
  // amber-500 / amber-400
  production: {
    accent: { light: "#f59e0b", dark: "#fbbf24" },
    tint: { light: "#f59e0b1f", dark: "#fbbf241f" },
    text: { light: "#b45309", dark: "#fcd34d" },
  },
  // blue-500 / blue-400
  financial: {
    accent: { light: "#3b82f6", dark: "#60a5fa" },
    tint: { light: "#3b82f61f", dark: "#60a5fa1f" },
    text: { light: "#1d4ed8", dark: "#93c5fd" },
  },
  // sky-500 / sky-400
  other: {
    accent: { light: "#0ea5e9", dark: "#38bdf8" },
    tint: { light: "#0ea5e91f", dark: "#38bdf81f" },
    text: { light: "#0369a1", dark: "#7dd3fc" },
  },
};

function categoryPaletteFor(category: WidgetCategory, isDark: boolean) {
  const p = CATEGORY_PALETTE[category];
  return {
    accent: isDark ? p.accent.dark : p.accent.light,
    tint: isDark ? p.tint.dark : p.tint.light,
    text: isDark ? p.text.dark : p.text.light,
  };
}

// Spec §3.5: 2 cols on phones (<600px), 3 cols on small tablets
// (600–900px), 4 cols on large tablets (≥900px). 5px margin between cards.
function columnsFor(width: number): number {
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
}

const GRID_GAP = 10;

export function AddWidgetSheet({
  open,
  onOpenChange,
  onAdd,
}: AddWidgetSheetProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const sector =
    (user?.sector?.privileges as SECTOR_PRIVILEGES | undefined) ?? null;

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const searchRef = useRef<TextInput>(null);
  const tutorial = useOptionalTutorial();
  const tutorialActive = tutorial?.isActive ?? false;
  // Spotlight target for the "Tarefas" widget card during the catalog
  // tutorial step. The hook always runs (rules-of-hooks), but only the
  // table.tasks card actually wires the ref/onLayout below.
  const tarefasTarget = useTutorialTarget(
    TUTORIAL_TARGETS.homeAddWidgetCatalogTarefas,
  );

  const allWidgets = useMemo(
    () => widgetRegistry.getAvailableWidgets(sector),
    [sector],
  );

  // Categories present in the available set, in stable display order.
  const categories = useMemo(() => {
    const present = new Set(allWidgets.map((w) => w.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [allWidgets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allWidgets.filter((w) => {
      if (activeCategory !== "all" && w.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      const haystack = `${w.name} ${w.description ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allWidgets, activeCategory, query]);

  // Reset filters & focus search when the sheet opens. Delay the focus
  // call slightly so the slide-in animation doesn't fight the keyboard.
  // Skip the auto-focus during the tutorial so the keyboard doesn't pop up
  // and cover the catalog walkthrough tooltip.
  useEffect(() => {
    if (!open || tutorialActive) return;
    const handle = setTimeout(() => {
      searchRef.current?.focus();
    }, 320);
    return () => clearTimeout(handle);
  }, [open, tutorialActive]);

  // During the tutorial's catalog step, pre-filter to the "production"
  // category so the recommended widget ("Tarefas") is the first thing the
  // user sees — no hunting through 30+ widgets to find it.
  const tutorialStepId = tutorial?.currentStep?.id;
  useEffect(() => {
    if (!open) return;
    if (tutorialStepId === "home-widget-catalog") {
      setActiveCategory("production");
    }
  }, [open, tutorialStepId]);

  const handleAdd = (widgetId: string) => {
    void lightImpactHaptic();
    onAdd(widgetId);
    // While the catalog tutorial step is open, advancing on widget-add lets
    // the tutorial close the loop on the "tap to add" instruction without
    // requiring the user to also dismiss a Continue button.
    if (
      tutorial?.isActive &&
      tutorial.currentStep?.id === "home-widget-catalog"
    ) {
      tutorial.next();
    }
    setQuery("");
    setActiveCategory("all");
    onOpenChange(false);
  };

  const handleClose = () => {
    setQuery("");
    setActiveCategory("all");
    onOpenChange(false);
  };

  // Computed grid column count from the measured sheet width (falls back
  // to window width on first render before onLayout fires). The cardWidth
  // is then derived from the measured content width minus the inter-card
  // gaps — guarantees the cards fit at least N per row without overflow.
  // Subtract 2 from the per-card width to absorb any sub-pixel rounding
  // that would otherwise force flexWrap to put cards on separate rows.
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  const effectiveWidth = measuredWidth > 0 ? measuredWidth : windowWidth;
  const cols = columnsFor(effectiveWidth);
  const horizontalPadding = spacing.md * 2;
  const totalGap = GRID_GAP * (cols - 1);
  const resolvedCardWidth = Math.max(
    140,
    Math.floor((effectiveWidth - horizontalPadding - totalGap) / cols) - 2,
  );

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[90]}
      backdropOpacity={0.5}
    >
      <View style={{ flex: 1 }}>
        {/* Sticky header — spec §3.5: title 18/600 + description 13/400/muted
            + 36×36 close X. */}
        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingTop: 8,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.foreground,
                letterSpacing: -0.2,
              }}
            >
              Adicionar widget
            </Text>
            <Text
              numberOfLines={2}
              style={{
                fontSize: 13,
                fontWeight: "400",
                color: colors.mutedForeground,
                marginTop: 4,
                lineHeight: 18,
              }}
            >
              Escolha um widget para adicionar ao seu painel.
            </Text>
          </View>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? colors.muted : "transparent",
              flexShrink: 0,
            })}
          >
            <IconX size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Search + category tabs strip — pinned beneath the header so they
            don't scroll out of view when the body list scrolls. */}
        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingTop: 12,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 10,
            backgroundColor: colors.card,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: 40,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.input,
              paddingHorizontal: 10,
              gap: spacing.sm,
            }}
          >
            <IconSearch size={16} color={colors.mutedForeground} />
            <TextInput
              ref={searchRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar widgets..."
              placeholderTextColor={colors.mutedForeground}
              style={{
                flex: 1,
                padding: 0,
                fontSize: 14,
                color: colors.foreground,
                minHeight: 0,
                textAlignVertical: "center",
                includeFontPadding: false,
              }}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                style={({ pressed }) => ({
                  width: 22,
                  height: 22,
                  borderRadius: borderRadius.full,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? colors.muted : "transparent",
                })}
              >
                <IconX size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 6, paddingRight: spacing.md }}
          >
            <CategoryTab
              active={activeCategory === "all"}
              label="Todos"
              count={allWidgets.length}
              onPress={() => setActiveCategory("all")}
            />
            {categories.map((cat) => (
              <CategoryTab
                key={cat}
                active={activeCategory === cat}
                label={WIDGET_CATEGORY_LABELS[cat]}
                count={allWidgets.filter((w) => w.category === cat).length}
                onPress={() => setActiveCategory(cat)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Gallery (or empty state). Responsive grid: 2/3/4 cols based on
            screen width. Cards wrap; press anywhere on the card to add. */}
        {filtered.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: spacing.xl,
              gap: spacing.sm,
            }}
          >
            <IconStar
              size={32}
              color={colors.mutedForeground}
              opacity={0.4}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: colors.foreground,
                textAlign: "center",
              }}
            >
              Nenhum widget encontrado.
            </Text>
            {query.length > 0 && (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "400",
                  color: colors.mutedForeground,
                  textAlign: "center",
                  lineHeight: 17,
                  maxWidth: 280,
                }}
              >
                Tente outro termo de busca ou mude de categoria.
              </Text>
            )}
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            // onLayout measures the actual ScrollView width so the cards
            // size against the *sheet content area*, not the device window.
            // Without this, the earlier `useWindowDimensions()`-based calc
            // produced cards a few pixels too wide on devices where the
            // sheet imposes its own horizontal inset — the cards then
            // flex-wrapped to 1 column, producing the "vertical list"
            // appearance in screenshots.
            onLayout={(e) => setMeasuredWidth(e.nativeEvent.layout.width)}
            contentContainerStyle={{
              paddingHorizontal: spacing.md,
              paddingTop: spacing.sm + 4,
              paddingBottom: spacing.lg + insets.bottom,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: GRID_GAP,
              }}
            >
              {filtered.map((def) => {
                const isTarefas = def.id === "table.tasks";
                return (
                  <View
                    key={def.id}
                    ref={isTarefas ? tarefasTarget.ref : undefined}
                    onLayout={
                      isTarefas ? tarefasTarget.onLayout : undefined
                    }
                    collapsable={isTarefas ? false : undefined}
                  >
                    <WidgetGalleryCard
                      def={def}
                      width={resolvedCardWidth}
                      isDark={isDark}
                      onPress={() => handleAdd(def.id)}
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
        <CatalogTutorialOverlay />
      </View>
    </Sheet>
  );
}

/**
 * Tutorial overlay rendered INSIDE the catalog sheet's modal layer (the
 * root TutorialOverlay sits below RN Modals so its own spotlight is
 * invisible while the catalog is open). Mirrors the visual language of
 * the root overlay: dim everything except the spotlighted "Tarefas"
 * widget card, draw a pulsing yellow border around it, and float a
 * tutorial-tooltip-styled card at the top with progress, title,
 * description, hint and skip button.
 *
 * Coordinate handling: useTutorialTarget hands us window-relative coords
 * via measureInWindow. We render the overlay inside the sheet content,
 * so before drawing we measure that container's window offset and
 * subtract it — that way the spotlight cutout lines up with the card the
 * user actually sees.
 */
function CatalogTutorialOverlay() {
  const tutorial = useOptionalTutorial();
  const containerRef = useRef<View | null>(null);
  const [containerOffset, setContainerOffset] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const measureContainer = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.measureInWindow((x, y) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      setContainerOffset((prev) =>
        prev && Math.abs(prev.x - x) < 0.5 && Math.abs(prev.y - y) < 0.5
          ? prev
          : { x, y },
      );
    });
  }, []);

  // Pulsing border on the spotlight (uses the same easing/duration as the
  // root TutorialOverlay so the catalog step feels indistinguishable).
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
  }, [pulseScale]);

  const isActive =
    !!tutorial?.isActive &&
    tutorial.currentStep?.id === "home-widget-catalog";

  // Re-measure container on activation. We deliberately do NOT depend on
  // the global measureTick — the catalog modal is its own layer and
  // doesn't shift when the underlying app scrolls. Listening to the
  // global tick caused redundant measure cycles and visible jank.
  useEffect(() => {
    if (!isActive) return;
    measureContainer();
    const t1 = setTimeout(measureContainer, 200);
    const t2 = setTimeout(measureContainer, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isActive, measureContainer]);

  const rect = tutorial?.currentTargetRect ?? null;
  const haveSpotlight = !!rect && !!containerOffset;

  // Compute spotlight rect in container-local coords (px from the top-left
  // of the overlay container). Padding kept TIGHT (2px) so the cutout
  // doesn't bleed into the widget above the Tarefas card.
  const PAD = 2;
  const sx = haveSpotlight && rect ? rect.x - containerOffset!.x - PAD : 0;
  const sy = haveSpotlight && rect ? rect.y - containerOffset!.y - PAD : 0;
  const sw = haveSpotlight && rect ? rect.width + PAD * 2 : 0;
  const sh = haveSpotlight && rect ? rect.height + PAD * 2 : 0;

  const pulseStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: sx,
    top: sy,
    width: sw,
    height: sh,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#FCD34D",
    transform: [{ scale: pulseScale.value }],
    opacity: haveSpotlight ? 1 : 0,
  }));

  if (!isActive || !tutorial?.currentStep) return null;
  const step = tutorial.currentStep;
  const progressLabel = `${tutorial.currentStepIndex + 1} / ${tutorial.totalSteps}`;
  const dimColor = "rgba(0,0,0,0.78)";

  return (
    <View
      ref={containerRef}
      onLayout={measureContainer}
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}
    >
      {haveSpotlight ? (
        <>
          {/* Four dim strips around the spotlight rect. The spotlight area
              itself stays open so taps reach the underlying widget card. */}
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              height: Math.max(0, sy),
              backgroundColor: dimColor,
            }}
          />
          <View
            style={{
              position: "absolute",
              left: 0,
              top: sy + sh,
              right: 0,
              bottom: 0,
              backgroundColor: dimColor,
            }}
          />
          <View
            style={{
              position: "absolute",
              left: 0,
              top: Math.max(0, sy),
              width: Math.max(0, sx),
              height: sh,
              backgroundColor: dimColor,
            }}
          />
          <View
            style={{
              position: "absolute",
              left: sx + sw,
              top: Math.max(0, sy),
              right: 0,
              height: sh,
              backgroundColor: dimColor,
            }}
          />
          <Animated.View pointerEvents="none" style={pulseStyle} />
        </>
      ) : (
        // No rect yet — dim the whole modal so the user sees that something
        // tutorial-ish is happening, then the spotlight pops in once the
        // Tarefas card measures.
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: dimColor }]}
        />
      )}

      {/* Tutorial card pinned to the very top of the sheet (above the
          sheet's own title). pointerEvents="auto" so the skip button is
          reachable through the dim strips. */}
      <View
        pointerEvents="auto"
        style={{
          position: "absolute",
          top: 4,
          left: 8,
          right: 8,
          backgroundColor: "#0F172A",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#1E293B",
          paddingHorizontal: 12,
          paddingVertical: 10,
          shadowColor: "#000",
          shadowOpacity: 0.5,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 18,
          elevation: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              color: "#94A3B8",
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.5,
            }}
          >
            {progressLabel}
          </Text>
          <Pressable
            onPress={() => {
              void tutorial.skip();
            }}
            hitSlop={12}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <IconX size={12} color="#FFFFFFAA" />
            <Text
              style={{
                color: "#FFFFFFAA",
                fontSize: 11,
                fontWeight: "500",
              }}
            >
              Pular
            </Text>
          </Pressable>
        </View>
        <Text
          style={{
            color: "#F8FAFC",
            fontSize: 14,
            fontWeight: "700",
            marginBottom: 2,
          }}
        >
          {step.title}
        </Text>
        <Text
          style={{
            color: "#CBD5E1",
            fontSize: 11,
            lineHeight: 15,
            marginBottom: 6,
          }}
        >
          {step.description}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#422006",
            borderColor: "#FCD34D55",
            borderWidth: 1,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 10,
          }}
        >
          <IconHandClick size={16} color="#FCD34D" />
          <Text
            style={{
              color: "#FCD34D",
              fontSize: 12,
              fontWeight: "600",
              flex: 1,
            }}
          >
            {step.hint ?? step.ctaLabel ?? "Toque no card destacado"}
          </Text>
        </View>
        {/* Strict gating: no in-modal escape button. Users must tap the
            highlighted "Tarefas" card (or any widget) to advance. The
            sheet-dismissal handler in inicio.tsx auto-advances when the
            user closes the sheet, so they're never truly trapped. */}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// WidgetGalleryCard — spec §3.5 card. minHeight 168, borderRadius 10, top
// accent stripe 4px. Content: 40×40 tinted icon (8 radius), category badge
// top-right, name 14/600 line-clamp 2, description 12/400/muted line-clamp 3.
// Press anywhere on the card → onAdd.
// ---------------------------------------------------------------------------

function WidgetGalleryCard({
  def,
  width,
  isDark,
  onPress,
}: {
  def: WidgetDefinition;
  width: number;
  isDark: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const cat = categoryPaletteFor(def.category, isDark);
  const Icon = def.icon;

  // Stronger outline so the card reads as a *bordered card* like web's
  // gallery, not a flat list row. `colors.border` is too faint against
  // `colors.card` in dark mode; the explicit alpha matches the AccentPicker
  // SummaryCard's outline so the gallery cards feel like the same family.
  const cardOutline = isDark ? "rgba(217,217,217,0.22)" : "rgba(64,64,64,0.18)";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Adicionar ${def.name}`}
      style={({ pressed }) => ({
        width,
        minHeight: 168,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: cardOutline,
        backgroundColor: pressed ? colors.muted : colors.card,
        overflow: "hidden",
        // Subtle shadow so the card feels lifted off the sheet background
        // — mirrors web's `shadow-sm` on the gallery cards.
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.22 : 0.05,
        shadowRadius: 2,
        elevation: 1,
      })}
    >
      {/* Top accent stripe — 4px tall, color-coded by category. */}
      <View
        style={{
          height: 4,
          width: "100%",
          backgroundColor: cat.accent,
        }}
      />
      <View
        style={{
          flex: 1,
          padding: 12,
          gap: 8,
        }}
      >
        {/* Top row: 40×40 tinted icon tile + category badge top-right. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: cat.tint,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={20} color={cat.text} />
          </View>
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: borderRadius.sm,
              backgroundColor: cat.tint,
              flexShrink: 1,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: cat.text,
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}
            >
              {WIDGET_CATEGORY_LABELS[def.category]}
            </Text>
          </View>
        </View>

        {/* Name + description block. */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={2}
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.foreground,
              lineHeight: 18,
            }}
          >
            {def.name}
          </Text>
          <Text
            numberOfLines={3}
            style={{
              fontSize: 12,
              fontWeight: "400",
              color: colors.mutedForeground,
              marginTop: 6,
              lineHeight: 16,
            }}
          >
            {def.description}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function CategoryTab({
  active,
  label,
  count,
  onPress,
}: {
  active: boolean;
  label: string;
  count: number;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flexShrink: 0 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={`${label}, ${count} ${count === 1 ? "widget" : "widgets"}`}
        style={({ pressed }) => ({
          height: 34,
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 8,
          backgroundColor: active
            ? colors.card
            : pressed
              ? isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)"
              : isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.03)",
          ...(active && {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.35 : 0.12,
            shadowRadius: 3,
            elevation: 3,
          }),
        })}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontWeight: active ? "700" : "600",
              color: active ? colors.primary : colors.mutedForeground,
              textAlign: "center",
              includeFontPadding: false,
            }}
          >
            {label}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: active ? colors.primary : colors.mutedForeground,
                opacity: active ? 0.7 : 1,
                fontVariant: ["tabular-nums"],
              }}
            >
              {"  "}
              {count}
            </Text>
          </Text>
        </View>
        {active && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 8,
              right: 8,
              bottom: 0,
              height: 2,
              borderRadius: 1,
              backgroundColor: colors.primary,
            }}
          />
        )}
      </Pressable>
    </View>
  );
}
