
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";
import type { ChangeLog } from '../../../../types';
import { IconUser, IconChevronRight } from "@tabler/icons-react-native";

interface UserCardProps {
  changeLog: ChangeLog;
}

export function UserCard({ changeLog }: UserCardProps) {
  const { colors } = useTheme();

  if (!changeLog.user && !changeLog.userId) {
    return (
      <Card style={styles.card}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconUser size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Usuário
            </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
              Alteração realizada pelo sistema
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  const handleUserPress = () => {
    if (changeLog.userId) {
      router.push(routeToMobilePath(routes.administration.collaborators.details(changeLog.userId)) as any);
    }
  };

  const userName = changeLog.user?.name || "Usuário não identificado";
  const userEmail = changeLog.user?.email;
  const avatarUrl = changeLog.user?.avatar?.url || changeLog.user?.profilePictureUrl;

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconUser size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
            Realizado por
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.userContainer, { backgroundColor: colors.muted + "40" }]}
          onPress={handleUserPress}
          activeOpacity={0.7}
          disabled={!changeLog.userId}
        >
          <View style={styles.userInfo}>
            <Avatar size="md">
              {avatarUrl && <AvatarImage source={{ uri: avatarUrl }} />}
              <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <View style={styles.userDetails}>
              <ThemedText style={StyleSheet.flatten([styles.userName, { color: colors.foreground }])}>
                {userName}
              </ThemedText>
              {userEmail && (
                <ThemedText style={StyleSheet.flatten([styles.userEmail, { color: colors.mutedForeground }])}>
                  {userEmail}
                </ThemedText>
              )}
              {changeLog.userId && (
                <ThemedText
                  style={StyleSheet.flatten([styles.userId, { color: colors.mutedForeground }])}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  ID: {changeLog.userId}
                </ThemedText>
              )}
            </View>
          </View>
          {changeLog.userId && (
            <IconChevronRight size={20} color={colors.mutedForeground} />
          )}
        </TouchableOpacity>

        {/* Triggered By Information */}
        {changeLog.triggeredBy && (
          <View style={[styles.triggeredByContainer, { backgroundColor: colors.muted + "20", borderColor: colors.border }]}>
            <View style={styles.triggeredByRow}>
              <ThemedText style={StyleSheet.flatten([styles.triggeredByLabel, { color: colors.mutedForeground }])}>
                Origem da Alteração
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.triggeredByValue, { color: colors.foreground }])}>
                {changeLog.triggeredBy}
              </ThemedText>
            </View>
            {changeLog.triggeredById && (
              <View style={styles.triggeredByRow}>
                <ThemedText style={StyleSheet.flatten([styles.triggeredByLabel, { color: colors.mutedForeground }])}>
                  ID de Origem
                </ThemedText>
                <ThemedText
                  style={StyleSheet.flatten([styles.triggeredByValue, styles.monoValue, { color: colors.foreground }])}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {changeLog.triggeredById}
                </ThemedText>
              </View>
            )}
          </View>
        )}
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
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  userDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  userEmail: {
    fontSize: fontSize.sm,
  },
  userId: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
  },
  triggeredByContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  triggeredByRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  triggeredByLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  triggeredByValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
  monoValue: {
    fontFamily: "monospace",
  },
});
