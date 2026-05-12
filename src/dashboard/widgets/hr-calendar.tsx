// HR Calendar widget — monthly view of the Brazilian payroll period (26 → 25)
// rendering vacations / faltas (justified + unjustified) / holidays. Mobile
// counterpart to `web/src/dashboard/widgets/hr-calendar.tsx` (806 lines), built
// against the shared `_calendar-shared.tsx` scaffold (agent 9) and the
// `useSecullumHolidays` / `useUsers` / `useSectors` hooks already on mobile.
//
// IMPORTANT — partial-data caveat (escalated to agent 1):
//   The web widget reads two hooks that are NOT yet ported to mobile:
//     • `useSecullumAggregatedAbsences` — vacations + justified faltas
//     • `useSecullumUnjustifiedAbsences` — synthetic faltas from time-card gaps
//   Until they ship under `mobile/src/hooks/secullum.ts`, this widget falls
//   back to an empty `absences` list (the calendar still renders + holidays
//   still show, the user just doesn't see absences yet). This keeps the
//   widget addable from the gallery so the rest of the dashboard rewrite is
//   demoable, and the day-detail sheet still works for holidays. Replace the
//   local stubs (`useSecullumAggregatedAbsences` / `useSecullumUnjustifiedAbsences`)
//   with real imports the moment they land.
//
// Mobile-specific divergences from web:
//   • No tooltip primitive on RN — tap a day cell opens a bottom Sheet with
//     the full absence/holiday list (matches spec §6.8 "tap a day → detail
//     Sheet").
//   • Inline filters (Colaborador / Setor) are surfaced inside the Sheet's
//     own picker row above the calendar grid when `display.showFilters` is on.
//     The header strip is reserved for period navigation + refresh because
//     it's already cramped on phones.
//   • `viewportWidth/9` cell sizing per spec — the grid is sized by its parent
//     so we just let `_calendar-shared`'s `CalendarGrid` flex naturally.

import { useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  IconCalendar,
  IconX,
  IconBeach,
  IconUserOff,
  IconUserExclamation,
  IconConfetti,
} from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { SECTOR_PRIVILEGES, USER_STATUS } from "@/constants/enums";
import { routes } from "@/constants/routes";
import {
  useSecullumHolidays,
  // NOTE: `useSecullumAggregatedAbsences` and `useSecullumUnjustifiedAbsences`
  // are NOT yet exported from this module — see file header. Do NOT add them
  // back here without first porting their server hooks; they'd throw at
  // import time and crash the whole dashboard.
} from "@/hooks/secullum";
import { useUsers } from "@/hooks/useUser";
import { useSectors } from "@/hooks/useSector";
import { Combobox } from "@/components/ui/combobox";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
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
import {
  Section,
  ToggleRow,
  ConfigTitleInput,
  LabeledField,
} from "./_shared";
import {
  CalendarGrid,
  PeriodHeader,
  buildPeriodGrid,
  defaultRefMonth,
  getPayrollPeriod,
  toIsoDay,
  resolveCalendarColor,
} from "./_calendar-shared";

// ============================================================
// Constants
// ============================================================

const ALL_USERS = "__ALL__";

// ============================================================
// Local stubs for the not-yet-ported absence hooks. Returning the same
// `{ data, isLoading, isFetching, refetch }` shape as the real hooks keeps
// the rest of the render code identical to web — when the real hooks land,
// just delete these and import the real ones.
// ============================================================

interface SecullumAggregatedAbsenceLite {
  Id: number;
  Inicio: string;
  Fim: string;
  JustificativaId: number;
  FuncionarioId?: number;
  userId?: string;
  userName?: string;
}

function useSecullumAggregatedAbsencesStub(_params: {
  startDate: string;
  endDate: string;
  sectorId?: string;
}): {
  data: { data: { data: SecullumAggregatedAbsenceLite[] } } | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
} {
  return {
    data: undefined,
    isLoading: false,
    isFetching: false,
    refetch: () => undefined,
  };
}

