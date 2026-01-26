import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { IconChevronRight } from "@tabler/icons-react-native";

export default function PreferencesIndexScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const preferences = [
    {
      id: "tema",
      title: "Tema",
      description: "Aparência do aplicativo",
      icon: "palette",
      path: "/pessoal/preferencias/tema",
    },
    {
      id: "notificacoes",
      title: "Notificações",
      description: "Configurar notificações",
      icon: "bell",
      path: "/(tabs)/perfil/notification-preferences",
    },
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Preferências</ThemedText>
        <ThemedText style={styles.subtitle}>Configure suas preferências do aplicativo</ThemedText>
      </View>

      {/* Preference Items */}
      <View style={styles.content}>
        {preferences.map((pref, index) => (
          <TouchableOpacity
            key={pref.id}
            style={[
              styles.preferenceCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              index < preferences.length - 1 && styles.preferenceCardBorder
            ]}
            onPress={() => router.push(pref.path as any)}
            activeOpacity={0.7}
          >
            <View style={styles.preferenceLeft}>
              <Icon name={pref.icon} size="md" color={colors.primary} />
              <View style={styles.preferenceText}>
                <ThemedText style={styles.preferenceTitle}>{pref.title}</ThemedText>
                <ThemedText style={styles.preferenceDescription}>{pref.description}</ThemedText>
              </View>
            </View>
            <IconChevronRight size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  preferenceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  preferenceCardBorder: {
    borderBottomWidth: 1,
  },
  preferenceLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  preferenceDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
});
