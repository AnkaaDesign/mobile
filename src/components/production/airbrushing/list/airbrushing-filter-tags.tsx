import React from "react";
import { View, Pressable } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

interface AirbrushingFilterTagsProps {
  filters: Partial<any>;
  searchText: string;
  onClearAll: () => void;
  onRemoveFilter: (key: any) => void;
  onClearSearch: () => void;
}

export function AirbrushingFilterTags({ filters, searchText, onClearAll, onRemoveFilter, onClearSearch }: AirbrushingFilterTagsProps) {
  const { spacing, colors } = useTheme();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
      {/* Render filter tags here */}
    </View>
  );
}