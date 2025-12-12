import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAirbrushingDetail, useAirbrushingMutations } from "@/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconEdit, IconTrash, IconTag } from "@tabler/icons-react-native";
// import { showToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils";
import { SECTOR_PRIVILEGES } from "@/constants";
import { formatDate } from "@/utils";

// Import modular components
import {
  AirbrushingTaskCard,
  AirbrushingDatesCard,
  AirbrushingFilesCard,
} from "@/components/production/airbrushing/detail";
import { AirbrushingDetailSkeleton } from "@/components/production/airbrushing/skeleton";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants";

export default function AirbrushingDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { deleteAsync } = useAirbrushingMutations();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useAirbrushingDetail(id, {
    include: {
      task: {
        include: {
          customer: {
            include: {
              logo: true,
            },
          },
          sector: true,
        },
      },
      receipts: true,
      invoices: true,
      artworks: true,
    },
    enabled: !!id && id !== "",
  });

  const airbrushing = response?.data;

  // Permission check
  const canEdit = useCallback(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const canDelete = useCallback(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const handleEdit = () => {
    if (airbrushing) {
      router.push(`/producao/aerografia/editar/${airbrushing.id}`);
    }
  };

  const handleDelete = useCallback(async () => {
    Alert.alert(
      "Excluir Airbrushing",
      "Tem certeza que deseja excluir este airbrushing? Esta ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              // API client already shows success alert
              router.back();
            } catch (_error) {
              // API client already shows error alert
            }
          },
        },
      ]
    );
  }, [deleteAsync, id]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      Alert.alert("Sucesso", "Dados atualizados com sucesso");
    });
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <AirbrushingDetailSkeleton />
        </View>
      </View>
    );
  }

  if (error || !airbrushing || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Airbrushing não encontrado
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                O airbrushing solicitado não foi encontrado ou pode ter sido removido.
              </ThemedText>
              <Button onPress={() => router.back()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Header Card with Task Name */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.headerLeft, { flex: 1 }]}>
              <ThemedText
                style={StyleSheet.flatten([styles.headerTitle, { color: colors.foreground }])}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {airbrushing.task?.name || "Airbrushing"}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              {canEdit() && (
                <TouchableOpacity
                  onPress={handleEdit}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                  activeOpacity={0.7}
                >
                  <IconEdit size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              )}
              {canDelete() && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.destructive }])}
                  activeOpacity={0.7}
                >
                  <IconTrash size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Card>

        {/* Modular Components */}
        <AirbrushingTaskCard airbrushing={airbrushing} />
        <AirbrushingDatesCard airbrushing={airbrushing} />
        <AirbrushingFilesCard airbrushing={airbrushing} />

        {/* Changelog Timeline */}
        <Card style={styles.card}>
          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.AIRBRUSHING}
            entityId={airbrushing.id}
            entityName={airbrushing.task?.name}
            entityCreatedAt={airbrushing.createdAt}
            maxHeight={500}
            limit={50}
          />
        </Card>

        {/* Metadata Card */}
        <Card style={styles.card}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.sectionHeaderLeft}>
              <IconTag size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.sectionTitle}>Informações do Sistema</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.metadataContainer}>
              <View style={StyleSheet.flatten([styles.metadataRow, { backgroundColor: colors.muted + "50" }])}>
                <ThemedText style={StyleSheet.flatten([styles.metadataLabel, { color: colors.mutedForeground }])}>
                  Criado em
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.metadataValue, { color: colors.foreground }])}>
                  {formatDate(airbrushing.createdAt)}
                </ThemedText>
              </View>
              <View style={StyleSheet.flatten([styles.metadataRow, { backgroundColor: colors.muted + "50" }])}>
                <ThemedText style={StyleSheet.flatten([styles.metadataLabel, { color: colors.mutedForeground }])}>
                  Atualizado em
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.metadataValue, { color: colors.foreground }])}>
                  {formatDate(airbrushing.updatedAt)}
                </ThemedText>
              </View>
            </View>
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={{ height: spacing.md }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
  content: {
    gap: spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  headerTitle: {
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  metadataContainer: {
    gap: spacing.md,
  },
  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  metadataLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  metadataValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
});
