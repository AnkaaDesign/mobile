import { View, StyleSheet, ScrollView } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { Notification } from "@/types";
import { formatDateTime } from "@/utils";
import { NOTIFICATION_TYPE, NOTIFICATION_IMPORTANCE } from "@/constants";
import {
  IconBell,
  IconCheck,
  IconPackage,
  IconSettings,
} from "@tabler/icons-react-native";

interface NotificationCardProps {
  notification: Notification;
}

const getNotificationTypeLabel = (type: string): string => {
  switch (type) {
    case NOTIFICATION_TYPE.SYSTEM:
      return "Sistema";
    case NOTIFICATION_TYPE.PRODUCTION:
      return "Produção";
    case NOTIFICATION_TYPE.STOCK:
      return "Estoque";
    case NOTIFICATION_TYPE.USER:
      return "Usuário";
    case NOTIFICATION_TYPE.GENERAL:
      return "Geral";
    default:
      return type;
  }
};

const getImportanceBadgeVariant = (importance: string) => {
  switch (importance) {
    case NOTIFICATION_IMPORTANCE.URGENT:
      return "destructive";
    case NOTIFICATION_IMPORTANCE.HIGH:
      return "warning";
    case NOTIFICATION_IMPORTANCE.NORMAL:
      return "default";
    case NOTIFICATION_IMPORTANCE.LOW:
      return "secondary";
    default:
      return "secondary";
  }
};

const getImportanceLabel = (importance: string): string => {
  switch (importance) {
    case NOTIFICATION_IMPORTANCE.URGENT:
      return "Urgente";
    case NOTIFICATION_IMPORTANCE.HIGH:
      return "Alto";
    case NOTIFICATION_IMPORTANCE.NORMAL:
      return "Normal";
    case NOTIFICATION_IMPORTANCE.LOW:
      return "Baixo";
    default:
      return importance;
  }
};

export function NotificationCard({ notification }: NotificationCardProps) {
  const { colors } = useTheme();

  return (
    <DetailCard
      title="Detalhes da Notificação"
      icon="bell"
      badge={
        <Badge variant={getImportanceBadgeVariant(notification.importance) as any} size="sm">
          <ThemedText style={styles.badgeText}>{getImportanceLabel(notification.importance)}</ThemedText>
        </Badge>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.section}>
          <ThemedText style={StyleSheet.flatten([styles.notificationTitle, { color: colors.foreground }])}>
            {notification.title}
          </ThemedText>
        </View>

        {/* Message Section */}
        <DetailSection title="Mensagem">
          <ThemedText style={StyleSheet.flatten([styles.messageText, { color: colors.foreground }])}>
            {notification.body}
          </ThemedText>
        </DetailSection>

        {/* Metadata Section */}
        <View style={styles.section}>
          <DetailField label="Tipo" value={getNotificationTypeLabel(notification.type)} />

          <DetailField
            label="Criado em"
            value={notification.createdAt ? formatDateTime(new Date(notification.createdAt)) : "-"}
            icon="clock"
          />

          {notification.sentAt && (
            <DetailField
              label="Enviado em"
              value={formatDateTime(new Date(notification.sentAt))}
              icon="clock"
            />
          )}

          {notification.scheduledAt && !notification.sentAt && (
            <DetailField
              label="Agendado para"
              value={formatDateTime(new Date(notification.scheduledAt))}
              icon="clock"
            />
          )}

          {notification.user && (
            <DetailField
              label="Remetente"
              value={notification.user.name || "-"}
              icon="user"
            />
          )}
        </View>

        {/* Action Section */}
        {(notification.actionType || notification.actionUrl) && (
          <DetailSection title="Ação">
            {notification.actionType && (
              <DetailField label="Tipo de Ação" value={notification.actionType} />
            )}
            {notification.actionUrl && (
              <DetailField label="URL" value={notification.actionUrl} />
            )}
          </DetailSection>
        )}

        {/* Channels Section */}
        {notification.channel && notification.channel.length > 0 && (
          <DetailSection title="Canais de Envio">
            <View style={styles.channelsContainer}>
              {notification.channel.map((channel, index) => (
                <Badge key={index} variant="secondary" size="sm">
                  <ThemedText style={styles.badgeText}>{channel}</ThemedText>
                </Badge>
              ))}
            </View>
          </DetailSection>
        )}
      </ScrollView>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  notificationTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: 28,
  },
  messageText: {
    fontSize: fontSize.base,
    lineHeight: 24,
  },
  channelsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
