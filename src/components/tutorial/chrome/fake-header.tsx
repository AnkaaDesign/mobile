import {
  IconBell,
  IconChevronLeft,
  IconMenu2,
} from "@tabler/icons-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  borderRadius,
  fontSize,
  fontWeight,
  spacing,
} from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "./slot-context";

/**
 * Fake header — pixel-matches the real React Navigation header configured in
 * `src/navigation/privilege-optimized-full-fixed.tsx`:
 *   - LEFT side: optional back arrow (only on detail/sub routes)
 *   - CENTER: title (centered — `headerTitleAlign: "center"`), 18px / 600
 *   - RIGHT side: bell + hamburger (in that order, left → right)
 *
 * The real header background is `colors.card` (#fafafa / #262626) and the
 * border-bottom uses a DEDICATED header border tone (#e3e3e3 / #3a3a3a) at a
 * full 1px width — not `colors.border` and not hairline. The 56px bar sits
 * below the top safe-area inset, so the total chrome height = insets.top + 56.
 */
interface Props {
  title: string;
  showBack: boolean;
  onBack: () => void;
  onOpenDrawer: () => void;
  onOpenNotifications: () => void;
}

// Header bar height beneath the safe-area inset (matches the native default).
const HEADER_BAR_HEIGHT = 56;

export function FakeHeader({
  title,
  showBack,
  onBack,
  onOpenDrawer,
  onOpenNotifications,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const slot = useSlotContext();

  // Dedicated header border tone from the real navigator's `headerStyle`.
  const headerBorder = isDark ? "#3a3a3a" : "#e3e3e3";

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          backgroundColor: colors.card,
          borderBottomColor: headerBorder,
        },
      ]}
    >
      <View style={styles.bar}>
        {/* Left: back button (or empty spacer) */}
        <View style={styles.side}>
          {showBack ? (
            <Pressable
              ref={slot.registerRef("chromeHeaderBack") as any}
              onLayout={slot.register("chromeHeaderBack")}
              onPress={onBack}
              hitSlop={8}
              style={styles.iconBtn}
            >
              <IconChevronLeft size={24} color={colors.text} />
            </Pressable>
          ) : null}
        </View>

        {/* Center: title */}
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>

        {/* Right: bell + hamburger (in that order — bell on left, menu on far right) */}
        <View style={styles.side}>
          <View style={styles.rightIcons}>
            <Pressable
              ref={slot.registerRef("chromeNotificationsBell") as any}
              onLayout={slot.register("chromeNotificationsBell")}
              onPress={onOpenNotifications}
              hitSlop={8}
              style={styles.iconBtn}
            >
              <IconBell size={22} color={colors.text} />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>3</Text>
              </View>
            </Pressable>
            <Pressable
              ref={slot.registerRef("chromeDrawerToggle") as any}
              onLayout={slot.register("chromeDrawerToggle")}
              onPress={onOpenDrawer}
              hitSlop={8}
              style={styles.iconBtn}
            >
              <IconMenu2 size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    // Real navigator uses a solid 1px border-bottom (not hairline) and no shadow.
    borderBottomWidth: 1,
  },
  bar: {
    height: HEADER_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  side: {
    minWidth: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm, // real headerRight uses gap:8 between bell and menu
    marginLeft: "auto",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg, // 18 — matches headerTitleStyle.fontSize
    fontWeight: fontWeight.semibold, // "600" — matches headerTitleStyle.fontWeight
    textAlign: "center",
  },
  bellBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 3,
    backgroundColor: "#dc2626", // real notificationBadge background
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: fontWeight.bold,
    lineHeight: 11,
  },
});
