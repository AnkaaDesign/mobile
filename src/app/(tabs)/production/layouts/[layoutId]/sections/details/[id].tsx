import React, { useState } from "react";
import { View, ScrollView, Pressable , StyleSheet} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconEdit, IconTrash, IconBuilding, IconBox } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, ErrorScreen, FAB, Badge } from "@/components/ui";
import { useLayoutSectionDetail, useLayoutSectionMutations, useLayoutDetail } from '../../../../../../../hooks';
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";

export default function LayoutSectionDetailScreen() {
  const router = useRouter();
  const { layoutId, id } = useLocalSearchParams<{ layoutId: string; id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: section, isLoading, error, refetch } = useLayoutSectionDetail(id!);
  const { data: layout } = useLayoutDetail(layoutId!);
  const { delete: deleteSection } = useLayoutSectionMutations();

  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    router.push(`/production/layouts/${layoutId}/sections/edit/${id}` as any);
  };

  const handleDelete = async () => {
    if (!section?.data || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteSection(section.data.id);
      toast.success("Seção excluída com sucesso");
      router.back();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao excluir seção");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Carregando seção...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !section?.data) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar seção"
          detail={error?.message || "Seção não encontrada"}
          onRetry={() => refetch()}
        />
      </ThemedView>
    );
  }

  const sectionData = section.data;

  // Get layout info for context
  const layoutInfo = layout?.data;
  const layoutType = layoutInfo
    ? (layoutInfo.height === 2.42 ? "Traseira" : "Lateral")
    : "Layout";

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }])}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <View style={styles.titleRow}>
                {sectionData.isDoor ? (
                  <IconBuilding size={24} color={colors.primary} />
                ) : (
                  <IconBox size={24} color={colors.mutedForeground} />
                )}
                <ThemedText style={styles.sectionTitle}>
                  {sectionData.isDoor ? "Porta" : "Painel"} {sectionData.position + 1}
                </ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.layoutContext, { color: colors.mutedForeground }])}>
                {layoutType} - {layoutInfo ? `${layoutInfo.height.toFixed(2)}m` : ''}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.headerActionButton,
                  { backgroundColor: colors.destructive },
                  pressed && styles.headerActionButtonPressed,
                ]}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                <IconTrash size={20} color={colors.destructiveForeground} />
              </Pressable>
            </View>
          </View>
          {sectionData.isDoor && (
            <View style={styles.badgeContainer}>
              <Badge variant="default">
                <ThemedText style={StyleSheet.flatten([styles.doorBadge, { color: colors.primaryForeground }])}>
                  Porta
                </ThemedText>
              </Badge>
            </View>
          )}
        </View>

        {/* Dimensions */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <ThemedText style={styles.sectionSectionTitle}>Dimensões</ThemedText>
          <View style={styles.dimensionsGrid}>
            <View style={styles.dimensionItem}>
              <ThemedText style={StyleSheet.flatten([styles.dimensionLabel, { color: colors.mutedForeground }])}>Largura</ThemedText>
              <ThemedText style={styles.dimensionValue}>{sectionData.width.toFixed(2)}m</ThemedText>
            </View>
            <View style={styles.dimensionItem}>
              <ThemedText style={StyleSheet.flatten([styles.dimensionLabel, { color: colors.mutedForeground }])}>Posição</ThemedText>
              <ThemedText style={styles.dimensionValue}>{sectionData.position + 1}</ThemedText>
            </View>
          </View>
        </View>

        {/* Door-specific info */}
        {sectionData.isDoor && (
          <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
            <ThemedText style={styles.sectionSectionTitle}>Configuração da Porta</ThemedText>
            <View style={styles.doorInfoContainer}>
              <View style={styles.doorInfoItem}>
                <ThemedText style={StyleSheet.flatten([styles.doorInfoLabel, { color: colors.mutedForeground }])}>
                  Espaço Superior
                </ThemedText>
                <ThemedText style={styles.doorInfoValue}>
                  {sectionData.doorOffset !== null ? `${sectionData.doorOffset.toFixed(2)}m` : 'Não definido'}
                </ThemedText>
              </View>
              <View style={styles.doorInfoItem}>
                <ThemedText style={StyleSheet.flatten([styles.doorInfoLabel, { color: colors.mutedForeground }])}>
                  Altura da Abertura
                </ThemedText>
                <ThemedText style={styles.doorInfoValue}>
                  {sectionData.doorOffset !== null && layoutInfo
                    ? `${(layoutInfo.height - sectionData.doorOffset).toFixed(2)}m`
                    : 'Não definido'
                  }
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Context Info */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <ThemedText style={styles.sectionSectionTitle}>Informações do Layout</ThemedText>
          <View style={styles.contextInfo}>
            <View style={styles.contextItem}>
              <ThemedText style={StyleSheet.flatten([styles.contextLabel, { color: colors.mutedForeground }])}>Tipo</ThemedText>
              <ThemedText style={styles.contextValue}>{layoutType}</ThemedText>
            </View>
            {layoutInfo && (
              <View style={styles.contextItem}>
                <ThemedText style={StyleSheet.flatten([styles.contextLabel, { color: colors.mutedForeground }])}>Altura Total</ThemedText>
                <ThemedText style={styles.contextValue}>{layoutInfo.height.toFixed(2)}m</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Timestamps */}
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <ThemedText style={styles.sectionSectionTitle}>Histórico</ThemedText>
          <View style={styles.timestampsContainer}>
            <View style={styles.timestampItem}>
              <ThemedText style={StyleSheet.flatten([styles.timestampLabel, { color: colors.mutedForeground }])}>Criado em</ThemedText>
              <ThemedText style={styles.timestampValue}>
                {new Date(sectionData.createdAt).toLocaleDateString("pt-BR")}
              </ThemedText>
            </View>
            <View style={styles.timestampItem}>
              <ThemedText style={StyleSheet.flatten([styles.timestampLabel, { color: colors.mutedForeground }])}>Atualizado em</ThemedText>
              <ThemedText style={styles.timestampValue}>
                {new Date(sectionData.updatedAt).toLocaleDateString("pt-BR")}
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  layoutContext: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
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
  badgeContainer: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  doorBadge: {
    fontSize: 12,
    fontWeight: "500",
  },
  sectionSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  dimensionsGrid: {
    flexDirection: "row",
    gap: 20,
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
  doorInfoContainer: {
    gap: 16,
  },
  doorInfoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  doorInfoLabel: {
    fontSize: 14,
  },
  doorInfoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  contextInfo: {
    gap: 12,
  },
  contextItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contextLabel: {
    fontSize: 14,
  },
  contextValue: {
    fontSize: 14,
    fontWeight: "500",
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