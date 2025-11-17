import { View, ActivityIndicator, Text } from "react-native";
import { useTheme } from "@/lib/theme";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: colors.mutedForeground,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
