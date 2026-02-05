import { useState, useCallback } from "react";
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { extendedColors } from "@/lib/theme/extended-colors";

// Types
type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH" | "WHATSAPP";

const ALL_CHANNELS: NotificationChannel[] = ["IN_APP", "EMAIL", "PUSH", "WHATSAPP"];

interface NotificationEventPreference {
  channels: NotificationChannel[];
  mandatory: boolean;
}

// Channel metadata
const channelMetadata: Record<NotificationChannel, { icon: string; label: string; color: string }> = {
  IN_APP: { icon: "bell-dot", label: "In-App", color: extendedColors.orange[500] },
  EMAIL: { icon: "mail", label: "E-mail", color: extendedColors.purple[500] },
  PUSH: { icon: "device-mobile", label: "Push", color: extendedColors.blue[500] },
  WHATSAPP: { icon: "brand-whatsapp", label: "WhatsApp", color: extendedColors.green[500] },
};

// Notification events by section
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
    icon: "clipboard-list",
    events: [
      { key: "status", label: "Mudanca de Status", description: "Quando o status de uma tarefa e alterado", mandatory: true },
      { key: "assignment", label: "Atribuicao", description: "Quando uma tarefa e atribuida a voce", mandatory: true },
      { key: "deadline", label: "Prazo Proximo", description: "Quando uma tarefa esta proxima do prazo", mandatory: true },
      { key: "completion", label: "Conclusao", description: "Quando uma tarefa e concluida", mandatory: false },
      { key: "artwork", label: "Atualizacao de Arte", description: "Quando arquivos de arte sao modificados", mandatory: false },
      { key: "comment", label: "Comentarios", description: "Quando alguem comenta em uma tarefa", mandatory: false },
      { key: "priority", label: "Mudanca de Prioridade", description: "Quando a prioridade e alterada", mandatory: false },
    ],
  },
  {
    id: "order",
    title: "Pedidos",
    icon: "shopping-cart",
    events: [
      { key: "created", label: "Novo Pedido", description: "Quando um novo pedido e criado", mandatory: false },
      { key: "status", label: "Mudanca de Status", description: "Quando o status de um pedido e alterado", mandatory: false },
      { key: "fulfilled", label: "Pedido Finalizado", description: "Quando um pedido e finalizado/entregue", mandatory: false },
      { key: "cancelled", label: "Pedido Cancelado", description: "Quando um pedido e cancelado", mandatory: false },
      { key: "overdue", label: "Pedido Atrasado", description: "Quando um pedido esta atrasado", mandatory: true },
    ],
  },
  {
    id: "stock",
    title: "Estoque",
    icon: "package",
    events: [
      { key: "low", label: "Estoque Baixo", description: "Quando um item esta abaixo do minimo", mandatory: false },
      { key: "out", label: "Estoque Esgotado", description: "Quando um item fica sem estoque", mandatory: true },
      { key: "restock", label: "Reabastecimento", description: "Quando e necessario reabastecer", mandatory: false },
    ],
  },
  {
    id: "user",
    title: "Usuarios",
    icon: "users",
    events: [
      { key: "welcome", label: "Boas-vindas", description: "Quando uma conta e criada", mandatory: true },
      { key: "statusChange", label: "Status da Conta", description: "Quando o status da conta e alterado", mandatory: true },
      { key: "passwordReset", label: "Redefinicao de Senha", description: "Quando a senha e redefinida", mandatory: true },
      { key: "profileUpdate", label: "Perfil Atualizado", description: "Quando o perfil e modificado", mandatory: false },
    ],
  },
  {
    id: "system",
    title: "Sistema",
    icon: "shield",
    events: [
      { key: "maintenance", label: "Manutencao", description: "Avisos de manutencao programada", mandatory: true },
      { key: "update", label: "Atualizacoes", description: "Novidades e atualizacoes do sistema", mandatory: false },
      { key: "security", label: "Seguranca", description: "Alertas de seguranca importantes", mandatory: true },
    ],
  },
  {
    id: "vacation",
    title: "Ferias",
    icon: "calendar",
    events: [
      { key: "requested", label: "Solicitacao", description: "Quando ferias sao solicitadas", mandatory: false },
      { key: "approved", label: "Aprovacao", description: "Quando ferias sao aprovadas", mandatory: true },
      { key: "rejected", label: "Rejeicao", description: "Quando ferias sao rejeitadas", mandatory: true },
      { key: "reminder", label: "Lembrete", description: "Lembretes sobre ferias proximas", mandatory: false },
    ],
  },
];

// Create default preferences
const createDefaultPreference = (mandatory: boolean): NotificationEventPreference => ({
  channels: mandatory ? ["IN_APP", "EMAIL"] : ["IN_APP"],
  mandatory,
});

type PreferencesState = Record<string, Record<string, NotificationEventPreference>>;

const createDefaultPreferences = (): PreferencesState => {
  const preferences: PreferencesState = {};
  notificationSections.forEach(section => {
    preferences[section.id] = {};
    section.events.forEach(event => {
      preferences[section.id][event.key] = createDefaultPreference(event.mandatory);
    });
  });
  return preferences;
};

