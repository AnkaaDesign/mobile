import React from "react";
import { View, StyleSheet } from "react-native";
import { User } from '../../../../types';
import { formatCPF, formatPIS, formatBrazilianPhone, formatDate, formatZipCode } from '../../../../utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailRow } from "@/components/ui/detail-row";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconUser, IconId, IconPhone, IconMapPin, IconCalendar } from "@tabler/icons-react-native";

interface PersonalInfoCardProps {
  employee: User;
}

export function PersonalInfoCard({ employee }: PersonalInfoCardProps) {
  const { colors } = useTheme();

  // Mask CPF for privacy (show only last 4 digits)
  const maskedCPF = employee.cpf
    ? `***.***.***-${employee.cpf.replace(/\D/g, "").slice(-2)}`
    : "Não informado";

  // Mask PIS for privacy
  const maskedPIS = employee.pis
    ? `***.*****.**-${employee.pis.replace(/\D/g, "").slice(-1)}`
    : "Não informado";

  const formattedPhone = employee.phone ? formatBrazilianPhone(employee.phone) : "Não informado";
  const formattedBirthDate = employee.birthDate ? formatDate(employee.birthDate) : "Não informado";

  // Build full address
  const buildAddress = () => {
    const parts = [];
    if (employee.address) parts.push(employee.address);
    if (employee.addressNumber) parts.push(employee.addressNumber);
    if (employee.addressComplement) parts.push(employee.addressComplement);

    const firstLine = parts.join(", ");

    const cityState = [];
    if (employee.city) cityState.push(employee.city);
    if (employee.state) cityState.push(employee.state);

    const secondLine = [];
    if (employee.neighborhood) secondLine.push(employee.neighborhood);
    if (cityState.length > 0) secondLine.push(cityState.join(" - "));
    if (employee.zipCode) secondLine.push(`CEP: ${formatZipCode(employee.zipCode)}`);

    const fullAddress = [firstLine, secondLine.join(" - ")].filter(Boolean).join("\n");
    return fullAddress || "Não informado";
  };

  const fullAddress = buildAddress();

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
              <IconUser size={18} color={colors.primary} />
            </View>
            <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
              Informações Pessoais
            </ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent style={styles.content}>
        <DetailRow
          icon={IconId}
          label="CPF"
          value={maskedCPF}
        />
        <DetailRow
          icon={IconId}
          label="PIS"
          value={maskedPIS}
        />
        <DetailRow
          icon={IconCalendar}
          label="Data de Nascimento"
          value={formattedBirthDate}
        />
        <DetailRow
          icon={IconPhone}
          label="Telefone"
          value={formattedPhone}
        />
        <DetailRow
          icon={IconMapPin}
          label="Endereço"
          value={fullAddress}
          multiline
        />
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
  content: {
    gap: spacing.md,
  },
});
