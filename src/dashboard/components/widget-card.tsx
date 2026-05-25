// Shared chrome for mobile dashboard widgets — gives every tile the same
// visual language: bordered card + fixed-height header strip + optional
// footer link. Mirrors web/src/dashboard/components/widget-card.tsx
// pixel-perfectly with mobile-appropriate adaptations.
//
// Visual contract (matching web):
//  - Container: rounded-lg (8px), bg-card, border (1px → 1.5px when accent),
//    shadow-sm, overflow-hidden, flex column, fills its parent slot (flex:1).
//  - TOP ACCENT STRIPE: 6px tall full-width bar flush at the top when an
//    `accentColor` (or legacy `borderColor`) is set. The card border also
//    adopts that hex so the widget reads from the outline alone.
//  - HEADER (h-9 = 36px): px-3, items-center, justify-between, gap-3,
//    border-bottom, bg-muted at ~30% alpha.
//      Left: icon block (24×24 tinted square) + title (text-sm, font-semibold,
//            truncate) + count pill (rounded-md, bg-muted/70, text-[10px],
//            tabular, subtle border for definition).
//      Right: headerExtra (gap 8).
//  - BODY: flex:1, minHeight:0, fills remaining space. Three rendering modes
//    — bodyAsList pass-through, bodyMaxHeight ScrollView wrapper, default
//    flex:1 View.
//  - FOOTER (h-7 = 28px): px-3, border-top, bg-muted at ~30% alpha, centered
//    "Ver todos" link with chevron icon. When an accent is configured the
//    link adopts the accent hue so the footer reads as part of the widget's
//    visual identity (not a generic muted-foreground stub).
//
// Padding model:
//  - The body wrapper has `paddingHorizontal:12 paddingVertical:8` by default.
//    Most widgets render text/forms and want that breathing room.
//  - Data tables render edge-to-edge press rows and need to manage their own
//    padding (so press feedback fills the row width). They opt out via
//    `bodyPadded={false}` and use the WidgetTableContainer primitive in
//    widgets/_table.tsx for inset rows.
//  - Body padding still scales with `density` so a "compact" table widget
//    gets a tighter feel; the HEADER height stays fixed (36px) to match web
//    and keep all widget headers visually aligned in the grid.

