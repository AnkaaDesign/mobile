// Recent-messages widget — stylized stub cards (title + skeleton-bar preview)
// modeled after web's MessageStubCard. Each card renders a deterministic
// sequence of "blocks" (heading, paragraphs, list, divider, image, button)
// derived from the message id, so previews stay stable per message but vary
// between messages. Tap a card to open the message modal; unread messages
// are marked as viewed on tap.
//
// Configurable: title, accent, itemsPerRow (1–3 on mobile — web allows up to
// 8 but anything above 3 is unreadable on a phone), itemsPerColumn (1–6),
// density, display.showHeader, showCount. `display.showHeader` is nested to
// match web's schema so saved configs round-trip across platforms.

import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, Pressable, ScrollView } from "react-native";
import {
  IconMessage,
  IconMessageOff,
  IconClock,
} from "@tabler/icons-react-native";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/lib/theme";
import { useHomeDashboard } from "@/hooks/dashboard";
import { useMarkMessageAsViewed } from "@/hooks/useMyMessages";
import { MessageModal } from "@/components/message/MessageModal";
import {
  Section,
  ToggleRow,
  LabeledField,
  DENSITY_VALUES,
  type Density,
} from "./_shared";
import { SkeletonRows } from "./_skeleton";
import { WidgetErrorState } from "./_error-state";
import { lightImpactHaptic } from "@/utils/haptics";
import { Input } from "@/components/ui/input";
import { routes } from "@/constants/routes";
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
import type { HomeDashboardMessage } from "@/types";
import { WIDGET_ROW_MAX_HEIGHT } from "../types";
import type {
  WidgetConfigProps,
  WidgetDefinition,
  WidgetRenderProps,
} from "../types";

// ---------- Schema ----------

// Nested `display.showHeader` mirrors web's `recent-messages.tsx` schema so
// cross-platform configs round-trip cleanly. Earlier mobile builds stored
// `showHeader` flat at the top level; the `z.preprocess` below promotes the
// legacy flat key into `display.showHeader` so saved layouts keep their
// user-chosen value after the schema reshape.
const configSchema = z.preprocess(
  (raw) => {
    if (!raw || typeof raw !== "object") return raw;
    const r = raw as Record<string, unknown>;
    if ("showHeader" in r && (r.display == null || typeof r.display !== "object")) {
      return {
        ...r,
        display: { showHeader: !!r.showHeader },
      };
    }
    return r;
  },
  z.object({
    title: z
      .string()
      .min(1)
      .max(80)
      .default("Mensagens Recentes")
      .describe("Título exibido no cabeçalho do widget."),
    accent: makeAccentSchema({ color: "indigo", icon: "Message", borderColor: "none" }),
    /** Mobile caps perRow at 3 — anything denser is illegible on phones. Web
     *  allows up to 8; saved configs round-trip clamped at render time. */
    itemsPerRow: z
      .number()
      .int()
      .min(1)
      .max(3)
      .default(2)
      .describe("Quantos cartões de mensagem por linha."),
    itemsPerColumn: z
      .number()
      .int()
      .min(1)
      .max(6)
      .default(2)
      .describe("Quantas linhas de cartões empilhar verticalmente."),
    density: z
      .enum(DENSITY_VALUES)
      .default("comfortable")
      .describe("Densidade dos blocos visuais dentro de cada cartão."),
    display: z
      .object({
        showHeader: z.boolean().default(true),
        showViewAll: z.boolean().default(true),
      })
      .default({ showHeader: true, showViewAll: true })
      .describe("Visibilidade do cabeçalho e do rodapé “Ver todos”."),
    showCount: z
      .boolean()
      .default(true)
      .describe("Exibe a contagem de mensagens não lidas no cabeçalho."),
  }),
);
type Config = z.infer<typeof configSchema>;

// ---------- Block preview generator (port of web file lines 117+) ----------

type BlockKind = "heading" | "paragraph" | "list" | "divider" | "button" | "image";

