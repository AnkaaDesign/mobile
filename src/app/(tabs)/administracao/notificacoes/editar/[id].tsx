import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { NotificationForm } from "@/components/administration/notification/form/notification-form";
import { useNotification } from "@/hooks/useNotification";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";

export default function EditNotificationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: notification, isLoading, error } = useNotification(id);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Carregando notificação...
        </Text>
      </View>
    );
  }

  if (error || !notification) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          Erro ao carregar notificação
        </Text>
      </View>
    );
  }

  return <NotificationForm mode="update" notification={notification?.data} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
