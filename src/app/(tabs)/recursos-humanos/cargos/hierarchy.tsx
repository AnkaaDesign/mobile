import { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { IconGripVertical, IconCheck, IconX } from "@tabler/icons-react-native";

import { ThemedView, ThemedText, Button, ErrorScreen } from "@/components/ui";
import { usePositions, usePositionBatchMutations } from "@/hooks";
import { useTheme } from "@/lib/theme";

interface Position {
  id: string;
  name: string;
  hierarchy: number | null;
  remuneration: number | null;
}

export default function PositionHierarchyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: positionsData, isLoading, error, refetch } = usePositions({
    orderBy: { hierarchy: "asc" }
  });
  const { batchUpdateAsync } = usePositionBatchMutations();

  const [positions, setPositions] = useState<Position[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (positionsData?.data) {
      const sorted = [...positionsData.data].sort((a, b) => {
        if (a.hierarchy === null && b.hierarchy === null) return 0;
        if (a.hierarchy === null) return 1;
        if (b.hierarchy === null) return -1;
        return a.hierarchy - b.hierarchy;
      }) as Position[];
      setPositions(sorted);
    }
  }, [positionsData]);

  const handleDragEnd = useCallback(({ data }: { data: Position[] }) => {
    setPositions(data as Position[]);
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await batchUpdateAsync({
        positions: positions.map((position, index) => ({
          id: position.id,
          data: { hierarchy: index + 1 },
        })),
      });

      Alert.alert(
        "Sucesso",
        `Hierarquia atualizada! ${result?.data?.totalSuccess || positions.length} cargos atualizados.`,
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );

      setHasChanges(false);
    } catch (error) {
      console.error("Error updating hierarchy:", error);
      Alert.alert("Erro", "Erro ao atualizar hierarquia. Por favor, tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        "Alterações não salvas",
        "Você tem alterações não salvas. Deseja realmente cancelar?",
        [
          { text: "Não", style: "cancel" },
          { text: "Sim", onPress: () => router.back(), style: "destructive" },
        ]
      );
    } else {
      router.back();
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<Position>) => {
    const index = getIndex();
    return (
      <ScaleDecorator>
        <View
          style={[
            styles.positionItem,
            {
              backgroundColor: isActive ? colors.accent : colors.card,
              borderColor: colors.border
            }
          ]}
        >
          <View style={styles.dragHandle} onTouchStart={drag}>
            <IconGripVertical size={20} color={colors.mutedForeground} />
          </View>
          <View style={styles.positionContent}>
            <View style={styles.positionHeader}>
              <ThemedText style={styles.hierarchyNumber}>#{(index ?? 0) + 1}</ThemedText>
              <ThemedText style={styles.positionName}>{item.name}</ThemedText>
            </View>
            <ThemedText style={styles.remuneration}>
              {formatCurrency(item.remuneration)}
            </ThemedText>
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando cargos...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar cargos"
          detail={error.message}
          onRetry={refetch}
        />
      </ThemedView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.title}>Hierarquia de Cargos</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Arraste os cargos para reorganizar a hierarquia
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={isSaving}
            style={styles.button}
          >
            <IconX size={18} color={colors.foreground} />
            <ThemedText>Cancelar</ThemedText>
          </Button>
          <Button
            variant="default"
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
            style={StyleSheet.flatten([styles.button, styles.saveButton])}
          >
            {isSaving ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <ThemedText style={styles.saveButtonText}>Salvando...</ThemedText>
              </>
            ) : (
              <>
                <IconCheck size={18} color="#fff" />
                <ThemedText style={styles.saveButtonText}>Salvar</ThemedText>
              </>
            )}
          </Button>
        </View>

        {/* Draggable List */}
        <DraggableFlatList
          data={positions}
          onDragEnd={handleDragEnd}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      </ThemedView>
    </GestureHandlerRootView>
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
  listContent: {
    padding: 16,
    gap: 8,
  },
  positionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  dragHandle: {
    padding: 4,
  },
  positionContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  positionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  hierarchyNumber: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 32,
  },
  positionName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  remuneration: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
});
