// Production Calendar widget — monthly view (26 → 25) of tasks plotted by
// their relevant date events: prazo (term), previsão (forecastDate),
// iniciada (startedAt) and concluída (finishedAt). Each event type is
// colored and toggleable so a user can see at a glance which tasks have
// deadlines or completions falling in the current payroll period.
//
// Mirror of `web/src/dashboard/widgets/production-calendar.tsx` but adapted
// for React Native:
//   - 4 parallel useTasks calls keyed by date range, just like web.
//   - Tap a day opens the canonical StandardModal listing the events; tap an
//     event there pushes to the task detail (web uses TruckDetailModal —
//     mobile reuses the existing `routes.production.schedule.details(id)`
//     route).
//   - Legend tiles below the grid are tappable to toggle visibility per
//     event type (mirrors web's StatsRow tiles).
//
// Mobile divergences from web spec §6.9:
//   - `display.showFilters` is kept in the schema for parity but is a no-op
//     on mobile — the configure modal already exposes filters as its own
//     section, and dangling chips above the grid would steal vertical
//     space we cannot afford on a phone.

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import {
  IconCalendarStats,
  IconChevronRight,
} from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { TASK_STATUS, SECTOR_PRIVILEGES } from "@/constants/enums";
import { TASK_STATUS_LABELS } from "@/constants/enum-labels";
import { useTasks } from "@/hooks/useTask";
import { routes } from "@/constants/routes";
import { Combobox } from "@/components/ui/combobox";
import { StandardModal } from "@/components/ui/standard-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { lightImpactHaptic } from "@/utils/haptics";

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
import { Section, ToggleRow, ConfigTitleInput, LabeledField } from "./_shared";
import {
  CalendarGrid,
  PeriodHeader,
  buildPeriodGrid,
  defaultRefMonth,
  getPayrollPeriod,
  toIsoDay,
  resolveCalendarColor,
  EventDotRow,
} from "./_calendar-shared";

// ============================================================
// Event types
// ============================================================

const EVENT_TYPES = ["term", "forecastDate", "startedAt", "finishedAt"] as const;
type EventType = (typeof EVENT_TYPES)[number];

const EVENT_LABELS: Record<EventType, string> = {
  term: "Prazo",
  forecastDate: "Previsão",
  startedAt: "Iniciada",
  finishedAt: "Concluída",
};

// Default event color tokens (Tailwind family-shade format). Resolved to hex
// at render time via `resolveCalendarColor` from `_calendar-shared`. Keeping
// the storage format identical to web means saved configs round-trip across
// platforms without migration.
const DEFAULT_EVENT_COLORS: Record<EventType, string> = {
  term: "purple-600",
  forecastDate: "orange-600",
  startedAt: "blue-600",
  finishedAt: "green-700",
};
const DEFAULT_OVERDUE_COLOR = "red-700";

interface DayEvent {
  type: EventType;
  task: any;
}

// ============================================================
// Config schema — mirror of web (8 display toggles + 5 colors + 2 filters)
// ============================================================

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Calendário de Produção"),
  accent: makeAccentSchema({ color: "indigo", icon: "Calendar" }),
  display: z
    .object({
      showHeader: z.boolean().default(true),
      showFilters: z.boolean().default(true),
      showTerm: z.boolean().default(true),
      showForecast: z.boolean().default(true),
      showStarted: z.boolean().default(true),
      showFinished: z.boolean().default(true),
      showSunday: z.boolean().default(true),
      showSaturday: z.boolean().default(true),
      eventColors: z
        .object({
          term: z.string().default("purple-600"),
          forecastDate: z.string().default("orange-600"),
          startedAt: z.string().default("blue-600"),
          finishedAt: z.string().default("green-700"),
          overdue: z.string().default("red-700"),
        })
        .default({
          term: "purple-600",
          forecastDate: "orange-600",
          startedAt: "blue-600",
          finishedAt: "green-700",
          overdue: "red-700",
        }),
    })
    .default({
      showHeader: true,
      showFilters: true,
      showTerm: true,
      showForecast: true,
      showStarted: true,
      showFinished: true,
      showSunday: true,
      showSaturday: true,
      eventColors: {
        term: "purple-600",
        forecastDate: "orange-600",
        startedAt: "blue-600",
        finishedAt: "green-700",
        overdue: "red-700",
      },
    }),
  filters: z
    .object({
      statuses: z
        .array(z.nativeEnum(TASK_STATUS))
        .default([
          TASK_STATUS.PREPARATION,
          TASK_STATUS.WAITING_PRODUCTION,
          TASK_STATUS.IN_PRODUCTION,
          TASK_STATUS.COMPLETED,
        ]),
      includeCancelled: z.boolean().default(false),
    })
    .default({
      statuses: [
        TASK_STATUS.PREPARATION,
        TASK_STATUS.WAITING_PRODUCTION,
        TASK_STATUS.IN_PRODUCTION,
        TASK_STATUS.COMPLETED,
      ],
      includeCancelled: false,
    }),
});
type Config = z.infer<typeof configSchema>;