function useSecullumUnjustifiedAbsencesStub(_params: {
  startDate: string;
  endDate: string;
  sectorId?: string;
}): {
  data: { data: { data: SecullumAggregatedAbsenceLite[] } } | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
} {
  return {
    data: undefined,
    isLoading: false,
    isFetching: false,
    refetch: () => undefined,
  };
}

// Until the real `getJustificativaCategory` helper ships on mobile, classify
// records by JustificativaId range using the same rule the web helper uses
// (the IDs are documented in the absence calendar docs):
//   1xx → AUSENCIA (vacation / planned leave)
//   2xx → FALTA   (justified or unjustified)
// The widget will be a no-op until the absence hooks land anyway, so even an
// imprecise classification here is fine — replace this when porting.
function classifyJustificativa(id: number): "AUSENCIA" | "FALTA" | "OTHER" {
  if (id >= 100 && id < 200) return "AUSENCIA";
  if (id >= 200 && id < 300) return "FALTA";
  return "OTHER";
}

function isUnjustifiedFalta(rec: SecullumAggregatedAbsenceLite): boolean {
  // Negative-Id sentinel — same invariant as web (server-minted from time-card gaps).
  return rec.Id < 0;
}

function getAbsencesForDay(
  absences: SecullumAggregatedAbsenceLite[],
  day: Date,
): SecullumAggregatedAbsenceLite[] {
  const dKey = toIsoDay(day);
  return absences.filter((a) => {
    const start = String(a.Inicio).substring(0, 10);
    const end = String(a.Fim).substring(0, 10);
    return dKey >= start && dKey <= end;
  });
}

function getHolidaysForDay(holidays: any[], day: Date): any[] {
  const dKey = toIsoDay(day);
  return holidays.filter((h) => {
    const raw = h.Data || h.data || h.date;
    if (!raw) return false;
    return String(raw).substring(0, 10) === dKey;
  });
}

// ============================================================
// Config schema
// ============================================================

const hrCalendarConfigSchema = z.object({
  title: z.string().min(1).max(80).default("Calendário de Colaboradores"),
  accent: makeAccentSchema({
    color: "violet",
    icon: "Calendar",
    borderColor: "none",
  }),
  display: z
    .object({
      showHeader: z.boolean().default(true),
      showFilters: z.boolean().default(true),
      showVacation: z.boolean().default(true),
      showJustifiedFalta: z.boolean().default(true),
      showUnjustifiedFalta: z.boolean().default(true),
      showHoliday: z.boolean().default(true),
      showSunday: z.boolean().default(true),
      showSaturday: z.boolean().default(true),
    })
    .default({
      showHeader: true,
      showFilters: true,
      showVacation: true,
      showJustifiedFalta: true,
      showUnjustifiedFalta: true,
      showHoliday: true,
      showSunday: true,
      showSaturday: true,
    }),
  filters: z
    .object({
      defaultUserId: z.string().default(ALL_USERS),
      defaultSectorId: z.string().nullable().default(null),
    })
    .default({ defaultUserId: ALL_USERS, defaultSectorId: null }),
});
type HrCalendarConfig = z.infer<typeof hrCalendarConfigSchema>;

// ============================================================
// Render
// ============================================================

