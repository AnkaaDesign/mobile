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
import { notificationPreferenceService } from "@/api-client";
import type { UserNotificationPreference } from "@/types";
import { useAuth } from "@/contexts/auth-context";

// =====================
// Types and Constants
// =====================

type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH" | "WHATSAPP";

type SectorPrivilege =
  | "BASIC"
  | "PRODUCTION"
  | "MAINTENANCE"
  | "WAREHOUSE"
  | "PLOTTING"
  | "ADMIN"
  | "HUMAN_RESOURCES"
  | "EXTERNAL"
  | "DESIGNER"
  | "FINANCIAL"
  | "LOGISTIC"
  | "COMMERCIAL";

const ALL_CHANNELS: NotificationChannel[] = ["IN_APP", "EMAIL", "PUSH", "WHATSAPP"];

interface NotificationEventPreference {
  channels: NotificationChannel[];
  mandatoryChannels: NotificationChannel[];
}

interface NotificationPreferences {
  task: Record<string, NotificationEventPreference>;
  order: Record<string, NotificationEventPreference>;
  service_order: Record<string, NotificationEventPreference>;
  stock: Record<string, NotificationEventPreference>;
  cut: Record<string, NotificationEventPreference>;
  ppe: Record<string, NotificationEventPreference>;
  system: Record<string, NotificationEventPreference>;
  vacation: Record<string, NotificationEventPreference>;
}

// =====================
// Sector-based Access Control
// =====================

const CATEGORY_ALLOWED_SECTORS: Record<string, SectorPrivilege[]> = {
  task: [], // ALL sectors
  order: ["ADMIN", "WAREHOUSE"],
  service_order: ["ADMIN", "DESIGNER", "PRODUCTION", "FINANCIAL", "LOGISTIC", "COMMERCIAL"],
  stock: ["ADMIN", "WAREHOUSE"],
  cut: ["ADMIN", "PLOTTING", "PRODUCTION"],
  ppe: ["ADMIN", "HUMAN_RESOURCES", "WAREHOUSE"],
  system: [], // ALL sectors
  vacation: ["ADMIN", "HUMAN_RESOURCES"],
};

const TASK_EVENT_ALLOWED_SECTORS: Record<string, SectorPrivilege[]> = {
  created: ["ADMIN", "FINANCIAL", "COMMERCIAL", "DESIGNER", "LOGISTIC"],
  status: [],
  finishedAt: ["ADMIN", "PRODUCTION", "FINANCIAL", "LOGISTIC"],
  overdue: ["ADMIN", "PRODUCTION", "FINANCIAL"],
  term: ["ADMIN", "PRODUCTION", "FINANCIAL", "LOGISTIC"],
  deadline: ["ADMIN", "PRODUCTION", "LOGISTIC", "COMMERCIAL"],
  forecastDate: ["ADMIN", "FINANCIAL", "LOGISTIC"],
  details: [],
  serialNumber: [],
  sector: ["ADMIN", "PRODUCTION", "FINANCIAL", "LOGISTIC"],
  artworks: ["ADMIN", "PRODUCTION", "DESIGNER", "COMMERCIAL"],
  negotiatingWith: ["ADMIN", "PRODUCTION", "FINANCIAL", "LOGISTIC"],
  paint: ["ADMIN", "PRODUCTION", "WAREHOUSE"],
  logoPaints: ["ADMIN", "PRODUCTION", "WAREHOUSE"],
  observation: ["ADMIN", "PRODUCTION", "COMMERCIAL"],
  commission: ["ADMIN", "FINANCIAL", "PRODUCTION", "WAREHOUSE"],
};

const SERVICE_ORDER_EVENT_ALLOWED_SECTORS: Record<string, SectorPrivilege[]> = {
  created: ["ADMIN"],
  assigned: [],
  "assigned.updated": [],
  "my.updated": [],
  "my.completed": [],
};

function canAccessCategory(categoryId: string, userPrivilege: SectorPrivilege | null): boolean {
  if (!userPrivilege) return false;
  if (userPrivilege === "ADMIN") return true;

  const allowedSectors = CATEGORY_ALLOWED_SECTORS[categoryId];
  if (!allowedSectors || allowedSectors.length === 0) return true;

  return allowedSectors.includes(userPrivilege);
}

