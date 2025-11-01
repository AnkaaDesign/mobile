import { useState } from 'react';
import { ScrollView, RefreshControl, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices, startService, stopService, restartService } from '../../../api-client';
import { ThemedView } from '@/components/ui/themed-view';
import { ThemedText } from '@/components/ui/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ErrorScreen } from '@/components/ui/error-screen';
import { SearchBar } from '@/components/ui/search-bar';
import { useToast } from '@/hooks/use-toast';

interface ServiceItem {
  name: string;
  displayName?: string;
  status: string;
  description?: string;
  pid?: string;
  memory?: string;
  uptime?: string;
  enabled?: boolean;
  subState?: string;
}

export default function ServerServicesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  useToast();

  // Query for services
  const { data: servicesData, isLoading, error, refetch } = useQuery({
    queryKey: ['systemServices'],
    queryFn: getServices,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Service action mutations
  const startMutation = useMutation({
    mutationFn: startService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemServices'] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: stopService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemServices'] });
    },
  });

  const restartMutation = useMutation({
    mutationFn: restartService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemServices'] });
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleServiceAction = (action: 'start' | 'stop' | 'restart', serviceName: string, serviceDescription?: string) => {
    const actionLabels = {
      start: 'iniciar',
      stop: 'parar',
      restart: 'reiniciar',
    };

    Alert.alert(
      `Confirmar ${actionLabels[action as keyof typeof actionLabels]}`,
      `Deseja ${actionLabels[action as keyof typeof actionLabels]} o serviço "${serviceDescription || serviceName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: action === 'stop' ? 'destructive' : 'default',
          onPress: () => {
            switch (action) {
              case 'start':
                startMutation.mutate(serviceName);
                break;
              case 'stop':
                stopMutation.mutate(serviceName);
                break;
              case 'restart':
                restartMutation.mutate(serviceName);
                break;
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'unknown':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'play-circle';
      case 'inactive':
        return 'pause-circle';
      case 'failed':
        return 'x-circle';
      case 'unknown':
        return 'help-circle';
      default:
        return 'help-circle';
    }
  };

  const formatUptime = (uptime?: string) => {
    return uptime || 'N/A';
  };

  const formatMemory = (memory?: string) => {
    return memory || 'N/A';
  };

  if (isLoading && !servicesData) {
    return <LoadingScreen message="Carregando serviços..." />;
  }

  if (error && !servicesData) {
    return (
      <ErrorScreen
        title="Erro ao carregar serviços"
        message="Não foi possível carregar a lista de serviços"
        onRetry={handleRefresh}
      />
    );
  }

  const services: ServiceItem[] = servicesData?.data || [];
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const runningCount = services.filter(s => s.status?.toLowerCase() === 'active').length;
  const stoppedCount = services.filter(s => s.status?.toLowerCase() === 'inactive').length;
  const failedCount = services.filter(s => s.status?.toLowerCase() === 'failed').length;

  return (
    <ThemedView className="flex-1">
      <ThemedView className="px-4 py-2">
        <SearchBar
          placeholder="Buscar serviços..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </ThemedView>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Services Summary */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedText className="text-lg font-semibold mb-4">Resumo dos Serviços</ThemedText>

            <ThemedView className="flex-row justify-between">
              <ThemedView className="items-center flex-1">
                <ThemedText className="text-2xl font-bold text-success">
                  {runningCount}
                </ThemedText>
                <ThemedText className="text-sm text-muted-foreground">Em execução</ThemedText>
              </ThemedView>

              <ThemedView className="items-center flex-1">
                <ThemedText className="text-2xl font-bold text-muted-foreground">
                  {stoppedCount}
                </ThemedText>
                <ThemedText className="text-sm text-muted-foreground">Parados</ThemedText>
              </ThemedView>

              <ThemedView className="items-center flex-1">
                <ThemedText className="text-2xl font-bold text-destructive">
                  {failedCount}
                </ThemedText>
                <ThemedText className="text-sm text-muted-foreground">Falharam</ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Card>

        {/* Services List */}
        <ThemedView className="space-y-2">
          {filteredServices.map((service, index) => (
            <Card key={`${service.name}-${index}`} className="mb-2">
              <ThemedView className="p-4">
                {/* Service Header */}
                <ThemedView className="flex-row items-center justify-between mb-3">
                  <ThemedView className="flex-1 mr-3">
                    <ThemedText className="font-semibold">{service.displayName || service.name}</ThemedText>
                    {service.displayName && (
                      <ThemedText className="text-sm text-muted-foreground">{service.name}</ThemedText>
                    )}
                  </ThemedView>

                  <Badge variant={getStatusColor(service.status)}>
                    <ThemedView className="flex-row items-center">
                      <Icon
                        name={getStatusIcon(service.status)}
                        size={12}
                        className="mr-1"
                      />
                      <ThemedText className="text-xs">{service.status}</ThemedText>
                    </ThemedView>
                  </Badge>
                </ThemedView>

                {/* Service Details */}
                <ThemedView className="flex-row justify-between mb-4">
                  <ThemedView className="flex-1">
                    {service.pid && (
                      <ThemedView className="mb-1">
                        <ThemedText className="text-xs text-muted-foreground">PID: {service.pid}</ThemedText>
                      </ThemedView>
                    )}
                    <ThemedView className="flex-row">
                      <ThemedText className="text-xs text-muted-foreground mr-4">
                        Tempo: {formatUptime(service.uptime)}
                      </ThemedText>
                      <ThemedText className="text-xs text-muted-foreground">
                        Mem: {formatMemory(service.memory)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                </ThemedView>

                {/* Action Buttons */}
                <ThemedView className="flex-row gap-2">
                  {service.status?.toLowerCase() !== 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => handleServiceAction('start', service.name, service.displayName)}
                      disabled={startMutation.isPending}
                      className="flex-1"
                    >
                      <Icon name="play" size={14} />
                      <ThemedText className="ml-1 text-xs">Iniciar</ThemedText>
                    </Button>
                  )}

                  {service.status?.toLowerCase() === 'active' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => handleServiceAction('restart', service.name, service.displayName)}
                        disabled={restartMutation.isPending}
                        className="flex-1"
                      >
                        <Icon name="rotate-cw" size={14} />
                        <ThemedText className="ml-1 text-xs">Reiniciar</ThemedText>
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onPress={() => handleServiceAction('stop', service.name, service.displayName)}
                        disabled={stopMutation.isPending}
                        className="flex-1"
                      >
                        <Icon name="square" size={14} />
                        <ThemedText className="ml-1 text-xs">Parar</ThemedText>
                      </Button>
                    </>
                  )}
                </ThemedView>
              </ThemedView>
            </Card>
          ))}
        </ThemedView>

        {filteredServices.length === 0 && (
          <ThemedView className="items-center justify-center py-8">
            <Icon name="server" size={48} className="text-muted-foreground mb-2" />
            <ThemedText className="text-muted-foreground">
              {searchQuery ? 'Nenhum serviço encontrado' : 'Nenhum serviço disponível'}
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}
