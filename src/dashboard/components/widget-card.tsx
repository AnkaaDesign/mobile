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
import { View, Text, Pressable } from "react-native";
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
  children,
}: WidgetCardProps) {
  const { colors } = useTheme();
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
        borderRadius: 12,
        borderWidth: 1,
        borderColor: borderColor ?? colors.border,
        overflow: "hidden",
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
                  backgroundColor: colors.card,
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "500",
                    color: colors.mutedForeground,
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
      <View
        style={
          bodyPadded
            ? { paddingHorizontal: bodyPad.x, paddingVertical: bodyPad.y }
            : undefined
        }
      >
        {children}
      </View>
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