import { type ReactNode } from "react";
import { View, Text, Pressable, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { IconChevronRight } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import type { Density } from "../widgets/_shared";

export interface WidgetCardProps {
  title?: ReactNode;
  icon?: ReactNode;
  /** Push to this route when the user taps "Ver todos". */
  viewAllHref?: string;
  /** Optional right-side header content (e.g., refresh button, day picker). */
  headerExtra?: ReactNode;
  /** Optional content pinned directly below the card header, OUTSIDE the
   *  scrollable body — so it stays flush under the header and does not scroll
   *  with the rows. Table widgets pass their search box + column-header row
   *  here so the column headers behave like web's sticky header. Rendered with
   *  the same 12px horizontal inset as the body, so edge-to-edge children
   *  (negative-margin header strips) line up. */
  fixedHeader?: ReactNode;
  /** Optional content shown to the right of the centered "Ver todos" link. */
  footerExtra?: ReactNode;
  /** Optional integer shown as a muted pill in the header. */
  count?: number | null;
  /** Hide the header entirely. */
  showHeader?: boolean;
  /** Hide the footer entirely. */
  showFooter?: boolean;
  /** Border accent color (hex). When set, this also drives the top stripe
   *  (mirrors web's `accentColor` + `accentShade` combined behaviour). */
  borderColor?: string;
  /** Explicit accent color for the top 6px stripe. Falls back to
   *  `borderColor` for backwards compatibility — most callers only need to
   *  set one of the two. */
  accentColor?: string;
  /** Pad the body wrapper. Tables set this false and manage their own padding
   *  so dividers/press-state fill the full row width. Default true. */
  bodyPadded?: boolean;
  /** Per-widget density — scales body padding. Default "comfortable".
   *  Header height is fixed at 36px to match web and keep all widget
   *  headers visually aligned in the grid. */
  density?: Density;
  /** When set, the body is wrapped in a ScrollView capped at this height
   *  so children (e.g. table rows) scroll internally and the footer stays
   *  visible. Compute as `WIDGET_ROW_MAX_HEIGHT[rows] - HEADER_H - FOOTER_H`
   *  on the consumer side. */
  bodyMaxHeight?: number;
  /** Hide the bottom horizontal padding inside the scrollable body — useful
   *  for table widgets that already pad rows themselves. */
  scrollPaddingBottom?: number;
  /** When true, the body wrapper renders `children` directly without an
   *  inner ScrollView. Use this when the widget owns its own FlatList /
   *  DraggableFlatList — same-orientation nested scrolls don't compose on
   *  RN, and inner scrollers fight the parent for gestures. The widget is
   *  responsible for its own RefreshControl in this mode. */
  bodyAsList?: boolean;
  /** Optional pull-to-refresh handler for the inner ScrollView (only used
   *  when `bodyAsList === false` AND `bodyMaxHeight != null`). Pass the
   *  hook's `refetch` directly. */
  onRefresh?: () => Promise<unknown> | void;
  /** Pair with `onRefresh` — drive the spinner from the hook's `isFetching`
   *  / `isRefetching` flag. */
  refreshing?: boolean;
  children: ReactNode;
}

// Fixed header height matching web's `h-9` (= 2.25rem = 36px). All widget
// headers align across the grid regardless of density.
const HEADER_HEIGHT = 36;
// Fixed footer height matching web's `h-7` (= 1.75rem = 28px).
const FOOTER_HEIGHT = 28;
// Card border radius matching web's `rounded-lg` (= 0.5rem = 8px).
const CARD_RADIUS = 8;
// Top accent stripe height matching web's `h-1.5` (= 0.375rem = 6px).
// Per CRITICAL FACTS: must remain at 6px — drives widget identity in the grid.
const ACCENT_STRIPE_HEIGHT = 6;
// Horizontal padding matching web's `px-3` (= 0.75rem = 12px).
const HEADER_PADDING_X = 12;
// Icon block size — matches web's icon visual weight: a 24×24 tinted
// square tile that frames the 16px Tabler icon. The block makes every
// widget's icon land at the same visual size regardless of glyph density,
// fixing the "icons look inconsistent" complaint.
const ICON_BLOCK_SIZE = 24;
const ICON_BLOCK_RADIUS = 6;

function bodyPaddingFor(d: Density): { x: number; y: number } {
  if (d === "compact") return { x: 10, y: 6 };
  if (d === "spacious") return { x: 14, y: 12 };
  return { x: 12, y: 8 };
}

// Append an alpha byte to a 6-digit hex. Local copy (this file is intended
// to stay decoupled from widget-accent.ts so widget-card stays import-light).
function withAlphaHex(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return hex;
  const base = hex.slice(0, 7);
  const clamped = Math.max(0, Math.min(1, alpha));
  const byte = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");
  return `${base}${byte}`;
}

export function WidgetCard({
  title,
  icon,
  viewAllHref,
  headerExtra,
  fixedHeader,
  footerExtra,
  count,
  showHeader = true,
  showFooter = true,
  borderColor,
  accentColor,
  bodyPadded = true,
  density = "comfortable",
  bodyMaxHeight,
  scrollPaddingBottom,
  bodyAsList = false,
  onRefresh,
  refreshing,
  children,
}: WidgetCardProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const renderHeader =
    showHeader && (title || icon || headerExtra || count != null);
  const renderFooter = showFooter && (viewAllHref || footerExtra);
  const bodyPad = bodyPaddingFor(density);

  // Mirror web's accent treatment: a thin 6px coloured stripe flush at the
  // top of the card when an accent is configured. The accent also drives
  // the card's border colour to anchor the visual identity (web uses
  // `resolveAccentClasses().cardBorder`). Falls back to `borderColor` so
  // legacy callers keep working without migration.
  const stripeColor = accentColor ?? borderColor;
  const hasAccent = !!stripeColor;
  // Web's header/footer use `bg-muted/30` — a transparent overlay on top of
  // the card. Approximate that on RN with a fixed alpha derived from the
  // theme's muted token.
  const subtleMutedBg = isDark
    ? "rgba(255,255,255,0.05)"
    : "rgba(0,0,0,0.03)";
  // Web's count pill uses `bg-muted/70`. Approximate with a slightly
  // stronger alpha so the pill reads against the muted header strip.
  const pillBg = isDark
    ? "rgba(255,255,255,0.10)"
    : "rgba(0,0,0,0.07)";
  // Subtle pill border so the pill has shape definition against the muted
  // header strip — matches web's perceived weight from `bg-muted/70`.
  const pillBorder = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(0,0,0,0.05)";
  // Icon block tint — when the widget supplies an accent we tint the icon
  // tile with a soft alpha of that accent so the icon reads as part of the
  // widget's visual identity. Without an accent we fall back to a neutral
  // muted tile that still gives the icon a proper "block" shape (vs the
  // floating bare-glyph look that read as "incomplete" before).
  const iconBlockBg = hasAccent
    ? withAlphaHex(stripeColor, isDark ? 0.18 : 0.12)
    : isDark
      ? "rgba(255,255,255,0.06)"
      : "rgba(0,0,0,0.04)";
  // Footer link colour matches web exactly — `text-muted-foreground` (no
  // accent tint). Per spec §2.3 the footer "Ver todos" link must read as
  // a quiet supporting affordance, not a coloured CTA. Web confirms:
  // `text-[11px] font-medium text-muted-foreground hover:text-primary`.
  const footerLinkColor = colors.mutedForeground;

  // Tiered shadow — light mode gets a soft drop shadow for elevation off the
  // page background; dark mode relies on the slightly-elevated card surface
  // (the `colors.card` token is already lighter than `colors.background` in
  // dark themes) plus a barely-visible shadow. Web uses `shadow-sm`; we
  // mirror that behaviour with platform-appropriate values.
  const cardShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 2,
        elevation: 1,
      }
    : {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
      };

  return (
    <View
      style={{
        // Mirror web's `h-full w-full flex flex-col min-h-0` — the card
        // fills its parent slot (the WidgetTile) and lays out its sections
        // top-to-bottom so the body can flex into the remaining space.
        // For this to work, the WidgetTile MUST pass a fixed-height
        // parent (height: maxHeight on the wrapper); see widget-tile.tsx.
        flex: 1,
        minHeight: 0,
        flexDirection: "column",
        backgroundColor: colors.card,
        borderRadius: CARD_RADIUS,
        // 1px default border, but when an accent is configured we bump to
        // 1.5px so the coloured outline reads clearly on phone DPI — a
        // 1px coloured border is visually indistinguishable from the
        // neutral `colors.border` in dark mode at typical phone DPI.
        borderWidth: hasAccent ? 1.5 : 1,
        // Border colour respects the accent when supplied so the card's
        // identity reads from the *outline* even before the user sees the
        // top stripe. Without an accent we use the neutral `colors.border`.
        borderColor: hasAccent ? stripeColor : colors.border,
        overflow: "hidden",
        ...cardShadow,
      }}
    >
      {hasAccent && (
        <View
          style={{
            // Top accent stripe — every widget that supplies an accent gets
            // a 6px coloured bar flush at the top of the card. This is the
            // primary visual identity for widgets in the grid (per spec
            // §1.5 — ACCENT_STRIPE_HEIGHT must remain at 6px). Mobile
            // intentionally uses a solid colour rather than a gradient so
            // the accent reads cleanly on either light or dark surfaces.
            height: ACCENT_STRIPE_HEIGHT,
            width: "100%",
            backgroundColor: stripeColor,
          }}
        />
      )}
      {renderHeader && (
        <View
          style={{
            height: HEADER_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingHorizontal: HEADER_PADDING_X,
            backgroundColor: subtleMutedBg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flex: 1,
              minWidth: 0,
            }}
          >
            {icon && (
              <View
                style={{
                  width: ICON_BLOCK_SIZE,
                  height: ICON_BLOCK_SIZE,
                  borderRadius: ICON_BLOCK_RADIUS,
                  backgroundColor: iconBlockBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {icon}
              </View>
            )}
            {typeof title === "string" ? (
              <Text
                numberOfLines={1}
                style={{
                  // text-sm = 14px, font-semibold = 600. Per spec §2.3:
                  // header title color is `colors.foreground` — was
                  // `secondaryForeground` previously, but those resolve to
                  // the same hex on this theme and `foreground` is the
                  // canonical spec token (and clearer reads on accent
                  // header bg variants).
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.foreground,
                  flexShrink: 1,
                  // Subtle letter-spacing tightens the heading so it reads
                  // as a proper section title at 14px, not body copy.
                  letterSpacing: -0.1,
                }}
              >
                {title}
              </Text>
            ) : (
              title
            )}
            {count != null && (
              <View
                style={{
                  // Mirrors web's count pill:
                  // `rounded-md bg-muted/70 px-1.5 py-0.5`. Per spec §2.3
                  // the count pill bg is `colors.muted` — using the alpha
                  // composite (pillBg) approximates web's `bg-muted/70`
                  // overlay against the muted header strip; the semantic
                  // token alone reads too flat on the muted header bg.
                  backgroundColor: pillBg,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: pillBorder,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  minWidth: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: colors.mutedForeground,
                    fontVariant: ["tabular-nums"],
                    lineHeight: 14,
                  }}
                >
                  {count}
                </Text>
              </View>
            )}
          </View>
          {headerExtra && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {headerExtra}
            </View>
          )}
        </View>
      )}
      {/* FIXED HEADER — pinned directly below the card header, outside the
          scrollable body. Flush against the header (no top gap) and shares the
          body's 12px horizontal inset so negative-margin strips (search box,
          column header) bleed edge-to-edge. Only the rows below this scroll. */}
      {fixedHeader && (
        <View style={{ paddingHorizontal: HEADER_PADDING_X }}>{fixedHeader}</View>
      )}
      {/* BODY — fills remaining vertical space. Three rendering modes:
            1. bodyAsList: widget owns its own scroller (FlatList /
               DraggableFlatList). We render a flex:1 View pass-through so
               nested same-orientation scrollers don't fight for gestures.
            2. bodyMaxHeight: scrollable body capped at a computed height
               so the footer stays visible. Used by table widgets.
            3. default: a flex:1 View that fills the slot.
          The flex:1 + minHeight:0 combo is what makes the body STRETCH
          inside its tile when the slot is taller than the content — the
          missing piece in the previous version that left widgets
          floating at intrinsic height with dead air below. */}
      {bodyAsList ? (
        <View
          style={
            bodyMaxHeight != null
              ? { maxHeight: bodyMaxHeight, flex: 1, minHeight: 0 }
              : { flex: 1, minHeight: 0 }
          }
        >
          {children}
        </View>
      ) : bodyMaxHeight != null ? (
        <View style={{ maxHeight: bodyMaxHeight, flex: 1, minHeight: 0 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              bodyPadded
                ? {
                    paddingHorizontal: bodyPad.x,
                    paddingTop: bodyPad.y,
                    paddingBottom: scrollPaddingBottom ?? bodyPad.y,
                  }
                : { paddingBottom: scrollPaddingBottom ?? 0 }
            }
            // Nested scroll inside the page ScrollView only matters on
            // Android — turn it on so rows can scroll without stealing
            // page swipes.
            nestedScrollEnabled
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={!!refreshing}
                  onRefresh={() => {
                    void onRefresh();
                  }}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        </View>
      ) : (
        <View
          style={
            bodyPadded
              ? {
                  flex: 1,
                  minHeight: 0,
                  paddingHorizontal: bodyPad.x,
                  paddingVertical: bodyPad.y,
                }
              : { flex: 1, minHeight: 0 }
          }
        >
          {children}
        </View>
      )}
      {renderFooter && (
        <View
          style={{
            height: FOOTER_HEIGHT,
            paddingHorizontal: HEADER_PADDING_X,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: subtleMutedBg,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Centered "Ver todos →" link, mirroring web's footer pattern
              (web/src/dashboard/components/widget-card.tsx:107-117). The link
              keeps its text and chevron INLINE — earlier this rendered with
              the chevron wrapping below the text because gap+Pressable didn't
              compose reliably. Workaround: explicit row View inside Pressable
              plus marginLeft on the chevron (no gap). When an accent is
              configured the link adopts the accent hue so the footer reads
              as part of the widget's identity. */}
          {viewAllHref && (
            <Pressable
              onPress={() => router.push(viewAllHref as any)}
              hitSlop={10}
              style={({ pressed }) => ({
                alignSelf: "center",
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 6,
                opacity: pressed ? 0.55 : 1,
                // Subtle press background gives the link a tap target shape
                // without competing with the muted footer strip.
                backgroundColor: pressed
                  ? isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)"
                  : "transparent",
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    // Per spec §2.3: footer "Ver todos" link is 11/500
                    // mutedForeground. Mirrors web's
                    // `text-[11px] font-medium text-muted-foreground`.
                    fontSize: 11,
                    fontWeight: "500",
                    color: footerLinkColor,
                    marginRight: 4,
                  }}
                >
                  Ver todos
                </Text>
                <IconChevronRight size={12} color={footerLinkColor} />
              </View>
            </Pressable>
          )}
          {footerExtra && (
            <View
              style={{
                position: "absolute",
                right: HEADER_PADDING_X,
                top: 0,
                bottom: 0,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              {footerExtra}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
