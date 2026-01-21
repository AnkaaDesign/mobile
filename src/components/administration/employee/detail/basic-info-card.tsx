
import { View, StyleSheet, Linking } from "react-native";
import type { User } from '../../../../types';
import { formatBrazilianPhone, getUserStatusBadgeText } from "@/utils";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconUser, IconMail, IconPhone, IconBrandWhatsapp, IconId, IconShieldCheck } from "@tabler/icons-react-native";
import { USER_STATUS } from "@/constants";

interface BasicInfoCardProps {
  employee: User;
}

export function BasicInfoCard({ employee }: BasicInfoCardProps) {
  const { colors } = useTheme();

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case USER_STATUS.EFFECTED:
      case USER_STATUS.EXPERIENCE_PERIOD_1:
      case USER_STATUS.EXPERIENCE_PERIOD_2:
        return "success";
      case USER_STATUS.DISMISSED:
        return "destructive";
      case "ON_VACATION":
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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconUser size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>
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
          <View style={styles.labelWithIcon}>
            <IconId size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
              Nome
            </ThemedText>
          </View>
          <ThemedText
            style={[styles.value, { color: colors.foreground }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
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
              numberOfLines={1}
              ellipsizeMode="tail"
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
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatBrazilianPhone(employee.phone)}
              </ThemedText>
              <IconBrandWhatsapp
                size={20}
                color="#16a34a"
                onPress={handleWhatsAppPress}
                style={styles.whatsappIcon}
              />
            </View>
          </View>
        )}

        <View style={[styles.infoRow, { backgroundColor: colors.muted + "80" }]}>
          <View style={styles.labelWithIcon}>
            <IconShieldCheck size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
              Status
            </ThemedText>
          </View>
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 0,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  phoneValue: {
    fontFamily: "monospace",
    flex: 1,
  },
  whatsappIcon: {
    flexShrink: 0,
  },
});
