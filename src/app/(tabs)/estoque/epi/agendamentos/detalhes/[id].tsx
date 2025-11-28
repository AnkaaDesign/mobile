import { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { LoadingScreen } from "@/components/ui/loading-screen";

import { formatDate, formatDateTime } from "@/utils";

import {
  IconCalendar,
  IconClock,
  IconUsers,
  IconShield,
  IconRefresh,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react-native";

export default function PPEScheduleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  // TODO: Use actual hook when available
  // const { data: schedule, isLoading, error, refetch } = usePpeSchedule(id);

  // Mock data for now
  const schedule = null;
  const isLoading = false;
  const error = null;
  const refetch = async () => {};

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleEdit = () => {
    router.push(`/estoque/epi/agendamentos/editar/${id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      "Excluir Agendamento",
      "Tem certeza que deseja excluir este agendamento de EPI?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            // TODO: Implement delete
            router.back();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando agendamento..." />;
  }

  if (error || !schedule) {
    return (
      <ErrorScreen
        message="Erro ao carregar agendamento"
        onRetry={refetch}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Detalhes do Agendamento",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Button
                variant="ghost"
                size="icon"
                onPress={handleRefresh}
              >
                <IconRefresh size={20} color={colors.foreground} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onPress={handleEdit}
              >
                <IconEdit size={20} color={colors.foreground} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onPress={handleDelete}
              >
                <IconTrash size={20} color={colors.destructive} />
              </Button>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={StyleSheet.flatten([styles.content, { paddingBottom: insets.bottom + spacing.lg }])}>
          {/* Schedule Information */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconCalendar size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Informações do Agendamento</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Status</ThemedText>
                <Badge variant="success">Ativo</Badge>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Frequência</ThemedText>
                <ThemedText style={styles.value}>Mensal</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Contagem</ThemedText>
                <ThemedText style={styles.value}>1</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Tipo de Atribuição</ThemedText>
                <ThemedText style={styles.value}>Individual</ThemedText>
              </View>
            </View>
          </Card>

          {/* Schedule Timing */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconClock size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Datas e Horários</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Criado em</ThemedText>
                <ThemedText style={styles.value}>{formatDateTime(new Date())}</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Última Execução</ThemedText>
                <ThemedText style={styles.value}>{formatDate(new Date())}</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Próxima Execução</ThemedText>
                <ThemedText style={styles.value}>{formatDate(new Date())}</ThemedText>
              </View>
            </View>
          </Card>

          {/* PPE Items */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconShield size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Tipos de EPI</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <View style={styles.badgeContainer}>
                <Badge variant="secondary">Capacete (1x)</Badge>
                <Badge variant="secondary">Luvas (2x)</Badge>
              </View>
            </View>
          </Card>

          {/* Users Information */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconUsers size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Usuários Inclusos</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <ThemedText style={styles.description}>Nenhum usuário específico</ThemedText>
            </View>
          </Card>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.xs,
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    opacity: 0.6,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
});
