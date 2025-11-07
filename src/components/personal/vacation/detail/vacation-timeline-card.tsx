
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconHistory } from "@tabler/icons-react-native";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { CHANGE_LOG_ENTITY_TYPE } from '../../../../constants';

interface VacationTimelineCardProps {
  vacationId: string;
  vacationName: string;
  vacationCreatedAt: Date;
  maxHeight?: number;
}

export function VacationTimelineCard({
  vacationId,
  vacationName,
  vacationCreatedAt,
  maxHeight = 400
}: VacationTimelineCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconHistory size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <ChangelogTimeline
          entityType={CHANGE_LOG_ENTITY_TYPE.VACATION}
          entityId={vacationId}
          entityName={vacationName}
          entityCreatedAt={vacationCreatedAt}
          maxHeight={maxHeight}
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
