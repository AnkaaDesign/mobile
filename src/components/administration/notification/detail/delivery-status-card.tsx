
import { View, StyleSheet } from "react-native";
import type { Notification } from '../../../../types';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconChartBar, IconSend, IconCircleCheck, IconAlertCircle } from "@tabler/icons-react-native";

interface DeliveryStatusCardProps {
  notification: Notification;
}

export function DeliveryStatusCard({ notification }: DeliveryStatusCardProps) {
  const { colors, isDark } = useTheme();

  const recipients = notification.seenBy || [];
  const totalRecipients = recipients.length;
  const readCount = recipients.filter((r) => r.seenAt).length;
  const unreadCount = totalRecipients - readCount;

  // Calculate delivery statistics
  const sentCount = notification.sentAt ? totalRecipients : 0;

  const readPercentage = totalRecipients > 0 ? (readCount / totalRecipients) * 100 : 0;

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconChartBar size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Estatísticas de Entrega</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.content}>
          {/* Progress Bar */}
          {totalRecipients > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <ThemedText style={StyleSheet.flatten([styles.progressLabel, { color: colors.mutedForeground }])}>Taxa de Leitura</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.progressValue, { color: colors.foreground }])}>{readPercentage.toFixed(1)}%</ThemedText>
              </View>
              <Progress
                value={readPercentage}
                style={styles.progressBar}
                indicatorStyle={{
                  backgroundColor: readPercentage >= 80 ? extendedColors.green[500] : readPercentage >= 50 ? extendedColors.yellow[500] : extendedColors.red[500],
                }}
              />
            </View>
          )}

          {/* Statistics Grid */}
          <View style={styles.statsGrid}>
            <View style={StyleSheet.flatten([styles.statCard, { backgroundColor: isDark ? extendedColors.blue[900] + "20" : extendedColors.blue[100] }])}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? extendedColors.blue[800] : extendedColors.blue[200] }]}>
                <IconSend size={20} color={isDark ? extendedColors.blue[400] : extendedColors.blue[600]} />
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>{sentCount}</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>Enviadas</ThemedText>
              </View>
            </View>

            <View style={StyleSheet.flatten([styles.statCard, { backgroundColor: isDark ? extendedColors.green[900] + "20" : extendedColors.green[100] }])}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? extendedColors.green[800] : extendedColors.green[200] }]}>
                <IconCircleCheck size={20} color={isDark ? extendedColors.green[400] : extendedColors.green[600]} />
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>{readCount}</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>Lidas</ThemedText>
              </View>
            </View>

            <View style={StyleSheet.flatten([styles.statCard, { backgroundColor: isDark ? extendedColors.yellow[900] + "20" : extendedColors.yellow[100] }])}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? extendedColors.yellow[800] : extendedColors.yellow[200] }]}>
                <IconAlertCircle size={20} color={isDark ? extendedColors.yellow[400] : extendedColors.yellow[600]} />
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>{unreadCount}</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>Não Lidas</ThemedText>
              </View>
            </View>
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
  progressSection: {
    gap: spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  progressValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.full,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "30%",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
