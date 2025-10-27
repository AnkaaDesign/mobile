import { View, ScrollView, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useDeploymentDetail } from "@/hooks/deployment";
import { formatDate } from "@/utils/date";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";

export default function DeploymentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: deployment, isLoading, refetch, isFetching } = useDeploymentDetail(id!);

  if (isLoading || !deployment) {
    return <LoadingScreen />;
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
            {deployment.application} - v{deployment.version}
          </Text>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row items-center gap-2 mb-4">
                <Badge variant={deployment.status === "COMPLETED" ? "success" : deployment.status === "FAILED" ? "destructive" : "default"}>
                  {deployment.status}
                </Badge>
                <Badge variant={deployment.environment === "production" ? "destructive" : deployment.environment === "staging" ? "warning" : "info"}>
                  {deployment.environment}
                </Badge>
              </View>

              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground">Aplicação</Text>
                  <Text className="font-medium">{deployment.application}</Text>
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
            </CardContent>
          </Card>

          {/* Git Info Card */}
          {(deployment.commitSha || deployment.branch || deployment.commitAuthor) && (
            <Card>
              <CardHeader>
                <CardTitle>Informações Git</CardTitle>
              </CardHeader>
              <CardContent className="gap-2">
                {deployment.commitSha && (
                  <View className="flex-row items-center gap-2">
                    <Icon name="git-commit" className="w-4 h-4" />
                    <Text className="font-mono">{deployment.commitSha}</Text>
                  </View>
                )}
                {deployment.branch && (
                  <View className="flex-row items-center gap-2">
                    <Icon name="git-branch" className="w-4 h-4" />
                    <Text>{deployment.branch}</Text>
                  </View>
                )}
                {deployment.commitAuthor && (
                  <View className="flex-row items-center gap-2">
                    <Icon name="user" className="w-4 h-4" />
                    <Text>{deployment.commitAuthor}</Text>
                  </View>
                )}
                {deployment.commitMessage && (
                  <View className="mt-2">
                    <Text className="text-muted-foreground text-sm">
                      {deployment.commitMessage}
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>
          )}

          {/* Logs Card */}
          {deployment.logs && (
            <Card>
              <CardHeader>
                <CardTitle>Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollView horizontal>
                  <Text className="font-mono text-xs">{deployment.logs}</Text>
                </ScrollView>
              </CardContent>
            </Card>
          )}

          {/* Error Card */}
          {deployment.status === "FAILED" && deployment.error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Erro</CardTitle>
              </CardHeader>
              <CardContent>
                <Text className="text-destructive">{deployment.error}</Text>
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>
    </PrivilegeGuard>
  );
}
