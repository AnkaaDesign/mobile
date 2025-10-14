import React, { useState, useMemo } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useSecullumHolidays } from '@/hooks';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Header } from "@/components/ui/header";
import { useTheme } from "@/contexts/theme-context";
import {
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
  IconMapPin,
} from "@tabler/icons-react-native";
import { format, addYears, subYears, isFuture, isPast, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HOLIDAY_TYPE } from '@/constants/enums';

interface Holiday {
  Id: number;
  Data: string;
  Descricao: string;
  Tipo?: string;
}

const HOLIDAY_TYPE_LABELS: Record<string, string> = {
  [HOLIDAY_TYPE.NATIONAL]: "Nacional",
  [HOLIDAY_TYPE.STATE]: "Estadual",
  [HOLIDAY_TYPE.MUNICIPAL]: "Municipal",
  [HOLIDAY_TYPE.OPTIONAL]: "Facultativo",
};

const HOLIDAY_TYPE_COLORS: Record<string, string> = {
  [HOLIDAY_TYPE.NATIONAL]: "#DC2626",
  [HOLIDAY_TYPE.STATE]: "#2563EB",
  [HOLIDAY_TYPE.MUNICIPAL]: "#059669",
  [HOLIDAY_TYPE.OPTIONAL]: "#D97706",
};

