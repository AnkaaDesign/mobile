
import { Badge } from "@/components/ui/badge";
import type { Sector } from '../../../../types';
import { SECTOR_PRIVILEGES_LABELS } from "@/constants";
import { getBadgeVariant } from "@/constants/badge-colors";
import { formatDate } from "@/utils";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";

interface SectorInfoCardProps {
  sector: Sector & {
    _count?: {
      users?: number;
      tasks?: number;
    };
    leader?: {
      id: string;
      name: string;
      email: string;
    } | null;
  };
}

export function SectorInfoCard({ sector }: SectorInfoCardProps) {
  return (
    <DetailCard title="Informações Básicas" icon="info-circle">
      {/* Privilege Level */}
      <DetailField
        label="Privilégio"
        icon="shield-check"
        value={
          <Badge variant={getBadgeVariant(sector.privileges, 'SECTOR_PRIVILEGES')}>
            {SECTOR_PRIVILEGES_LABELS[sector.privileges]}
          </Badge>
        }
      />

      {/* Created At */}
      <DetailField
        label="Criado em"
        icon="calendar"
        value={formatDate(sector.createdAt)}
      />

      {/* Updated At */}
      <DetailField
        label="Atualizado em"
        icon="calendar"
        value={formatDate(sector.updatedAt)}
      />
    </DetailCard>
  );
}
