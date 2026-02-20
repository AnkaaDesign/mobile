
import { View, StyleSheet } from "react-native";
import type { User } from '../../../../types';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconShieldCheck } from "@tabler/icons-react-native";
import { getBadgeVariant } from "@/constants/badge-colors";
import { getUserStatusBadgeText } from "@/utils/user";
import { formatDate } from "@/utils";

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

        {/* Personal Info */}
        {user.birth && (
          <DetailField
            label="Data de Nascimento"
            value={formatDate(user.birth)}
            icon="cake"
          />
        )}

        {/* Professional Info */}
        {user.payrollNumber && (
          <DetailField
            label="Número da Folha"
            value={user.payrollNumber}
            icon="hash"
            monospace
          />
        )}

        {user.position && (
          <DetailField
            label="Cargo"
            value={user.position.name}
            icon="briefcase"
          />
        )}

        {user.sector && (
          <DetailField
            label="Setor"
            value={user.sector.name}
            icon="building"
          />
        )}

        {user.managedSector && (
          <DetailField
            label="Setor Gerenciado"
            value={user.managedSector.name}
            icon="shield-check"
            iconColor={colors.warning}
          />
        )}
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
});
