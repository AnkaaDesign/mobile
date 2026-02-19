import { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconArrowLeft, IconTrash, IconBellOff, IconBell } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotification, useNotificationMutations, useAuth, useScreenReady} from '@/hooks';
import { ThemedView, ThemedText, ErrorScreen, Card } from "@/components/ui";
import { NotificationCard } from "@/components/personal/notification/detail/notification-card";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { seenNotificationService } from "@/api-client/notification";


import { Skeleton } from "@/components/ui/skeleton";export default function MyNotificationDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
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

  useScreenReady(!isLoading);

  const notification = response?.data;

  const { delete: deleteNotification } = useNotificationMutations();

  // Mark as read when opening
  useEffect(() => {
    if (notification && currentUser?.id) {
      const isUnread = !notification.seenBy?.some((s) => s.userId === currentUser.id);
      if (isUnread) {
        seenNotificationService.createSeenNotification({
          notificationId: notification.id,
          userId: currentUser.id,
          seenAt: new Date(),
        }).catch(console.error);
      }
    }
  }, [notification?.id, currentUser?.id]);

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
    if (!notification || !currentUser?.id) return;

    const isRead = notification.seenBy?.some((s) => s.userId === currentUser.id);

    try {
      if (isRead) {
        // Mark as unread by deleting the seen record
        const seenRecord = notification.seenBy?.find((s) => s.userId === currentUser.id);
        if (seenRecord) {
          await seenNotificationService.deleteSeenNotification(seenRecord.id);
        }
      } else {
        // Mark as read
        await seenNotificationService.createSeenNotification({
          notificationId: notification.id,
          userId: currentUser.id,
          seenAt: new Date(),
        });
      }
      await refetch();
    } catch (err) {
      console.error("Failed to toggle read status:", err);
      Alert.alert("Erro", "Não foi possível atualizar o status da notificação");
    }
  }, [notification, currentUser?.id, refetch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header skeleton */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Skeleton style={{ width: 32, height: 32, borderRadius: 16 }} />
          <Skeleton style={{ height: 18, width: '40%', borderRadius: 4 }} />
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Skeleton style={{ width: 32, height: 32, borderRadius: 16 }} />
            <Skeleton style={{ width: 32, height: 32, borderRadius: 16 }} />
          </View>
        </View>
        {/* Notification card skeleton */}
        <View style={{ margin: spacing.md, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 12 }}>
          <Skeleton style={{ height: 20, width: '70%', borderRadius: 4 }} />
          <Skeleton style={{ height: 13, width: '40%', borderRadius: 4 }} />
          <View style={{ gap: 8, marginTop: 4 }}>
            <Skeleton style={{ height: 14, width: '95%', borderRadius: 4 }} />
            <Skeleton style={{ height: 14, width: '85%', borderRadius: 4 }} />
            <Skeleton style={{ height: 14, width: '90%', borderRadius: 4 }} />
            <Skeleton style={{ height: 14, width: '60%', borderRadius: 4 }} />
          </View>
        </View>
      </View>
    );
  }

  if (error || !notification) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ErrorScreen message="Erro ao carregar notificação" detail={error?.message || "Notificação não encontrada"} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const isRead = notification.seenBy?.some((s) => s.userId === currentUser?.id);

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
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconBell size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Status de Leitura</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
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
    padding: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
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
