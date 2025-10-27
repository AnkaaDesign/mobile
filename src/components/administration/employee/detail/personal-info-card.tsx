import React from "react";
import { View, StyleSheet } from "react-native";
import type { User } from '../../../../types';
import { formatCPF, formatPIS, formatBrazilianPhone, formatDate, formatZipCode } from '../../../../utils';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
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
  const formattedBirthDate = employee.birth ? formatDate(employee.birth) : "Não informado";

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
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconUser size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Informações Pessoais
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <IconId size={20} color={colors.mutedForeground} />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              CPF
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
              {maskedCPF}
            </ThemedText>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <IconId size={20} color={colors.mutedForeground} />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              PIS
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
              {maskedPIS}
            </ThemedText>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <IconCalendar size={20} color={colors.mutedForeground} />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Data de Nascimento
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
              {formattedBirthDate}
            </ThemedText>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <IconPhone size={20} color={colors.mutedForeground} />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Telefone
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
              {formattedPhone}
            </ThemedText>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <IconMapPin size={20} color={colors.mutedForeground} />
          </View>
          <View style={styles.detailContent}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Endereço
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
              {fullAddress}
            </ThemedText>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  detailRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detailIcon: {
    paddingTop: 2,
  },
  detailContent: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.sm,
  },
});
