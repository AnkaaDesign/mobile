import { View, StyleSheet } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { Badge } from "@/components/ui/badge";
import { AIRBRUSHING_STATUS, AIRBRUSHING_STATUS_LABELS } from '@/constants';
import { getBadgeVariantFromStatus } from "@/components/ui/badge";
import { spacing } from "@/constants/design-system";

interface AirbrushingInfoCardProps {
  airbrushing: any;
}

export function AirbrushingInfoCard({ airbrushing }: AirbrushingInfoCardProps) {
  const statusBadgeVariant = getBadgeVariantFromStatus(airbrushing.status, "AIRBRUSHING_STATUS");

  return (
    <DetailCard title="Informações do Airbrushing" icon="brush">
      <DetailField
        label="Status Atual"
        icon="info-circle"
        value={
          <Badge variant={statusBadgeVariant}>
            {AIRBRUSHING_STATUS_LABELS[airbrushing.status as AIRBRUSHING_STATUS]}
          </Badge>
        }
      />

      {(airbrushing.task?.logoPaints?.length || airbrushing.task?.generalPainting) && (
        <>
          {(airbrushing.task.generalPainting as any)?.paint && (
            <DetailField
              label="Tinta Geral"
              icon="paint"
              value={
                <Badge variant="secondary">
                  {(airbrushing.task.generalPainting as any)?.paint?.name}
                </Badge>
              }
            />
          )}

          {(airbrushing.task.logoPaints?.length ?? 0) > 0 && (
            <DetailField
              label={`Tintas da Logomarca (${airbrushing.task.logoPaints?.length ?? 0})`}
              icon="paint"
              value={
                <View style={styles.badgesContainer}>
                  {airbrushing.task.logoPaints?.map((logoPaint: any) => (
                    <Badge key={logoPaint.id} variant="outline">
                      {(logoPaint as any)?.paint?.name || "Tinta sem nome"}
                    </Badge>
                  ))}
                </View>
              }
            />
          )}
        </>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
