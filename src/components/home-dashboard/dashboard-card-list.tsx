import type { ReactNode } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";

// Fixed height for ~7 data rows + 1 header row (header ~26px + 7 rows ~36px each = ~278px)
const TABLE_HEIGHT = 278;

interface DashboardCardListProps {
  title: string;
  icon: ReactNode;
  viewAllLink?: string;
  emptyMessage: string;
  children?: ReactNode;
  isEmpty?: boolean;
  footer?: ReactNode;
}

export function DashboardCardList({
  title,
  icon,
  viewAllLink,
  emptyMessage,
  children,
  isEmpty,
  footer,
}: DashboardCardListProps) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={{ gap: 6 }}>
      {/* Section header — outside the card */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {icon}
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>{title}</Text>
        </View>
        {viewAllLink && (
          <Pressable onPress={() => router.push(viewAllLink as any)}>
            <Text style={{ fontSize: 11, color: colors.primary }}>Ver todos</Text>
          </Pressable>
        )}
      </View>
      {/* Card body */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        <ScrollView style={{ height: TABLE_HEIGHT }} nestedScrollEnabled>
          {isEmpty ? (
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 13,
                paddingVertical: 20,
                textAlign: "center",
              }}
            >
              {emptyMessage}
            </Text>
          ) : (
            children
          )}
        </ScrollView>
        {footer}
      </View>
    </View>
  );
}
