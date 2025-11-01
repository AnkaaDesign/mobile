
import { View, StyleSheet } from "react-native";
import type { Notification } from '../../../../types';
import { NOTIFICATION_TYPE_LABELS, NOTIFICATION_IMPORTANCE_LABELS } from '../../../../constants';
import { formatDateTime } from '../../../../utils';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBell, IconCalendar, IconSend } from "@tabler/icons-react-native";

interface NotificationCardProps {
  notification: Notification;
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const { colors } = useTheme();

  const getImportanceBadgeVariant = () => {
    switch (notification.importance) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "warning";
      case "NORMAL":
        return "default";
      case "LOW":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconBell size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Notificação</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.section}>
            <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>Título</ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.title, { color: colors.foreground }])}>{notification.title}</ThemedText>
          </View>

          {/* Body Section */}
          <View style={styles.section}>
            <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>Mensagem</ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.body, { color: colors.foreground }])}>{notification.body}</ThemedText>
          </View>

          {/* Metadata Section */}
          <View style={StyleSheet.flatten([styles.metadataGrid, { borderTopColor: colors.border + "50" }])}>
            <View style={StyleSheet.flatten([styles.metadataItem, { backgroundColor: colors.muted + "30" }])}>
              <ThemedText style={StyleSheet.flatten([styles.metadataLabel, { color: colors.mutedForeground }])}>Tipo</ThemedText>
              <Badge variant="secondary">
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.foreground }])}>{NOTIFICATION_TYPE_LABELS[notification.type]}</ThemedText>
              </Badge>
            </View>

            <View style={StyleSheet.flatten([styles.metadataItem, { backgroundColor: colors.muted + "30" }])}>
              <ThemedText style={StyleSheet.flatten([styles.metadataLabel, { color: colors.mutedForeground }])}>Importância</ThemedText>
              <Badge variant={getImportanceBadgeVariant()}>
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>
                  {NOTIFICATION_IMPORTANCE_LABELS[notification.importance]}
                </ThemedText>
              </Badge>
            </View>
          </View>

          {/* Dates Section */}
          <View style={StyleSheet.flatten([styles.datesSection, { borderTopColor: colors.border + "50" }])}>
            {notification.scheduledAt && (
              <View style={styles.dateItem}>
                <View style={styles.dateHeader}>
                  <IconCalendar size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.dateLabel, { color: colors.mutedForeground }])}>Agendada para</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.dateValue, { color: colors.foreground }])}>{formatDateTime(notification.scheduledAt)}</ThemedText>
              </View>
            )}

            {notification.sentAt && (
              <View style={styles.dateItem}>
                <View style={styles.dateHeader}>
                  <IconSend size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.dateLabel, { color: colors.mutedForeground }])}>Enviada em</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.dateValue, { color: colors.foreground }])}>{formatDateTime(notification.sentAt)}</ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  section: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xl * 1.4,
  },
  body: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.6,
  },
  metadataGrid: {
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  metadataItem: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  metadataLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  datesSection: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  dateItem: {
    gap: spacing.xs,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dateLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dateValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.lg + spacing.sm,
  },
});
