
import { View, StyleSheet } from "react-native";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import type { Sector } from '../../../../types';
import { SECTOR_PRIVILEGES_LABELS, SECTOR_PRIVILEGES } from "@/constants";
import { formatDateTime } from "@/utils";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";

const getPrivilegeColor = (privilege: string) => {
  switch (privilege) {
    case SECTOR_PRIVILEGES.ADMIN:
      return "red";
    case SECTOR_PRIVILEGES.PRODUCTION:
      return "blue";
    case SECTOR_PRIVILEGES.HUMAN_RESOURCES:
    case SECTOR_PRIVILEGES.FINANCIAL:
    case SECTOR_PRIVILEGES.DESIGNER:
    case SECTOR_PRIVILEGES.LOGISTIC:
    case SECTOR_PRIVILEGES.PRODUCTION_MANAGER:
      return "purple";
    case SECTOR_PRIVILEGES.MAINTENANCE:
      return "orange";
    case SECTOR_PRIVILEGES.WAREHOUSE:
      return "green";
    case SECTOR_PRIVILEGES.EXTERNAL:
    case SECTOR_PRIVILEGES.BASIC:
    default:
      return "gray";
  }
};

interface SpecificationsCardProps {
  sector: Sector;
}

export function SpecificationsCard({ sector }: SpecificationsCardProps) {
  const { colors } = useTheme();
  const leader = sector.leader || null;

  return (
    <DetailCard title="Especificações" icon="info-circle">
      {/* Basic Information */}
      <DetailSection title="Informações Básicas">
        <DetailField label="Nome" icon="tag" value={sector.name} />

        <DetailField
          label="Privilégios"
          icon="shield-check"
          value={
            <Badge variant={getPrivilegeColor(sector.privileges) as any}>
              <ThemedText style={{ fontSize: fontSize.xs }}>
                {SECTOR_PRIVILEGES_LABELS[sector.privileges]}
              </ThemedText>
            </Badge>
          }
        />

        <DetailField
          label="Usuários"
          icon="users"
          value={`${sector._count?.users || 0} usuário${(sector._count?.users || 0) !== 1 ? "s" : ""}`}
        />

        <DetailField
          label="Tarefas"
          icon="clipboard-list"
          value={`${sector._count?.tasks || 0} tarefa${(sector._count?.tasks || 0) !== 1 ? "s" : ""}`}
        />

        {leader && (
          <DetailField
            label="Líder"
            icon="user-check"
            value={leader.name}
          />
        )}
      </DetailSection>

      {/* System Dates */}
      <View style={[styles.divider, { borderTopColor: colors.border }]} />
      <DetailSection title="Datas do Sistema">
        <DetailField
          label="Criado em"
          icon="calendar"
          value={sector.createdAt ? formatDateTime(sector.createdAt) : "-"}
        />

        <DetailField
          label="Atualizado em"
          icon="calendar"
          value={sector.updatedAt ? formatDateTime(sector.updatedAt) : "-"}
        />
      </DetailSection>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  divider: {
    borderTopWidth: 1,
    marginVertical: spacing.sm,
  },
});
