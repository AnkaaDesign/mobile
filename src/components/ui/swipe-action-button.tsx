import React from "react";
import { Text, View, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";

export interface SwipeActionButtonProps {
  label: string;
  color: string;
  icon: string;
  onPress: () => void;
  progress: Animated.AnimatedInterpolation<number>;
  dragX: Animated.AnimatedInterpolation<number>;
  position: "left" | "right";
  index: number;
  totalActions: number;
}

const ACTION_WIDTH = 80;

export const SwipeActionButton: React.FC<SwipeActionButtonProps> = ({
  label,
  color,
  icon,
  onPress,
  progress,
  dragX,
  position,
  index,
  totalActions,
}) => {
  const { colors } = useTheme();

  // Calculate translation based on position and index
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: position === "right" ? [ACTION_WIDTH * (totalActions - index), 0] : [-ACTION_WIDTH * (totalActions - index), 0],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <Animated.View
      style={[
        styles.actionButton,
        {
          width: ACTION_WIDTH,
          backgroundColor: color,
          transform: [{ translateX }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity onPress={onPress} style={styles.actionTouchable} activeOpacity={0.7}>
        <View style={styles.actionContent}>
          <Icon name={icon} size={24} color={colors.background} />
          <Text style={[styles.actionText, { color: colors.background }]}>{label}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  actionTouchable: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  actionContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
});
