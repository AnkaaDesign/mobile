
import { View } from "react-native";

import { useTheme } from "@/lib/theme";

interface AirbrushingFilterTagsProps {
  filters: Partial<any>;
  searchText: string;
  onClearAll: () => void;
  onRemoveFilter: (key: any) => void;
  onClearSearch: () => void;
}

export function AirbrushingFilterTags({ }: AirbrushingFilterTagsProps) {
  const { spacing} = useTheme();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
      {/* Render filter tags here */}
    </View>
  );
}