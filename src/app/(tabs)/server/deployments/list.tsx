import { View, FlatList, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useDeployments } from "@/hooks/deployment";
import { formatDate } from "@/utils/date";
import { Icon } from "@/components/ui/icon";

export default function DeploymentsListScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [displaySearch, setDisplaySearch] = useState("");

  const { data, isLoading, refetch, isFetching } = useDeployments({
    search: searchTerm,
    orderBy: { createdAt: "desc" },
  });

  const handleSearch = useCallback((text: string) => {
    setDisplaySearch(text);
    const timeoutId = setTimeout(() => {
      setSearchTerm(text);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      COMPLETED: "success",
      IN_PROGRESS: "default",
      FAILED: "destructive",
      PENDING: "secondary",
      BUILDING: "default",
      TESTING: "default",
      DEPLOYING: "default",
    };
    return variants[status] || "secondary";
  };

  const getEnvironmentBadge = (env: string) => {
    const variants: Record<string, any> = {
      production: "destructive",
      staging: "warning",
      development: "info",
    };
    return variants[env] || "secondary";
  };

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="p-4 border-b border-border">
          <Text className="text-2xl font-bold mb-4">Deployments</Text>
          <SearchBar
            value={displaySearch}
            onChangeText={handleSearch}
            placeholder="Buscar deployments..."
          />
        </View>

        {/* Content */}
        {isLoading ? (
          <LoadingScreen />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState
            icon="rocket"
            title="Nenhum deployment encontrado"
            description="Os deployments aparecerão aqui"
          />
        ) : (
          <FlatList
            data={data.data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} />
            }
            renderItem={({ item }) => (
              <Card
                className="mb-4"
                onPress={() =>
                  router.push(`/administration/deployments/details/${item.id}`)
                }
              >
                <CardHeader>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {item.application} - v{item.version}
                      </CardTitle>
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Badge variant={getStatusBadge(item.status)}>
                          {item.status}
                        </Badge>
                        <Badge variant={getEnvironmentBadge(item.environment)}>
                          {item.environment}
                        </Badge>
                      </View>
                    </View>
                    <Icon
                      name="chevron-right"
                      className="w-5 h-5 text-muted-foreground"
                    />
                  </View>
                </CardHeader>

                <CardContent>
                  <View className="gap-2">
                    {item.commitSha && (
                      <View className="flex-row items-center gap-2">
                        <Icon
                          name="git-commit"
                          className="w-4 h-4 text-muted-foreground"
                        />
                        <Text className="text-sm text-muted-foreground font-mono">
                          {item.commitSha.substring(0, 7)}
                        </Text>
                      </View>
                    )}
                    {item.branch && (
                      <View className="flex-row items-center gap-2">
                        <Icon
                          name="git-branch"
                          className="w-4 h-4 text-muted-foreground"
                        />
                        <Text className="text-sm text-muted-foreground">
                          {item.branch}
                        </Text>
                      </View>
                    )}
                    {item.deployedBy && (
                      <View className="flex-row items-center gap-2">
                        <Icon
                          name="user"
                          className="w-4 h-4 text-muted-foreground"
                        />
                        <Text className="text-sm text-muted-foreground">
                          {item.deployedBy}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row items-center gap-2">
                      <Icon
                        name="clock"
                        className="w-4 h-4 text-muted-foreground"
                      />
                      <Text className="text-sm text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {item.status === "FAILED" && item.error && (
                    <View className="mt-2 p-2 bg-destructive/10 rounded-md">
                      <Text className="text-xs text-destructive">
                        {item.error}
                      </Text>
                    </View>
                  )}
                </CardContent>
              </Card>
            )}
          />
        )}
      </View>
    </PrivilegeGuard>
  );
}
