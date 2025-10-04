import React from "react";
import { View, ScrollView, ActivityIndicator , StyleSheet} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { IconButton } from "@/components/ui/icon-button";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintGround, usePaintGroundMutations } from '../../../../../hooks';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, PAINT_TYPE_ENUM_LABELS, PAINT_FINISH_LABELS } from '../../../../../constants';
import { hasPrivilege, formatDate } from '../../../../../utils';
import { useToast } from "@/lib/toast/use-toast";
import { Alert } from "react-native";
import {
  IconPalette,
  IconArrowRight,
  IconEdit,
  IconTrash,
  IconBarcode,
  IconBuildingFactory,
  IconDroplet,
  IconCalendar,
  IconLayersIntersect2,
  IconTag,
} from "@tabler/icons-react-native";

export default function PaintGroundDetailScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { delete: deletePaintGround } = usePaintGroundMutations();
  const { toast } = useToast();

  // Check user permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch paint ground details
  const { data: paintGround, isLoading, error, refetch } = usePaintGround(id!, {
    include: {
      paint: {
        include: {
          paintType: true,
          paintBrand: true,
          formulas: {
            include: {
              _count: {
                select: {
                  components: true,
                },
              },
            },
            take: 3,
          },
          _count: {
            select: {
              formulas: true,
              productions: true,
            },
          },
        },
      },
      groundPaint: {
        include: {
          paintType: true,
          paintBrand: true,
          formulas: {
            include: {
              _count: {
                select: {
                  components: true,
                },
              },
            },
            take: 3,
          },
          _count: {
            select: {
              formulas: true,
              productions: true,
            },
          },
        },
      },
    },
  });

  // Handle actions
  const handleEdit = () => {
    if (!canEdit) {
      toast({ title: "Você não tem permissão para editar", variant: "destructive" });
      return;
    }
    router.push(`/painting/paint-grounds/edit/${id}`);
  };

  const handleDelete = () => {
    if (!canDelete) {
      toast({ title: "Você não tem permissão para excluir", variant: "destructive" });
      return;
    }

    if (!paintGround) return;

    Alert.alert(
      "Excluir Base de Tinta",
      `Tem certeza que deseja excluir a relação "${paintGround.data?.paint?.name || 'Tinta'}" → "${paintGround.data?.groundPaint?.name || 'Base'}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePaintGround(id!);
              toast({ title: "Base de tinta excluída com sucesso", variant: "success" });
              router.back();
            } catch (error) {
              toast({ title: "Erro ao excluir base de tinta", variant: "destructive" });
            }
          },
        },
      ]
    );
  };

  // Render paint details card
  const renderPaintCard = (paint: any, title: string) => (
    <Card style={styles.paintCard}>
      <View style={styles.paintCardHeader}>
        <IconPalette size={20} color={colors.primary} />
        <ThemedText style={styles.paintCardTitle}>{title}</ThemedText>
      </View>

      {/* Color and Name */}
      <View style={styles.paintMainInfo}>
        <View
          style={[
            styles.colorIndicator,
            { backgroundColor: paint?.hex || colors.muted },
          ]}
        />
        <View style={styles.paintInfo}>
          <ThemedText style={styles.paintName}>{paint?.name || "Sem nome"}</ThemedText>
          {paint?.code && (
            <View style={styles.codeContainer}>
              <IconBarcode size={14} color={colors.foreground} />
              <ThemedText style={styles.infoText}>{paint.code}</ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Paint Type */}
      {paint?.paintType && (
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Tipo:</ThemedText>
          <Badge variant="default">
            {paint.paintType.name}
          </Badge>
        </View>
      )}

      {/* Paint Brand */}
      {paint?.paintBrand && (
        <View style={styles.infoRow}>
          <IconBuildingFactory size={16} color={colors.foreground} />
          <ThemedText style={styles.infoText}>{paint.paintBrand.name}</ThemedText>
        </View>
      )}

      {/* Paint Finish */}
      {paint?.finish && (
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Acabamento:</ThemedText>
          <ThemedText style={styles.infoText}>
            {PAINT_FINISH_LABELS[paint.finish] || paint.finish}
          </ThemedText>
        </View>
      )}

      {/* Statistics */}
      {paint?._count && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{paint._count.formulas || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Fórmulas</ThemedText>
          </View>
          <View style={StyleSheet.flatten([styles.statDivider, { backgroundColor: colors.border }])} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{paint._count.productions || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Produções</ThemedText>
          </View>
        </View>
      )}
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando detalhes...</ThemedText>
      </View>
    );
  }

  if (error || !paintGround) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          {error ? "Erro ao carregar detalhes" : "Base de tinta não encontrada"}
        </ThemedText>
        <IconButton
          name="refresh-cw"
          variant="default"
          onPress={() => refetch()}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Detalhes da Base",
          headerBackTitle: "Voltar",
          headerRight: () => (
            <View style={styles.headerActions}>
              {canEdit && (
                <IconButton
                  name="edit"
                  size="sm"
                  variant="default"
                  onPress={handleEdit}
                />
              )}
              {canDelete && (
                <IconButton
                  name="trash"
                  size="sm"
                  variant="default"
                  onPress={handleDelete}
                />
              )}
            </View>
          ),
        }}
      />
      <ScrollView
        style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Relationship Overview */}
        <Card style={styles.relationshipCard}>
          <View style={styles.relationshipHeader}>
            <IconLayersIntersect2 size={24} color={colors.primary} />
            <ThemedText style={styles.relationshipTitle}>Relação de Base</ThemedText>
          </View>

          <View style={styles.relationshipFlow}>
            <View style={styles.relationshipItem}>
              <ThemedText style={styles.relationshipLabel}>Tinta</ThemedText>
              <ThemedText style={styles.relationshipValue}>
                {paintGround.data?.paint?.name || "N/A"}
              </ThemedText>
            </View>

            <View style={styles.relationshipArrow}>
              <IconArrowRight size={20} color={colors.primary} />
              <ThemedText style={styles.relationshipArrowText}>precisa</ThemedText>
            </View>

            <View style={styles.relationshipItem}>
              <ThemedText style={styles.relationshipLabel}>Base</ThemedText>
              <ThemedText style={styles.relationshipValue}>
                {paintGround.data?.groundPaint?.name || "N/A"}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Main Paint Details */}
        {paintGround.data?.paint && renderPaintCard(paintGround.data.paint, "Tinta Principal")}

        {/* Ground Paint Details */}
        {paintGround.data?.groundPaint && renderPaintCard(paintGround.data.groundPaint, "Tinta Base")}

        {/* Metadata */}
        <Card style={styles.metadataCard}>
          <View style={styles.metadataHeader}>
            <IconCalendar size={20} color={colors.primary} />
            <ThemedText style={styles.metadataTitle}>Informações do Registro</ThemedText>
          </View>

          <View style={styles.metadataItem}>
            <ThemedText style={styles.metadataLabel}>Criado em:</ThemedText>
            <ThemedText style={styles.metadataValue}>
              {formatDate(new Date(paintGround.data?.createdAt || new Date()))}
            </ThemedText>
          </View>

          <View style={styles.metadataItem}>
            <ThemedText style={styles.metadataLabel}>Atualizado em:</ThemedText>
            <ThemedText style={styles.metadataValue}>
              {formatDate(new Date(paintGround.data?.updatedAt || new Date()))}
            </ThemedText>
          </View>
        </Card>
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
  retryButton: {
    marginTop: spacing.sm,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  relationshipCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  relationshipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  relationshipTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  relationshipFlow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  relationshipItem: {
    flex: 1,
    alignItems: "center",
  },
  relationshipLabel: {
    fontSize: fontSize.sm,
    opacity: 0.6,
    marginBottom: 4,
  },
  relationshipValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  relationshipArrow: {
    alignItems: "center",
    marginHorizontal: spacing.md,
  },
  relationshipArrowText: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginTop: 2,
  },
  paintCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  paintCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  paintCardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  paintMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  colorIndicator: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginRight: spacing.sm,
  },
  infoIcon: {
    marginRight: 4,
    opacity: 0.6,
  },
  infoText: {
    fontSize: fontSize.sm,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  metadataCard: {
    padding: spacing.md,
  },
  metadataHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  metadataTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  metadataItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metadataLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  metadataValue: {
    fontSize: fontSize.sm,
    opacity: 0.8,
  },
});