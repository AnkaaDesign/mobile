
import { View, StyleSheet } from "react-native";
import type { User } from '../../../../types';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBriefcase, IconBuilding, IconShieldCheck } from "@tabler/icons-react-native";
import { getBadgeVariant } from "@/constants/badge-colors";
import { getUserStatusBadgeText } from "@/utils/user";

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const { colors } = useTheme();

  const statusVariant = getBadgeVariant(user.status, "USER");

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Avatar
            size="lg"
            label={user.name}
            uri={user.avatar?.url || undefined}
            style={styles.avatar}
          />
          <View style={styles.headerInfo}>
            <ThemedText style={[styles.userName, { color: colors.foreground }]}>
              {user.name}
            </ThemedText>
            {user.email && (
              <ThemedText style={[styles.userEmail, { color: colors.mutedForeground }]}>
                {user.email}
              </ThemedText>
            )}
            <View style={styles.badgeRow}>
              <Badge variant={statusVariant} style={styles.statusBadge}>
                {getUserStatusBadgeText(user)}
              </Badge>
              {user.verified && (
                <Badge variant="success" style={styles.verifiedBadge}>
                  <IconShieldCheck size={12} color={colors.success} />
                  <ThemedText style={[styles.badgeText, { color: colors.success }]}>Verificado</ThemedText>
                </Badge>
              )}
            </View>
          </View>
        </View>

        {/* Quick Info Grid */}
        <View style={styles.infoGrid}>
          {user.position && (
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + "10" }]}>
                <IconBriefcase size={18} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Cargo
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {user.position.name}
                </ThemedText>
              </View>
            </View>
          )}

          {user.sector && (
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + "10" }]}>
                <IconBuilding size={18} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Setor
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {user.sector.name}
                </ThemedText>
              </View>
            </View>
          )}

          {user.managedSector && (
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: colors.warning + "10" }]}>
                <IconShieldCheck size={18} color={colors.warning} />
              </View>
              <View style={styles.infoText}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Setor Gerenciado
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {user.managedSector.name}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  content: {
    gap: spacing.md,
  },
  headerSection: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "flex-start",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  userEmail: {
    fontSize: fontSize.sm,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statusBadge: {
    alignSelf: "flex-start",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  infoGrid: {
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
