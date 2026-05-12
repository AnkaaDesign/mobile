// Favorites widget — bookmarks chosen by the user via the page-level "star"
// toggle. Reuses FavoritesContext + getIconInfoByPath so the tile reads
// identically to the existing favourites block on the home screen, but is now
// addable / removable / reorderable like any other widget.
//
// Configurable: title, accent, itemsPerRow, itemsPerColumn, density, showHeader,
// showCount. Density drives the layout variant — compact (h-tight),
// comfortable (h-roomy with chevron), spacious (v-centered with icon-on-top).
//
// Web parity: mirrors `web/src/dashboard/widgets/favorites.tsx`'s schema +
// VARIANT_STYLES table. The web grid renders `perRow` cards per row using
// CSS grid; mobile flexes them in a horizontal Row with manual padding so
// the same `itemsPerRow` value reads visually similar at the same span.

import { useMemo } from "react";
import { z } from "zod";
import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { IconStar, IconPlus } from "@tabler/icons-react-native";
import { useFavorites } from "@/contexts/favorites-context";
import { getIconInfoByPath, isPageCadastrar } from "@/utils/page-icons";
import { useTheme } from "@/lib/theme";
import { routes } from "@/constants/routes";
import {
  Section,
  ToggleRow,
  LabeledField,
  DENSITY_VALUES,
  type Density,
} from "./_shared";
import { longPressHaptic, lightImpactHaptic } from "@/utils/haptics";
import { Input } from "@/components/ui/input";
import { WidgetCard } from "../components/widget-card";
import {
  AccentPicker,
  makeAccentSchema,
  resolveAccent,
  borderHexFor,
  type WidgetAccentColor,
  type WidgetAccentIcon,
  type WidgetBorderColor,
} from "../components/widget-accent";
import type {
  WidgetConfigProps,
  WidgetDefinition,
  WidgetRenderProps,
} from "../types";

// ---------- Schema ----------

const configSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(80)
    .default("Favoritos")
    .describe("Título exibido no cabeçalho do widget."),
  accent: makeAccentSchema({ color: "yellow", icon: "Star", borderColor: "none" }),
  /** Cards per row at mobile widths. Web allows up to 10; mobile honours
   *  the same upper bound but the render path clamps to span:
   *  span 1 → max 1, span 2 → max 3, span 3 → max 4. Saved configs
   *  round-trip cleanly. */
  itemsPerRow: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(4)
    .describe("Quantos atalhos exibir por linha (limitado pelo span no mobile)."),
  itemsPerColumn: z
    .number()
    .int()
    .min(1)
    .max(6)
    .default(1)
    .describe("Quantas linhas de atalhos empilhar verticalmente."),
  density: z
    .enum(DENSITY_VALUES)
    .default("comfortable")
    .describe(
      "Densidade dos cartões: compacta (linha estreita), confortável (com ícone à esquerda) ou espaçosa (ícone no topo).",
    ),
  display: z
    .object({
      showHeader: z.boolean().default(true),
      showCount: z.boolean().default(true),
    })
    .default({ showHeader: true, showCount: true })
    .describe("Visibilidade do cabeçalho e da contagem no topo."),
});
type Config = z.infer<typeof configSchema>;

// ---------- Layout variant — mirrors web's VARIANT_STYLES (file lines 88+) ----------

type LayoutVariant = "h-tight" | "h-roomy" | "v-centered";

interface VariantStyle {
  flexDirection: "row" | "column";
  alignItems: "center";
  justifyContent: "center" | "flex-start";
  cardPaddingX: number;
  cardPaddingY: number;
  iconBoxPadding: number;
  iconBoxRadius: number;
  iconSize: number;
  titleSize: number;
  titleWeight: "500" | "600" | "700";
  titleNumberOfLines: number;
  showChevron: boolean;
  gap: number;
}

const VARIANT_STYLES: Record<LayoutVariant, VariantStyle> = {
  // All densities now use icon-on-top, text-below-centered. Previously the
  // compact + comfortable variants placed the icon on the LEFT of the title,
  // which caused titles longer than the available horizontal space to
  // truncate aggressively ("Cronogra…") while leaving the icon-only "card"
  // looking narrower for short titles ("Recorte"). Vertical stacking keeps
  // every card visually identical in size and lets the title use the full
  // card width below the icon.
  "h-tight": {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cardPaddingX: 6,
    cardPaddingY: 6,
    iconBoxPadding: 4,
    iconBoxRadius: 4,
    iconSize: 14,
    titleSize: 10,
    titleWeight: "500",
    titleNumberOfLines: 1,
    showChevron: false,
    gap: 4,
  },
  "h-roomy": {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cardPaddingX: 8,
    cardPaddingY: 8,
    iconBoxPadding: 6,
    iconBoxRadius: 6,
    iconSize: 18,
    titleSize: 12,
    titleWeight: "600",
    titleNumberOfLines: 1,
    showChevron: false,
    gap: 6,
  },
  "v-centered": {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cardPaddingX: 8,
    cardPaddingY: 12,
    iconBoxPadding: 8,
    iconBoxRadius: 8,
    iconSize: 20,
    titleSize: 13,
    titleWeight: "600",
    titleNumberOfLines: 1,
    showChevron: false,
    gap: 6,
  },
};

