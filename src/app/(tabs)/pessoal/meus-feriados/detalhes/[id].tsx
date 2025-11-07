import { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { useHoliday } from "@/hooks";
import { HolidayCard } from "@/components/personal/holiday";
import { Card } from "@/components/ui/card";
import { IconCalendar } from "@tabler/icons-react-native";

export default function MyHolidayDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch holiday data
  const { data: response, isLoading, error, refetch } = useHoliday(id || "", {
    enabled: !!id && id !== "",
  });

  const holiday = response?.data;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Error state
  if (error || !holiday) {
    return (
      <ErrorScreen
        error={error || new Error("Feriado não encontrado")}
        onRetry={() => refetch()}
        message="Erro ao carregar detalhes do feriado"
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
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
      >
        {/* Header Card */}
        <Card style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
              <IconCalendar size={32} color={colors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <ThemedText style={styles.headerTitle}>{holiday.name}</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Detalhes do Feriado
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Holiday Information Card */}
        <HolidayCard holiday={holiday} />
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
    gap: spacing.md,
  },
  headerCard: {
    padding: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
});
