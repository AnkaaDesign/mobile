// Add-widget gallery for the dashboard. Web-parity gallery rebuilt to spec
// §3.5 of `MOBILE_WIDGETS_SPEC.md`, now hosted by the canonical StandardModal
// (native pageSheet + drag indicator + standardized header/close):
//
//   • Header            — StandardModal renders title "Adicionar widget" +
//                         subtitle "Escolha um widget para adicionar ao seu
//                         painel." + the rounded close button.
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
//   - StandardModal auto-renders the drag-indicator pill + header. Do NOT
//     add a second one. The body is rendered with `scroll={false}` so the
//     pinned search/category strip stays put while the gallery scrolls
//     itself.
//   - StandardModal renders inside a native Modal, so the outer SafeArea
//     insets do NOT apply automatically — we read `useSafeAreaInsets().bottom`
//     and pad the gallery scroll content with it.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconSearch,
  IconStar,
  IconX,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { StandardModal } from "@/components/ui/standard-modal";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { lightImpactHaptic } from "@/utils/haptics";
import { borderRadius, spacing } from "@/constants/design-system";
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
  // A user "leads" a sector when ledSector is populated — gates leader-only
  // widgets (e.g. Ponto do Setor (Líder)) out of the gallery for everyone else.
  const isLeader = !!user?.ledSector;

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const searchRef = useRef<TextInput>(null);

  const allWidgets = useMemo(
    () => widgetRegistry.getAvailableWidgets(sector, isLeader),
    [sector, isLeader],
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
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      searchRef.current?.focus();
    }, 320);
    return () => clearTimeout(handle);
  }, [open]);

  const handleAdd = (widgetId: string) => {
    void lightImpactHaptic();
    onAdd(widgetId);
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
    <StandardModal
      visible={open}
      onClose={handleClose}
      title="Adicionar widget"
      subtitle="Escolha um widget para adicionar ao seu painel."
      scroll={false}
      padded={false}
      bodyStyle={{ paddingBottom: 0 }}
    >
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
              {filtered.map((def) => (
                <WidgetGalleryCard
                  key={def.id}
                  def={def}
                  width={resolvedCardWidth}
                  isDark={isDark}
                  onPress={() => handleAdd(def.id)}
                />
              ))}
            </View>
          </ScrollView>
        )}
    </StandardModal>
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