function HrCalendarRender({ config }: WidgetRenderProps<HrCalendarConfig>) {
  const { colors, isDark } = useTheme();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const HeaderIcon = accent.Icon;

  const [refMonth, setRefMonth] = useState<Date>(() => defaultRefMonth());
  const [selectedUserId, setSelectedUserId] = useState<string>(
    config.filters.defaultUserId || ALL_USERS,
  );
  const [sectorId, setSectorId] = useState<string | undefined>(
    config.filters.defaultSectorId ?? undefined,
  );
  const [openDay, setOpenDay] = useState<Date | null>(null);

  const grid = useMemo(() => buildPeriodGrid(refMonth), [refMonth]);
  const { start: periodStart, end: periodEnd } = useMemo(
    () => getPayrollPeriod(refMonth),
    [refMonth],
  );
  const startStr = toIsoDay(periodStart);
  const endStr = toIsoDay(periodEnd);

  // ---- Data hooks (with stubs for not-yet-ported absence hooks) ----
  const aggregated = useSecullumAggregatedAbsencesStub({
    startDate: startStr,
    endDate: endStr,
    sectorId,
  });
  const unjustified = useSecullumUnjustifiedAbsencesStub({
    startDate: startStr,
    endDate: endStr,
    sectorId,
  });
  const {
    data: holidaysData,
    isLoading: holidaysLoading,
  } = useSecullumHolidays({
    year: refMonth.getFullYear(),
    month: refMonth.getMonth() + 1,
  });

  const { data: usersData, isLoading: usersLoading } = useUsers({
    where: {
      status: {
        in: [
          USER_STATUS.EXPERIENCE_PERIOD_1,
          USER_STATUS.EXPERIENCE_PERIOD_2,
          USER_STATUS.EFFECTED,
        ],
      },
      secullumEmployeeId: { not: null },
    },
    orderBy: { name: "asc" },
    take: 100,
  } as any);

  const { data: sectorsData } = useSectors({
    orderBy: { name: "asc" },
    take: 100,
  } as any);

  const isLoading =
    aggregated.isLoading || unjustified.isLoading || holidaysLoading;

  // Resolve the selected user's Secullum funcionarioId so we can match
  // records tagged with the FuncionarioId form (mirrors web behaviour).
  const selectedUserSecullumId = useMemo<number | null>(() => {
    if (selectedUserId === ALL_USERS) return null;
    const u: any = (usersData?.data ?? []).find(
      (x: any) => x.id === selectedUserId,
    );
    return u?.secullumEmployeeId ?? null;
  }, [usersData, selectedUserId]);

  const absences: SecullumAggregatedAbsenceLite[] = useMemo(() => {
    const unwrap = (d: any): SecullumAggregatedAbsenceLite[] => {
      const root: any = d?.data;
      if (Array.isArray(root)) return root;
      if (root && Array.isArray(root.data)) return root.data;
      return [];
    };
    let all = [...unwrap(aggregated.data), ...unwrap(unjustified.data)];
    if (selectedUserId !== ALL_USERS) {
      all = all.filter(
        (a) =>
          a.userId === selectedUserId ||
          (selectedUserSecullumId != null &&
            a.FuncionarioId === selectedUserSecullumId),
      );
    }
    all = all.filter((a) => {
      const cat = classifyJustificativa(a.JustificativaId);
      if (cat === "AUSENCIA") return config.display.showVacation;
      if (cat === "FALTA")
        return isUnjustifiedFalta(a)
          ? config.display.showUnjustifiedFalta
          : config.display.showJustifiedFalta;
      return true;
    });
    return all;
  }, [
    aggregated.data,
    unjustified.data,
    selectedUserId,
    selectedUserSecullumId,
    config.display.showVacation,
    config.display.showJustifiedFalta,
    config.display.showUnjustifiedFalta,
  ]);

  const holidays: any[] = useMemo(() => {
    if (!config.display.showHoliday) return [];
    const root: any = holidaysData?.data;
    if (Array.isArray(root)) return root;
    if (root && Array.isArray(root.data)) return root.data;
    return [];
  }, [holidaysData, config.display.showHoliday]);

  const userOptions = useMemo(() => {
    const arr = usersData?.data ?? [];
    return [
      { value: ALL_USERS, label: "Todos os colaboradores" },
      ...arr.map((u: any) => ({ value: u.id, label: u.name })),
    ];
  }, [usersData]);
  const sectorOptions = useMemo(
    () =>
      (sectorsData?.data ?? []).map((s: any) => ({ value: s.id, label: s.name })),
    [sectorsData],
  );

  // ---- Header period navigator (shared with production-calendar) ----
  const headerExtra = (
    <PeriodHeader
      refMonth={refMonth}
      onChange={(d) => {
        lightImpactHaptic();
        setRefMonth(d);
      }}
    />
  );

  // ---- Per-day cell renderer ----
  const renderCell = ({ date, isWeekend }: { date: Date; isWeekend: boolean }) => {
    const dayAbsences = getAbsencesForDay(absences, date);
    const dayHolidays = getHolidaysForDay(holidays, date);
    const isHoliday = dayHolidays.length > 0;
    const visibleAbsences = isHoliday || isWeekend ? [] : dayAbsences;
    const dayNum = format(date, "d");

    return (
      // Outer-View chrome pattern: all layout/visual props on the View;
      // Pressable inside owns only the tap surface. Pressable's style
      // function on iOS doesn't reliably apply flex/layout props.
      <View style={{ flex: 1, padding: 3 }}>
        <Pressable
          onPress={() => {
            lightImpactHaptic();
            setOpenDay(date);
          }}
          android_ripple={{ color: "rgba(0,0,0,0.08)" }}
          style={{ flex: 1 }}
        >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: colors.foreground,
            fontVariant: ["tabular-nums"],
          }}
        >
          {dayNum}
        </Text>
        {/* Compact event indicators — colored dots on phone since text bars
         *  don't fit inside ~40px-wide day cells. The detail Sheet shows the
         *  full label list. */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 2,
            marginTop: 2,
          }}
        >
          {dayHolidays.length > 0 && (
            <Dot color={categoryHex("HOLIDAY", isDark)} />
          )}
          {visibleAbsences.slice(0, 4).map((a, i) => {
            const cat = classifyJustificativa(a.JustificativaId);
            const tone =
              cat === "AUSENCIA"
                ? "VACATION"
                : isUnjustifiedFalta(a)
                  ? "FALTA_UNJ"
                  : "FALTA_JUST";
            return <Dot key={`${a.Id}-${i}`} color={categoryHex(tone, isDark)} />;
          })}
          {visibleAbsences.length > 4 && (
            <Text
              style={{
                fontSize: 8,
                color: colors.mutedForeground,
                marginLeft: 2,
              }}
            >
              +{visibleAbsences.length - 4}
            </Text>
          )}
        </View>
        </Pressable>
      </View>
    );
  };

  // ---- Footer summary chips ----
  const stats = useMemo(() => {
    const holidayKeys = new Set(
      holidays
        .map((h: any) =>
          String(h.Data || h.data || h.date || "").substring(0, 10),
        )
        .filter(Boolean),
    );
    let vacation = 0;
    let justified = 0;
    let unjustifiedCount = 0;
    let holidayCount = holidayKeys.size;
    for (const a of absences) {
      const cat = classifyJustificativa(a.JustificativaId);
      if (cat !== "AUSENCIA" && cat !== "FALTA") continue;
      if (cat === "AUSENCIA") vacation++;
      else if (isUnjustifiedFalta(a)) unjustifiedCount++;
      else justified++;
    }
    return { vacation, justified, unjustified: unjustifiedCount, holiday: holidayCount };
  }, [absences, holidays]);

  return (
    <WidgetCard
      title={config.title || "Calendário de Colaboradores"}
      icon={<HeaderIcon size={16} color={accent.hex} />}
      headerExtra={headerExtra}
      viewAllHref={routes.humanResources.holidays.calendar}
      showHeader={config.display.showHeader ?? true}
      accentColor={accent.hex}
      borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      bodyPadded={false}
    >
      <View style={{ flex: 1, padding: 8, gap: 6 }}>
        {/* Optional inline filter strip — collapses gracefully on narrow tiles. */}
        {config.display.showFilters && (
          <View
            style={{
              flexDirection: "row",
              gap: 6,
            }}
          >
            <View style={{ flex: 1 }}>
              <Combobox
                options={userOptions}
                value={selectedUserId}
                onValueChange={(v: any) =>
                  setSelectedUserId(
                    (Array.isArray(v) ? v[0] : v) || ALL_USERS,
                  )
                }
                placeholder={
                  usersLoading ? "Carregando..." : "Colaborador"
                }
                searchable
                disabled={usersLoading}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Combobox
                options={sectorOptions}
                value={sectorId ?? ""}
                onValueChange={(v: any) =>
                  setSectorId((Array.isArray(v) ? v[0] : v) || undefined)
                }
                placeholder="Setor"
                searchable
              />
            </View>
          </View>
        )}

        <CalendarGrid
          grid={grid}
          renderCell={renderCell}
          weekDayMode="min"
          showSunday={config.display.showSunday}
          showSaturday={config.display.showSaturday}
        />

        {/* Footer summary — counts mirror the full HR page tiles */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 6,
            paddingHorizontal: 2,
          }}
        >
          {config.display.showVacation && (
            <SummaryChip
              icon={IconBeach}
              color={categoryHex("VACATION", isDark)}
              label="Férias"
              value={stats.vacation}
            />
          )}
          {config.display.showJustifiedFalta && (
            <SummaryChip
              icon={IconUserOff}
              color={categoryHex("FALTA_JUST", isDark)}
              label="Just."
              value={stats.justified}
            />
          )}
          {config.display.showUnjustifiedFalta && (
            <SummaryChip
              icon={IconUserExclamation}
              color={categoryHex("FALTA_UNJ", isDark)}
              label="N.J."
              value={stats.unjustified}
            />
          )}
          {config.display.showHoliday && (
            <SummaryChip
              icon={IconConfetti}
              color={categoryHex("HOLIDAY", isDark)}
              label="Feriados"
              value={stats.holiday}
            />
          )}
          {isLoading && (
            <Text
              style={{
                fontSize: 10,
                fontStyle: "italic",
                color: colors.mutedForeground,
              }}
            >
              Carregando…
            </Text>
          )}
        </View>
      </View>

      {/* Day detail sheet — surfaces holidays + absences for the tapped day. */}
      <DayDetailSheet
        day={openDay}
        absences={openDay ? getAbsencesForDay(absences, openDay) : []}
        holidays={openDay ? getHolidaysForDay(holidays, openDay) : []}
        onClose={() => setOpenDay(null)}
      />
    </WidgetCard>
  );
}

