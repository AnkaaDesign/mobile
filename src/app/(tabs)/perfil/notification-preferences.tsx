import { useEffect, useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Alert, RefreshControl, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { notificationPreferenceService } from "@/api-client";
import type { UserNotificationPreference } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { usePushNotifications } from "@/contexts/push-notifications-context";

// =====================
// Types and Constants
// =====================

type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH" | "WHATSAPP";

const ALL_CHANNELS: NotificationChannel[] = ["IN_APP", "EMAIL", "PUSH", "WHATSAPP"];

interface NotificationEventPreference {
  channels: NotificationChannel[];
  mandatory: boolean;
}

interface NotificationPreferences {
  task: Record<string, NotificationEventPreference>;
  order: Record<string, NotificationEventPreference>;
  service_order: Record<string, NotificationEventPreference>;
  stock: Record<string, NotificationEventPreference>;
  system: Record<string, NotificationEventPreference>;
  vacation: Record<string, NotificationEventPreference>;
}

// =====================
// Channel Metadata
// =====================

const channelMetadata: Record<NotificationChannel, { label: string; icon: string; color: string }> = {
  IN_APP: { label: "In-App", icon: "🔔", color: "#f97316" },
  EMAIL: { label: "E-mail", icon: "📧", color: "#a855f7" },
  PUSH: { label: "Push", icon: "📱", color: "#3b82f6" },
  WHATSAPP: { label: "WhatsApp", icon: "💬", color: "#22c55e" },
};

// =====================
// Section Data
// =====================

interface NotificationEvent {
  key: string;
  label: string;
  description: string;
  mandatory: boolean;
}

interface NotificationSection {
  id: string;
  title: string;
  icon: string;
  events: NotificationEvent[];
}

const notificationSections: NotificationSection[] = [
  {
    id: "task",
    title: "Tarefas",
    icon: "📋",
    events: [
      // Lifecycle
      { key: "created", label: "Nova Tarefa", description: "Quando uma nova tarefa é criada", mandatory: false },
      { key: "status", label: "Mudança de Status", description: "Quando o status de uma tarefa é alterado", mandatory: true },
      { key: "finishedAt", label: "Conclusão", description: "Quando uma tarefa é concluída", mandatory: false },
      { key: "overdue", label: "Tarefa Atrasada", description: "Quando uma tarefa está atrasada", mandatory: true },
      // Basic info
      { key: "name", label: "Nome Alterado", description: "Quando o nome da tarefa é alterado", mandatory: false },
      { key: "details", label: "Detalhes Alterados", description: "Quando os detalhes da tarefa são modificados", mandatory: false },
      { key: "serialNumber", label: "Número de Série", description: "Quando o número de série é alterado", mandatory: false },
      // Dates
      { key: "entryDate", label: "Data de Entrada", description: "Quando a data de entrada é definida/alterada", mandatory: false },
      { key: "term", label: "Prazo Alterado", description: "Quando o prazo da tarefa é alterado", mandatory: true },
      { key: "forecastDate", label: "Data Prevista", description: "Quando a previsão de disponibilidade é alterada", mandatory: false },
      { key: "startedAt", label: "Início da Produção", description: "Quando a produção é iniciada", mandatory: false },
      { key: "deadline", label: "Prazo Próximo", description: "Quando uma tarefa está próxima do prazo", mandatory: true },
      // Assignment
      { key: "sector", label: "Setor Alterado", description: "Quando o setor responsável é alterado", mandatory: false },
      { key: "customer", label: "Cliente Alterado", description: "Quando o cliente da tarefa é alterado", mandatory: false },
      // Artwork
      { key: "artworks", label: "Atualização de Arte", description: "Quando arquivos de arte são adicionados/removidos", mandatory: false },
      // Negotiation
      { key: "negotiatingWith", label: "Negociação", description: "Quando o contato de negociação é alterado", mandatory: false },
      // Production
      { key: "paint", label: "Pintura Geral", description: "Quando a pintura geral é definida/alterada", mandatory: false },
      { key: "observation", label: "Observação", description: "Quando observações são adicionadas", mandatory: false },
      // Financial (ADMIN/FINANCIAL only)
      { key: "invoiceTo", label: "Faturar Para", description: "Quando o cliente de faturamento é alterado", mandatory: false },
      { key: "commission", label: "Comissão", description: "Quando o status de comissão é alterado", mandatory: false },
      { key: "budgets", label: "Orçamentos", description: "Quando orçamentos são adicionados/removidos", mandatory: false },
      { key: "invoices", label: "Notas Fiscais", description: "Quando notas fiscais são adicionadas/removidas", mandatory: true },
      { key: "receipts", label: "Comprovantes", description: "Quando comprovantes são adicionados/removidos", mandatory: false },
      { key: "reimbursements", label: "Reembolsos", description: "Quando documentos de reembolso são alterados", mandatory: false },
      { key: "invoiceReimbursements", label: "NF de Reembolso", description: "Quando NFs de reembolso são alteradas", mandatory: false },
    ],
  },
  {
    id: "order",
    title: "Pedidos",
    icon: "🛒",
    events: [
      { key: "created", label: "Novo Pedido", description: "Quando um novo pedido é criado", mandatory: false },
      { key: "status", label: "Mudança de Status", description: "Quando o status de um pedido é alterado", mandatory: false },
      { key: "fulfilled", label: "Pedido Finalizado", description: "Quando um pedido é finalizado/entregue", mandatory: false },
      { key: "cancelled", label: "Pedido Cancelado", description: "Quando um pedido é cancelado", mandatory: false },
      { key: "overdue", label: "Pedido Atrasado", description: "Quando um pedido está atrasado", mandatory: true },
    ],
  },
  {
    id: "service_order",
    title: "Ordens de Serviço",
    icon: "✅",
    events: [
      { key: "created", label: "Nova Ordem de Serviço", description: "Quando uma nova ordem de serviço é criada", mandatory: true },
      { key: "status.changed", label: "Mudança de Status", description: "Quando o status de uma ordem de serviço é alterado", mandatory: true },
    ],
  },
  {
    id: "stock",
    title: "Estoque",
    icon: "📦",
    events: [
      { key: "low", label: "Estoque Baixo", description: "Quando um item está abaixo do mínimo", mandatory: false },
      { key: "out", label: "Estoque Esgotado", description: "Quando um item fica sem estoque", mandatory: true },
      { key: "restock", label: "Reabastecimento", description: "Quando é necessário reabastecer", mandatory: false },
    ],
  },
  {
    id: "system",
    title: "Sistema",
    icon: "🛡️",
    events: [
      { key: "maintenance", label: "Manutenção", description: "Avisos de manutenção programada", mandatory: true },
      { key: "update", label: "Atualizações", description: "Novidades e atualizações do sistema", mandatory: false },
      { key: "security", label: "Segurança", description: "Alertas de segurança importantes", mandatory: true },
    ],
  },
  {
    id: "vacation",
    title: "Férias",
    icon: "📅",
    events: [
      { key: "requested", label: "Solicitação", description: "Quando férias são solicitadas", mandatory: false },
      { key: "approved", label: "Aprovação", description: "Quando férias são aprovadas", mandatory: true },
      { key: "rejected", label: "Rejeição", description: "Quando férias são rejeitadas", mandatory: true },
      { key: "reminder", label: "Lembrete", description: "Lembretes sobre férias próximas", mandatory: false },
    ],
  },
];

// =====================
// Default Preferences
// =====================

const createDefaultPreference = (mandatory: boolean): NotificationEventPreference => ({
  channels: mandatory ? ["IN_APP", "EMAIL"] : ["IN_APP"],
  mandatory,
});

const defaultPreferences: NotificationPreferences = {
  task: {
    // Lifecycle
    created: createDefaultPreference(false),
    status: createDefaultPreference(true),
    finishedAt: createDefaultPreference(false),
    overdue: createDefaultPreference(true),
    // Basic info
    name: createDefaultPreference(false),
    details: createDefaultPreference(false),
    serialNumber: createDefaultPreference(false),
    // Dates
    entryDate: createDefaultPreference(false),
    term: createDefaultPreference(true),
    forecastDate: createDefaultPreference(false),
    startedAt: createDefaultPreference(false),
    deadline: createDefaultPreference(true),
    // Assignment
    sector: createDefaultPreference(false),
    customer: createDefaultPreference(false),
    // Artwork
    artworks: createDefaultPreference(false),
    // Negotiation
    negotiatingWith: createDefaultPreference(false),
    // Production
    paint: createDefaultPreference(false),
    observation: createDefaultPreference(false),
    // Financial (ADMIN/FINANCIAL only)
    invoiceTo: createDefaultPreference(false),
    commission: createDefaultPreference(false),
    budgets: createDefaultPreference(false),
    invoices: createDefaultPreference(true),
    receipts: createDefaultPreference(false),
    reimbursements: createDefaultPreference(false),
    invoiceReimbursements: createDefaultPreference(false),
  },
  order: {
    created: createDefaultPreference(false),
    status: createDefaultPreference(false),
    fulfilled: createDefaultPreference(false),
    cancelled: createDefaultPreference(false),
    overdue: createDefaultPreference(true),
  },
  service_order: {
    created: createDefaultPreference(true),
    "status.changed": createDefaultPreference(true),
  },
  stock: {
    low: createDefaultPreference(false),
    out: createDefaultPreference(true),
    restock: createDefaultPreference(false),
  },
  system: {
    maintenance: createDefaultPreference(true),
    update: createDefaultPreference(false),
    security: createDefaultPreference(true),
  },
  vacation: {
    requested: createDefaultPreference(false),
    approved: createDefaultPreference(true),
    rejected: createDefaultPreference(true),
    reminder: createDefaultPreference(false),
  },
};

// =====================
// PreferenceRow Component
// =====================

interface PreferenceRowProps {
  label: string;
  description: string;
  selectedChannels: NotificationChannel[];
  onChange: (channels: NotificationChannel[]) => void;
  mandatory: boolean;
}

function PreferenceRow({
  label,
  description,
  selectedChannels,
  onChange,
  mandatory,
}: PreferenceRowProps) {
  const { colors } = useTheme();

  const handleChannelToggle = (channel: NotificationChannel) => {
    if (mandatory) {
      Alert.alert("Não é possível modificar", "Esta notificação é obrigatória e não pode ser desativada.");
      return;
    }

    const newChannels = selectedChannels.includes(channel)
      ? selectedChannels.filter((c) => c !== channel)
      : [...selectedChannels, channel];

    if (newChannels.length === 0) {
      Alert.alert("Seleção inválida", "Pelo menos um canal deve estar selecionado");
      return;
    }

    onChange(newChannels);
  };

  return (
    <View style={[styles.preferenceRow, { borderBottomColor: colors.border }]}>
      <View style={styles.preferenceInfo}>
        <View style={styles.labelRow}>
          <ThemedText style={styles.preferenceLabel}>{label}</ThemedText>
          {mandatory && (
            <View style={[styles.mandatoryBadge, { backgroundColor: colors.destructive }]}>
              <Text style={[styles.mandatoryText, { color: colors.destructiveForeground }]}>
                OBRIGATÓRIA
              </Text>
            </View>
          )}
        </View>
        <ThemedText style={[styles.preferenceDescription, { color: colors.mutedForeground }]}>
          {description}
        </ThemedText>
      </View>
      <View style={styles.channelsRow}>
        {ALL_CHANNELS.map((channel) => {
          const metadata = channelMetadata[channel];
          const isSelected = selectedChannels.includes(channel);

          return (
            <TouchableOpacity
              key={channel}
              onPress={() => handleChannelToggle(channel)}
              disabled={mandatory}
              style={[
                styles.channelButton,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? `${metadata.color}15` : colors.card,
                  opacity: mandatory ? 0.7 : 1,
                },
              ]}
            >
              <Text style={styles.channelIcon}>{metadata.icon}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// =====================
// Main Component
// =====================

export default function NotificationPreferencesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { expoPushToken, isRegistered, registerToken } = usePushNotifications();

  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Transform API preferences to local format
   */
  const transformPreferencesToLocal = (
    apiPreferences: UserNotificationPreference[]
  ): NotificationPreferences => {
    const local = { ...defaultPreferences };

    for (const pref of apiPreferences) {
      const section = pref.notificationType.toLowerCase() as keyof NotificationPreferences;
      const eventKey = pref.eventType || 'default';

      if (local[section] && eventKey in local[section]) {
        (local[section] as Record<string, NotificationEventPreference>)[eventKey] = {
          channels: pref.channels as NotificationChannel[],
          mandatory: pref.isMandatory,
        };
      }
    }

    return local;
  };

  /**
   * Transform local preferences to API format
   */
  const transformLocalToApi = (
    local: NotificationPreferences
  ): Array<{ type: string; eventType: string; channels: string[] }> => {
    const apiPrefs: Array<{ type: string; eventType: string; channels: string[] }> = [];

    for (const [sectionKey, section] of Object.entries(local)) {
      const type = sectionKey.toUpperCase(); // e.g., "task" -> "TASK"

      for (const [eventKey, eventData] of Object.entries(section as Record<string, NotificationEventPreference>)) {
        apiPrefs.push({
          type,
          eventType: eventKey,
          channels: eventData.channels,
        });
      }
    }

    return apiPrefs;
  };

  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const response = await notificationPreferenceService.getPreferences(user.id);

      if (response.data?.success && response.data?.data && response.data.data.length > 0) {
        const localPrefs = transformPreferencesToLocal(response.data.data);
        setPreferences(localPrefs);
        setOriginalPreferences(localPrefs);
      } else {
        // No preferences saved yet, use defaults
        setPreferences(defaultPreferences);
        setOriginalPreferences(defaultPreferences);
      }
    } catch (error: any) {
      console.error("Error loading preferences:", error);
      Alert.alert("Erro", "Falha ao carregar preferências de notificação");
      setPreferences(defaultPreferences);
      setOriginalPreferences(defaultPreferences);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPreferences();
    setIsRefreshing(false);
  }, [loadPreferences]);

  const handlePreferenceChange = (sectionKey: string, eventKey: string, channels: NotificationChannel[]) => {
    setPreferences((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey as keyof NotificationPreferences],
        [eventKey]: {
          ...prev[sectionKey as keyof NotificationPreferences][eventKey],
          channels,
        },
      },
    }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert("Erro", "Usuário não encontrado");
      return;
    }

    try {
      setIsSaving(true);

      const apiPrefs = transformLocalToApi(preferences);

      const response = await notificationPreferenceService.batchUpdatePreferences(user.id, {
        preferences: apiPrefs,
      });

      if (response.data?.success) {
        setOriginalPreferences(preferences);
        Alert.alert("Sucesso", `${response.data.data?.updated || 0} preferências salvas com sucesso!`);
      } else {
        Alert.alert("Erro", response.data?.message || "Erro ao salvar preferências");
      }
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      Alert.alert("Erro", "Falha ao salvar preferências de notificação");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Restaurar Padrão",
      "Tem certeza que deseja restaurar todas as preferências para os valores padrão?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: () => {
            setPreferences(defaultPreferences);
            Alert.alert("Sucesso", "Preferências restauradas para o padrão");
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setPreferences(originalPreferences);
    Alert.alert("Cancelado", "Alterações descartadas");
  };

  const handleTestPushRegistration = async () => {
    try {
      console.log('[DEBUG] Manual push token registration triggered');
      console.log('[DEBUG] Current token:', expoPushToken || 'None');
      console.log('[DEBUG] Is registered:', isRegistered);

      await registerToken();

      Alert.alert(
        "Registro de Push",
        `Status: ${isRegistered ? 'Registrado' : 'Não Registrado'}\n` +
        `Token: ${expoPushToken ? expoPushToken.substring(0, 30) + '...' : 'Nenhum'}\n\n` +
        `Verifique os logs do console para mais detalhes.`
      );
    } catch (error: any) {
      console.error('[DEBUG] Error during manual registration:', error);
      Alert.alert("Erro", `Falha ao registrar token de push: ${error.message}`);
    }
  };

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, styles.loadingContainer, { backgroundColor: colors.background }]}
        edges={[]}
      >
        <ThemedText>Carregando preferências...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Preferências de Notificação</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Escolha como deseja ser notificado
          </ThemedText>
        </View>

        {/* Channel Legend */}
        <View style={[styles.legend, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={[styles.legendLabel, { color: colors.mutedForeground }]}>Canais:</ThemedText>
          {ALL_CHANNELS.map((channel) => {
            const metadata = channelMetadata[channel];
            return (
              <View key={channel} style={styles.legendItem}>
                <Text style={styles.legendIcon}>{metadata.icon}</Text>
                <ThemedText style={styles.legendText}>{metadata.label}</ThemedText>
              </View>
            );
          })}
        </View>

        {/* Notification Sections */}
        <Accordion type="multiple" collapsible className="w-full">
          {notificationSections.map((section) => {
            const sectionKey = section.id as keyof NotificationPreferences;

            return (
              <Card
                key={section.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <AccordionItem value={section.id}>
                  <AccordionTrigger>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleRow}>
                        <Text style={styles.sectionIcon}>{section.icon}</Text>
                        <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
                      </View>
                      <ThemedText style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
                        {section.events.length} eventos
                      </ThemedText>
                    </View>
                  </AccordionTrigger>
                  <AccordionContent>
                    <View style={styles.sectionContent}>
                      {section.events.map((event) => {
                        const eventPref = preferences[sectionKey][event.key];

                        return (
                          <PreferenceRow
                            key={event.key}
                            label={event.label}
                            description={event.description}
                            selectedChannels={eventPref?.channels || []}
                            onChange={(channels) => handlePreferenceChange(sectionKey, event.key, channels)}
                            mandatory={event.mandatory}
                          />
                        );
                      })}
                    </View>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            );
          })}
        </Accordion>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
            style={styles.actionButton}
          >
            <ThemedText style={{ color: "#fff" }}>
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </ThemedText>
          </Button>

          {hasChanges && (
            <Button
              variant="outline"
              onPress={handleCancel}
              disabled={isSaving}
              style={styles.actionButton}
            >
              <ThemedText>Cancelar</ThemedText>
            </Button>
          )}

          <Button
            variant="outline"
            onPress={handleReset}
            disabled={isSaving}
            style={styles.actionButton}
          >
            <ThemedText>Restaurar Padrão</ThemedText>
          </Button>

          {/* Debug: Push Token Registration */}
          <Button
            variant="outline"
            onPress={handleTestPushRegistration}
            style={[styles.actionButton, { borderColor: '#3b82f6' }]}
          >
            <ThemedText style={{ color: '#3b82f6' }}>
              🔔 Debug: Testar Registro Push
            </ThemedText>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendIcon: {
    fontSize: 16,
  },
  legendText: {
    fontSize: 13,
  },
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flex: 1,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  sectionContent: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  preferenceRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  preferenceInfo: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  preferenceLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  mandatoryBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  mandatoryText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  preferenceDescription: {
    fontSize: 13,
  },
  channelsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  channelButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  channelIcon: {
    fontSize: 20,
  },
  actionButtons: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    width: "100%",
  },
});
