import { View, StyleSheet, ScrollView } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { Notification } from "@/types";
import { formatDateTime } from "@/utils";
import { NOTIFICATION_TYPE, NOTIFICATION_IMPORTANCE } from "@/constants";
import {
  IconBell,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconPackage,
  IconCalendar,
  IconAlertCircle,
  IconSettings,
  IconClock,
  IconUser,
} from "@tabler/icons-react-native";

interface NotificationCardProps {
  notification: Notification;
}

const getNotificationTypeIcon = (type: string, size: number, color: string) => {
  switch (type) {
    case NOTIFICATION_TYPE.SYSTEM:
      return <IconSettings size={size} color={color} />;
    case NOTIFICATION_TYPE.PRODUCTION:
      return <IconCheck size={size} color={color} />;
    case NOTIFICATION_TYPE.STOCK:
      return <IconPackage size={size} color={color} />;
    case NOTIFICATION_TYPE.USER:
      return <IconSettings size={size} color={color} />;
    case NOTIFICATION_TYPE.GENERAL:
      return <IconBell size={size} color={color} />;
    default:
      return <IconBell size={size} color={color} />;
  }
};

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
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {getNotificationTypeIcon(notification.type, 20, colors.mutedForeground)}
          <ThemedText style={styles.title}>Detalhes da Notificação</ThemedText>
        </View>
        <Badge variant={getImportanceBadgeVariant(notification.importance)} size="sm">
          <ThemedText style={styles.badgeText}>{getImportanceLabel(notification.importance)}</ThemedText>
        </Badge>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.notificationTitle, { color: colors.foreground }]}>{notification.title}</ThemedText>
        </View>

        {/* Message Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconInfoCircle size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Mensagem</ThemedText>
          </View>
          <ThemedText style={[styles.messageText, { color: colors.foreground }]}>{notification.body}</ThemedText>
        </View>

        {/* Metadata Section */}
        <View style={styles.section}>
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              {getNotificationTypeIcon(notification.type, 16, colors.mutedForeground)}
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Tipo</ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{getNotificationTypeLabel(notification.type)}</ThemedText>
          </View>

          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <IconClock size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Criado em</ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
              {notification.createdAt ? formatDateTime(new Date(notification.createdAt)) : "-"}
            </ThemedText>
          </View>

          {notification.sentAt && (
            <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
              <View style={styles.fieldLabelWithIcon}>
                <IconClock size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Enviado em</ThemedText>
              </View>
              <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{formatDateTime(new Date(notification.sentAt))}</ThemedText>
            </View>
          )}

          {notification.scheduledAt && !notification.sentAt && (
            <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
              <View style={styles.fieldLabelWithIcon}>
                <IconClock size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Agendado para</ThemedText>
              </View>
              <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{formatDateTime(new Date(notification.scheduledAt))}</ThemedText>
            </View>
          )}

          {notification.user && (
            <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
              <View style={styles.fieldLabelWithIcon}>
                <IconUser size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Remetente</ThemedText>
              </View>
              <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{notification.user.name || "-"}</ThemedText>
            </View>
          )}
        </View>

        {/* Action Section (if available) */}
        {(notification.actionType || notification.actionUrl) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconAlertCircle size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Ação</ThemedText>
            </View>

            {notification.actionType && (
              <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
                <View style={styles.fieldLabelWithIcon}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Tipo de Ação</ThemedText>
                </View>
                <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{notification.actionType}</ThemedText>
              </View>
            )}

            {notification.actionUrl && (
              <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
                <View style={styles.fieldLabelWithIcon}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>URL</ThemedText>
                </View>
                <ThemedText style={[styles.fieldValue, { color: colors.primary }]} numberOfLines={1}>
                  {notification.actionUrl}
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Channels Section */}
        {notification.channel && notification.channel.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconBell size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Canais de Envio</ThemedText>
            </View>
            <View style={styles.channelsContainer}>
              {notification.channel.map((channel, index) => (
                <Badge key={index} variant="secondary" size="sm">
                  <ThemedText style={styles.badgeText}>{channel}</ThemedText>
                </Badge>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
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
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  notificationTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: fontSize.base,
    lineHeight: 24,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
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
