import {
  IconBell,
  IconChevronLeft,
  IconMenu2,
} from "@tabler/icons-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "./slot-context";

/**
 * Fake header — matches the real app chrome:
 *   - LEFT side: optional back arrow (only on detail/sub routes)
 *   - CENTER: title
 *   - RIGHT side: bell + hamburger (in that order, left → right)
 *
 * Background: card color, 1px border-bottom in the border color.
 */
interface Props {
  title: string;
  showBack: boolean;
  onBack: () => void;
  onOpenDrawer: () => void;
  onOpenNotifications: () => void;
}

export function FakeHeader({
  title,
  showBack,
  onBack,
  onOpenDrawer,
  onOpenNotifications,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const slot = useSlotContext();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  side: {
    minWidth: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  bellBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 3,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
});