function canAccessTaskEvent(eventKey: string, userPrivilege: SectorPrivilege | null): boolean {
  if (!userPrivilege) return false;
  if (userPrivilege === "ADMIN") return true;

  const allowedSectors = TASK_EVENT_ALLOWED_SECTORS[eventKey];
  if (!allowedSectors || allowedSectors.length === 0) return true;

  return allowedSectors.includes(userPrivilege);
}

function canAccessServiceOrderEvent(eventKey: string, userPrivilege: SectorPrivilege | null): boolean {
  if (!userPrivilege) return false;
  if (userPrivilege === "ADMIN") return true;

  const allowedSectors = SERVICE_ORDER_EVENT_ALLOWED_SECTORS[eventKey];
  if (!allowedSectors || allowedSectors.length === 0) return true;

  return allowedSectors.includes(userPrivilege);
}

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
// Section Data (Complete - 42 events across 8 categories)
// =====================

interface NotificationEvent {
  key: string;
  label: string;
  description: string;
  mandatoryChannels: NotificationChannel[];
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
      { key: "created", label: "Nova Tarefa", description: "Quando uma nova tarefa é criada", mandatoryChannels: ["IN_APP", "PUSH", "WHATSAPP"] },
      { key: "status", label: "Mudança de Status", description: "Quando o status de uma tarefa é alterado", mandatoryChannels: ["IN_APP", "PUSH"] },
      { key: "finishedAt", label: "Conclusão", description: "Quando uma tarefa é concluída", mandatoryChannels: ["IN_APP", "PUSH"] },
      { key: "overdue", label: "Tarefa Atrasada", description: "Quando uma tarefa está atrasada", mandatoryChannels: ["IN_APP", "PUSH", "WHATSAPP"] },
      { key: "term", label: "Prazo Alterado", description: "Quando o prazo da tarefa é alterado", mandatoryChannels: ["IN_APP", "PUSH", "WHATSAPP"] },
      { key: "deadline", label: "Prazo Próximo", description: "Quando uma tarefa está próxima do prazo", mandatoryChannels: ["IN_APP", "PUSH", "WHATSAPP"] },
      { key: "forecastDate", label: "Data Prevista", description: "Quando a previsão de disponibilidade é alterada", mandatoryChannels: [] },
      { key: "details", label: "Detalhes Alterados", description: "Quando os detalhes da tarefa são modificados", mandatoryChannels: [] },
      { key: "serialNumber", label: "Número de Série", description: "Quando o número de série é alterado", mandatoryChannels: [] },
      { key: "sector", label: "Setor Alterado", description: "Quando o setor responsável é alterado", mandatoryChannels: ["IN_APP", "PUSH"] },
      { key: "artworks", label: "Atualização de Arte", description: "Quando arquivos de arte são adicionados/removidos", mandatoryChannels: ["IN_APP", "PUSH"] },
      { key: "negotiatingWith", label: "Negociação", description: "Quando o contato de negociação é alterado", mandatoryChannels: [] },
      { key: "paint", label: "Pintura Geral", description: "Quando a pintura geral é definida ou alterada", mandatoryChannels: [] },
      { key: "logoPaints", label: "Pinturas do Logotipo", description: "Quando as cores do logotipo são alteradas", mandatoryChannels: [] },
      { key: "observation", label: "Observação", description: "Quando observações são adicionadas", mandatoryChannels: [] },
      { key: "commission", label: "Comissão", description: "Quando o status de comissão é alterado", mandatoryChannels: [] },
    ],
  },
  {
    id: "order",
    title: "Pedidos",
    icon: "shopping-cart",
    events: [
      { key: "created", label: "Novo Pedido", description: "Quando um novo pedido é criado", mandatoryChannels: [] },
      { key: "status", label: "Mudança de Status", description: "Quando o status de um pedido é alterado", mandatoryChannels: [] },
      { key: "fulfilled", label: "Pedido Finalizado", description: "Quando um pedido é finalizado/entregue", mandatoryChannels: [] },
      { key: "cancelled", label: "Pedido Cancelado", description: "Quando um pedido é cancelado", mandatoryChannels: [] },
      { key: "overdue", label: "Pedido Atrasado", description: "Quando um pedido está atrasado", mandatoryChannels: [] },
    ],
  },
  {
    id: "service_order",
    title: "Ordens de Serviço",
    icon: "clipboard-check",
    events: [
      { key: "created", label: "Nova Ordem de Serviço", description: "Quando uma nova ordem de serviço é criada", mandatoryChannels: ["IN_APP", "PUSH"] },
      { key: "assigned", label: "Atribuída a Mim", description: "Quando uma ordem de serviço é atribuída a você", mandatoryChannels: ["IN_APP", "PUSH", "WHATSAPP"] },
      { key: "assigned.updated", label: "Atribuída a Mim Atualizada", description: "Quando uma OS atribuída a você é atualizada", mandatoryChannels: ["IN_APP", "PUSH"] },
      { key: "my.updated", label: "Que Criei Atualizada", description: "Quando uma OS que você criou é atualizada", mandatoryChannels: ["IN_APP", "PUSH"] },
      { key: "my.completed", label: "Que Criei Concluída", description: "Quando uma OS que você criou é concluída", mandatoryChannels: ["IN_APP", "PUSH", "WHATSAPP"] },
    ],
  },
  {
    id: "stock",
    title: "Estoque",
    icon: "package",
    events: [
      { key: "low", label: "Estoque Baixo", description: "Quando um item está abaixo do mínimo", mandatoryChannels: [] },
      { key: "out", label: "Estoque Esgotado", description: "Quando um item fica sem estoque", mandatoryChannels: [] },
      { key: "restock", label: "Reabastecimento", description: "Quando é necessário reabastecer", mandatoryChannels: [] },
    ],
  },
  {
    id: "cut",
    title: "Recortes",
    icon: "scissors",
    events: [
      { key: "created", label: "Novo Recorte", description: "Quando um novo recorte é adicionado à tarefa", mandatoryChannels: ["IN_APP"] },
      { key: "started", label: "Recorte Iniciado", description: "Quando o corte de um recorte é iniciado", mandatoryChannels: ["IN_APP"] },
      { key: "completed", label: "Recorte Concluído", description: "Quando o corte de um recorte é finalizado", mandatoryChannels: ["IN_APP"] },
      { key: "request", label: "Solicitação de Recorte", description: "Quando é solicitado um novo recorte (retrabalho)", mandatoryChannels: ["IN_APP", "PUSH"] },
    ],
  },
  {
    id: "ppe",
    title: "Entrega de EPI",
    icon: "shield",
    events: [
      { key: "requested", label: "Nova Solicitação", description: "Quando um EPI é solicitado", mandatoryChannels: ["IN_APP", "PUSH"] },
      { key: "approved", label: "Solicitação Aprovada", description: "Quando sua solicitação de EPI é aprovada", mandatoryChannels: ["IN_APP", "PUSH"] },
      { key: "rejected", label: "Solicitação Reprovada", description: "Quando sua solicitação de EPI é reprovada", mandatoryChannels: ["IN_APP", "PUSH"] },
      { key: "delivered", label: "EPI Entregue", description: "Quando o EPI é entregue a você", mandatoryChannels: ["IN_APP", "PUSH"] },
    ],
  },
  {
    id: "system",
    title: "Sistema",
    icon: "settings",
    events: [
      { key: "maintenance", label: "Manutenção", description: "Avisos de manutenção programada", mandatoryChannels: [] },
      { key: "update", label: "Atualizações", description: "Novidades e atualizações do sistema", mandatoryChannels: [] },
      { key: "security", label: "Segurança", description: "Alertas de segurança importantes", mandatoryChannels: [] },
    ],
  },
  {
    id: "vacation",
    title: "Férias",
    icon: "calendar",
    events: [
      { key: "requested", label: "Solicitação", description: "Quando férias são solicitadas", mandatoryChannels: [] },
      { key: "approved", label: "Aprovação", description: "Quando férias são aprovadas", mandatoryChannels: [] },
      { key: "rejected", label: "Rejeição", description: "Quando férias são rejeitadas", mandatoryChannels: [] },
      { key: "reminder", label: "Lembrete", description: "Lembretes sobre férias próximas", mandatoryChannels: [] },
    ],
  },
];

