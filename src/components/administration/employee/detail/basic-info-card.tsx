
import { Linking } from "react-native";
import type { User } from '../../../../types';
import { formatBrazilianPhone, getUserStatusBadgeText, getCollaboratorStatus, formatDate } from "@/utils";
import { CONTRACT_TYPE_LABELS } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailPhoneField, DetailSection } from "@/components/ui/detail-page-layout";

interface BasicInfoCardProps {
  employee: User;
}

export function BasicInfoCard({ employee }: BasicInfoCardProps) {
  // Single canonical derivation drives the badge color; the label keeps the
  // time-since suffix from getUserStatusBadgeText.
  const status = getCollaboratorStatus(employee);

  const handleEmailPress = () => {
    if (employee.email) {
      Linking.openURL(`mailto:${employee.email}`);
    }
  };

  return (
    <DetailCard title="Informações Básicas" icon="user">
      <DetailSection title="Identificação">
        <DetailField label="Nome" icon="id" value={employee.name} />

        {employee.email && (
          <DetailField
            label="E-mail"
            icon="mail"
            value={employee.email}
          />
        )}

        {employee.phone && (
          <DetailPhoneField
            label="Telefone"
            icon="phone"
            phone={employee.phone}
          />
        )}

        {employee.birth && (
          <DetailField
            label="Data de Nascimento"
            icon="calendar"
            value={formatDate(employee.birth)}
          />
        )}

        <DetailField
          label="Situação"
          icon="shield-check"
          value={
            <Badge variant={status.variant}>
              {getUserStatusBadgeText(employee)}
            </Badge>
          }
        />

        {employee.currentContractType && (
          <DetailField
            label="Modalidade"
            icon="file-text"
            value={
              <Badge variant="outline">
                {CONTRACT_TYPE_LABELS[employee.currentContractType]}
              </Badge>
            }
          />
        )}
      </DetailSection>
    </DetailCard>
  );
}
