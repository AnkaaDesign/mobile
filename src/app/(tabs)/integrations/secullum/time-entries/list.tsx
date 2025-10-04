import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useSecullumTimeEntries, useUsers } from '../../../../../hooks';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Header } from "@/components/ui/header";
import { IconClock, IconUser, IconCalendar, IconMapPin, IconCamera, IconRefresh } from "@tabler/icons-react-native";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { USER_STATUS } from '../../../../../constants';

interface TimeEntry {
  id: string;
  date: string;
  entry1?: string;
  exit1?: string;
  entry2?: string;
  exit2?: string;
  entry3?: string;
  exit3?: string;
  totalHours?: string;
  location?: string;
  hasPhoto?: boolean;
  userId?: string;
  userName?: string;
  source?: string;
}

export default function TimeEntriesListScreen() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch non-dismissed users for filter
  const { data: usersData, isLoading: usersLoading } = useUsers({
    where: { status: { not: USER_STATUS.DISMISSED } },
    orderBy: { name: "asc" },
    take: 100,
  });

  // Prepare query parameters
  const queryParams = useMemo(() => {
    const startDate = format(startOfMonth(selectedDate), "yyyy-MM-dd");
    const endDate = format(endOfMonth(selectedDate), "yyyy-MM-dd");

    return {
      userId: selectedUserId || undefined,
      startDate,
      endDate,
    };
  }, [selectedUserId, selectedDate]);

  // Fetch time entries
  const {
    data: timeEntriesData,
    isLoading,
    error,
    refetch,
  } = useSecullumTimeEntries(queryParams);

  // Transform and filter time entries
  const timeEntries = useMemo(() => {
    if (!timeEntriesData?.data || !Array.isArray(timeEntriesData.data)) return [];

    let entries = timeEntriesData.data.map((entry: any, index: number) => ({
      id: entry.id || `entry-${index}`,
      date: entry.date || entry.Data || "",
      entry1: entry.entry1 || entry.Entrada1 || "",
      exit1: entry.exit1 || entry.Saida1 || "",
      entry2: entry.entry2 || entry.Entrada2 || "",
      exit2: entry.exit2 || entry.Saida2 || "",
      entry3: entry.entry3 || entry.Entrada3 || "",
      exit3: entry.exit3 || entry.Saida3 || "",
      totalHours: entry.totalHours || entry.TotalHoras || "",
      location: entry.location || entry.Local || "",
      hasPhoto: entry.hasPhoto || entry.TemFoto || false,
      userId: entry.userId || entry.FuncionarioId,
      userName: entry.userName || entry.NomeFuncionario || "Usuário não identificado",
      source: entry.source || entry.Fonte || "SECULLUM",
    }));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      entries = entries.filter((entry: TimeEntry) =>
        entry.userName?.toLowerCase().includes(query) ||
        entry.date?.toLowerCase().includes(query) ||
        entry.location?.toLowerCase().includes(query)
      );
    }

    return entries;
  }, [timeEntriesData, searchQuery]);

  // User options for select
  const userOptions = useMemo(() => {
    if (!usersData?.data || !Array.isArray(usersData.data)) return [];

    return [
      { label: "Todos os usuários", value: "" },
      ...usersData.data.map((user) => ({
        label: user.name,
        value: user.id,
      })),
    ];
  }, [usersData]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing time entries:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Handle entry press
  const handleEntryPress = (entry: TimeEntry) => {
    router.push(`/(tabs)/integrations/secullum/time-entries/details/${entry.id}`);
  };

  // Format time display
  const formatTimeRange = (entry1?: string, exit1?: string, entry2?: string, exit2?: string) => {
    const ranges = [];
    if (entry1 && exit1) ranges.push(`${entry1} - ${exit1}`);
    if (entry2 && exit2) ranges.push(`${entry2} - ${exit2}`);
    return ranges.length > 0 ? ranges.join(" | ") : "Sem registros";
  };

  // Format date display
  const formatDateDisplay = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy - EEEE", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  // Render time entry item
  const renderTimeEntry = ({ item }: { item: TimeEntry }) => (
    <TouchableOpacity onPress={() => handleEntryPress(item)} activeOpacity={0.7}>
      <Card style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.dateContainer}>
            <IconCalendar size={16} color="#6B7280" />
            <ThemedText style={styles.dateText}>
              {formatDateDisplay(item.date)}
            </ThemedText>
          </View>
          <View style={styles.badgeContainer}>
            {item.hasPhoto && (
              <Badge variant="secondary" style={styles.photoBadge}>
                <IconCamera size={12} color="#10B981" />
              </Badge>
            )}
            <Badge variant="outline" style={styles.sourceBadge}>
              {item.source}
            </Badge>
          </View>
        </View>

        <View style={styles.userContainer}>
          <IconUser size={16} color="#6B7280" />
          <ThemedText style={styles.userName}>{item.userName}</ThemedText>
        </View>

        <View style={styles.timeContainer}>
          <IconClock size={16} color="#3B82F6" />
          <ThemedText style={styles.timeText}>
            {formatTimeRange(item.entry1, item.exit1, item.entry2, item.exit2)}
          </ThemedText>
        </View>

        {item.totalHours && (
          <View style={styles.totalHoursContainer}>
            <ThemedText style={styles.totalHoursLabel}>Total:</ThemedText>
            <ThemedText style={styles.totalHoursValue}>{item.totalHours}</ThemedText>
          </View>
        )}

        {item.location && (
          <View style={styles.locationContainer}>
            <IconMapPin size={14} color="#6B7280" />
            <ThemedText style={styles.locationText} numberOfLines={1}>
              {item.location}
            </ThemedText>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorScreen
        title="Erro ao carregar registros"
        message="Não foi possível carregar os registros de ponto. Verifique sua conexão e tente novamente."
        onRetry={refetch}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Registros de Ponto"
        subtitle="Visualize os registros de entrada e saída"
        showBackButton
        onBackPress={() => router.back()}
      />

      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <View style={styles.userSelectContainer}>
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={usersLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar usuário" />
              </SelectTrigger>
              <SelectContent>
                {userOptions.map((user) => (
                  <SelectItem key={user.value} value={user.value}>
                    {user.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </View>
          <View style={styles.datePickerContainer}>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              type="date"
              placeholder="Selecionar mês"
            />
          </View>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por usuário, data ou local..."
          style={styles.searchBar}
        />

        <View style={styles.statsContainer}>
          <ThemedText style={styles.statsText}>
            {timeEntries.length} registro{timeEntries.length !== 1 ? "s" : ""} encontrado{timeEntries.length !== 1 ? "s" : ""}
          </ThemedText>
          <Button
            variant="ghost"
            size="sm"
            onPress={onRefresh}
            disabled={refreshing}
          >
            <IconRefresh size={16} color="#6B7280" />
          </Button>
        </View>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={timeEntries}
          renderItem={renderTimeEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3B82F6"]}
              tintColor="#3B82F6"
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="Nenhum registro encontrado"
              description="Não há registros de ponto para os filtros selecionados."
              icon="clock"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  userSelectContainer: {
    flex: 2,
  },
  datePickerContainer: {
    flex: 1,
  },
  searchBar: {
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsText: {
    fontSize: 14,
    color: "#6B7280",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  entryCard: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textTransform: "capitalize",
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 6,
  },
  photoBadge: {
    backgroundColor: "#ECFDF5",
  },
  sourceBadge: {
    backgroundColor: "#F3F4F6",
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: "#374151",
  },
  totalHoursContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 8,
  },
  totalHoursLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  totalHoursValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
});