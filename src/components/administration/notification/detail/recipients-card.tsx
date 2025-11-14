
import { View, ScrollView, StyleSheet } from "react-native";
import type { Notification } from '../../../../types';
import { formatDateTime } from "@/utils";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconUsers, IconCircleCheck, IconClock } from "@tabler/icons-react-native";

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
      <Card style={styles.card}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconUsers size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Destinatários</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>Nenhum destinatário registrado</ThemedText>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconUsers size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
            Destinatários ({readCount}/{totalRecipients})
          </ThemedText>
        </View>
      </View>
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
    borderBottomWidth: 1,
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
