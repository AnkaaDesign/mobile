import React from "react";
import { View, StyleSheet, Linking, TouchableOpacity } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconMapPin, IconExternalLink } from "@tabler/icons-react-native";
import type { Customer } from '../../../../types';
import { formatCEP } from '../../../../utils';
import { showToast } from "@/components/ui/toast";

interface AddressCardProps {
  customer: Customer;
}

export function AddressCard({ customer }: AddressCardProps) {
  const { colors } = useTheme();

  const hasAddress = customer.address || customer.city || customer.state || customer.zipCode;

  if (!hasAddress) {
    return null;
  }

  const handleOpenMaps = () => {
    const addressParts = [
      customer.address,
      customer.addressNumber,
      customer.neighborhood,
      customer.city,
      customer.state,
      customer.zipCode,
    ].filter(Boolean);

    const fullAddress = addressParts.join(", ");

    if (!fullAddress) {
      showToast({
        message: "Endereço incompleto",
        type: "warning",
      });
      return;
    }

    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    Linking.openURL(url).catch(() => {
      showToast({
        message: "Não foi possível abrir o mapa",
        type: "error",
      });
    });
  };

  const getFullAddress = () => {
    const parts = [];

    if (customer.address) {
      let streetLine = customer.address;
      if (customer.addressNumber) {
        streetLine += `, ${customer.addressNumber}`;
      }
      parts.push(streetLine);
    }

    if (customer.addressComplement) {
      parts.push(customer.addressComplement);
    }

    if (customer.neighborhood) {
      parts.push(customer.neighborhood);
    }

    if (customer.city || customer.state) {
      const cityState = [customer.city, customer.state].filter(Boolean).join(" - ");
      parts.push(cityState);
    }

    if (customer.zipCode) {
      parts.push(`CEP: ${formatCEP(customer.zipCode)}`);
    }

    return parts.join("\n");
  };

  const fullAddress = getFullAddress();

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconMapPin size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Endereço
            </ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TouchableOpacity
          onPress={handleOpenMaps}
          style={StyleSheet.flatten([
            styles.addressContainer,
            {
              backgroundColor: colors.muted + "20",
              borderColor: colors.border,
            },
          ])}
          activeOpacity={0.7}
        >
          <View style={styles.addressContent}>
            <View style={StyleSheet.flatten([styles.mapIcon, { backgroundColor: colors.primary + "15" }])}>
              <IconMapPin size={24} color={colors.primary} />
            </View>
            <View style={styles.addressText}>
              <ThemedText style={StyleSheet.flatten([styles.addressValue, { color: colors.foreground }])}>
                {fullAddress}
              </ThemedText>
              <View style={styles.openMapsRow}>
                <ThemedText style={StyleSheet.flatten([styles.openMapsText, { color: colors.primary }])}>
                  Abrir no Google Maps
                </ThemedText>
                <IconExternalLink size={14} color={colors.primary} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Individual Address Fields */}
        <View style={styles.addressDetails}>
          {customer.address && (
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Logradouro
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {customer.address}
                {customer.addressNumber ? `, ${customer.addressNumber}` : ""}
              </ThemedText>
            </View>
          )}

          {customer.addressComplement && (
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Complemento
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {customer.addressComplement}
              </ThemedText>
            </View>
          )}

          {customer.neighborhood && (
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Bairro
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {customer.neighborhood}
              </ThemedText>
            </View>
          )}

          {(customer.city || customer.state) && (
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Cidade/Estado
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {[customer.city, customer.state].filter(Boolean).join(" - ")}
              </ThemedText>
            </View>
          )}

          {customer.zipCode && (
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                CEP
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {formatCEP(customer.zipCode)}
              </ThemedText>
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
  addressContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  addressContent: {
    flexDirection: "row",
    gap: spacing.md,
  },
  mapIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  addressText: {
    flex: 1,
    gap: spacing.md,
  },
  addressValue: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
  },
  openMapsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  openMapsText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  addressDetails: {
    gap: spacing.md,
  },
  detailRow: {
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.base,
  },
});
