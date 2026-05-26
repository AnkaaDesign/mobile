import { useEffect, useCallback } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useNotification, useNotificationMutations, useAuth } from "@/hooks";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { IconBell } from "@tabler/icons-react-native";
import type { Notification } from "@/types";

import { DetailScreen } from "@/components/screens/detail-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { NotificationCard } from "@/components/personal/notification/detail/notification-card";
import { seenNotificationService } from "@/api-client/notification";

export default function MyNotificationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const nav = useNav();

  const query = useNotification(id || "", {
    include: { user: true, seenBy: true },
    enabled: !!id && id !== "",
  });

  const notification = query.data?.data;
  const { delete: deleteNotification } = useNotificationMutations();

  // Mark as read on open
  useEffect(() => {
    if (notification && currentUser?.id) {
      const isUnread = !notification.seenBy?.some(
        (s) => s.userId === currentUser.id,
      );
      if (isUnread) {
        seenNotificationService
          .createSeenNotification({
            notificationId: notification.id,
            userId: currentUser.id,
            seenAt: new Date(),
          })
          .catch(console.error);
      }
    }
  }, [notification?.id, currentUser?.id]);

  const handleDelete = useCallback(async () => {
    if (!notification) return;

    Alert.alert(
      "Confirmar exclusão",
      `Tem certeza que deseja excluir a notificação "${notification.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteNotification(notification.id);
              nav.goBack();
            } catch {
              // API client interceptor already shows the error toast
            }
          },
        },
      ],
    );
  }, [notification, deleteNotification, nav]);

  const handleToggleRead = useCallback(async () => {
    if (!notification || !currentUser?.id) return;

    const isRead = notification.seenBy?.some(
      (s) => s.userId === currentUser.id,
    );

    try {
      if (isRead) {
        const seenRecord = notification.seenBy?.find(
          (s) => s.userId === currentUser.id,
        );
        if (seenRecord) {
          await seenNotificationService.deleteSeenNotification(seenRecord.id);
        }
      } else {
        await seenNotificationService.createSeenNotification({
          notificationId: notification.id,
          userId: currentUser.id,
          seenAt: new Date(),
        });
      }
      await query.refetch();
    } catch {
      // API client interceptor already shows the error toast
    }
  }, [notification, currentUser?.id, query]);

  const isRead = notification?.seenBy?.some(
    (s) => s.userId === currentUser?.id,
  );

  return (
    <DetailScreen<Notification>
      query={query as any}
      icon={IconBell}
      title={(n) => n.title || "Notificação"}
      // Read-only mirror — actions exposed via overflow menu, no edit page.
      editGuard={{ editable: [] }}
      notFoundFallback={mobileRoute("/pessoal/minhas-notificacoes")}
      actions={[
        {
          key: "toggle-read",
          label: isRead ? "Marcar como não lida" : "Marcar como lida",
          icon: isRead ? "bell-off" : "bell",
          onPress: handleToggleRead,
        },
        {
          key: "delete",
          label: "Excluir",
          icon: "trash",
          variant: "destructive",
          onPress: handleDelete,
        },
      ]}
    >
      {(n) => (
        <View style={styles.body}>
          <NotificationCard notification={n} />

          {/* Read Status Info */}
          {n.seenBy && n.seenBy.length > 0 && (
            <Card style={styles.card}>
              <View
                style={[styles.header, { borderBottomColor: colors.border }]}
              >
                <View style={styles.headerLeft}>
                  <IconBell size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Status de Leitura</ThemedText>
                </View>
              </View>
              <View style={styles.content}>
                {n.seenBy.map((seen) => (
                  <View
                    key={seen.id}
                    style={[styles.seenRow, { borderBottomColor: colors.border }]}
                  >
                    <View style={styles.seenInfo}>
                      <ThemedText style={styles.seenName}>
                        {seen.user?.name || "Usuário"}
                      </ThemedText>
                      <ThemedText
                        style={[styles.seenDate, { color: colors.mutedForeground }]}
                      >
                        Lida em {new Date(seen.seenAt).toLocaleString("pt-BR")}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          )}
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
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
