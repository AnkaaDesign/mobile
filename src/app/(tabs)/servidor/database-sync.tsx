import { View, ScrollView, RefreshControl, Alert } from "react-native";
import { useState, useEffect } from "react";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { Icon } from "@/components/ui/icon";

import { apiClient } from "@/api-client";

interface SyncStatus {
  lastSync?: string;
  isRunning: boolean;
  lastSyncSuccess?: boolean;
  nextScheduledSync?: string;
  recentLogs?: string;
}

export default function DatabaseSyncScreen() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSyncStatus = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const response = await apiClient.get("/server/database/sync-status");
      if (response.data.success) {
        setSyncStatus(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch sync status:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(() => fetchSyncStatus(false), 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSyncStatus(false);
  };

  const handleSyncNow = () => {
    Alert.alert(
      "Sincronizar Banco de Dados",
      "Deseja iniciar uma sincronização manual do banco de dados de Produção para Teste?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sincronizar",
          onPress: async () => {
            try {
              setIsSyncing(true);
              const response = await apiClient.post("/server/database/sync");

              if (response.data.success) {
                Alert.alert(
                  "Sucesso",
                  "Sincronização iniciada com sucesso"
                );
                // Refresh status after a short delay
                setTimeout(() => fetchSyncStatus(false), 2000);
              } else {
                throw new Error(response.data.message);
              }
            } catch (error: any) {
              Alert.alert(
                "Erro",
                error.response?.data?.message || "Falha ao iniciar sincronização"
              );
            } finally {
              setIsSyncing(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (isLoading) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
        <LoadingScreen />
      </PrivilegeGuard>
    );
  }

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="p-4 gap-4">
          {/* Header */}
          <View>
            <Text className="text-2xl font-bold mb-2">Sincronização de BD</Text>
            <Text className="text-sm text-muted-foreground">
              Sincronização unidirecional: Produção → Teste
            </Text>
          </View>

          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex-row items-center gap-2">
                <Icon name="database" className="w-5 h-5" />
                Visão Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <Text className="text-sm text-muted-foreground">
                Esta ferramenta sincroniza o banco de dados de{" "}
                <Text className="font-semibold">Produção</Text> para{" "}
                <Text className="font-semibold">Teste</Text> de forma unidirecional.
              </Text>

              <View className="flex-row items-center gap-3 p-3 bg-primary/10 rounded-lg">
                <Icon name="arrow-right" className="w-6 h-6 text-primary" />
                <View>
                  <Text className="text-sm text-primary font-medium">
                    Direção da Sincronização
                  </Text>
                  <Text className="text-base font-semibold">
                    Produção → Teste
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Status Cards */}
          <View className="gap-3">
            {/* Last Sync */}
            <Card>
              <CardContent className="py-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Icon name="clock" className="w-4 h-4 text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">
                        Última Sincronização
                      </Text>
                    </View>
                    <Text className="text-lg font-semibold">
                      {formatDate(syncStatus?.lastSync)}
                    </Text>
                    {syncStatus?.lastSyncSuccess !== undefined && (
                      <View className="flex-row items-center gap-2 mt-1">
                        <Icon
                          name={syncStatus.lastSyncSuccess ? "check-circle" : "x-circle"}
                          className={`w-4 h-4 ${
                            syncStatus.lastSyncSuccess ? "text-green-500" : "text-red-500"
                          }`}
                        />
                        <Text
                          className={`text-sm ${
                            syncStatus.lastSyncSuccess ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {syncStatus.lastSyncSuccess ? "Sucesso" : "Falha"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardContent className="py-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Icon name="activity" className="w-4 h-4 text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">
                        Status Atual
                      </Text>
                    </View>
                    <Text
                      className={`text-lg font-semibold ${
                        syncStatus?.isRunning ? "text-primary" : ""
                      }`}
                    >
                      {syncStatus?.isRunning ? "Em Execução" : "Inativo"}
                    </Text>
                    {syncStatus?.isRunning && (
                      <View className="flex-row items-center gap-2 mt-1">
                        <Icon name="loader" className="w-4 h-4 text-primary" />
                        <Text className="text-sm text-primary">Sincronizando...</Text>
                      </View>
                    )}
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Next Scheduled Sync */}
            <Card>
              <CardContent className="py-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Icon name="calendar" className="w-4 h-4 text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">
                        Próxima Sincronização
                      </Text>
                    </View>
                    <Text className="text-lg font-semibold">
                      {formatDate(syncStatus?.nextScheduledSync)}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-1">
                      00:00 e 12:00 diariamente
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>

          {/* Manual Sync Button */}
          <Card>
            <CardHeader>
              <CardTitle>Sincronização Manual</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onPress={handleSyncNow}
                disabled={syncStatus?.isRunning || isSyncing}
                className="w-full"
              >
                <Icon
                  name={isSyncing || syncStatus?.isRunning ? "loader" : "refresh-cw"}
                  className="w-4 h-4 mr-2"
                />
                <Text className="text-primary-foreground">
                  {isSyncing || syncStatus?.isRunning
                    ? "Sincronizando..."
                    : "Sincronizar Agora"}
                </Text>
              </Button>
              <Text className="text-xs text-muted-foreground mt-2 text-center">
                Inicia uma sincronização imediata de produção para teste
              </Text>
            </CardContent>
          </Card>

          {/* Recent Logs */}
          {syncStatus?.recentLogs && (
            <Card>
              <CardHeader>
                <CardTitle className="flex-row items-center gap-2">
                  <Icon name="file-text" className="w-5 h-5" />
                  Logs Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollView
                  horizontal
                  className="bg-muted/50 rounded-lg p-3"
                  style={{ maxHeight: 200 }}
                >
                  <Text className="font-mono text-xs">
                    {syncStatus.recentLogs}
                  </Text>
                </ScrollView>
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>
    </PrivilegeGuard>
  );
}
