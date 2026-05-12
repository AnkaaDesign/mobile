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
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils/user";
import {
  TUTORIAL_TARGETS,
  useOptionalTutorial,
  useTutorialTarget,
} from "@/components/tutorial";

type PreferenceItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  ref?: any;
  onLayout?: () => void;
};

export default function PreferencesIndexScreen() {
  useScreenReady();
  const { colors } = useTheme();
  const nav = useNav();
  const { user } = useAuth();
  const tutorial = useOptionalTutorial();

  // Show the replay row to PRODUCTION sector users, PRODUCTION_MANAGER (team
  // leaders), and ADMIN (which `hasPrivilege` auto-allows). Same gate as the
  // rest of the tutorial system.
  const canReplayTutorial =
    !!user &&
    (hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
      user.sector?.privileges === SECTOR_PRIVILEGES.PRODUCTION_MANAGER);
  const replayTarget = useTutorialTarget(TUTORIAL_TARGETS.preferencesReplayButton);
  const themeCardTarget = useTutorialTarget(TUTORIAL_TARGETS.preferencesThemeCard);
  const notificationsCardTarget = useTutorialTarget(TUTORIAL_TARGETS.preferencesNotificationsCard);

  const handleReplayTutorial = () => {
    if (!tutorial) return;
    Alert.alert(
      "Repetir Tutorial",
      "Deseja refazer o tutorial guiado pelo aplicativo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Começar",
          onPress: async () => {
            await tutorial.reset();
            // Send the user to the home screen so the first showcase steps
            // (greeting, widget panel, edit-painel button) have something to
            // spotlight. Without this the tutorial would launch on top of
            // Preferências and the early targets would never measure.
            nav.push(mobileRoute("/inicio"));
            tutorial.start();
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
      ref: themeCardTarget.ref,
      onLayout: themeCardTarget.onLayout,
    },
    {
      id: "notificacoes",
      title: "Notificações",
      description: "Configurar notificações",
      icon: "bell",
      onPress: () => {
        notificationsCardTarget.onPress();
        nav.push(mobileRoute("/perfil/notification-preferences"));
      },
      ref: notificationsCardTarget.ref,
      onLayout: notificationsCardTarget.onLayout,
    },
  ];

  if (canReplayTutorial) {
    preferences.push({
      id: "replay-tutorial",
      title: "Repetir Tutorial",
      description: "Refaça a apresentação guiada do aplicativo",
      icon: "repeat",
      onPress: handleReplayTutorial,
      ref: replayTarget.ref,
      onLayout: replayTarget.onLayout,
    });
  }

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
            ref={pref.ref}
            onLayout={pref.onLayout}
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
