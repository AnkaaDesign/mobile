import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useDeploymentDetail } from "@/hooks/deployment";
import { formatDate } from "@/utils/date";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useScreenReady } from '@/hooks/use-screen-ready';


import { Skeleton } from "@/components/ui/skeleton";const styles = StyleSheet.create({
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
  content: {
    gap: spacing.sm,
  },
});

export default function DeploymentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: deployment, isLoading, refetch, isFetching } = useDeploymentDetail(id!);

  useScreenReady(!isLoading);
  const { colors } = useTheme();

  if (isLoading || !deployment) {
    return <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: colors.background }}>
        <Skeleton style={{ height: 24, width: '40%', borderRadius: 4 }} />
        <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 16, width: '70%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '50%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '60%', borderRadius: 4 }} />
        </View>
        <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 16, width: '80%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '45%', borderRadius: 4 }} />
        </View>
      </View>;
  }

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        <View className="p-4 gap-4">
          <Text className="text-2xl font-bold">
            {(deployment as any).application || deployment.environment} - v{deployment.version || 'N/A'}
          </Text>

          {/* Status Card */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <Icon name="check-circle" size={20} color={colors.mutedForeground} />
                <Text style={styles.title}>Status</Text>
              </View>
            </View>
            <View style={styles.content}>
              <View className="flex-row items-center gap-2 mb-4">
                <Badge variant={deployment.status === "COMPLETED" ? "success" : deployment.status === "FAILED" ? "destructive" : "default"}>
                  {deployment.status}
                </Badge>
                <Badge variant={deployment.environment === "PRODUCTION" ? "destructive" : deployment.environment === "STAGING" ? "warning" : "info"}>
                  {deployment.environment}
                </Badge>
              </View>

              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground">Aplicação</Text>
                  <Text className="font-medium">{(deployment as any).application || deployment.environment}</Text>
                </View>
                <Separator />
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground">Versão</Text>
                  <Text className="font-medium">{deployment.version}</Text>
                </View>
                {deployment.deployedBy && (
                  <>
                    <Separator />
                    <View className="flex-row items-center justify-between">
                      <Text className="text-muted-foreground">Deploy por</Text>
                      <Text className="font-medium">{deployment.deployedBy}</Text>
                    </View>
                  </>
                )}
                <Separator />
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground">Data</Text>
                  <Text className="font-medium">{formatDate(deployment.createdAt)}</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Git Info Card */}
          {(deployment.commitSha || deployment.branch || (deployment as any).commitAuthor) && (
            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <Icon name="git-branch" size={20} color={colors.mutedForeground} />
                  <Text style={styles.title}>Informações Git</Text>
                </View>
              </View>
              <View style={styles.content}>
                {deployment.commitSha && (
                  <View className="flex-row items-center gap-2">
                    <Icon name="git-commit" size={20} color={colors.mutedForeground} />
                    <Text className="font-mono">{deployment.commitSha}</Text>
                  </View>
                )}
                {deployment.branch && (
                  <View className="flex-row items-center gap-2">
                    <Icon name="git-branch" size={20} color={colors.mutedForeground} />
                    <Text>{deployment.branch}</Text>
                  </View>
                )}
                {(deployment as any).commitAuthor && (
                  <View className="flex-row items-center gap-2">
                    <Icon name="user" size={20} color={colors.mutedForeground} />
                    <Text>{(deployment as any).commitAuthor}</Text>
                  </View>
                )}
                {(deployment as any).commitMessage && (
                  <View className="mt-2">
                    <Text className="text-muted-foreground text-sm">
                      {(deployment as any).commitMessage}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Logs Card */}
          {deployment.deploymentLog && (
            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <Icon name="file-text" size={20} color={colors.mutedForeground} />
                  <Text style={styles.title}>Logs</Text>
                </View>
              </View>
              <View style={styles.content}>
                <ScrollView horizontal>
                  <Text className="font-mono text-xs">{deployment.deploymentLog}</Text>
                </ScrollView>
              </View>
            </Card>
          )}

          {/* Error Card */}
          {deployment.status === "FAILED" && (deployment as any).error && (
            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.destructive }]}>
                <View style={styles.headerLeft}>
                  <Icon name="alert-circle" size={20} color={colors.destructive} />
                  <Text style={[styles.title, { color: colors.destructive }]}>Erro</Text>
                </View>
              </View>
              <View style={styles.content}>
                <Text style={{ color: colors.destructive }}>{(deployment as any).error}</Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </PrivilegeGuard>
  );
}