export default function MyHolidaysScreen() {
  const { colors } = useTheme();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'upcoming'>('upcoming');

  // Fetch holidays for the selected year
  const {
    data: holidaysData,
    isLoading,
    error,
    refetch,
  } = useSecullumHolidays({ year: selectedYear });

  // Transform and filter holidays
  const { upcomingHolidays, pastHolidays, allHolidays } = useMemo(() => {
    if (!holidaysData?.data) {
      return { upcomingHolidays: [], pastHolidays: [], allHolidays: [] };
    }

    const holidays: Holiday[] = Array.isArray(holidaysData.data)
      ? holidaysData.data
      : [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming: Holiday[] = [];
    const past: Holiday[] = [];

    holidays.forEach((holiday) => {
      const holidayDate = new Date(holiday.Data);
      if (isFuture(holidayDate) || isToday(holidayDate)) {
        upcoming.push(holiday);
      } else {
        past.push(holiday);
      }
    });

    // Sort upcoming holidays by date (nearest first)
    upcoming.sort((a, b) => new Date(a.Data).getTime() - new Date(b.Data).getTime());

    // Sort past holidays by date (most recent first)
    past.sort((a, b) => new Date(b.Data).getTime() - new Date(a.Data).getTime());

    return {
      upcomingHolidays: upcoming,
      pastHolidays: past,
      allHolidays: holidays,
    };
  }, [holidaysData]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing holidays:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle year navigation
  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  // Format date for display
  const formatHolidayDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  // Get days until holiday
  const getDaysUntil = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const days = differenceInDays(date, now);

      if (days === 0) return "Hoje";
      if (days === 1) return "Amanhã";
      if (days < 0) return "Passou";
      return `Em ${days} dias`;
    } catch {
      return "";
    }
  };

  // Get holiday type badge
  const getHolidayTypeBadge = (tipo?: string) => {
    if (!tipo || !HOLIDAY_TYPE_LABELS[tipo]) return null;

    return (
      <Badge
        variant="outline"
        style={[
          styles.typeBadge,
          { borderColor: HOLIDAY_TYPE_COLORS[tipo] || colors.border }
        ]}
      >
        <ThemedText style={[styles.typeBadgeText, { color: HOLIDAY_TYPE_COLORS[tipo] || colors.text }]}>
          {HOLIDAY_TYPE_LABELS[tipo]}
        </ThemedText>
      </Badge>
    );
  };

  // Render holiday card
  const renderHolidayCard = (holiday: Holiday, showDaysUntil: boolean = false) => {
    const holidayDate = new Date(holiday.Data);
    const daysUntil = getDaysUntil(holiday.Data);
    const isUpcoming = isFuture(holidayDate) || isToday(holidayDate);

    return (
      <Card key={holiday.Id} style={[styles.holidayCard, { backgroundColor: colors.card }]}>
        <View style={styles.holidayCardContent}>
          <View style={styles.holidayIcon}>
            <IconCalendarEvent size={24} color={isUpcoming ? colors.primary : colors.text} />
          </View>

          <View style={styles.holidayInfo}>
            <ThemedText style={styles.holidayName}>{holiday.Descricao}</ThemedText>
            <View style={styles.holidayMeta}>
              <IconCalendar size={14} color={colors.text} style={styles.metaIcon} />
              <ThemedText style={styles.holidayDate}>
                {formatHolidayDate(holiday.Data)}
              </ThemedText>
            </View>
            {holiday.Tipo && (
              <View style={styles.holidayBadges}>
                {getHolidayTypeBadge(holiday.Tipo)}
              </View>
            )}
          </View>

          {showDaysUntil && isUpcoming && (
            <View style={styles.daysUntilContainer}>
              <ThemedText style={[styles.daysUntilText, { color: colors.primary }]}>
                {daysUntil}
              </ThemedText>
            </View>
          )}
        </View>
      </Card>
    );
  };

  if (isLoading && !refreshing) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorScreen
        title="Erro ao carregar feriados"
        message="Não foi possível carregar os feriados. Verifique sua conexão e tente novamente."
        onRetry={refetch}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Feriados"
        subtitle="Consulte os feriados nacionais, estaduais e municipais"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Year Navigation */}
        <Card style={styles.navigationCard}>
          <View style={styles.yearNavigation}>
            <Button variant="outline" size="sm" onPress={handlePreviousYear}>
              <IconChevronLeft size={16} color={colors.primary} />
            </Button>
            <View style={styles.yearDisplay}>
              <ThemedText style={styles.yearText}>{selectedYear}</ThemedText>
            </View>
            <Button variant="outline" size="sm" onPress={handleNextYear}>
              <IconChevronRight size={16} color={colors.primary} />
            </Button>
          </View>

          {/* View Mode Toggle */}
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'upcoming' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setViewMode('upcoming')}
            >
              <ThemedText
                style={[
                  styles.viewModeButtonText,
                  { color: viewMode === 'upcoming' ? '#FFFFFF' : colors.text },
                ]}
              >
                Próximos
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'list' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setViewMode('list')}
            >
              <ThemedText
                style={[
                  styles.viewModeButtonText,
                  { color: viewMode === 'list' ? '#FFFFFF' : colors.text },
                ]}
              >
                Todos
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <IconCalendarEvent size={20} color={colors.primary} />
            <ThemedText style={styles.infoText}>
              Feriados nacionais, estaduais e municipais programados para {selectedYear}
            </ThemedText>
          </View>
        </Card>

        {/* Statistics */}
        <Card style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: colors.background }]}>
              <ThemedText style={styles.statValue}>{allHolidays.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Total</ThemedText>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.background }]}>
              <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                {upcomingHolidays.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Próximos</ThemedText>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.background }]}>
              <ThemedText style={[styles.statValue, { color: colors.text, opacity: 0.6 }]}>
                {pastHolidays.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Passados</ThemedText>
            </View>
          </View>
        </Card>

        {/* Holidays List */}
        {viewMode === 'upcoming' ? (
          <View style={styles.holidaysSection}>
            <View style={styles.sectionHeader}>
              <IconCalendarEvent size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Próximos Feriados</ThemedText>
              <ThemedText style={styles.sectionCount}>
                {upcomingHolidays.length}
              </ThemedText>
            </View>

            {upcomingHolidays.length > 0 ? (
              <View style={styles.holidaysList}>
                {upcomingHolidays.map((holiday) => renderHolidayCard(holiday, true))}
              </View>
            ) : (
              <EmptyState
                icon={IconCalendarEvent}
                title="Nenhum feriado próximo"
                description="Não há feriados programados para os próximos dias deste ano."
              />
            )}
          </View>
        ) : (
          <View style={styles.holidaysSection}>
            <View style={styles.sectionHeader}>
              <IconCalendar size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Todos os Feriados</ThemedText>
              <ThemedText style={styles.sectionCount}>
                {allHolidays.length}
              </ThemedText>
            </View>

            {allHolidays.length > 0 ? (
              <View style={styles.holidaysList}>
                {[...allHolidays]
                  .sort((a, b) => new Date(a.Data).getTime() - new Date(b.Data).getTime())
                  .map((holiday) => renderHolidayCard(holiday, false))}
              </View>
            ) : (
              <EmptyState
                icon={IconCalendarEvent}
                title="Nenhum feriado encontrado"
                description="Não há feriados cadastrados para este ano."
              />
            )}
          </View>
        )}

        {/* Legend */}
        <Card style={styles.legendCard}>
          <ThemedText style={styles.legendTitle}>Tipos de Feriado</ThemedText>
          <View style={styles.legendGrid}>
            {Object.entries(HOLIDAY_TYPE_LABELS).map(([type, label]) => (
              <View key={type} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: HOLIDAY_TYPE_COLORS[type] },
                  ]}
                />
                <ThemedText style={styles.legendText}>{label}</ThemedText>
              </View>
            ))}
          </View>
        </Card>
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
  navigationCard: {
    padding: 16,
  },
  yearNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  yearDisplay: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  yearText: {
    fontSize: 20,
    fontWeight: "700",
  },
  viewModeToggle: {
    flexDirection: "row",
    gap: 8,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  statsCard: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  holidaysSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    opacity: 0.6,
  },
  holidaysList: {
    gap: 12,
  },
  holidayCard: {
    padding: 16,
  },
  holidayCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  holidayIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  holidayInfo: {
    flex: 1,
    gap: 4,
  },
  holidayName: {
    fontSize: 16,
    fontWeight: "600",
  },
  holidayMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaIcon: {
    opacity: 0.6,
  },
  holidayDate: {
    fontSize: 14,
    opacity: 0.6,
    textTransform: "capitalize",
  },
  holidayBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  daysUntilContainer: {
    alignItems: "flex-end",
  },
  daysUntilText: {
    fontSize: 12,
    fontWeight: "600",
  },
  legendCard: {
    padding: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: "45%",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
  },
});
