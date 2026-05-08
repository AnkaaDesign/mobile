// Borrow widget — surfaces the warehouse loan queue. Shows item, borrower
// name, days outstanding, and status. Mobile is single-column with compact
// rows; tap a row to push to the loan detail page.

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
import { IconPackage, IconRefresh } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { BORROW_STATUS, SECTOR_PRIVILEGES } from "@/constants/enums";
import { BORROW_STATUS_LABELS } from "@/constants/enum-labels";
import { useBorrows } from "@/hooks/useBorrow";
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

// Solid BADGE_COLORS palette.
const STATUS_TONES: Record<BORROW_STATUS, { bg: string; fg: string }> = {
  [BORROW_STATUS.ACTIVE]: { bg: "#1d4ed8", fg: "#ffffff" },
  [BORROW_STATUS.RETURNED]: { bg: "#15803d", fg: "#ffffff" },
  [BORROW_STATUS.OVERDUE]: { bg: "#b91c1c", fg: "#ffffff" },
  [BORROW_STATUS.LOST]: { bg: "#7f1d1d", fg: "#ffffff" },
};

const STATUS_OPTIONS = Object.values(BORROW_STATUS).map((s) => ({
  value: s,
  label: BORROW_STATUS_LABELS[s],
}));

const PERIOD_PRESETS = ["any", "today", "7d", "30d", "month"] as const;
type PeriodPreset = (typeof PERIOD_PRESETS)[number];
const PERIOD_LABELS: Record<PeriodPreset, string> = {
  any: "Qualquer período",
  today: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  month: "Este mês",
};

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Empréstimos"),
  showHeader: z.boolean().default(true),
  filters: z
    .object({
      statuses: z.array(z.nativeEnum(BORROW_STATUS)).default([BORROW_STATUS.ACTIVE]),
      periodPreset: z.enum(PERIOD_PRESETS).default("any"),
      onlyOverdue: z.boolean().default(false),
    })
    .default({
      statuses: [BORROW_STATUS.ACTIVE],
      periodPreset: "any",
      onlyOverdue: false,
    }),
  limit: z.number().int().min(5).max(50).default(20),
  accent: makeAccentSchema({ color: "violet", icon: "Package", borderColor: "none" }),
});
type Config = z.infer<typeof configSchema>;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function periodWhere(preset: PeriodPreset): any {
  if (preset === "any") return undefined;
  const now = startOfToday();
  let from: Date;
  if (preset === "today") {
    from = now;
  } else if (preset === "7d") {
    from = new Date(now);
    from.setDate(from.getDate() - 7);
  } else if (preset === "30d") {
    from = new Date(now);
    from.setDate(from.getDate() - 30);
  } else {
    // month
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { gte: from.toISOString() };
}

function daysSince(d: string | Date | null | undefined): number {
  if (!d) return 0;
  const ms = startOfToday().getTime() - new Date(d).getTime();
  return Math.floor(ms / 86_400_000);
}

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
    const periodFilter = periodWhere(config.filters.periodPreset);
    if (periodFilter) where.createdAt = periodFilter;
    return {
      where,
      orderBy: { createdAt: "desc" as const },
      take: config.limit,
      include: { item: true, user: true },
    };
  }, [config.filters.statuses, config.filters.periodPreset, config.limit]);

  const { data, isLoading, isError, refetch, isRefetching } = useBorrows(
    queryParams as any,
  );
  const rows = (data?.data ?? []) as any[];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      // Compute days outstanding for active borrows.
      const days = r.status === BORROW_STATUS.ACTIVE ? daysSince(r.createdAt) : 0;
      const overdue = days > 30;
      if (config.filters.onlyOverdue && !overdue) return false;
      if (term) {
        const haystack = `${r.item?.name ?? ""} ${r.user?.name ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [rows, search, config.filters.onlyOverdue]);

  return (
    <WidgetCard
      title={config.title || "Empréstimos"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref="/(tabs)/estoque/emprestimos"
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
            placeholder="Buscar item ou colaborador..."
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
            Erro ao carregar empréstimos.
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
            Nenhum empréstimo encontrado.
          </Text>
        ) : (
          filtered.map((b) => {
            const tone = STATUS_TONES[b.status as BORROW_STATUS] ?? {
              bg: colors.muted,
              fg: colors.mutedForeground,
            };
            const days = b.status === BORROW_STATUS.ACTIVE ? daysSince(b.createdAt) : null;
            const overdue = days != null && days > 30;
            return (
              <Pressable
                key={b.id}
                onPress={() =>
                  router.push(`/(tabs)/estoque/emprestimos/detalhes/${b.id}` as any)
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
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: colors.foreground,
                      }}
                    >
                      {b.item?.name ?? "—"}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 11, color: colors.mutedForeground }}
                    >
                      {b.user?.name ?? "—"}
                      {b.quantity != null ? ` · ${b.quantity} un.` : ""}
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
                        {BORROW_STATUS_LABELS[b.status as BORROW_STATUS] ?? b.status}
                      </Text>
                    </View>
                    {days != null && (
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: overdue ? "700" : "500",
                          color: overdue ? "#b91c1c" : colors.mutedForeground,
                        }}
                      >
                        {days === 0 ? "hoje" : `${days}d em uso`}
                      </Text>
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

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>Título</Text>
        <Input
          value={config.title}
          onChangeText={(v: string) => set("title", v)}
          placeholder="Empréstimos"
        />
      </View>
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "violet") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Package") as WidgetAccentIcon,
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
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Período</Text>
          <Combobox
            value={config.filters.periodPreset}
            onValueChange={(v: any) =>
              setFilter("periodPreset", (typeof v === "string" ? v : "any") as PeriodPreset)
            }
            options={PERIOD_PRESETS.map((p) => ({ value: p, label: PERIOD_LABELS[p] }))}
          />
        </View>
        <ToggleRow
          label="Apenas atrasados"
          hint="Mostra somente empréstimos com mais de 30 dias em uso."
          checked={config.filters.onlyOverdue}
          onCheckedChange={(v) => setFilter("onlyOverdue", v)}
        />
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

export const borrowTableWidget: WidgetDefinition<Config> = {
  id: "table.borrows",
  name: "Empréstimos",
  description:
    "Empréstimos ativos do estoque. Filtra por status, período, atrasados. Toque para abrir o detalhe.",
  icon: IconPackage,
  category: "inventory",
  // Mirror /estoque/emprestimos page (parent /estoque is [WAREHOUSE, ADMIN]).
  allowedSectors: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
  defaultSize: { cols: 1, rows: 3 },
  minSize: { cols: 1, rows: 2 },
  maxSize: { cols: 1, rows: 4 },
  configSchema,
  defaultConfig: {
    title: "Empréstimos",
    showHeader: true,
    filters: {
      statuses: [BORROW_STATUS.ACTIVE],
      periodPreset: "any",
      onlyOverdue: false,
    },
    limit: 20,
    accent: { color: "violet", icon: "Package", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
