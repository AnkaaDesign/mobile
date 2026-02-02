import { View, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconUser, IconPhone, IconMail, IconBriefcase, IconBrandWhatsapp, IconExternalLink } from "@tabler/icons-react-native";
import type { Borrow } from "@/types";
import { formatBrazilianPhone } from "@/utils";
// import { showToast } from "@/components/ui/toast";
import { router } from "expo-router";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';

interface BorrowUserCardProps {
  borrow: Borrow;
}

export function BorrowUserCard({ borrow }: BorrowUserCardProps) {
  const { colors } = useTheme();

  const handlePhonePress = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir o discador");
    });
  };

  const handleWhatsAppPress = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const whatsappNumber = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    // Try opening WhatsApp app directly first
    try {
      await Linking.openURL(`whatsapp://send?phone=${whatsappNumber}`);
    } catch {
      // Fallback to web WhatsApp
      try {
        await Linking.openURL(`https://wa.me/${whatsappNumber}`);
      } catch {
        Alert.alert("Erro", "Não foi possível abrir o WhatsApp");
      }
    }
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir o cliente de email");
    });
  };

  const handleNavigateToUser = () => {
    if (borrow.user?.id) {
      router.push(routeToMobilePath(routes.administration.users.details(borrow.user.id)) as any);
    }
  };

  if (!borrow.user) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconUser size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Informações do Usuário</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted + "30" }]}>
              <IconUser size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>
              Usuário não encontrado
            </ThemedText>
            <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              As informações do usuário não estão disponíveis.
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
          <IconUser size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações do Usuário</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* User Name with Link */}
        <TouchableOpacity
          onPress={handleNavigateToUser}
          style={[styles.userNameContainer, { backgroundColor: colors.muted + "30" }]}
          activeOpacity={0.7}
        >
          <View style={styles.userNameContent}>
            <IconUser size={16} color={colors.mutedForeground} />
            <View style={styles.userTextContainer}>
              <ThemedText style={[styles.userLabel, { color: colors.mutedForeground }]}>
                Nome
              </ThemedText>
              <ThemedText style={[styles.userName, { color: colors.foreground }]}>
                {borrow.user.name}
              </ThemedText>
            </View>
          </View>
          <IconExternalLink size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* Contact Information */}
        {(borrow.user.email || borrow.user.phone) && (
          <View style={styles.contactSection}>
            {borrow.user.email && (
              <TouchableOpacity
                onPress={() => handleEmailPress(borrow.user!.email!)}
                style={styles.contactItem}
                activeOpacity={0.7}
              >
                <IconMail size={18} color={colors.mutedForeground} />
                <View style={styles.contactText}>
                  <ThemedText style={[styles.contactLabel, { color: colors.mutedForeground }]}>
                    E-mail
                  </ThemedText>
                  <ThemedText style={[styles.contactValue, { color: "#16a34a" }]}>
                    {borrow.user.email}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            )}

            {borrow.user.phone && (
              <View style={styles.contactItem}>
                <IconPhone size={18} color={colors.mutedForeground} />
                <View style={styles.contactText}>
                  <ThemedText style={[styles.contactLabel, { color: colors.mutedForeground }]}>
                    Telefone
                  </ThemedText>
                  <View style={styles.phoneRow}>
                    <TouchableOpacity onPress={() => handlePhonePress(borrow.user!.phone!)} activeOpacity={0.7}>
                      <ThemedText style={[styles.contactValue, { color: "#16a34a" }]}>
                        {formatBrazilianPhone(borrow.user.phone)}
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleWhatsAppPress(borrow.user!.phone!)}
                      activeOpacity={0.7}
                      style={styles.whatsappIcon}
                    >
                      <IconBrandWhatsapp size={20} color="#16a34a" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* User Details */}
        <View style={styles.fieldsContainer}>
          {borrow.user.position?.name && (
            <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
              <View style={styles.fieldLabelWithIcon}>
                <IconBriefcase size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Cargo
                </ThemedText>
              </View>
              <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
                {borrow.user.position.name}
              </ThemedText>
            </View>
          )}

          {borrow.user.sector?.name && (
            <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Setor
              </ThemedText>
              <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
                {borrow.user.sector.name}
              </ThemedText>
            </View>
          )}

          {borrow.user.cpf && (
            <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                CPF
              </ThemedText>
              <ThemedText style={[styles.fieldValue, { color: colors.foreground, fontFamily: "monospace" }]}>
                {borrow.user.cpf}
              </ThemedText>
            </View>
          )}
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
    gap: spacing.xl,
  },
  userNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  userNameContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    flex: 1,
  },
  userTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  userLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  contactSection: {
    gap: spacing.md,
  },
  contactItem: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  contactText: {
    flex: 1,
    gap: 2,
  },
  contactLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  contactValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  whatsappIcon: {
    padding: spacing.xs / 2,
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
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
    flex: 1,
    marginLeft: spacing.md,
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
