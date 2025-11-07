import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useAuth } from "@/contexts/auth-context";
import { useTimeRecords } from "@/hooks";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import {
  IconClock,
  IconCalendar,
  IconLogin,
  IconLogout,
  IconCoffee,
  IconAlertCircle,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDate, formatTime } from "@/utils";

// Time record types
const RECORD_TYPE_ICONS = {
  ENTRY: IconLogin,
  EXIT: IconLogout,
  BREAK_START: IconCoffee,
  BREAK_END: IconCoffee,
};

const RECORD_TYPE_LABELS = {
  ENTRY: "Entrada",
  EXIT: "Saída",
  BREAK_START: "Início Intervalo",
  BREAK_END: "Fim Intervalo",
};

export default function MeusPontosScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Build query parameters for user's own time records
  const queryParams = useMemo(() => {
    if (!currentUser?.id) return null;

    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

    return {
      where: {
        userId: currentUser.id,
        recordTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { recordTime: "desc" },
      include: {
        adjustments: true,
      },
    };
  }, [currentUser?.id, selectedMonth]);

  const {
    data: recordsResponse,
    isLoading,
    error,
    refetch,
  } = useTimeRecords(queryParams || {}, {
    enabled: !!queryParams,
  });

  const records = recordsResponse?.data || [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Group records by date
  const groupedRecords = useMemo(() => {
    const groups: Record<string, any[]> = {};

    records.forEach((record: any) => {
      const date = formatDate(record.recordTime);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
    });

    // Sort records within each day by time
    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) =>
        new Date(a.recordTime).getTime() - new Date(b.recordTime).getTime()
      );
    });

    return groups;
  }, [records]);

  // Calculate daily work hours
  const calculateDailyHours = (dayRecords: any[]) => {
    let totalMinutes = 0;
    let entryTime: Date | null = null;
    let breakStartTime: Date | null = null;

    dayRecords.forEach((record) => {
      const recordTime = new Date(record.recordTime);

      switch (record.type) {
        case "ENTRY":
          entryTime = recordTime;
          break;
        case "EXIT":
          if (entryTime) {
            totalMinutes += (recordTime.getTime() - entryTime.getTime()) / (1000 * 60);
            entryTime = null;
          }
          break;
        case "BREAK_START":
          if (entryTime) {
            totalMinutes += (recordTime.getTime() - entryTime.getTime()) / (1000 * 60);
            entryTime = null;
          }
          breakStartTime = recordTime;
          break;
        case "BREAK_END":
          if (breakStartTime) {
            entryTime = recordTime;
            breakStartTime = null;
          }
          break;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}h ${minutes}min`;
  };

  if (!currentUser) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Card style={styles.loadingCard}>
            <IconAlertCircle size={48} color={colors.mutedForeground} />
            <ThemedText style={[styles.title, { color: colors.foreground, textAlign: "center", marginTop: spacing.md }]}>
              Usuário não autenticado
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  if (isLoading && records.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard}>
            <ThemedText style={{ color: colors.mutedForeground }}>
              Carregando seus registros de ponto...
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  if (error && records.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar registros"
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasRecords = Object.keys(groupedRecords).length > 0;

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Meus Pontos
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {selectedMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </ThemedText>
        </View>

        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <IconClock size={20} color={colors.primary} />
            <ThemedText style={[styles.summaryTitle, { color: colors.foreground }]}>
              Resumo do Mês
            </ThemedText>
          </View>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryValue, { color: colors.foreground }]}>
                {records.length}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                Registros
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryValue, { color: colors.foreground }]}>
                {Object.keys(groupedRecords).length}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                Dias Trabalhados
              </ThemedText>
            </View>
          </View>
        </Card>

        {hasRecords ? (
          <View style={styles.recordsContainer}>
            {Object.entries(groupedRecords)
              .sort((a, b) => b[0].localeCompare(a[0])) // Sort dates descending
              .map(([date, dayRecords]) => (
                <Card key={date} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayInfo}>
                      <IconCalendar size={16} color={colors.primary} />
                      <ThemedText style={[styles.dayDate, { color: colors.foreground }]}>
                        {date}
                      </ThemedText>
                    </View>
                    <Badge variant="secondary">
                      <ThemedText style={[styles.dayHours, { color: colors.primary }]}>
                        {calculateDailyHours(dayRecords)}
                      </ThemedText>
                    </Badge>
                  </View>

                  <View style={styles.recordsList}>
                    {dayRecords.map((record: any, index: number) => {
                      const Icon = RECORD_TYPE_ICONS[record.type as keyof typeof RECORD_TYPE_ICONS] || IconClock;
                      const isAdjusted = record.adjustments && record.adjustments.length > 0;

                      return (
                        <View
                          key={record.id}
                          style={[
                            styles.recordItem,
                            index !== dayRecords.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                          ]}
                        >
                          <View style={styles.recordLeft}>
                            <Icon size={18} color={colors.mutedForeground} />
                            <View style={styles.recordInfo}>
                              <ThemedText style={[styles.recordType, { color: colors.foreground }]}>
                                {RECORD_TYPE_LABELS[record.type as keyof typeof RECORD_TYPE_LABELS] || record.type}
                              </ThemedText>
                              <ThemedText style={[styles.recordTime, { color: colors.mutedForeground }]}>
                                {formatTime(record.recordTime)}
                              </ThemedText>
                            </View>
                          </View>
                          {isAdjusted && (
                            <Badge variant="outline" style={{ borderColor: colors.warning }}>
                              <ThemedText style={[styles.adjustedText, { color: colors.warning }]}>
                                Ajustado
                              </ThemedText>
                            </Badge>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </Card>
              ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="clock"
              title="Sem registros de ponto"
              description={`Não há registros de ponto para ${selectedMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`}
            />
          </View>
        )}

        {/* Info Card */}
        <Card style={[styles.infoCard, { backgroundColor: colors.muted }]}>
          <IconAlertCircle size={20} color={colors.mutedForeground} />
          <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
            Os registros de ponto são sincronizados com o sistema Secullum.
            Para ajustes ou correções, entre em contato com o RH.
          </ThemedText>
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
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
  },
  summaryCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  summaryContent: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  recordsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dayCard: {
    padding: 0,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  dayInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dayDate: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  dayHours: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  recordsList: {
    padding: spacing.sm,
  },
  recordItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  recordLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  recordInfo: {
    gap: 2,
  },
  recordType: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  recordTime: {
    fontSize: fontSize.xs,
  },
  adjustedText: {
    fontSize: fontSize.xxs,
    fontWeight: "500",
  },
  infoCard: {
    flexDirection: "row",
    padding: spacing.md,
    alignItems: "flex-start",
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
    marginLeft: spacing.sm,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    padding: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
});