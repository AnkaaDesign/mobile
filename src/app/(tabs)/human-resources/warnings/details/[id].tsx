import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useWarning, useWarningMutations } from '../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE, WARNING_SEVERITY_LABELS, SECTOR_PRIVILEGES } from '../../../../../constants';
import { formatDate, hasPrivilege } from '../../../../../utils';
import { Card, CardContent } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconAlertTriangle, IconRefresh, IconEdit, IconTrash, IconHistory, IconCalendar } from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { showToast } from "@/components/ui/toast";

// Import modular components
import { WarningCard, EmployeeCard, DescriptionCard, IssuerCard, AttachmentsCard, WitnessCard } from "@/components/human-resources/warning/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function WarningDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { delete: deleteAsync } = useWarningMutations();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.HUMAN_RESOURCES);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useWarning(id, {
    include: {
      collaborator: {
        include: {
          position: true,
          sector: true,
          warnings: {
            where: {
              id: {
                not: id,
              },
            },
          },
        },
      },
      supervisor: {
        include: {
          position: true,
          sector: true,
        },
      },
      witness: {
        include: {
          position: true,
          sector: true,
        },
      },
      attachments: true,
    },
    enabled: !!id && id !== "",
  });

  const warning = response?.data;

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    showToast({ message: "Detalhes atualizados", type: "success" });
  }, [refetch]);

  // Handle edit
  const handleEdit = () => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para editar", type: "error" });
      return;
    }
    if (warning) {
      router.push(routeToMobilePath(routes.humanResources.warnings.edit(warning.id)) as any);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Advertência",
      "Tem certeza que deseja excluir esta advertência? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              showToast({ message: "Advertência excluída com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir advertência", type: "error" });
            }
          },
        },
      ]
    );
  };

  // Get severity color
  const getSeverityColor = () => {
    if (!warning) return { bg: colors.muted, text: colors.foreground, icon: colors.foreground };

    switch (warning.severity) {
      case "VERBAL":
        return { bg: extendedColors.blue[100], text: extendedColors.blue[700], icon: extendedColors.blue[600] };
      case "WRITTEN":
        return { bg: extendedColors.yellow[100], text: extendedColors.yellow[700], icon: extendedColors.yellow[600] };
      case "SUSPENSION":
        return { bg: extendedColors.orange[100], text: extendedColors.orange[700], icon: extendedColors.orange[600] };
      case "FINAL_WARNING":
        return { bg: extendedColors.red[100], text: extendedColors.red[700], icon: extendedColors.red[600] };
      default:
        return { bg: colors.muted, text: colors.foreground, icon: colors.foreground };
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes da advertência..." />;
  }

  if (error || !warning || !id || id === "") {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes da advertência"
        onRetry={refetch}
      />
    );
  }

  const severityColor = getSeverityColor();
  const daysUntilFollowUp = warning.followUpDate ? Math.ceil((new Date(warning.followUpDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

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
      <View style={styles.content}>
        {/* Warning Name Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText style={StyleSheet.flatten([styles.warningTitle, { color: colors.foreground }])} numberOfLines={2}>
                {WARNING_SEVERITY_LABELS[warning.severity]} - {warning.collaborator?.name}
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.warningSubtitle, { color: colors.mutedForeground }])}>
                {warning.reason}
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

        {/* Warning Information Card - Status and Severity */}
        <WarningCard warning={warning} />

        {/* Employee Information */}
        <EmployeeCard warning={warning} />

        {/* Warning Details */}
        <DescriptionCard warning={warning} />

        {/* Supervisor/Manager Information */}
        <IssuerCard warning={warning} />

        {/* Witnesses */}
        <WitnessCard warning={warning} />

        {/* Attachments */}
        <AttachmentsCard warning={warning} />

        {/* Changelog History */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconHistory size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Histórico de Alterações</ThemedText>
          </View>
          <View style={{ paddingHorizontal: spacing.md }}>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.WARNING}
              entityId={warning.id}
              entityName={`Advertência - ${warning.collaborator?.name}`}
              entityCreatedAt={warning.createdAt}
              maxHeight={400}
            />
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  warningTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  warningSubtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    marginLeft: spacing.sm,
    flex: 1,
  },
});
