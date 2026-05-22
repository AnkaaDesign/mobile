import { Alert, View, StyleSheet, TouchableOpacity } from "react-native";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { IconChevronRight } from "@tabler/icons-react-native";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useTutorialActions } from "@/components/tutorial";

type PreferenceItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
};

export default function PreferencesIndexScreen() {
  useScreenReady();
  const { colors } = useTheme();
  const nav = useNav();
  const { user } = useAuth() as any;
  const tutorial = useTutorialActions();

  const canReplayTutorial =
    user?.sector?.privileges === SECTOR_PRIVILEGES.PRODUCTION ||
    user?.sector?.privileges === SECTOR_PRIVILEGES.PRODUCTION_MANAGER;

  const handleReplayTutorial = () => {
    Alert.alert(
      "Refazer tutorial",
      "Deseja iniciar o tutorial novamente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Iniciar",
          onPress: async () => {
            await tutorial.reset();
            nav.push(mobileRoute("/inicio"));
            setTimeout(() => void tutorial.start(), 200);
          },
        },
      ],
    );
  };

  const preferences: PreferenceItem[] = [
    {
      id: "tema",
      title: "Tema",
      description: "Aparência do aplicativo",
      icon: "palette",
      onPress: () => nav.push(mobileRoute("/pessoal/preferencias/tema")),
    },
    {
      id: "notificacoes",
      title: "Notificações",
      description: "Configurar notificações",
      icon: "bell",
      onPress: () => nav.push(mobileRoute("/perfil/notification-preferences")),
    },
    ...(canReplayTutorial
      ? [
          {
            id: "tutorial",
            title: "Repetir tutorial",
            description: "Reveja o tour guiado do app",
            icon: "refresh",
            onPress: handleReplayTutorial,
          },
        ]
      : []),
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Preferências</ThemedText>
        <ThemedText style={styles.subtitle}>
          Configure suas preferências do aplicativo
        </ThemedText>
      </View>

      {/* Preference Items */}
      <View style={styles.content}>
        {preferences.map((pref, index) => (
          <TouchableOpacity
            key={pref.id}
            style={[
              styles.preferenceCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              index < preferences.length - 1 && styles.preferenceCardBorder,
            ]}
            onPress={pref.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.preferenceLeft}>
              <Icon name={pref.icon} size="md" color={colors.primary} />
              <View style={styles.preferenceText}>
                <ThemedText style={styles.preferenceTitle}>{pref.title}</ThemedText>
                <ThemedText style={styles.preferenceDescription}>
                  {pref.description}
                </ThemedText>
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
