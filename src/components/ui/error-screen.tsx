import { View, Text } from "react-native";
import { IconAlertCircle } from "@tabler/icons-react-native";
import { Button } from "./button";
import { useTheme } from "@/contexts/theme-context";

interface ErrorScreenProps {
  error?: any;
  title?: string;
  message?: string;
  detail?: string;
  onRetry?: () => void;
}

export function ErrorScreen({ error, title, message, detail, onRetry }: ErrorScreenProps) {
  const { colors } = useTheme();
  const errorMessage = detail || error?.message || message || "Ocorreu um erro inesperado";
  const errorTitle = title || "Ops! Algo deu errado";

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        backgroundColor: colors.background,
      }}
    >
      <IconAlertCircle size={64} color={colors.destructive} />
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: colors.foreground,
          marginTop: 16,
          textAlign: "center",
        }}
      >
        {errorTitle}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.mutedForeground,
          marginTop: 8,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        {errorMessage}
      </Text>
      {onRetry && (
        <View style={{ marginTop: 24 }}>
          <Button onPress={onRetry}>Tentar Novamente</Button>
        </View>
      )}
    </View>
  );
}
