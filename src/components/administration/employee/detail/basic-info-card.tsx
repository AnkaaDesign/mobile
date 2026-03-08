
import { Linking } from "react-native";
import type { User } from '../../../../types';
import { formatBrazilianPhone, getUserStatusBadgeText } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { USER_STATUS } from "@/constants";
import { DetailCard, DetailField, DetailPhoneField, DetailSection } from "@/components/ui/detail-page-layout";

interface BasicInfoCardProps {
  employee: User;
}

export function BasicInfoCard({ employee }: BasicInfoCardProps) {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case USER_STATUS.EFFECTED:
      case USER_STATUS.EXPERIENCE_PERIOD_1:
      case USER_STATUS.EXPERIENCE_PERIOD_2:
        return "success";
      case USER_STATUS.DISMISSED:
        return "destructive";
      case "ON_VACATION":
        return "warning";
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
            <Badge variant={getBadgeVariant(employee.status)}>
              {getUserStatusBadgeText(employee)}
            </Badge>
          }
        />
      </DetailSection>
    </DetailCard>
  );
}
