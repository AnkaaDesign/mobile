import React from "react";
import { TouchableOpacity, Linking, StyleSheet} from "react-native";
import { DetailCard, DetailField, DetailPhoneField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { fontSize } from "@/constants/design-system";
import { formatCPF, formatCNPJ } from "@/utils";
import type { Customer } from '../../../../types';

interface TaskCustomerCardProps {
  customer: Customer;
}

export const TaskCustomerCard: React.FC<TaskCustomerCardProps> = ({ customer }) => {
  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const formattedDocument = customer.cpf
    ? formatCPF(customer.cpf)
    : customer.cnpj
    ? formatCNPJ(customer.cnpj)
    : null;

  // Build address string
  const addressParts: string[] = [];
  if (customer.address) addressParts.push(customer.address);
  if (customer.neighborhood) addressParts.push(customer.neighborhood);
  if (customer.city || customer.state) {
    const cityState = [customer.city, customer.state].filter(Boolean).join(" - ");
    addressParts.push(cityState);
  }
  if (customer.zipCode) addressParts.push(`CEP: ${customer.zipCode}`);
  const fullAddress = addressParts.join("\n");

  return (
    <DetailCard title="Razão Social" icon="user">
      <DetailField
        label="Nome"
        icon="building"
        value={customer.corporateName || customer.fantasyName}
      />

      {formattedDocument && (
        <DetailField
          label={customer.cpf ? "CPF" : "CNPJ"}
          icon="id"
          value={formattedDocument}
          monospace
        />
      )}

      {customer.email && (
        <DetailField
          label="E-mail"
          icon="mail"
          value={
            <TouchableOpacity
              onPress={() => handleEmail(customer.email!)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.linkText}>
                {customer.email}
              </ThemedText>
            </TouchableOpacity>
          }
        />
      )}

      {customer.phones && customer.phones.length > 0 && (
        <DetailPhoneField
          label="Telefone"
          phone={customer.phones[0]}
          icon="phone"
        />
      )}

      {fullAddress && (
        <DetailField
          label="Endereço"
          icon="map-pin"
          value={fullAddress}
        />
      )}
    </DetailCard>
  );
};

const styles = StyleSheet.create({
  linkText: {
    color: "#3b82f6",
    fontSize: fontSize.sm,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});