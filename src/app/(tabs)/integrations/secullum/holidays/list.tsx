import React, { useState, useCallback, useMemo } from "react";
import { View, FlatList, RefreshControl, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { useSecullumHolidays } from '../../../../../hooks';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Header } from "@/components/ui/header";
import { IconCalendar, IconRefresh, IconChevronLeft, IconChevronRight } from "@tabler/icons-react-native";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Holiday {
  id: string;
  Data: string;
  Descricao: string;
  Tipo?: string;
}

export default function HolidaysListScreen() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch holidays for selected year
  const {
    data: holidaysData,
    isLoading,
    error,
    refetch,
  } = useSecullumHolidays({ year: selectedYear });

  // Transform and filter holidays
  const holidays = useMemo(() => {
    if (!holidaysData?.data?.data) return [];

    const holidaysArray = holidaysData.data.data;
    let filteredHolidays = Array.isArray(holidaysArray) ? holidaysArray : [];

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredHolidays = filteredHolidays.filter((holiday: Holiday) =>
        holiday.Descricao?.toLowerCase().includes(query)
      );
    }

    // Filter by month
    if (selectedMonth && selectedMonth !== "all") {
      const month = parseInt(selectedMonth);
      filteredHolidays = filteredHolidays.filter((holiday: Holiday) => {
        try {
          const date = parseISO(holiday.Data);
          const holidayMonth = date.getMonth() + 1;
          return holidayMonth === month;
        } catch {
          return false;
        }
      });
    }

    // Sort by date
    filteredHolidays.sort((a: Holiday, b: Holiday) => {
      try {
        const dateA = new Date(a.Data);
        const dateB = new Date(b.Data);
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });

    return filteredHolidays;
  }, [holidaysData, searchQuery, selectedMonth]);

  // Month options
  const monthOptions = [
    { label: "Todos os meses", value: "all" },
    { label: "Janeiro", value: "1" },
    { label: "Fevereiro", value: "2" },
    { label: "Março", value: "3" },
    { label: "Abril", value: "4" },
    { label: "Maio", value: "5" },
    { label: "Junho", value: "6" },
    { label: "Julho", value: "7" },
    { label: "Agosto", value: "8" },
    { label: "Setembro", value: "9" },
    { label: "Outubro", value: "10" },
    { label: "Novembro", value: "11" },
    { label: "Dezembro", value: "12" },
  ];

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing holidays:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Handle year navigation
  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  // Format date display
  const formatDateDisplay = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  // Get day of week
  const getDayOfWeek = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEEE", { locale: ptBR });
    } catch {
      return "";
    }
  };

  // Render holiday item
  const renderHoliday = ({ item }: { item: Holiday }) => (
    <Card style={styles.holidayCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateIconContainer}>
          <IconCalendar size={20} color="#3B82F6" />
          <View style={styles.dateInfo}>
            <ThemedText style={styles.dateText}>
              {formatDateDisplay(item.Data)}
            </ThemedText>
            <ThemedText style={styles.dayOfWeekText}>
              {getDayOfWeek(item.Data)}
            </ThemedText>
          </View>
        </View>
        {item.Tipo && (
          <Badge variant="secondary" style={styles.typeBadge}>
            <ThemedText style={styles.typeBadgeText}>{item.Tipo}</ThemedText>
          </Badge>
        )}
      </View>
      <ThemedText style={styles.descriptionText}>{item.Descricao}</ThemedText>
    </Card>
  );

  if (isLoading && !refreshing) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorScreen
        title="Erro ao carregar feriados"
        message="Não foi possível carregar a lista de feriados. Verifique sua conexão e tente novamente."
        onRetry={refetch}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Feriados"
        subtitle="Visualize os feriados cadastrados"
        showBackButton
        onBackPress={() => router.back()}
      />

      <View style={styles.filtersContainer}>
        <View style={styles.yearNavigation}>
          <Button variant="outline" size="sm" onPress={handlePreviousYear}>
            <IconChevronLeft size={16} color="#3B82F6" />
          </Button>
          <View style={styles.yearDisplay}>
            <ThemedText style={styles.yearText}>{selectedYear}</ThemedText>
          </View>
          <Button variant="outline" size="sm" onPress={handleNextYear}>
            <IconChevronRight size={16} color="#3B82F6" />
          </Button>
        </View>

        <View style={styles.monthSelectContainer}>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar mês" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar feriado..."
          style={styles.searchBar}
        />

        <View style={styles.statsContainer}>
          <ThemedText style={styles.statsText}>
            {holidays.length} feriado{holidays.length !== 1 ? "s" : ""} encontrado{holidays.length !== 1 ? "s" : ""}
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
          data={holidays}
          renderItem={renderHoliday}
          keyExtractor={(item, index) => item.id || `holiday-${index}`}
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
              title="Nenhum feriado encontrado"
              description={
                searchQuery || selectedMonth !== "all"
                  ? "Não há feriados para os filtros selecionados."
                  : `Não há feriados cadastrados para ${selectedYear}.`
              }
              icon="calendar"
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
  yearNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 12,
  },
  yearDisplay: {
    minWidth: 80,
    alignItems: "center",
  },
  yearText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  monthSelectContainer: {
    marginBottom: 12,
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
  holidayCard: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  dateIconContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  dayOfWeekText: {
    fontSize: 14,
    color: "#6B7280",
    textTransform: "capitalize",
  },
  typeBadge: {
    backgroundColor: "#EEF2FF",
    borderColor: "#818CF8",
  },
  typeBadgeText: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "500",
  },
  descriptionText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
});
