
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import { View, StyleSheet } from "react-native";
import { IconBook } from "@tabler/icons-react-native";

export default function CatalogScreen() {
  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <IconBook size={32} color="#3b82f6" />
          <ThemedText style={styles.title}>Catálogo Básico</ThemedText>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.description}>Esta é a página do catálogo básico para líderes.</ThemedText>
          <ThemedText style={styles.subtitle}>Aqui você pode visualizar os itens do catálogo sem precisar de acesso ao módulo completo de pintura.</ThemedText>

          <View style={styles.actions}>
            <Button onPress={() => router.push("/catalog/list" as any)} style={styles.button}>
              <ThemedText style={styles.buttonText}>Ver Catálogo</ThemedText>
            </Button>
          </View>
        </View>
      </ThemedView>
    </PrivilegeGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 12,
  },
  content: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  description: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
});
