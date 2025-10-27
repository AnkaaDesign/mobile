import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconHistory, IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function ChangeLogsListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh logic would go here
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleChangeLogPress = (changeLogId: string) => {
    router.push(routeToMobilePath(routes.administration.changeLogs.details(changeLogId)) as any);
  };

  // Placeholder data - would be replaced with actual hook
  const hasChangeLogs = false;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar alterações..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <ListActionButton
            icon={<IconList size={20} color={colors.foreground} />}
            onPress={() => {}}
            badgeCount={0}
            badgeVariant="primary"
          />
          <ListActionButton
            icon={<IconFilter size={20} color={colors.foreground} />}
            onPress={() => setShowFilters(true)}
            badgeCount={0}
            badgeVariant="destructive"
            showBadge={false}
          />
        </View>
      </View>

      {!hasChangeLogs ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "history"}
            title={searchText ? "Nenhuma alteração encontrada" : "Nenhuma alteração registrada"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "O histórico de alterações ainda está vazio"}
          />
        </View>
      ) : (
        <View style={styles.content}>
          {/* Change log list would go here */}
          <ThemedText style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 20 }}>
            Lista de alterações
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
});
