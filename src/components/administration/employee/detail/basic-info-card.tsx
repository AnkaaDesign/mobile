
import { Linking } from "react-native";
import type { User } from '../../../../types';
import { formatBrazilianPhone, getUserStatusBadgeText } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { CONTRACT_STATUS } from "@/constants";
import { DetailCard, DetailField, DetailPhoneField, DetailSection } from "@/components/ui/detail-page-layout";

interface BasicInfoCardProps {
  employee: User;
}

export function BasicInfoCard({ employee }: BasicInfoCardProps) {
  const getBadgeVariant = (status: User["currentContractStatus"]) => {
    switch (status) {
      case CONTRACT_STATUS.ACTIVE:
        return "success";
      case CONTRACT_STATUS.TERMINATED:
        return "destructive";
      default:
        return "secondary";
    }
  };

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
            phone={employee.phone}
          />
        )}

        <DetailField
          label="Status"
          icon="shield-check"
          value={
            <Badge variant={getBadgeVariant(employee.currentContractStatus)}>
              {getUserStatusBadgeText(employee)}
            </Badge>
          }
        />
      </DetailSection>
    </DetailCard>
  );
}
