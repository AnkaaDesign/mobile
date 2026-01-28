import React from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "@/components/ui/button";
import { spacing } from "@/constants/design-system";
import type { ButtonBlock } from "./types";

interface ButtonBlockProps {
  block: ButtonBlock;
  onButtonPress?: (action: string, url?: string) => void;
}

/**
 * Renders interactive button blocks
 */
export function ButtonBlockComponent({ block, onButtonPress }: ButtonBlockProps) {
  const handlePress = () => {
    if (onButtonPress && block.action) {
      onButtonPress(block.action, block.url);
    }
  };

  const getAlignmentStyle = () => {
    switch (block.alignment) {
      case "left":
        return "flex-start" as const;
      case "right":
        return "flex-end" as const;
      case "center":
        return "center" as const;
      default:
        return "flex-start" as const;
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: spacing.sm,
      alignItems: getAlignmentStyle(),
    },
  });

  return (
    <View style={styles.container}>
      <Button
        variant={block.variant || "default"}
        onPress={handlePress}
        disabled={!block.action && !onButtonPress}
      >
        {block.text}
      </Button>
    </View>
  );
}
