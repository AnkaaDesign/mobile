import { useState, useMemo } from "react";
import { View, ScrollView, Alert, Image, Modal, Dimensions , StyleSheet} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSecullumTimeEntries } from "@/hooks/secullum";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Header } from "@/components/ui/header";
import { IconClock, IconUser, IconCalendar, IconMapPin, IconCamera, IconPhone, IconMail, IconBuilding, IconEdit, IconX } from "@tabler/icons-react-native";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useScreenReady } from '@/hooks/use-screen-ready';


import { Skeleton } from "@/components/ui/skeleton";const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TimeEntryDetail {
  id: string;
  date: string;
  entry1?: string;
  exit1?: string;
  entry2?: string;
  exit2?: string;
  entry3?: string;
  exit3?: string;
  entry4?: string;
  exit4?: string;
  entry5?: string;
  exit5?: string;
  totalHours?: string;
  normalHours?: string;
  overtimeHours?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  hasPhoto?: boolean;
  photoUrl?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userDepartment?: string;
  userPosition?: string;
  source?: string;
  deviceId?: string;
  synced?: boolean;
  lastSync?: string;
  justifications?: Array<{
    field: string;
    originalTime: string;
    newTime: string;
    reason: string;
    createdAt: string;
  }>;
}

export default function TimeEntryDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // For this demo, we'll create mock data since we don't have a specific detail endpoint
  // In a real implementation, you would fetch the specific entry by ID
  const { data: timeEntriesData, isLoading, error } = useSecullumTimeEntries({
    // This would be replaced with a specific endpoint for the entry ID
    take: 100,
    userId: "mock-user-id", // Provide a mock userId to enable the query
  });

  useScreenReady(!isLoading);

  // Find the specific entry (mock implementation)
  const timeEntry = useMemo(() => {
    if (!timeEntriesData?.data || !Array.isArray(timeEntriesData.data) || !id) return null;

    // In a real implementation, this would be fetched directly by ID
    const entry = timeEntriesData.data.find((e: any, index: number) =>
      e.id === id || `entry-${index}` === id
    );

    if (!entry) return null;

    return {
      id: entry.id || id,
      date: entry.date || entry.Data || "",
      entry1: entry.entry1 || entry.Entrada1 || "",
      exit1: entry.exit1 || entry.Saida1 || "",
      entry2: entry.entry2 || entry.Entrada2 || "",
      exit2: entry.exit2 || entry.Saida2 || "",
      entry3: entry.entry3 || entry.Entrada3 || "",
      exit3: entry.exit3 || entry.Saida3 || "",
      entry4: entry.entry4 || entry.Entrada4 || "",
      exit4: entry.exit4 || entry.Saida4 || "",
      entry5: entry.entry5 || entry.Entrada5 || "",
      exit5: entry.exit5 || entry.Saida5 || "",
      totalHours: entry.totalHours || entry.TotalHoras || "",
      normalHours: entry.normalHours || entry.HorasNormais || "",
      overtimeHours: entry.overtimeHours || entry.HorasExtras || "",
      location: entry.location || entry.Local || "",
      address: entry.address || entry.Endereco || "",
      latitude: entry.latitude || entry.Latitude,
      longitude: entry.longitude || entry.Longitude,
      hasPhoto: entry.hasPhoto || entry.TemFoto || false,
      photoUrl: entry.photoUrl || entry.UrlFoto,
      userId: entry.userId || entry.FuncionarioId,
      userName: entry.userName || entry.NomeFuncionario || "Usuário não identificado",
      userEmail: entry.userEmail || entry.EmailFuncionario || "",
      userPhone: entry.userPhone || entry.TelefoneFuncionario || "",
      userDepartment: entry.userDepartment || entry.DepartamentoFuncionario || "",
      userPosition: entry.userPosition || entry.CargoFuncionario || "",
      source: entry.source || entry.Fonte || "SECULLUM",
      deviceId: entry.deviceId || entry.DispositivoId || "",
      synced: entry.synced !== false,
      lastSync: entry.lastSync || entry.UltimaSync || "",
      justifications: entry.justifications || [],
    } as TimeEntryDetail;
  }, [timeEntriesData, id]);

  // Format date display
  const formatDateDisplay = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  // Format time pairs
  const getTimePairs = () => {
    const pairs = [];
    if (timeEntry?.entry1 && timeEntry?.exit1) {
      pairs.push({ entry: timeEntry.entry1, exit: timeEntry.exit1, period: "1º Período" });
    }
    if (timeEntry?.entry2 && timeEntry?.exit2) {
      pairs.push({ entry: timeEntry.entry2, exit: timeEntry.exit2, period: "2º Período" });
    }
    if (timeEntry?.entry3 && timeEntry?.exit3) {
      pairs.push({ entry: timeEntry.entry3, exit: timeEntry.exit3, period: "3º Período" });
    }
    if (timeEntry?.entry4 && timeEntry?.exit4) {
      pairs.push({ entry: timeEntry.entry4, exit: timeEntry.exit4, period: "4º Período" });
    }
    if (timeEntry?.entry5 && timeEntry?.exit5) {
      pairs.push({ entry: timeEntry.entry5, exit: timeEntry.exit5, period: "5º Período" });
    }
    return pairs;
  };

  // Handle image press
  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  // Handle edit press
  const handleEditPress = () => {
    Alert.alert(
      "Editar Registro",
      "A edição de registros será implementada em breve.",
      [{ text: "OK" }]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.scrollContent, { paddingTop: spacing.md }]}>
          {/* Employee / Funcionário card skeleton */}
          <View style={[styles.card, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
                <Skeleton style={{ height: 18, width: 100, borderRadius: 4 }} />
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Skeleton style={{ height: 24, width: 90, borderRadius: 12 }} />
                <Skeleton style={{ height: 24, width: 70, borderRadius: 12 }} />
              </View>
            </View>
            <View style={styles.content}>
              {[['80px', '150px'], ['120px', '180px'], ['100px', '140px']].map(([l, v], i) => (
                <View key={i} style={styles.infoRow}>
                  <Skeleton style={{ height: 14, width: parseInt(l), borderRadius: 4 }} />
                  <Skeleton style={{ height: 14, width: parseInt(v), borderRadius: 4 }} />
                </View>
              ))}
            </View>
          </View>
          {/* Time records card skeleton */}
          <View style={[styles.card, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
                <Skeleton style={{ height: 18, width: 160, borderRadius: 4 }} />
              </View>
            </View>
            <View style={styles.content}>
              {[0, 1].map((i) => (
                <View key={i} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.md, gap: spacing.sm }}>
                  <Skeleton style={{ height: 16, width: 80, borderRadius: 4 }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                      <Skeleton style={{ height: 12, width: 50, borderRadius: 4 }} />
                      <Skeleton style={{ height: 22, width: 60, borderRadius: 4 }} />
                    </View>
                    <View style={{ width: 2, height: 30, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
                    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                      <Skeleton style={{ height: 12, width: 40, borderRadius: 4 }} />
                      <Skeleton style={{ height: 22, width: 60, borderRadius: 4 }} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
          {/* Summary card skeleton */}
          <View style={[styles.card, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
                <Skeleton style={{ height: 18, width: 80, borderRadius: 4 }} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ flex: 1, minWidth: 100, alignItems: 'center', padding: spacing.sm, backgroundColor: colors.muted, borderRadius: 8, gap: 4 }}>
                  <Skeleton style={{ height: 12, width: 80, borderRadius: 4 }} />
                  <Skeleton style={{ height: 22, width: 60, borderRadius: 4 }} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ErrorScreen
        title="Erro ao carregar registro"
        message="Não foi possível carregar os detalhes do registro de ponto."
        onRetry={() => router.back()}
      />
    );
  }

  if (!timeEntry) {
    return (
      <ErrorScreen
        title="Registro não encontrado"
        message="O registro de ponto solicitado não foi encontrado."
        onRetry={() => router.back()}
      />
    );
  }

  const timePairs = getTimePairs();

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Registro de Ponto"
        subtitle={formatDateDisplay(timeEntry.date)}
        showBackButton
        onBackPress={() => router.back()}
        rightAction={
          <Button variant="ghost" size="sm" onPress={handleEditPress}>
            <IconEdit size={20} color="#3B82F6" />
          </Button>
        }
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Employee Information */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconUser size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Funcionário</ThemedText>
            </View>
            <View style={styles.syncBadgeContainer}>
              <Badge
                variant={timeEntry.synced ? "success" : "warning"}
                style={styles.syncBadge}
              >
                {timeEntry.synced ? "Sincronizado" : "Pendente"}
              </Badge>
              <Badge variant="outline" style={styles.sourceBadge}>
                {timeEntry.source}
              </Badge>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Nome:</ThemedText>
              <ThemedText style={styles.infoValue}>{timeEntry.userName}</ThemedText>
            </View>
            {timeEntry.userEmail && (
              <View style={styles.infoRow}>
                <IconMail size={16} color="#6B7280" />
                <ThemedText style={styles.infoValue}>{timeEntry.userEmail}</ThemedText>
              </View>
            )}
            {timeEntry.userPhone && (
              <View style={styles.infoRow}>
                <IconPhone size={16} color="#6B7280" />
                <ThemedText style={styles.infoValue}>{timeEntry.userPhone}</ThemedText>
              </View>
            )}
            {timeEntry.userDepartment && (
              <View style={styles.infoRow}>
                <IconBuilding size={16} color="#6B7280" />
                <ThemedText style={styles.infoValue}>
                  {timeEntry.userDepartment}
                  {timeEntry.userPosition && ` - ${timeEntry.userPosition}`}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Time Records */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconClock size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Registros de Horário</ThemedText>
            </View>
          </View>

          <View style={styles.content}>
            {timePairs.map((pair, index) => (
              <View key={index} style={styles.timePair}>
                <ThemedText style={styles.periodLabel}>{pair.period}</ThemedText>
                <View style={styles.timeRow}>
                  <View style={styles.timeSlot}>
                    <ThemedText style={styles.timeLabel}>Entrada</ThemedText>
                    <ThemedText style={styles.timeValue}>{pair.entry}</ThemedText>
                  </View>
                  <View style={styles.timeSeparator} />
                  <View style={styles.timeSlot}>
                    <ThemedText style={styles.timeLabel}>Saída</ThemedText>
                    <ThemedText style={styles.timeValue}>{pair.exit}</ThemedText>
                  </View>
                </View>
              </View>
            ))}

            {timePairs.length === 0 && (
              <ThemedText style={styles.noRecordsText}>
                Nenhum registro de horário encontrado
              </ThemedText>
            )}
          </View>
        </Card>

        {/* Summary */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconCalendar size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Resumo</ThemedText>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.summaryGrid}>
              {timeEntry.totalHours && (
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryLabel}>Total de Horas</ThemedText>
                  <ThemedText style={styles.summaryValue}>{timeEntry.totalHours}</ThemedText>
                </View>
              )}
              {timeEntry.normalHours && (
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryLabel}>Horas Normais</ThemedText>
                  <ThemedText style={styles.summaryValue}>{timeEntry.normalHours}</ThemedText>
                </View>
              )}
              {timeEntry.overtimeHours && (
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryLabel}>Horas Extras</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.summaryValue, styles.overtimeValue])}>
                    {timeEntry.overtimeHours}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Location & Photo */}
        {(timeEntry.location || timeEntry.hasPhoto) && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconMapPin size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Localização & Foto</ThemedText>
              </View>
            </View>

            <View style={styles.content}>
              {timeEntry.location && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Local:</ThemedText>
                  <ThemedText style={styles.infoValue}>{timeEntry.location}</ThemedText>
                </View>
              )}
              {timeEntry.address && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Endereço:</ThemedText>
                  <ThemedText style={styles.infoValue}>{timeEntry.address}</ThemedText>
                </View>
              )}
              {timeEntry.latitude && timeEntry.longitude && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Coordenadas:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {timeEntry.latitude.toFixed(6)}, {timeEntry.longitude.toFixed(6)}
                  </ThemedText>
                </View>
              )}

              {timeEntry.hasPhoto && timeEntry.photoUrl && (
                <View style={styles.photoContainer}>
                  <ThemedText style={styles.infoLabel}>Foto do Registro:</ThemedText>
                  <Button
                    variant="outline"
                    style={styles.photoButton}
                    onPress={() => handleImagePress(timeEntry.photoUrl!)}
                  >
                    <IconCamera size={20} color="#3B82F6" />
                    <ThemedText style={styles.photoButtonText}>Ver Foto</ThemedText>
                  </Button>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Justifications */}
        {timeEntry.justifications && timeEntry.justifications.length > 0 && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconEdit size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Justificativas</ThemedText>
              </View>
            </View>

            <View style={styles.content}>
              {timeEntry.justifications.map((justification, index) => (
                <View key={index} style={styles.justificationItem}>
                  <View style={styles.justificationHeader}>
                    <ThemedText style={styles.justificationField}>
                      {justification.field}
                    </ThemedText>
                    <ThemedText style={styles.justificationDate}>
                      {format(new Date(justification.createdAt), "dd/MM/yyyy HH:mm")}
                    </ThemedText>
                  </View>
                  <View style={styles.justificationChanges}>
                    <ThemedText style={styles.justificationTime}>
                      {justification.originalTime} → {justification.newTime}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.justificationReason}>
                    {justification.reason}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Technical Information */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <ThemedText style={styles.title}>Informações Técnicas</ThemedText>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>ID do Registro:</ThemedText>
              <ThemedText style={styles.infoValue}>{timeEntry.id}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Fonte:</ThemedText>
              <ThemedText style={styles.infoValue}>{timeEntry.source}</ThemedText>
            </View>
            {timeEntry.deviceId && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Dispositivo:</ThemedText>
                <ThemedText style={styles.infoValue}>{timeEntry.deviceId}</ThemedText>
              </View>
            )}
            {timeEntry.lastSync && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Última Sincronização:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {format(new Date(timeEntry.lastSync), "dd/MM/yyyy HH:mm")}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Foto do Registro</ThemedText>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setImageModalVisible(false)}
              >
                <IconX size={24} color="#6B7280" />
              </Button>
            </View>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Layout
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

  // Card and Header Styles (Standardized Pattern)
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
  content: {
    gap: spacing.sm,
  },

  // Sync Badges
  syncBadgeContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  syncBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  // Info Rows
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: "#6B7280",
    minWidth: 80,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: "#374151",
    flex: 1,
  },

  // Time Records
  timeRecords: {
    gap: spacing.md,
  },
  timePair: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: spacing.md,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: spacing.sm,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeSlot: {
    flex: 1,
    alignItems: "center",
  },
  timeLabel: {
    fontSize: fontSize.xs,
    color: "#6B7280",
    marginBottom: spacing.xs,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#059669",
  },
  timeSeparator: {
    width: 2,
    height: 30,
    backgroundColor: "#E5E7EB",
    marginHorizontal: spacing.md,
  },
  noRecordsText: {
    fontSize: fontSize.sm,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
  },

  // Summary Grid
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  summaryItem: {
    flex: 1,
    minWidth: 100,
    alignItems: "center",
    padding: spacing.sm,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#059669",
    textAlign: "center",
  },
  overtimeValue: {
    color: "#DC2626",
  },

  // Location Info
  locationInfo: {
    gap: spacing.sm,
  },
  photoContainer: {
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  photoButtonText: {
    color: "#3B82F6",
    fontWeight: "500",
  },

  // Justifications
  justifications: {
    gap: spacing.sm,
  },
  justificationItem: {
    padding: spacing.sm,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  justificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  justificationField: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: "#92400E",
  },
  justificationDate: {
    fontSize: fontSize.xs,
    color: "#92400E",
  },
  justificationChanges: {
    marginBottom: spacing.sm,
  },
  justificationTime: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: "#92400E",
  },
  justificationReason: {
    fontSize: fontSize.sm,
    color: "#92400E",
    fontStyle: "italic",
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.8,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  fullscreenImage: {
    flex: 1,
    width: "100%",
  },
});