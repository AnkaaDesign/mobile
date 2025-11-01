
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconUsers } from "@tabler/icons-react-native";
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
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <IconUsers size={20} color={colors.primary} />
          <ThemedText style={styles.sectionTitle}>Usuários do Setor</ThemedText>
        </View>
        <View style={styles.emptyState}>
          <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
            Nenhum usuário associado a este setor.
          </ThemedText>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.sectionHeader}>
        <IconUsers size={20} color={colors.primary} />
        <ThemedText style={styles.sectionTitle}>Usuários do Setor</ThemedText>
        <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
          {sector.users.length}
        </Badge>
      </View>
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
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    marginLeft: spacing.sm,
    flex: 1,
  },
  usersList: {
    gap: 0,
  },
  userItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
