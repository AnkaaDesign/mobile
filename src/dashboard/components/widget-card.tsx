// Shared chrome for mobile dashboard widgets — gives every tile the same
// visual language: bordered card + fixed-height header strip + optional
// footer link.
//
// Padding model:
//  - The body wrapper has `paddingHorizontal:12 paddingVertical:8` by
//    default. Most widgets render text/forms and want that breathing room.
//  - Data tables render a list of edge-to-edge press rows and need to manage
//    their own padding (so press feedback fills the row width). They opt out
//    via `bodyPadded={false}` and use the WidgetTableContainer primitive in
//    widgets/_table.tsx for inset rows.
//  - Header padding scales with `density` so a "compact" table widget gets
//    a tighter header to match its row spacing.

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
  /** Optional content shown to the right of the centered "Ver todos" link. */
  footerExtra?: ReactNode;
  /** Optional integer shown as a muted pill in the header. */
  count?: number | null;
  /** Hide the header entirely. */
  showHeader?: boolean;
  /** Hide the footer entirely. */
  showFooter?: boolean;
  /** Optional border accent color (hex). */
  borderColor?: string;
  /** Pad the body wrapper. Tables set this false and manage their own padding
   *  so dividers/press-state fill the full row width. Default true. */
  bodyPadded?: boolean;
  /** Per-widget density — scales header padding/font sizes. Default "comfortable". */
  density?: Density;
  /** When set, the body is wrapped in a ScrollView capped at this height
   *  so children (e.g. table rows) scroll internally and the footer stays
   *  visible. Without this, a body taller than the available space (the
   *  WidgetTile's `maxHeight`) pushes the footer below the clip — which is
   *  why the "Ver todos" link only appeared on widgets with little
   *  content. Compute as `WIDGET_ROW_MAX_HEIGHT[rows] - HEADER_H - FOOTER_H`
   *  on the consumer side. */
  bodyMaxHeight?: number;
  /** Hide the bottom horizontal padding inside the scrollable body — useful
   *  for table widgets that already pad rows themselves. */
  scrollPaddingBottom?: number;
  /** When true, the body wrapper renders `children` directly without an
   *  inner ScrollView. Use this when the widget owns its own FlatList /
   *  DraggableFlatList — same-orientation nested scrolls don't compose on
   *  RN, and inner scrollers fight the parent for gestures (the bug behind
   *  the original installment-table chip-scroll regression). The widget is
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

function headerPaddingFor(d: Density): { x: number; y: number; titleSize: number } {
  if (d === "compact") return { x: 10, y: 6, titleSize: 13 };
  if (d === "spacious") return { x: 14, y: 10, titleSize: 15 };
  return { x: 12, y: 8, titleSize: 14 };
}

function bodyPaddingFor(d: Density): { x: number; y: number } {
  if (d === "compact") return { x: 10, y: 6 };
  if (d === "spacious") return { x: 14, y: 12 };
  return { x: 12, y: 8 };
}

export function WidgetCard({
  title,
  icon,
  viewAllHref,
  headerExtra,
  footerExtra,
  count,
  showHeader = true,
  showFooter = true,
  borderColor,
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
  const headerPad = headerPaddingFor(density);
  const bodyPad = bodyPaddingFor(density);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: borderColor ?? colors.border,
        overflow: "hidden",
        // subtle elevation matching web's `shadow-sm`
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      {renderHeader && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingHorizontal: headerPad.x,
            paddingVertical: headerPad.y,
            backgroundColor: colors.muted,
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
            {icon}
            {typeof title === "string" ? (
              <Text
                numberOfLines={1}
                style={{
                  fontSize: headerPad.titleSize,
                  fontWeight: "600",
                  color: colors.foreground,
                  flexShrink: 1,
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
                  // Match web's `bg-muted/70` count pill — solid muted fill
                  // (rgba) instead of card+border. The bordered version read
                  // as anemic against the muted header strip.
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(0,0,0,0.07)",
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "500",
                    color: colors.mutedForeground,
                    fontVariant: ["tabular-nums"],
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
      {bodyAsList ? (
        // The widget owns its own scroller (FlatList/DraggableFlatList).
        // We must NOT wrap in a ScrollView — same-orientation nested
        // scrolls don't compose on RN. The widget is responsible for
        // its own RefreshControl in this mode.
        <View
          style={
            bodyMaxHeight != null
              ? { maxHeight: bodyMaxHeight, flexShrink: 1 }
              : { flexShrink: 1 }
          }
        >
          {children}
        </View>
      ) : bodyMaxHeight != null ? (
        <View style={{ maxHeight: bodyMaxHeight }}>
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
              ? { paddingHorizontal: bodyPad.x, paddingVertical: bodyPad.y }
              : undefined
          }
        >
          {children}
        </View>
      )}
      {renderFooter && (
        <View
          style={{
            height: 28,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.muted,
            justifyContent: "center",
          }}
        >
          {/* Centered "Ver todos →" link, mirroring web's footer pattern
              (web/src/dashboard/components/widget-card.tsx:76-93). The link
              must keep its text and chevron INLINE — earlier this rendered
              with the chevron wrapping below the text because gap+Pressable
              didn't compose reliably. Workaround: explicit row View inside
              Pressable plus marginLeft on the chevron (no gap). */}
          {viewAllHref && (
            <Pressable
              onPress={() => router.push(viewAllHref as any)}
              hitSlop={10}
              style={({ pressed }) => ({
                alignSelf: "center",
                paddingVertical: 4,
                paddingHorizontal: 8,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "500",
                    color: colors.mutedForeground,
                    marginRight: 4,
                  }}
                >
                  Ver todos
                </Text>
                <IconChevronRight size={12} color={colors.mutedForeground} />
              </View>
            </Pressable>
          )}
          {footerExtra && (
            <View
              style={{
                position: "absolute",
                right: 12,
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
