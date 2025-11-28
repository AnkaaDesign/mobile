
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { IconHistory } from "@tabler/icons-react-native";
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import type { Borrow } from "@/types";

interface BorrowHistoryCardProps {
  borrow: Borrow & {
    item?: { name: string };
    user?: { name: string };
  };
  maxHeight?: number;
}

export function BorrowHistoryCard({ borrow, maxHeight = 500 }: BorrowHistoryCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconHistory size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Histórico do Empréstimo</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <ChangelogTimeline
          entityType={CHANGE_LOG_ENTITY_TYPE.BORROW}
          entityId={borrow.id}
          entityName={`Empréstimo #${borrow.id.slice(0, 8)}`}
          entityCreatedAt={borrow.createdAt}
          maxHeight={maxHeight}
          limit={50}
        />
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
});
