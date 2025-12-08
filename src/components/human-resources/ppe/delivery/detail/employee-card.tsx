
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { IconUser, IconMail, IconBadge, IconBuilding } from "@tabler/icons-react-native";
import { formatCPF } from "@/utils";
import type { PpeDelivery } from '../../../../../types';

interface EmployeeCardProps {
  delivery: PpeDelivery;
}

export function EmployeeCard({ delivery }: EmployeeCardProps) {
  const { colors } = useTheme();
  const user = delivery.user;

  if (!user) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconUser size={20} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>Funcionário</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <IconUser size={16} color={colors.mutedForeground} style={styles.infoIcon} />
              <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Nome</ThemedText>
            </View>
            <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{user.name}</ThemedText>
          </View>

          {user.email && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <IconMail size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Email</ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])} numberOfLines={1}>
                {user.email}
              </ThemedText>
            </View>
          )}

          {user.cpf && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <IconBadge size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>CPF</ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{formatCPF(user.cpf)}</ThemedText>
            </View>
          )}

          {user.position?.sector?.name && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <IconBuilding size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Setor</ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{user.position.sector.name}</ThemedText>
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
  infoContainer: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    maxWidth: "60%",
    textAlign: "right",
  },
});
