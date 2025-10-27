import React from "react";
import { View, StyleSheet, Linking } from "react-native";
import type { User } from '../../../../types';
import { formatBrazilianPhone, getUserStatusBadgeText } from '../../../../utils';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconUser, IconMail, IconPhone, IconBrandWhatsapp } from "@tabler/icons-react-native";
import { USER_STATUS } from '../../../../constants';

interface BasicInfoCardProps {
  employee: User;
}

export function BasicInfoCard({ employee }: BasicInfoCardProps) {
  const { colors } = useTheme();

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case USER_STATUS.ACTIVE:
        return "success";
      case USER_STATUS.INACTIVE:
        return "destructive";
      case USER_STATUS.ON_VACATION:
        return "warning";
      default:
        return "secondary";
    }
  };

  const handleWhatsAppPress = () => {
    if (employee.phone) {
      const phoneNumber = employee.phone.replace(/\D/g, "");
      const fullNumber = phoneNumber.startsWith("55") ? phoneNumber : `55${phoneNumber}`;
      Linking.openURL(`https://wa.me/${fullNumber}`);
    }
  };

  const handleEmailPress = () => {
    if (employee.email) {
      Linking.openURL(`mailto:${employee.email}`);
    }
  };

  const handlePhonePress = () => {
    if (employee.phone) {
      Linking.openURL(`tel:${employee.phone}`);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconUser size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Informações Básicas
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Identificação Section */}
        <ThemedText style={[styles.subsectionTitle, { color: colors.foreground }]}>
          Identificação
        </ThemedText>

        <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
            Nome
          </ThemedText>
          <ThemedText style={[styles.value, { color: colors.foreground }]}>
            {employee.name}
          </ThemedText>
        </View>

        {employee.email && (
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
            <View style={styles.labelWithIcon}>
              <IconMail size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                E-mail
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.value, { color: colors.primary }]}
              onPress={handleEmailPress}
            >
              {employee.email}
            </ThemedText>
          </View>
        )}

        {employee.phone && (
          <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
            <View style={styles.labelWithIcon}>
              <IconPhone size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Telefone
              </ThemedText>
            </View>
            <View style={styles.phoneContainer}>
              <ThemedText
                style={[styles.value, styles.phoneValue, { color: "#16a34a" }]}
                onPress={handlePhonePress}
              >
                {formatBrazilianPhone(employee.phone)}
              </ThemedText>
              <IconBrandWhatsapp
                size={20}
                color="#16a34a"
                onPress={handleWhatsAppPress}
              />
            </View>
          </View>
        )}

        <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
            Status
          </ThemedText>
          <Badge variant={getBadgeVariant(employee.status)}>
            {getUserStatusBadgeText(employee)}
          </Badge>
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
  subsectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  phoneValue: {
    fontFamily: "monospace",
  },
});
