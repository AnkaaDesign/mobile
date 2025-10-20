import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconUsers } from "@tabler/icons-react-native";
import type { Sector } from '../../../../types';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

interface UsersCardProps {
  sector: Sector & {
    users?: Array<{
      id: string;
      name: string;
      email?: string;
      position?: {
        name: string;
      };
    }>;
  };
}

export function UsersCard({ sector }: UsersCardProps) {
  const { colors } = useTheme();

  if (!sector.users || sector.users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle style={styles.sectionTitle}>
            <View style={styles.titleRow}>
              <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                <IconUsers size={18} color={colors.primary} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
                Usuários do Setor
              </ThemedText>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.emptyState}>
            <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
              Nenhum usuário associado a este setor.
            </ThemedText>
          </View>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconUsers size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Usuários do Setor
            </ThemedText>
            <Badge variant="secondary">
              <ThemedText style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>
                {sector.users.length}
              </ThemedText>
            </Badge>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.usersList}>
          {sector.users.map((user) => (
            <View key={user.id} style={StyleSheet.flatten([styles.userItem, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
              <View style={styles.userInfo}>
                <ThemedText style={StyleSheet.flatten([styles.userName, { color: colors.foreground }])}>
                  {user.name}
                </ThemedText>
                {user.position && (
                  <ThemedText style={StyleSheet.flatten([styles.userPosition, { color: colors.mutedForeground }])}>
                    {user.position.name}
                  </ThemedText>
                )}
                {user.email && (
                  <ThemedText style={StyleSheet.flatten([styles.userEmail, { color: colors.mutedForeground }])}>
                    {user.email}
                  </ThemedText>
                )}
              </View>
            </View>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
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
  usersList: {
    gap: spacing.sm,
  },
  userItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  userInfo: {
    gap: spacing.xs,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  userPosition: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  userEmail: {
    fontSize: fontSize.xs,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
