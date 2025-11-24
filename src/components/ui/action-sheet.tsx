import * as React from "react";
import { BackHandler, Platform, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle, Modal } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, spacing, fontSize, fontWeight, transitions } from "@/constants/design-system";
import { Icon } from "./icon";

export interface ActionSheetItem {
  id: string;
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  items: ActionSheetItem[];
  title?: string;
  message?: string;
  cancelLabel?: string;
  closeOnBackdropPress?: boolean;
}

const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  onClose,
  items,
  title,
  message,
  cancelLabel = "Cancelar",
  closeOnBackdropPress = true,
}) => {
  const { colors } = useTheme();

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
    (item: ActionSheetItem) => {
      if (item.disabled) return;
      onClose();
      // Small delay to allow the sheet to close before executing the action
      setTimeout(() => {
        item.onPress();
      }, 100);
    },
    [onClose]
  );

  const backdropStyle: ViewStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  };

  const containerStyle: ViewStyle = {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.md,
  };

  const sheetStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: "hidden",
    ...shadow.lg,
  };

  const headerStyle: ViewStyle = {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  };

  const titleStyle: TextStyle = {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold as TextStyle["fontWeight"],
    color: colors.foreground,
    textAlign: "center",
    marginBottom: message ? spacing.xs : 0,
  };

  const messageStyle: TextStyle = {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: "center",
  };

  const itemStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    minHeight: 56,
  };

  const itemSeparatorStyle: ViewStyle = {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  };

  const itemLabelStyle: TextStyle = {
    fontSize: fontSize.base,
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

  const cancelButtonStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    ...shadow.lg,
  };

  const cancelLabelStyle: TextStyle = {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold as TextStyle["fontWeight"],
    color: colors.foreground,
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
      <Animated.View
        style={{ ...StyleSheet.absoluteFillObject }}
        entering={FadeIn.duration(transitions.fast)}
        exiting={FadeOut.duration(transitions.fast)}
      >
        {/* Backdrop */}
        <Animated.View
          style={backdropStyle}
          entering={FadeIn.duration(transitions.fast)}
          exiting={FadeOut.duration(transitions.fast)}
        />

        {/* Container */}
        <Pressable
          style={containerStyle}
          onPress={closeOnBackdropPress ? onClose : undefined}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              entering={SlideInDown.duration(transitions.normal)}
              exiting={SlideOutDown.duration(transitions.normal)}
            >
            {/* Action Sheet */}
            <View style={sheetStyle}>
              {/* Header */}
              {(title || message) && (
                <View style={headerStyle}>
                  {title && <Text style={titleStyle}>{title}</Text>}
                  {message && <Text style={messageStyle}>{message}</Text>}
                </View>
              )}

              {/* Items */}
              <View>
                {items.map((item, index) => {
                  const isLast = index === items.length - 1;

                  return (
                    <React.Fragment key={item.id}>
                      <Pressable
                        style={({ pressed }) => [
                          itemStyle,
                          {
                            backgroundColor: pressed && !item.disabled
                              ? colors.muted
                              : "transparent",
                          },
                        ]}
                        onPress={() => handleItemPress(item)}
                        disabled={item.disabled}
                        android_ripple={{
                          color: colors.muted,
                          borderless: false,
                        }}
                      >
                        {item.icon && (
                          <Icon
                            name={item.icon}
                            size={20}
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
                          style={
                            item.disabled
                              ? disabledItemLabelStyle
                              : item.destructive
                              ? destructiveItemLabelStyle
                              : itemLabelStyle
                          }
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                      {!isLast && <View style={itemSeparatorStyle} />}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>

              {/* Cancel Button */}
              <Pressable
                style={({ pressed }) => [
                  cancelButtonStyle,
                  {
                    backgroundColor: pressed ? colors.muted : colors.card,
                  },
                ]}
                onPress={onClose}
                android_ripple={{
                  color: colors.muted,
                  borderless: false,
                }}
              >
                <Text style={cancelLabelStyle}>{cancelLabel}</Text>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

export { ActionSheet };