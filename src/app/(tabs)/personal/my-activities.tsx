import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme";

export default function MyActivitiesLayout() {
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
          title: "Minhas Movimentações",
        }}
      />
    </Stack>
  );
}
