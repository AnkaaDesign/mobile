
import { View, StyleSheet, Linking, TouchableOpacity, Alert } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import { IconPhone, IconMail, IconPhoneCall, IconWorld, IconBrandWhatsapp } from "@tabler/icons-react-native";
import type { Customer } from '../../../../types';
import { formatBrazilianPhone } from "@/utils";
// import { showToast } from "@/components/ui/toast";

interface ContactInfoCardProps {
  customer: Customer;
}

export function ContactInfoCard({ customer }: ContactInfoCardProps) {
  const { colors } = useTheme();

  const handlePhonePress = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir o discador");
    });
  };

  const handleWhatsAppPress = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const whatsappNumber = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    Linking.openURL(`https://wa.me/${whatsappNumber}`).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp");
    });
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir o cliente de email");
    });
  };

  const handleWebsitePress = (site: string) => {
    const url = site.startsWith("http") ? site : `https://${site}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir o site");
    });
  };

  const hasContactInfo = customer.email || (customer.phones && customer.phones.length > 0) || customer.site;

  if (!hasContactInfo) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconPhoneCall size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Informações de Contato</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
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
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconPhoneCall size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações de Contato</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
          {/* Email */}
          {customer.email && (
            <TouchableOpacity
              onPress={() => handleEmailPress(customer.email!)}
              style={StyleSheet.flatten([styles.infoItem])}
              activeOpacity={0.7}
            >
              <IconMail size={20} color={colors.mutedForeground} />
              <View style={styles.infoText}>
                <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>E-mail</ThemedText>
                <ThemedText style={[styles.value, { color: "#16a34a" }]}>
                  {customer.email}
                </ThemedText>
              </View>
            </TouchableOpacity>
          )}

          {/* Phone Numbers */}
          {customer.phones && customer.phones.length > 0 && (
            <>
              {customer.phones.map((phone, index) => (
                <View
                  key={index}
                  style={styles.infoItem}
                >
                  <IconPhone size={20} color={colors.mutedForeground} />
                  <View style={styles.infoText}>
                    <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                      Telefone{customer.phones.length > 1 ? ` ${index + 1}` : ""}
                    </ThemedText>
                    <View style={styles.phoneRow}>
                      <TouchableOpacity onPress={() => handlePhonePress(phone)} activeOpacity={0.7}>
                        <ThemedText style={[styles.value, { color: "#16a34a" }]}>
                          {formatBrazilianPhone(phone)}
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleWhatsAppPress(phone)}
                        activeOpacity={0.7}
                        style={styles.whatsappIcon}
                      >
                        <IconBrandWhatsapp size={18} color="#16a34a" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Website */}
          {customer.site && (
            <TouchableOpacity
              onPress={() => handleWebsitePress(customer.site!)}
              style={styles.infoItem}
              activeOpacity={0.7}
            >
              <IconWorld size={20} color={colors.mutedForeground} />
              <View style={styles.infoText}>
                <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Website</ThemedText>
                <ThemedText style={[styles.value, { color: "#16a34a" }]}>
                  {customer.site}
                </ThemedText>
              </View>
            </TouchableOpacity>
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
  infoItem: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  whatsappIcon: {
    padding: spacing.xs / 2,
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
    fontWeight: "600",
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
