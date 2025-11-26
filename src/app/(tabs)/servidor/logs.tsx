import { useState, useRef } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getServiceLogs, getServices } from '../../../api-client';
import { ThemedView } from '@/components/ui/themed-view';
import { ThemedText } from '@/components/ui/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ErrorScreen } from '@/components/ui/error-screen';
import { Combobox } from '@/components/ui/combobox';
import { SearchBar } from '@/components/ui/search-bar';
import { Badge} from '@/components/ui/badge';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
}

const LOG_LEVELS = {
  ERROR: { color: 'destructive' as const, icon: 'x-circle' as const },
  WARN: { color: 'warning' as const, icon: 'alert-triangle' as const },
  INFO: { color: 'secondary' as const, icon: 'info' as const },
  DEBUG: { color: 'secondary' as const, icon: 'bug' as const },
  TRACE: { color: 'secondary' as const, icon: 'microscope' as const },
} as const;

const LINE_LIMITS = [
  { label: '50 linhas', value: 50 },
  { label: '100 linhas', value: 100 },
  { label: '250 linhas', value: 250 },
  { label: '500 linhas', value: 500 },
  { label: '1000 linhas', value: 1000 },
];

export default function ServerLogsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [lineLimit, setLineLimit] = useState(100);
  const [searchFilter, setSearchFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Query for available services
  const { data: servicesData } = useQuery({
    queryKey: ['systemServices'],
    queryFn: getServices,
  });

  // Query for logs
  const {
    data: logsData,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['serviceLogs', selectedService, lineLimit],
    queryFn: () => selectedService ? getServiceLogs(selectedService, lineLimit) : Promise.resolve(null),
    enabled: !!selectedService,
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds if enabled
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleScrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleScrollToTop = () => {
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  };

  const parseLogLine = (line: string, serviceName: string): LogEntry | null => {
    // Try to parse different log formats
    const timestampRegex = /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?)/;
    const levelRegex = /(ERROR|WARN|INFO|DEBUG|TRACE)/i;

    const timestampMatch = line.match(timestampRegex);
    const levelMatch = line.match(levelRegex);

    const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
    const level = levelMatch ? levelMatch[1].toUpperCase() : 'INFO';

    // Remove timestamp and level from message
    let message = line;
    if (timestampMatch) {
      message = message.substring(timestampMatch[0].length);
    }
    if (levelMatch) {
      message = message.replace(levelMatch[0], '');
    }
    message = message.trim();

    return {
      timestamp,
      level,
      message: message || line,
      service: serviceName,
    };
  };

  const services = servicesData?.data || [];
  const serviceOptions = services.map(service => ({
    label: service.description || service.name,
    value: service.name,
  }));

  let logs: LogEntry[] = [];
  if (logsData?.data && selectedService) {
    const logsString = typeof logsData.data === 'string' ? logsData.data : (logsData.data as any).logs || '';
    logs = logsString
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => parseLogLine(line, selectedService))
      .filter((entry: LogEntry | null) => entry !== null) as LogEntry[];
  }

  // Apply filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchFilter ||
      log.message.toLowerCase().includes(searchFilter.toLowerCase()) ||
      log.level.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesLevel = !levelFilter || log.level === levelFilter;

    return matchesSearch && matchesLevel;
  });

  const levelCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading && !logsData) {
    return <LoadingScreen />;
  }

  return (
    <ThemedView className="flex-1">
      {/* Controls Header */}
      <ThemedView className="p-4 border-b border-border">
        {/* Service Selection */}
        <ThemedView className="mb-3">
          <ThemedText className="text-sm font-medium mb-2">Serviço</ThemedText>
          <Combobox
            value={selectedService}
            onValueChange={setSelectedService}
            options={serviceOptions}
            placeholder="Selecione um serviço"
            searchable={false}
          />
        </ThemedView>

        {/* Filter Controls */}
        <ThemedView className="flex-row gap-2 mb-3">
          <ThemedView className="flex-1">
            <SearchBar
              placeholder="Filtrar logs..."
              value={searchFilter}
              onChangeText={setSearchFilter}
            />
          </ThemedView>

          <Combobox
            value={levelFilter}
            onValueChange={setLevelFilter}
            options={[
              { value: "", label: "Todos" },
              ...Object.keys(LOG_LEVELS).map(level => ({
                value: level,
                label: level
              }))
            ]}
            placeholder="Nível"
            searchable={false}
            style={{ width: 96 }}
          />
        </ThemedView>

        {/* Action Buttons */}
        <ThemedView className="flex-row justify-between items-center">
          <ThemedView className="flex-row gap-2 items-center">
            <Combobox
              value={lineLimit.toString()}
              onValueChange={(value) => setLineLimit(parseInt(value))}
              options={LINE_LIMITS.map(limit => ({
                value: limit.value.toString(),
                label: limit.label
              }))}
              placeholder="Selecionar"
              searchable={false}
              style={{ minWidth: 140 }}
            />

            <Button
              variant="outline"
              size="default"
              onPress={() => setAutoRefresh(!autoRefresh)}
              className="flex-row items-center gap-1"
            >
              <Icon
                name={autoRefresh ? 'pause' : 'play'}
                size={16}
                className={autoRefresh ? 'text-warning' : 'text-success'}
              />
              <ThemedText className="text-sm font-medium">
                {autoRefresh ? 'Pausar' : 'Auto'}
              </ThemedText>
            </Button>
          </ThemedView>

          <ThemedView className="flex-row gap-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={handleScrollToTop}
              disabled={!selectedService}
            >
              <Icon name="arrow-up" size={14} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onPress={handleScrollToBottom}
              disabled={!selectedService}
            >
              <Icon name="arrow-down" size={14} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onPress={handleRefresh}
              disabled={!selectedService || isFetching}
            >
              <Icon name="refresh-cw" size={14} className={isFetching ? 'animate-spin' : ''} />
            </Button>
          </ThemedView>
        </ThemedView>

        {/* Log Stats */}
        {logs.length > 0 && (
          <ThemedView className="flex-row gap-2 mt-3">
            <Badge variant="secondary">
              <ThemedText className="text-xs">Total: {filteredLogs.length}</ThemedText>
            </Badge>

            {Object.entries(levelCounts).map(([level, count]) => (
              <Badge key={level} variant={(LOG_LEVELS[level as keyof typeof LOG_LEVELS]?.color || 'secondary') as BadgeProps['variant']}>
                <ThemedText className="text-xs">{level}: {count}</ThemedText>
              </Badge>
            ))}
          </ThemedView>
        )}
      </ThemedView>

      {/* Logs Content */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!selectedService && (
          <ThemedView className="flex-1 items-center justify-center p-8">
            <Icon name="file-text" size={48} className="text-muted-foreground mb-4" />
            <ThemedText className="text-lg font-medium mb-2">Visualizador de Logs</ThemedText>
            <ThemedText className="text-center text-muted-foreground">
              Selecione um serviço para visualizar seus logs
            </ThemedText>
          </ThemedView>
        )}

        {selectedService && error && (
          <ThemedView className="flex-1 items-center justify-center p-8">
            <ErrorScreen
              title="Erro ao carregar logs"
              message={`Não foi possível carregar os logs do serviço ${selectedService}`}
              onRetry={handleRefresh}
            />
          </ThemedView>
        )}

        {selectedService && !error && filteredLogs.length === 0 && !isLoading && (
          <ThemedView className="flex-1 items-center justify-center p-8">
            <Icon name="search" size={48} className="text-muted-foreground mb-4" />
            <ThemedText className="text-lg font-medium mb-2">Nenhum log encontrado</ThemedText>
            <ThemedText className="text-center text-muted-foreground">
              {searchFilter || levelFilter
                ? 'Nenhum log corresponde aos filtros aplicados'
                : 'Este serviço não possui logs disponíveis'
              }
            </ThemedText>
          </ThemedView>
        )}

        {filteredLogs.length > 0 && (
          <ThemedView className="p-3">
            {filteredLogs.map((log, index) => {
              const logConfig = LOG_LEVELS[log.level as keyof typeof LOG_LEVELS] || LOG_LEVELS.INFO;

              return (
                <Card key={index} className="mb-2 p-0">
                  <ThemedView className="p-4">
                    <ThemedView className="flex-row items-start gap-2 mb-2">
                      <Badge variant={logConfig.color as BadgeProps['variant']} size="default" style={{ marginTop: 2 }}>
                        <ThemedView className="flex-row items-center">
                          <Icon name={logConfig.icon} size={12} className="mr-1" />
                          <ThemedText className="text-xs font-semibold">{log.level}</ThemedText>
                        </ThemedView>
                      </Badge>

                      <ThemedText className="text-sm text-muted-foreground flex-1">
                        {new Date(log.timestamp).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'medium'
                        })}
                      </ThemedText>
                    </ThemedView>

                    <ThemedText
                      className={`text-base font-mono leading-6 ${log.level === 'ERROR' ? 'text-destructive' : ''}`}
                      style={{ fontFamily: 'monospace' }}
                    >
                      {log.message}
                    </ThemedText>
                  </ThemedView>
                </Card>
              );
            })}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}
