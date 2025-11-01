import { View, FlatList, RefreshControl } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useSharedFolders } from "@/hooks/useServer";
import { Icon } from "@/components/ui/icon";
import { formatFileSize } from "@/utils/file";
import { Separator } from "@/components/ui/separator";

export default function SharedFoldersScreen() {
  const { data, isLoading, refetch, isFetching } = useSharedFolders();

  const getPermissionLevel = (permissions: string): "full" | "read-write" | "read-only" | "restricted" => {
    if (permissions.includes("drwxrwsr-x") || permissions.includes("drwxrwxr-x")) {
      return "full";
    } else if (permissions.includes("rw") || permissions.includes("w")) {
      return "read-write";
    } else if (permissions.includes("r")) {
      return "read-only";
    }
    return "restricted";
  };

  const getPermissionBadgeVariant = (level: string) => {
    switch (level) {
      case "full":
        return "default";
      case "read-write":
        return "secondary";
      case "read-only":
        return "info";
      case "restricted":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getFolderIcon = (type?: string): string => {
    switch (type) {
      case "artwork":
        return "palette";
      case "general":
        return "file-text";
      case "backup":
        return "archive";
      case "receipts":
      case "invoices":
        return "file-invoice";
      case "images":
      case "thumbnails":
        return "image";
      case "trash":
        return "trash";
      default:
        return "folder";
    }
  };

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="p-4 border-b border-border">
          <Text className="text-2xl font-bold mb-2">Pastas Compartilhadas</Text>
          <Text className="text-sm text-muted-foreground">
            Gerenciar pastas WebDAV do servidor
          </Text>
        </View>

        {/* Content */}
        {isLoading ? (
          <LoadingScreen />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState
            icon="folder-share"
            title="Nenhuma pasta encontrada"
            description="Não há pastas compartilhadas configuradas"
          />
        ) : (
          <FlatList
            data={data.data}
            keyExtractor={(item) => item.name}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} />
            }
            renderItem={({ item }) => (
              <Card className="mb-4">
                <CardHeader>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3 flex-1">
                      <Icon
                        name={getFolderIcon(item.type)}
                        className="w-6 h-6 text-primary"
                      />
                      <View className="flex-1">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        {item.type && (
                          <Badge variant="outline" className="mt-1 self-start">
                            {item.type}
                          </Badge>
                        )}
                      </View>
                    </View>
                  </View>
                </CardHeader>

                <CardContent className="gap-3">
                  {/* Description */}
                  {item.description && (
                    <Text className="text-sm text-muted-foreground italic">
                      {item.description}
                    </Text>
                  )}

                  {/* Statistics */}
                  <View className="flex-row flex-wrap gap-2">
                    <Badge variant="secondary">
                      <Icon name="file" className="w-3 h-3 mr-1" />
                      {item.fileCount ?? 0} arquivos
                    </Badge>
                    <Badge variant="secondary">
                      <Icon name="folders" className="w-3 h-3 mr-1" />
                      {item.subdirCount ?? 0} pastas
                    </Badge>
                    <Badge variant="secondary">
                      <Icon name="hard-drive" className="w-3 h-3 mr-1" />
                      {formatFileSize(typeof item.size === 'number' ? item.size : parseInt(item.size || '0', 10))}
                    </Badge>
                  </View>

                  <Separator />

                  {/* Path Info */}
                  <View className="gap-2">
                    <View className="flex-row items-center gap-2">
                      <Icon name="map-pin" className="w-4 h-4 text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground flex-1">
                        {item.path}
                      </Text>
                    </View>

                    {item.webdavPath && (
                      <View className="flex-row items-center gap-2">
                        <Icon name="globe" className="w-4 h-4 text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground flex-1" numberOfLines={1}>
                          {item.webdavPath}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Separator />

                  {/* Permissions and Ownership */}
                  <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">Permissões</Text>
                      <Badge variant={getPermissionBadgeVariant(getPermissionLevel(item.permissions))}>
                        {getPermissionLevel(item.permissions).toUpperCase()}
                      </Badge>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">Proprietário</Text>
                      <Badge variant="outline">{item.owner}</Badge>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">Grupo</Text>
                      <Badge variant="outline">{item.group}</Badge>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">Modificado</Text>
                      <Text className="text-sm">
                        {new Date(item.lastModified).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}
          />
        )}
      </View>
    </PrivilegeGuard>
  );
}
