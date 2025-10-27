import React from "react";
import { View, StyleSheet } from "react-native";
import type { User } from '../../../../types';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconUser, IconBriefcase, IconBuilding } from "@tabler/icons-react-native";
import { getBadgeVariant } from '../../../../constants/badge-colors';
import { getUserStatusBadgeText } from '../../../../utils/user';

interface EmployeeCardProps {
  employee: User;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const { colors } = useTheme();

  const statusVariant = getBadgeVariant(employee.status, "USER");

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Avatar
            size="lg"
            style={{ backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}
          >
            <ThemedText style={{ color: colors.primaryForeground, fontSize: 24, fontWeight: '600' }}>
              {employee.name.charAt(0).toUpperCase()}
            </ThemedText>
          </Avatar>
          <View style={styles.headerInfo}>
            <ThemedText style={[styles.employeeName, { color: colors.foreground }]}>
              {employee.name}
            </ThemedText>
            {employee.email && (
              <ThemedText style={[styles.employeeEmail, { color: colors.mutedForeground }]}>
                {employee.email}
              </ThemedText>
            )}
            <Badge variant={statusVariant} style={styles.statusBadge}>
              {getUserStatusBadgeText(employee)}
            </Badge>
          </View>
        </View>

        {/* Quick Info Grid */}
        <View style={styles.infoGrid}>
          {employee.position && (
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + "10" }]}>
                <IconBriefcase size={18} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Cargo
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {employee.position.name}
                </ThemedText>
              </View>
            </View>
          )}

          {employee.sector && (
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + "10" }]}>
                <IconBuilding size={18} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Setor
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {employee.sector.name}
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
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  employeeName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  employeeEmail: {
    fontSize: fontSize.sm,
  },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
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
