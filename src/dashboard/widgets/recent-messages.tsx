// Recent-messages widget — wraps the existing mobile RecentMessagesList. The
// underlying list pulls data from the same `useHomeDashboard` query used
// elsewhere on the home screen, so dropping this widget alongside other data
// widgets does not double the network cost (react-query dedupes the request).

import { z } from "zod";
import { View, Text } from "react-native";
import { IconMessage } from "@tabler/icons-react-native";
import { useHomeDashboard } from "@/hooks/dashboard";
import { RecentMessagesList } from "@/components/home-dashboard/recent-messages-list";
import { useTheme } from "@/lib/theme";
import { Section, ToggleRow, LabeledField } from "./_shared";
import { Input } from "@/components/ui/input";
import { WidgetCard } from "../components/widget-card";
import {
  AccentPicker,
  makeAccentSchema,
  resolveAccent,
  borderHexFor,
  type WidgetAccentColor,
  type WidgetAccentIcon,
  type WidgetBorderColor,
} from "../components/widget-accent";
import type {
  WidgetConfigProps,
  WidgetDefinition,
  WidgetRenderProps,
} from "../types";

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Mensagens Recentes"),
  showHeader: z.boolean().default(true),
  accent: makeAccentSchema({ color: "indigo", icon: "Message", borderColor: "none" }),
});
type Config = z.infer<typeof configSchema>;

function Render({ config }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;
  const { data, isLoading, isError } = useHomeDashboard({ platform: "mobile" });
  const messages = data?.data?.recentMessages ?? [];
  const unreadCount = data?.data?.counts?.unreadMessages ?? 0;

  return (
    <WidgetCard
      title={config.title || "Mensagens Recentes"}
      icon={<Icon size={16} color={accent.hex} />}
      showHeader={config.showHeader}
      count={unreadCount > 0 ? unreadCount : null}
      borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
    >
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        {isLoading ? (
          <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: "center" }}>
            Carregando...
          </Text>
        ) : isError ? (
          <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: "center" }}>
            Não foi possível carregar mensagens.
          </Text>
        ) : messages.length === 0 ? (
          <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: "center" }}>
            Nenhuma mensagem recente.
          </Text>
        ) : (
          <RecentMessagesList messages={messages} unreadCount={unreadCount} />
        )}
      </View>
    </WidgetCard>
  );
}

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });
  return (
    <View style={{ gap: 12 }}>
      <LabeledField label="Título">
        <Input
          value={config.title}
          onChangeText={(v: string) => set("title", v)}
          placeholder="Mensagens Recentes"
        />
      </LabeledField>
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "indigo") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Message") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.showHeader}
          onCheckedChange={(v) => set("showHeader", v)}
        />
      </Section>
    </View>
  );
}

export const recentMessagesWidget: WidgetDefinition<Config> = {
  id: "home.recent-messages",
  name: "Mensagens Recentes",
  description:
    "Últimas mensagens recebidas pelo usuário. Exibe contagem de não lidas e abre o modal de visualização ao tocar.",
  icon: IconMessage,
  category: "other",
  allowedSectors: "*",
  // Message list with multi-line preview blocks — needs at least 2/3 width
  // to keep titles readable.
  allowedSpans: [2, 3],
  defaultSpan: 2,
  allowedHeights: [2, 3, 4],
  defaultRows: 2,
  configSchema,
  defaultConfig: {
    title: "Mensagens Recentes",
    showHeader: true,
    accent: { color: "indigo", icon: "Message", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
