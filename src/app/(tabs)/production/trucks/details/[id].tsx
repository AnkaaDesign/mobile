import React, { useState } from "react";
import { View, ScrollView, Alert, Pressable , StyleSheet} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconEdit, IconTrash, IconTruck, IconMap, IconSettings, IconHistory, IconTool } from "@tabler/icons-react-native";
import { useTruck, useTruckMutations } from '../../../../../hooks';
import { TRUCK_MANUFACTURER_LABELS } from '../../../../../constants';
import { ThemedView, ThemedText, Card, Badge, ErrorScreen, Skeleton, FAB } from "@/components/ui";
import { InfoRow } from "@/components/ui/info-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { DateTimeDisplay } from "@/components/ui/date-time-display";
import { MaintenanceHistorySection } from "@/components/production/truck/detail/maintenance-history-section";
import { TruckPositionMap } from "@/components/production/truck/detail/truck-position-map";
import { TaskInfoSection } from "@/components/production/truck/detail/task-info-section";
import { GarageInfoSection } from "@/components/production/truck/detail/garage-info-section";
import { LayoutsSection } from "@/components/production/truck/detail/layouts-section";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function TruckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'info' | 'maintenance' | 'position'>('info');

  const { data: truck, isLoading, error, refetch } = useTruck(id!, {
    include: {
      task: {
        include: {
          customer: true,
          sector: true,
        },
      },
      garage: true,
      leftSideLayout: true,
      rightSideLayout: true,
      backSideLayout: true,
    },
  });

  const { delete: deleteTruck } = useTruckMutations();

  const handleEdit = () => {
    router.push(routeToMobilePath(routes.production.trucks.edit(id!)) as any);
  };

  const handleDelete = () => {
    Alert.alert(
      "Excluir Caminhão",
      `Tem certeza que deseja excluir o caminhão ${truck?.data?.plate}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTruck(id!);
              router.back();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o caminhão. Tente novamente.");
            }
          },
        },
      ],
    );
  };

  const handleGoToTask = () => {
    if (truck?.data?.task?.id) {
      router.push(routeToMobilePath(routes.production.schedule.details(truck.data.task.id)) as any);
    }
  };

  const handleGoToGarage = () => {
    if (truck?.data?.garage?.id) {
      router.push(routeToMobilePath(routes.production.garages.details(truck.data.garage.id)) as any);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Skeleton height={24} width="60%" />
            <View style={styles.skeletonRows}>
              <Skeleton height={16} width="100%" />
              <Skeleton height={16} width="80%" />
              <Skeleton height={16} width="90%" />
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (error || !truck?.data) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar caminhão"
          detail={error?.message || "Caminhão não encontrado"}
          onRetry={refetch}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <IconTruck size={24} color={colors.primary} />
            <ThemedText style={styles.title}>{truck.data.plate}</ThemedText>
          </View>
          <ThemedText style={StyleSheet.flatten([styles.subtitle, { color: colors.mutedForeground }])}>
            {TRUCK_MANUFACTURER_LABELS[truck.data.manufacturer]} {truck.data.model}
          </ThemedText>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          style={StyleSheet.flatten([styles.tab, activeTab === 'info' && { borderBottomColor: colors.primary }])}
          onPress={() => setActiveTab('info')}
        >
          <IconSettings size={20} color={activeTab === 'info' ? colors.primary : colors.mutedForeground} />
          <ThemedText style={StyleSheet.flatten([styles.tabText, { color: activeTab === 'info' ? colors.primary : colors.mutedForeground }])}>
            Informações
          </ThemedText>
        </Pressable>
        <Pressable
          style={StyleSheet.flatten([styles.tab, activeTab === 'maintenance' && { borderBottomColor: colors.primary }])}
          onPress={() => setActiveTab('maintenance')}
        >
          <IconTool size={20} color={activeTab === 'maintenance' ? colors.primary : colors.mutedForeground} />
          <ThemedText style={StyleSheet.flatten([styles.tabText, { color: activeTab === 'maintenance' ? colors.primary : colors.mutedForeground }])}>
            Manutenção
          </ThemedText>
        </Pressable>
        <Pressable
          style={StyleSheet.flatten([styles.tab, activeTab === 'position' && { borderBottomColor: colors.primary }])}
          onPress={() => setActiveTab('position')}
        >
          <IconMap size={20} color={activeTab === 'position' ? colors.primary : colors.mutedForeground} />
          <ThemedText style={StyleSheet.flatten([styles.tabText, { color: activeTab === 'position' ? colors.primary : colors.mutedForeground }])}>
            Posição
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'info' && (
          <>
            {/* Basic Information */}
            <Card style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Identificação</ThemedText>
              <InfoRow label="Placa" value={truck.data.plate} />
              <InfoRow label="Modelo" value={truck.data.model} />
              <InfoRow label="Montadora" value={TRUCK_MANUFACTURER_LABELS[truck.data.manufacturer]} />
            </Card>

            {/* Task Information */}
            {truck.data.task && (
              <TaskInfoSection
                data={truck.data.task}
              />
            )}

            {/* Garage Information */}
            {truck.data.garage && (
              <GarageInfoSection
                data={truck.data.garage}
              />
            )}

            {/* Position Information */}
            <Card style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Posição</ThemedText>
              {truck.data.xPosition !== null && truck.data.yPosition !== null ? (
                <>
                  <InfoRow label="Posição X" value={`${truck.data.xPosition}m`} />
                  <InfoRow label="Posição Y" value={`${truck.data.yPosition}m`} />
                </>
              ) : (
                <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                  Posição não definida
                </ThemedText>
              )}
            </Card>

            {/* Layouts Section */}
            <LayoutsSection
              data={{
                leftSideLayout: truck.data.leftSideLayout,
                rightSideLayout: truck.data.rightSideLayout,
                backSideLayout: truck.data.backSideLayout
              }}
            />

            {/* Timestamps */}
            <Card style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Registro</ThemedText>
              <InfoRow
                label="Criado em"
                value={<DateTimeDisplay>{new Date(truck.data.createdAt).toLocaleDateString('pt-BR')}</DateTimeDisplay>}
              />
              <InfoRow
                label="Atualizado em"
                value={<DateTimeDisplay>{new Date(truck.data.updatedAt).toLocaleDateString('pt-BR')}</DateTimeDisplay>}
              />
            </Card>
          </>
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceHistorySection data={{ truckId: truck.data.id }} />
        )}

        {activeTab === 'position' && (
          <TruckPositionMap />
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB icon="edit" onPress={handleEdit} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    gap: 4,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginLeft: 32,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 0,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  skeletonRows: {
    gap: 8,
  },
  emptyText: {
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 12,
  },
});