import React, { useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { secullumService } from '@/api-client';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Header } from "@/components/ui/header";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRefresh, IconCloudCheck, IconShieldLock, IconSettings } from "@tabler/icons-react-native";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useNav } from "@/contexts/nav";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

export default function SyncStatusScreen() {
  const { colors } = useTheme();
  const nav = useNav();
  const goBack = () => nav.goBack();

  // All data comes from the real Secullum integration health endpoints.
  const healthQuery = useQuery({
    queryKey: ["secullum", "health"],
    queryFn: () => secullumService.getHealth(),
    staleTime: 30 * 1000,
  });
  const authQuery = useQuery({
    queryKey: ["secullum", "auth-status"],
    queryFn: () => secullumService.getAuthStatus(),
    staleTime: 30 * 1000,
  });
  const configQuery = useQuery({
    queryKey: ["secullum", "configuration"],
    queryFn: () => secullumService.getConfiguration(),
    staleTime: 60 * 60 * 1000,
  });

  const isLoading = healthQuery.isLoading || authQuery.isLoading;
  const isRefreshing = healthQuery.isRefetching || authQuery.isRefetching || configQuery.isRefetching;
  const error = healthQuery.error || authQuery.error;

  useScreenReady(!isLoading);

  const onRefresh = useCallback(() => {
    healthQuery.refetch();
    authQuery.refetch();
    configQuery.refetch();
  }, [healthQuery, authQuery, configQuery]);

  const health = healthQuery.data?.data;
  const auth = authQuery.data?.data;
  const configItems = configQuery.data?.data?.data || [];

  // Map health status -> color/label.
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "ok":
        return "#059669";
      case "degraded":
        return "#F59E0B";
      case "down":
      case "disconnected":
      case "error":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const getHealthLabel = (status?: string) => {
    const labels: Record<string, string> = {
      healthy: "Saudável",
      degraded: "Degradado",
      down: "Indisponível",
      connected: "Conectado",
      disconnected: "Desconectado",
    };
    return status ? labels[status] || status : "Desconhecido";
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return "-";
    try {
      return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{ backgroundColor: colors.card, borderRadius: 8, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Skeleton width={24} height={24} style={{ borderRadius: 12 }} />
                <Skeleton width="40%" height={18} />
                <Skeleton width={80} height={24} style={{ borderRadius: 12, marginLeft: "auto" }} />
              </View>
              {[1, 2].map((j) => (
                <View key={j} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Skeleton width="45%" height={14} />
                  <Skeleton width="30%" height={14} />
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </ThemedView>
    );
  }

  if (error && !health && !auth) {
    return (
      <ErrorScreen
        title="Erro ao carregar status"
        message="Não foi possível carregar o status da integração com a Secullum."
        onRetry={onRefresh}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Status da Integração"
        subtitle="Conexão e autenticação com a Secullum"
        showBackButton
        onBackPress={() => goBack()}
        rightAction={
          <Button variant="ghost" size="sm" onPress={onRefresh} disabled={isRefreshing}>
            <IconRefresh size={20} color="#3B82F6" />
          </Button>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#3B82F6"]} tintColor="#3B82F6" />
        }
      >
        {/* Connection health */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <IconCloudCheck size={24} color={getStatusColor(health?.status)} />
            <ThemedText style={styles.cardTitle}>Conexão</ThemedText>
            <Badge
              variant="outline"
              style={StyleSheet.flatten([styles.badge, { borderColor: getStatusColor(health?.status) }])}
            >
              <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: getStatusColor(health?.status) }])}>
                {getHealthLabel(health?.status)}
              </ThemedText>
            </Badge>
          </View>

          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Banco de dados</ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: getStatusColor(health?.database?.status) }])}>
                {getHealthLabel(health?.database?.status)}
              </ThemedText>
            </View>
            {typeof health?.database?.responseTime === "number" && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Tempo de resposta</ThemedText>
                <ThemedText style={styles.infoValue}>{health.database.responseTime} ms</ThemedText>
              </View>
            )}
            {!!health?.version && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Versão</ThemedText>
                <ThemedText style={styles.infoValue}>{health.version}</ThemedText>
              </View>
            )}
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Verificado em</ThemedText>
              <ThemedText style={styles.infoValue}>{formatDateTime(health?.timestamp)}</ThemedText>
            </View>
          </View>
        </Card>

        {/* Authentication */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <IconShieldLock size={24} color={auth?.isAuthenticated ? "#059669" : "#DC2626"} />
            <ThemedText style={styles.cardTitle}>Autenticação</ThemedText>
            <Badge
              variant="outline"
              style={StyleSheet.flatten([styles.badge, { borderColor: auth?.isAuthenticated ? "#059669" : "#DC2626" }])}
            >
              <ThemedText
                style={StyleSheet.flatten([styles.badgeText, { color: auth?.isAuthenticated ? "#059669" : "#DC2626" }])}
              >
                {auth?.isAuthenticated ? "Autenticado" : "Não autenticado"}
              </ThemedText>
            </Badge>
          </View>

          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Token válido</ThemedText>
              <ThemedText
                style={StyleSheet.flatten([styles.infoValue, { color: auth?.tokenValid ? "#059669" : "#DC2626" }])}
              >
                {auth?.tokenValid ? "Sim" : "Não"}
              </ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Expira em</ThemedText>
              <ThemedText style={styles.infoValue}>{formatDateTime(auth?.tokenExpiresAt)}</ThemedText>
            </View>
          </View>
        </Card>

        {/* Configuration */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSettings size={24} color="#3B82F6" />
            <ThemedText style={styles.cardTitle}>Configuração</ThemedText>
            <Badge variant="outline" style={StyleSheet.flatten([styles.badge, { borderColor: "#3B82F6" }])}>
              <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: "#3B82F6" }])}>
                {configItems.length} {configItems.length === 1 ? "item" : "itens"}
              </ThemedText>
            </Badge>
          </View>

          <View style={styles.infoBlock}>
            {configQuery.isLoading ? (
              <Skeleton width="100%" height={14} />
            ) : configItems.length === 0 ? (
              <ThemedText style={styles.emptyText}>Nenhuma configuração disponível.</ThemedText>
            ) : (
              configItems.slice(0, 10).map((item, index) => {
                const label = item?.Nome ?? item?.name ?? item?.Descricao ?? `Configuração ${index + 1}`;
                const value = item?.Valor ?? item?.value ?? "-";
                return (
                  <View key={index} style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel} numberOfLines={1}>
                      {String(label)}
                    </ThemedText>
                    <ThemedText style={styles.infoValue} numberOfLines={1}>
                      {String(value)}
                    </ThemedText>
                  </View>
                );
              })
            )}
          </View>
        </Card>

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoBlock: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    flexShrink: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    flexShrink: 1,
    textAlign: "right",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
  },
});
