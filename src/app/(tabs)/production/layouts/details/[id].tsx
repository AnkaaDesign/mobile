import React, { useState } from "react";
import { View, ScrollView, Pressable , StyleSheet} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconEdit, IconDownload, IconList, IconTrash } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, ErrorScreen, FAB, Badge } from "@/components/ui";
import { useLayoutDetail, useLayoutMutations, useLayoutSVGDownload } from '../../../../../hooks';
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";

export default function LayoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: layout, isLoading, error, refetch } = useLayoutDetail(id!, {
    include: {
      layoutSections: true,
      photo: true,
    },
  });

  const { delete: deleteLayout } = useLayoutMutations();
  const { downloadSVG } = useLayoutSVGDownload();

  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    router.push(`/production/layouts/edit/${id}` as any);
  };

  const handleViewSections = () => {
    router.push(`/production/layouts/${id}/sections/list` as any);
  };

  const handleDownloadSVG = async () => {
    if (!layout?.data) return;
    try {
      await downloadSVG(layout.data.id);
    } catch (error) {
      console.error("Error downloading SVG:", error);
    }
  };

  const handleDelete = async () => {
    if (!layout?.data || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteLayout(layout.data.id);
      toast.success("Layout excluído com sucesso");
      router.back();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao excluir layout");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Carregando layout...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !layout?.data) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar layout"
          detail={error?.message || "Layout não encontrado"}
          onRetry={() => refetch()}
        />
      </ThemedView>
    );
  }

  const layoutData = layout.data;

  // Calculate total width from sections
  const totalWidth = layoutData.layoutSections?.reduce((total, section) => total + section.width, 0) || 0;

  // Determine layout type based on dimensions and sections
  const getLayoutType = () => {
    if (layoutData.height === 2.42 && Math.abs(totalWidth - 2.42) < 0.1) {
      return "Traseira";
    } else if (totalWidth > 6) {
      return "Lateral";
    } else {
      return "Layout";
    }
  };

  const layoutType = getLayoutType();

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }])}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <ThemedText style={styles.layoutType}>{layoutType}</ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.layoutId, { color: colors.mutedForeground }])}>
                ID: {layoutData.id}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.headerActionButton,
                  { backgroundColor: colors.secondary },
                  pressed && styles.headerActionButtonPressed,
                ]}
                onPress={handleDownloadSVG}
              >
                <IconDownload size={20} color={colors.secondaryForeground} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Dimensions */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <ThemedText style={styles.sectionTitle}>Dimensões</ThemedText>
          <View style={styles.dimensionsGrid}>
            <View style={styles.dimensionItem}>
              <ThemedText style={StyleSheet.flatten([styles.dimensionLabel, { color: colors.mutedForeground }])}>Altura</ThemedText>
              <ThemedText style={styles.dimensionValue}>{layoutData.height.toFixed(2)}m</ThemedText>
            </View>
            <View style={styles.dimensionItem}>
              <ThemedText style={StyleSheet.flatten([styles.dimensionLabel, { color: colors.mutedForeground }])}>Largura Total</ThemedText>
              <ThemedText style={styles.dimensionValue}>{totalWidth.toFixed(2)}m</ThemedText>
            </View>
          </View>
        </View>

        {/* Sections */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Seções</ThemedText>
            <Badge variant="secondary">
              <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.secondaryForeground }])}>
                {layoutData.layoutSections?.length || 0}
              </ThemedText>
            </Badge>
          </View>

          {layoutData.layoutSections && layoutData.layoutSections.length > 0 ? (
            <View style={styles.sectionsContainer}>
              {layoutData.layoutSections
                .sort((a, b) => a.position - b.position)
                .map((section) => (
                  <View key={section.id} style={StyleSheet.flatten([styles.sectionItem, { backgroundColor: colors.muted }])}>
                    <View style={styles.sectionInfo}>
                      <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionName}>
                          {section.isDoor ? "Porta" : "Painel"} {section.position + 1}
                        </ThemedText>
                        {section.isDoor && (
                          <Badge variant="outline" size="sm">
                            <ThemedText style={StyleSheet.flatten([styles.doorBadge, { color: colors.foreground }])}>
                              Porta
                            </ThemedText>
                          </Badge>
                        )}
                      </View>
                      <View style={styles.sectionDetails}>
                        <ThemedText style={StyleSheet.flatten([styles.sectionDetail, { color: colors.mutedForeground }])}>
                          Largura: {section.width.toFixed(2)}m
                        </ThemedText>
                        {section.isDoor && section.doorOffset !== null && (
                          <ThemedText style={StyleSheet.flatten([styles.sectionDetail, { color: colors.mutedForeground }])}>
                            Espaço superior: {section.doorOffset.toFixed(2)}m
                          </ThemedText>
                        )}
                      </View>
                    </View>
                  </View>
                ))}

              <Pressable
                style={({ pressed }) => [
                  styles.viewAllSections,
                  { backgroundColor: colors.primary },
                  pressed && styles.viewAllSectionsPressed,
                ]}
                onPress={handleViewSections}
              >
                <IconList size={16} color={colors.primaryForeground} />
                <ThemedText style={StyleSheet.flatten([styles.viewAllSectionsText, { color: colors.primaryForeground }])}>
                  Ver todas as seções
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.noSections}>
              <ThemedText style={StyleSheet.flatten([styles.noSectionsText, { color: colors.mutedForeground }])}>
                Nenhuma seção cadastrada
              </ThemedText>
              <Pressable
                style={({ pressed }) => [
                  styles.addSectionButton,
                  { backgroundColor: colors.primary },
                  pressed && styles.addSectionButtonPressed,
                ]}
                onPress={handleViewSections}
              >
                <ThemedText style={StyleSheet.flatten([styles.addSectionButtonText, { color: colors.primaryForeground }])}>
                  Gerenciar Seções
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>

        {/* Photo Section - Only for back layouts */}
        {layoutType === "Traseira" && (
          <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
            <ThemedText style={styles.sectionTitle}>Foto de Referência</ThemedText>
            {layoutData.photo ? (
              <View style={styles.photoContainer}>
                <ThemedText style={StyleSheet.flatten([styles.photoInfo, { color: colors.mutedForeground }])}>
                  Foto anexada: {layoutData.photo.filename}
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={StyleSheet.flatten([styles.noPhoto, { color: colors.mutedForeground }])}>
                Nenhuma foto anexada
              </ThemedText>
            )}
          </View>
        )}

        {/* Timestamps */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <ThemedText style={styles.sectionTitle}>Informações</ThemedText>
          <View style={styles.timestampsContainer}>
            <View style={styles.timestampItem}>
              <ThemedText style={StyleSheet.flatten([styles.timestampLabel, { color: colors.mutedForeground }])}>Criado em</ThemedText>
              <ThemedText style={styles.timestampValue}>
                {new Date(layoutData.createdAt).toLocaleDateString("pt-BR")}
              </ThemedText>
            </View>
            <View style={styles.timestampItem}>
              <ThemedText style={StyleSheet.flatten([styles.timestampLabel, { color: colors.mutedForeground }])}>Atualizado em</ThemedText>
              <ThemedText style={styles.timestampValue}>
                {new Date(layoutData.updatedAt).toLocaleDateString("pt-BR")}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <FAB icon="edit" onPress={handleEdit} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
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
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerInfo: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  layoutType: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  layoutId: {
    fontSize: 14,
    fontFamily: "monospace",
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerActionButtonPressed: {
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  dimensionsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  dimensionItem: {
    flex: 1,
  },
  dimensionLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dimensionValue: {
    fontSize: 20,
    fontWeight: "600",
  },
  sectionsContainer: {
    gap: 8,
  },
  sectionItem: {
    borderRadius: 8,
    padding: 12,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  doorBadge: {
    fontSize: 10,
  },
  sectionDetails: {
    gap: 2,
  },
  sectionDetail: {
    fontSize: 12,
  },
  viewAllSections: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  viewAllSectionsPressed: {
    opacity: 0.8,
  },
  viewAllSectionsText: {
    fontSize: 14,
    fontWeight: "500",
  },
  noSections: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  noSectionsText: {
    fontSize: 14,
    textAlign: "center",
  },
  addSectionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addSectionButtonPressed: {
    opacity: 0.8,
  },
  addSectionButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  photoContainer: {
    paddingVertical: 8,
  },
  photoInfo: {
    fontSize: 14,
  },
  noPhoto: {
    fontSize: 14,
    fontStyle: "italic",
  },
  timestampsContainer: {
    gap: 12,
  },
  timestampItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestampLabel: {
    fontSize: 14,
  },
  timestampValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  bottomSpacing: {
    height: 100,
  },
});