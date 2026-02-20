import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import type { Borrow } from '../../../../types';
import { IconUser } from "@tabler/icons-react-native";

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
        <DetailField label="Nome" value={user.name} icon="user" />

        {/* Position */}
        <DetailField label="Cargo" value={user.position ? user.position.name : "-"} icon="briefcase" />

        {/* Sector */}
        <DetailField label="Setor" value={user.sector ? user.sector.name : "-"} icon="building" />
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
  emptyText: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
  },
});