interface PreviewBlock {
  kind: BlockKind;
  /** width % for paragraph / list / heading lines */
  width: number;
}

/** Deterministic PRNG seeded from a string. */
function seededRng(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h ^ seed.charCodeAt(i)) * 16777619) >>> 0;
  }
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0x100000000;
  };
}

function generateBlocks(seed: string, density: Density = "comfortable"): PreviewBlock[] {
  const rng = seededRng(seed);
  const blocks: PreviewBlock[] = [];
  const totalBlocks =
    density === "compact"
      ? 5 + Math.floor(rng() * 4)
      : density === "spacious"
        ? 11 + Math.floor(rng() * 5)
        : 8 + Math.floor(rng() * 5);
  blocks.push({ kind: "heading", width: 55 + Math.floor(rng() * 35) });
  if (rng() < 0.3) {
    blocks.push({ kind: "image", width: 100 });
  }
  let i = blocks.length;
  let consecutiveParagraph = 0;
  let lastListIndex = -3;
  while (i < totalBlocks - 1) {
    const r = rng();
    let kind: BlockKind;
    if (r < 0.18 && i - lastListIndex > 2) {
      const runLen = 2 + Math.floor(rng() * 3);
      for (let j = 0; j < runLen && i < totalBlocks - 1; j++) {
        blocks.push({ kind: "list", width: 45 + Math.floor(rng() * 45) });
        i++;
      }
      lastListIndex = i;
      consecutiveParagraph = 0;
      continue;
    }
    if (consecutiveParagraph >= 3 && r < 0.35) {
      blocks.push({ kind: "divider", width: 100 });
      consecutiveParagraph = 0;
      i++;
      continue;
    }
    if (r < 0.78) {
      kind = "paragraph";
      consecutiveParagraph += 1;
    } else if (r < 0.9) {
      kind = "list";
      consecutiveParagraph = 0;
      lastListIndex = i;
    } else if (r < 0.97) {
      kind = "image";
      consecutiveParagraph = 0;
    } else {
      kind = "divider";
      consecutiveParagraph = 0;
    }
    let width = 55 + Math.floor(rng() * 40);
    if (kind === "list") width = 45 + Math.floor(rng() * 45);
    if (kind === "image") width = 70 + Math.floor(rng() * 30);
    if (kind === "divider") width = 100;
    blocks.push({ kind, width });
    i++;
  }
  if (rng() < 0.3) {
    blocks.push({ kind: "button", width: 30 + Math.floor(rng() * 25) });
  } else {
    blocks.push({ kind: "paragraph", width: 30 + Math.floor(rng() * 35) });
  }
  return blocks;
}

// Density-driven sizing (mobile pixel values, mirrors web's tailwind classes).
const DENSITY_BLOCK_PX = {
  compact: { heading: 6, paragraph: 4, list: 4, listDot: 3, button: 10 },
  comfortable: { heading: 8, paragraph: 5, list: 5, listDot: 5, button: 12 },
  spacious: { heading: 10, paragraph: 7, list: 7, listDot: 7, button: 14 },
} as const;

const DENSITY_CARD_PX = {
  // Compact is meant to be genuinely dense — small type + tight padding so
  // several cards stay legible in a short tile. (Was 11/8 — read as too big.)
  compact: { padding: 6, gap: 4, blockGap: 2, titleSize: 10, badgeSize: 8, footerSize: 9 },
  comfortable: {
    padding: 9,
    gap: 5,
    blockGap: 3,
    titleSize: 12,
    badgeSize: 9,
    footerSize: 10,
  },
  spacious: {
    padding: 12,
    gap: 7,
    blockGap: 4,
    titleSize: 14,
    badgeSize: 10,
    footerSize: 11,
  },
} as const;

// ---------- Block renderer ----------

