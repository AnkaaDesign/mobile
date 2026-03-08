
import { View, ScrollView, StyleSheet } from "react-native";
import type { Notification } from '../../../../types';
import { formatDateTime } from "@/utils";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconCircleCheck, IconClock } from "@tabler/icons-react-native";

interface RecipientsCardProps {
  notification: Notification;
  maxHeight?: number;
}

export function RecipientsCard({ notification, maxHeight = 300 }: RecipientsCardProps) {
  const { colors } = useTheme();

  const recipients = notification.seenBy || [];
  const totalRecipients = recipients.length;
  const readCount = recipients.filter((r) => r.seenAt).length;

  if (totalRecipients === 0) {
    return (
      <DetailCard title="Destinatários" icon="users">
        <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>Nenhum destinatário registrado</ThemedText>
      </DetailCard>
    );
  }

  return (
    <DetailCard title={`Destinatários (${readCount}/${totalRecipients})`} icon="users">
      <View style={styles.content}>
        <ScrollView style={[styles.scrollContainer, { maxHeight }]} showsVerticalScrollIndicator={false}>
          <View style={styles.recipientsList}>
            {recipients.map((recipient) => (
              <View key={recipient.id} style={StyleSheet.flatten([styles.recipientItem, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
                <View style={styles.recipientInfo}>
                  <View style={styles.recipientHeader}>
                    <ThemedText style={StyleSheet.flatten([styles.recipientName, { color: colors.foreground }])}>{recipient.user?.name || "Usuário Desconhecido"}</ThemedText>
                    {recipient.seenAt ? (
                      <Badge variant="success">
                        <View style={styles.badgeContent}>
                          <IconCircleCheck size={12} color={colors.primaryForeground} />
                          <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>Lida</ThemedText>
                        </View>
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <View style={styles.badgeContent}>
                          <IconClock size={12} color={colors.foreground} />
                          <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.foreground }])}>Pendente</ThemedText>
                        </View>
                      </Badge>
                    )}
                  </View>
                  {recipient.seenAt && (
                    <ThemedText style={StyleSheet.flatten([styles.seenDate, { color: colors.mutedForeground }])}>Lida em {formatDateTime(recipient.seenAt)}</ThemedText>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
  scrollContainer: {
    width: "100%",
  },
  recipientsList: {
    gap: spacing.md,
  },
  recipientItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  recipientInfo: {
    gap: spacing.sm,
  },
  recipientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recipientName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  seenDate: {
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
});
