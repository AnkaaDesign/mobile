import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import type { Borrow } from '../../../../types';
import {
  IconUser,
  IconBriefcase,
  IconBuilding,
} from "@tabler/icons-react-native";

interface BorrowUserInfoCardProps {
  borrow: Borrow & {
    user?: {
      name: string;
      position?: {
        name: string;
      };
      sector?: {
        name: string;
      };
    };
  };
}

export const BorrowUserInfoCard: React.FC<BorrowUserInfoCardProps> = ({ borrow }) => {
  const { colors } = useTheme();

  if (!borrow.user) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconUser size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Informações do Usuário</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Usuário não encontrado
          </ThemedText>
        </View>
      </Card>
    );
  }

  const { user } = borrow;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconUser size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações do Usuário</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* User Name */}
        <View style={styles.infoItem}>
          <IconUser size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Nome</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {user.name}
            </ThemedText>
          </View>
        </View>

        {/* Position */}
        <View style={styles.infoItem}>
          <IconBriefcase size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Cargo</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {user.position ? user.position.name : "-"}
            </ThemedText>
          </View>
        </View>

        {/* Sector */}
        <View style={styles.infoItem}>
          <IconBuilding size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Setor</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {user.sector ? user.sector.name : "-"}
            </ThemedText>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
  },
});
