
import { View, StyleSheet } from "react-native";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { spacing } from "@/constants/design-system";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants";

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
  return (
    <DetailCard title="Histórico de Alterações" icon="history">
      <View style={styles.content}>
        <ChangelogTimeline
          entityType={CHANGE_LOG_ENTITY_TYPE.VACATION}
          entityId={vacationId}
          entityName={vacationName}
          entityCreatedAt={vacationCreatedAt}
          maxHeight={maxHeight}
        />
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
});
