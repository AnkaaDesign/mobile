import React, { useState, useCallback, useMemo } from "react";
import { View, ScrollView, RefreshControl, Alert , StyleSheet} from "react-native";
import { router } from "expo-router";
import { secullumService } from '../../../../api-client';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Header } from "@/components/ui/header";
import { ProgressWithMarkers } from "@/components/ui/progress-with-markers";
import { IconRefresh, IconCloudCheck, IconCloudX, IconDatabase, IconUsers, IconClock, IconAlertTriangle, IconPlayerPlay, IconPlayerPause, IconPlayerStop, IconHistory, IconSettings } from "@tabler/icons-react-native";
import { format, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SyncStatus {
  isRunning: boolean;
  lastSync: string | null;
  nextSync: string | null;
  currentOperation: string | null;
  progress: number;
  totalSteps: number;
  currentStep: number;
  errors: number;
  warnings: number;
  status: 'idle' | 'running' | 'paused' | 'error' | 'completed';
  entityTypes: Array<{
    name: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    lastSync: string | null;
    recordsProcessed: number;
    totalRecords: number;
    errors: number;
  }>;
}

interface SyncMetrics {
  totalSynced: number;
  todaysSyncs: number;
  failedSyncs: number;
  averageSyncTime: number;
  lastFullSync: string | null;
  uptime: number;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

interface SystemHealth {
  apiStatus: 'healthy' | 'warning' | 'error';
  databaseStatus: 'healthy' | 'warning' | 'error';
  secullumConnection: 'connected' | 'disconnected' | 'error';
  queueSize: number;
  memoryUsage: number;
  cpuUsage: number;
}

export default function SyncStatusScreen() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sync status and metrics
  const loadSyncData = useCallback(async () => {
    try {
      setError(null);
      const [statusResponse, metricsResponse] = await Promise.all([
        secullumService.getSyncStatus(),
        secullumService.getSystemMetrics(),
      ]);

      // Mock data for demo - in production this would come from the API
      const mockSyncStatus: SyncStatus = {
        isRunning: Math.random() > 0.5,
        lastSync: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        nextSync: new Date(Date.now() + 900000).toISOString(), // 15 minutes from now
        currentOperation: Math.random() > 0.7 ? "Sincronizando funcionários" : null,
        progress: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : 0,
        totalSteps: 5,
        currentStep: Math.floor(Math.random() * 5) + 1,
        errors: Math.floor(Math.random() * 3),
        warnings: Math.floor(Math.random() * 5),
        status: ['idle', 'running', 'paused', 'error', 'completed'][Math.floor(Math.random() * 5)] as any,
        entityTypes: [
          {
            name: "Funcionários",
            status: ['pending', 'running', 'completed', 'error'][Math.floor(Math.random() * 4)] as any,
            lastSync: new Date(Date.now() - Math.random() * 7200000).toISOString(),
            recordsProcessed: Math.floor(Math.random() * 100),
            totalRecords: 120,
            errors: Math.floor(Math.random() * 2),
          },
          {
            name: "Registros de Ponto",
            status: ['pending', 'running', 'completed', 'error'][Math.floor(Math.random() * 4)] as any,
            lastSync: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            recordsProcessed: Math.floor(Math.random() * 500),
            totalRecords: 800,
            errors: Math.floor(Math.random() * 5),
          },
          {
            name: "Cálculos",
            status: ['pending', 'running', 'completed', 'error'][Math.floor(Math.random() * 4)] as any,
            lastSync: new Date(Date.now() - Math.random() * 1800000).toISOString(),
            recordsProcessed: Math.floor(Math.random() * 200),
            totalRecords: 250,
            errors: 0,
          },
          {
            name: "Departamentos",
            status: 'completed' as any,
            lastSync: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            recordsProcessed: 15,
            totalRecords: 15,
            errors: 0,
          },
        ],
      };

      const mockMetrics: SyncMetrics = {
        totalSynced: Math.floor(Math.random() * 10000) + 5000,
        todaysSyncs: Math.floor(Math.random() * 50) + 10,
        failedSyncs: Math.floor(Math.random() * 10),
        averageSyncTime: Math.floor(Math.random() * 120) + 30, // seconds
        lastFullSync: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        uptime: Math.floor(Math.random() * 720) + 60, // hours
        connectionStatus: ['connected', 'disconnected', 'error'][Math.floor(Math.random() * 3)] as any,
      };

      const mockSystemHealth: SystemHealth = {
        apiStatus: ['healthy', 'warning', 'error'][Math.floor(Math.random() * 3)] as any,
        databaseStatus: 'healthy',
        secullumConnection: ['connected', 'disconnected', 'error'][Math.floor(Math.random() * 3)] as any,
        queueSize: Math.floor(Math.random() * 20),
        memoryUsage: Math.floor(Math.random() * 30) + 40, // percentage
        cpuUsage: Math.floor(Math.random() * 20) + 10, // percentage
      };

      setSyncStatus(mockSyncStatus);
      setMetrics(mockMetrics);
      setSystemHealth(mockSystemHealth);

    } catch (err) {
      console.error("Error loading sync data:", err);
      setError("Erro ao carregar informações de sincronização");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    loadSyncData();
  }, [loadSyncData]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSyncData();
  }, [loadSyncData]);

  // Handle sync control actions
  const handleSyncAction = async (action: 'start' | 'pause' | 'stop' | 'resume') => {
    try {
      let title = "";
      let message = "";

      switch (action) {
        case 'start':
          title = "Iniciar Sincronização";
          message = "Deseja iniciar uma sincronização completa?";
          break;
        case 'pause':
          title = "Pausar Sincronização";
          message = "Deseja pausar a sincronização em andamento?";
          break;
        case 'stop':
          title = "Parar Sincronização";
          message = "Deseja parar a sincronização? Os dados já processados não serão perdidos.";
          break;
        case 'resume':
          title = "Retomar Sincronização";
          message = "Deseja retomar a sincronização pausada?";
          break;
      }

      Alert.alert(
        title,
        message,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            onPress: async () => {
              try {
                const triggerType = action === 'start' ? 'full' : action;
                await secullumService.triggerSync({
                  type: triggerType as any,
                });
                await loadSyncData();
              } catch (error) {
                Alert.alert("Erro", "Não foi possível executar a ação solicitada.");
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Erro", "Não foi possível executar a ação solicitada.");
    }
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";

    const date = new Date(dateStr);
    const now = new Date();
    const diffMinutes = differenceInMinutes(now, date);
    const diffHours = differenceInHours(now, date);
    const diffDays = differenceInDays(now, date);

    if (diffMinutes < 1) return "Agora mesmo";
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays} dias atrás`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'healthy':
      case 'connected':
        return "#059669";
      case 'running':
        return "#3B82F6";
      case 'pending':
        return "#F59E0B";
      case 'paused':
        return "#6B7280";
      case 'error':
      case 'disconnected':
        return "#DC2626";
      case 'warning':
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      idle: "Inativo",
      running: "Executando",
      paused: "Pausado",
      error: "Erro",
      completed: "Concluído",
      pending: "Pendente",
      healthy: "Saudável",
      connected: "Conectado",
      disconnected: "Desconectado",
      warning: "Atenção",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorScreen
        title="Erro ao carregar status"
        message={error}
        onRetry={loadSyncData}
      />
    );
  }

  if (!syncStatus || !metrics || !systemHealth) {
    return (
      <ErrorScreen
        title="Dados não encontrados"
        message="Não foi possível carregar as informações de sincronização."
        onRetry={loadSyncData}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Status de Sincronização"
        subtitle="Monitore a integração com Secullum"
        showBackButton
        onBackPress={() => router.back()}
        rightAction={
          <Button variant="ghost" size="sm" onPress={onRefresh} disabled={refreshing}>
            <IconRefresh size={20} color="#3B82F6" />
          </Button>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Current Sync Status */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <IconRefresh size={24} color={getStatusColor(syncStatus.status)} />
            <ThemedText style={styles.statusTitle}>Status Atual</ThemedText>
            <Badge
              variant="outline"
              style={StyleSheet.flatten([styles.statusBadge, { borderColor: getStatusColor(syncStatus.status) }])}
            >
              <ThemedText style={StyleSheet.flatten([styles.statusBadgeText, { color: getStatusColor(syncStatus.status) }])}>
                {getStatusLabel(syncStatus.status)}
              </ThemedText>
            </Badge>
          </View>

          <View style={styles.statusContent}>
            {syncStatus.isRunning && syncStatus.currentOperation && (
              <View style={styles.currentOperation}>
                <ThemedText style={styles.operationText}>
                  {syncStatus.currentOperation}
                </ThemedText>
                <ProgressWithMarkers
                  value={syncStatus.progress}
                  max={100}
                  style={styles.progressBar}
                />
                <ThemedText style={styles.progressText}>
                  Etapa {syncStatus.currentStep} de {syncStatus.totalSteps} ({syncStatus.progress}%)
                </ThemedText>
              </View>
            )}

            <View style={styles.statusInfo}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Última Sincronização:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {formatTimeAgo(syncStatus.lastSync)}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Próxima Sincronização:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {formatTimeAgo(syncStatus.nextSync)}
                </ThemedText>
              </View>
              {(syncStatus.errors > 0 || syncStatus.warnings > 0) && (
                <View style={styles.alertsRow}>
                  {syncStatus.errors > 0 && (
                    <View style={styles.alertItem}>
                      <IconAlertTriangle size={16} color="#DC2626" />
                      <ThemedText style={styles.errorText}>
                        {syncStatus.errors} erro{syncStatus.errors !== 1 ? "s" : ""}
                      </ThemedText>
                    </View>
                  )}
                  {syncStatus.warnings > 0 && (
                    <View style={styles.alertItem}>
                      <IconAlertTriangle size={16} color="#F59E0B" />
                      <ThemedText style={styles.warningText}>
                        {syncStatus.warnings} aviso{syncStatus.warnings !== 1 ? "s" : ""}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Sync Controls */}
        <Card style={styles.controlsCard}>
          <View style={styles.controlsHeader}>
            <ThemedText style={styles.controlsTitle}>Controles de Sincronização</ThemedText>
          </View>
          <View style={styles.controlsContent}>
            <View style={styles.controlsRow}>
              <Button
                variant={syncStatus.status === 'running' ? "secondary" : "default"}
                size="sm"
                style={styles.controlButton}
                onPress={() => handleSyncAction(syncStatus.status === 'running' ? 'pause' : 'start')}
                disabled={syncStatus.status === 'error'}
              >
                {syncStatus.status === 'running' ? (
                  <IconPlayerPause size={16} color="#6B7280" />
                ) : (
                  <IconPlayerPlay size={16} color="white" />
                )}
                <ThemedText style={StyleSheet.flatten([styles.controlButtonText, syncStatus.status === 'running' && styles.secondaryButtonText])}>
                  {syncStatus.status === 'running' ? 'Pausar' : 'Iniciar'}
                </ThemedText>
              </Button>

              {syncStatus.status === 'paused' && (
                <Button
                  variant="outline"
                  size="sm"
                  style={styles.controlButton}
                  onPress={() => handleSyncAction('resume')}
                >
                  <IconPlayerPlay size={16} color="#3B82F6" />
                  <ThemedText style={styles.outlineButtonText}>Retomar</ThemedText>
                </Button>
              )}

              {(syncStatus.status === 'running' || syncStatus.status === 'paused') && (
                <Button
                  variant="destructive"
                  size="sm"
                  style={styles.controlButton}
                  onPress={() => handleSyncAction('stop')}
                >
                  <IconPlayerStop size={16} color="white" />
                  <ThemedText style={styles.controlButtonText}>Parar</ThemedText>
                </Button>
              )}
            </View>
          </View>
        </Card>

        {/* Entity Sync Status */}
        <Card style={styles.entitiesCard}>
          <View style={styles.entitiesHeader}>
            <IconDatabase size={20} color="#3B82F6" />
            <ThemedText style={styles.entitiesTitle}>Status por Entidade</ThemedText>
          </View>
          <View style={styles.entitiesContent}>
            {syncStatus.entityTypes.map((entity, index) => (
              <View key={index} style={styles.entityRow}>
                <View style={styles.entityHeader}>
                  <ThemedText style={styles.entityName}>{entity.name}</ThemedText>
                  <Badge
                    variant="outline"
                    style={StyleSheet.flatten([styles.entityBadge, { borderColor: getStatusColor(entity.status) }])}
                  >
                    <ThemedText style={StyleSheet.flatten([styles.entityBadgeText, { color: getStatusColor(entity.status) }])}>
                      {getStatusLabel(entity.status)}
                    </ThemedText>
                  </Badge>
                </View>

                <View style={styles.entityStats}>
                  <View style={styles.entityStat}>
                    <ThemedText style={styles.entityStatLabel}>Processados</ThemedText>
                    <ThemedText style={styles.entityStatValue}>
                      {entity.recordsProcessed}/{entity.totalRecords}
                    </ThemedText>
                  </View>
                  <View style={styles.entityStat}>
                    <ThemedText style={styles.entityStatLabel}>Última Sync</ThemedText>
                    <ThemedText style={styles.entityStatValue}>
                      {formatTimeAgo(entity.lastSync)}
                    </ThemedText>
                  </View>
                  {entity.errors > 0 && (
                    <View style={styles.entityStat}>
                      <ThemedText style={styles.entityStatLabel}>Erros</ThemedText>
                      <ThemedText style={StyleSheet.flatten([styles.entityStatValue, styles.errorText])}>
                        {entity.errors}
                      </ThemedText>
                    </View>
                  )}
                </View>

                {entity.totalRecords > 0 && (
                  <ProgressWithMarkers
                    value={(entity.recordsProcessed / entity.totalRecords) * 100}
                    max={100}
                    style={styles.entityProgress}
                  />
                )}
              </View>
            ))}
          </View>
        </Card>

        {/* System Health */}
        <Card style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <IconCloudCheck size={20} color={getStatusColor(systemHealth.apiStatus)} />
            <ThemedText style={styles.healthTitle}>Saúde do Sistema</ThemedText>
          </View>
          <View style={styles.healthContent}>
            <View style={styles.healthGrid}>
              <View style={styles.healthItem}>
                <ThemedText style={styles.healthLabel}>API Status</ThemedText>
                <Badge
                  variant="outline"
                  style={StyleSheet.flatten([styles.healthBadge, { borderColor: getStatusColor(systemHealth.apiStatus) }])}
                >
                  <ThemedText style={StyleSheet.flatten([styles.healthBadgeText, { color: getStatusColor(systemHealth.apiStatus) }])}>
                    {getStatusLabel(systemHealth.apiStatus)}
                  </ThemedText>
                </Badge>
              </View>

              <View style={styles.healthItem}>
                <ThemedText style={styles.healthLabel}>Database</ThemedText>
                <Badge
                  variant="outline"
                  style={StyleSheet.flatten([styles.healthBadge, { borderColor: getStatusColor(systemHealth.databaseStatus) }])}
                >
                  <ThemedText style={StyleSheet.flatten([styles.healthBadgeText, { color: getStatusColor(systemHealth.databaseStatus) }])}>
                    {getStatusLabel(systemHealth.databaseStatus)}
                  </ThemedText>
                </Badge>
              </View>

              <View style={styles.healthItem}>
                <ThemedText style={styles.healthLabel}>Secullum</ThemedText>
                <Badge
                  variant="outline"
                  style={StyleSheet.flatten([styles.healthBadge, { borderColor: getStatusColor(systemHealth.secullumConnection) }])}
                >
                  <ThemedText style={StyleSheet.flatten([styles.healthBadgeText, { color: getStatusColor(systemHealth.secullumConnection) }])}>
                    {getStatusLabel(systemHealth.secullumConnection)}
                  </ThemedText>
                </Badge>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Fila de Sincronização</ThemedText>
                <ThemedText style={styles.metricValue}>{systemHealth.queueSize} itens</ThemedText>
              </View>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Uso de Memória</ThemedText>
                <ThemedText style={styles.metricValue}>{systemHealth.memoryUsage}%</ThemedText>
              </View>
              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Uso de CPU</ThemedText>
                <ThemedText style={styles.metricValue}>{systemHealth.cpuUsage}%</ThemedText>
              </View>
            </View>
          </View>
        </Card>

        {/* Sync Metrics */}
        <Card style={styles.metricsCard}>
          <View style={styles.metricsHeader}>
            <IconClock size={20} color="#3B82F6" />
            <ThemedText style={styles.metricsTitle}>Métricas de Sincronização</ThemedText>
          </View>
          <View style={styles.metricsContent}>
            <View style={styles.metricsStatsGrid}>
              <View style={styles.metricsStat}>
                <ThemedText style={styles.metricsStatValue}>{metrics.totalSynced.toLocaleString()}</ThemedText>
                <ThemedText style={styles.metricsStatLabel}>Total Sincronizado</ThemedText>
              </View>
              <View style={styles.metricsStat}>
                <ThemedText style={styles.metricsStatValue}>{metrics.todaysSyncs}</ThemedText>
                <ThemedText style={styles.metricsStatLabel}>Hoje</ThemedText>
              </View>
              <View style={styles.metricsStat}>
                <ThemedText style={StyleSheet.flatten([styles.metricsStatValue, metrics.failedSyncs > 0 && styles.errorText])}>
                  {metrics.failedSyncs}
                </ThemedText>
                <ThemedText style={styles.metricsStatLabel}>Falhas</ThemedText>
              </View>
              <View style={styles.metricsStat}>
                <ThemedText style={styles.metricsStatValue}>{metrics.averageSyncTime}s</ThemedText>
                <ThemedText style={styles.metricsStatLabel}>Tempo Médio</ThemedText>
              </View>
            </View>

            <View style={styles.additionalMetrics}>
              <View style={styles.additionalMetric}>
                <ThemedText style={styles.additionalMetricLabel}>Última Sync Completa:</ThemedText>
                <ThemedText style={styles.additionalMetricValue}>
                  {formatTimeAgo(metrics.lastFullSync)}
                </ThemedText>
              </View>
              <View style={styles.additionalMetric}>
                <ThemedText style={styles.additionalMetricLabel}>Uptime do Sistema:</ThemedText>
                <ThemedText style={styles.additionalMetricValue}>{metrics.uptime}h</ThemedText>
              </View>
              <View style={styles.additionalMetric}>
                <ThemedText style={styles.additionalMetricLabel}>Status da Conexão:</ThemedText>
                <Badge
                  variant="outline"
                  style={StyleSheet.flatten([styles.connectionBadge, { borderColor: getStatusColor(metrics.connectionStatus) }])}
                >
                  <ThemedText style={StyleSheet.flatten([styles.connectionBadgeText, { color: getStatusColor(metrics.connectionStatus) }])}>
                    {getStatusLabel(metrics.connectionStatus)}
                  </ThemedText>
                </Badge>
              </View>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            variant="outline"
            style={styles.actionButton}
            onPress={() => {
              Alert.alert("Em breve", "O histórico de sincronização será implementado em breve.");
            }}
          >
            <IconHistory size={20} color="#3B82F6" />
            <ThemedText style={styles.actionButtonText}>Ver Histórico</ThemedText>
          </Button>

          <Button
            variant="outline"
            style={styles.actionButton}
            onPress={() => {
              Alert.alert("Em breve", "As configurações de sincronização serão implementadas em breve.");
            }}
          >
            <IconSettings size={20} color="#3B82F6" />
            <ThemedText style={styles.actionButtonText}>Configurações</ThemedText>
          </Button>
        </View>
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
  statusCard: {
    padding: 16,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusContent: {
    gap: 16,
  },
  currentOperation: {
    backgroundColor: "#F0F9FF",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  operationText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E40AF",
    marginBottom: 12,
  },
  progressBar: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  statusInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  alertsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "500",
  },
  warningText: {
    color: "#F59E0B",
    fontSize: 12,
    fontWeight: "500",
  },
  controlsCard: {
    padding: 16,
  },
  controlsHeader: {
    marginBottom: 16,
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  controlsContent: {},
  controlsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 100,
  },
  controlButtonText: {
    color: "white",
    fontWeight: "500",
  },
  secondaryButtonText: {
    color: "#6B7280",
  },
  outlineButtonText: {
    color: "#3B82F6",
    fontWeight: "500",
  },
  entitiesCard: {
    padding: 16,
  },
  entitiesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  entitiesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  entitiesContent: {
    gap: 16,
  },
  entityRow: {
    padding: 12,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
  },
  entityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  entityName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  entityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  entityBadgeText: {
    fontSize: 10,
    fontWeight: "500",
  },
  entityStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  entityStat: {
    flex: 1,
  },
  entityStatLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 2,
  },
  entityStatValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  entityProgress: {
    height: 4,
  },
  healthCard: {
    padding: 16,
  },
  healthHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  healthContent: {
    gap: 16,
  },
  healthGrid: {
    flexDirection: "row",
    gap: 12,
  },
  healthItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  healthLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  healthBadgeText: {
    fontSize: 10,
    fontWeight: "500",
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  metricLabel: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "center",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  metricsCard: {
    padding: 16,
  },
  metricsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  metricsContent: {
    gap: 16,
  },
  metricsStatsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  metricsStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    padding: 12,
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
  },
  metricsStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E40AF",
  },
  metricsStatLabel: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "center",
  },
  additionalMetrics: {
    gap: 8,
  },
  additionalMetric: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  additionalMetricLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  additionalMetricValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  connectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  connectionBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  actionButtonText: {
    color: "#3B82F6",
    fontWeight: "500",
  },
});