// ============================================================
// Sub-components
// ============================================================

function Dot({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: color,
      }}
    />
  );
}

function SummaryChip({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  label: string;
  value: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
      }}
    >
      <Icon size={12} color={color} />
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 10,
          color: colors.mutedForeground,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// Category color tokens — resolved through `resolveCalendarColor` (the same
// helper the production-calendar uses) so widget-level palettes are
// expressed as `family-shade` strings, NOT raw hexes. Mirrors the web
// counterpart's `bg-purple-600 / bg-amber-600 / bg-red-700 / bg-cyan-600`
// classes.
const CATEGORY_TOKENS = {
  VACATION: { light: "purple-600", dark: "purple-300" },
  FALTA_JUST: { light: "amber-600", dark: "amber-300" },
  FALTA_UNJ: { light: "red-700", dark: "red-300" },
  HOLIDAY: { light: "cyan-600", dark: "cyan-300" },
} as const;

function categoryHex(
  cat: keyof typeof CATEGORY_TOKENS,
  isDark: boolean,
): string {
  const t = CATEGORY_TOKENS[cat];
  return resolveCalendarColor(isDark ? t.dark : t.light);
}

// ============================================================
// Day detail sheet — shows absences and holidays for the tapped day
// ============================================================

function DayDetailSheet({
  day,
  absences,
  holidays,
  onClose,
}: {
  day: Date | null;
  absences: SecullumAggregatedAbsenceLite[];
  holidays: any[];
  onClose: () => void;
}) {
  const { colors, isDark } = useTheme();
  const open = day != null;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      snapPoints={[60]}
      backdropOpacity={0.45}
    >
      <SheetHeader>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.foreground,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {day
              ? format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })
              : ""}
          </Text>
          {/* Outer-View chrome pattern: width/height/radius live on the
           *  View, Pressable owns only the tap surface so iOS-style-function
           *  layout bugs are sidestepped. */}
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              android_ripple={{ color: "rgba(0,0,0,0.08)" }}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconX size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
      </SheetHeader>
      <SheetContent>
        <ScrollView
          contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {holidays.length === 0 && absences.length === 0 ? (
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                textAlign: "center",
                paddingVertical: 32,
              }}
            >
              Nenhum evento neste dia.
            </Text>
          ) : (
            <>
              {holidays.map((h: any, i: number) => (
                <View
                  key={`h${i}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    padding: 10,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: categoryHex("HOLIDAY", isDark),
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.foreground,
                      flex: 1,
                    }}
                  >
                    {h.Descricao || h.descricao || "Feriado"}
                  </Text>
                </View>
              ))}
              {absences.map((a, i) => {
                const cat = classifyJustificativa(a.JustificativaId);
                const tone =
                  cat === "AUSENCIA"
                    ? "VACATION"
                    : isUnjustifiedFalta(a)
                      ? "FALTA_UNJ"
                      : "FALTA_JUST";
                const labels: Record<string, string> = {
                  VACATION: "Férias / Ausência",
                  FALTA_JUST: "Falta justificada",
                  FALTA_UNJ: "Falta não justificada",
                };
                return (
                  <View
                    key={`a${a.Id}-${i}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      padding: 10,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: categoryHex(tone, isDark),
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: colors.foreground,
                        }}
                        numberOfLines={1}
                      >
                        {a.userName ?? "—"}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.mutedForeground,
                        }}
                      >
                        {labels[tone] ?? `#${a.JustificativaId}`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// Config component
// ============================================================

function HrCalendarConfigComponent({
  config,
  onChange,
}: WidgetConfigProps<HrCalendarConfig>) {
  const set = <K extends keyof HrCalendarConfig>(
    key: K,
    value: HrCalendarConfig[K],
  ) => onChange({ ...config, [key]: value });
  const setDisplay = <K extends keyof HrCalendarConfig["display"]>(
    key: K,
    value: HrCalendarConfig["display"][K],
  ) =>
    onChange({
      ...config,
      display: { ...config.display, [key]: value },
    });
  const setFilters = <K extends keyof HrCalendarConfig["filters"]>(
    key: K,
    value: HrCalendarConfig["filters"][K],
  ) =>
    onChange({
      ...config,
      filters: { ...config.filters, [key]: value },
    });

  const { data: usersData } = useUsers({
    where: {
      status: {
        in: [
          USER_STATUS.EXPERIENCE_PERIOD_1,
          USER_STATUS.EXPERIENCE_PERIOD_2,
          USER_STATUS.EFFECTED,
        ],
      },
      secullumEmployeeId: { not: null },
    },
    orderBy: { name: "asc" },
    take: 100,
  } as any);
  const { data: sectorsData } = useSectors({
    orderBy: { name: "asc" },
    take: 100,
  } as any);

  const userOptions = useMemo(
    () => [
      { value: ALL_USERS, label: "Todos os colaboradores" },
      ...((usersData?.data ?? []).map((u: any) => ({
        value: u.id,
        label: u.name,
      }))),
    ],
    [usersData],
  );
  const sectorOptions = useMemo(
    () =>
      (sectorsData?.data ?? []).map((s: any) => ({ value: s.id, label: s.name })),
    [sectorsData],
  );

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => set("title", v)}
        placeholder="Calendário de Colaboradores"
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
                color: (config.accent?.color ?? "violet") as WidgetAccentColor,
                icon: (config.accent?.icon ?? "Calendar") as WidgetAccentIcon,
                borderColor:
                  (config.accent?.borderColor ?? "none") as any,
              }}
              onChange={(next) => set("accent", next as HrCalendarConfig["accent"])}
            />
          </Section>

          <Section title="Cabeçalho">
            <ToggleRow
              label="Exibir cabeçalho"
              checked={config.display.showHeader}
              onCheckedChange={(v) => setDisplay("showHeader", v)}
            />
            <ToggleRow
              label="Filtros no painel"
              hint="Mostra os seletores de colaborador e setor acima do calendário."
              checked={config.display.showFilters}
              onCheckedChange={(v) => setDisplay("showFilters", v)}
            />
          </Section>
        </TabsContent>

        <TabsContent value="display">
          <Section title="Categorias visíveis" defaultOpen>
            <ToggleRow
              label="Férias / Ausência"
              checked={config.display.showVacation}
              onCheckedChange={(v) => setDisplay("showVacation", v)}
            />
            <ToggleRow
              label="Faltas justificadas"
              checked={config.display.showJustifiedFalta}
              onCheckedChange={(v) => setDisplay("showJustifiedFalta", v)}
            />
            <ToggleRow
              label="Faltas não justificadas"
              checked={config.display.showUnjustifiedFalta}
              onCheckedChange={(v) => setDisplay("showUnjustifiedFalta", v)}
            />
            <ToggleRow
              label="Feriados"
              checked={config.display.showHoliday}
              onCheckedChange={(v) => setDisplay("showHoliday", v)}
            />
          </Section>

          <Section title="Layout do grid">
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
          </Section>
        </TabsContent>

        <TabsContent value="filters">
          <Section title="Filtros padrão">
            <LabeledField label="Colaborador padrão">
              <Combobox
                options={userOptions}
                value={config.filters.defaultUserId}
                onValueChange={(v: any) =>
                  setFilters(
                    "defaultUserId",
                    (Array.isArray(v) ? v[0] : v) || ALL_USERS,
                  )
                }
                placeholder="Todos os colaboradores"
                searchable
              />
            </LabeledField>
            <LabeledField label="Setor padrão">
              <Combobox
                options={sectorOptions}
                value={config.filters.defaultSectorId ?? ""}
                onValueChange={(v: any) => {
                  const next = (Array.isArray(v) ? v[0] : v) || "";
                  setFilters("defaultSectorId", next || null);
                }}
                placeholder="Todos os setores"
                searchable
              />
            </LabeledField>
          </Section>
        </TabsContent>
      </Tabs>
    </View>
  );
}