// Channel Toggle Button Component
function ChannelToggle({
  channel,
  isSelected,
  onToggle,
  disabled,
}: {
  channel: NotificationChannel;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const metadata = channelMetadata[channel];

  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      style={[
        styles.channelButton,
        {
          borderColor: isSelected ? colors.primary : colors.border,
          backgroundColor: isSelected
            ? isDark ? `${metadata.color}20` : `${metadata.color}15`
            : "transparent",
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Icon
        name={metadata.icon}
        size={16}
        color={isSelected ? metadata.color : colors.mutedForeground}
      />
    </Pressable>
  );
}

// Preference Row Component
function PreferenceRow({
  event,
  selectedChannels,
  onChange,
  colors,
  isDark,
}: {
  event: NotificationEvent;
  selectedChannels: NotificationChannel[];
  onChange: (channels: NotificationChannel[]) => void;
  colors: any;
  isDark: boolean;
}) {
  const handleChannelToggle = useCallback((channel: NotificationChannel) => {
    const newChannels = selectedChannels.includes(channel)
      ? selectedChannels.filter(c => c !== channel)
      : [...selectedChannels, channel];

    if (newChannels.length === 0) {
      Alert.alert("Aviso", "Pelo menos um canal deve estar selecionado");
      return;
    }

    onChange(newChannels);
  }, [selectedChannels, onChange]);

  return (
    <View style={[styles.preferenceRow, { borderBottomColor: colors.border }]}>
      <View style={styles.preferenceInfo}>
        <View style={styles.preferenceHeader}>
          <Text variant="small" style={[styles.preferenceLabel, { color: colors.foreground }]}>
            {event.label}
          </Text>
          {event.mandatory && (
            <Icon name="info-circle" size={14} color={colors.mutedForeground} />
          )}
        </View>
        <Text variant="xs" style={{ color: colors.mutedForeground }}>
          {event.description}
        </Text>
      </View>
      <View style={styles.channelButtons}>
        {ALL_CHANNELS.map(channel => (
          <ChannelToggle
            key={channel}
            channel={channel}
            isSelected={selectedChannels.includes(channel)}
            onToggle={() => handleChannelToggle(channel)}
          />
        ))}
      </View>
    </View>
  );
}

export default function NotificationPreferencesScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [preferences, setPreferences] = useState<PreferencesState>(createDefaultPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // TODO: Implement API call to load preferences
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
      setPreferences(createDefaultPreferences());
      setHasChanges(false);
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar preferências");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Handle preference change
  const handlePreferenceChange = useCallback((sectionId: string, eventKey: string, channels: NotificationChannel[]) => {
    setPreferences(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [eventKey]: { ...prev[sectionId][eventKey], channels },
      },
    }));
    setHasChanges(true);
  }, []);

  // Save preferences
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // TODO: Implement API call to save preferences
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
      Alert.alert("Sucesso", "Preferências salvas com sucesso!");
      setHasChanges(false);
    } catch (error) {
      Alert.alert("Erro", "Erro ao salvar preferências");
    } finally {
      setIsSaving(false);
    }
  }, [preferences]);

  // Reset preferences
  const handleReset = useCallback(() => {
    setPreferences(createDefaultPreferences());
    setHasChanges(true);
    Alert.alert("Sucesso", "Preferências restauradas para o padrão");
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
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
        {/* Channel Legend */}
        <View style={[styles.legendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text variant="small" style={{ color: colors.mutedForeground, marginRight: 12 }}>
            Canais:
          </Text>
          <View style={styles.legendChannels}>
            {ALL_CHANNELS.map(channel => {
              const metadata = channelMetadata[channel];
              return (
                <View key={channel} style={styles.legendItem}>
                  <Icon name={metadata.icon} size={16} color={metadata.color} />
                  <Text variant="small" style={{ color: colors.foreground, marginLeft: 4 }}>
                    {metadata.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Accordion Sections */}
        <Accordion type="multiple" className="gap-2">
          {notificationSections.map(section => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="rounded-lg px-4 mb-2"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
            >
              <AccordionTrigger className="py-4">
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: `${colors.primary}15` }]}>
                    <Icon name={section.icon} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.sectionInfo}>
                    <Text variant="p" style={[styles.sectionTitle, { color: colors.foreground }]}>
                      {section.title}
                    </Text>
                    <Text variant="xs" style={{ color: colors.mutedForeground }}>
                      {section.events.length} eventos
                    </Text>
                  </View>
                </View>
              </AccordionTrigger>
              <AccordionContent>
                {section.events.map(event => (
                  <PreferenceRow
                    key={event.key}
                    event={event}
                    selectedChannels={preferences[section.id]?.[event.key]?.channels || []}
                    onChange={(channels) => handlePreferenceChange(section.id, event.key, channels)}
                    colors={colors}
                    isDark={isDark}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollView>

      {/* Fixed Footer */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
        <Button
          variant="outline"
          onPress={handleReset}
          disabled={isSaving}
          style={styles.footerButton}
        >
          <Icon name="rotate-clockwise" size={16} color={colors.foreground} />
          <Text variant="small" style={{ color: colors.foreground, marginLeft: 8 }}>
            Restaurar
          </Text>
        </Button>
        <Button
          variant="default"
          onPress={handleSave}
          disabled={isSaving || !hasChanges}
          style={StyleSheet.flatten([styles.footerButton, styles.saveButton])}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Icon name="device-floppy" size={16} color="#ffffff" />
              <Text variant="small" style={{ color: "#ffffff", marginLeft: 8 }}>
                Salvar
              </Text>
            </>
          )}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  legendCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  legendChannels: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionInfo: {
    marginLeft: 12,
  },
  sectionTitle: {
    fontWeight: "600",
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 12,
  },
  preferenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  preferenceLabel: {
    fontWeight: "500",
  },
  channelButtons: {
    flexDirection: "row",
    gap: 6,
  },
  channelButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flex: 2,
  },
});
