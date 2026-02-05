import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSecullumHorarioById } from "@/hooks/secullum";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconClock, IconRefresh, IconCheck, IconX } from "@tabler/icons-react-native";
import { TouchableOpacity } from "react-native";

export default function ScheduleDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useSecullumHorarioById(id, { enabled: !!id });

  const schedule = response?.data?.data;

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
    });
  }, [refetch]);

  // Format time string (e.g., "08:00:00" -> "08:00")
  const formatTime = (time?: string) => {
    if (!time) return "-";
    return time.substring(0, 5);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Card style={styles.card}>
              <View style={styles.skeletonHeader}>
                <View style={[styles.skeleton, { width: 200, height: 24, backgroundColor: colors.muted }]} />
              </View>
              <View style={styles.skeletonBody}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={[styles.skeleton, { width: "100%", height: 48, backgroundColor: colors.muted, marginBottom: spacing.sm }]} />
                ))}
              </View>
            </Card>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (error || !schedule || !id || id === "") {
    return (
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Card style={styles.card}>
              <View style={styles.errorContent}>
                <View style={[styles.errorIcon, { backgroundColor: colors.muted }]}>
                  <IconClock size={32} color={colors.mutedForeground} />
                </View>
                <ThemedText style={[styles.errorTitle, { color: colors.foreground }]}>
                  Horário não encontrado
                </ThemedText>
                <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
                  O horário solicitado não foi encontrado ou pode ter sido removido.
                </ThemedText>
                <Button onPress={() => router.back()}>
                  <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
                </Button>
              </View>
            </Card>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
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
        <View style={styles.content}>
          {/* Schedule Header Card */}
          <Card style={styles.card}>
            <View style={styles.headerContent}>
              <View style={[styles.headerLeft, { flex: 1 }]}>
                <IconClock size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.scheduleName, { color: colors.foreground }]}>
                    {schedule.Descricao || schedule.Codigo}
                  </ThemedText>
                  {schedule.Descricao && schedule.Codigo && (
                    <ThemedText style={[styles.scheduleCode, { color: colors.mutedForeground }]}>
                      Código: {schedule.Codigo}
                    </ThemedText>
                  )}
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={handleRefresh}
                  style={[styles.actionButton, { backgroundColor: colors.muted }]}
                  activeOpacity={0.7}
                  disabled={refreshing}
                >
                  <IconRefresh size={18} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Status Card */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <ThemedText style={styles.title}>Status</ThemedText>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <ThemedText style={[styles.statusLabel, { color: colors.mutedForeground }]}>
                  Situação
                </ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: schedule.Ativo ? "#dcfce7" : "#f3f4f6" }]}>
                  {schedule.Ativo ? (
                    <IconCheck size={14} color="#22c55e" />
                  ) : (
                    <IconX size={14} color="#6b7280" />
                  )}
                  <ThemedText style={[styles.statusText, { color: schedule.Ativo ? "#22c55e" : "#6b7280" }]}>
                    {schedule.Ativo ? "Ativo" : "Inativo"}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.statusItem}>
                <ThemedText style={[styles.statusLabel, { color: colors.mutedForeground }]}>
                  Tipo
                </ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: schedule.HorarioFlexivel ? "#dbeafe" : "#f3f4f6" }]}>
                  <ThemedText style={[styles.statusText, { color: schedule.HorarioFlexivel ? "#3b82f6" : "#6b7280" }]}>
                    {schedule.HorarioFlexivel ? "Flexível" : "Fixo"}
                  </ThemedText>
                </View>
              </View>
            </View>
          </Card>

          {/* Schedule Times Card */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <ThemedText style={styles.title}>Horários de Trabalho</ThemedText>
            </View>
            <View style={styles.timesContainer}>
              {/* First Period */}
              <View style={styles.periodRow}>
                <ThemedText style={[styles.periodLabel, { color: colors.mutedForeground }]}>
                  1º Período
                </ThemedText>
                <View style={styles.periodTimes}>
                  <View style={styles.timeBlock}>
                    <ThemedText style={[styles.timeLabel, { color: colors.mutedForeground }]}>
                      Entrada
                    </ThemedText>
                    <ThemedText style={[styles.timeValue, { color: colors.foreground }]}>
                      {formatTime(schedule.Entrada1)}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.timeSeparator, { color: colors.mutedForeground }]}>
                    →
                  </ThemedText>
                  <View style={styles.timeBlock}>
                    <ThemedText style={[styles.timeLabel, { color: colors.mutedForeground }]}>
                      Saída
                    </ThemedText>
                    <ThemedText style={[styles.timeValue, { color: colors.foreground }]}>
                      {formatTime(schedule.Saida1)}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Second Period */}
              {(schedule.Entrada2 || schedule.Saida2) && (
                <View style={[styles.periodRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }]}>
                  <ThemedText style={[styles.periodLabel, { color: colors.mutedForeground }]}>
                    2º Período
                  </ThemedText>
                  <View style={styles.periodTimes}>
                    <View style={styles.timeBlock}>
                      <ThemedText style={[styles.timeLabel, { color: colors.mutedForeground }]}>
                        Entrada
                      </ThemedText>
                      <ThemedText style={[styles.timeValue, { color: colors.foreground }]}>
                        {formatTime(schedule.Entrada2)}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.timeSeparator, { color: colors.mutedForeground }]}>
                      →
                    </ThemedText>
                    <View style={styles.timeBlock}>
                      <ThemedText style={[styles.timeLabel, { color: colors.mutedForeground }]}>
                        Saída
                      </ThemedText>
                      <ThemedText style={[styles.timeValue, { color: colors.foreground }]}>
                        {formatTime(schedule.Saida2)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}

              {/* Third Period */}
              {(schedule.Entrada3 || schedule.Saida3) && (
                <View style={[styles.periodRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }]}>
                  <ThemedText style={[styles.periodLabel, { color: colors.mutedForeground }]}>
                    3º Período
                  </ThemedText>
                  <View style={styles.periodTimes}>
                    <View style={styles.timeBlock}>
                      <ThemedText style={[styles.timeLabel, { color: colors.mutedForeground }]}>
                        Entrada
                      </ThemedText>
                      <ThemedText style={[styles.timeValue, { color: colors.foreground }]}>
                        {formatTime(schedule.Entrada3)}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.timeSeparator, { color: colors.mutedForeground }]}>
                      →
                    </ThemedText>
                    <View style={styles.timeBlock}>
                      <ThemedText style={[styles.timeLabel, { color: colors.mutedForeground }]}>
                        Saída
                      </ThemedText>
                      <ThemedText style={[styles.timeValue, { color: colors.foreground }]}>
                        {formatTime(schedule.Saida3)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </Card>

          {/* Additional Information Card */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <ThemedText style={styles.title}>Informações Adicionais</ThemedText>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Carga Horária Diária
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {schedule.CargaHorariaDiaria || "-"}
                </ThemedText>
              </View>
              <View style={styles.infoItem}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Carga Horária Semanal
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {schedule.CargaHorariaSemanal || "-"}
                </ThemedText>
              </View>
              {schedule.ToleranciaEntrada !== undefined && (
                <View style={styles.infoItem}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Tolerância Entrada
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {schedule.ToleranciaEntrada} min
                  </ThemedText>
                </View>
              )}
              {schedule.ToleranciaSaida !== undefined && (
                <View style={styles.infoItem}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Tolerância Saída
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {schedule.ToleranciaSaida} min
                  </ThemedText>
                </View>
              )}
              {schedule.TipoHorarioDescricao && (
                <View style={[styles.infoItem, { width: "100%" }]}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Tipo de Horário
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {schedule.TipoHorarioDescricao}
                  </ThemedText>
                </View>
              )}
            </View>
          </Card>

          {/* Bottom spacing for mobile navigation */}
          <View style={{ height: spacing.xxl * 2 }} />
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  scheduleName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  scheduleCode: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  timesContainer: {
    gap: spacing.md,
  },
  periodRow: {
    gap: spacing.sm,
  },
  periodLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  periodTimes: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  timeBlock: {
    alignItems: "center",
  },
  timeLabel: {
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  timeValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  timeSeparator: {
    fontSize: fontSize.lg,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  infoItem: {
    width: "48%",
  },
  infoLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  skeletonHeader: {
    marginBottom: spacing.lg,
  },
  skeletonBody: {
    gap: spacing.sm,
  },
  skeleton: {
    borderRadius: borderRadius.md,
  },
});
