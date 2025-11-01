import { View, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconBeach, IconCheck, IconX } from "@tabler/icons-react-native";

import { ThemedView, ThemedText, Button, ErrorScreen } from "@/components/ui";
import { useVacations } from "@/hooks";
import { useTheme } from "@/lib/theme";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VacationBatchEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ ids?: string }>();

  const selectedIds = params.ids ? params.ids.split(",").filter(Boolean) : [];

  const { data, isLoading, } = useVacations({
    where: {
      id: { in: selectedIds },
    },
    include: {
      user: true,
    },
    limit: 100,
  });

  const vacations = data?.data || [];

  const handleCancel = () => {
    router.back();
  };

  const handleSave = () => {
    Alert.alert("Em desenvolvimento", "Funcionalidade de edição em lote em desenvolvimento.");
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
  };

  const calculateDays = (startAt: string | Date, endAt: string | Date) => {
    const start = typeof startAt === "string" ? new Date(startAt) : startAt;
    const end = typeof endAt === "string" ? new Date(endAt) : endAt;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end days
  };

  if (selectedIds.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContainer}>
          <IconBeach size={48} color={colors.mutedForeground} />
          <ThemedText style={styles.errorTitle}>Nenhuma Férias Selecionada</ThemedText>
          <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
            Nenhuma férias foi selecionada para edição em lote.
          </ThemedText>
          <Button variant="outline" onPress={handleCancel} style={styles.errorButton}>
            <ThemedText>Voltar para Lista</ThemedText>
          </Button>
        </View>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando férias...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (vacations.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Nenhuma férias encontrada"
          detail="As férias selecionadas não foram encontradas."
          onRetry={handleCancel}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.title}>Edição em Lote de Férias</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {vacations.length} {vacations.length === 1 ? "férias selecionada" : "férias selecionadas"}
        </ThemedText>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          variant="outline"
          onPress={handleCancel}
          style={styles.button}
        >
          <IconX size={18} color={colors.foreground} />
          <ThemedText>Cancelar</ThemedText>
        </Button>
        <Button
          variant="default"
          onPress={handleSave}
          style={StyleSheet.flatten([styles.button, styles.saveButton])}
        >
          <IconCheck size={18} color="#fff" />
          <ThemedText style={styles.saveButtonText}>Salvar</ThemedText>
        </Button>
      </View>

      {/* Vacations List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.vacationsList}>
          {vacations.map((vacation) => (
            <View
              key={vacation.id}
              style={[styles.vacationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <ThemedText style={styles.userName}>{vacation.user?.name || "Usuário não encontrado"}</ThemedText>
              <View style={styles.dateRow}>
                <ThemedText style={[styles.dateLabel, { color: colors.mutedForeground }]}>
                  Início:
                </ThemedText>
                <ThemedText style={styles.dateValue}>
                  {formatDate(vacation.startAt)}
                </ThemedText>
              </View>
              <View style={styles.dateRow}>
                <ThemedText style={[styles.dateLabel, { color: colors.mutedForeground }]}>
                  Término:
                </ThemedText>
                <ThemedText style={styles.dateValue}>
                  {formatDate(vacation.endAt)}
                </ThemedText>
              </View>
              <View style={styles.dateRow}>
                <ThemedText style={[styles.dateLabel, { color: colors.mutedForeground }]}>
                  Dias:
                </ThemedText>
                <ThemedText style={styles.dateValue}>
                  {(() => {
                    const days = calculateDays(vacation.startAt, vacation.endAt);
                    return `${days} ${days === 1 ? "dia" : "dias"}`;
                  })()}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
            A funcionalidade de edição em lote permite alterar múltiplas férias simultaneamente.
            Esta feature está em desenvolvimento e será disponibilizada em breve.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButton: {
    flex: 1,
  },
  saveButtonText: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  vacationsList: {
    gap: 12,
    marginBottom: 16,
  },
  vacationCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    width: 60,
  },
  dateValue: {
    fontSize: 14,
  },
  infoCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  errorDescription: {
    fontSize: 14,
    textAlign: "center",
  },
  errorButton: {
    marginTop: 16,
  },
  loadingText: {
    fontSize: 14,
  },
});
