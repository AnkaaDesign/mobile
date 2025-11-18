import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconHistory } from "@tabler/icons-react-native";
import type { ExternalWithdrawal } from "@/types";
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

interface ExternalWithdrawalChangelogCardProps {
  withdrawal: ExternalWithdrawal;
}

export function ExternalWithdrawalChangelogCard({ withdrawal }: ExternalWithdrawalChangelogCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
          <IconHistory size={20} color={colors.primary} />
        </View>
        <ThemedText style={styles.headerTitle}>Histórico de Alterações</ThemedText>
      </View>

      {/* Changelog Timeline */}
      <View style={styles.content}>
        <ChangelogTimeline
          entityType={CHANGE_LOG_ENTITY_TYPE.EXTERNAL_WITHDRAWAL}
          entityId={withdrawal.id}
          entityName={`Retirada Externa - ${withdrawal.withdrawerName}`}
          entityCreatedAt={withdrawal.createdAt}
          maxHeight={500}
          limit={100}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
});
