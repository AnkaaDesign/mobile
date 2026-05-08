import { Pressable, StyleSheet, View, Alert } from "react-native";
import { IconChevronRight, IconRoute } from "@tabler/icons-react-native";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { ThemedText } from "@/components/ui/themed-text";
import { useOptionalTutorial } from "./tutorial-context";
import { useTutorialTarget } from "./use-tutorial-target";
import { TUTORIAL_TARGETS } from "./target-ids";

/**
 * Card-style row to replay the tutorial. Visible only to PRODUCTION
 * sector users. Lives on the perfil screen.
 */
export function ReplayTutorialButton() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const tutorial = useOptionalTutorial();
  const { ref, onLayout } = useTutorialTarget(TUTORIAL_TARGETS.perfilReplayButton);

  if (!tutorial) return null;
  if (user?.sector?.privileges !== SECTOR_PRIVILEGES.PRODUCTION) return null;

  const handlePress = () => {
    Alert.alert(
      "Repetir Tutorial",
      "Deseja refazer o tutorial guiado pelo aplicativo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Começar",
          onPress: async () => {
            await tutorial.reset();
            tutorial.start();
          },
        },
      ]
    );
  };

  return (
    <View ref={ref} onLayout={onLayout}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
            <IconRoute size={20} color="#ffffff" />
          </View>
          <View style={styles.text}>
            <ThemedText style={styles.title}>Repetir Tutorial</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Refaça a apresentação guiada do aplicativo
            </ThemedText>
          </View>
          <IconChevronRight size={20} color={colors.mutedForeground} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
