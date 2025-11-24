import * as React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
  Dimensions,
  Platform,
  BackHandler
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, spacing, fontSize, fontWeight, transitions } from "@/constants/design-system";
import { Icon } from "./icon";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MENU_WIDTH = 200;
const ITEM_HEIGHT = 40;

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface ContextMenuPopoverProps {
  visible: boolean;
  onClose: () => void;
  items: ContextMenuItem[];
  position: { x: number; y: number };
}

export const ContextMenuPopover: React.FC<ContextMenuPopoverProps> = ({
  visible,
  onClose,
  items,
  position,
}) => {
  const { colors, isDark } = useTheme();

  // Handle Android back button
  React.useEffect(() => {
    if (Platform.OS === "android" && visible) {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        onClose();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [visible, onClose]);

  const handleItemPress = React.useCallback(
    (item: ContextMenuItem) => {
      if (item.disabled) return;
      onClose();
      setTimeout(() => {
        item.onPress();
      }, 100);
    },
    [onClose]
  );

  // Calculate position to keep menu on screen
  const menuHeight = items.length * ITEM_HEIGHT + spacing.sm * 2;

  let adjustedX = position.x;
  let adjustedY = position.y;

  // Adjust X if menu would overflow right edge
  if (adjustedX + MENU_WIDTH > SCREEN_WIDTH - spacing.md) {
    adjustedX = SCREEN_WIDTH - MENU_WIDTH - spacing.md;
  }
  // Adjust X if menu would overflow left edge
  if (adjustedX < spacing.md) {
    adjustedX = spacing.md;
  }

  // Adjust Y if menu would overflow bottom edge
  if (adjustedY + menuHeight > SCREEN_HEIGHT - spacing.xl) {
    adjustedY = position.y - menuHeight - spacing.sm;
  }
  // Ensure Y is not negative
  if (adjustedY < spacing.xl) {
    adjustedY = spacing.xl;
  }

  const menuStyle: ViewStyle = {
    position: "absolute",
    left: adjustedX,
    top: adjustedY,
    width: MENU_WIDTH,
    backgroundColor: isDark ? colors.card : "#ffffff",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    paddingVertical: spacing.xs,
    ...shadow.lg,
  };

  const itemStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    height: ITEM_HEIGHT,
  };

  const itemLabelStyle: TextStyle = {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as TextStyle["fontWeight"],
    color: colors.foreground,
    flex: 1,
  };

  const destructiveItemLabelStyle: TextStyle = {
    ...itemLabelStyle,
    color: colors.destructive,
  };

  const disabledItemLabelStyle: TextStyle = {
    ...itemLabelStyle,
    color: colors.mutedForeground,
    opacity: 0.5,
  };

  const separatorStyle: ViewStyle = {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xxs,
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={StyleSheet.absoluteFill}
          entering={FadeIn.duration(transitions.fast)}
          exiting={FadeOut.duration(transitions.fast)}
        >
          {/* Menu */}
          <Animated.View
            style={menuStyle}
            entering={FadeIn.duration(transitions.fast)}
            exiting={FadeOut.duration(transitions.fast)}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {items.map((item, index) => {
                const showSeparator = item.destructive && index > 0;

                return (
                  <React.Fragment key={item.id}>
                    {showSeparator && <View style={separatorStyle} />}
                    <Pressable
                      onPress={() => handleItemPress(item)}
                      disabled={item.disabled}
                      android_ripple={{
                        color: colors.muted,
                        borderless: false,
                      }}
                    >
                      {({ pressed }) => (
                        <View
                          style={[
                            itemStyle,
                            {
                              backgroundColor: pressed && !item.disabled
                                ? colors.muted
                                : "transparent",
                            },
                          ]}
                        >
                          {item.icon && (
                            <Icon
                              name={item.icon}
                              size={18}
                              color={
                                item.disabled
                                  ? colors.mutedForeground
                                  : item.destructive
                                  ? colors.destructive
                                  : colors.foreground
                              }
                            />
                          )}
                          <Text
                            style={[
                              item.disabled
                                ? disabledItemLabelStyle
                                : item.destructive
                                ? destructiveItemLabelStyle
                                : itemLabelStyle,
                              item.icon ? { marginLeft: spacing.sm } : undefined,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </React.Fragment>
                );
              })}
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
