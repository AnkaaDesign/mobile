import React from "react";
import { View, StyleSheet, Linking, TouchableOpacity } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconPhone, IconMail, IconExternalLink } from "@tabler/icons-react-native";
import type { Customer } from '../../../../types';
import { formatPhoneNumber } from '../../../../utils';
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

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      showToast({
        message: "Não foi possível abrir o cliente de email",
        type: "error",
      });
    });
  };

  const hasContactInfo = customer.email || (customer.phones && customer.phones.length > 0);

  if (!hasContactInfo) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconPhone size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Informações de Contato
            </ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.contactContainer}>
          {/* Email */}
          {customer.email && (
            <TouchableOpacity
              onPress={() => handleEmailPress(customer.email!)}
              style={StyleSheet.flatten([styles.contactRow, { borderBottomColor: colors.border }])}
              activeOpacity={0.7}
            >
              <View style={styles.contactInfo}>
                <View style={StyleSheet.flatten([styles.contactIcon, { backgroundColor: colors.muted }])}>
                  <IconMail size={20} color={colors.foreground} />
                </View>
                <View style={styles.contactText}>
                  <ThemedText style={StyleSheet.flatten([styles.contactLabel, { color: colors.mutedForeground }])}>
                    Email
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.contactValue, { color: colors.primary }])}>
                    {customer.email}
                  </ThemedText>
                </View>
              </View>
              <IconExternalLink size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}

          {/* Phones */}
          {customer.phones && customer.phones.length > 0 && (
            <View style={styles.phonesSection}>
              <ThemedText style={StyleSheet.flatten([styles.sectionLabel, { color: colors.mutedForeground }])}>
                Telefones
              </ThemedText>
              <View style={styles.phonesList}>
                {customer.phones.map((phone, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handlePhonePress(phone)}
                    style={StyleSheet.flatten([
                      styles.phoneItem,
                      {
                        backgroundColor: colors.muted + "30",
                        borderColor: colors.border,
                      },
                    ])}
                    activeOpacity={0.7}
                  >
                    <View style={styles.phoneInfo}>
                      <View style={StyleSheet.flatten([styles.phoneIcon, { backgroundColor: colors.primary + "15" }])}>
                        <IconPhone size={16} color={colors.primary} />
                      </View>
                      <ThemedText style={StyleSheet.flatten([styles.phoneNumber, { color: colors.foreground }])}>
                        {formatPhoneNumber(phone)}
                      </ThemedText>
                    </View>
                    <IconExternalLink size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
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
    gap: spacing.lg,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    flex: 1,
    gap: spacing.xs,
  },
  contactLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  contactValue: {
    fontSize: fontSize.base,
  },
  phonesSection: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  phonesList: {
    gap: spacing.sm,
  },
  phoneItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  phoneInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  phoneIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneNumber: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
});
