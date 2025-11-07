import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconUsers } from "@tabler/icons-react-native";

// This page simply redirects to the team members list
// It's an alias for consistency with the menu structure
export default function TeamUsersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();

  // Check if user is a team leader
  const isTeamLeader = currentUser?.managedSectorId || false;

  React.useEffect(() => {
    // If user is a team leader, redirect to the members list
    if (isTeamLeader) {
      router.replace("/(tabs)/minha-equipe/membros/listar" as any);
    }
  }, [isTeamLeader, router]);

  // Show access denied if not a team leader
  if (!isTeamLeader) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Card style={styles.card}>
            <IconUsers size={48} color={colors.mutedForeground} />
            <ThemedText style={[styles.title, { color: colors.foreground }]}>
              Acesso Restrito
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Esta área é exclusiva para líderes de equipe.
            </ThemedText>
            <Button onPress={() => router.back()} style={styles.button}>
              <ThemedText style={{ color: colors.primaryForeground }}>
                Voltar
              </ThemedText>
            </Button>
          </Card>
        </View>
      </ThemedView>
    );
  }

  // Show loading while redirecting
  return (
    <ThemedView style={styles.container}>
      <View style={styles.emptyContainer}>
        <Card style={styles.card}>
          <ThemedText style={{ color: colors.mutedForeground }}>
            Redirecionando...
          </ThemedText>
        </Card>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  card: {
    padding: spacing.xl,
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.sm,
  },
});