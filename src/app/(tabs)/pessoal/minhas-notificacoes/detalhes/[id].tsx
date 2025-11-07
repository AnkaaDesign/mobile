import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconArrowLeft, IconTrash, IconBellOff, IconBell } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotification, useNotificationMutations, useAuth } from "@/hooks";
import { ThemedView, ThemedText, ErrorScreen, Card } from "@/components/ui";
import { NotificationCard } from "@/components/personal/notification/detail/notification-card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { seenNotificationService } from "@/api-client/notification";

export default function MyNotificationDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notification data
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useNotification(id || "", {
    include: {
      user: true,
      seenBy: true,
    },
    enabled: !!id && id !== "",
  });

  const notification = response?.data;

  const { delete: deleteNotification } = useNotificationMutations();

  // Mark as read when opening
  useEffect(() => {
    if (notification && user?.id) {
      const isUnread = !notification.seenBy?.some((s) => s.userId === user.id);
      if (isUnread) {
        seenNotificationService.createSeenNotification({
          notificationId: notification.id,
          userId: user.id,
        }).catch(console.error);
      }
    }
  }, [notification?.id, user?.id]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleDelete = useCallback(async () => {
    if (!notification) return;

    Alert.alert("Confirmar exclusão", `Tem certeza que deseja excluir a notificação "${notification.title}"?`, [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteNotification(notification.id);
            router.back();
          } catch (err) {
            console.error("Failed to delete notification:", err);
            Alert.alert("Erro", "Não foi possível excluir a notificação");
          }
        },
      },
    ]);
  }, [notification, deleteNotification, router]);

  const handleToggleRead = useCallback(async () => {
    if (!notification || !user?.id) return;

    const isRead = notification.seenBy?.some((s) => s.userId === user.id);

    try {
      if (isRead) {
        // Mark as unread by deleting the seen record
        const seenRecord = notification.seenBy?.find((s) => s.userId === user.id);
        if (seenRecord) {
          await seenNotificationService.deleteSeenNotification(seenRecord.id);
        }
      } else {
        // Mark as read
        await seenNotificationService.createSeenNotification({
          notificationId: notification.id,
          userId: user.id,
        });
      }
      await refetch();
    } catch (err) {
      console.error("Failed to toggle read status:", err);
      Alert.alert("Erro", "Não foi possível atualizar o status da notificação");
    }
  }, [notification, user?.id, refetch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !notification) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ErrorScreen message="Erro ao carregar notificação" detail={error?.message || "Notificação não encontrada"} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const isRead = notification.seenBy?.some((s) => s.userId === user?.id);

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <IconArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>

        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          Notificação
        </ThemedText>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleRead} style={styles.headerButton}>
            {isRead ? <IconBellOff size={24} color={colors.foreground} /> : <IconBell size={24} color={colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <IconTrash size={24} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
      >
        <NotificationCard notification={notification} />

        {/* Read Status Info */}
        {notification.seenBy && notification.seenBy.length > 0 && (
          <Card style={styles.card}>
            <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={styles.cardTitle}>Status de Leitura</ThemedText>
            </View>
            <View style={styles.cardContent}>
              {notification.seenBy.map((seen) => (
                <View key={seen.id} style={[styles.seenRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.seenInfo}>
                    <ThemedText style={styles.seenName}>{seen.user?.name || "Usuário"}</ThemedText>
                    <ThemedText style={[styles.seenDate, { color: colors.mutedForeground }]}>
                      Lida em {new Date(seen.seenAt).toLocaleString("pt-BR")}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
    marginHorizontal: spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    padding: 0,
    overflow: "hidden",
  },
  cardHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  cardContent: {
    padding: spacing.md,
  },
  seenRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  seenInfo: {
    gap: spacing.xs,
  },
  seenName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  seenDate: {
    fontSize: fontSize.sm,
  },
});
