
import { formatCPF } from "@/utils";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import type { PpeDelivery } from '../../../../../types';

interface EmployeeCardProps {
  delivery: PpeDelivery;
}

export function EmployeeCard({ delivery }: EmployeeCardProps) {
  const user = delivery.user;

  if (!user) {
    return null;
  }

  return (
    <DetailCard title="Funcionário" icon="user">
      <DetailField label="Nome" icon="user" value={user.name} />

      {user.email && (
        <DetailField label="Email" icon="mail" value={user.email} />
      )}

      {user.cpf && (
        <DetailField label="CPF" icon="id" value={formatCPF(user.cpf)} />
      )}

      {user.sector?.name && (
        <DetailField label="Setor" icon="building" value={user.sector.name} />
      )}
    </DetailCard>
  );
}