// Below this card height, spacious gracefully degrades to comfortable so
// thin rows still render legibly. Mirrors web's SPACIOUS_MIN_HEIGHT_PX.
const SPACIOUS_MIN_HEIGHT_PX = 70;

function variantFor(density: Density, cardHeightPx: number): LayoutVariant {
  if (density === "compact") return "h-tight";
  if (density === "spacious") {
    return cardHeightPx >= SPACIOUS_MIN_HEIGHT_PX ? "v-centered" : "h-roomy";
  }
  return "h-roomy";
}

// ---------- Render ----------

function Render({ config, size }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const router = useRouter();
  const { favorites, removeFavorite } = useFavorites();
  const display = config.display ?? { showHeader: true, showCount: true };
  const density = (config.density ?? "comfortable") as Density;

  // At span 1 (1/3 row width) the grid math collapses — a 2-up grid would
  // give 50px-wide cards. Force single-column there. At span 2/3 honour the
  // user's itemsPerRow config (capped to span: 2 → 3, 3 → 4).
  const span = size?.span ?? 1;
  const maxPerRow = span === 1 ? 1 : span === 2 ? 3 : 4;
  const perRow = Math.max(1, Math.min(maxPerRow, config.itemsPerRow ?? 4));
  const perCol = Math.max(1, Math.min(6, config.itemsPerColumn ?? 1));

  // Approximate body budget — used to decide whether v-centered fits in
  // spacious mode (web uses the same heuristic). 140-px row token (mobile),
  // minus header/footer/padding overhead.
  const rowsTall = size?.rows ?? 2;
  const bodyBudget = Math.max(
    100,
    140 * rowsTall + 16 * (rowsTall - 1) - 70,
  );
  // Per-density target heights cap how tall a single favourite card can get
  // when there are fewer rows than the body would allow. Without this cap,
  // perCol=1 on a rows=2 widget yields a 226px card that swallows the
  // entire body — the user only ever sees one favourite at a time. The
  // floor / ceiling here keeps cards visually proportional regardless of
  // perCol, so extra body space is simply unused (the user can change
  // widget height or add more favourites to fill it).
  const MAX_CARD_HEIGHT_BY_DENSITY: Record<Density, number> = {
    compact: 44,
    comfortable: 72,
    spacious: 110,
  };
  const cardHeight = Math.min(
    MAX_CARD_HEIGHT_BY_DENSITY[density],
    Math.max(40, Math.floor((bodyBudget - 6 * (perCol - 1)) / perCol)),
  );

  const variant = variantFor(density, cardHeight);
  const styles = VARIANT_STYLES[variant];

  const accent = useMemo(
    () =>
      resolveAccent({
        color: config.accent?.color as WidgetAccentColor,
        icon: config.accent?.icon as WidgetAccentIcon,
      }),
    [config.accent?.color, config.accent?.icon],
  );
  const HeaderIcon = accent.Icon;

  const handleLongPress = (favId: string, favTitle: string) => {
    longPressHaptic();
    Alert.alert(
      "Remover favorito",
      `Remover "${favTitle}" dos favoritos?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            lightImpactHaptic();
            void removeFavorite(favId);
          },
        },
      ],
    );
  };

  if (favorites.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <WidgetCard
          title={config.title || "Favoritos"}
          icon={<HeaderIcon size={16} color={accent.hex} />}
          showHeader={display.showHeader}
          viewAllHref={routes.favorites}
          accentColor={accent.hex}
          borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
        >
          <View
            style={{
              flex: 1,
              padding: 16,
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <IconStar size={20} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
            <Text
              style={{ fontSize: 12, color: colors.mutedForeground, textAlign: "center" }}
            >
              Nenhum favorito ainda. Toque na estrela em qualquer página para
              adicioná-la aqui.
            </Text>
          </View>
        </WidgetCard>
      </View>
    );
  }

  // Pack favorites into rows of `perRow`. Cards within a row share width via
  // flex; cards across rows share fixed cardHeight so previews stay aligned.
  const rows: typeof favorites[] = [];
  for (let i = 0; i < favorites.length; i += perRow) {
    rows.push(favorites.slice(i, i + perRow));
  }

  return (
    <View style={{ flex: 1 }}>
      <WidgetCard
        title={config.title || "Favoritos"}
        icon={<HeaderIcon size={16} color={accent.hex} />}
        showHeader={display.showHeader}
        count={display.showCount && favorites.length > 0 ? favorites.length : null}
        viewAllHref={routes.favorites}
        accentColor={accent.hex}
        borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      >
        <ScrollView contentContainerStyle={{ padding: 8, gap: 6 }}>
          {rows.map((rowFavs, rIdx) => (
            <View key={`fav-row-${rIdx}`} style={{ flexDirection: "row", gap: 6 }}>
              {rowFavs.map((fav) => {
                const iconInfo = getIconInfoByPath(fav.path);
                const IconComponent = iconInfo.icon;
                const isCadastrar = isPageCadastrar(fav.path);
                // Cardinal-rule fix: the previous form put `flex: 1` and all
                // layout/visual chrome on `Pressable`'s style FUNCTION, which
                // doesn't reliably apply on iOS — short titles (e.g. "Recorte")
                // caused the card to collapse to intrinsic content width while
                // longer-title cards (e.g. "Cronograma") expanded, breaking
                // uniformity. Chrome + flex:1 now live on the outer View; the
                // inner Pressable is the tap surface and handles the variant
                // layout (column for v-centered, row otherwise) via a plain
                // style object so layout props apply reliably.
                return (
                  <View
                    key={fav.id}
                    style={{
                      flex: 1,
                      height: cardHeight,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <Pressable
                      onPress={() => router.push(fav.path as any)}
                      onLongPress={() => handleLongPress(fav.id, fav.title)}
                      delayLongPress={400}
                      android_ripple={{ color: "rgba(0,0,0,0.08)" }}
                      accessibilityLabel={`${fav.title}. Toque para abrir, segure para remover.`}
                      accessibilityRole="button"
                      style={{
                        flex: 1,
                        flexDirection: styles.flexDirection,
                        alignItems: styles.alignItems,
                        justifyContent: styles.justifyContent,
                        gap: styles.gap,
                        paddingHorizontal: styles.cardPaddingX,
                        paddingVertical: styles.cardPaddingY,
                      }}
                    >
                      <View style={{ position: "relative" }}>
                        <View
                          style={{
                            backgroundColor: iconInfo.color,
                            padding: styles.iconBoxPadding,
                            borderRadius: styles.iconBoxRadius,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <IconComponent size={styles.iconSize} color="#ffffff" />
                        </View>
                        {isCadastrar && (
                          // "+" badge for "cadastrar" pages — mirrors web. The
                          // background uses the theme's surface color so the
                          // badge reads correctly in both light and dark modes.
                          <View
                            style={{
                              position: "absolute",
                              top: -4,
                              right: -4,
                              backgroundColor: colors.background,
                              borderRadius: 999,
                              padding: 1,
                            }}
                          >
                            <IconPlus size={9} color={colors.primary} strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <Text
                        numberOfLines={styles.titleNumberOfLines}
                        style={{
                          // All variants are now column-stacked (icon on
                          // top, text below) so the title is always centered
                          // and sized to content (flex:0). maxWidth:"100%"
                          // lets the title use the full card width before
                          // truncating.
                          maxWidth: "100%",
                          textAlign: "center",
                          fontSize: styles.titleSize,
                          fontWeight: styles.titleWeight,
                          color: colors.foreground,
                          lineHeight: styles.titleSize + 3,
                        }}
                      >
                        {fav.title}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
              {/* Pad incomplete row with flex spacers so the last row's cards
               *  don't stretch wider than the others. */}
              {rowFavs.length < perRow &&
                Array.from({ length: perRow - rowFavs.length }).map((_, i) => (
                  <View key={`fav-spacer-${i}`} style={{ flex: 1 }} />
                ))}
            </View>
          ))}
        </ScrollView>
      </WidgetCard>
    </View>
  );
}

// ---------- Config primitives (outer-View + Pressable tap surface) ----------
// All chrome (border, background, radius) lives on the outer View — Pressable's
// style function does not reliably apply layout/visual props on iOS, so the
// previous inline-function styling caused pills to render as plain text. The
// inner Pressable is just a centered tap target.

function NumberPill({
  value,
  active,
  fill,
  onPress,
}: {
  value: number;
  active: boolean;
  fill?: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const outlineColor = isDark
    ? "rgba(217,217,217,0.28)"
    : "rgba(64,64,64,0.22)";
  const inactiveBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  return (
    <View
      style={{
        ...(fill ? { flex: 1 } : { minWidth: 44 }),
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: active ? colors.primary : outlineColor,
        backgroundColor: active ? colors.primary : inactiveBg,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={{
          minHeight: 40,
          paddingHorizontal: 12,
          paddingVertical: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            fontWeight: active ? "700" : "500",
            color: active ? colors.primaryForeground : colors.foreground,
          }}
        >
          {value}
        </Text>
      </Pressable>
    </View>
  );
}

const DENSITY_PILL_OPTIONS: { value: Density; label: string }[] = [
  { value: "compact", label: "Compacta" },
  { value: "comfortable", label: "Confortável" },
  { value: "spacious", label: "Espaçosa" },
];

function DensityPill({
  value,
  active,
  label,
  onPress,
}: {
  value: Density;
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const outlineColor = isDark
    ? "rgba(217,217,217,0.28)"
    : "rgba(64,64,64,0.22)";
  const inactiveBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: active ? colors.primary : outlineColor,
        backgroundColor: active ? colors.primary : inactiveBg,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={`Densidade ${label}`}
        style={{
          minHeight: 40,
          paddingHorizontal: 8,
          paddingVertical: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12,
            fontWeight: active ? "700" : "500",
            color: active ? colors.primaryForeground : colors.foreground,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------- Config ----------

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });
  const setDisplay = <K extends keyof Config["display"]>(
    key: K,
    value: Config["display"][K],
  ) =>
    onChange({
      ...config,
      display: {
        ...(config.display ?? { showHeader: true, showCount: true }),
        [key]: value,
      },
    });

  return (
    <View style={{ gap: 12 }}>
      <LabeledField label="Título">
        <Input
          value={config.title}
          onChangeText={(v: string) => set("title", v)}
          placeholder="Favoritos"
        />
      </LabeledField>

      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "yellow") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Star") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
      </Section>

      <Section title="Cabeçalho">
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.display?.showHeader ?? true}
          onCheckedChange={(v) => setDisplay("showHeader", v)}
        />
        <ToggleRow
          label="Exibir contagem"
          checked={config.display?.showCount ?? true}
          onCheckedChange={(v) => setDisplay("showCount", v)}
        />
      </Section>

      <Section title="Densidade" defaultOpen>
        <LabeledField
          label="Densidade"
          helper="Compacta = lista estreita; Confortável = ícone à esquerda; Espaçosa = ícone no topo, título centralizado."
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            {DENSITY_PILL_OPTIONS.map((opt) => (
              <DensityPill
                key={opt.value}
                value={opt.value}
                label={opt.label}
                active={(config.density ?? "comfortable") === opt.value}
                onPress={() => set("density", opt.value)}
              />
            ))}
          </View>
        </LabeledField>
      </Section>

      <Section title="Grade">
        <LabeledField label="Cartões por linha" helper="1 a 4 — limite mobile.">
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            {[1, 2, 3, 4].map((n) => (
              <NumberPill
                key={n}
                value={n}
                active={config.itemsPerRow === n}
                fill
                onPress={() => set("itemsPerRow", n)}
              />
            ))}
          </View>
        </LabeledField>

        <LabeledField label="Linhas visíveis" helper="1 a 6.">
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <NumberPill
                key={n}
                value={n}
                active={config.itemsPerColumn === n}
                onPress={() => set("itemsPerColumn", n)}
              />
            ))}
          </View>
        </LabeledField>
      </Section>
    </View>
  );
}

// ---------- Definition ----------

export const favoritesWidget: WidgetDefinition<Config> = {
  id: "home.favorites",
  name: "Favoritos",
  description:
    "Atalhos para as páginas marcadas como favoritas. Toque para navegar; segure para remover. Configurável: título, aparência, cartões por linha, linhas, densidade.",
  icon: IconStar,
  category: "other",
  allowedSectors: "*",
  // Personal/quick widget — works at any width. At 1/3 falls back to a
  // single-column stack; at 2/3 and full width uses the user's grid setting.
  allowedSpans: [1, 2, 3],
  defaultSpan: 1,
  allowedHeights: [1, 2, 3],
  defaultRows: 2,
  configSchema,
  defaultConfig: {
    title: "Favoritos",
    accent: { color: "yellow", icon: "Star", borderColor: "none" },
    itemsPerRow: 4,
    itemsPerColumn: 1,
    density: "comfortable",
    display: { showHeader: true, showCount: true },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
