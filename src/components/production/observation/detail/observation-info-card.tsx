import { View, StyleSheet } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge, getBadgeVariantFromStatus } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { TASK_STATUS_LABELS } from "@/constants";
import type { Observation } from "@/types";

interface ObservationInfoCardProps {
  observation: Observation & {
    task?: {
      id: string;
      name: string;
      status: string;
      customer?: {
        id: string;
        fantasyName: string;
        corporateName?: string | null;
      };
      sector?: {
        id: string;
        name: string;
      };
    };
  };
}

export function ObservationInfoCard({ observation }: ObservationInfoCardProps) {
  const { colors } = useTheme();

  const getTaskStatusBadgeVariant = (status: string) => {
    return getBadgeVariantFromStatus(status);
  };

  return (
    <DetailCard title="Informações" icon="alert-circle">
      <DetailField
        label="Descrição"
        icon="file-text"
        value={
          <ThemedText style={[styles.descriptionText, { color: colors.foreground }]}>
            {observation.description}
          </ThemedText>
        }
      />

      {observation.task && (
        <>
          <DetailField
            label="Nome da Tarefa"
            icon="truck"
            value={observation.task.name}
          />

          <DetailField
            label="Status"
            icon="circle-check"
            value={
              <Badge variant={getTaskStatusBadgeVariant(observation.task.status)}>
                {TASK_STATUS_LABELS[observation.task.status] || observation.task.status}
              </Badge>
            }
          />

          {observation.task.customer && (
            <DetailField
              label="Cliente"
              icon="user"
              value={observation.task.customer.fantasyName || observation.task.customer.corporateName || ""}
            />
          )}

          {observation.task.sector && (
            <DetailField
              label="Setor"
              icon="building"
              value={observation.task.sector.name}
            />
          )}
        </>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  descriptionText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
});
