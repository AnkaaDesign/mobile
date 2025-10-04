import React from "react";
import { useLocalSearchParams } from "expo-router";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from '../../../../constants';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { View, ScrollView , StyleSheet} from "react-native";
import { IconBook, IconTags, IconPalette } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

export default function CatalogDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  // Mock data for demonstration
  const mockItem = {
    id,
    name: "Tinta Branca Acetinada",
    uniCode: "TA-001",
    category: "Tinta",
    description: "Tinta acrílica branca com acabamento acetinado, ideal para superfícies internas e externas.",
    composition: "Base acrílica com pigmentos de alta qualidade",
    coverage: "12-14 m²/L",
    dryingTime: "30 minutos ao toque, 2 horas para repintura",
  };

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <ThemedView style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <IconBook size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Detalhes do Item</ThemedText>
          </View>

          <View style={StyleSheet.flatten([styles.content, { backgroundColor: colors.card }])}>
            <View style={styles.section}>
              <ThemedText style={styles.itemName}>{mockItem.name}</ThemedText>
              <ThemedText style={styles.itemCode}>Código: {mockItem.uniCode}</ThemedText>
            </View>

            <View style={styles.section}>
              <View style={styles.infoRow}>
                <IconTags size={16} color={colors.mutedForeground} />
                <ThemedText style={styles.label}>Categoria:</ThemedText>
                <ThemedText style={styles.value}>{mockItem.category}</ThemedText>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Descrição</ThemedText>
              <ThemedText style={styles.description}>{mockItem.description}</ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Especificações Técnicas</ThemedText>

              <View style={styles.specItem}>
                <ThemedText style={styles.specLabel}>Composição:</ThemedText>
                <ThemedText style={styles.specValue}>{mockItem.composition}</ThemedText>
              </View>

              <View style={styles.specItem}>
                <ThemedText style={styles.specLabel}>Rendimento:</ThemedText>
                <ThemedText style={styles.specValue}>{mockItem.coverage}</ThemedText>
              </View>

              <View style={styles.specItem}>
                <ThemedText style={styles.specLabel}>Tempo de Secagem:</ThemedText>
                <ThemedText style={styles.specValue}>{mockItem.dryingTime}</ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
  },
  content: {
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
  section: {
    marginBottom: 20,
  },
  itemName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 16,
    opacity: 0.7,
    fontFamily: "monospace",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  specItem: {
    marginBottom: 8,
  },
  specLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  specValue: {
    fontSize: 14,
    opacity: 0.8,
  },
});
