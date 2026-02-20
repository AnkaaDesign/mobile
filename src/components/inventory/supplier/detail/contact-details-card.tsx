import { View, StyleSheet, Linking, TouchableOpacity, Alert } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailField, DetailPhoneField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconPhoneCall } from "@tabler/icons-react-native";
import type { Supplier } from "@/types";
// import { showToast } from "@/components/ui/toast";

interface ContactDetailsCardProps {
  supplier: Supplier;
}

export function ContactDetailsCard({ supplier }: ContactDetailsCardProps) {
  const { colors } = useTheme();

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

  const hasContactInfo = supplier.email || (supplier.phones && supplier.phones.length > 0) || supplier.site || supplier.pix;

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
              Este fornecedor não possui informações de contato cadastradas.
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
        {supplier.email && (
          <DetailField
            label="E-mail"
            value={
              <TouchableOpacity onPress={() => handleEmailPress(supplier.email!)} activeOpacity={0.7}>
                <ThemedText style={{ color: "#16a34a", fontSize: 14, fontWeight: "600" }}>
                  {supplier.email}
                </ThemedText>
              </TouchableOpacity>
            }
            icon="mail"
          />
        )}

        {/* Phone Numbers */}
        {supplier.phones && supplier.phones.length > 0 && (
          <>
            {supplier.phones.map((phone, index) => (
              <DetailPhoneField
                key={index}
                label={`Telefone${supplier.phones!.length > 1 ? ` ${index + 1}` : ""}`}
                phone={phone}
                icon="phone"
              />
            ))}
          </>
        )}

        {/* Website */}
        {supplier.site && (
          <DetailField
            label="Website"
            value={
              <TouchableOpacity onPress={() => handleWebsitePress(supplier.site!)} activeOpacity={0.7}>
                <ThemedText style={{ color: "#16a34a", fontSize: 14, fontWeight: "600" }}>
                  {supplier.site}
                </ThemedText>
              </TouchableOpacity>
            }
            icon="world"
          />
        )}

        {/* Pix */}
        {supplier.pix && (
          <DetailField label="Chave Pix" value={supplier.pix} icon="credit-card" />
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
