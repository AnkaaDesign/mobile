// Shared chrome for mobile dashboard widgets — gives every tile the same
// visual language: bordered card + fixed-height header strip + optional
// footer link. Mobile equivalent of web/src/dashboard/components/widget-card.tsx.
//
// Differences from web:
//   - No CSS overflow:auto; the body just lays out vertically and lets the
//     parent ScrollView handle scrolling.
//   - viewAllHref is an expo-router path; uses router.push instead of <Link>.
//   - borderColor mirrors the web borderColor prop but maps the named tokens
//     to literal hex colors using theme tokens (primary), or skips when none.

import { type ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconChevronRight } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

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
  children: ReactNode;
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
  children,
}: WidgetCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const renderHeader =
    showHeader && (title || icon || headerExtra || count != null);
  const renderFooter = showFooter && (viewAllHref || footerExtra);

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
            paddingHorizontal: 12,
            paddingVertical: 8,
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
                  fontSize: 14,
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
                  backgroundColor: colors.muted,
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
      <View>{children}</View>
      {renderFooter && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12,
            height: 32,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.muted,
            position: "relative",
          }}
        >
          {viewAllHref && (
            <Pressable
              onPress={() => router.push(viewAllHref as any)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "500",
                  color: colors.mutedForeground,
                }}
              >
                Ver todos
              </Text>
              <IconChevronRight size={12} color={colors.mutedForeground} />
            </Pressable>
          )}
          {footerExtra && (
            <View
              style={{
                position: "absolute",
                right: 12,
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
