import { View } from "react-native";
import { useTheme } from "@/lib/theme";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeDashboardSkeleton() {
  const { colors } = useTheme();

  const CardSkeleton = () => (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Skeleton height={16} width={16} borderRadius={4} />
        <Skeleton height={14} width={100} borderRadius={4} />
      </View>
      <View style={{ padding: 12, gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton height={12} width={`${60 + i * 10}%`} borderRadius={3} />
              <Skeleton height={10} width={`${40 + i * 5}%`} borderRadius={3} />
            </View>
            <Skeleton height={10} width={50} borderRadius={3} />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ gap: 12 }}>
      <CardSkeleton />
      <CardSkeleton />
    </View>
  );
}