// ============================================================
// Definition
// ============================================================

export const hrCalendarWidget: WidgetDefinition<HrCalendarConfig> = {
  id: "home.hr-calendar",
  name: "Calendário de Colaboradores",
  description:
    "Visão mensal do período (26→25) com férias, faltas (justificadas e não justificadas) e feriados. Toque em um dia para ver os eventos.",
  icon: IconCalendar,
  category: "hr",
  // Mirrors web allowedSectors.
  allowedSectors: [
    SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
  ],
  // Per spec §6.8: span [3] only on phones; rows [3, 4] (calendar grid
  // doesn't fit at smaller heights — 6 weeks × 7 cols needs ~452px+).
  allowedSpans: [3],
  defaultSpan: 3,
  allowedHeights: [3, 4],
  defaultRows: 3,
  configSchema: hrCalendarConfigSchema,
  defaultConfig: {
    title: "Calendário de Colaboradores",
    accent: { color: "violet", icon: "Calendar", borderColor: "none" },
    display: {
      showHeader: true,
      showFilters: true,
      showVacation: true,
      showJustifiedFalta: true,
      showUnjustifiedFalta: true,
      showHoliday: true,
      showSunday: true,
      showSaturday: true,
    },
    filters: {
      defaultUserId: ALL_USERS,
      defaultSectorId: null,
    },
  },
  RenderComponent: HrCalendarRender,
  ConfigComponent: HrCalendarConfigComponent,
};
