import { View, ScrollView, RefreshControl, Alert } from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useBackup, useBackupMutations } from "@/hooks/useBackup";
import { formatDate } from "@/utils/date";
import { formatFileSize } from "@/utils/file";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";

export default function BackupDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);

  const { data: backup, isLoading, refetch, isFetching } = useBackup(id!);
  const { restore, deleteBackup } = useBackupMutations();

  const handleRestore = () => {
    Alert.alert(
      "Restaurar Backup",
      "Tem certeza que deseja restaurar este backup? Esta ação substituirá os dados atuais.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: async () => {
            try {
              setIsRestoring(true);
              await restore.mutateAsync(id!);
              Alert.alert("Sucesso", "Backup restaurado com sucesso");
              router.back();
            } catch (error) {
              Alert.alert("Erro", "Falha ao restaurar backup");
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Excluir Backup",
      "Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBackup.mutateAsync(id!);
              Alert.alert("Sucesso", "Backup excluído com sucesso");
              router.back();
            } catch (error) {
              Alert.alert("Erro", "Falha ao excluir backup");
            }
          },
        },
      ]
    );
  };

  if (isLoading || !backup) {
    return <LoadingScreen />;
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: "text-green-500",
      IN_PROGRESS: "text-blue-500",
      FAILED: "text-red-500",
      PENDING: "text-yellow-500",
    };
    return colors[status] || "text-gray-500";
  };

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        <View className="p-4 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold flex-1">
              {backup.name || `Backup ${formatDate(backup.createdAt)}`}
            </Text>
          </View>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row items-center gap-2 mb-4">
                <Badge variant={backup.status === "COMPLETED" ? "success" : backup.status === "FAILED" ? "destructive" : "default"}>
                  {backup.status}
                </Badge>
                <Badge variant={backup.type === "FULL" ? "default" : backup.type === "DATABASE" ? "info" : "warning"}>
                  {backup.type}
                </Badge>
                {backup.encrypted && (
                  <Badge variant="info">
                    <Icon name="lock" className="w-3 h-3 mr-1" />
                    Criptografado
                  </Badge>
                )}
              </View>

              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground">Tamanho</Text>
                  <Text className="font-medium">
                    {backup.size ? formatFileSize(backup.size) : "N/A"}
                  </Text>
                </View>
                <Separator />
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground">Duração</Text>
                  <Text className="font-medium">
                    {backup.duration
                      ? `${Math.round(backup.duration / 1000)}s`
                      : "N/A"}
                  </Text>
                </View>
                <Separator />
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground">Criado em</Text>
                  <Text className="font-medium">{formatDate(backup.createdAt)}</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Details Card */}
          {backup.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <Text className="text-muted-foreground">{backup.description}</Text>
              </CardContent>
            </Card>
          )}

          {/* Contents Card */}
          {backup.contents && backup.contents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo</CardTitle>
              </CardHeader>
              <CardContent>
                <View className="gap-2">
                  {backup.contents.map((item: string, index: number) => (
                    <View key={index} className="flex-row items-center gap-2">
                      <Icon name="check" className="w-4 h-4 text-green-500" />
                      <Text>{item}</Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Error Card */}
          {backup.status === "FAILED" && backup.error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Erro</CardTitle>
              </CardHeader>
              <CardContent>
                <Text className="text-destructive">{backup.error}</Text>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <View className="gap-2">
            {backup.status === "COMPLETED" && (
              <Button
                onPress={handleRestore}
                disabled={isRestoring}
                variant="default"
              >
                <Icon name="refresh-cw" className="w-4 h-4 mr-2" />
                <Text className="text-primary-foreground">
                  {isRestoring ? "Restaurando..." : "Restaurar Backup"}
                </Text>
              </Button>
            )}
            <Button
              onPress={handleDelete}
              variant="destructive"
              disabled={isRestoring}
            >
              <Icon name="trash" className="w-4 h-4 mr-2" />
              <Text className="text-destructive-foreground">Excluir Backup</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </PrivilegeGuard>
  );
}