// ============================================================
// Render
// ============================================================

const TASK_INCLUDE = {
  customer: { select: { fantasyName: true, corporateName: true } },
  sector: { select: { id: true, name: true } },
} as const;

function Render({ config }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const router = useRouter();
  const accent = useMemo(
    () =>
      resolveAccent({
        color: config.accent?.color as WidgetAccentColor,
        icon: config.accent?.icon as WidgetAccentIcon,
      }),
    [config.accent?.color, config.accent?.icon],
  );
  const AccentIcon = accent.Icon;

  const eventColors = config.display.eventColors ?? DEFAULT_EVENT_COLORS;
  const overdueColor =
    (config.display.eventColors as { overdue?: string } | undefined)?.overdue ??
    DEFAULT_OVERDUE_COLOR;

  const [refMonth, setRefMonth] = useState<Date>(() => defaultRefMonth());

  // Status filter is set in the configure modal's "Filtros" section — never
  // exposed in the widget header (no removable chips dangling in the title bar).
  const effectiveStatuses = useMemo<TASK_STATUS[]>(() => {
    const list = [...config.filters.statuses];
    if (
      config.filters.includeCancelled &&
      !list.includes(TASK_STATUS.CANCELLED)
    ) {
      list.push(TASK_STATUS.CANCELLED);
    }
    return list;
  }, [config.filters.statuses, config.filters.includeCancelled]);

  // Local visibility toggles for each event type, seeded from config.display.*.
  // Legend tiles below the grid mutate these — saved config defaults are
  // preserved until the next manual toggle. Re-syncs when saved config changes.
  const [showTerm, setShowTerm] = useState(config.display.showTerm);
  const [showForecast, setShowForecast] = useState(config.display.showForecast);
  const [showStarted, setShowStarted] = useState(config.display.showStarted);
  const [showFinished, setShowFinished] = useState(config.display.showFinished);
  useEffect(
    () => setShowTerm(config.display.showTerm),
    [config.display.showTerm],
  );
  useEffect(
    () => setShowForecast(config.display.showForecast),
    [config.display.showForecast],
  );
  useEffect(
    () => setShowStarted(config.display.showStarted),
    [config.display.showStarted],
  );
  useEffect(
    () => setShowFinished(config.display.showFinished),
    [config.display.showFinished],
  );

  // Tap a day → bottom sheet with that day's events.
  const [sheetDay, setSheetDay] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openDaySheet = (day: Date) => {
    lightImpactHaptic();
    setSheetDay(day);
    setSheetOpen(true);
  };

  const grid = useMemo(() => buildPeriodGrid(refMonth), [refMonth]);
  const { start: periodStart, end: periodEnd } = useMemo(
    () => getPayrollPeriod(refMonth),
    [refMonth],
  );

  const baseParams = {
    take: 200,
    status: effectiveStatuses.length > 0 ? effectiveStatuses : undefined,
    include: TASK_INCLUDE as any,
    orderBy: { name: "asc" as const },
  };

  // One query per active event type. Each is range-bounded to the period and
  // disabled when the user has hidden that event type — saves bandwidth at
  // narrower spans and on metered connections.
  const termQ = useTasks({
    ...baseParams,
    termRange: { from: periodStart, to: periodEnd },
    enabled: showTerm,
  } as any);
  const forecastQ = useTasks({
    ...baseParams,
    forecastDateRange: { from: periodStart, to: periodEnd },
    enabled: showForecast,
  } as any);
  const startedQ = useTasks({
    ...baseParams,
    startedDateRange: { from: periodStart, to: periodEnd },
    enabled: showStarted,
  } as any);
  const finishedQ = useTasks({
    ...baseParams,
    finishedDateRange: { from: periodStart, to: periodEnd },
    enabled: showFinished,
  } as any);

  const isLoading =
    termQ.isLoading ||
    forecastQ.isLoading ||
    startedQ.isLoading ||
    finishedQ.isLoading;
  const isFetching =
    termQ.isFetching ||
    forecastQ.isFetching ||
    startedQ.isFetching ||
    finishedQ.isFetching;

  const onRefresh = () => {
    termQ.refresh?.();
    forecastQ.refresh?.();
    startedQ.refresh?.();
    finishedQ.refresh?.();
  };

  // Build day → events map by walking each query's data.
  const dayEvents = useMemo(() => {
    const map = new Map<string, DayEvent[]>();
    const push = (key: string, ev: DayEvent) => {
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    };
    const slot = (
      tasks: any[] | undefined,
      type: EventType,
      picker: (t: any) => Date | string | null | undefined,
    ) => {
      if (!tasks) return;
      for (const t of tasks) {
        const d = picker(t);
        if (!d) continue;
        const dt = d instanceof Date ? d : new Date(d);
        if (Number.isNaN(dt.getTime())) continue;
        if (dt < periodStart || dt > periodEnd) continue;
        push(toIsoDay(dt), { type, task: t });
      }
    };
    if (showTerm) slot(termQ.data?.data ?? [], "term", (t) => t.term);
    if (showForecast)
      slot(forecastQ.data?.data ?? [], "forecastDate", (t) => t.forecastDate);
    if (showStarted)
      slot(startedQ.data?.data ?? [], "startedAt", (t) => t.startedAt);
    if (showFinished)
      slot(finishedQ.data?.data ?? [], "finishedAt", (t) => t.finishedAt);
    return map;
  }, [
    termQ.data,
    forecastQ.data,
    startedQ.data,
    finishedQ.data,
    periodStart,
    periodEnd,
    showTerm,
    showForecast,
    showStarted,
    showFinished,
  ]);

  // Footer counters — total events of each visible type in the period.
  const stats = useMemo(() => {
    let term = 0;
    let forecast = 0;
    let started = 0;
    let finished = 0;
    for (const evs of dayEvents.values()) {
      for (const e of evs) {
        if (e.type === "term") term++;
        else if (e.type === "forecastDate") forecast++;
        else if (e.type === "startedAt") started++;
        else if (e.type === "finishedAt") finished++;
      }
    }
    return { term, forecast, started, finished };
  }, [dayEvents]);

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  // ----- Per-day cell renderer
  const renderCell = ({ date }: { date: Date }) => {
    const events = dayEvents.get(toIsoDay(date)) ?? [];
    const order: Record<EventType, number> = {
      term: 0,
      forecastDate: 1,
      startedAt: 2,
      finishedAt: 3,
    };
    const sorted = events.slice().sort((a, b) => order[a.type] - order[b.type]);

    const dotColors = sorted.map((ev) => {
      const isOverdueTerm =
        ev.type === "term" &&
        date < today &&
        ev.task?.status !== TASK_STATUS.COMPLETED;
      const token = isOverdueTerm
        ? overdueColor
        : eventColors[ev.type] ?? DEFAULT_EVENT_COLORS[ev.type];
      return resolveCalendarColor(token);
    });

    // Cardinal-rule fix: chrome on outer View, Pressable just a tap surface.
    return (
      <View style={{ flex: 1, overflow: "hidden" }}>
        <Pressable
          onPress={() => openDaySheet(date)}
          android_ripple={{ color: "rgba(0,0,0,0.08)" }}
          style={{ flex: 1, padding: 4 }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: colors.foreground,
              fontVariant: ["tabular-nums"],
            }}
          >
            {date.getDate()}
          </Text>
          {sorted.length > 0 && (
            <View style={{ marginTop: 2 }}>
              <EventDotRow dots={dotColors} max={4} size={5} />
            </View>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <WidgetCard
      title={config.title || "Calendário de Produção"}
      icon={<AccentIcon size={16} color={accent.hex} />}
      headerExtra={
        <PeriodHeader
          refMonth={refMonth}
          onChange={setRefMonth}
          onRefresh={onRefresh}
          isFetching={isFetching}
        />
      }
      viewAllHref={routes.production.schedule.list}
      showHeader={config.display.showHeader ?? true}
      borderColor={borderHexFor(
        config.accent?.borderColor as WidgetBorderColor | undefined,
      )}
      accentColor={accent.hex}
      bodyPadded={false}
    >
      <View style={{ flex: 1, padding: 8, gap: 8 }}>
        <CalendarGrid
          grid={grid}
          renderCell={renderCell}
          weekDayMode="min"
          showSunday={config.display.showSunday}
          showSaturday={config.display.showSaturday}
        />

        {/* Legend tiles — tap to show/hide each event type. */}
        <View style={{ flexDirection: "row", gap: 6 }}>
          <LegendTile
            label="Prazos"
            value={stats.term}
            color={resolveCalendarColor(
              eventColors.term ?? DEFAULT_EVENT_COLORS.term,
            )}
            active={showTerm}
            onPress={() => {
              lightImpactHaptic();
              setShowTerm((v) => !v);
            }}
          />
          <LegendTile
            label="Previsões"
            value={stats.forecast}
            color={resolveCalendarColor(
              eventColors.forecastDate ?? DEFAULT_EVENT_COLORS.forecastDate,
            )}
            active={showForecast}
            onPress={() => {
              lightImpactHaptic();
              setShowForecast((v) => !v);
            }}
          />
          <LegendTile
            label="Iniciadas"
            value={stats.started}
            color={resolveCalendarColor(
              eventColors.startedAt ?? DEFAULT_EVENT_COLORS.startedAt,
            )}
            active={showStarted}
            onPress={() => {
              lightImpactHaptic();
              setShowStarted((v) => !v);
            }}
          />
          <LegendTile
            label="Concluídas"
            value={stats.finished}
            color={resolveCalendarColor(
              eventColors.finishedAt ?? DEFAULT_EVENT_COLORS.finishedAt,
            )}
            active={showFinished}
            onPress={() => {
              lightImpactHaptic();
              setShowFinished((v) => !v);
            }}
          />
        </View>

        {isLoading && (
          <Text
            style={{
              fontSize: 10,
              fontStyle: "italic",
              color: colors.mutedForeground,
              paddingHorizontal: 4,
            }}
          >
            Carregando…
          </Text>
        )}
      </View>

      <DayDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        date={sheetDay}
        events={
          sheetDay
            ? (dayEvents.get(toIsoDay(sheetDay)) ?? []).slice()
            : []
        }
        eventColors={eventColors}
        overdueColor={overdueColor}
        today={today}
        onOpenTask={(taskId) => {
          setSheetOpen(false);
          router.push(routes.production.schedule.details(taskId) as any);
        }}
      />
    </WidgetCard>
  );
}

// ============================================================
// Legend tile — clickable visibility toggle for an event type.
// ============================================================

function LegendTile({
  label,
  value,
  color,
  active,
  onPress,
}: {
  label: string;
  value: number;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  // Cardinal-rule fix: chrome on outer View (border/bg/radius/opacity), Pressable
  // is just a tap surface filling its parent. Pressable's style-function form
  // doesn't reliably apply layout/visual props on iOS.
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        opacity: active ? 1 : 0.45,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        android_ripple={{ color: "rgba(0,0,0,0.08)" }}
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 8,
          paddingVertical: 6,
        }}
      >
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: color,
          }}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 9,
              fontWeight: "500",
              color: colors.mutedForeground,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: colors.foreground,
              fontVariant: ["tabular-nums"],
              lineHeight: 16,
            }}
          >
            {value}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

