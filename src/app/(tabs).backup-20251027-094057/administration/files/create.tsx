import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconFileText, IconArrowLeft } from "@tabler/icons-react-native";
import { ThemedView, ThemedText, Button } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function CreateFileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleCancel = () => {
    router.push(routeToMobilePath(routes.administration.files.list) as any);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <IconFileText size={32} color={colors.primary} />
            <Button
              variant="ghost"
              onPress={handleCancel}
              icon={<IconArrowLeft size={20} color={colors.foreground} />}
            >
              Voltar
            </Button>
          </View>
          <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
            Novo Arquivo
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
            Criar Arquivo
          </ThemedText>
          <ThemedText style={[styles.cardDescription, { color: colors.mutedForeground, marginTop: 12 }]}>
            Esta funcionalidade está em desenvolvimento. Para fazer upload de arquivos, use a opção "Upload" disponível na lista de arquivos.
          </ThemedText>
        </View>

        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.footerButton}
          >
            Voltar para Lista
          </Button>
          <Button
            variant="default"
            onPress={() => router.push(routeToMobilePath(routes.administration.files.upload) as any)}
            style={styles.footerButton}
          >
            Ir para Upload
          </Button>
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
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  footerButton: {
    flex: 1,
  },
});
