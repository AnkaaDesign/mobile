import React from "react";
import { View, Pressable } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

interface PaintFilterTagsProps {
  filters: any;
  onRemove: (key: string) => void;
}

export function PaintFilterTags({ filters, onRemove }: PaintFilterTagsProps) {
  const { spacing, colors } = useTheme();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
      {/* Render filter tags here */}
    </View>
  );
}