// =====================
// Default Preferences
// =====================

const createDefaultPreference = (
  channels: NotificationChannel[],
  mandatoryChannels: NotificationChannel[] = []
): NotificationEventPreference => ({
  channels,
  mandatoryChannels,
});

const defaultPreferences: NotificationPreferences = {
  task: {
    created: createDefaultPreference(["IN_APP", "PUSH", "WHATSAPP", "EMAIL"], ["IN_APP", "PUSH", "WHATSAPP"]),
    status: createDefaultPreference(["IN_APP", "PUSH", "EMAIL"], ["IN_APP", "PUSH"]),
    finishedAt: createDefaultPreference(["IN_APP", "PUSH", "EMAIL"], ["IN_APP", "PUSH"]),
    overdue: createDefaultPreference(["IN_APP", "PUSH", "WHATSAPP", "EMAIL"], ["IN_APP", "PUSH", "WHATSAPP"]),
    term: createDefaultPreference(["IN_APP", "PUSH", "WHATSAPP", "EMAIL"], ["IN_APP", "PUSH", "WHATSAPP"]),
    deadline: createDefaultPreference(["IN_APP", "PUSH", "WHATSAPP", "EMAIL"], ["IN_APP", "PUSH", "WHATSAPP"]),
    forecastDate: createDefaultPreference(["IN_APP", "EMAIL"], []),
    details: createDefaultPreference(["IN_APP", "EMAIL"], []),
    serialNumber: createDefaultPreference(["IN_APP", "EMAIL"], []),
    sector: createDefaultPreference(["IN_APP", "PUSH", "EMAIL"], ["IN_APP", "PUSH"]),
    artworks: createDefaultPreference(["IN_APP", "PUSH", "EMAIL"], ["IN_APP", "PUSH"]),
    negotiatingWith: createDefaultPreference(["IN_APP", "EMAIL"], []),
    paint: createDefaultPreference(["IN_APP", "EMAIL"], []),
    logoPaints: createDefaultPreference(["IN_APP", "EMAIL"], []),
    observation: createDefaultPreference(["IN_APP", "EMAIL"], []),
    commission: createDefaultPreference(["IN_APP", "EMAIL"], []),
  },
  order: {
    created: createDefaultPreference(["IN_APP"], []),
    status: createDefaultPreference(["IN_APP", "EMAIL"], []),
    fulfilled: createDefaultPreference(["IN_APP", "EMAIL"], []),
    cancelled: createDefaultPreference(["IN_APP", "EMAIL"], []),
    overdue: createDefaultPreference(["IN_APP", "EMAIL", "PUSH"], []),
  },
  service_order: {
    created: createDefaultPreference(["IN_APP", "PUSH"], ["IN_APP", "PUSH"]),
    assigned: createDefaultPreference(["IN_APP", "PUSH", "WHATSAPP", "EMAIL"], ["IN_APP", "PUSH", "WHATSAPP"]),
    "assigned.updated": createDefaultPreference(["IN_APP", "PUSH", "EMAIL"], ["IN_APP", "PUSH"]),
    "my.updated": createDefaultPreference(["IN_APP", "PUSH", "EMAIL"], ["IN_APP", "PUSH"]),
    "my.completed": createDefaultPreference(["IN_APP", "PUSH", "WHATSAPP", "EMAIL"], ["IN_APP", "PUSH", "WHATSAPP"]),
  },
  stock: {
    low: createDefaultPreference(["IN_APP", "EMAIL"], []),
    out: createDefaultPreference(["IN_APP", "EMAIL"], []),
    restock: createDefaultPreference(["IN_APP"], []),
  },
  cut: {
    created: createDefaultPreference(["IN_APP", "PUSH"], ["IN_APP"]),
    started: createDefaultPreference(["IN_APP", "PUSH"], ["IN_APP"]),
    completed: createDefaultPreference(["IN_APP", "PUSH"], ["IN_APP"]),
    request: createDefaultPreference(["IN_APP", "PUSH", "EMAIL"], ["IN_APP", "PUSH"]),
  },
  ppe: {
    requested: createDefaultPreference(["IN_APP", "PUSH"], ["IN_APP", "PUSH"]),
    approved: createDefaultPreference(["IN_APP", "PUSH", "WHATSAPP"], ["IN_APP", "PUSH"]),
    rejected: createDefaultPreference(["IN_APP", "PUSH", "WHATSAPP"], ["IN_APP", "PUSH"]),
    delivered: createDefaultPreference(["IN_APP", "PUSH"], ["IN_APP", "PUSH"]),
  },
  system: {
    maintenance: createDefaultPreference(["IN_APP", "EMAIL"], []),
    update: createDefaultPreference(["IN_APP"], []),
    security: createDefaultPreference(["IN_APP", "EMAIL"], []),
  },
  vacation: {
    requested: createDefaultPreference(["IN_APP"], []),
    approved: createDefaultPreference(["IN_APP", "EMAIL", "PUSH"], []),
    rejected: createDefaultPreference(["IN_APP", "EMAIL", "PUSH"], []),
    reminder: createDefaultPreference(["IN_APP", "EMAIL"], []),
  },
};

