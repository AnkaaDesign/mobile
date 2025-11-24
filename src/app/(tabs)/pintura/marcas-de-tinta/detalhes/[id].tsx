
import { View, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintBrand } from "@/hooks";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege } from "@/utils";
import {
  IconTag,
  IconPalette,
  IconEdit,
} from "@tabler/icons-react-native";

export default function PaintBrandDetailsScreen() {
  const { colors } = useTheme();
  const { data: user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Check user permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.BASIC);

  // Fetch paint brand data
  // Fixed: PaintBrandGetUniqueResponse has a data property, need to extract it
  const { data: paintBrandResponse, isLoading, error } = usePaintBrand(id || "", {
    include: {
      _count: {
        select: {
          paints: true,
        },
      },
      paints: {
        include: {
          paintType: true,
        },
        take: 5, // Limit to first 5 paints for preview
      },
    },
  });

  const paintBrand = paintBrandResponse?.data;

  // Handle edit
  const handleEdit = () => {
    if (!id) return;
    router.push(`/painting/paint-brands/edit/${id}` as any);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando marca de tinta...</ThemedText>
      </View>
    );
  }

  if (error || !paintBrand) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Erro ao carregar marca de tinta
        </ThemedText>
        <Button variant="outline" onPress={() => router.back()} style={styles.backButton}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: paintBrand.name,
          headerBackTitle: "Voltar",
          headerRight: () =>
            canEdit ? (
              <Button size="sm" onPress={handleEdit}>
                <IconEdit size={16} color="#fff" />
              </Button>
            ) : null,
        }}
      />
      <ScrollView
        style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <IconTag size={32} color={colors.primary} />
            <View style={styles.headerText}>
              <ThemedText style={styles.brandName}>{paintBrand.name}</ThemedText>
              {paintBrand._count?.paints !== undefined && (
                <ThemedText style={styles.paintCount}>
                  {paintBrand._count.paints} {paintBrand._count.paints === 1 ? "tinta cadastrada" : "tintas cadastradas"}
                </ThemedText>
              )}
            </View>
          </View>
        </Card>

        {/* Paints List */}
        {paintBrand.paints && paintBrand.paints.length > 0 && (
          <Card style={styles.paintsCard}>
            <View style={styles.sectionHeader}>
              <IconPalette size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Tintas Associadas</ThemedText>
            </View>

            <View style={styles.paintsList}>
              {paintBrand.paints.map((paint: any /* TODO: Add proper type */, index: any /* TODO: Add proper type */) => (
                <View
                  key={paint.id}
                  style={[
                    styles.paintItem,
                    index < paintBrand.paints!.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.colorIndicator,
                      { backgroundColor: paint.hex || colors.muted },
                    ]}
                  />
                  <View style={styles.paintInfo}>
                    <ThemedText style={styles.paintName} numberOfLines={1}>
                      {paint.name}
                    </ThemedText>
                    {paint.code && (
                      <ThemedText style={styles.paintCode}>{paint.code}</ThemedText>
                    )}
                    {paint.paintType && (
                      <Badge variant="outline" style={styles.typeBadge}>
                        {paint.paintType.name}
                      </Badge>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {paintBrand._count?.paints !== undefined && paintBrand._count.paints > 5 && (
              <View style={styles.moreInfo}>
                <ThemedText style={styles.moreInfoText}>
                  E mais {paintBrand._count.paints - 5} {paintBrand._count.paints - 5 === 1 ? "tinta" : "tintas"}
                </ThemedText>
              </View>
            )}
          </Card>
        )}

        {/* Empty State */}
        {(!paintBrand.paints || paintBrand.paints.length === 0) && (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <IconPalette size={48} color={colors.muted} />
              <ThemedText style={styles.emptyText}>
                Nenhuma tinta associada
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Esta marca ainda não possui tintas cadastradas
              </ThemedText>
            </View>
          </Card>
        )}

        {/* Metadata */}
        <Card style={styles.metadataCard}>
          <ThemedText style={styles.metadataTitle}>Informações do Sistema</ThemedText>
          <View style={styles.metadataRow}>
            <ThemedText style={styles.metadataLabel}>ID:</ThemedText>
            <ThemedText style={styles.metadataValue} numberOfLines={1}>
              {paintBrand.id}
            </ThemedText>
          </View>
          {paintBrand.createdAt && (
            <View style={styles.metadataRow}>
              <ThemedText style={styles.metadataLabel}>Criado em:</ThemedText>
              <ThemedText style={styles.metadataValue}>
                {new Date(paintBrand.createdAt).toLocaleDateString("pt-BR")}
              </ThemedText>
            </View>
          )}
          {paintBrand.updatedAt && (
            <View style={styles.metadataRow}>
              <ThemedText style={styles.metadataLabel}>Atualizado em:</ThemedText>
              <ThemedText style={styles.metadataValue}>
                {new Date(paintBrand.updatedAt).toLocaleDateString("pt-BR")}
              </ThemedText>
            </View>
          )}
        </Card>

        {/* Actions */}
        {canEdit && (
          <View style={styles.actions}>
            <Button onPress={handleEdit} style={styles.editButton}>
              <IconEdit size={16} color="#fff" />
              <ThemedText style={styles.editButtonText}>Editar Marca</ThemedText>
            </Button>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorText: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  backButton: {
    marginTop: spacing.sm,
  },
  headerCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  brandName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: 4,
  },
  paintCount: {
    fontSize: fontSize.sm,
    opacity: 0.6,
  },
  paintsCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  paintsList: {
    gap: 0,
  },
  paintItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  colorIndicator: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: spacing.sm,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paintInfo: {
    flex: 1,
  },
  paintName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  paintCode: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginBottom: 4,
  },
  typeBadge: {
    alignSelf: "flex-start",
  },
  moreInfo: {
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    alignItems: "center",
  },
  moreInfoText: {
    fontSize: fontSize.sm,
    opacity: 0.6,
  },
  emptyCard: {
    marginBottom: spacing.md,
    padding: spacing.xl,
  },
  emptyContent: {
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginTop: spacing.md,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    opacity: 0.6,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  metadataCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  metadataTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    opacity: 0.7,
  },
  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  metadataLabel: {
    fontSize: fontSize.sm,
    opacity: 0.6,
  },
  metadataValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
    textAlign: "right",
    marginLeft: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: fontWeight.semibold,
  },
});
