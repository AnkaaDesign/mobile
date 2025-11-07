import React from "react";
import { View, TouchableOpacity, Linking , StyleSheet} from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatBrazilianPhone, formatCPF, formatCNPJ } from '../../../../utils';
import type { Customer } from '../../../../types';
import { IconUser, IconPhone, IconMail, IconMapPin, IconId } from "@tabler/icons-react-native";

interface TaskCustomerCardProps {
  customer: Customer;
}

export const TaskCustomerCard: React.FC<TaskCustomerCardProps> = ({ customer }) => {
  const { colors } = useTheme();

  const handleCall = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const whatsappUrl = `whatsapp://send?phone=55${cleanPhone}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Linking.openURL(`https://wa.me/55${cleanPhone}`);
    });
  };

  const formattedDocument = customer.cpf
    ? formatCPF(customer.cpf)
    : customer.cnpj
    ? formatCNPJ(customer.cnpj)
    : null;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconUser size={20} color={colors.primary} />
        <ThemedText style={styles.title}>Cliente</ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText style={styles.customerName}>{customer.fantasyName}</ThemedText>

        {formattedDocument && (
          <View style={styles.infoRow}>
            <IconId size={14} color={colors.foreground} />
            <ThemedText style={styles.infoText}>
              {customer.cpf ? "CPF" : "CNPJ"}: {formattedDocument}
            </ThemedText>
          </View>
        )}

        {customer.email && (
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleEmail(customer.email!)}
            activeOpacity={0.7}
          >
            <IconMail size={14} color={colors.primary} />
            <ThemedText style={StyleSheet.flatten([styles.infoText, styles.linkText])}>
              {customer.email}
            </ThemedText>
          </TouchableOpacity>
        )}

        {customer.phones && customer.phones.length > 0 && (
          <View style={styles.phoneContainer}>
            <View style={styles.phoneInfo}>
              <IconPhone size={14} color={colors.foreground} />
              <ThemedText style={styles.phoneText}>
                {formatBrazilianPhone(customer.phones[0])}
              </ThemedText>
            </View>
            <View style={styles.phoneActions}>
              <TouchableOpacity
                onPress={() => handleCall(customer.phones[0])}
                style={StyleSheet.flatten([styles.phoneButton, { backgroundColor: colors.primary + "20" }])}
                activeOpacity={0.7}
              >
                <Icon name="phone" size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleWhatsApp(customer.phones[0])}
                style={StyleSheet.flatten([styles.phoneButton, { backgroundColor: "#25D36620" }])}
                activeOpacity={0.7}
              >
                <Icon name="message-circle" size={16} color="#25D366" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(customer.address || customer.city) && (
          <View style={styles.addressContainer}>
            <View style={styles.infoRow}>
              <IconMapPin size={14} color={colors.foreground} />
              <View style={styles.addressContent}>
                {customer.address && (
                  <ThemedText style={styles.infoText}>
                    {customer.address}
                    
                    
                  </ThemedText>
                )}
                {customer.neighborhood && (
                  <ThemedText style={styles.infoText}>
                    {customer.neighborhood}
                  </ThemedText>
                )}
                {(customer.city || customer.state) && (
                  <ThemedText style={styles.infoText}>
                    {customer.city}
                    {customer.city && customer.state && " - "}
                    {customer.state}
                  </ThemedText>
                )}
                {customer.zipCode && (
                  <ThemedText style={styles.infoText}>
                    CEP: {customer.zipCode}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
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
    // Note: borderBottomColor should be applied inline with theme colors
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  content: {
    gap: spacing.sm,
  },
  customerName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  infoIcon: {
    opacity: 0.6,
    marginTop: 2,
  },
  infoText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  linkText: {
    color: "#3b82f6",
    textDecorationLine: "underline",
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  phoneInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    flex: 1,
  },
  phoneText: {
    fontSize: fontSize.sm,
    flex: 1,
    flexWrap: "wrap",
  },
  phoneActions: {
    flexDirection: "row",
    gap: spacing.xs,
    flexShrink: 0,
  },
  phoneButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  addressContainer: {
    marginTop: spacing.xs,
  },
  addressContent: {
    flex: 1,
    gap: 2,
  },
});