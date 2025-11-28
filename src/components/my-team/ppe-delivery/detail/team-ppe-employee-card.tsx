import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconUser, IconBriefcase, IconBuilding } from "@tabler/icons-react-native";
import type { PpeDelivery } from '@/types';

interface TeamPpeEmployeeCardProps {
  delivery: PpeDelivery;
}

export function TeamPpeEmployeeCard({ delivery }: TeamPpeEmployeeCardProps) {
  const { colors } = useTheme();

  if (!delivery.user) {
    return null;
  }

  const user = delivery.user;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconUser size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Colaborador</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* User Avatar and Name */}
        <View style={styles.userHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
            <ThemedText style={[styles.avatarText, { color: colors.foreground }]}>
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.userName, { color: colors.foreground }]}>
              {user.name}
            </ThemedText>
            {user.email && (
              <ThemedText style={[styles.userEmail, { color: colors.mutedForeground }]}>
                {user.email}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Position */}
        {user.position && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <IconBriefcase size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Cargo
              </ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
              {user.position.name}
            </ThemedText>
          </View>
        )}

        {/* Sector */}
        {user.sector && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <IconBuilding size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Setor
              </ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
              {user.sector.name}
            </ThemedText>
          </View>
        )}
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
    gap: spacing.sm,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  userEmail: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
});
