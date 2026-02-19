import { useState, useEffect } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintType, usePaintTypeMutations, useScreenReady } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, PAINT_FINISH_LABELS, TRUCK_MANUFACTURER_LABELS } from "@/constants";
import { hasPrivilege, formatDate } from "@/utils";
// import { showToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconRefresh,
  IconEdit,
  IconTrash,
  IconPaint,
  IconSettings,
  IconComponents,
  IconInfoCircle,
  IconBrush,
  IconCalendar,
} from "@tabler/icons-react-native";
import { ComponentsTable } from "@/components/painting/paint-type/detail";


import { Skeleton } from "@/components/ui/skeleton";

export default function PaintTypeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deleteAsync } = usePaintTypeMutations();
  const [refreshing, setRefreshing] = useState(false);

  // End navigation loading overlay when screen mounts

  // Check permissions
  // Fixed: PAINTING doesn't exist in SECTOR_PRIVILEGES, using PRODUCTION instead
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch paint type details
  const { data: response, isLoading, error, refetch } = usePaintType(id as string, {
    include: {
      componentItems: {
        include: {
          measures: true,
          category: true,
          brand: true,
        },
      },
      paints: {
        orderBy: { name: "asc" },
        include: {
          paintBrand: true,
          formulas: true,
        },
      },
      _count: {
        select: {
          paints: true,
          componentItems: true,
        },
      },
    },
    enabled: !!id,
  });

  useScreenReady(!isLoading);

  const paintType = response?.data;

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    Alert.alert("Sucesso", "Detalhes atualizados");
  };

  // Handle edit
  const handleEdit = () => {
    if (!canEdit) {
      Alert.alert("Erro", "Você não tem permissão para editar");
      return;
    }
    router.push(`/pintura/tipos-de-tinta/editar/${id}`);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      Alert.alert("Erro", "Você não tem permissão para excluir");
      return;
    }

    Alert.alert(
      "Excluir Tipo de Tinta",
      "Tem certeza que deseja excluir este tipo de tinta? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              Alert.alert("Sucesso", "Tipo de tinta excluído com sucesso");
              router.back();
            } catch (_error) {
              // API client already shows error alert
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, gap: 16, paddingBottom: 32 }}>
          {/* Header card: name + action buttons */}
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Skeleton style={{ height: 22, width: '55%', borderRadius: 4 }} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Skeleton style={{ width: 36, height: 36, borderRadius: 8 }} />
                <Skeleton style={{ width: 36, height: 36, borderRadius: 8 }} />
              </View>
            </View>
          </View>
          {/* Basic info card: name + needGround */}
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
              <Skeleton style={{ height: 16, width: '45%', borderRadius: 4 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton style={{ height: 14, width: '25%', borderRadius: 4 }} />
              <Skeleton style={{ height: 14, width: '45%', borderRadius: 4 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton style={{ height: 14, width: '35%', borderRadius: 4 }} />
              <Skeleton style={{ height: 22, width: 50, borderRadius: 10 }} />
            </View>
          </View>
          {/* Statistics card */}
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
              <Skeleton style={{ height: 16, width: '35%', borderRadius: 4 }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[1, 2].map((i) => (
                <View key={i} style={{ flex: 1, backgroundColor: colors.muted, borderRadius: 8, padding: 16, alignItems: 'center', gap: 8 }}>
                  <Skeleton style={{ width: 24, height: 24, borderRadius: 4 }} />
                  <Skeleton style={{ height: 28, width: '50%', borderRadius: 4 }} />
                  <Skeleton style={{ height: 13, width: '60%', borderRadius: 4 }} />
                </View>
              ))}
            </View>
          </View>
          {/* Related paints card */}
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
              <Skeleton style={{ height: 16, width: '45%', borderRadius: 4 }} />
            </View>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                <Skeleton style={{ width: 40, height: 40, borderRadius: 6 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton style={{ height: 14, width: '55%', borderRadius: 4 }} />
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <Skeleton style={{ height: 20, width: 50, borderRadius: 4 }} />
                    <Skeleton style={{ height: 20, width: 45, borderRadius: 4 }} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  if (error || !paintType) {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes do tipo de tinta"
        onRetry={refetch}
      />
    );
  }

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contentView}>
        {/* Header Card with Title and Actions */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText style={StyleSheet.flatten([styles.paintTypeTitle, { color: colors.foreground }])} numberOfLines={2}>
                {paintType.name}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleRefresh}
                style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.muted }])}
                activeOpacity={0.7}
                disabled={refreshing}
              >
                <IconRefresh size={18} color={colors.foreground} />
              </TouchableOpacity>
              {canEdit && (
                <TouchableOpacity
                  onPress={handleEdit}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                  activeOpacity={0.7}
                >
                  <IconEdit size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.destructive }])}
                  activeOpacity={0.7}
                >
                  <IconTrash size={18} color={colors.destructiveForeground} />
                </TouchableOpacity>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Basic Information Card */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconInfoCircle size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações Básicas</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Nome</ThemedText>
              <ThemedText style={styles.detailValue}>{paintType.name}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Requer Fundo</ThemedText>
              <Badge variant={paintType.needGround ? "default" : "secondary"}>
                {paintType.needGround ? "Sim" : "Não"}
              </Badge>
            </View>
          </View>
        </Card>

        {/* Statistics Card */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconSettings size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Estatísticas</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.statisticsGrid}>
            <View style={StyleSheet.flatten([styles.statItem, { backgroundColor: colors.muted }])}>
              <IconPaint size={24} color={colors.primary} />
              <ThemedText style={styles.statValue}>{paintType._count?.paints || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Tintas</ThemedText>
            </View>
            <View style={StyleSheet.flatten([styles.statItem, { backgroundColor: colors.muted }])}>
              <IconComponents size={24} color={colors.primary} />
              <ThemedText style={styles.statValue}>{paintType._count?.componentItems || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Componentes</ThemedText>
            </View>
            </View>
          </View>
        </Card>

        {/* Related Paints Section */}
        {paintType.paints && paintType.paints.length > 0 ? (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconBrush size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Tintas Relacionadas</ThemedText>
              </View>
            </View>
            <ScrollView
              style={{ maxHeight: 400 }}
              nestedScrollEnabled
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.paintsList}>
                {paintType.paints.map((paint: any) => (
                  <TouchableOpacity
                    key={paint.id}
                    style={StyleSheet.flatten([
                      styles.paintItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      }
                    ])}
                    onPress={() => router.push(`/pintura/catalogo/detalhes/${paint.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.paintItemLeft}>
                      <View
                        style={StyleSheet.flatten([
                          styles.colorPreview,
                          {
                            backgroundColor: paint.hex || colors.muted,
                            borderColor: colors.border,
                          }
                        ])}
                      />
                      <View style={styles.paintInfo}>
                        <ThemedText style={styles.paintName} numberOfLines={1}>
                          {paint.name}
                        </ThemedText>
                        <View style={styles.paintBadges}>
                          {paint.finish && (
                            <Badge variant="secondary" size="sm">
                              {PAINT_FINISH_LABELS[paint.finish as keyof typeof PAINT_FINISH_LABELS] || paint.finish}
                            </Badge>
                          )}
                          {paint.paintBrand?.name && (
                            <Badge variant="outline" size="sm">
                              {paint.paintBrand.name}
                            </Badge>
                          )}
                          {paint.manufacturer && (
                            <Badge variant="outline" size="sm">
                              {TRUCK_MANUFACTURER_LABELS[paint.manufacturer as keyof typeof TRUCK_MANUFACTURER_LABELS] || paint.manufacturer}
                            </Badge>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Card>
        ) : (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconBrush size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Tintas Relacionadas</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <View style={styles.emptyState}>
              <IconPaint size={48} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
              <ThemedText style={styles.emptyStateText}>
                Nenhuma tinta cadastrada para este tipo
              </ThemedText>
              </View>
            </View>
          </Card>
        )}

        {/* Components Table */}
        <ComponentsTable paintType={paintType} maxHeight={400} />

        {/* Metadata Card */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconCalendar size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Metadados</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Data de Criação</ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDate(paintType.createdAt)}
              </ThemedText>
            </View>
            {paintType.updatedAt && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Última Atualização</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatDate(paintType.updatedAt)}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Bottom spacing for mobile navigation */}
        <View style={{ height: spacing.xxl * 2 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  paintTypeTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  contentView: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  content: {
    gap: spacing.sm,
  },
  itemDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "400",
  },
  statisticsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  paintsList: {
    gap: spacing.sm,
  },
  paintItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  paintItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  paintInfo: {
    flex: 1,
  },
  paintName: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  paintBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  paintItemRight: {
    marginLeft: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyStateText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    textAlign: "center",
  },
});
