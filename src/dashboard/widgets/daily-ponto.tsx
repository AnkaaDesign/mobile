// Daily-ponto widget — shows today's attendance summary by category (presentes,
// atrasos, faltas, etc.) using Secullum's daily-summary endpoint. The web
// version is a per-employee table; mobile's narrow viewport favours the
// category breakdown the API already provides. Tap a category to push to the
// full HR view filtered by that category.

import { useMemo } from "react";
import { z } from "zod";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { IconClock24, IconRefresh } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useSecullumDailySummary } from "@/hooks/secullum";
import { Section, ToggleRow } from "./_shared";
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

// Category tone — tries to map common Secullum titles to BADGE_COLORS-style
// solid fills. Unknown titles fall back to neutral.
function toneFor(title: string): { bg: string; fg: string } {
  const t = title.toLowerCase();
  if (t.includes("falta")) return { bg: "#b91c1c", fg: "#fff" };
  if (t.includes("atras")) return { bg: "#d97706", fg: "#fff" };
  if (t.includes("hora extra") || t.includes("ext"))
    return { bg: "#1d4ed8", fg: "#fff" };
  if (t.includes("present") || t.includes("trabalh"))
    return { bg: "#15803d", fg: "#fff" };
  if (t.includes("férias") || t.includes("ferias") || t.includes("ausê"))
    return { bg: "#7c3aed", fg: "#fff" };
  if (t.includes("compens")) return { bg: "#0891b2", fg: "#fff" };
  return { bg: "#6b7280", fg: "#fff" };
}

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Ponto do Dia"),
  showHeader: z.boolean().default(true),
  showProgressBar: z.boolean().default(true),
  hideEmptyCategories: z.boolean().default(false),
  accent: makeAccentSchema({ color: "teal", icon: "Clock24", borderColor: "none" }),
});
type Config = z.infer<typeof configSchema>;

function Render({ config }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const router = useRouter();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;

  const { data, isLoading, isError, refetch, isRefetching } =
    useSecullumDailySummary();

  const summary = (data as any)?.data?.data?.resumoDiario;
  const categories = useMemo(() => {
    const list = (summary?.Dados ?? []) as Array<{
      Titulo: string;
      Atual: number;
      Total: number;
      ExibirProgressBar: boolean;
      FuncionariosIds: number[];
    }>;
    return config.hideEmptyCategories ? list.filter((c) => c.Atual > 0) : list;
  }, [summary, config.hideEmptyCategories]);

  return (
    <WidgetCard
      title={config.title || "Ponto do Dia"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref="/(tabs)/recursos-humanos/time-clock"
      showHeader={config.showHeader}
      borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      headerExtra={
        <Pressable
          onPress={() => refetch()}
          hitSlop={6}
          style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.5 : 1 })}
        >
          <IconRefresh
            size={16}
            color={isRefetching ? colors.primary : colors.mutedForeground}
          />
        </Pressable>
      }
    >
      <View style={{ paddingVertical: 4 }}>
        {isLoading ? (
          <View style={{ padding: 24, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isError ? (
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              textAlign: "center",
              padding: 16,
            }}
          >
            Erro ao carregar resumo do ponto.
          </Text>
        ) : categories.length === 0 ? (
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              textAlign: "center",
              padding: 16,
            }}
          >
            Nenhuma informação de ponto para hoje.
          </Text>
        ) : (
          categories.map((cat, i) => {
            const tone = toneFor(cat.Titulo);
            const pct =
              cat.Total > 0
                ? Math.min(100, Math.round((cat.Atual / cat.Total) * 100))
                : 0;
            return (
              <Pressable
                key={`${cat.Titulo}-${i}`}
                onPress={() =>
                  router.push("/(tabs)/recursos-humanos/time-clock" as any)
                }
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                  backgroundColor: pressed ? colors.muted : "transparent",
                  gap: 6,
                })}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}
                    numberOfLines={1}
                  >
                    {cat.Titulo}
                  </Text>
                  <View
                    style={{
                      backgroundColor: tone.bg,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 12,
                      minWidth: 44,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{ fontSize: 11, fontWeight: "700", color: tone.fg }}
                    >
                      {cat.Atual}
                      {cat.Total > 0 && cat.Total !== cat.Atual ? `/${cat.Total}` : ""}
                    </Text>
                  </View>
                </View>
                {config.showProgressBar && cat.ExibirProgressBar && cat.Total > 0 && (
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: colors.muted,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        backgroundColor: tone.bg,
                      }}
                    />
                  </View>
                )}
              </Pressable>
            );
          })
        )}
      </View>
    </WidgetCard>
  );
}

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const { colors } = useTheme();
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>Título</Text>
        <Input
          value={config.title}
          onChangeText={(v: string) => set("title", v)}
          placeholder="Ponto do Dia"
        />
      </View>
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "teal") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Clock24") as WidgetAccentIcon,
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
      <Section title="Comportamento">
        <ToggleRow
          label="Barras de progresso"
          hint="Mostra a barra colorida em categorias com total."
          checked={config.showProgressBar}
          onCheckedChange={(v) => set("showProgressBar", v)}
        />
        <ToggleRow
          label="Ocultar categorias vazias"
          checked={config.hideEmptyCategories}
          onCheckedChange={(v) => set("hideEmptyCategories", v)}
        />
      </Section>
    </View>
  );
}

export const dailyPontoWidget: WidgetDefinition<Config> = {
  id: "home.daily-ponto",
  name: "Ponto do Dia",
  description:
    "Resumo do ponto do dia agrupado por categoria (presentes, atrasos, faltas). Toque para abrir a tela completa.",
  icon: IconClock24,
  category: "hr",
  // Same scope as web — HR + Admin + Production-Manager (the user explicitly
  // approved PROD_MGR for HR-summary widgets).
  allowedSectors: [
    SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
    SECTOR_PRIVILEGES.ADMIN,
  ],
  defaultSize: { cols: 1, rows: 3 },
  minSize: { cols: 1, rows: 2 },
  maxSize: { cols: 1, rows: 4 },
  configSchema,
  defaultConfig: {
    title: "Ponto do Dia",
    showHeader: true,
    showProgressBar: true,
    hideEmptyCategories: false,
    accent: { color: "teal", icon: "Clock24", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
