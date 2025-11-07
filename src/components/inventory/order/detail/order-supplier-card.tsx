import React from "react";
import { View, Linking, TouchableOpacity , StyleSheet} from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatCNPJ } from '../../../../utils';
import type { Supplier } from '../../../../types';
import { IconPhone, IconMail, IconMapPin, IconBuilding } from "@tabler/icons-react-native";

interface OrderSupplierCardProps {
  supplier: Supplier;
}

export const OrderSupplierCard: React.FC<OrderSupplierCardProps> = ({ supplier }) => {
  const { colors } = useTheme();

  const handleCallPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleSendEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleOpenAddress = () => {
    const address = `${supplier.address}, ${supplier.city}, ${supplier.state}, ${supplier.zipCode}`;
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconBuilding size={20} color={colors.primary} />
        <ThemedText style={styles.title}>Fornecedor</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <ThemedText style={styles.supplierName}>{supplier.fantasyName}</ThemedText>
        </View>

        {supplier.corporateName && (
          <View style={styles.row}>
            <ThemedText style={styles.label}>Razão Social:</ThemedText>
            <ThemedText style={styles.value}>{supplier.corporateName}</ThemedText>
          </View>
        )}

        {supplier.cnpj && (
          <View style={styles.row}>
            <ThemedText style={styles.label}>CNPJ:</ThemedText>
            <ThemedText style={styles.value}>{formatCNPJ(supplier.cnpj)}</ThemedText>
          </View>
        )}


        {supplier.phones && supplier.phones.length > 0 && (
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => handleCallPhone(supplier.phones[0])}
          >
            <IconPhone size={16} color={colors.primary} />
            <ThemedText style={StyleSheet.flatten([styles.value, styles.link])}>
              {supplier.phones[0]}
            </ThemedText>
          </TouchableOpacity>
        )}

        {supplier.email && (
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => handleSendEmail(supplier.email!)}
          >
            <IconMail size={16} color={colors.primary} />
            <ThemedText style={StyleSheet.flatten([styles.value, styles.link])}>
              {supplier.email}
            </ThemedText>
          </TouchableOpacity>
        )}

        {supplier.address && (
          <TouchableOpacity
            style={StyleSheet.flatten([styles.actionRow, styles.addressRow])}
            onPress={handleOpenAddress}
          >
            <IconMapPin size={16} color={colors.primary} />
            <View style={styles.addressContent}>
              <ThemedText style={StyleSheet.flatten([styles.value, styles.link])}>
                {supplier.address}
              </ThemedText>
              {supplier.city && supplier.state && (
                <ThemedText style={StyleSheet.flatten([styles.value, styles.link])}>
                  {supplier.city}, {supplier.state}
                </ThemedText>
              )}
              {supplier.zipCode && (
                <ThemedText style={StyleSheet.flatten([styles.value, styles.link])}>
                  CEP: {supplier.zipCode}
                </ThemedText>
              )}
            </View>
          </TouchableOpacity>
        )}

      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  content: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  addressRow: {
    alignItems: "flex-start",
  },
  addressIcon: {
    marginTop: 2,
  },
  addressContent: {
    flex: 1,
  },
  supplierName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  link: {
    color: undefined, // Will use theme's primary color
    textDecorationLine: "underline",
  },
  notesRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  notes: {
    fontSize: fontSize.sm,
    opacity: 0.8,
    lineHeight: fontSize.sm * 1.5,
  },
});