import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSector, useSectorMutations, useScreenReady} from '@/hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES } from "@/constants";
import { Card, CardContent } from "@/components/ui/card";

import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import {
  IconRefresh,
  IconEdit,
  IconTrash,
  IconHistory,
} from "@tabler/icons-react-native";
import { routeToMobilePath } from '@/utils/route-mapper';
import { TouchableOpacity } from "react-native";
// import { showToast } from "@/components/ui/toast";
import { ErrorScreen } from "@/components/ui/error-screen";
import { hasPrivilege } from "@/utils";
import { useAuth } from "@/contexts/auth-context";

// Import modular components
import { SpecificationsCard, UsersTable, TasksTable } from "@/components/administration/sector/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";


import { Skeleton } from "@/components/ui/skeleton";export default function SectorDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deleteAsync } = useSectorMutations();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useSector(id, {
    include: {
      users: {
        include: {
          position: true,
          sector: true,
          managedSector: true,
        },
        orderBy: {
          name: "asc",
        },
      },
      managedByUsers: true,
      changelogs: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
      _count: {
        select: {
          users: true,
          tasks: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  useScreenReady(!isLoading);

  const sector = response?.data;

  const handleEdit = () => {
    if (!canEdit) {
      Alert.alert("Erro", "Você não tem permissão para editar");
      return;
    }
    if (sector) {
      router.push(routeToMobilePath(routes.administration.sectors.edit(sector.id)) as any);
    }
  };

  const handleDelete = () => {
    if (!canDelete) {
      Alert.alert("Erro", "Você não tem permissão para excluir");
      return;
    }

    const userCount = sector?._count?.users || 0;
    const warningMessage = userCount > 0
      ? `\n\nAtenção: Este setor possui ${userCount} usuário${userCount !== 1 ? "s" : ""} associado${userCount !== 1 ? "s" : ""}.`
      : "";

    Alert.alert(
      "Excluir Setor",
      `Tem certeza que deseja excluir o setor "${sector?.name}"?${warningMessage}\n\nEsta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id);
              // API client already shows success alert
              router.back();
            } catch (_error) {
              // API client already shows error alert
            }
          },
        },
      ]
    );
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    Alert.alert("Sucesso", "Detalhes atualizados");
  }, [refetch]);

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          {/* Header name card */}
          <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton style={{ height: 24, width: '55%', borderRadius: 4 }} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Skeleton style={{ width: 36, height: 36, borderRadius: borderRadius.md }} />
              <Skeleton style={{ width: 36, height: 36, borderRadius: borderRadius.md }} />
            </View>
          </View>
          {/* SpecificationsCard */}
          <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md }}>
            <Skeleton style={{ height: 18, width: '45%', borderRadius: 4, marginBottom: spacing.xs }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Skeleton style={{ height: 14, width: '30%', borderRadius: 4 }} />
              <Skeleton style={{ height: 14, width: '40%', borderRadius: 4 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Skeleton style={{ height: 14, width: '30%', borderRadius: 4 }} />
              <Skeleton style={{ height: 14, width: '50%', borderRadius: 4 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Skeleton style={{ height: 14, width: '25%', borderRadius: 4 }} />
              <Skeleton style={{ height: 22, width: '35%', borderRadius: 11 }} />
            </View>
          </View>
          {/* UsersTable */}
          <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            <View style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Skeleton style={{ height: 18, width: '40%', borderRadius: 4 }} />
            </View>
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Skeleton style={{ width: 32, height: 32, borderRadius: 16 }} />
                  <Skeleton style={{ height: 14, width: 100, borderRadius: 4 }} />
                </View>
                <Skeleton style={{ height: 14, width: 70, borderRadius: 4 }} />
              </View>
            ))}
          </View>
          {/* TasksTable */}
          <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            <View style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Skeleton style={{ height: 18, width: '35%', borderRadius: 4 }} />
            </View>
            {Array.from({ length: 2 }).map((_, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: i < 1 ? 1 : 0, borderBottomColor: colors.border }}>
                <Skeleton style={{ height: 14, width: '50%', borderRadius: 4 }} />
                <Skeleton style={{ height: 22, width: 60, borderRadius: 11 }} />
              </View>
            ))}
          </View>
          {/* ChangelogTimeline */}
          <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md }}>
            <Skeleton style={{ height: 18, width: '55%', borderRadius: 4, marginBottom: spacing.xs }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                <Skeleton style={{ width: 4, height: 50, borderRadius: 2 }} />
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                    <Skeleton style={{ width: 70, height: 18, borderRadius: 4 }} />
                    <Skeleton style={{ width: 90, height: 18, borderRadius: 4 }} />
                  </View>
                  <Skeleton style={{ height: 13, width: '60%', borderRadius: 4 }} />
                </View>
              </View>
            ))}
          </View>
          <View style={{ height: spacing.xxl * 2 }} />
        </View>
      </ScrollView>
    );
  }

  if (error || !sector || !id || id === "") {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes do setor"
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
      <View style={styles.content}>
        {/* Sector Name Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText style={StyleSheet.flatten([styles.sectorTitle, { color: colors.foreground }])} numberOfLines={2}>
                {sector.name}
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

        {/* Info Grid - Specifications */}
        <View style={styles.infoGrid}>
          <SpecificationsCard sector={sector} />
        </View>

        {/* Related Users - Show table before tasks */}
        <UsersTable sector={sector} maxHeight={500} />

        {/* Related Tasks */}
        <TasksTable sector={sector} maxHeight={500} />

        {/* Changelog Timeline - After tables */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconHistory size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.SECTOR}
              entityId={sector.id}
              entityName={sector.name}
              entityCreatedAt={sector.createdAt}
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectorTitle: {
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
  infoGrid: {
    gap: spacing.lg,
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
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
});
