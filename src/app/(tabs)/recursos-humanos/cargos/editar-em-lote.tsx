import { View, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconBriefcase, IconCheck, IconX } from "@tabler/icons-react-native";

import { ThemedView, ThemedText, Button, ErrorScreen } from "@/components/ui";
import { usePositions } from "@/hooks";
import { useTheme } from "@/lib/theme";

export default function PositionBatchEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ ids?: string }>();

  const positionIds = params.ids ? params.ids.split(",").filter(Boolean) : [];

  const {
    data: positionsResponse,
    isLoading,
    error,
  } = usePositions({
    where: {
      id: { in: positionIds },
    },
    include: {
      users: true,
      remunerations: true,
      _count: true,
    },
  });

  const positions = positionsResponse?.data || [];
  const hasValidPositions = positions.length > 0;

  const handleCancel = () => {
    router.back();
  };

  if (positionIds.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContainer}>
          <IconBriefcase size={48} color={colors.mutedForeground} />
          <ThemedText style={styles.errorTitle}>Nenhum Cargo Selecionado</ThemedText>
          <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
            Nenhum cargo foi selecionado para edição em lote.
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
          <ThemedText style={styles.loadingText}>Carregando cargos...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !hasValidPositions) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar cargos"
          detail={error?.message || "Os cargos selecionados não foram encontrados."}
          onRetry={handleCancel}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.title}>Editar Cargos em Lote</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {positions.length} {positions.length === 1 ? "cargo selecionado" : "cargos selecionados"}
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
          onPress={() => Alert.alert("Em desenvolvimento", "Funcionalidade de edição em lote em desenvolvimento.")}
          style={StyleSheet.flatten([styles.button, styles.saveButton])}
        >
          <IconCheck size={18} color="#fff" />
          <ThemedText style={styles.saveButtonText}>Salvar</ThemedText>
        </Button>
      </View>

      {/* Positions List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.positionsList}>
          {positions.map((position) => (
            <View
              key={position.id}
              style={[styles.positionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <ThemedText style={styles.positionName}>{position.name}</ThemedText>
              {position.remuneration && (
                <ThemedText style={[styles.positionRemuneration, { color: colors.mutedForeground }]}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(position.remuneration)}
                </ThemedText>
              )}
              {position._count?.users && position._count.users > 0 && (
                <ThemedText style={[styles.positionUsers, { color: colors.mutedForeground }]}>
                  {position._count.users} {position._count.users === 1 ? "colaborador" : "colaboradores"}
                </ThemedText>
              )}
            </View>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
            A funcionalidade de edição em lote permite alterar múltiplos cargos simultaneamente.
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
  positionsList: {
    gap: 12,
    marginBottom: 16,
  },
  positionCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  positionName: {
    fontSize: 16,
    fontWeight: "600",
  },
  positionRemuneration: {
    fontSize: 14,
  },
  positionUsers: {
    fontSize: 12,
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
