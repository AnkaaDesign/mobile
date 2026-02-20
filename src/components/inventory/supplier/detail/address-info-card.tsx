import { View, StyleSheet, Linking, TouchableOpacity, Alert } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconMapPin, IconExternalLink } from "@tabler/icons-react-native";
import type { Supplier } from "@/types";
import { formatCEP } from "@/utils";

interface AddressInfoCardProps {
  supplier: Supplier;
}

export function AddressInfoCard({ supplier }: AddressInfoCardProps) {
  const { colors } = useTheme();

  const hasAddress = supplier.address || supplier.city || supplier.state || supplier.zipCode;

  const handleOpenMaps = () => {
    const addressParts = [
      supplier.address,
      supplier.addressNumber,
      supplier.neighborhood,
      supplier.city,
      supplier.state,
      supplier.zipCode,
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

    if (supplier.address) {
      let streetLine = supplier.address;
      if (supplier.addressNumber) {
        streetLine += `, ${supplier.addressNumber}`;
      }
      parts.push(streetLine);
    }

    if (supplier.addressComplement) {
      parts.push(supplier.addressComplement);
    }

    if (supplier.neighborhood) {
      parts.push(supplier.neighborhood);
    }

    if (supplier.city || supplier.state) {
      const cityState = [supplier.city, supplier.state].filter(Boolean).join(" - ");
      parts.push(cityState);
    }

    if (supplier.zipCode) {
      parts.push(`CEP: ${formatCEP(supplier.zipCode)}`);
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
        {hasAddress && fullAddress ? (
          <TouchableOpacity
            onPress={handleOpenMaps}
            style={[
              styles.fullAddressBox,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.addressBoxContent}>
              <ThemedText style={[styles.addressBoxValue, { color: colors.foreground }]}>
                {fullAddress}
              </ThemedText>
              <View style={styles.openMapsRow}>
                <ThemedText style={[styles.openMapsText, { color: colors.primary }]}>
                  Abrir no Google Maps
                </ThemedText>
                <IconExternalLink size={14} color={colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted + "30" }]}>
              <IconMapPin size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nenhum endereço cadastrado
            </ThemedText>
            <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              Este fornecedor não possui endereço cadastrado.
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
    gap: spacing.md,
  },
  fullAddressBox: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  addressBoxContent: {
    gap: spacing.sm,
  },
  addressBoxValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.sm * 1.6,
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