// ============================================================
// Day detail sheet — events for the tapped day
// ============================================================

const PT_BR_WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;
const PT_BR_MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

function formatDayLabel(d: Date): string {
  return `${PT_BR_WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${PT_BR_MONTHS[d.getMonth()]}`;
}

function DayDetailSheet({
  open,
  onOpenChange,
  date,
  events,
  eventColors,
  overdueColor,
  today,
  onOpenTask,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  events: DayEvent[];
  eventColors: Record<string, string>;
  overdueColor: string;
  today: Date;
  onOpenTask: (taskId: string) => void;
}) {
  const { colors } = useTheme();

  const order: Record<EventType, number> = {
    term: 0,
    forecastDate: 1,
    startedAt: 2,
    finishedAt: 3,
  };
  const sorted = events.slice().sort((a, b) => order[a.type] - order[b.type]);

  return (
    <StandardModal
      visible={open}
      onClose={() => onOpenChange(false)}
      title={date ? formatDayLabel(date) : ""}
      subtitle={
        sorted.length === 0
          ? "Nenhum evento neste dia."
          : `${sorted.length} evento${sorted.length === 1 ? "" : "s"}`
      }
      padded={false}
      bodyStyle={{ paddingHorizontal: 16 }}
    >
          {sorted.map((ev, i) => {
            const isOverdueTerm =
              ev.type === "term" &&
              date != null &&
              date < today &&
              ev.task?.status !== TASK_STATUS.COMPLETED;
            const token = isOverdueTerm
              ? overdueColor
              : eventColors[ev.type] ??
                DEFAULT_EVENT_COLORS[ev.type];
            const dotColor = resolveCalendarColor(token);
            const customerName =
              ev.task?.customer?.fantasyName ??
              ev.task?.customer?.corporateName ??
              null;
            const label = ev.task?.name ?? customerName ?? "—";
            // Cardinal-rule fix: chrome on outer View, Pressable just a tap surface.
            return (
              <View
                key={`${ev.type}-${ev.task?.id}-${i}`}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  overflow: "hidden",
                }}
              >
                <Pressable
                  onPress={() => ev.task?.id && onOpenTask(ev.task.id)}
                  android_ripple={{ color: "rgba(0,0,0,0.08)" }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 12,
                    paddingHorizontal: 4,
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: dotColor,
                    }}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: colors.foreground,
                      }}
                    >
                      {label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 11,
                        color: colors.mutedForeground,
                        marginTop: 2,
                      }}
                    >
                      {EVENT_LABELS[ev.type]}
                      {customerName && label !== customerName
                        ? ` · ${customerName}`
                        : ""}
                      {isOverdueTerm ? "  · vencido" : ""}
                    </Text>
                  </View>
                  <IconChevronRight
                    size={16}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>
            );
          })}
    </StandardModal>
  );
}

