
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconCheck, IconX } from "@tabler/icons-react-native";
import type { Position } from '../../../../types';
import { useTheme } from "@/lib/theme";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { spacing } from "@/constants/design-system";

interface PositionCardProps {
  position: Position;
}

export function PositionCard({ position }: PositionCardProps) {
  const { colors } = useTheme();

  const remunerationCount = position._count?.remunerations || 0;

  return (
    <DetailCard title="Informações Gerais" icon="briefcase">
      <DetailField label="Nome do Cargo" icon="briefcase" value={position.name} />

      {position.hierarchy !== null && position.hierarchy !== undefined && (
        <DetailField label="Hierarquia" icon="hierarchy" value={String(position.hierarchy)} />
      )}

      <DetailField
        label="Elegível para Bonificação"
        icon="circle-check"
        value={
          <Badge variant={position.bonifiable ? "success" : "secondary"}>
            <View style={styles.badgeContent}>
              {position.bonifiable ? <IconCheck size={14} color={colors.primaryForeground} /> : <IconX size={14} color={colors.primaryForeground} />}
              <ThemedText style={{ color: colors.primaryForeground }}>
                {position.bonifiable ? "Sim" : "Não"}
              </ThemedText>
            </View>
          </Badge>
        }
      />

      <DetailField
        label="Total de Colaboradores"
        icon="users"
        value={`${position._count?.users || 0} ${position._count?.users === 1 ? "colaborador" : "colaboradores"}`}
      />

      <DetailField
        label="Histórico de Remunerações"
        icon="history"
        value={`${remunerationCount} ${remunerationCount === 1 ? "registro" : "registros"}`}
      />
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
