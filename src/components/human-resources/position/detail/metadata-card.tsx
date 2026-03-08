
import type { Position } from '../../../../types';
import { formatDateTime } from "@/utils";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";

interface MetadataCardProps {
  position: Position;
}

export function MetadataCard({ position }: MetadataCardProps) {
  return (
    <DetailCard title="Informações do Sistema" icon="clock">
      <DetailField
        label="Criado em"
        icon="calendar"
        value={formatDateTime(new Date(position.createdAt))}
      />
      <DetailField
        label="Atualizado em"
        icon="clock"
        value={formatDateTime(new Date(position.updatedAt))}
      />
    </DetailCard>
  );
}
