import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useNotification } from "@/hooks";
import { routes, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { spacing } from "@/constants/design-system";
import { IconBell } from "@tabler/icons-react-native";

import { NotificationCard, RecipientsCard, DeliveryStatusCard } from "@/components/administration/notification/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useNotification(id as string, {
    include: {
      user: true,
      seenBy: {
        include: {
          user: { include: { position: true } },
        },
      },
    },
    enabled: !!id,
  });

  // Notifications are editable only when not yet sent. The DetailScreen
  // template's editGuard is enum-allowlist-based; for the boolean-style
  // sentAt check we resolve `editRoute` conditionally below.
  const notification = (query.data as any)?.data ?? (query.data as any);
  const canEdit = notification && !notification.sentAt;

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconBell}
      title={(n) => n.title ?? "Notificação"}
      editRoute={canEdit ? (n) => mobileRoute(routes.administration.notifications.edit(n.id)) : undefined}
      notFoundFallback={mobileRoute(routes.administration.notifications.list)}
    >
      {(notification) => (
        <View style={styles.body}>
          <NotificationCard notification={notification} />
          <DeliveryStatusCard notification={notification} />
          <RecipientsCard notification={notification} maxHeight={400} />
          <Card>
            <CardContent>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.NOTIFICATION}
                entityId={notification.id}
                entityName={notification.title}
                entityCreatedAt={notification.createdAt}
                maxHeight={400}
              />
            </CardContent>
          </Card>
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
});
