
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard } from "@/components/ui/detail-page-layout";
import type { Sector } from '../../../../types';
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

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
      <DetailCard title="Usuários do Setor" icon="users">
        <View style={styles.emptyState}>
          <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
            Nenhum usuário associado a este setor.
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  return (
    <DetailCard
      title="Usuários do Setor"
      icon="users"
      badge={
        <Badge variant="secondary">
          {sector.users.length}
        </Badge>
      }
    >
      <View style={styles.usersList}>
        {sector.users.map((user) => (
          <View key={user.id} style={StyleSheet.flatten([styles.userItem, { borderBottomColor: colors.border }])}>
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
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  usersList: {
    gap: 0,
  },
  userItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
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
    padding: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
