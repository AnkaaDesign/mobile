import React from "react";
import { View, StyleSheet, Linking, TouchableOpacity } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconPhone, IconMail, IconPhoneCall, IconWorld, IconBrandWhatsapp } from "@tabler/icons-react-native";
import type { Customer } from '../../../../types';
import { formatBrazilianPhone } from '../../../../utils';
import { showToast } from "@/components/ui/toast";

interface ContactInfoCardProps {
  customer: Customer;
}

export function ContactInfoCard({ customer }: ContactInfoCardProps) {
  const { colors } = useTheme();

  const handlePhonePress = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      showToast({
        message: "Não foi possível abrir o discador",
        type: "error",
      });
    });
  };

  const handleWhatsAppPress = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const whatsappNumber = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    Linking.openURL(`https://wa.me/${whatsappNumber}`).catch(() => {
      showToast({
        message: "Não foi possível abrir o WhatsApp",
        type: "error",
      });
    });
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      showToast({
        message: "Não foi possível abrir o cliente de email",
        type: "error",
      });
    });
  };

  const handleWebsitePress = (site: string) => {
    const url = site.startsWith("http") ? site : `https://${site}`;
    Linking.openURL(url).catch(() => {
      showToast({
        message: "Não foi possível abrir o site",
        type: "error",
      });
    });
  };

  const hasContactInfo = customer.email || (customer.phones && customer.phones.length > 0) || customer.site;

  if (!hasContactInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle style={styles.sectionTitle}>
            <View style={styles.titleRow}>
              <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                <IconPhoneCall size={18} color={colors.primary} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
                Informações de Contato
              </ThemedText>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.emptyState}>
            <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
              <IconPhoneCall size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
              Nenhuma informação de contato
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
              Este cliente não possui informações de contato cadastradas.
            </ThemedText>
          </View>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconPhoneCall size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Informações de Contato
            </ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.contactContainer}>
          {/* Email Section */}
          {customer.email && (
            <View style={styles.section}>
              <ThemedText style={StyleSheet.flatten([styles.sectionHeader, { color: colors.foreground }])}>
                E-mail
              </ThemedText>
              <TouchableOpacity
                onPress={() => handleEmailPress(customer.email!)}
                style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}
                activeOpacity={0.7}
              >
                <View style={styles.fieldLabelWithIcon}>
                  <IconMail size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    E-mail Principal
                  </ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.fieldValueLink, { color: "#16a34a" }])}>
                  {customer.email}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Phone Numbers Section */}
          {customer.phones && customer.phones.length > 0 && (
            <View style={StyleSheet.flatten([
              styles.section,
              customer.email && styles.sectionWithBorder,
              customer.email && { borderTopColor: colors.border + "50" }
            ])}>
              <ThemedText style={StyleSheet.flatten([styles.sectionHeader, { color: colors.foreground }])}>
                Telefones
              </ThemedText>
              <View style={styles.fieldsContainer}>
                {customer.phones.map((phone, index) => (
                  <View
                    key={index}
                    style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}
                  >
                    <View style={styles.fieldLabelWithIcon}>
                      <IconPhone size={16} color={colors.mutedForeground} />
                      <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                        Telefone {customer.phones.length > 1 ? `${index + 1}` : ""}
                      </ThemedText>
                    </View>
                    <View style={styles.phoneActions}>
                      <TouchableOpacity
                        onPress={() => handlePhonePress(phone)}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={StyleSheet.flatten([styles.fieldValueLink, { color: "#16a34a" }])}>
                          {formatBrazilianPhone(phone)}
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleWhatsAppPress(phone)}
                        activeOpacity={0.7}
                        style={styles.whatsappButton}
                      >
                        <IconBrandWhatsapp size={20} color="#16a34a" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Website Section */}
          {customer.site && (
            <View style={StyleSheet.flatten([
              styles.section,
              (customer.email || (customer.phones && customer.phones.length > 0)) && styles.sectionWithBorder,
              (customer.email || (customer.phones && customer.phones.length > 0)) && { borderTopColor: colors.border + "50" }
            ])}>
              <ThemedText style={StyleSheet.flatten([styles.sectionHeader, { color: colors.foreground }])}>
                Website
              </ThemedText>
              <TouchableOpacity
                onPress={() => handleWebsitePress(customer.site!)}
                style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}
                activeOpacity={0.7}
              >
                <View style={styles.fieldLabelWithIcon}>
                  <IconWorld size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Site
                  </ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.fieldValueLink, { color: "#16a34a" }])}>
                  {customer.site}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  contactContainer: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.lg,
  },
  sectionWithBorder: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  sectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  fieldsContainer: {
    gap: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fieldValueLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  phoneActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  whatsappButton: {
    padding: spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
