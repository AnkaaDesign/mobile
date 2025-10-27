import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { IconUser, IconBriefcase, IconMail, IconPhone, IconPercentage, IconChevronRight } from "@tabler/icons-react-native";
import type { Commission } from '../../../../types';
import { USER_STATUS_LABELS, getBadgeVariant, routes } from '../../../../constants';
import { formatCPF, formatPhoneNumber } from '../../../../utils';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { routeToMobilePath } from "@/lib/route-mapper";

interface UserCardProps {
  commission: Commission;
}

export function UserCard({ commission }: UserCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const user = commission.user;

  if (!user) {
    return null;
  }

  const handleUserPress = () => {
    router.push(routeToMobilePath(routes.humanResources.employees.details(user.id)) as any);
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconUser size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Colaborador</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <TouchableOpacity onPress={handleUserPress} activeOpacity={0.7}>
          <View style={StyleSheet.flatten([styles.userContainer, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
            {/* User Header */}
            <View style={styles.userHeader}>
              <View style={styles.userInfo}>
                <Avatar size="lg" name={user.name} imageUrl={user.profilePictureUrl} />
                <View style={styles.userBasicInfo}>
                  <ThemedText style={StyleSheet.flatten([styles.userName, { color: colors.foreground }])}>{user.name}</ThemedText>
                  {user.position && <ThemedText style={StyleSheet.flatten([styles.userPosition, { color: colors.mutedForeground }])}>{user.position.name}</ThemedText>}
                  <Badge variant={getBadgeVariant(user.status, "USER")} style={styles.statusBadge}>
                    <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>{USER_STATUS_LABELS[user.status]}</ThemedText>
                  </Badge>
                </View>
              </View>
              <IconChevronRight size={20} color={colors.mutedForeground} />
            </View>

            {/* User Details */}
            <View style={styles.userDetails}>
              {/* Email */}
              {user.email && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelRow}>
                    <IconMail size={14} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Email</ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])} numberOfLines={1}>
                    {user.email}
                  </ThemedText>
                </View>
              )}

              {/* Phone */}
              {user.phoneNumber && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelRow}>
                    <IconPhone size={14} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Telefone</ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{formatPhoneNumber(user.phoneNumber)}</ThemedText>
                </View>
              )}

              {/* CPF */}
              {user.cpf && (
                <View style={styles.detailRow}>
                  <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>CPF</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{formatCPF(user.cpf)}</ThemedText>
                </View>
              )}

              {/* Position Commission Rate */}
              {user.position?.commissionRate !== undefined && (
                <View style={StyleSheet.flatten([styles.commissionRateRow, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }])}>
                  <View style={styles.detailLabelRow}>
                    <IconPercentage size={14} color={colors.primary} />
                    <ThemedText style={StyleSheet.flatten([styles.commissionRateLabel, { color: colors.primary }])}>Taxa de Comissão do Cargo</ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.commissionRateValue, { color: colors.primary }])}>{user.position.commissionRate.toFixed(2)}%</ThemedText>
                </View>
              )}

              {/* Sector */}
              {user.position?.sector && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelRow}>
                    <IconBriefcase size={14} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>Setor</ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>{user.position.sector.name}</ThemedText>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
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
  userContainer: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
  },
  userBasicInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.base * 1.4,
  },
  userPosition: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  userDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  detailLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
    flex: 1,
  },
  commissionRateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  commissionRateLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  commissionRateValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
