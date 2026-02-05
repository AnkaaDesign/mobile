import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { IconCheck, IconX, IconRotate } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { formSpacing, formLayout } from "@/constants/form-styles";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text as ButtonText } from "@/components/ui/text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  notificationUserPreferenceService,
  type UserPreferenceConfig,
  type GroupedConfigurationsResponse,
  type ChannelPreferenceDetail,
} from "@/api-client";
import { NOTIFICATION_CHANNEL } from "@/constants";
import { useAuth } from "@/contexts/auth-context";

// =====================
// Types and Constants
// =====================

type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH" | "WHATSAPP";

const ALL_CHANNELS: NotificationChannel[] = ["IN_APP", "EMAIL", "PUSH", "WHATSAPP"];

// =====================
// Channel Metadata
// =====================

const channelMetadata: Record<NotificationChannel, { label: string; icon: string; color: string }> = {
  IN_APP: { label: "In-App", icon: "bell", color: "#f97316" },
  EMAIL: { label: "E-mail", icon: "mail", color: "#a855f7" },
  PUSH: { label: "Push", icon: "device-mobile", color: "#3b82f6" },
  WHATSAPP: { label: "WhatsApp", icon: "brand-whatsapp", color: "#22c55e" },
};

// =====================
// Type Labels
// =====================

const TYPE_LABELS: Record<string, { title: string; icon: string }> = {
  TASK: { title: "Tarefas", icon: "clipboard-list" },
  ORDER: { title: "Pedidos", icon: "shopping-cart" },
  SERVICE_ORDER: { title: "Ordens de Serviço", icon: "clipboard-check" },
  STOCK: { title: "Estoque", icon: "package" },
  CUT: { title: "Recortes", icon: "scissors" },
  PPE: { title: "Entrega de EPI", icon: "shield" },
  SYSTEM: { title: "Sistema", icon: "settings" },
  VACATION: { title: "Férias", icon: "calendar" },
  GENERAL: { title: "Geral", icon: "bell" },
  WARNING: { title: "Advertências", icon: "alert-triangle" },
};

// =====================
// Importance Labels
// =====================

const IMPORTANCE_LABELS: Record<string, { label: string; color: string }> = {
  LOW: { label: "Baixa", color: "#9CA3AF" },
  NORMAL: { label: "Normal", color: "#3B82F6" },
  HIGH: { label: "Alta", color: "#F59E0B" },
  URGENT: { label: "Urgente", color: "#EF4444" },
};

// =====================
// User Preference State
// =====================

interface UserPreferenceState {
  configKey: string;
  enabledChannels: NotificationChannel[];
  mandatoryChannels: NotificationChannel[];
  availableChannels: NotificationChannel[];
}

// =====================
// PreferenceRow Component
// =====================

interface PreferenceRowProps {
  config: UserPreferenceConfig;
  userChannels: NotificationChannel[];
  onChange: (configKey: string, channels: NotificationChannel[]) => void;
  isSaving: boolean;
}

