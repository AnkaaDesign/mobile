import { View, ScrollView, RefreshControl, Alert } from "react-native";
import { useState, useEffect } from "react";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/api-client";
import { useTheme } from "@/lib/theme";

interface ThrottlerStats {
  totalKeys: number;
  activeKeys: number;
  blockedKeys: number;
  keysByType?: Record<string, number>;
  keysByController?: Record<string, number>;
  blockedDetails?: Array<{
    key: string;
    ttl: number;
    expiresIn: string;
  }>;
}

interface BlockedKey {
  key: string;
  controller: string;
  method: string;
  throttlerName: string;
  identifierType: "user" | "ip" | "unknown";
  identifier: string;
  ttl: number;
  expiresIn: string;
}

export default function RateLimitingScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<ThrottlerStats | null>(null);
  const [blockedKeys, setBlockedKeys] = useState<BlockedKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);

      const [statsResponse, blockedResponse] = await Promise.all([
        apiClient.get("/system/throttler/stats"),
        apiClient.get("/system/throttler/blocked-keys"),
      ]);

      console.log("Rate limiting data fetched:", { stats: statsResponse.data, blocked: blockedResponse.data });

      if (statsResponse.data?.success) {
        setStats(statsResponse.data.data);
      } else {
        setStats(null);
      }

      if (blockedResponse.data?.success) {
        setBlockedKeys(blockedResponse.data.data || []);
      } else {
        setBlockedKeys([]);
      }
    } catch (err) {
      console.error("Failed to fetch throttler data:", err);
      setStats(null);
      setBlockedKeys([]);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
  };

  const handleClearAll = () => {
    Alert.alert(
      "Limpar Todas as Chaves",
      "Tem certeza que deseja limpar TODAS as chaves de throttler? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: async () => {
            try {
              setIsClearing(true);
              const response = await apiClient.delete("/system/throttler/keys");

              if (response.data.success) {
                Alert.alert("Sucesso", "Todas as chaves foram limpas");
                fetchData(false);
              }
            } catch (error: any) {
              Alert.alert("Erro", "Falha ao limpar chaves");
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleClearBlocked = () => {
    Alert.alert(
      "Desbloquear Chaves",
      "Tem certeza que deseja desbloquear todas as chaves bloqueadas?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desbloquear",
          style: "destructive",
          onPress: async () => {
            try {
              setIsClearing(true);
              const response = await apiClient.delete("/system/throttler/blocked-keys");

              if (response.data.success) {
                Alert.alert("Sucesso", "Chaves desbloqueadas com sucesso");
                fetchData(false);
              }
            } catch (error: any) {
              Alert.alert("Erro", "Falha ao desbloquear chaves");
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
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
            <Text className="text-2xl font-bold mb-2">Rate Limiting</Text>
            <Text className="text-sm text-muted-foreground">
              Monitoramento de limites de taxa de requisições
            </Text>
          </View>

          {/* Stats Overview */}
          <View className="gap-3">
            <Card>
              <CardContent className="py-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm text-muted-foreground mb-1">
                      Total de Chaves
                    </Text>
                    <Text className="text-3xl font-bold">
                      {stats?.totalKeys ?? 0}
                    </Text>
                  </View>
                  <Icon name="key" className="w-8 h-8 text-muted-foreground" />
                </View>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm text-muted-foreground mb-1">
                      Chaves Ativas
                    </Text>
                    <Text className="text-3xl font-bold" style={{ color: colors.success }}>
                      {stats?.activeKeys ?? 0}
                    </Text>
                  </View>
                  <Icon name="check-circle" size={32} color={colors.success} />
                </View>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm text-muted-foreground mb-1">
                      Chaves Bloqueadas
                    </Text>
                    <Text className="text-3xl font-bold" style={{ color: colors.destructive }}>
                      {stats?.blockedKeys ?? 0}
                    </Text>
                  </View>
                  <Icon name="alert-triangle" size={32} color={colors.destructive} />
                </View>
              </CardContent>
            </Card>
          </View>

          {/* Blocked Keys List */}
          {blockedKeys.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex-row items-center gap-2">
                  <Icon name="alert-triangle" size={20} color={colors.destructive} />
                  Chaves Bloqueadas ({blockedKeys.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="gap-3">
                {blockedKeys.slice(0, 5).map((item, index) => (
                  <View key={index}>
                    {index > 0 && <Separator className="mb-3" />}
                    <View className="gap-2">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <Text className="text-sm font-medium">
                            {item.controller}
                          </Text>
                          <Badge variant="destructive" className="mt-1 self-start">
                            {item.method}
                          </Badge>
                        </View>
                        <Badge variant="outline">
                          {item.identifierType}
                        </Badge>
                      </View>

                      <View className="gap-1">
                        <View className="flex-row items-center gap-2">
                          <Icon name="user" className="w-3 h-3 text-muted-foreground" />
                          <Text className="text-xs text-muted-foreground font-mono flex-1" numberOfLines={1}>
                            {item.identifier}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-2">
                          <Icon name="clock" className="w-3 h-3 text-muted-foreground" />
                          <Text className="text-xs text-muted-foreground">
                            Expira em: {item.expiresIn}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}

                {blockedKeys.length > 5 && (
                  <Text className="text-sm text-muted-foreground text-center mt-2">
                    E mais {blockedKeys.length - 5} chave(s) bloqueada(s)...
                  </Text>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <Button
                variant="destructive"
                onPress={handleClearBlocked}
                disabled={isClearing || (stats?.blockedKeys ?? 0) === 0}
              >
                <Icon name="unlock" className="w-4 h-4 mr-2" />
                <Text className="text-destructive-foreground">
                  Desbloquear Todas
                </Text>
              </Button>

              <Button
                variant="outline"
                onPress={handleClearAll}
                disabled={isClearing || (stats?.totalKeys ?? 0) === 0}
              >
                <Icon name="trash" className="w-4 h-4 mr-2" />
                <Text>Limpar Todas as Chaves</Text>
              </Button>

              <Text className="text-xs text-muted-foreground text-center">
                As chaves são atualizadas automaticamente a cada 10 segundos
              </Text>
            </CardContent>
          </Card>

          {/* Keys by Controller */}
          {stats?.keysByController && Object.keys(stats.keysByController).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Chaves por Controller</CardTitle>
              </CardHeader>
              <CardContent className="gap-2">
                {Object.entries(stats.keysByController).map(([controller, count], index) => (
                  <View key={controller}>
                    {index > 0 && <Separator className="my-2" />}
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm flex-1" numberOfLines={1}>
                        {controller}
                      </Text>
                      <Badge variant="secondary">{count}</Badge>
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>
    </PrivilegeGuard>
  );
}