// ============================================================
// Config component
// ============================================================

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });
  const setDisplay = <K extends keyof Config["display"]>(
    key: K,
    value: Config["display"][K],
  ) => onChange({ ...config, display: { ...config.display, [key]: value } });
  const setFilters = <K extends keyof Config["filters"]>(
    key: K,
    value: Config["filters"][K],
  ) => onChange({ ...config, filters: { ...config.filters, [key]: value } });

  const eventColors = config.display.eventColors ?? DEFAULT_EVENT_COLORS;
  const setEventColor = (
    key: keyof Config["display"]["eventColors"],
    value: string,
  ) =>
    setDisplay("eventColors", {
      ...(eventColors as Config["display"]["eventColors"]),
      [key]: value,
    });

  const accentColor = (config.accent?.color ?? "indigo") as WidgetAccentColor;
  const accentIcon = (config.accent?.icon ?? "Calendar") as WidgetAccentIcon;
  const accentBorder = (config.accent?.borderColor ?? "none") as WidgetBorderColor;

  const statusOptions = useMemo(
    () =>
      Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
        value,
        label: String(label),
      })),
    [],
  );

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => set("title", v)}
        placeholder="Calendário de Produção"
      />

      <Tabs defaultValue="appearance">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabsList style={{ minWidth: 360 }}>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="display">Exibição</TabsTrigger>
            <TabsTrigger value="filters">Filtros</TabsTrigger>
          </TabsList>
        </ScrollView>

        <TabsContent value="appearance">
          <Section title="Aparência" defaultOpen>
            <AccentPicker
              value={{
                color: accentColor,
                icon: accentIcon,
                borderColor: accentBorder,
              }}
              onChange={(next) => set("accent", next as Config["accent"])}
            />
          </Section>

          <Section title="Cabeçalho">
            <ToggleRow
              label="Exibir cabeçalho"
              checked={config.display.showHeader ?? true}
              onCheckedChange={(v) => setDisplay("showHeader", v)}
            />
          </Section>

          <Section title="Cores dos eventos">
            <ColorTokenRow
              label="Prazo"
              value={eventColors.term ?? DEFAULT_EVENT_COLORS.term}
              onChange={(v) => setEventColor("term", v)}
            />
            <ColorTokenRow
              label="Previsão"
              value={eventColors.forecastDate ?? DEFAULT_EVENT_COLORS.forecastDate}
              onChange={(v) => setEventColor("forecastDate", v)}
            />
            <ColorTokenRow
              label="Iniciada"
              value={eventColors.startedAt ?? DEFAULT_EVENT_COLORS.startedAt}
              onChange={(v) => setEventColor("startedAt", v)}
            />
            <ColorTokenRow
              label="Concluída"
              value={eventColors.finishedAt ?? DEFAULT_EVENT_COLORS.finishedAt}
              onChange={(v) => setEventColor("finishedAt", v)}
            />
            <ColorTokenRow
              label="Vencido"
              value={(eventColors as any).overdue ?? DEFAULT_OVERDUE_COLOR}
              onChange={(v) => setEventColor("overdue" as any, v)}
            />
          </Section>
        </TabsContent>

        <TabsContent value="display">
          <Section title="Tipos de evento" defaultOpen>
            <ToggleRow
              label="Prazo"
              hint="Tarefas com prazo dentro do período."
              checked={config.display.showTerm}
              onCheckedChange={(v) => setDisplay("showTerm", v)}
            />
            <ToggleRow
              label="Previsão"
              hint="Tarefas com data prevista de entrega no período."
              checked={config.display.showForecast}
              onCheckedChange={(v) => setDisplay("showForecast", v)}
            />
            <ToggleRow
              label="Iniciada"
              hint="Tarefas iniciadas dentro do período."
              checked={config.display.showStarted}
              onCheckedChange={(v) => setDisplay("showStarted", v)}
            />
            <ToggleRow
              label="Concluída"
              hint="Tarefas concluídas dentro do período."
              checked={config.display.showFinished}
              onCheckedChange={(v) => setDisplay("showFinished", v)}
            />
          </Section>

          <Section title="Layout">
            <ToggleRow
              label="Mostrar domingo"
              checked={config.display.showSunday}
              onCheckedChange={(v) => setDisplay("showSunday", v)}
            />
            <ToggleRow
              label="Mostrar sábado"
              checked={config.display.showSaturday}
              onCheckedChange={(v) => setDisplay("showSaturday", v)}
            />
            <ToggleRow
              label="Filtros no cabeçalho"
              hint="Reservado — chips de filtro no topo do widget (sem efeito visual no celular)."
              checked={config.display.showFilters}
              onCheckedChange={(v) => setDisplay("showFilters", v)}
            />
          </Section>
        </TabsContent>

        <TabsContent value="filters">
          <Section title="Filtros" defaultOpen>
            <LabeledField label="Status das tarefas">
              <Combobox
                mode="multiple"
                value={config.filters.statuses as unknown as string[]}
                onValueChange={(v: any) =>
                  setFilters(
                    "statuses",
                    Array.isArray(v) ? (v as TASK_STATUS[]) : [],
                  )
                }
                options={statusOptions}
                placeholder="Selecione os status"
              />
            </LabeledField>
            <ToggleRow
              label="Incluir tarefas canceladas"
              checked={config.filters.includeCancelled}
              onCheckedChange={(v) => setFilters("includeCancelled", v)}
            />
          </Section>
        </TabsContent>
      </Tabs>
    </View>
  );
}

