
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { DetailCard } from "@/components/ui/detail-page-layout";

interface LeaderCardProps {
  leader: {
    id: string;
    name: string;
    email: string;
  } | null | undefined;
}

export function LeaderCard({ leader }: LeaderCardProps) {
  const { colors } = useTheme();

  if (!leader) {
    return null;
  }

  return (
    <DetailCard
      title="Líder do Setor"
      icon="shield-check"
    >
      <View style={styles.leaderInfo}>
        <ThemedText style={[styles.leaderName, { color: colors.foreground }]}>
          {leader.name}
        </ThemedText>
        {leader.email && (
          <ThemedText style={[styles.leaderEmail, { color: colors.mutedForeground }]}>
            {leader.email}
          </ThemedText>
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  leaderInfo: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  leaderName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  leaderEmail: {
    fontSize: fontSize.xs,
  },
});
