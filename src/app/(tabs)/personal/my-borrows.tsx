import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme";

export default function MyBorrowsLayout() {
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
          title: "Meus Empréstimos",
        }}
      />
    </Stack>
  );
}