function PreviewBlockNode({
  block,
  isUnread,
  density,
  fgColor,
  primaryColor,
  borderColor,
  mutedColor,
}: {
  block: PreviewBlock;
  isUnread: boolean;
  density: Density;
  fgColor: string;
  primaryColor: string;
  borderColor: string;
  mutedColor: string;
}) {
  const sizes = DENSITY_BLOCK_PX[density];
  // Hex+alpha shorthand. fg-15% / fg-25% / primary-45% / primary-65% mimic
  // web's bg-foreground/15 etc. Keep these inline rather than reaching for
  // theme tokens — the fades are intentionally lower than any semantic color.
  const baseBg = isUnread ? primaryColor + "73" : fgColor + "26"; // 45% / 15%
  const buttonBg = isUnread ? primaryColor + "A6" : fgColor + "40"; // 65% / 25%

  if (block.kind === "divider") {
    return (
      <View
        style={{
          flex: 1,
          minHeight: 0,
          justifyContent: "center",
        }}
      >
        <View style={{ height: 1, width: "100%", backgroundColor: borderColor }} />
      </View>
    );
  }

  if (block.kind === "list") {
    return (
      <View
        style={{
          flex: 1,
          minHeight: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}
      >
        <View
          style={{
            width: sizes.listDot,
            height: sizes.listDot,
            borderRadius: sizes.listDot / 2,
            backgroundColor: baseBg,
          }}
        />
        <View
          style={{
            height: sizes.list,
            width: `${block.width}%`,
            borderRadius: sizes.list / 2,
            backgroundColor: baseBg,
          }}
        />
      </View>
    );
  }

  if (block.kind === "image") {
    return (
      <View
        style={{
          flex: 1,
          minHeight: 0,
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: `${block.width}%`,
            minHeight: 18,
            height: "100%",
            borderRadius: 4,
            borderWidth: 1,
            backgroundColor: isUnread ? primaryColor + "33" : mutedColor + "B3",
            borderColor: isUnread ? primaryColor + "66" : borderColor,
          }}
        />
      </View>
    );
  }

  // heading / paragraph / button
  // Type as `number` (not the inferred `4 | 5 | 7` literal-union from
  // `as const`) so the heading / button branches don't trip TS2322.
  let height: number = sizes.paragraph;
  let bg = baseBg;
  let radius: number = sizes.paragraph / 2;
  if (block.kind === "heading") {
    height = sizes.heading;
    radius = 4;
  } else if (block.kind === "button") {
    height = sizes.button;
    bg = buttonBg;
    radius = 4;
  }
  return (
    <View
      style={{
        flex: 1,
        minHeight: 0,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          height,
          width: `${block.width}%`,
          borderRadius: radius,
          backgroundColor: bg,
        }}
      />
    </View>
  );
}

// ---------- Stub card ----------

interface MessageStubCardProps {
  message: HomeDashboardMessage;
  onPress: () => void;
  density: Density;
  cardHeight: number;
}

function MessageStubCard({ message, onPress, density, cardHeight }: MessageStubCardProps) {
  const { colors } = useTheme();
  const isUnread = !message.viewedAt;
  const blocks = useMemo(
    () => generateBlocks(message.id, density),
    [message.id, density],
  );
  const timeAgo = message.publishedAt
    ? formatDistanceToNow(new Date(message.publishedAt), {
        addSuffix: true,
        locale: ptBR,
      })
    : null;
  const sizes = DENSITY_CARD_PX[density];
  // Title clamps to a single line on compact (and on any short card) so it
  // can't eat the whole card; the skeleton/time below stay visible.
  const titleLines = density === "compact" || cardHeight < 110 ? 1 : 2;
  // Drop the time footer on very short cards — below ~92px it crowds the
  // title + preview and reads as clutter rather than information.
  const showTime = !!timeAgo && cardHeight >= 92;

  // Cardinal-rule fix: Pressable's style function on iOS does not reliably
  // apply layout props (flex:1 etc) OR visual props (border, bg, radius).
  // Move ALL chrome to an outer View; Pressable becomes a transparent tap
  // surface filling its parent. Symptom this fixes: with itemsPerRow=1 the
  // card was rendering at intrinsic-content width instead of stretching to
  // the row's full width.
  return (
    <View
      style={{
        flex: 1,
        height: cardHeight,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: isUnread ? colors.primary + "66" : colors.border,
        backgroundColor: isUnread ? colors.primary + "0F" : colors.card,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Mensagem: ${message.title || "Sem título"}${
          isUnread ? ", não lida" : ""
        }`}
        android_ripple={{ color: "rgba(0,0,0,0.08)" }}
        // PLAIN style object (not a function). Pressable's style-function
        // form does not reliably apply layout props on iOS — without flex:1
        // here, the Pressable collapses to intrinsic content height and the
        // inner flex:1 content View loses its frame, causing the title +
        // skeleton blocks to overlap each other at zero height.
        style={{ flex: 1 }}
      >
        {/* Top accent stripe — primary for unread, muted gradient stub for read */}
        <View
          style={{
            height: 3,
            backgroundColor: isUnread ? colors.primary : colors.mutedForeground + "40",
          }}
        />
        <View style={{ flex: 1, padding: sizes.padding, gap: sizes.gap }}>
          {/* Title row — the leading unread-dot was removed per design feedback;
              the "Novo" pill on the right already signals unread state and the
              dot was visual noise inside the already-narrow card. */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, minWidth: 0 }}>
            <Text
              numberOfLines={titleLines}
              style={{
                flex: 1,
                fontSize: sizes.titleSize,
                fontWeight: "600",
                lineHeight: sizes.titleSize + 3,
                color: isUnread ? colors.foreground : colors.foreground + "BF",
              }}
            >
              {message.title || "Sem título"}
            </Text>
            {isUnread && (
              <View
                style={{
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 999,
                  backgroundColor: colors.primary,
                }}
              >
                <Text
                  style={{
                    fontSize: sizes.badgeSize,
                    fontWeight: "700",
                    color: colors.primaryForeground,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                  }}
                >
                  Novo
                </Text>
              </View>
            )}
          </View>

          {/* Block preview — flex:1 so blocks share remaining height equally. */}
          <View style={{ flex: 1, minHeight: 0, gap: sizes.blockGap }}>
            {blocks.map((b, i) => (
              <PreviewBlockNode
                key={i}
                block={b}
                isUnread={isUnread}
                density={density}
                fgColor={colors.foreground}
                primaryColor={colors.primary}
                borderColor={colors.border}
                mutedColor={colors.muted}
              />
            ))}
          </View>

          {showTime && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                borderTopWidth: 1,
                borderTopColor: colors.border + "66",
                paddingTop: 4,
              }}
            >
              <IconClock
                size={sizes.footerSize}
                color={colors.mutedForeground}
                style={{ opacity: 0.6 }}
              />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: sizes.footerSize,
                  color: colors.mutedForeground,
                  fontVariant: ["tabular-nums"],
                  flex: 1,
                }}
              >
                {timeAgo}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

// ---------- Render ----------

function Render({ config, size }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;
  const { data, isLoading, isError, refetch, isRefetching } = useHomeDashboard({
    platform: "mobile",
  });
  const messages = (data?.data?.recentMessages ?? []) as HomeDashboardMessage[];
  const unreadCount = data?.data?.counts?.unreadMessages ?? 0;
  const density = (config.density ?? "comfortable") as Density;

  // Span-aware perRow override (web 4-up grid is unreadable on phones). Spec:
  // span 1 → 1 col; span 2 → max 2 cols; span 3 → max 3 cols.
  const span = size?.span ?? 2;
  const maxPerRow = span === 1 ? 1 : span === 2 ? 2 : 3;
  const perRow = Math.max(1, Math.min(maxPerRow, config.itemsPerRow ?? 2));
  const perCol = Math.max(1, Math.min(6, config.itemsPerColumn ?? 2));
  const totalCells = perRow * perCol;

  // Tap → open MessageModal. Mark unread messages as viewed.
  const { mutate: markAsViewed } = useMarkMessageAsViewed();
  const [selected, setSelected] = useState<HomeDashboardMessage | null>(null);
  const onPress = useCallback(
    (m: HomeDashboardMessage) => {
      lightImpactHaptic();
      if (!m.viewedAt) markAsViewed(m.id);
      setSelected(m);
    },
    [markAsViewed],
  );

  // Cap displayed messages at perRow*perCol so the grid is fully populated.
  const visible = useMemo(() => messages.slice(0, totalCells), [messages, totalCells]);

  // Card height is derived from the REAL body height (measured via onLayout),
  // not a hardcoded estimate. The old `140·rows − 70` formula under-counted
  // the chrome (stripe 6 + header 36 + footer 28 + padding ≈ 102, not 70), so
  // cards rendered taller than the body and overflowed / clipped — exactly the
  // "3×1 overflows even with 1 line visible" bug. We size each card so that
  // `perCol` rows fit the measured body exactly; only when that would make
  // cards unreadably small (large perCol on a short tile) do they hit a floor
  // and the ScrollView takes over.
  const rowsTall = size?.rows ?? 2;
  const CONTENT_PAD = density === "compact" ? 6 : 8;
  const ROW_GAP = 6;
  const MIN_CARD = density === "compact" ? 56 : 72;
  const [bodyH, setBodyH] = useState(0);
  // First-frame fallback before onLayout fires: derive body height from the
  // row token minus the fixed chrome (stripe + header + footer).
  const fallbackBodyH = Math.max(
    90,
    WIDGET_ROW_MAX_HEIGHT[rowsTall] - 6 - 36 - 28,
  );
  const effectiveBodyH = bodyH > 0 ? bodyH : fallbackBodyH;
  const availH = effectiveBodyH - CONTENT_PAD * 2;
  const cardHeight = Math.max(
    MIN_CARD,
    Math.floor((availH - ROW_GAP * (perCol - 1)) / perCol),
  );

  return (
    <View style={{ flex: 1 }}>
      <WidgetCard
        title={config.title || "Mensagens Recentes"}
        icon={<Icon size={16} color={accent.hex} />}
        showHeader={config.display?.showHeader ?? true}
        showFooter={config.display?.showViewAll ?? true}
        count={config.showCount && unreadCount > 0 ? unreadCount : null}
        accentColor={accent.hex}
        borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
        density={density}
        bodyPadded={false}
        viewAllHref={routes.administration.messages.root}
        onRefresh={refetch}
        refreshing={isRefetching}
      >
        {isLoading ? (
          <View style={{ padding: 12 }}>
            <SkeletonRows count={3} density={density} />
          </View>
        ) : isError ? (
          <View style={{ padding: 12, flex: 1, justifyContent: "center" }}>
            <WidgetErrorState
              message="Não foi possível carregar mensagens."
              onRetry={() => refetch()}
            />
          </View>
        ) : visible.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              gap: 6,
            }}
          >
            <IconMessageOff size={24} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
            <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: "center" }}>
              Nenhuma mensagem recente.
            </Text>
          </View>
        ) : (
          // flex:1 wrapper measured via onLayout — this is the TRUE body
          // height (WidgetCard's body fills the fixed-height tile minus its
          // header/footer), so cardHeight above can size rows to fit exactly.
          <View
            style={{ flex: 1, minHeight: 0 }}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (Math.abs(h - bodyH) > 1) setBodyH(h);
            }}
          >
            <ScrollView
              // ScrollView is the safety valve: when perCol rows can't fit at
              // a readable size (cardHeight hits MIN_CARD), the grid scrolls
              // instead of clipping. When they DO fit, content == body and it
              // doesn't scroll.
              contentContainerStyle={{
                paddingHorizontal: CONTENT_PAD,
                paddingVertical: CONTENT_PAD,
                gap: ROW_GAP,
              }}
              showsVerticalScrollIndicator={false}
            >
              {/* Pack messages into rows of `perRow` cards each. Use flex inside
               *  each row so cards share width; height is fixed per cardHeight
               *  so block previews keep their proportions. */}
              {Array.from({ length: Math.ceil(visible.length / perRow) }).map((_, rIdx) => {
                const rowSlice = visible.slice(rIdx * perRow, (rIdx + 1) * perRow);
                return (
                  <View
                    key={`row-${rIdx}`}
                    style={{
                      flexDirection: "row",
                      gap: ROW_GAP,
                    }}
                  >
                    {rowSlice.map((m) => (
                      <MessageStubCard
                        key={m.id}
                        message={m}
                        onPress={() => onPress(m)}
                        density={density}
                        cardHeight={cardHeight}
                      />
                    ))}
                    {/* Pad incomplete row with invisible flex spacers so the
                     *  last row's cards don't stretch to fill the slot. */}
                    {rowSlice.length < perRow &&
                      Array.from({ length: perRow - rowSlice.length }).map((_, i) => (
                        <View key={`spacer-${i}`} style={{ flex: 1 }} />
                      ))}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </WidgetCard>

      {/* MessageModal — adapts HomeDashboardMessage to the modal's expected
       *  shape. The modal's `Notification` type is structurally compatible
       *  for the fields we pass; cast through `any` to bypass strict typing
       *  rather than mapping every field. */}
      {selected && (
        <MessageModal
          visible
          onClose={() => setSelected(null)}
          messages={[selected as any]}
        />
      )}
    </View>
  );
}

// ---------- Config ----------

// Pill button identical to the SizeSelector's Largura/Altura pills so the
// "Mensagens por linha" + "Linhas visíveis" selectors feel like part of
// the same form family. Outer View owns the layout flex (Pressable's
// style function can't be trusted with flex on iOS); inner Pressable
// owns visual chrome (border, fill, opacity).
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
  // All chrome on outer View. Pressable sizes to content (no height:100%
  // — that caused indeterminate height loops that stretched pills to
  // hundreds of pixels tall when the parent row had alignItems:stretch).
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
        ...(config.display ?? { showHeader: true, showViewAll: true }),
        [key]: value,
      },
    });

  return (
    <View style={{ gap: 12 }}>
      <LabeledField label="Título">
        <Input
          value={config.title}
          onChangeText={(v: string) => set("title", v)}
          placeholder="Mensagens Recentes"
        />
      </LabeledField>

      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "indigo") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Message") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
      </Section>

      <Section title="Cabeçalho e rodapé">
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.display?.showHeader ?? true}
          onCheckedChange={(v) => setDisplay("showHeader", v)}
        />
        <ToggleRow
          label="Exibir contagem de não lidas"
          checked={config.showCount}
          onCheckedChange={(v) => set("showCount", v)}
        />
        <ToggleRow
          label="Exibir botão “Ver todos”"
          checked={config.display?.showViewAll ?? true}
          onCheckedChange={(v) => setDisplay("showViewAll", v)}
        />
      </Section>

      <Section title="Densidade" defaultOpen>
        <LabeledField
          label="Densidade"
          helper="Define o tamanho dos blocos de prévia em cada cartão."
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

      <Section title="Grade" defaultOpen>
        <LabeledField label="Mensagens por linha" helper="1 a 3 — limite mobile.">
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            {[1, 2, 3].map((n) => (
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
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

export const recentMessagesWidget: WidgetDefinition<Config> = {
  id: "home.recent-messages",
  name: "Mensagens Recentes",
  description:
    "Últimas mensagens recebidas. Toque em um cartão para abrir a mensagem completa. Configurável: título, aparência, mensagens por linha, linhas visíveis, densidade.",
  icon: IconMessage,
  category: "other",
  allowedSectors: "*",
  // Stub-card grid needs at least 2/3 width to keep titles + previews readable.
  allowedSpans: [2, 3],
  defaultSpan: 2,
  allowedHeights: [1, 2, 3, 4],
  defaultRows: 2,
  configSchema,
  defaultConfig: {
    title: "Mensagens Recentes",
    accent: { color: "indigo", icon: "Message", borderColor: "none" },
    itemsPerRow: 2,
    itemsPerColumn: 2,
    density: "comfortable",
    display: { showHeader: true },
    showCount: true,
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
