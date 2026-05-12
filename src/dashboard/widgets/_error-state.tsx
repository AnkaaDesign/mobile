// Shared error state for dashboard widgets — replaces the half-dozen
// `<Text>Erro ao carregar X</Text>` blocks scattered across widget files.
// Adds a Tentar novamente button (with light haptic) so users can recover
// from a transient network failure without restarting the app.

import { View, Text, Pressable } from "react-native";
import { IconAlertTriangle } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { lightImpactHaptic } from "@/utils/haptics";

interface WidgetErrorStateProps {
  /** Optional bold title above the message. Use only when the error needs an
   *  attention-grabbing label (e.g. "Sem conexão" / "Acesso negado"). For
   *  most cases, message alone is enough. */
  title?: string;
  /** Default: "Erro ao carregar dados." Pass a widget-specific message when
   *  the source of the error is meaningful to the user (e.g. "Erro ao
   *  carregar empréstimos."). */
  message?: string;
  /** Show a retry button when provided. The widget hooks `refetch` on tap
   *  and a light impact haptic confirms the press. */
  onRetry?: () => void;
}

export function WidgetErrorState({
  title,
  message = "Erro ao carregar dados.",
  onRetry,
}: WidgetErrorStateProps) {
  const { colors } = useTheme();
  const handleRetry = onRetry
    ? () => {
        lightImpactHaptic();
        onRetry();
      }
    : undefined;

  return (
    <View
      style={{
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: "center",
        gap: 10,
      }}
    >
      <IconAlertTriangle size={20} color={colors.warning} />
      {title && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.foreground,
            textAlign: "center",
          }}
        >
          {title}
        </Text>
      )}
      <Text
        style={{
          fontSize: 12,
          color: colors.mutedForeground,
          textAlign: "center",
          maxWidth: 320,
          lineHeight: 16,
        }}
      >
        {message}
      </Text>
      {handleRetry && (
        <Pressable
          onPress={handleRetry}
          accessibilityLabel="Tentar novamente"
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => ({
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 6,
            backgroundColor: pressed ? colors.muted : colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          })}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colors.foreground,
            }}
          >
            Tentar novamente
          </Text>
        </Pressable>
      )}
    </View>
  );
}
