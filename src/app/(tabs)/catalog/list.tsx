import React from "react";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from '../../../constants';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { View, ScrollView , StyleSheet} from "react-native";
import { IconBook, IconEye } from "@tabler/icons-react-native";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";

// Mock data for demonstration
const mockCatalogItems = [
  { id: "1", name: "Tinta Branca Acetinada", uniCode: "TA-001", category: "Tinta" },
  { id: "2", name: "Verniz Transparente", uniCode: "VT-002", category: "Verniz" },
  { id: "3", name: "Primer Cinza", uniCode: "PC-003", category: "Primer" },
];

export default function CatalogListScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <ThemedView style={StyleSheet.flatten([styles.container, { paddingBottom: insets.bottom }])}>
        <View style={styles.header}>
          <IconBook size={24} color={colors.primary} />
          <ThemedText style={styles.title}>Itens do Catálogo</ThemedText>
        </View>

        <ScrollView style={styles.content}>
          {mockCatalogItems.map((item) => (
            <View key={item.id} style={StyleSheet.flatten([styles.itemCard, { backgroundColor: colors.card }])}>
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemCode}>Código: {item.uniCode}</ThemedText>
                <ThemedText style={styles.itemCategory}>Categoria: {item.category}</ThemedText>
              </View>

              <Button onPress={() => router.push(`/catalog/details/${item.id}` as any)} variant="outline" size="icon" style={styles.detailsButton}>
                <IconEye size={16} color={colors.primary} />
              </Button>
            </View>
          ))}
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
    flex: 1,
  },
  itemCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 14,
    opacity: 0.7,
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
