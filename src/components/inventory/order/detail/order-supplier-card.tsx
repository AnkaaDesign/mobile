import React from "react";
import { View, Linking, TouchableOpacity, StyleSheet} from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField, DetailPhoneField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatCNPJ } from "@/utils";
import type { Supplier } from '../../../../types';
import { IconMapPin, IconExternalLink } from "@tabler/icons-react-native";

interface OrderSupplierCardProps {
  supplier: Supplier;
}

export const OrderSupplierCard: React.FC<OrderSupplierCardProps> = ({ supplier }) => {
  const { colors } = useTheme();

  const handleSendEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleOpenAddress = () => {
    const address = `${supplier.address}, ${supplier.city}, ${supplier.state}, ${supplier.zipCode}`;
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
  };

  return (
    <DetailCard title="Fornecedor" icon="building">
      <DetailField
        label="Nome Fantasia"
        value={supplier.fantasyName}
        icon="building"
      />

      {supplier.corporateName && (
        <DetailField
          label="Razão Social"
          value={supplier.corporateName}
          icon="building"
        />
      )}

      {supplier.cnpj && (
        <DetailField
          label="CNPJ"
          value={formatCNPJ(supplier.cnpj)}
          icon="certificate"
          monospace
        />
      )}

      {supplier.phones && supplier.phones.length > 0 && (
        <DetailPhoneField
          label="Telefone"
          phone={supplier.phones[0]}
          icon="phone"
        />
      )}

      {supplier.email && (
        <DetailField
          label="E-mail"
          icon="mail"
          value={
            <TouchableOpacity
              onPress={() => handleSendEmail(supplier.email!)}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.linkText, { color: colors.primary }]}>
                {supplier.email}
              </ThemedText>
            </TouchableOpacity>
          }
        />
      )}

      {supplier.address && (
        <DetailField
          label="Endereço"
          icon="map-pin"
          value={
            <TouchableOpacity
              onPress={handleOpenAddress}
              activeOpacity={0.7}
              style={styles.addressContainer}
            >
              <View style={styles.addressContent}>
                <ThemedText style={[styles.linkText, { color: colors.primary }]}>
                  {supplier.address}
                </ThemedText>
                {supplier.city && supplier.state && (
                  <ThemedText style={[styles.linkText, { color: colors.primary }]}>
                    {supplier.city}, {supplier.state}
                  </ThemedText>
                )}
                {supplier.zipCode && (
                  <ThemedText style={[styles.linkText, { color: colors.primary }]}>
                    CEP: {supplier.zipCode}
                  </ThemedText>
                )}
              </View>
            </TouchableOpacity>
          }
        />
      )}
    </DetailCard>
  );
};

const styles = StyleSheet.create({
  linkText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressContent: {
    flex: 1,
    gap: spacing.xs,
  },
});
