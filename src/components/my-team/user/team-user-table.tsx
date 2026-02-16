import React, { useCallback } from "react";
import { FlatList, View, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { User } from '../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { USER_STATUS } from "@/constants";
import { formatDate } from "@/utils";
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

interface TeamUserTableProps {
  users: User[];
  onUserPress?: (userId: string) => void;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  loading?: boolean;
}

// Helper function to get status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case USER_STATUS.EXPERIENCE_PERIOD_1:
      return { background: badgeColors.warning.background, text: badgeColors.warning.text };
    case USER_STATUS.EXPERIENCE_PERIOD_2:
      return { background: badgeColors.warning.background, text: badgeColors.warning.text };
    case USER_STATUS.EFFECTED:
      return { background: badgeColors.success.background, text: badgeColors.success.text };
    case USER_STATUS.DISMISSED:
      return { background: badgeColors.error.background, text: badgeColors.error.text };
    default:
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
  }
};

// Helper function to get status label
const getStatusLabel = (status: string) => {
  switch (status) {
    case USER_STATUS.EXPERIENCE_PERIOD_1:
      return "Experiência 1/2";
    case USER_STATUS.EXPERIENCE_PERIOD_2:
      return "Experiência 2/2";
    case USER_STATUS.EFFECTED:
      return "Efetivado";
    case USER_STATUS.DISMISSED:
      return "Desligado";
    default:
      return status;
  }
};

export const TeamUserTable = React.memo<TeamUserTableProps>(
  ({ users, onUserPress, onRefresh, refreshing = false, loading = false }) => {
    const { colors, isDark } = useTheme();
    const { startNavigation } = useNavigationLoading();

    // Row component
    const renderRow = useCallback(
      ({ item }: { item: User }) => {
        const statusColor = getStatusColor(item.status);
        const statusLabel = getStatusLabel(item.status);

        const handlePress = () => {
          if (onUserPress) {
            startNavigation();
            onUserPress(item.id);
          }
        };

        return (
          <Pressable onPress={handlePress} android_ripple={{ color: colors.primary + "20" }}>
            <Card style={styles.userCard}>
              {/* Header: User and Status */}
              <View style={styles.cardHeader}>
                <View style={styles.userSection}>
                  <View style={[styles.userAvatar, { backgroundColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200] }]}>
                    <Icon name="user" size="sm" variant="muted" />
                  </View>
                  <View style={styles.userInfo}>
                    <ThemedText style={styles.userName} numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                    <ThemedText style={styles.positionLabel} numberOfLines={1}>
                      {item.position?.name || "Cargo não informado"}
                    </ThemedText>
                  </View>
                </View>
                <Badge
                  variant="secondary"
                  size="sm"
                  style={{
                    backgroundColor: statusColor.background,
                    borderWidth: 0,
                  }}
                >
                  <ThemedText
                    style={{
                      color: statusColor.text,
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.medium,
                    }}
                  >
                    {statusLabel}
                  </ThemedText>
                </Badge>
              </View>

              {/* Details Section */}
              <View style={styles.detailsSection}>
                {item.email && (
                  <View style={styles.detailRow}>
                    <Icon name="mail" size="xs" variant="muted" />
                    <ThemedText style={styles.detailText} numberOfLines={1}>
                      {item.email}
                    </ThemedText>
                  </View>
                )}
                {item.phone && (
                  <View style={styles.detailRow}>
                    <Icon name="phone" size="xs" variant="muted" />
                    <ThemedText style={styles.detailText} numberOfLines={1}>
                      {item.phone}
                    </ThemedText>
                  </View>
                )}
                {item.sector?.name && (
                  <View style={styles.detailRow}>
                    <Icon name="building" size="xs" variant="muted" />
                    <ThemedText style={styles.detailText} numberOfLines={1}>
                      {item.sector.name}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Footer: Admission Date */}
              <View style={styles.cardFooter}>
                <View style={styles.dateSection}>
                  <Icon name="calendar" size="xs" variant="muted" />
                  <ThemedText style={styles.dateText}>
                    Admissão: {formatDate(item.exp1StartAt)}
                  </ThemedText>
                </View>
              </View>
            </Card>
          </Pressable>
        );
      },
      [colors, isDark, onUserPress, startNavigation],
    );

    // Empty state component
    const renderEmpty = useCallback(
      () => (
        <View style={styles.emptyContainer}>
          <Icon name="users" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhum usuário encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Os colaboradores do seu setor aparecerão aqui</ThemedText>
        </View>
      ),
      [],
    );

    // Main loading state
    if (loading && users.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando usuários...</ThemedText>
        </View>
      );
    }

    return (
      <FlatList
        data={users}
        renderItem={renderRow}
        keyExtractor={(item) => item.id}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={users.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  }
);

const styles = StyleSheet.create({
  userCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  positionLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  detailsSection: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
});

TeamUserTable.displayName = "TeamUserTable";
