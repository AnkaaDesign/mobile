import { View, StyleSheet } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import { IconBrush } from "@tabler/icons-react-native";
import { AIRBRUSHING_STATUS, AIRBRUSHING_STATUS_LABELS } from '@/constants';
import { getBadgeVariantFromStatus } from "@/components/ui/badge";

interface AirbrushingTaskCardProps {
  airbrushing: any;
}

export function AirbrushingTaskCard({ airbrushing }: AirbrushingTaskCardProps) {
  const { colors } = useTheme();

  const statusBadgeVariant = getBadgeVariantFromStatus(airbrushing.status, "AIRBRUSHING_STATUS");

  if (!airbrushing.task) {
    return (
      <DetailCard title="Informações da Aerografia" icon="brush">
        <DetailField
          label="Status Atual"
          icon="info-circle"
          value={
            <Badge variant={statusBadgeVariant}>
              {AIRBRUSHING_STATUS_LABELS[airbrushing.status as AIRBRUSHING_STATUS]}
            </Badge>
          }
        />
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted + "30" }]}>
            <IconBrush size={32} color={colors.mutedForeground} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>
            Nenhuma tarefa vinculada
          </ThemedText>
          <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
            Este airbrushing não possui uma tarefa vinculada.
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  return (
    <DetailCard title="Informações da Aerografia" icon="brush">
      <DetailField
        label="Status Atual"
        icon="info-circle"
        value={
          <Badge variant={statusBadgeVariant}>
            {AIRBRUSHING_STATUS_LABELS[airbrushing.status as AIRBRUSHING_STATUS]}
          </Badge>
        }
      />

      <DetailField
        label="Nome da Tarefa"
        icon="clipboard-list"
        value={airbrushing.task.name}
      />

      {airbrushing.task.customer && (
        <DetailField
          label="Cliente"
          icon="user"
          value={airbrushing.task.customer.fantasyName}
        />
      )}

      {airbrushing.task.truck && (
        <DetailField
          label="Veículo"
          icon="truck"
          value={`${airbrushing.task.truck.model} - ${airbrushing.task.truck.plate}`}
        />
      )}

      {airbrushing.task.serialNumber && (
        <DetailField
          label="Número de Série"
          icon="hash"
          value={airbrushing.task.serialNumber}
          monospace
        />
      )}

      {(airbrushing.task.logoPaints?.length || airbrushing.task.generalPainting) && (
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
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
