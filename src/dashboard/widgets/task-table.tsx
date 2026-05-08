// Task widget — compact production task list. Mobile drops the heaviest web
// features (canvas paint preview, multi-sort, layout modes, characteristics)
// and keeps the high-signal essentials: name, customer, status, deadline
// countdown, optional paint dot. Tap a row to push to the task detail.

import { useMemo, useState } from "react";
import { z } from "zod";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  IconClipboardText,
  IconRefresh,
  IconAlertTriangle,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import {
  TASK_STATUS,
  SECTOR_PRIVILEGES,
} from "@/constants/enums";
import { TASK_STATUS_LABELS } from "@/constants/enum-labels";
import { useTasks } from "@/hooks/useTask";
import { Section, ToggleRow, LimitInput } from "./_shared";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
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

// Solid BADGE_COLORS — same hues as the web widget's STATUS_BADGE_CLASSES.
const STATUS_TONES: Record<TASK_STATUS, { bg: string; fg: string }> = {
  [TASK_STATUS.PREPARATION]: { bg: "#ea580c", fg: "#fff" },
  [TASK_STATUS.WAITING_PRODUCTION]: { bg: "#737373", fg: "#fff" },
  [TASK_STATUS.IN_PRODUCTION]: { bg: "#1d4ed8", fg: "#fff" },
  [TASK_STATUS.COMPLETED]: { bg: "#15803d", fg: "#fff" },
  [TASK_STATUS.CANCELLED]: { bg: "#b91c1c", fg: "#fff" },
};

const STATUS_OPTIONS = Object.values(TASK_STATUS).map((s) => ({
  value: s,
  label: TASK_STATUS_LABELS[s],
}));

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Tarefas"),
  showHeader: z.boolean().default(true),
  showPaintDot: z.boolean().default(true),
  filters: z
    .object({
      statuses: z
        .array(z.nativeEnum(TASK_STATUS))
        .default([TASK_STATUS.IN_PRODUCTION, TASK_STATUS.WAITING_PRODUCTION]),
      onlyOverdue: z.boolean().default(false),
    })
    .default({
      statuses: [TASK_STATUS.IN_PRODUCTION, TASK_STATUS.WAITING_PRODUCTION],
      onlyOverdue: false,
    }),
  sort: z
    .object({
      key: z.enum(["term", "name", "customerName", "createdAt"]).default("term"),
      direction: z.enum(["asc", "desc"]).default("asc"),
    })
    .default({ key: "term", direction: "asc" }),
  limit: z.number().int().min(5).max(50).default(20),
  accent: makeAccentSchema({
    color: "teal",
    icon: "ClipboardText",
    borderColor: "none",
  }),
});
type Config = z.infer<typeof configSchema>;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(target: Date | string | null | undefined): number | null {
  if (!target) return null;
  const t = new Date(target);
  if (Number.isNaN(t.getTime())) return null;
  return Math.round(
    (t.getTime() - startOfToday().getTime()) / 86_400_000,
  );
}

function deadlineColor(days: number | null, status: TASK_STATUS): string {
  if (status === TASK_STATUS.COMPLETED) return "#15803d";
  if (status === TASK_STATUS.CANCELLED) return "#737373";
  if (days == null) return "#737373";
  if (days < 0) return "#b91c1c";
  if (days === 0) return "#ea580c";
  if (days <= 3) return "#d97706";
  if (days <= 7) return "#ca8a04";
  return "#737373";
}