// Color-token row — opens a small grid of preset shades.
function ColorTokenRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
      >
        {/* Cardinal-rule fix: chrome on outer View, Pressable just a tap surface. */}
        <View
          style={{
            flex: 1,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            overflow: "hidden",
          }}
        >
          <Pressable
            onPress={() => setOpen((v) => !v)}
            android_ripple={{ color: "rgba(0,0,0,0.08)" }}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                backgroundColor: resolveCalendarColor(value),
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.foreground,
                }}
              >
                {label}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.mutedForeground,
                }}
              >
                {value}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
      {open && (
        <ColorTokenGrid
          value={value}
          onSelect={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      )}
    </View>
  );
}

const COLOR_TOKEN_FAMILIES = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "gray",
] as const;
const COLOR_TOKEN_SHADES = ["500", "600", "700"] as const;

function ColorTokenGrid({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (next: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        padding: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      {COLOR_TOKEN_FAMILIES.flatMap((family) =>
        COLOR_TOKEN_SHADES.map((shade) => {
          const token = `${family}-${shade}`;
          const selected = token === value;
          // Cardinal-rule fix: chrome on outer View, Pressable is a tap surface.
          return (
            <View
              key={token}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                backgroundColor: resolveCalendarColor(token),
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? colors.primary : colors.border,
                overflow: "hidden",
              }}
            >
              <Pressable
                onPress={() => onSelect(token)}
                accessibilityLabel={token}
                style={{ flex: 1 }}
              />
            </View>
          );
        }),
      )}
    </View>
  );
}

