import React from "react";
import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme";

export default function ActivitiesLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
      }}
    >
      <Stack.Screen
        name="list"
        options={{
          title: "Movimentações",
        }}
      />
      <Stack.Screen
        name="details/[id]"
        options={{
          title: "Detalhes da Movimentação",
        }}
      />
    </Stack>
  );
}