import React, { useState, useCallback } from "react";
import { View, Pressable , StyleSheet} from "react-native";
import { useRouter } from "expo-router";
import { IconPlus, IconFilter, IconDownload } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
import { useLayoutsByTruck, useLayoutSVGDownload } from '../../../../hooks';
import { useTheme } from "@/lib/theme";

interface AccordionProps {
  children?: React.ReactNode;
}

export default function LayoutListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");

  // For demo purposes, using a sample truck ID - in real app this would come from navigation params
  const sampleTruckId = "sample-truck-id";

  const { data: layoutsData, isLoading, error, refetch } = useLayoutsByTruck(sampleTruckId);
  const { downloadSVG } = useLayoutSVGDownload();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleCreateLayout = () => {
    router.push("/production/layouts/create" as any);
  };

  const handleLayoutPress = (layoutId: string) => {
    router.push(`/production/layouts/details/${layoutId}` as any);
  };

  const handleEditLayout = (layoutId: string) => {
    router.push(`/production/layouts/edit/${layoutId}` as any);
  };

  const handleDownloadSVG = async (layoutId: string) => {
    try {
      await downloadSVG(layoutId);
    } catch (error) {
      console.error("Error downloading SVG:", error);
    }
  };

  const handleViewSections = (layoutId: string) => {
    router.push(`/production/layouts/${layoutId}/sections/list` as any);
  };

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  if (isLoading && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Carregando layouts...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar layouts" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  // Extract layouts from the data
  const layouts = layoutsData ? [
    { id: 'left', name: 'Layout Lateral Esquerdo', type: 'left', layout: layoutsData.leftSideLayout },
    { id: 'right', name: 'Layout Lateral Direito', type: 'right', layout: layoutsData.rightSideLayout },
    { id: 'back', name: 'Layout Traseiro', type: 'back', layout: layoutsData.backSideLayout },
  ].filter(item => item.layout) : [];

  const hasLayouts = layouts.length > 0;

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }])}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar layouts..."
          style={styles.searchBar}
          debounceMs={300}
        />
      </View>

      {hasLayouts ? (
        <View style={styles.layoutsContainer}>
          {layouts.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.layoutCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && styles.layoutCardPressed,
              ]}
              onPress={() => item.layout && handleLayoutPress(item.layout.id)}
            >
              <View style={styles.layoutCardContent}>
                <View style={styles.layoutInfo}>
                  <ThemedText style={styles.layoutName}>{item.name}</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.layoutType, { color: colors.foreground }])}>
                    Altura: {item.layout?.height}m
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.layoutSections, { color: colors.mutedForeground }])}>
                    {item.layout?.layoutSections?.length || 0} seções
                  </ThemedText>
                </View>
                <View style={styles.layoutActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionButton,
                      { backgroundColor: colors.secondary },
                      pressed && styles.actionButtonPressed,
                    ]}
                    onPress={() => item.layout && handleDownloadSVG(item.layout.id)}
                  >
                    <IconDownload size={16} color={colors.secondaryForeground} />
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionButton,
                      { backgroundColor: colors.primary },
                      pressed && styles.actionButtonPressed,
                    ]}
                    onPress={() => item.layout && handleViewSections(item.layout.id)}
                  >
                    <ThemedText style={StyleSheet.flatten([styles.actionButtonText, { color: colors.primaryForeground }])}>Seções</ThemedText>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "layout"}
            title={searchText ? "Nenhum layout encontrado" : "Nenhum layout cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Configure os layouts das laterais e traseira do veículo"}
            actionLabel={searchText ? undefined : "Criar Layout"}
            onAction={searchText ? undefined : handleCreateLayout}
          />
        </View>
      )}

      <FAB icon="plus" onPress={handleCreateLayout} />
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
  layoutsContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  layoutCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  layoutCardPressed: {
    opacity: 0.8,
  },
  layoutCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  layoutInfo: {
    flex: 1,
  },
  layoutName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  layoutType: {
    fontSize: 14,
    marginBottom: 2,
  },
  layoutSections: {
    fontSize: 12,
  },
  layoutActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.7,
  },
});