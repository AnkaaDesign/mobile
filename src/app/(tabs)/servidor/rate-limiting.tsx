import { View, ScrollView, RefreshControl, Alert } from "react-native";
import { useState, useEffect } from "react";
import { Text } from "@/components/ui/text";
import { ThemedView } from "@/components/ui/themed-view";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/api-client";
import { useTheme } from "@/lib/theme";
import { Skeleton } from "@/components/ui/skeleton";
import { useScreenReady } from "@/hooks/use-screen-ready";interface ThrottlerStats {
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

  useScreenReady(!isLoading);

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
        <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: colors.background }}>
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
      </View>
      </PrivilegeGuard>
    );
  }

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <ThemedView className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Overview - 3 column row */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <Card style={{ flex: 1 }}>
            <CardContent style={{ padding: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <View style={{ padding: 6, backgroundColor: colors.muted, borderRadius: 6 }}>
                  <Icon name="key" size={14} color={colors.mutedForeground} />
                </View>
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>
                {stats?.totalKeys ?? 0}
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
                Total
              </Text>
            </CardContent>
          </Card>

          <Card style={{ flex: 1 }}>
            <CardContent style={{ padding: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <View style={{ padding: 6, backgroundColor: "#16a34a15", borderRadius: 6 }}>
                  <Icon name="check-circle" size={14} color="#16a34a" />
                </View>
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#16a34a" }}>
                {stats?.activeKeys ?? 0}
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
                Ativas
              </Text>
            </CardContent>
          </Card>

          <Card style={{ flex: 1 }}>
            <CardContent style={{ padding: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <View style={{ padding: 6, backgroundColor: colors.destructive + "15", borderRadius: 6 }}>
                  <Icon name="alert-triangle" size={14} color={colors.destructive} />
                </View>
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.destructive }}>
                {stats?.blockedKeys ?? 0}
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
                Bloqueadas
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Quick Actions Row */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <Button
            variant="outline"
            onPress={handleClearBlocked}
            disabled={isClearing || (stats?.blockedKeys ?? 0) === 0}
            style={{ flex: 1 }}
            size="sm"
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon name="unlock" size={14} color={(stats?.blockedKeys ?? 0) === 0 ? colors.mutedForeground : colors.destructive} />
              <Text style={{ fontSize: 12, color: (stats?.blockedKeys ?? 0) === 0 ? colors.mutedForeground : colors.foreground }}>
                Desbloquear
              </Text>
            </View>
          </Button>

          <Button
            variant="outline"
            onPress={handleClearAll}
            disabled={isClearing || (stats?.totalKeys ?? 0) === 0}
            style={{ flex: 1 }}
            size="sm"
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon name="trash" size={14} color={(stats?.totalKeys ?? 0) === 0 ? colors.mutedForeground : colors.foreground} />
              <Text style={{ fontSize: 12, color: (stats?.totalKeys ?? 0) === 0 ? colors.mutedForeground : colors.foreground }}>
                Limpar Todas
              </Text>
            </View>
          </Button>
        </View>

        {/* Blocked Keys List */}
        {blockedKeys.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Icon name="alert-triangle" size={16} color={colors.destructive} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, flex: 1 }}>
                  Chaves Bloqueadas
                </Text>
                <Badge variant="destructive">
                  <Text style={{ fontSize: 11 }}>{blockedKeys.length}</Text>
                </Badge>
              </View>

              {blockedKeys.slice(0, 5).map((item, index) => (
                <View key={index}>
                  {index > 0 && <Separator className="my-3" />}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, flex: 1 }} numberOfLines={1}>
                        {item.controller}
                      </Text>
                      <Badge variant="outline">
                        <Text style={{ fontSize: 10 }}>{item.identifierType}</Text>
                      </Badge>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Badge variant="destructive">
                        <Text style={{ fontSize: 10 }}>{item.method}</Text>
                      </Badge>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1 }}>
                        <Icon name="user" size={11} color={colors.mutedForeground} />
                        <Text style={{ fontSize: 11, color: colors.mutedForeground, flex: 1 }} numberOfLines={1}>
                          {item.identifier}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Icon name="clock" size={11} color={colors.mutedForeground} />
                      <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                        Expira em: {item.expiresIn}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {blockedKeys.length > 5 && (
                <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: "center", marginTop: 12 }}>
                  E mais {blockedKeys.length - 5} chave(s) bloqueada(s)...
                </Text>
              )}
            </View>
          </Card>
        )}

        {/* Keys by Controller */}
        {stats?.keysByController && Object.keys(stats.keysByController).length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                Chaves por Controller
              </Text>
              {Object.entries(stats.keysByController).map(([controller, count], index) => (
                <View key={controller}>
                  {index > 0 && <Separator className="my-2" />}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }} numberOfLines={1}>
                      {controller}
                    </Text>
                    <Badge variant="secondary">
                      <Text style={{ fontSize: 11 }}>{count}</Text>
                    </Badge>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Auto-refresh note */}
        <Text style={{ fontSize: 11, color: colors.mutedForeground, textAlign: "center", marginBottom: 16 }}>
          Atualização automática a cada 10 segundos
        </Text>
      </ScrollView>
      </ThemedView>
    </PrivilegeGuard>
  );
}
