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

  const styles = StyleSheet.create({
    container: {
      marginVertical: spacing.sm,
      alignItems: "flex-start",
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
