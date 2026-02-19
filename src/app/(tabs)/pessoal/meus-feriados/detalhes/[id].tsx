import { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useHoliday, useScreenReady} from '@/hooks';
import { HolidayCard } from "@/components/personal/holiday";
import { Card } from "@/components/ui/card";
import { IconCalendar } from "@tabler/icons-react-native";


import { Skeleton } from "@/components/ui/skeleton";export default function MyHolidayDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch holiday data
  const { data: response, isLoading, error, refetch } = useHoliday(id || "", {
    enabled: !!id && id !== "",
  });

  useScreenReady(!isLoading);

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
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header card skeleton */}
        <View style={{ margin: 16, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
            <Skeleton style={{ height: 18, width: '55%', borderRadius: 4 }} />
          </View>
        </View>
        {/* Holiday info card skeleton */}
        <View style={{ marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 16, width: '40%', borderRadius: 4 }} />
          <View style={{ gap: 10 }}>
            {[['25%', '35%'], ['20%', '45%'], ['30%', '30%']].map(([l, r], i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width={l} height={14} borderRadius={4} />
                <Skeleton width={r} height={14} borderRadius={4} />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
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
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconCalendar size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>{holiday.name}</ThemedText>
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
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
});
