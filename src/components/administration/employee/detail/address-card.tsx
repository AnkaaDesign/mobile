
import { View, StyleSheet, Linking, TouchableOpacity, Alert } from "react-native";
import type { User } from '../../../../types';
import { formatDate, getAge } from "@/utils";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconUser, IconExternalLink } from "@tabler/icons-react-native";

interface AddressCardProps {
  employee: User;
}

export function AddressCard({ employee }: AddressCardProps) {
  const { colors } = useTheme();

  const hasAddress = employee.address || employee.neighborhood || employee.city || employee.state || employee.zipCode;
  const hasPersonalInfo = employee.birth || employee.payrollNumber;

  const handleOpenMaps = () => {
    const addressParts = [
      employee.address,
      employee.addressNumber,
      employee.neighborhood,
      employee.city,
      employee.state,
      employee.zipCode,
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

    if (employee.address) {
      let streetLine = employee.address;
      if (employee.addressNumber) {
        streetLine += `, ${employee.addressNumber}`;
      }
      parts.push(streetLine);
    }

    if (employee.addressComplement) {
      parts.push(employee.addressComplement);
    }

    if (employee.neighborhood) {
      parts.push(employee.neighborhood);
    }

    if (employee.city || employee.state) {
      const cityState = [employee.city, employee.state].filter(Boolean).join(" - ");
      parts.push(cityState);
    }

    if (employee.zipCode) {
      const formatted = employee.zipCode.replace(/(\d{5})(\d{3})/, "$1-$2");
      parts.push(`CEP: ${formatted}`);
    }

    return parts.join("\n");
  };

  const fullAddress = getFullAddress();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconUser size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>
            Informações Pessoais
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Dados Pessoais Section */}
        {hasPersonalInfo && (
          <>
            <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
              Dados Pessoais
            </ThemedText>

            {employee.birth && (
              <DetailField
                label="Data de Nascimento"
                value={`${formatDate(employee.birth)} (${getAge(employee.birth)} anos)`}
                icon="cake"
              />
            )}

            {employee.payrollNumber && (
              <DetailField
                label="Número da Folha"
                value={employee.payrollNumber}
                icon="hash"
                monospace
              />
            )}

            {hasAddress && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          </>
        )}

        {/* Address Section */}
        {hasAddress ? (
          <>
            <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
              Endereço
            </ThemedText>

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
          </>
        ) : hasPersonalInfo ? null : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted + "30" }]}>
              <IconUser size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nenhuma informação pessoal cadastrada
            </ThemedText>
            <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              Este usuário não possui informações pessoais registradas.
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
  subsectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  separator: {
    height: 1,
    marginVertical: spacing.xs,
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
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
