import { View, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDeploymentDetail } from "@/hooks/deployment";
import { formatDate } from "@/utils/date";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { IconRocket } from "@tabler/icons-react-native";

export default function DeploymentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const query = useDeploymentDetail(id as string);

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconRocket}
      title={(d) => `${(d as any).app?.displayName || (d as any).app?.name || (d as any).application || d.environment} - v${d.version || "N/A"}`}
      privilege={SECTOR_PRIVILEGES.ADMIN}
      notFoundFallback={mobileRoute(routes.server.deployments.list)}
    >
      {(deployment) => (
        <View style={styles.body}>
          {/* Status Card */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <Icon name="check-circle" size={20} color={colors.mutedForeground} />
                <Text style={styles.title}>Status</Text>
              </View>
            </View>
            <View style={styles.content}>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <Badge variant={deployment.status === "COMPLETED" ? "success" : deployment.status === "FAILED" ? "destructive" : "default"}>
                  {deployment.status}
                </Badge>
                <Badge variant={deployment.environment === "PRODUCTION" ? "destructive" : deployment.environment === "STAGING" ? "warning" : "info"}>
                  {deployment.environment}
                </Badge>
              </View>

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.mutedForeground }}>Aplicação</Text>
                  <Text style={{ fontWeight: "500" }}>{deployment.app?.displayName || deployment.app?.name || deployment.application || deployment.environment}</Text>
                </View>
                <Separator />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.mutedForeground }}>Versão</Text>
                  <Text style={{ fontWeight: "500" }}>{deployment.version}</Text>
                </View>
                {deployment.deployedBy && (
                  <>
                    <Separator />
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.mutedForeground }}>Deploy por</Text>
                      <Text style={{ fontWeight: "500" }}>{deployment.deployedBy}</Text>
                    </View>
                  </>
                )}
                <Separator />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.mutedForeground }}>Data</Text>
                  <Text style={{ fontWeight: "500" }}>{formatDate(deployment.createdAt)}</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Git Info Card */}
          {(deployment.gitCommit?.hash || deployment.commitSha || deployment.gitCommit?.branch || deployment.branch || deployment.gitCommit?.author || deployment.commitAuthor) && (
            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <Icon name="git-branch" size={20} color={colors.mutedForeground} />
                  <Text style={styles.title}>Informações Git</Text>
                </View>
              </View>
              <View style={styles.content}>
                {(deployment.gitCommit?.hash || deployment.commitSha) && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Icon name="git-commit" size={20} color={colors.mutedForeground} />
                    <Text style={{ fontFamily: "Courier" }}>{deployment.gitCommit?.hash || deployment.commitSha}</Text>
                  </View>
                )}
                {(deployment.gitCommit?.branch || deployment.branch) && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Icon name="git-branch" size={20} color={colors.mutedForeground} />
                    <Text>{deployment.gitCommit?.branch || deployment.branch}</Text>
                  </View>
                )}
                {(deployment.gitCommit?.author || deployment.commitAuthor) && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Icon name="user" size={20} color={colors.mutedForeground} />
                    <Text>{deployment.gitCommit?.author || deployment.commitAuthor}</Text>
                  </View>
                )}
                {(deployment.gitCommit?.message || deployment.commitMessage) && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
                      {deployment.gitCommit?.message || deployment.commitMessage}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Logs Card — long-running ops progress UI */}
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
                  <Text style={{ fontFamily: "Courier", fontSize: 12 }}>{deployment.deploymentLog}</Text>
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
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
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