// =====================
// Data Cleaning
// =====================

const cleanChannelData = (channels: string[] | null | undefined): NotificationChannel[] => {
  if (!channels || !Array.isArray(channels)) return [];

  return channels
    .map((ch): NotificationChannel | null => {
      if (!ch || typeof ch !== "string") return null;
      // Convert legacy values
      if (ch === "MOBILE_PUSH" || ch === "DESKTOP_PUSH") return "PUSH";
      if (ch === "SMS") return null;
      if (["IN_APP", "EMAIL", "PUSH", "WHATSAPP"].includes(ch)) {
        return ch as NotificationChannel;
      }
      return null;
    })
    .filter((ch): ch is NotificationChannel => ch !== null)
    .filter((ch, idx, arr) => arr.indexOf(ch) === idx);
};

// =====================
// PreferenceRow Component
// =====================

interface PreferenceRowProps {
  label: string;
  description: string;
  selectedChannels: NotificationChannel[];
  onChange: (channels: NotificationChannel[]) => void;
  mandatoryChannels: NotificationChannel[];
}

function PreferenceRow({
  label,
  description,
  selectedChannels,
  onChange,
  mandatoryChannels,
}: PreferenceRowProps) {
  const { colors, isDark } = useTheme();

  const handleChannelToggle = (channel: NotificationChannel) => {
    const isMandatory = mandatoryChannels.includes(channel);
    const isSelected = selectedChannels.includes(channel);

    if (isMandatory && isSelected) {
      Alert.alert(
        "Canal Obrigatório",
        `O canal ${channelMetadata[channel].label} é obrigatório para este tipo de notificação e não pode ser desativado.`
      );
      return;
    }

    const newChannels = isSelected
      ? selectedChannels.filter((c) => c !== channel)
      : [...selectedChannels, channel];

    if (newChannels.length === 0) {
      Alert.alert("Aviso", "Pelo menos um canal deve estar selecionado");
      return;
    }

    onChange(newChannels);
  };

  return (
    <View style={[styles.preferenceRow, { borderBottomColor: colors.border }]}>
      <View style={styles.preferenceInfo}>
        <View style={styles.labelRow}>
          <ThemedText style={styles.preferenceLabel}>{label}</ThemedText>
          {mandatoryChannels.length > 0 && (
            <View style={[styles.mandatoryBadge, { backgroundColor: isDark ? "#7c3aed20" : "#7c3aed15" }]}>
              <Icon name="lock" size={10} color="#7c3aed" />
              <Text style={styles.mandatoryText}>
                {mandatoryChannels.length}
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
          const isMandatory = mandatoryChannels.includes(channel);

          return (
            <TouchableOpacity
              key={channel}
              onPress={() => handleChannelToggle(channel)}
              activeOpacity={0.7}
              style={[
                styles.channelButton,
                {
                  borderColor: isSelected ? metadata.color : colors.border,
                  backgroundColor: isSelected ? `${metadata.color}15` : "transparent",
                },
              ]}
            >
              <Icon
                name={metadata.icon}
                size={18}
                color={isSelected ? metadata.color : colors.mutedForeground}
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

  const userSectorPrivilege = (user?.sector?.privileges as SectorPrivilege) || null;

  const [preferences, setPreferences] = useState<NotificationPreferences>(
    JSON.parse(JSON.stringify(defaultPreferences))
  );
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(
    JSON.parse(JSON.stringify(defaultPreferences))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // =====================
  // Data Transformation
  // =====================

  const transformPreferencesToLocal = useCallback(
    (apiPreferences: UserNotificationPreference[]): NotificationPreferences => {
      const local = JSON.parse(JSON.stringify(defaultPreferences)) as NotificationPreferences;

      for (const pref of apiPreferences) {
        const section = pref.notificationType.toLowerCase() as keyof NotificationPreferences;
        const eventKey = pref.eventType || "default";

        if (local[section] && eventKey in local[section]) {
          local[section][eventKey] = {
            channels: cleanChannelData(pref.channels as string[]),
            mandatoryChannels: cleanChannelData(pref.mandatoryChannels as string[]),
          };
        }
      }

      return local;
    },
    []
  );

  const transformLocalToApi = useCallback(
    (local: NotificationPreferences): Array<{ type: string; eventType: string; channels: string[] }> => {
      const apiPrefs: Array<{ type: string; eventType: string; channels: string[] }> = [];

      for (const [sectionKey, section] of Object.entries(local)) {
        const type = sectionKey.toUpperCase();

        for (const [eventKey, eventData] of Object.entries(section)) {
          apiPrefs.push({
            type,
            eventType: eventKey,
            channels: eventData.channels,
          });
        }
      }

      return apiPrefs;
    },
    []
  );

  // =====================
  // API Operations
  // =====================

  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const response = await notificationPreferenceService.getPreferences(user.id);

      if (response.data?.success && response.data?.data && response.data.data.length > 0) {
        const localPrefs = transformPreferencesToLocal(response.data.data);
        setPreferences(localPrefs);
        setOriginalPreferences(JSON.parse(JSON.stringify(localPrefs)));
      } else {
        const defaults = JSON.parse(JSON.stringify(defaultPreferences));
        setPreferences(defaults);
        setOriginalPreferences(JSON.parse(JSON.stringify(defaults)));
      }
    } catch (error: any) {
      console.error("[NotificationPreferences] Error loading:", error);
      Alert.alert("Erro", "Falha ao carregar preferências de notificação");
      const defaults = JSON.parse(JSON.stringify(defaultPreferences));
      setPreferences(defaults);
      setOriginalPreferences(JSON.parse(JSON.stringify(defaults)));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, transformPreferencesToLocal]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPreferences();
    setIsRefreshing(false);
  }, [loadPreferences]);

  const handlePreferenceChange = useCallback(
    (sectionKey: string, eventKey: string, channels: NotificationChannel[]) => {
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
    },
    []
  );

  const handleSave = useCallback(async () => {
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

      const responseData = response.data;
      if (responseData?.success) {
        setOriginalPreferences(JSON.parse(JSON.stringify(preferences)));
        Alert.alert("Sucesso", `${responseData.data?.updated || apiPrefs.length} preferências salvas!`);
      } else {
        Alert.alert("Erro", responseData?.message || "Erro ao salvar preferências");
      }
    } catch (error: any) {
      console.error("[NotificationPreferences] Error saving:", error);
      Alert.alert(
        "Erro",
        error?.response?.data?.message || "Falha ao salvar preferências de notificação"
      );
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, preferences, transformLocalToApi]);

  const handleReset = useCallback(() => {
    Alert.alert(
      "Restaurar Padrão",
      "Tem certeza que deseja restaurar todas as preferências para os valores padrão?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: () => {
            setPreferences(JSON.parse(JSON.stringify(defaultPreferences)));
          },
        },
      ]
    );
  }, []);

  const handleDiscard = useCallback(() => {
    setPreferences(JSON.parse(JSON.stringify(originalPreferences)));
  }, [originalPreferences]);

  // =====================
  // Computed Values
  // =====================

  const hasChanges = useMemo(() => {
    const getChannelsOnly = (prefs: NotificationPreferences) => {
      const result: Record<string, Record<string, NotificationChannel[]>> = {};
      for (const [sectionKey, section] of Object.entries(prefs)) {
        result[sectionKey] = {};
        for (const [eventKey, eventData] of Object.entries(section)) {
          result[sectionKey][eventKey] = [...eventData.channels].sort();
        }
      }
      return result;
    };

    return JSON.stringify(getChannelsOnly(preferences)) !== JSON.stringify(getChannelsOnly(originalPreferences));
  }, [preferences, originalPreferences]);

  const filteredSections = useMemo(() => {
    if (!userSectorPrivilege) return [];

    return notificationSections
      .filter((section) => canAccessCategory(section.id, userSectorPrivilege))
      .map((section) => {
        if (section.id === "task") {
          return {
            ...section,
            events: section.events.filter((event) => canAccessTaskEvent(event.key, userSectorPrivilege)),
          };
        }
        if (section.id === "service_order") {
          return {
            ...section,
            events: section.events.filter((event) => canAccessServiceOrderEvent(event.key, userSectorPrivilege)),
          };
        }
        return section;
      })
      .filter((section) => section.events.length > 0);
  }, [userSectorPrivilege]);

  // =====================
  // Render
  // =====================

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer, { backgroundColor: colors.background }]} edges={[]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ marginTop: spacing.md }}>Carregando preferências...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
          <ThemedText style={[styles.legendLabel, { color: colors.mutedForeground }]}>Canais:</ThemedText>
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
          {filteredSections.map((section) => {
            const sectionKey = section.id as keyof NotificationPreferences;

            return (
              <Card
                key={section.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <AccordionItem value={section.id}>
                  <AccordionTrigger>
                    <View style={styles.sectionHeader}>
                      <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                        <Icon name={section.icon} size={18} color={colors.primary} />
                      </View>
                      <View style={styles.sectionInfo}>
                        <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
                        <ThemedText style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                          {section.events.length} eventos
                        </ThemedText>
                      </View>
                    </View>
                  </AccordionTrigger>
                  <AccordionContent>
                    <View style={styles.sectionContent}>
                      {section.events.map((event) => {
                        const eventPref = preferences[sectionKey]?.[event.key];

                        return (
                          <PreferenceRow
                            key={event.key}
                            label={event.label}
                            description={event.description}
                            selectedChannels={eventPref?.channels || []}
                            onChange={(channels) => handlePreferenceChange(sectionKey, event.key, channels)}
                            mandatoryChannels={eventPref?.mandatoryChannels || event.mandatoryChannels}
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
        {hasChanges && (
          <>
            {/* Reset Button */}
            <View style={styles.resetContainer}>
              <Button variant="ghost" onPress={handleReset} disabled={isSaving}>
                <IconRotate size={16} color={colors.mutedForeground} />
                <ButtonText style={[styles.resetText, { color: colors.mutedForeground }]}>
                  Restaurar Padrão
                </ButtonText>
              </Button>
            </View>

            {/* Main Action Bar */}
            <View
              style={[
                styles.actionBar,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  marginBottom: (insets.bottom || 0) + formSpacing.cardMarginBottom,
                },
              ]}
            >
              <View style={styles.buttonWrapper}>
                <Button variant="outline" onPress={handleDiscard} disabled={isSaving}>
                  <IconX size={18} color={colors.mutedForeground} />
                  <ButtonText style={styles.buttonText}>Descartar</ButtonText>
                </Button>
              </View>

              <View style={styles.buttonWrapper}>
                <Button variant="default" onPress={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <IconCheck size={18} color={colors.primaryForeground} />
                  )}
                  <ButtonText style={[styles.buttonText, { color: colors.primaryForeground }]}>
                    {isSaving ? "Salvando..." : "Salvar"}
                  </ButtonText>
                </Button>
              </View>
            </View>
          </>
        )}
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
    paddingBottom: spacing.xl * 2,
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
  resetContainer: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  resetText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionBar: {
    flexDirection: "row",
    gap: formSpacing.rowGap,
    padding: formSpacing.actionBarPadding,
    borderRadius: formLayout.cardBorderRadius,
    borderWidth: formLayout.borderWidth,
    marginHorizontal: formSpacing.containerPaddingHorizontal,
    marginTop: spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
