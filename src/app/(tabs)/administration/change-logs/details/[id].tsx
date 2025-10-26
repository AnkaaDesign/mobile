import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconHistory, IconArrowLeft } from "@tabler/icons-react-native";
import { ThemedView, ThemedText, Button } from "@/components/ui";
import { useTheme } from "@/lib/theme";

export default function ChangeLogDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { id } = params;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <IconHistory size={32} color={colors.primary} />
            <Button
              variant="ghost"
              onPress={() => router.back()}
              icon={<IconArrowLeft size={20} color={colors.foreground} />}
            >
              Voltar
            </Button>
          </View>
          <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
            Detalhes da Alteração
          </ThemedText>
        </View>

        {/* Construction notice */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.constructionBadge, { backgroundColor: colors.warning + '20' }]}>
            <ThemedText style={[styles.constructionText, { color: colors.warning }]}>
              Em Construção
            </ThemedText>
          </View>
          <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
            Change Log Details
          </ThemedText>
          <ThemedText style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            ID: {id}
          </ThemedText>
          <ThemedText style={[styles.cardDescription, { color: colors.mutedForeground, marginTop: 12 }]}>
            Esta funcionalidade está em desenvolvimento. Os detalhes do histórico de alterações serão exibidos aqui em breve.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  constructionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  constructionText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
  },
});
