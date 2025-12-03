import { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSystemStatus, getSystemHealth } from '../../../api-client';
import { ThemedView } from '@/components/ui/themed-view';
import { ThemedText } from '@/components/ui/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ErrorScreen } from '@/components/ui/error-screen';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/text-area';
// import { useToast } from '@/hooks/use-toast';

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  estimatedDuration: string;
  allowedUsers: string[];
  scheduledStart?: string;
  scheduledEnd?: string;
}

export default function ServerMaintenanceScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings>({
    enabled: false,
    message: 'Sistema em manutenção. Tente novamente em alguns minutos.',
    estimatedDuration: '30 minutos',
    allowedUsers: [],
  });
  const [customMessage, setCustomMessage] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [allowedUser, setAllowedUser] = useState('');

  const queryClient = useQueryClient();

  // Query for system status to check maintenance mode
  const { data: statusData, isLoading, error, refetch } = useQuery({
    queryKey: ['systemStatus'],
    queryFn: getSystemStatus,
    refetchInterval: 30000,
  });

  // Query for system health
  const { data: healthData } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: getSystemHealth,
    refetchInterval: 30000,
  });

  // Mutation for toggling maintenance mode
  const toggleMaintenanceMutation = useMutation({
    mutationFn: async (settings: MaintenanceSettings) => {
      // This would call the actual API endpoint
      // For now, simulating the API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, data: settings });
        }, 1000);
      });
    },
    onSuccess: (_data, settings) => {
      // API client already shows success alert
      queryClient.invalidateQueries({ queryKey: ['systemStatus'] });
      queryClient.invalidateQueries({ queryKey: ['systemHealth'] });
    },
    onError: (_error) => {
      // API client already shows error alert
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

  const handleToggleMaintenance = () => {
    const newSettings = {
      ...maintenanceSettings,
      enabled: !maintenanceSettings.enabled,
      message: customMessage || maintenanceSettings.message,
      estimatedDuration: estimatedDuration || maintenanceSettings.estimatedDuration,
    };

    if (newSettings.enabled) {
      Alert.alert(
        'Ativar Modo de Manutenção',
        'Isso impedirá que usuários não autorizados acessem o sistema. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Ativar',
            style: 'destructive',
            onPress: () => {
              setMaintenanceSettings(newSettings);
              toggleMaintenanceMutation.mutate(newSettings);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Desativar Modo de Manutenção',
        'O sistema voltará ao funcionamento normal. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desativar',
            onPress: () => {
              setMaintenanceSettings(newSettings);
              toggleMaintenanceMutation.mutate(newSettings);
            },
          },
        ]
      );
    }
  };

  const handleAddAllowedUser = () => {
    if (!allowedUser.trim()) return;

    const newAllowedUsers = [...maintenanceSettings.allowedUsers, allowedUser.trim()];
    setMaintenanceSettings({
      ...maintenanceSettings,
      allowedUsers: newAllowedUsers,
    });
    setAllowedUser('');
    Alert.alert("Sucesso", `Usuário ${allowedUser} adicionado à lista`);
  };

  const handleRemoveAllowedUser = (userToRemove: string) => {
    const newAllowedUsers = maintenanceSettings.allowedUsers.filter(user => user !== userToRemove);
    setMaintenanceSettings({
      ...maintenanceSettings,
      allowedUsers: newAllowedUsers,
    });
    Alert.alert("Sucesso", `Usuário ${userToRemove} removido da lista`);
  };

  const handleScheduleMaintenance = () => {
    Alert.alert(
      'Agendar Manutenção',
      'Função de agendamento em desenvolvimento. Por enquanto, utilize o modo manual.',
      [{ text: 'OK' }]
    );
  };

  // Check if maintenance is currently active (currently only local state)
  const isMaintenanceActive = maintenanceSettings.enabled;
  const systemHealth = healthData?.data?.overall || 'unknown';

  useEffect(() => {
    // Note: Real maintenance mode integration would go here
    // Currently the system status doesn't include maintenanceMode property
    // This is for future backend integration
  }, [statusData]);

  if (isLoading && !statusData) {
    return <LoadingScreen message="Carregando configurações..." />;
  }

  if (error && !statusData) {
    return (
      <ErrorScreen
        title="Erro ao carregar configurações"
        message="Não foi possível carregar as configurações de manutenção"
        onRetry={handleRefresh}
      />
    );
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Current Status */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedView className="flex-row items-center justify-between mb-4">
              <ThemedText className="text-lg font-semibold">Status Atual</ThemedText>
              <Badge variant={isMaintenanceActive ? 'destructive' : 'success'}>
                <ThemedView className="flex-row items-center">
                  <Icon
                    name={isMaintenanceActive ? 'construction' : 'check-circle'}
                    size={12}
                    className="mr-1"
                  />
                  <ThemedText className="text-xs">
                    {isMaintenanceActive ? 'Em Manutenção' : 'Operacional'}
                  </ThemedText>
                </ThemedView>
              </Badge>
            </ThemedView>

            <ThemedView className="space-y-3">
              <ThemedView className="flex-row justify-between">
                <ThemedText className="text-sm text-muted-foreground">Sistema</ThemedText>
                <ThemedText className="text-sm font-medium">
                  {isMaintenanceActive ? 'Modo de Manutenção Ativo' : 'Funcionamento Normal'}
                </ThemedText>
              </ThemedView>

              <ThemedView className="flex-row justify-between">
                <ThemedText className="text-sm text-muted-foreground">Saúde Geral</ThemedText>
                <Badge variant={systemHealth === 'healthy' ? 'success' : 'warning'}>
                  <ThemedText className="text-xs">{systemHealth}</ThemedText>
                </Badge>
              </ThemedView>

              <ThemedView className="flex-row justify-between">
                <ThemedText className="text-sm text-muted-foreground">Última Verificação</ThemedText>
                <ThemedText className="text-sm font-medium">
                  {new Date().toLocaleTimeString('pt-BR')}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Card>

        {/* Maintenance Toggle */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedView className="flex-row items-center justify-between mb-4">
              <ThemedView>
                <ThemedText className="text-lg font-semibold">Modo de Manutenção</ThemedText>
                <ThemedText className="text-sm text-muted-foreground">
                  Ativar para bloquear acesso de usuários
                </ThemedText>
              </ThemedView>

              <Switch
                checked={maintenanceSettings.enabled}
                onCheckedChange={handleToggleMaintenance}
                disabled={toggleMaintenanceMutation.isPending}
              />
            </ThemedView>

            {isMaintenanceActive && (
              <ThemedView className="p-3 bg-warning/10 rounded-md">
                <ThemedView className="flex-row items-center mb-2">
                  <Icon name="alert-triangle" size={16} className="text-warning mr-2" />
                  <ThemedText className="font-medium text-warning">Sistema em Manutenção</ThemedText>
                </ThemedView>
                <ThemedText className="text-sm text-muted-foreground">
                  Apenas usuários autorizados podem acessar o sistema
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </Card>

        {/* Maintenance Settings */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedText className="text-lg font-semibold mb-4">Configurações</ThemedText>

            {/* Custom Message */}
            <ThemedView className="mb-4">
              <ThemedText className="text-sm font-medium mb-2">Mensagem para Usuários</ThemedText>
              <TextArea
                placeholder={maintenanceSettings.message}
                value={customMessage}
                onChangeText={setCustomMessage}
                className="min-h-[80px]"
              />
              <ThemedText className="text-xs text-muted-foreground mt-1">
                Esta mensagem será exibida para usuários não autorizados
              </ThemedText>
            </ThemedView>

            {/* Estimated Duration */}
            <ThemedView className="mb-4">
              <ThemedText className="text-sm font-medium mb-2">Duração Estimada</ThemedText>
              <Input
                placeholder={maintenanceSettings.estimatedDuration}
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
              />
              <ThemedText className="text-xs text-muted-foreground mt-1">
                Ex: "30 minutos", "2 horas", "até às 14:00"
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </Card>

        {/* Allowed Users */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedText className="text-lg font-semibold mb-4">Usuários Autorizados</ThemedText>

            {/* Add User */}
            <ThemedView className="flex-row gap-2 mb-4">
              <Input
                placeholder="Email ou username"
                value={allowedUser}
                onChangeText={setAllowedUser}
                className="flex-1"
              />
              <Button
                variant="outline"
                onPress={handleAddAllowedUser}
                disabled={!allowedUser.trim()}
              >
                <Icon name="plus" size={16} />
              </Button>
            </ThemedView>

            {/* Users List */}
            {maintenanceSettings.allowedUsers.length > 0 ? (
              <ThemedView className="space-y-2">
                {maintenanceSettings.allowedUsers.map((user, index) => (
                  <ThemedView
                    key={index}
                    className="flex-row items-center justify-between p-3 bg-secondary/10 rounded-md"
                  >
                    <ThemedView className="flex-row items-center">
                      <Icon name="user" size={16} className="text-muted-foreground mr-2" />
                      <ThemedText className="font-medium">{user}</ThemedText>
                    </ThemedView>

                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => handleRemoveAllowedUser(user)}
                    >
                      <Icon name="x" size={14} className="text-destructive" />
                    </Button>
                  </ThemedView>
                ))}
              </ThemedView>
            ) : (
              <ThemedView className="items-center py-6">
                <Icon name="users" size={32} className="text-muted-foreground mb-2" />
                <ThemedText className="text-muted-foreground text-center">
                  Nenhum usuário autorizado{'\n'}
                  Adicione usuários que podem acessar durante a manutenção
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-4">
          <ThemedView className="p-4">
            <ThemedText className="text-lg font-semibold mb-4">Ações Rápidas</ThemedText>

            <ThemedView className="flex-row gap-2 mb-3">
              <Button
                variant="outline"
                onPress={handleScheduleMaintenance}
                className="flex-1"
              >
                <Icon name="calendar" size={16} />
                <ThemedText className="ml-2">Agendar</ThemedText>
              </Button>

              <Button
                variant="outline"
                onPress={() => {
                  setCustomMessage('');
                  setEstimatedDuration('');
                  setAllowedUser('');
                }}
                className="flex-1"
              >
                <Icon name="refresh-cw" size={16} />
                <ThemedText className="ml-2">Limpar</ThemedText>
              </Button>
            </ThemedView>

            <Button
              variant={isMaintenanceActive ? "destructive" : "default"}
              onPress={handleToggleMaintenance}
              disabled={toggleMaintenanceMutation.isPending}
              className="w-full"
            >
              {toggleMaintenanceMutation.isPending ? (
                <Icon name="loader" size={16} className="animate-spin" />
              ) : (
                <Icon name={isMaintenanceActive ? "play" : "pause"} size={16} />
              )}
              <ThemedText className="ml-2">
                {isMaintenanceActive ? 'Sair do Modo de Manutenção' : 'Ativar Modo de Manutenção'}
              </ThemedText>
            </Button>
          </ThemedView>
        </Card>

        {/* Warning */}
        <Card>
          <ThemedView className="p-4">
            <ThemedView className="flex-row items-start">
              <Icon name="info" size={20} className="text-primary mr-3 mt-0.5" />
              <ThemedView className="flex-1">
                <ThemedText className="text-sm font-medium mb-1">Importante</ThemedText>
                <ThemedText className="text-sm text-muted-foreground">
                  • O modo de manutenção bloqueia acesso para todos os usuários exceto os autorizados{'\n'}
                  • Certifique-se de testar a funcionalidade antes de ativar{'\n'}
                  • Mantenha uma lista atualizada de usuários autorizados{'\n'}
                  • Use mensagens claras para informar sobre a duração estimada
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}
