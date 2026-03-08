import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { PpeDelivery } from '@/types';
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";

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
    <DetailCard title="Colaborador" icon="user">
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

      {user.position && (
        <DetailField label="Cargo" icon="briefcase" value={user.position.name} />
      )}

      {user.sector && (
        <DetailField label="Setor" icon="building" value={user.sector.name} />
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
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
});
