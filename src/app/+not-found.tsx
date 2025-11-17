import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight, spacing, borderRadius } from "@/constants/design-system";

/**
 * Custom 404 Not Found Screen for Mobile
 *
 * Matches web's NotFound component design with native mobile styling.
 * Provides consistent UX across platforms when users navigate to non-existent routes.
 *
 * Features:
 * - Theme-aware styling
 * - Alert triangle icon
 * - Clear 404 error code display
 * - User-friendly Portuguese message
 * - Navigation buttons (Back + Home)
 * - Support contact suggestion
 *
 * @see /web/src/pages/not-found.tsx for web equivalent
 */
export default function NotFoundScreen() {
  const { colors } = useTheme();

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // If no history, go to home
      router.replace("/");
    }
  };

  const handleGoHome = () => {
    router.replace("/");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Icon with glow effect */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconGlow, { backgroundColor: colors.destructive + "20" }]} />
          <Icon name="alert-triangle" size={64} color={colors.destructive} style={styles.icon} />
        </View>

        {/* Error code */}
        <Text style={[styles.errorCode, { color: colors.mutedForeground }]}>404</Text>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>Página não encontrada</Text>

        {/* Message */}
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          Desculpe, a página que você está procurando não existe ou foi movida.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button onPress={handleGoBack} variant="outline" style={styles.button}>
            <View style={styles.buttonContent}>
              <Icon name="arrow-left" size={16} color={colors.foreground} />
              <Text style={[styles.buttonText, { color: colors.foreground }]}>Voltar</Text>
            </View>
          </Button>

          <Button onPress={handleGoHome} variant="default" style={styles.button}>
            <View style={styles.buttonContent}>
              <Icon name="home" size={16} color={colors.background} />
              <Text style={[styles.buttonText, { color: colors.background }]}>Página inicial</Text>
            </View>
          </Button>
        </View>

        {/* Help text */}
        <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
          Se você acredita que isso é um erro, entre em contato com o suporte.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  iconContainer: {
    position: "relative",
    marginBottom: spacing.lg,
  },
  iconGlow: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 50,
    opacity: 0.3,
  },
  icon: {
    position: "relative",
    zIndex: 1,
  },
  errorCode: {
    fontSize: 64,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: fontSize.sm,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  buttonContainer: {
    width: "100%",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  button: {
    width: "100%",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  buttonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  helpText: {
    fontSize: fontSize.xs,
    textAlign: "center",
  },
});
