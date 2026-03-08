
import type { User } from '../../../../types';
import { formatDate } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";

interface EmploymentInfoCardProps {
  employee: User;
}

export function EmploymentInfoCard({ employee }: EmploymentInfoCardProps) {
  const formattedAdmissional = employee.exp1StartAt ? formatDate(employee.exp1StartAt) : "Não informado";
  const formattedDismissal = employee.dismissedAt ? formatDate(employee.dismissedAt) : "-";

  // Calculate time at company
  const getTimeAtCompany = () => {
    if (!employee.exp1StartAt) return "Não informado";

    const now = employee.dismissedAt ? new Date(employee.dismissedAt) : new Date();
    const startDate = new Date(employee.exp1StartAt);
    const years = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)) % 12;

    if (years > 0) {
      return `${years} ano${years > 1 ? "s" : ""} e ${months} ${months === 1 ? "mês" : "meses"}`;
    }
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  };

  const timeAtCompany = getTimeAtCompany();

  return (
    <DetailCard title="Informações de Emprego" icon="briefcase">
      {employee.position && (
        <DetailField label="Cargo" icon="briefcase" value={employee.position.name} />
      )}

      {employee.sector && (
        <DetailField label="Setor" icon="building" value={employee.sector.name} />
      )}

      {employee.ledSector && (
        <DetailField label="Setor Liderado" icon="user-check" value={employee.ledSector.name} />
      )}

      <DetailField label="Data de Admissão" icon="calendar" value={formattedAdmissional} />

      {employee.dismissedAt && (
        <DetailField label="Data de Desligamento" icon="calendar" value={formattedDismissal} />
      )}

      <DetailField label="Tempo na Empresa" icon="calendar" value={timeAtCompany} />

      {employee.payrollNumber && (
        <DetailField label="Número de Folha" icon="user-check" value={employee.payrollNumber.toString()} />
      )}

      {/* Performance Level */}
      {employee.performanceLevel !== undefined && employee.performanceLevel !== null && (
        <DetailField
          label="Nível de Desempenho"
          icon="user-check"
          value={
            <Badge
              variant={
                employee.performanceLevel >= 4 ? "success" :
                employee.performanceLevel >= 3 ? "info" :
                employee.performanceLevel >= 2 ? "warning" :
                "destructive"
              }
            >
              Nível {employee.performanceLevel}
            </Badge>
          }
        />
      )}
    </DetailCard>
  );
}
