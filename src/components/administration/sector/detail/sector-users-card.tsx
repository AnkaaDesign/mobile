import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconUsers, IconChevronRight } from "@tabler/icons-react-native";
import { router } from "expo-router";
import type { Sector } from '../../../../types';
import { routes, USER_STATUS, ACTIVE_USER_STATUSES } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

interface SectorUsersCardProps {
  sector: Sector;
}

export function SectorUsersCard({ sector }: SectorUsersCardProps) {
  const { colors } = useTheme();

  const users = sector.users || [];
  const totalUsers = sector._count?.users || users.length;

  const handleViewAllUsers = () => {
    router.push(routeToMobilePath(`${routes.administration.users.root}?sectorId=${sector.id}`) as any);
  };

  const handleUserPress = (userId: string) => {
    router.push(routeToMobilePath(routes.administration.users.details(userId)) as any);
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <IconUsers size={20} color={colors.primary} />
          <ThemedText style={styles.sectionTitle}>Usuários do Setor</ThemedText>
        </View>
        <TouchableOpacity
          onPress={handleViewAllUsers}
          style={[styles.viewAllButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.viewAllText, { color: colors.foreground }]}>
            Ver todos
          </ThemedText>
          <IconChevronRight size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {users.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Nenhum usuário associado a este setor.
          </ThemedText>
        </View>
      ) : (
        <ScrollView style={styles.usersContainer} showsVerticalScrollIndicator={false}>
          {users.map((user, index) => (
            <TouchableOpacity
              key={user.id}
              onPress={() => handleUserPress(user.id)}
              style={[
                styles.userItem,
                { borderBottomColor: colors.border },
                index === users.length - 1 && styles.lastUserItem,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  {user.payrollNumber && (
                    <Badge variant="secondary" style={styles.payrollBadge}>
                      <ThemedText style={{ fontSize: fontSize.xs }}>
                        {user.payrollNumber}
                      </ThemedText>
                    </Badge>
                  )}
                  <ThemedText style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
                    {user.name}
                  </ThemedText>
                </View>

                <View style={styles.userDetails}>
                  {user.position && (
                    <View style={styles.detailItem}>
                      <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                        Cargo:
                      </ThemedText>
                      <ThemedText style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                        {user.position.name}
                      </ThemedText>
                    </View>
                  )}

                  {user.email && (
                    <View style={styles.detailItem}>
                      <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                        Email:
                      </ThemedText>
                      <ThemedText style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                        {user.email}
                      </ThemedText>
                    </View>
                  )}

                  {user.phone && (
                    <View style={styles.detailItem}>
                      <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                        Telefone:
                      </ThemedText>
                      <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                        {user.phone}
                      </ThemedText>
                    </View>
                  )}

                  {user.status && (
                    <View style={styles.statusContainer}>
                      <Badge variant={user.status !== USER_STATUS.DISMISSED ? "success" : "secondary"}>
                        <ThemedText style={{ fontSize: fontSize.xs }}>
                          {user.status !== USER_STATUS.DISMISSED ? "Ativo" : "Inativo"}
                        </ThemedText>
                      </Badge>
                    </View>
                  )}
                </View>
              </View>

              <IconChevronRight size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {users.length > 0 && totalUsers > users.length && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <ThemedText style={[styles.footerText, { color: colors.mutedForeground }]}>
            Mostrando {users.length} de {totalUsers} usuários
          </ThemedText>
        </View>
      )}
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
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  usersContainer: {
    maxHeight: 600,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  lastUserItem: {
    borderBottomWidth: 0,
  },
  userInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  payrollBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  userDetails: {
    gap: spacing.xs,
  },
  detailItem: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    marginTop: spacing.xs,
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  footer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  footerText: {
    fontSize: fontSize.sm,
  },
});
