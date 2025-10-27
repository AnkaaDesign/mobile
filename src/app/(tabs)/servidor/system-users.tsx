import { View, FlatList, RefreshControl, Alert } from "react-native";
import { useState } from "react";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useSystemUsers, useDeleteSystemUser } from "@/hooks/useServer";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";

export default function SystemUsersScreen() {
  const { data, isLoading, refetch, isFetching } = useSystemUsers();
  const { mutateAsync: deleteUser } = useDeleteSystemUser();
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case "active":
        return "check-circle";
      case "inactive":
        return "circle";
      case "locked":
        return "x-circle";
      default:
        return "user";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "secondary";
      case "locked":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "inactive":
        return "Inativo";
      case "locked":
        return "Bloqueado";
      default:
        return "Desconhecido";
    }
  };

  const handleDeleteUser = (username: string) => {
    Alert.alert(
      "Confirmar remoção",
      `Tem certeza que deseja remover o usuário ${username}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingUser(username);
              await deleteUser(username);
              Alert.alert("Sucesso", "Usuário removido com sucesso");
              refetch();
            } catch (error) {
              Alert.alert("Erro", "Falha ao remover usuário");
            } finally {
              setDeletingUser(null);
            }
          },
        },
      ]
    );
  };

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="p-4 border-b border-border">
          <Text className="text-2xl font-bold mb-2">Usuários do Sistema</Text>
          <Text className="text-sm text-muted-foreground">
            Gerenciar usuários do sistema operacional
          </Text>
        </View>

        {/* Content */}
        {isLoading ? (
          <LoadingScreen />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState
            icon="users"
            title="Nenhum usuário encontrado"
            description="Não há usuários do sistema"
          />
        ) : (
          <FlatList
            data={data.data}
            keyExtractor={(item) => item.username}
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
                        name={getStatusIcon(item.status)}
                        className={`w-5 h-5 ${
                          item.status === "active"
                            ? "text-green-500"
                            : item.status === "locked"
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      <View className="flex-1">
                        <CardTitle className="text-lg">{item.username}</CardTitle>
                        <Badge variant={getStatusVariant(item.status)} className="mt-1 self-start">
                          {getStatusText(item.status)}
                        </Badge>
                      </View>
                    </View>
                  </View>
                </CardHeader>

                <CardContent className="gap-3">
                  {/* Full Name */}
                  {item.fullName && (
                    <View>
                      <Text className="text-sm font-medium text-muted-foreground">
                        Nome Completo
                      </Text>
                      <Text className="text-base">{item.fullName}</Text>
                    </View>
                  )}

                  <Separator />

                  {/* System Info */}
                  <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">UID</Text>
                      <Text className="text-sm font-mono">{item.uid}</Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">GID</Text>
                      <Text className="text-sm font-mono">{item.gid}</Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">Shell</Text>
                      <Text className="text-sm font-mono">{item.shell}</Text>
                    </View>
                  </View>

                  <Separator />

                  {/* Home Directory */}
                  <View>
                    <Text className="text-sm font-medium text-muted-foreground mb-1">
                      Diretório Home
                    </Text>
                    <Text className="text-sm font-mono">{item.home}</Text>
                  </View>

                  {/* Last Login */}
                  {item.lastLogin && (
                    <>
                      <Separator />
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-muted-foreground">Último login</Text>
                        <Text className="text-sm">
                          {new Date(item.lastLogin).toLocaleString("pt-BR")}
                        </Text>
                      </View>
                    </>
                  )}

                  {/* Actions */}
                  <View className="mt-2">
                    <Button
                      variant="destructive"
                      onPress={() => handleDeleteUser(item.username)}
                      disabled={deletingUser === item.username}
                    >
                      <Icon name="trash" className="w-4 h-4 mr-2" />
                      <Text className="text-destructive-foreground">
                        {deletingUser === item.username ? "Removendo..." : "Remover Usuário"}
                      </Text>
                    </Button>
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
