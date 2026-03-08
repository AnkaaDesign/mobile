
import type { Position } from '../../../../types';
import { formatDateTime, formatCurrency } from "@/utils";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";

interface SpecificationsCardProps {
  position: Position;
}

export function SpecificationsCard({ position }: SpecificationsCardProps) {
  const currentRemuneration = position.remuneration ?? 0;

  return (
    <DetailCard title="Especificações" icon="info-circle">
      <DetailSection title="Informações Básicas">
        <DetailField label="Nome" icon="tag" value={position.name} />
        <DetailField
          label="Hierarquia"
          icon="hierarchy"
          value={position.hierarchy !== null && position.hierarchy !== undefined ? String(position.hierarchy) : "-"}
        />
        <DetailField
          label="Remuneração Atual"
          icon="currency-dollar"
          value={currentRemuneration ? formatCurrency(currentRemuneration) : "-"}
        />
        <DetailField
          label="Funcionários"
          icon="users"
          value={`${position._count?.users || 0} funcionário${(position._count?.users || 0) !== 1 ? 's' : ''}`}
        />
        <DetailField
          label="Histórico de Remunerações"
          icon="history"
          value={`${position._count?.remunerations || 0} registro${(position._count?.remunerations || 0) !== 1 ? 's' : ''}`}
        />
      </DetailSection>

      <DetailSection title="Datas do Sistema">
        <DetailField
          label="Criado em"
          icon="calendar"
          value={position.createdAt ? formatDateTime(position.createdAt) : '-'}
        />
        <DetailField
          label="Atualizado em"
          icon="clock"
          value={position.updatedAt ? formatDateTime(position.updatedAt) : '-'}
        />
      </DetailSection>
    </DetailCard>
  );
}
