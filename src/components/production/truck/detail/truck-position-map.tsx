
import { View } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";

interface TruckPositionMapProps {
  // Add props here
}

export function TruckPositionMap(_props: TruckPositionMapProps) {
  const { spacing} = useTheme();

  return (
    <View style={{ padding: spacing.md }}>
      <ThemedText>TruckPositionMap</ThemedText>
      {/* Add component content here */}
    </View>
  );
}