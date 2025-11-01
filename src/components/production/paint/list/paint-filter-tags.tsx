
import { View } from "react-native";

import { useTheme } from "@/lib/theme";

interface PaintFilterTagsProps {
  filters: any;
  onRemove: (key: string) => void;
}

export function PaintFilterTags({ }: PaintFilterTagsProps) {
  const { spacing} = useTheme();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
      {/* Render filter tags here */}
    </View>
  );
}