
import { View, StyleSheet } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { IconTools } from "@tabler/icons-react-native";

export default function ManutencaoScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <IconTools size={64} color="#9ca3af" style={styles.icon} />
        <ThemedText style={styles.title}>Em Construção</ThemedText>
        <ThemedText style={styles.subtitle}>
          Esta página está em desenvolvimento.
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Use o menu lateral para acessar as funcionalidades disponíveis.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    gap: 16,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    maxWidth: 400,
  },
});