// ============================================================
// Definition
// ============================================================

export const productionCalendarWidget: WidgetDefinition<Config> = {
  id: "home.production-calendar",
  name: "Calendário de Produção",
  description:
    "Visão mensal do período (26→25) com tarefas plotadas por prazo, previsão, início e conclusão. Cada tipo de evento tem cor própria e pode ser ativado/desativado.",
  icon: IconCalendarStats,
  category: "production",
  // PRODUCTION (shop-floor) is intentionally excluded — the schedule overview is
  // a managerial view; PRODUCTION_MANAGER keeps access.
  allowedSectors: [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.PLOTTING,
    SECTOR_PRIVILEGES.MAINTENANCE,
  ],
  allowedSpans: [3],
  defaultSpan: 3,
  allowedHeights: [3, 4],
  defaultRows: 3,
  configSchema,
  defaultConfig: {
    title: "Calendário de Produção",
    accent: { color: "indigo", icon: "Calendar" },
    display: {
      showHeader: true,
      showFilters: true,
      showTerm: true,
      showForecast: true,
      showStarted: true,
      showFinished: true,
      showSunday: true,
      showSaturday: true,
      eventColors: {
        term: "purple-600",
        forecastDate: "orange-600",
        startedAt: "blue-600",
        finishedAt: "green-700",
        overdue: "red-700",
      },
    },
    filters: {
      statuses: [
        TASK_STATUS.PREPARATION,
        TASK_STATUS.WAITING_PRODUCTION,
        TASK_STATUS.IN_PRODUCTION,
        TASK_STATUS.COMPLETED,
      ],
      includeCancelled: false,
    },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
