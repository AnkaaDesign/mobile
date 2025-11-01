import { View, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconAlertTriangle, IconCheck, IconX } from "@tabler/icons-react-native";

import { ThemedView, ThemedText, Button, ErrorScreen } from "@/components/ui";
import { useWarnings } from "@/hooks";
import { useTheme } from "@/lib/theme";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function WarningBatchEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ ids?: string }>();

  const selectedIds = params.ids ? params.ids.split(",").filter(Boolean) : [];

  const { data, isLoading, } = useWarnings({
    where: {
      id: { in: selectedIds },
    },
    limit: 100,
    include: {
      collaborator: true,
      supervisor: true,
    },
  });

  const warnings = data?.data || [];

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

  if (selectedIds.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContainer}>
          <IconAlertTriangle size={48} color={colors.mutedForeground} />
          <ThemedText style={styles.errorTitle}>Nenhuma Advertência Selecionada</ThemedText>
          <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
            Nenhuma advertência foi selecionada para edição em lote.
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
          <ThemedText style={styles.loadingText}>Carregando advertências...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (warnings.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Nenhuma advertência encontrada"
          detail="As advertências selecionadas não foram encontradas."
          onRetry={handleCancel}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.title}>Edição em Lote de Advertências</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {warnings.length} {warnings.length === 1 ? "advertência selecionada" : "advertências selecionadas"}
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

      {/* Warnings List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.warningsList}>
          {warnings.map((warning) => (
            <View
              key={warning.id}
              style={[styles.warningCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <ThemedText style={styles.collaboratorName}>
                {warning.collaborator?.name || "Colaborador não encontrado"}
              </ThemedText>
              {warning.supervisor && (
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Supervisor:
                  </ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {warning.supervisor.name}
                  </ThemedText>
                </View>
              )}
              {warning.createdAt && (
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Data:
                  </ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {formatDate(warning.createdAt)}
                  </ThemedText>
                </View>
              )}
              {warning.reason && (
                <View style={styles.reasonContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Motivo:
                  </ThemedText>
                  <ThemedText style={styles.reasonText} numberOfLines={2}>
                    {warning.reason}
                  </ThemedText>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
            A funcionalidade de edição em lote permite alterar múltiplas advertências simultaneamente.
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
  warningsList: {
    gap: 12,
    marginBottom: 16,
  },
  warningCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  collaboratorName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  reasonContainer: {
    marginTop: 4,
    gap: 4,
  },
  reasonText: {
    fontSize: 13,
    lineHeight: 18,
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
