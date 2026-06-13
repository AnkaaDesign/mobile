
import type { User } from '../../../../types';
import { formatDate } from "@/utils";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";

interface ProfessionalInfoCardProps {
  employee: User;
}

export function ProfessionalInfoCard({ employee }: ProfessionalInfoCardProps) {
  const contract = employee.currentContract;

  return (
    <DetailCard title="Dados Profissionais" icon="briefcase">
      <DetailSection title="Dados Funcionais">
        {employee.position && (
          <DetailField label="Cargo" icon="briefcase" value={employee.position.name} />
        )}

        {employee.sector && (
          <DetailField label="Setor" icon="building" value={employee.sector.name} />
        )}

        {employee.ledSector && (
          <DetailField label="Setor Liderado" icon="user-cog" value={employee.ledSector.name} />
        )}

        {contract?.exp1StartAt && (
          <DetailField label="Início Experiência 1" icon="calendar" value={formatDate(contract.exp1StartAt)} />
        )}

        {contract?.exp1EndAt && (
          <DetailField label="Fim Experiência 1" icon="calendar" value={formatDate(contract.exp1EndAt)} />
        )}

        {contract?.exp2StartAt && (
          <DetailField label="Início Experiência 2" icon="calendar" value={formatDate(contract.exp2StartAt)} />
        )}

        {contract?.exp2EndAt && (
          <DetailField label="Fim Experiência 2" icon="calendar" value={formatDate(contract.exp2EndAt)} />
        )}

        {contract?.effectedAt && (
          <DetailField label="Data de Efetivação" icon="calendar-check" value={formatDate(contract.effectedAt)} />
        )}

        {contract?.terminationDate && (
          <DetailField label="Data de Demissão" icon="calendar" value={formatDate(contract.terminationDate)} />
        )}
      </DetailSection>

      {/* Performance Level Section - only if > 0 */}
      {employee.performanceLevel > 0 && (
        <DetailSection title="Nível de Desempenho">
          <DetailField label="Nível de Desempenho" value={employee.performanceLevel.toString()} />
        </DetailSection>
      )}
    </DetailCard>
  );
}