function PreferenceRow({ config, userChannels, onChange, isSaving }: PreferenceRowProps) {
  const { colors, isDark } = useTheme();

  const mandatoryChannels = config.channels
    .filter((ch) => ch.mandatory && ch.enabled)
    .map((ch) => ch.channel as NotificationChannel);

  const availableChannels = config.channels
    .filter((ch) => ch.enabled)
    .map((ch) => ch.channel as NotificationChannel);

  const handleChannelToggle = (channel: NotificationChannel) => {
    if (isSaving) return;

    const isMandatory = mandatoryChannels.includes(channel);
    const isSelected = userChannels.includes(channel);
    const isAvailable = availableChannels.includes(channel);

    if (!isAvailable) {
      Alert.alert("Canal Indisponível", "Este canal não está disponível para este tipo de notificação.");
      return;
    }

    if (isMandatory && isSelected) {
      Alert.alert(
        "Canal Obrigatório",
        `O canal ${channelMetadata[channel].label} é obrigatório para este tipo de notificação e não pode ser desativado.`
      );
      return;
    }

    const newChannels = isSelected
      ? userChannels.filter((c) => c !== channel)
      : [...userChannels, channel];

    // Ensure at least one channel is selected
    if (newChannels.length === 0) {
      Alert.alert("Aviso", "Pelo menos um canal deve estar selecionado");
      return;
    }

    onChange(config.configKey, newChannels);
  };

  const importanceConfig = IMPORTANCE_LABELS[config.importance] || IMPORTANCE_LABELS.NORMAL;

  return (
    <View style={[styles.preferenceRow, { borderBottomColor: colors.border }]}>
      <View style={styles.preferenceInfo}>
        <View style={styles.labelRow}>
          <ThemedText style={styles.preferenceLabel}>{config.configKey}</ThemedText>
          {mandatoryChannels.length > 0 && (
            <View style={[styles.mandatoryBadge, { backgroundColor: isDark ? "#7c3aed20" : "#7c3aed15" }]}>
              <Icon name="lock" size={10} color="#7c3aed" />
              <Text style={styles.mandatoryText}>{mandatoryChannels.length}</Text>
            </View>
          )}
        </View>
        <ThemedText style={[styles.preferenceDescription, { color: colors.mutedForeground }]}>
          {config.description || "Sem descrição"}
        </ThemedText>
        <View style={styles.importanceBadge}>
          <View style={[styles.importanceDot, { backgroundColor: importanceConfig.color }]} />
          <Text style={[styles.importanceText, { color: colors.mutedForeground }]}>
            {importanceConfig.label}
          </Text>
        </View>
      </View>
      <View style={styles.channelsRow}>
        {ALL_CHANNELS.map((channel) => {
          const metadata = channelMetadata[channel];
          const isSelected = userChannels.includes(channel);
          const isMandatory = mandatoryChannels.includes(channel);
          const isAvailable = availableChannels.includes(channel);

          return (
            <TouchableOpacity
              key={channel}
              onPress={() => handleChannelToggle(channel)}
              activeOpacity={0.7}
              disabled={isSaving || !isAvailable}
              style={[
                styles.channelButton,
                {
                  borderColor: isSelected ? metadata.color : colors.border,
                  backgroundColor: isSelected ? `${metadata.color}15` : "transparent",
                  opacity: isAvailable ? 1 : 0.3,
                },
              ]}
            >
              <Icon
                name={metadata.icon}
                size={18}
                color={isSelected && isAvailable ? metadata.color : colors.mutedForeground}
              />
              {isMandatory && isSelected && (
                <View style={[styles.mandatoryDot, { backgroundColor: "#7c3aed" }]} />
              )}
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
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // State
  const [configurations, setConfigurations] = useState<GroupedConfigurationsResponse | null>(null);
  const [preferences, setPreferences] = useState<Record<string, NotificationChannel[]>>({});
  const [originalPreferences, setOriginalPreferences] = useState<Record<string, NotificationChannel[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

  // =====================
  // Load Configurations
  // =====================

  const loadConfigurations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await notificationUserPreferenceService.getAvailableConfigurations();

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        setConfigurations(data);

        // Extract user preferences from the configuration data
        const userPrefs: Record<string, NotificationChannel[]> = {};
        for (const [type, configs] of Object.entries(data)) {
          for (const config of configs) {
            // Get channels where userEnabled is true
            const enabledChannels = config.channels
              .filter((ch) => ch.userEnabled)
              .map((ch) => ch.channel as NotificationChannel);
            userPrefs[config.configKey] = enabledChannels;
          }
        }

        setPreferences(userPrefs);
        setOriginalPreferences(JSON.parse(JSON.stringify(userPrefs)));
      } else {
        setConfigurations(null);
        setPreferences({});
        setOriginalPreferences({});
      }
    } catch (error: any) {
      console.error("[NotificationPreferences] Error loading:", error);
      Alert.alert("Erro", "Falha ao carregar preferências de notificação");
      setConfigurations(null);
      setPreferences({});
      setOriginalPreferences({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigurations();
  }, [loadConfigurations]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadConfigurations();
    setIsRefreshing(false);
  }, [loadConfigurations]);

  // =====================
  // Handle Preference Change
  // =====================

  const handlePreferenceChange = useCallback(
    async (configKey: string, channels: NotificationChannel[]) => {
      // Optimistic update
      setPreferences((prev) => ({
        ...prev,
        [configKey]: channels,
      }));

      // Track saving state for this key
      setSavingKeys((prev) => new Set(prev).add(configKey));

      try {
        const response = await notificationUserPreferenceService.updatePreference(configKey, {
          channels: channels as NOTIFICATION_CHANNEL[],
        });

        if (!response.data?.success) {
          // Rollback on failure
          setPreferences((prev) => ({
            ...prev,
            [configKey]: originalPreferences[configKey] || [],
          }));
          Alert.alert("Erro", response.data?.message || "Erro ao salvar preferência");
        } else {
          // Update original preferences on success
          setOriginalPreferences((prev) => ({
            ...prev,
            [configKey]: channels,
          }));
        }
      } catch (error: any) {
        console.error("[NotificationPreferences] Error saving:", error);
        // Rollback on error
        setPreferences((prev) => ({
          ...prev,
          [configKey]: originalPreferences[configKey] || [],
        }));
        Alert.alert("Erro", "Falha ao salvar preferência");
      } finally {
        setSavingKeys((prev) => {
          const newSet = new Set(prev);
          newSet.delete(configKey);
          return newSet;
        });
      }
    },
    [originalPreferences]
  );

  // =====================
  // Handle Reset
  // =====================

  const handleResetPreference = useCallback(
    async (configKey: string) => {
      Alert.alert(
        "Restaurar Padrão",
        `Deseja restaurar as preferências de "${configKey}" para os valores padrão?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Restaurar",
            style: "destructive",
            onPress: async () => {
              setSavingKeys((prev) => new Set(prev).add(configKey));
              try {
                const response = await notificationUserPreferenceService.resetPreference(configKey);
                if (response.data?.success) {
                  // Reload configurations to get updated defaults
                  await loadConfigurations();
                } else {
                  Alert.alert("Erro", response.data?.message || "Erro ao restaurar preferência");
                }
              } catch (error: any) {
                console.error("[NotificationPreferences] Error resetting:", error);
                Alert.alert("Erro", "Falha ao restaurar preferência");
              } finally {
                setSavingKeys((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(configKey);
                  return newSet;
                });
              }
            },
          },
        ]
      );
    },
    [loadConfigurations]
  );

  // =====================
  // Computed Values
  // =====================

  const hasChanges = useMemo(() => {
    return JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
  }, [preferences, originalPreferences]);

  const groupedSections = useMemo(() => {
    if (!configurations) return [];

    return Object.entries(configurations)
      .filter(([_, configs]) => configs.length > 0)
      .map(([type, configs]) => ({
        type,
        title: TYPE_LABELS[type]?.title || type,
        icon: TYPE_LABELS[type]?.icon || "bell",
        configs,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [configurations]);

  // =====================
  // Render
  // =====================

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Preferências de Notificações" }} />
        <SafeAreaView
          style={[styles.safeArea, styles.loadingContainer, { backgroundColor: colors.background }]}
          edges={[]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: spacing.md }}>Carregando configurações...</ThemedText>
        </SafeAreaView>
      </>
    );
  }

  if (!configurations || groupedSections.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: "Preferências de Notificações" }} />
        <SafeAreaView
          style={[styles.safeArea, styles.loadingContainer, { backgroundColor: colors.background }]}
          edges={[]}
        >
          <Icon name="bell-off" size={48} color={colors.mutedForeground} />
          <ThemedText style={{ marginTop: spacing.md, color: colors.mutedForeground }}>
            Nenhuma configuração de notificação disponível
          </ThemedText>
          <Button variant="outline" onPress={loadConfigurations} style={{ marginTop: spacing.md }}>
            <Icon name="refresh" size={16} color={colors.mutedForeground} />
            <ButtonText>Tentar novamente</ButtonText>
          </Button>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Preferências de Notificações" }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xl * 2 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>Preferências de Notificação</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Escolha como deseja ser notificado para cada tipo de evento
            </ThemedText>
          </View>

          {/* Channel Legend */}
          <View style={[styles.legend, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={[styles.legendLabel, { color: colors.mutedForeground }]}>
              Canais:
            </ThemedText>
            <View style={styles.legendChannels}>
              {ALL_CHANNELS.map((channel) => {
                const metadata = channelMetadata[channel];
                return (
                  <View key={channel} style={styles.legendItem}>
                    <Icon name={metadata.icon} size={16} color={metadata.color} />
                    <ThemedText style={styles.legendText}>{metadata.label}</ThemedText>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Notification Sections */}
          <Accordion type="multiple" collapsible className="w-full">
            {groupedSections.map((section) => (
              <Card
                key={section.type}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <AccordionItem value={section.type}>
                  <AccordionTrigger>
                    <View style={styles.sectionHeader}>
                      <View
                        style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary}15` }]}
                      >
                        <Icon name={section.icon} size={18} color={colors.primary} />
                      </View>
                      <View style={styles.sectionInfo}>
                        <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
                        <ThemedText style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                          {section.configs.length} eventos
                        </ThemedText>
                      </View>
                    </View>
                  </AccordionTrigger>
                  <AccordionContent>
                    <View style={styles.sectionContent}>
                      {section.configs.map((config) => (
                        <PreferenceRow
                          key={config.configKey}
                          config={config}
                          userChannels={preferences[config.configKey] || []}
                          onChange={handlePreferenceChange}
                          isSaving={savingKeys.has(config.configKey)}
                        />
                      ))}
                    </View>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            ))}
          </Accordion>

          {/* Info Card */}
          <Card style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoContent}>
              <Icon name="info-circle" size={20} color={colors.primary} />
              <View style={styles.infoText}>
                <ThemedText style={[styles.infoTitle, { color: colors.foreground }]}>
                  Alterações são salvas automaticamente
                </ThemedText>
                <ThemedText style={[styles.infoDescription, { color: colors.mutedForeground }]}>
                  Suas preferências são atualizadas imediatamente ao alternar os canais.
                </ThemedText>
              </View>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
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
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
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
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  legendChannels: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionCount: {
    fontSize: 12,
  },
  sectionContent: {
    marginTop: spacing.sm,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: 2,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  mandatoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mandatoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#7c3aed",
  },
  preferenceDescription: {
    fontSize: 12,
  },
  importanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  importanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  importanceText: {
    fontSize: 11,
  },
  channelsRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  channelButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  mandatoryDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 12,
  },
});
