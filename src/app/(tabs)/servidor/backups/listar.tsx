import { View, FlatList, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useBackups } from "@/hooks/useBackup";
import { formatDate } from "@/utils/date";
import { formatFileSize } from "@/utils/file";
import { Icon } from "@/components/ui/icon";

export default function BackupsListScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [displaySearch, setDisplaySearch] = useState("");

  const { data, isLoading, refetch, isFetching } = useBackups({
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
    };
    return variants[status] || "secondary";
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      FULL: "default",
      DATABASE: "info",
      FILES: "warning",
    };
    return variants[type] || "secondary";
  };

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="p-4 border-b border-border">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold">Backups do Sistema</Text>
            <Button
              onPress={() => router.push("/servidor/backups/cadastrar")}
              size="sm"
            >
              <Icon name="plus" className="w-4 h-4 mr-2" />
              <Text className="text-primary-foreground">Novo Backup</Text>
            </Button>
          </View>

          <SearchBar
            value={displaySearch}
            onChangeText={handleSearch}
            placeholder="Buscar backups..."
          />
        </View>

        {/* Content */}
        {isLoading ? (
          <LoadingScreen />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState
            icon="database"
            title="Nenhum backup encontrado"
            description="Crie um backup para proteger seus dados"
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
                  router.push(`/servidor/backups/detalhes/${item.id}`)
                }
              >
                <CardHeader>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {item.name || `Backup ${formatDate(item.createdAt)}`}
                      </CardTitle>
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Badge variant={getStatusBadge(item.status)}>
                          {item.status}
                        </Badge>
                        <Badge variant={getTypeBadge(item.type)}>
                          {item.type}
                        </Badge>
                        {item.encrypted && (
                          <Badge variant="info">
                            <Icon name="lock" className="w-3 h-3 mr-1" />
                            Criptografado
                          </Badge>
                        )}
                      </View>
                    </View>
                    <Icon name="chevron-right" className="w-5 h-5 text-muted-foreground" />
                  </View>
                </CardHeader>

                <CardContent>
                  <View className="flex-row items-center gap-4 flex-wrap">
                    {item.size && (
                      <View className="flex-row items-center gap-1">
                        <Icon name="file" className="w-4 h-4 text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">
                          {formatFileSize(item.size)}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row items-center gap-1">
                      <Icon name="clock" className="w-4 h-4 text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                    {item.duration && (
                      <View className="flex-row items-center gap-1">
                        <Icon name="hourglass" className="w-4 h-4 text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">
                          {Math.round(item.duration / 1000)}s
                        </Text>
                      </View>
                    )}
                  </View>

                  {item.description && (
                    <Text className="text-sm text-muted-foreground mt-2">
                      {item.description}
                    </Text>
                  )}

                  {item.status === "FAILED" && item.error && (
                    <View className="mt-2 p-2 bg-destructive/10 rounded-md">
                      <Text className="text-xs text-destructive">
                        Erro: {item.error}
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
