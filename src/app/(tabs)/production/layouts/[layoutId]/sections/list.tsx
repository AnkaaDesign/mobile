import React, { useState, useCallback } from "react";
import { View, Pressable, ScrollView, RefreshControl , StyleSheet} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconPlus, IconEdit, IconTrash, IconBuilding, IconBox } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, Badge } from "@/components/ui";
import { useLayoutSections, useLayoutSectionMutations, useLayoutDetail } from '../../../../../../hooks';
import { useTheme } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";

export default function LayoutSectionListScreen() {
  const router = useRouter();
  const { layoutId } = useLocalSearchParams<{ layoutId: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);

  const { data: layout } = useLayoutDetail(layoutId!, {
    include: { photo: true },
  });

  const { data: sectionsResponse, isLoading, error, refetch } = useLayoutSections(layoutId!);
  const { delete: deleteSection } = useLayoutSectionMutations();

  const sections = sectionsResponse?.data || [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleCreateSection = () => {
    router.push(`/production/layouts/${layoutId}/sections/create` as any);
  };

  const handleSectionPress = (sectionId: string) => {
    router.push(`/production/layouts/${layoutId}/sections/details/${sectionId}` as any);
  };

  const handleEditSection = (sectionId: string) => {
    router.push(`/production/layouts/${layoutId}/sections/edit/${sectionId}` as any);
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await deleteSection(sectionId);
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  if (isLoading && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Carregando seções...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar seções" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasSections = sections.length > 0;

  // Calculate total width
  const totalWidth = sections.reduce((total, section) => total + section.width, 0);

  // Determine layout type
  const getLayoutType = () => {
    if (!layout?.data) return "Layout";
    const layoutData = layout.data;
    if (layoutData.height === 2.42 && Math.abs(totalWidth - 2.42) < 0.1) {
      return "Traseira";
    } else if (totalWidth > 6) {
      return "Lateral";
    } else {
      return "Layout";
    }
  };

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }])}>
      {/* Header Info */}
      <View style={StyleSheet.flatten([styles.header, { backgroundColor: colors.card, borderColor: colors.border }])}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>{getLayoutType()}</ThemedText>
          <View style={styles.headerStats}>
            <Badge variant="secondary">
              <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.secondaryForeground }])}>
                {sections.length} seções
              </ThemedText>
            </Badge>
            <Badge variant="outline">
              <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.foreground }])}>
                {totalWidth.toFixed(2)}m
              </ThemedText>
            </Badge>
          </View>
        </View>
        {layout?.data && (
          <ThemedText style={StyleSheet.flatten([styles.headerSubtitle, { color: colors.mutedForeground }])}>
            Altura: {layout.data.height.toFixed(2)}m
          </ThemedText>
        )}
      </View>

      {hasSections ? (
        <ScrollView
          style={styles.sectionsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          {sections
            .sort((a, b) => a.position - b.position)
            .map((section) => (
              <Pressable
                key={section.id}
                style={({ pressed }) => [
                  styles.sectionCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && styles.sectionCardPressed,
                ]}
                onPress={() => handleSectionPress(section.id)}
              >
                <View style={styles.sectionContent}>
                  <View style={styles.sectionInfo}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleRow}>
                        {section.isDoor ? (
                          <IconBuilding size={20} color={colors.primary} />
                        ) : (
                          <IconBox size={20} color={colors.mutedForeground} />
                        )}
                        <ThemedText style={styles.sectionName}>
                          {section.isDoor ? "Porta" : "Painel"} {section.position + 1}
                        </ThemedText>
                      </View>
                      <View style={styles.sectionBadges}>
                        {section.isDoor && (
                          <Badge variant="default" size="sm">
                            <ThemedText style={StyleSheet.flatten([styles.sectionBadgeText, { color: colors.primaryForeground }])}>
                              Porta
                            </ThemedText>
                          </Badge>
                        )}
                      </View>
                    </View>
                    <View style={styles.sectionDetails}>
                      <View style={styles.sectionDetailRow}>
                        <ThemedText style={StyleSheet.flatten([styles.sectionDetailLabel, { color: colors.mutedForeground }])}>
                          Largura:
                        </ThemedText>
                        <ThemedText style={styles.sectionDetailValue}>
                          {section.width.toFixed(2)}m
                        </ThemedText>
                      </View>
                      {section.isDoor && section.doorOffset !== null && (
                        <View style={styles.sectionDetailRow}>
                          <ThemedText style={StyleSheet.flatten([styles.sectionDetailLabel, { color: colors.mutedForeground }])}>
                            Espaço superior:
                          </ThemedText>
                          <ThemedText style={styles.sectionDetailValue}>
                            {section.doorOffset.toFixed(2)}m
                          </ThemedText>
                        </View>
                      )}
                      <View style={styles.sectionDetailRow}>
                        <ThemedText style={StyleSheet.flatten([styles.sectionDetailLabel, { color: colors.mutedForeground }])}>
                          Posição:
                        </ThemedText>
                        <ThemedText style={styles.sectionDetailValue}>
                          {section.position + 1}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={styles.sectionActions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionButton,
                        { backgroundColor: colors.secondary },
                        pressed && styles.actionButtonPressed,
                      ]}
                      onPress={() => handleEditSection(section.id)}
                    >
                      <IconEdit size={16} color={colors.secondaryForeground} />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionButton,
                        { backgroundColor: colors.destructive },
                        pressed && styles.actionButtonPressed,
                      ]}
                      onPress={() => handleDeleteSection(section.id)}
                    >
                      <IconTrash size={16} color={colors.destructiveForeground} />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="layout"
            title="Nenhuma seção cadastrada"
            description="Configure as seções deste layout para definir portas e painéis"
            actionLabel="Criar Primeira Seção"
            onAction={handleCreateSection}
          />
        </View>
      )}

      <FAB icon="plus" onPress={handleCreateSection} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    borderBottomWidth: 1,
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerStats: {
    flexDirection: "row",
    gap: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  sectionsContainer: {
    flex: 1,
    padding: 16,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionCardPressed: {
    opacity: 0.8,
  },
  sectionContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionBadges: {
    flexDirection: "row",
    gap: 4,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: "500",
  },
  sectionDetails: {
    gap: 4,
  },
  sectionDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionDetailLabel: {
    fontSize: 14,
  },
  sectionDetailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionActions: {
    flexDirection: "column",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});