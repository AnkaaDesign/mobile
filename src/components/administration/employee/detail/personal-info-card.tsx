
import type { User } from '../../../../types';
import { formatBrazilianPhone, formatDate, formatZipCode } from "@/utils";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";

interface PersonalInfoCardProps {
  employee: User;
}

export function PersonalInfoCard({ employee }: PersonalInfoCardProps) {
  // Mask CPF for privacy (show only last 4 digits)
  const maskedCPF = employee.cpf
    ? `***.***.***-${employee.cpf.replace(/\D/g, "").slice(-2)}`
    : "Não informado";

  // Mask PIS for privacy
  const maskedPIS = employee.pis
    ? `***.*****.**-${employee.pis.replace(/\D/g, "").slice(-1)}`
    : "Não informado";

  const formattedPhone = employee.phone ? formatBrazilianPhone(employee.phone) : "Não informado";
  const formattedBirthDate = employee.birth ? formatDate(employee.birth) : "Não informado";

  // Build full address
  const buildAddress = () => {
    const parts = [];
    if (employee.address) parts.push(employee.address);
    if (employee.addressNumber) parts.push(employee.addressNumber);
    if (employee.addressComplement) parts.push(employee.addressComplement);

    const firstLine = parts.join(", ");

    const cityState = [];
    if (employee.city) cityState.push(employee.city);
    if (employee.state) cityState.push(employee.state);

    const secondLine = [];
    if (employee.neighborhood) secondLine.push(employee.neighborhood);
    if (cityState.length > 0) secondLine.push(cityState.join(" - "));
    if (employee.zipCode) secondLine.push(`CEP: ${formatZipCode(employee.zipCode)}`);

    const fullAddress = [firstLine, secondLine.join(" - ")].filter(Boolean).join("\n");
    return fullAddress || "Não informado";
  };

  const fullAddress = buildAddress();

  return (
    <DetailCard title="Informações Pessoais" icon="user">
      <DetailField label="CPF" icon="id" value={maskedCPF} />
      <DetailField label="PIS" icon="id" value={maskedPIS} />
      <DetailField label="Data de Nascimento" icon="calendar" value={formattedBirthDate} />
      <DetailField label="Telefone" icon="phone" value={formattedPhone} />
      <DetailField label="Endereço" icon="map-pin" value={fullAddress} />
    </DetailCard>
  );
}
