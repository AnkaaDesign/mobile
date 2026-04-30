import { useCallback, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Stack } from "expo-router";
import {
  IconCalendarDollar,
  IconPlus,
  IconTrash,
  IconUsers,
  IconAlertTriangle,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView, ThemedText } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import { useUsers } from "@/hooks/useUser";
import { getUsers } from "@/api-client";
import { formatCurrency } from "@/utils";
import { useScreenReady } from "@/hooks/use-screen-ready";

import {
  OVERTIME_DAY_TYPE,
  OVERTIME_DAY_TYPE_LABELS,
  OVERTIME_MULTIPLIERS,
  STANDARD_WORKDAY,
  type OvertimeDayType,
} from "@/constants/overtime-multipliers";
import {
  computeOvertimeRowCost,
  computeTotalOvertimeCost,
  getHourlyRate,
  getMonthlyDivisor,
  getPositionMonthlySalary,
  parseHHMMtoDecimal,
} from "@/utils/overtime-cost";

interface OvertimeRow {
  rowKey: string;
  userId: string;
  userName: string;
  positionName: string | null;
  monthlySalary: number | null;
  hoursInput: string;
  dayType: OvertimeDayType;
}

const PRICE_DASH = "—";

const newRowKey = () =>
  `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Format a number of decimal hours back into HH:MM for display.
function formatDecimalHoursToHHMM(decimal: number): string {
  if (!Number.isFinite(decimal) || decimal < 0) return "00:00";
  const totalMinutes = Math.round(decimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Mask raw user input for an HH:MM field. Strips non-digits, keeps up to 4
// digits, and inserts a colon after the hour pair. Allows clearing.
function maskHHMM(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

// Convert a multiplier (1.5) to a "+50%" label for display.
function formatBonusPercent(multiplier: number): string {
  const pct = Math.round((multiplier - 1) * 100);
  return `+${pct}%`;
}

const DAY_TYPE_OPTIONS: ComboboxOption[] = (
  Object.keys(OVERTIME_DAY_TYPE_LABELS) as OvertimeDayType[]
).map((key) => ({
  value: key,
  label: `${OVERTIME_DAY_TYPE_LABELS[key]} (${formatBonusPercent(
    OVERTIME_MULTIPLIERS[key],
  )})`,
}));

export default function OvertimeCostCalculatorScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  useScreenReady();

  // Globals
  const [workdayInput, setWorkdayInput] = useState<string>(STANDARD_WORKDAY);

  // Rows
  const [rows, setRows] = useState<OvertimeRow[]>([]);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  // Fetch the pending user with full position + monetary values
  const { data: pendingUserResponse, isFetching: pendingUserLoading } = useUsers(
    {
      where: pendingUserId ? { id: pendingUserId } : undefined,
      include: {
        position: {
          include: {
            monetaryValues: true,
            remunerations: true,
          },
        },
      },
    },
    { enabled: !!pendingUserId },
  );

  // Combobox async query for users
  const queryUsers = useCallback(
    async (searchTerm: string, page = 1) => {
      try {
        const pageSize = 50;
        const existingIds = new Set(rows.map((r) => r.userId));
        const response = await getUsers({
          take: pageSize,
          skip: (page - 1) * pageSize,
          where: {
            isActive: true,
            ...(searchTerm
              ? {
                  OR: [
                    { name: { contains: searchTerm, mode: "insensitive" } },
                    { email: { contains: searchTerm, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          orderBy: { name: "asc" },
          include: {
            position: true,
          },
        });

        const users = response.data ?? [];
        const total = response.meta?.totalRecords ?? 0;
        const hasMore = page * pageSize < total;

        return {
          data: users
            .filter((u: any) => !existingIds.has(u.id))
            .map((u: any) => ({
              value: u.id,
              label: u.name,
              description: u.position?.name ?? "Sem cargo",
            })) as ComboboxOption[],
          hasMore,
          total,
        };
      } catch (error) {
        if (__DEV__) {
          console.error("Erro ao buscar usuários:", error);
        }
        return { data: [], hasMore: false };
      }
    },
    [rows],
  );

  const handleAddPendingUser = useCallback(() => {
    const user = (pendingUserResponse?.data as any[] | undefined)?.[0];
    if (!user) return;

    const monthlySalary = getPositionMonthlySalary(user.position ?? null);

    const row: OvertimeRow = {
      rowKey: newRowKey(),
      userId: user.id,
      userName: user.name,
      positionName: user.position?.name ?? null,
      monthlySalary,
      hoursInput: "",
      dayType: OVERTIME_DAY_TYPE.WEEKDAY,
    };
    setRows((prev) => [...prev, row]);
    setPendingUserId(null);
  }, [pendingUserResponse]);

  const handleRemoveRow = (rowKey: string) =>
    setRows((prev) => prev.filter((r) => r.rowKey !== rowKey));

  const handleHoursChange = (rowKey: string, raw: string) => {
    const masked = maskHHMM(raw);
    setRows((prev) =>
      prev.map((r) => (r.rowKey === rowKey ? { ...r, hoursInput: masked } : r)),
    );
  };

  const handleDayTypeChange = (rowKey: string, dayType: OvertimeDayType) => {
    setRows((prev) =>
      prev.map((r) => (r.rowKey === rowKey ? { ...r, dayType } : r)),
    );
  };

  const handleClearAll = () => setRows([]);

  // Derived: workday decimal + monthly divisor
  const workdayDecimal = useMemo(() => parseHHMMtoDecimal(workdayInput), [workdayInput]);
  const monthlyDivisor = useMemo(
    () => (workdayDecimal != null ? getMonthlyDivisor(workdayDecimal) : 0),
    [workdayDecimal],
  );

  // Derived: row costs
  const rowCosts = useMemo(
    () =>
      rows.map((r) => {
        const hoursDecimal = parseHHMMtoDecimal(r.hoursInput);
        if (hoursDecimal == null || workdayDecimal == null) return null;
        return computeOvertimeRowCost({
          monthlySalary: r.monthlySalary,
          workdayDecimal,
          hoursDecimal,
          dayType: r.dayType,
        });
      }),
    [rows, workdayDecimal],
  );

  const totalCost = useMemo(() => computeTotalOvertimeCost(rowCosts), [rowCosts]);
  const validRowCount = rowCosts.filter((c) => c !== null).length;
  const invalidRowCount = rows.length - validRowCount;

  const formatHours = (decimal: number) =>
    `${decimal.toFixed(2).replace(".", ",")} h`;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Custo de Horas Extras",
          headerShown: true,
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Total card (top, prominent) */}
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.titleRow}>
                <IconCalendarDollar size={20} color={colors.foreground} />
                <CardTitle>Custo total estimado</CardTitle>
              </View>
              <CardDescription>
                Cálculo de horas extras para metalúrgicos (Sindicato Metalúrgicos / CLT Art. 64).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View
                style={[
                  styles.totalBox,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <ThemedText style={styles.totalValue}>
                  {formatCurrency(totalCost)}
                </ThemedText>
                <ThemedText
                  style={[styles.totalCaption, { color: colors.mutedForeground }]}
                >
                  {validRowCount} de {rows.length} colaborador(es) com cálculo válido
                </ThemedText>
              </View>
            </CardContent>
          </Card>

          {/* Workday + Add card */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Jornada e colaboradores</CardTitle>
              <CardDescription>
                Defina a jornada padrão e adicione colaboradores à lista.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View style={styles.field}>
                <ThemedText style={styles.label}>Jornada Padrão (HH:MM)</ThemedText>
                <Input
                  type="text"
                  value={workdayInput}
                  onChange={(v) => setWorkdayInput(maskHHMM(String(v ?? "")))}
                  placeholder="08:45"
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <ThemedText
                  style={[styles.hintSmall, { color: colors.mutedForeground }]}
                >
                  Divisor mensal = jornada × 30 (CLT Art. 64).
                </ThemedText>
                <ThemedText
                  style={[styles.hintEmphasis, { color: colors.foreground }]}
                >
                  Divisor mensal:{" "}
                  {workdayDecimal != null && monthlyDivisor > 0
                    ? formatHours(monthlyDivisor)
                    : PRICE_DASH}
                </ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.field}>
                <ThemedText style={styles.label}>Adicionar colaborador</ThemedText>
                <Combobox
                  async
                  queryKey={[
                    "overtime-cost",
                    "user-search",
                    rows.map((r) => r.userId).sort().join(","),
                  ]}
                  queryFn={queryUsers}
                  minSearchLength={0}
                  pageSize={50}
                  debounceMs={300}
                  loadOnMount
                  value={pendingUserId ?? undefined}
                  onValueChange={(v) => {
                    const next = Array.isArray(v) ? v[0] : v;
                    setPendingUserId(next ? String(next) : null);
                  }}
                  placeholder="Buscar colaborador..."
                  emptyText="Nenhum colaborador encontrado"
                  searchable
                  clearable
                />
                <Button
                  onPress={handleAddPendingUser}
                  disabled={!pendingUserId || pendingUserLoading}
                  icon={<IconPlus size={18} color={colors.primaryForeground} />}
                  style={styles.addBtn}
                >
                  Adicionar
                </Button>
                <ThemedText
                  style={[styles.hintSmall, { color: colors.mutedForeground }]}
                >
                  O salário mensal é congelado quando o colaborador é adicionado.
                </ThemedText>
              </View>
            </CardContent>
          </Card>

          {/* Rows list card */}
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.titleRow}>
                <IconUsers size={18} color={colors.foreground} />
                <CardTitle>Colaboradores ({rows.length})</CardTitle>
              </View>
              <CardDescription>
                {invalidRowCount > 0
                  ? `${invalidRowCount} sem horas/cargo válidos — não entram no total.`
                  : "Edite horas extras e tipo de dia por linha."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconUsers size={48} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
                  <ThemedText
                    style={[styles.emptyText, { color: colors.mutedForeground }]}
                  >
                    Nenhum colaborador adicionado.
                  </ThemedText>
                </View>
              ) : (
                rows.map((row, idx) => {
                  const cost = rowCosts[idx];
                  const hourly =
                    row.monthlySalary !== null && workdayDecimal != null
                      ? getHourlyRate(row.monthlySalary, workdayDecimal)
                      : null;
                  const hoursDecimal = parseHHMMtoDecimal(row.hoursInput);
                  const isInvalidUser = row.monthlySalary === null;
                  const isInvalidHours =
                    row.hoursInput.length > 0 && hoursDecimal == null;
                  const isInvalid = isInvalidUser || isInvalidHours;

                  return (
                    <View
                      key={row.rowKey}
                      style={[
                        styles.rowCard,
                        {
                          backgroundColor: colors.muted,
                          borderColor: isInvalid ? colors.destructive : colors.border,
                        },
                      ]}
                    >
                      <View style={styles.rowHeader}>
                        <View style={styles.rowNameWrap}>
                          {isInvalidUser && (
                            <IconAlertTriangle
                              size={16}
                              color={colors.destructive}
                            />
                          )}
                          <ThemedText style={styles.rowName} numberOfLines={1}>
                            {row.userName}
                          </ThemedText>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveRow(row.rowKey)}
                          accessibilityLabel="Remover colaborador"
                          style={styles.rowRemove}
                        >
                          <IconTrash size={18} color={colors.destructive} />
                        </TouchableOpacity>
                      </View>

                      <ThemedText
                        style={[styles.rowPosition, { color: colors.mutedForeground }]}
                      >
                        {row.positionName ?? "Sem cargo"}
                      </ThemedText>

                      <View style={styles.rowPriceLine}>
                        <View style={styles.priceCell}>
                          <ThemedText
                            style={[styles.priceLabel, { color: colors.mutedForeground }]}
                          >
                            Salário (mês)
                          </ThemedText>
                          <ThemedText style={styles.priceValue}>
                            {row.monthlySalary !== null
                              ? formatCurrency(row.monthlySalary)
                              : PRICE_DASH}
                          </ThemedText>
                        </View>
                        <View style={styles.priceCell}>
                          <ThemedText
                            style={[styles.priceLabel, { color: colors.mutedForeground }]}
                          >
                            Valor/H
                          </ThemedText>
                          <ThemedText style={styles.priceValue}>
                            {hourly !== null && hourly > 0
                              ? formatCurrency(hourly)
                              : PRICE_DASH}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.rowInputsLine}>
                        <View style={styles.rowInputCell}>
                          <ThemedText
                            style={[styles.priceLabel, { color: colors.mutedForeground }]}
                          >
                            Horas Extras (HH:MM)
                          </ThemedText>
                          <Input
                            type="text"
                            value={row.hoursInput}
                            onChange={(v) =>
                              handleHoursChange(row.rowKey, String(v ?? ""))
                            }
                            placeholder="00:00"
                            keyboardType="number-pad"
                            maxLength={5}
                            error={isInvalidHours}
                          />
                        </View>
                        <View style={styles.rowInputCell}>
                          <ThemedText
                            style={[styles.priceLabel, { color: colors.mutedForeground }]}
                          >
                            Tipo de dia
                          </ThemedText>
                          <Combobox
                            options={DAY_TYPE_OPTIONS}
                            value={row.dayType}
                            onValueChange={(v) => {
                              const next = Array.isArray(v) ? v[0] : v;
                              if (next) {
                                handleDayTypeChange(row.rowKey, next as OvertimeDayType);
                              }
                            }}
                            searchable={false}
                            clearable={false}
                            placeholder="Selecionar"
                          />
                        </View>
                      </View>

                      <View
                        style={[styles.rowTotalLine, { borderTopColor: colors.border }]}
                      >
                        <View style={styles.rowTotalLeft}>
                          <ThemedText
                            style={[styles.priceLabel, { color: colors.mutedForeground }]}
                          >
                            Total
                          </ThemedText>
                          {hoursDecimal != null && hoursDecimal > 0 && (
                            <ThemedText
                              style={[styles.rowTotalSub, { color: colors.mutedForeground }]}
                            >
                              {formatDecimalHoursToHHMM(hoursDecimal)} ·{" "}
                              {formatBonusPercent(
                                OVERTIME_MULTIPLIERS[row.dayType],
                              )}
                            </ThemedText>
                          )}
                        </View>
                        <ThemedText style={styles.rowTotalValue}>
                          {cost !== null ? formatCurrency(cost) : PRICE_DASH}
                        </ThemedText>
                      </View>
                    </View>
                  );
                })
              )}
            </CardContent>
          </Card>

          {rows.length > 0 && (
            <Button
              variant="outline"
              onPress={handleClearAll}
              icon={<IconTrash size={18} color={colors.destructive} />}
              style={styles.clearBtn}
            >
              Limpar lista
            </Button>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  totalCaption: {
    fontSize: 12,
  },
  field: {
    marginBottom: 16,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  hintSmall: {
    fontSize: 11,
  },
  hintEmphasis: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  addBtn: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  rowCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  rowNameWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  rowRemove: {
    padding: 4,
  },
  rowPosition: {
    fontSize: 12,
  },
  rowPriceLine: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  priceCell: {
    flex: 1,
    gap: 2,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  rowInputsLine: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  rowInputCell: {
    flex: 1,
    gap: 4,
  },
  rowTotalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    gap: 8,
  },
  rowTotalLeft: {
    flexDirection: "column",
    flex: 1,
  },
  rowTotalSub: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  rowTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  clearBtn: {
    marginTop: 4,
  },
});