function deadlineText(days: number | null): string {
  if (days == null) return "—";
  if (days < 0) return `${Math.abs(days)}d atrasado`;
  if (days === 0) return "vence hoje";
  if (days === 1) return "vence amanhã";
  return `em ${days}d`;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function customerLabel(
  c?: { fantasyName?: string; corporateName?: string } | null,
): string {
  if (!c) return "—";
  return c.fantasyName || c.corporateName || "—";
}

const TASK_INCLUDE = {
  customer: true,
  generalPainting: true,
};

function Render({ config }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const router = useRouter();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;

  const [search, setSearch] = useState("");

  const queryParams = useMemo(() => {
    const where: any = {};
    if (config.filters.statuses.length) {
      where.status = { in: config.filters.statuses };
    }
    // Map sort key — "customerName" is on the related customer.
    const orderBy: any =
      config.sort.key === "customerName"
        ? { customer: { fantasyName: config.sort.direction } }
        : { [config.sort.key]: config.sort.direction };
    return {
      where,
      orderBy,
      take: config.limit,
      include: TASK_INCLUDE,
    };
  }, [config.filters.statuses, config.sort.key, config.sort.direction, config.limit]);

  const { data, isLoading, isError, refetch, isRefetching } = useTasks(
    queryParams as any,
  );
  const rows = (data?.data ?? []) as any[];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((t) => {
      if (config.filters.onlyOverdue) {
        const days = diffDays(t.term);
        if (days == null || days >= 0) return false;
      }
      if (term) {
        const haystack = `${t.name ?? ""} ${customerLabel(t.customer)} ${t.serialNumber ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [rows, search, config.filters.onlyOverdue]);

  return (
    <WidgetCard
      title={config.title || "Tarefas"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref="/(tabs)/producao/cronograma"
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
      count={filtered.length}
    >
      <View style={{ paddingTop: 8 }}>
        <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <Input
            placeholder="Buscar tarefa, cliente ou OS..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

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
            Erro ao carregar tarefas.
          </Text>
        ) : filtered.length === 0 ? (
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              textAlign: "center",
              padding: 16,
            }}
          >
            Nenhuma tarefa encontrada.
          </Text>
        ) : (
          filtered.map((t) => {
            const tone = STATUS_TONES[t.status as TASK_STATUS] ?? {
              bg: colors.muted,
              fg: colors.mutedForeground,
            };
            const days = diffDays(t.term);
            const dlColor = deadlineColor(days, t.status as TASK_STATUS);
            const overdue = days != null && days < 0;
            const paintHex =
              t.generalPainting?.hex ||
              t.generalPainting?.paint?.hex ||
              null;
            return (
              <Pressable
                key={t.id}
                onPress={() =>
                  router.push(`/(tabs)/producao/cronograma/detalhes/${t.id}` as any)
                }
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  backgroundColor: pressed ? colors.muted : "transparent",
                })}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {config.showPaintDot && paintHex && (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: paintHex,
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        />
                      )}
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: colors.foreground,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {t.name ?? "—"}
                      </Text>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 11, color: colors.mutedForeground }}
                    >
                      {customerLabel(t.customer)}
                      {t.serialNumber ? ` · ${t.serialNumber}` : ""}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <View
                      style={{
                        backgroundColor: tone.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{ fontSize: 10, fontWeight: "600", color: tone.fg }}
                      >
                        {TASK_STATUS_LABELS[t.status as TASK_STATUS] ?? t.status}
                      </Text>
                    </View>
                    {t.term && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        {overdue && (
                          <IconAlertTriangle size={11} color={dlColor} />
                        )}
                        <Text
                          style={{
                            fontSize: 10,
                            color: dlColor,
                            fontWeight: overdue ? "700" : "500",
                          }}
                        >
                          {formatDate(t.term)} · {deadlineText(days)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
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
  const setFilter = <K extends keyof Config["filters"]>(
    key: K,
    value: Config["filters"][K],
  ) => onChange({ ...config, filters: { ...config.filters, [key]: value } });
  const setSort = <K extends keyof Config["sort"]>(
    key: K,
    value: Config["sort"][K],
  ) => onChange({ ...config, sort: { ...config.sort, [key]: value } });

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>Título</Text>
        <Input
          value={config.title}
          onChangeText={(v: string) => set("title", v)}
          placeholder="Tarefas"
        />
      </View>
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "teal") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "ClipboardText") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.showHeader}
          onCheckedChange={(v) => set("showHeader", v)}
        />
        <ToggleRow
          label="Bolinha de pintura"
          hint="Mostra a cor da pintura geral antes do nome da tarefa."
          checked={config.showPaintDot}
          onCheckedChange={(v) => set("showPaintDot", v)}
        />
      </Section>
      <Section title="Filtros" defaultOpen>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Status</Text>
          <Combobox
            mode="multiple"
            value={config.filters.statuses}
            onValueChange={(v: any) =>
              setFilter("statuses", Array.isArray(v) ? v : [v].filter(Boolean))
            }
            options={STATUS_OPTIONS}
            placeholder="Todos"
          />
        </View>
        <ToggleRow
          label="Apenas atrasadas"
          checked={config.filters.onlyOverdue}
          onCheckedChange={(v) => setFilter("onlyOverdue", v)}
        />
      </Section>
      <Section title="Ordenação">
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Ordenar por
          </Text>
          <Combobox
            value={config.sort.key}
            onValueChange={(v: any) =>
              setSort("key", (typeof v === "string" ? v : "term") as Config["sort"]["key"])
            }
            options={[
              { value: "term", label: "Prazo" },
              { value: "name", label: "Nome" },
              { value: "customerName", label: "Cliente" },
              { value: "createdAt", label: "Criação" },
            ]}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Direção</Text>
          <Combobox
            value={config.sort.direction}
            onValueChange={(v: any) =>
              setSort("direction", (typeof v === "string" ? v : "asc") as "asc" | "desc")
            }
            options={[
              { value: "asc", label: "Crescente" },
              { value: "desc", label: "Decrescente" },
            ]}
          />
        </View>
        <LimitInput
          value={config.limit}
          onChange={(v) => set("limit", v)}
          min={5}
          max={50}
        />
      </Section>
    </View>
  );
}

export const taskTableWidget: WidgetDefinition<Config> = {
  id: "table.tasks",
  name: "Tarefas",
  description:
    "Tarefas em produção com prazo, cliente e status. Filtre por status / atrasadas, ordene por prazo. Toque para abrir o detalhe.",
  icon: IconClipboardText,
  category: "production",
  // Mirrors web — every sector that has /producao/cronograma in its nav.
  allowedSectors: [
    SECTOR_PRIVILEGES.PRODUCTION,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.PLOTTING,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ],
  defaultSize: { cols: 1, rows: 3 },
  minSize: { cols: 1, rows: 2 },
  maxSize: { cols: 1, rows: 4 },
  configSchema,
  defaultConfig: {
    title: "Tarefas",
    showHeader: true,
    showPaintDot: true,
    filters: {
      statuses: [TASK_STATUS.IN_PRODUCTION, TASK_STATUS.WAITING_PRODUCTION],
      onlyOverdue: false,
    },
    sort: { key: "term", direction: "asc" },
    limit: 20,
    accent: { color: "teal", icon: "ClipboardText", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
