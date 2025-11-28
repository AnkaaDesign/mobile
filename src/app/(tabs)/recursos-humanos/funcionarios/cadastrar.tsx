import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import { IconUser, IconIdBadge, IconPhone, IconMail, IconBriefcase, IconBuilding } from "@tabler/icons-react-native";
import { showToast } from "@/components/ui/toast";

export default function EmployeesCreateScreen() {
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast({ message: "Nome é obrigatório", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement employee creation API call
      showToast({ message: "Funcionário criado com sucesso", type: "success" });
      router.back();
    } catch (error) {
      showToast({ message: "Erro ao criar funcionário", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header Card */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconUser size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.title, { color: colors.foreground }]}>
                Informações Básicas
              </ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Nome
              </ThemedText>
              <Input
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                placeholder="Nome completo"
                placeholderTextColor={colors.mutedForeground}
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
              />
            </View>
            <View>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                CPF
              </ThemedText>
              <Input
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                placeholder="000.000.000-00"
                placeholderTextColor={colors.mutedForeground}
                value={formData.cpf}
                onChangeText={(value) => handleInputChange("cpf", value)}
              />
            </View>
          </View>
        </Card>

        {/* Contact Information Card */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconPhone size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.title, { color: colors.foreground }]}>
                Informações de Contato
              </ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                E-mail
              </ThemedText>
              <Input
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                placeholder="email@example.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
              />
            </View>
            <View>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Telefone
              </ThemedText>
              <Input
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                placeholder="(00) 00000-0000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(value) => handleInputChange("phone", value)}
              />
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button onPress={() => router.back()} variant="outline" style={{ flex: 1 }}>
            <ThemedText style={{ color: colors.foreground }}>Cancelar</ThemedText>
          </Button>
          <Button onPress={handleSubmit} style={{ flex: 1 }} disabled={isLoading}>
            <ThemedText style={{ color: colors.primaryForeground }}>
              {isLoading ? "Salvando..." : "Salvar"}
            </ThemedText>
          </Button>
        </View>

        <View style={{ height: spacing.xxl * 2 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
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
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: spacing.md,
  },
});
