import { View, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { NotificationForm } from "@/components/administration/notification/form/notification-form";
import { useNotification } from "@/hooks/useNotification";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { Skeleton } from "@/components/ui/skeleton";
import { spacing, borderRadius } from "@/constants/design-system";

export default function EditNotificationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: notification, isLoading, error } = useNotification(id);

  useScreenReady(!isLoading);

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={{ marginBottom: spacing.md }}>
                <Skeleton width="30%" height={14} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="100%" height={i === 2 ? 100 : 44} borderRadius={8} />
              </View>
            ))}
          </View>
          <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="45%" height={18} style={{ marginBottom: spacing.md }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={{ marginBottom: spacing.md }}>
                <Skeleton width="30%" height={14} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="100%" height={44} borderRadius={8} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  errorText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
