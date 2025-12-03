
import { View, StyleSheet, Linking, TouchableOpacity, Alert } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconMapPin, IconExternalLink } from "@tabler/icons-react-native";
import type { Customer } from '../../../../types';
import { formatCEP } from "@/utils";
// import { showToast } from "@/components/ui/toast";

interface AddressCardProps {
  customer: Customer;
}

export function AddressCard({ customer }: AddressCardProps) {
  const { colors } = useTheme();

  const hasAddress = customer.address || customer.city || customer.state || customer.zipCode;

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
      Alert.alert("Aviso", "Endereço incompleto");
      return;
    }

    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir o mapa");
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
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconMapPin size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Endereço</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {hasAddress ? (
          <View style={styles.addressContainer}>
            {/* Full Address Display */}
            {fullAddress && (
              <TouchableOpacity
                onPress={handleOpenMaps}
                style={StyleSheet.flatten([
                  styles.fullAddressBox,
                  {
                    backgroundColor: colors.muted + "30",
                  },
                ])}
                activeOpacity={0.7}
              >
                <View style={styles.addressBoxContent}>
                  <View style={styles.addressBoxHeader}>
                    <IconMapPin size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.addressBoxLabel, { color: colors.mutedForeground }])}>
                      Endereço Completo
                    </ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.addressBoxValue, { color: colors.foreground }])}>
                    {fullAddress}
                  </ThemedText>
                  <View style={styles.openMapsRow}>
                    <ThemedText style={StyleSheet.flatten([styles.openMapsText, { color: colors.primary }])}>
                      Abrir no Google Maps
                    </ThemedText>
                    <IconExternalLink size={14} color={colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Address Components */}
            <View style={styles.fieldsContainer}>
              {customer.address && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <View style={styles.fieldLabelWithIcon}>
                    <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                      Street
                    </ThemedText>
                  </View>
                  <ThemedText
                    style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {customer.address}
                  </ThemedText>
                </View>
              )}

              {customer.addressNumber && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Número
                  </ThemedText>
                  <ThemedText
                    style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {customer.addressNumber}
                  </ThemedText>
                </View>
              )}

              {customer.addressComplement && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Complemento
                  </ThemedText>
                  <ThemedText
                    style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {customer.addressComplement}
                  </ThemedText>
                </View>
              )}

              {customer.neighborhood && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Bairro
                  </ThemedText>
                  <ThemedText
                    style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {customer.neighborhood}
                  </ThemedText>
                </View>
              )}

              {customer.city && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Cidade
                  </ThemedText>
                  <ThemedText
                    style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {customer.city}
                  </ThemedText>
                </View>
              )}

              {customer.state && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Estado
                  </ThemedText>
                  <ThemedText
                    style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {customer.state}
                  </ThemedText>
                </View>
              )}

              {customer.zipCode && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    CEP
                  </ThemedText>
                  <ThemedText
                    style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground, fontFamily: "monospace" }])}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatCEP(customer.zipCode)}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
              <IconMapPin size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
              Nenhum endereço cadastrado
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
              Este cliente não possui endereço cadastrado.
            </ThemedText>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  addressContainer: {
    gap: spacing.xl,
  },
  fullAddressBox: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  addressBoxContent: {
    gap: spacing.md,
  },
  addressBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  addressBoxLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  addressBoxValue: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
  },
  openMapsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  openMapsText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldsContainer: {
    gap: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    minWidth: 80,
    flexShrink: 0,
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
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
