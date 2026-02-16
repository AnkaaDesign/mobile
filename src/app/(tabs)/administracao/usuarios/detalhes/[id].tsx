import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useUser, useScreenReady } from "@/hooks";
import { routes, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

import {
  IconUser,
  IconEdit,
  IconHistory,
} from "@tabler/icons-react-native";
import { routeToMobilePath } from '@/utils/route-mapper';
import { TouchableOpacity } from "react-native";
// import { showToast } from "@/components/ui/toast";

// Import modular components
import {
  UserCard,
  UserTasksTable,
  UserActivitiesTable,
  UserCreatedTasksTable,
  UserLoginInfoCard,
  UserAddressCard,
  UserPpeSizesCard,
} from "@/components/administration/user/detail";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function UserDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { pushWithLoading } = useNavigationLoading();
  const [refreshing, setRefreshing] = useState(false);

  // End navigation loading overlay when screen mounts
  useScreenReady();

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useUser(id, {
    // Use optimized select for better performance - fetches only fields needed for system user detail view
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cpf: true,
      pis: true,
      birth: true,
      status: true,
      statusOrder: true,
      isActive: true,
      verified: true,
      avatarId: true,
      payrollNumber: true,
      performanceLevel: true,
      // Address fields
      address: true,
      addressNumber: true,
      addressComplement: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
      // Login info
      lastLoginAt: true,
      requirePasswordChange: true,
      // Timestamps
      createdAt: true,
      updatedAt: true,
      // Relations with minimal select
      avatar: {
        select: {
          id: true,
          filename: true,
          path: true,
          thumbnailUrl: true,
        },
      },
      position: {
        select: {
          id: true,
          name: true,
          hierarchy: true,
        },
      },
      sector: {
        select: {
          id: true,
          name: true,
          privileges: true, // Needed for privilege display
        },
      },
      managedSector: {
        select: {
          id: true,
          name: true,
        },
      },
      ppeSize: true, // Full PPE size for detail display
      _count: {
        select: {
          tasks: true,
          createdTasks: true,
          activities: true,
          changeLogs: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const user = response?.data;

  const handleEdit = () => {
    if (user) {
      pushWithLoading(routeToMobilePath(routes.administration.collaborators.edit(user.id)));
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      Alert.alert("Sucesso", "Dados atualizados com sucesso");
    });
  }, [refetch]);

  if (isLoading) {
    return <LoadingScreen message="Carregando usuário..." />;
  }

  if (error || !user || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconUser size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Usuário não encontrado
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                O usuário solicitado não foi encontrado ou pode ter sido removido.
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
          {/* User Name Header Card */}
          <Card style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={[styles.headerLeft, { flex: 1 }]}>
                <IconUser size={24} color={colors.primary} />
                <ThemedText style={StyleSheet.flatten([styles.userName, { color: colors.foreground }])}>
                  {user.name}
                </ThemedText>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={handleEdit}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                  activeOpacity={0.7}
                >
                  <IconEdit size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Modular Components */}
          <UserCard user={user} />

          {/* Personal Information Cards */}
          <UserAddressCard user={user} />
          <UserLoginInfoCard user={user} />
          <UserPpeSizesCard user={user} />

          {/* Tasks Assigned Table */}
          <UserTasksTable user={user} maxHeight={400} />

          {/* Tasks Created Table */}
          <UserCreatedTasksTable user={user} maxHeight={400} />

          {/* Activities Table */}
          <UserActivitiesTable user={user} maxHeight={400} />

          {/* Changelog Timeline */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconHistory size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.USER}
                entityId={user.id}
                entityName={user.name}
                entityCreatedAt={user.createdAt}
                maxHeight={400}
              />
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
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
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
