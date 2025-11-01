
import { View, StyleSheet } from "react-native";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { IconHistory } from "@tabler/icons-react-native";
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
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
    <Card>
      <CardHeader>
        <View style={styles.headerContainer}>
          <View style={StyleSheet.flatten([styles.iconContainer, { backgroundColor: colors.primary + "20" }])}>
            <IconHistory size={20} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.title, { color: colors.foreground }])}>
            Histórico do Empréstimo
          </ThemedText>
        </View>
      </CardHeader>
      <CardContent>
        <ChangelogTimeline
          entityType={CHANGE_LOG_ENTITY_TYPE.BORROW}
          entityId={borrow.id}
          entityName={`Empréstimo #${borrow.id.slice(0, 8)}`}
          entityCreatedAt={borrow.createdAt}
          maxHeight={maxHeight}
          limit={50}
        />
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconContainer: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
