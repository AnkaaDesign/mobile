import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";

export function OrderScheduleListSkeleton() {
  const { spacing } = useTheme();

  return (
    <View style={{ padding: spacing.md }}>
      {[...Array(5)].map((_, i) => (
        <View key={i} style={{ marginBottom: spacing.md }}>
          <Skeleton height={80} borderRadius={8} />
        </View>
      ))}
    </View>
  );
}