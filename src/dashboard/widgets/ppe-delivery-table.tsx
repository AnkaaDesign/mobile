// PPE delivery widget — surfaces pending PPE delivery requests for HR/Admin
// to approve/reject and Warehouse to fulfill physically.
//
// Mirrors the web ppe-delivery-table widget (web/src/dashboard/widgets/
// ppe-delivery-table.tsx) for parity. The 12-key column catalog and 5 filter
// fields round-trip with web so saved configurations are interchangeable.
//
// Mobile differences:
//   - Tabular rendering uses _table.tsx primitives instead of CSS grid.
//   - Inline action buttons are replaced with a long-press ActionSheet —
//     squeezing buttons into a 2-column row on mobile breaks the column
//     model. Approve/reject still gate on canManageHR equivalent (sector
//     ∈ {HR, ADMIN}). The reject reason dialog stays a Modal (RN-friendly).
//   - Multi-sort schema preserved for round-trip with web; the config UI
//     surfaces a single primary sort because chip-based reordering inside
//     a bottom sheet is unreliable on RN.
//   - onlyActionable is computed client-side: the user's sector decides
//     which statuses they can act on (HR sees PENDING; Warehouse sees
//     WAITING_SIGNATURE).

import { useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconShieldCheck } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { PPE_DELIVERY_STATUS, SECTOR_PRIVILEGES } from "@/constants/enums";
import { PPE_DELIVERY_STATUS_LABELS } from "@/constants/enum-labels";
import {
  usePpeDeliveries,
  useBatchApprovePpeDeliveries,
  useBatchRejectPpeDeliveries,
} from "@/hooks/usePpe";
import { useUsers } from "@/hooks/useUser";
import { useItems } from "@/hooks/useItem";
import {
  Section,
  ToggleRow,
  LimitInput,
  ConfigTitleInput,
  TableRefreshSection,
  computeBodyMaxHeight,
  densityClasses,
  type Density,
  makeTableDisplaySchema,
  TABLE_DISPLAY_DEFAULTS,
  TableDisplayConfigSection,
  type TableDisplay,
} from "./_shared";
import { ColumnPicker, type ColumnSort } from "../components/column-picker";
import {
  WidgetTableContainer,
  WidgetTableSearch,
  WidgetTableRow,
  WidgetTableHeader,
  WidgetTableMessage,
  cellStyleForColumn,
  textCellStyleForColumn,
  type WidgetTableColumn,
} from "./_table";
import { toneForPpeDeliveryStatus } from "./_status-tones";
import { SkeletonRows } from "./_skeleton";
import { WidgetErrorState } from "./_error-state";
import { longPressHaptic } from "@/utils/haptics";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollView } from "react-native-gesture-handler";
import { Modal, ModalContent } from "@/components/ui/modal";
import { ActionSheet, type ActionSheetItem } from "@/components/ui/action-sheet";
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
import { notify } from "@/api-client";
import type {
  WidgetConfigProps,
  WidgetDefinition,
  WidgetRenderProps,
} from "../types";

// ============================================================
// Helpers
// ============================================================

function formatNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number.isInteger(n)
    ? n.toLocaleString("pt-BR")
    : n.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v) return [v];
  return [];
}

// ============================================================
// Column catalog (12) — parity with web
// ============================================================

const COLUMN_KEY_VALUES = [
  "itemUniCode",
  "itemName",
  "userName",
  "userSector",
  "quantity",
  "status",
  "scheduledDate",
  "actualDeliveryDate",
  "reviewedBy",
  "reason",
  "createdAt",
  "updatedAt",
] as const;
type ColumnKey = (typeof COLUMN_KEY_VALUES)[number];

const COLUMN_DEFS: Record<ColumnKey, WidgetTableColumn> = {
  itemUniCode: { key: "itemUniCode", label: "Código", width: 80 },
  itemName: { key: "itemName", label: "EPI", flex: 1.6 },
  userName: { key: "userName", label: "Colaborador", flex: 1.4 },
  userSector: { key: "userSector", label: "Setor", flex: 1 },
  quantity: { key: "quantity", label: "Qnt.", width: 60, align: "right" },
  status: { key: "status", label: "Status", width: 110, align: "right" },
  scheduledDate: { key: "scheduledDate", label: "Agendado", width: 90, align: "right" },
  actualDeliveryDate: {
    key: "actualDeliveryDate",
    label: "Entregue",
    width: 90,
    align: "right",
  },
  reviewedBy: { key: "reviewedBy", label: "Revisado", flex: 1.2 },
  reason: { key: "reason", label: "Motivo", flex: 1.4 },
  createdAt: { key: "createdAt", label: "Solicitado", width: 90, align: "right" },
  updatedAt: { key: "updatedAt", label: "Atualizado", width: 90, align: "right" },
};

const COLUMN_OPTIONS = COLUMN_KEY_VALUES.map((k) => ({
  key: k,
  label: COLUMN_DEFS[k].label,
}));

// ============================================================
// Sort options (7) — parity with web
// ============================================================

const SORT_KEY_OPTIONS = [
  { value: "createdAt", label: "Solicitado em" },
  { value: "scheduledDate", label: "Data agendada" },
  { value: "actualDeliveryDate", label: "Data de entrega" },
  { value: "status", label: "Status" },
  { value: "itemName", label: "EPI" },
  { value: "userName", label: "Colaborador" },
  { value: "updatedAt", label: "Atualizado em" },
];

const SORT_KEY_TO_API: Record<string, string> = {
  createdAt: "createdAt",
  scheduledDate: "scheduledDate",
  actualDeliveryDate: "actualDeliveryDate",
  status: "statusOrder",
  itemName: "item.name",
  userName: "user.name",
  updatedAt: "updatedAt",
};

const STATUS_OPTIONS = Object.values(PPE_DELIVERY_STATUS).map((s) => ({
  value: s,
  label: PPE_DELIVERY_STATUS_LABELS[s] ?? s,
}));

// Statuses each sector can ACT on. HR/Admin approve PENDING; Warehouse
// records delivery on WAITING_SIGNATURE / APPROVED.
const HR_ACTIONABLE_STATUSES = new Set<PPE_DELIVERY_STATUS>([
  PPE_DELIVERY_STATUS.PENDING,
]);
const WAREHOUSE_ACTIONABLE_STATUSES = new Set<PPE_DELIVERY_STATUS>([
  PPE_DELIVERY_STATUS.WAITING_SIGNATURE,
  PPE_DELIVERY_STATUS.APPROVED,
]);

function actionableSetFor(
  sector: SECTOR_PRIVILEGES | undefined,
): Set<PPE_DELIVERY_STATUS> {
  if (
    sector === SECTOR_PRIVILEGES.HUMAN_RESOURCES ||
    sector === SECTOR_PRIVILEGES.ADMIN
  ) {
    return HR_ACTIONABLE_STATUSES;
  }
  if (sector === SECTOR_PRIVILEGES.WAREHOUSE) {
    return WAREHOUSE_ACTIONABLE_STATUSES;
  }
  return new Set();
}

// ============================================================
// Config schema — round-trips with web schema
// ============================================================

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Entregas de EPI").describe("Título"),
  /** Show the WidgetCard header (title + count + viewAll). Parity with web's
   *  `display.showHeader`. Round-trips: web ignores top-level extras and we
   *  ignore web's `display.showHeader` (resolved to top-level here). */
  showHeader: z.boolean().default(true),
  /** Show the muted count pill in the header. Parity with web's
   *  `display.showCount`. Round-trips as above. */
  showCount: z.boolean().default(true),
  accent: makeAccentSchema({
    color: "amber",
    icon: "ClipboardCheck",
    borderColor: "none",
  }),
  columns: z
    .array(z.enum(COLUMN_KEY_VALUES))
    .min(1)
    .default(["itemName", "userName", "quantity", "status", "scheduledDate"])
    .describe("Colunas"),
  filters: z
    .object({
      searchingFor: z.string().default("").describe("Busca padrão"),
      statuses: z
        .array(z.nativeEnum(PPE_DELIVERY_STATUS))
        .default([
          PPE_DELIVERY_STATUS.PENDING,
          PPE_DELIVERY_STATUS.WAITING_SIGNATURE,
        ])
        .describe("Status"),
      itemIds: z.array(z.string().uuid()).default([]).describe("EPIs"),
      userIds: z.array(z.string().uuid()).default([]).describe("Colaboradores"),
      onlyActionable: z
        .boolean()
        .default(false)
        .describe("Apenas acionáveis pelo meu setor"),
    })
    .default({
      searchingFor: "",
      statuses: [
        PPE_DELIVERY_STATUS.PENDING,
        PPE_DELIVERY_STATUS.WAITING_SIGNATURE,
      ],
      itemIds: [],
      userIds: [],
      onlyActionable: false,
    }),
  // Multi-sort — array shape matches web. Mobile UI edits the first entry.
  sorts: z
    .array(
      z.object({
        key: z.string(),
        direction: z.enum(["asc", "desc"]),
      }),
    )
    .default([{ key: "createdAt", direction: "desc" }]),
  limit: z.number().int().min(5).max(200).default(30).describe("Limite"),
  display: makeTableDisplaySchema({ density: "comfortable", showRowDot: false }),
});
type Config = z.infer<typeof configSchema>;

interface ActionTarget {
  id: string;
  label: string;
  status: PPE_DELIVERY_STATUS;
}

// ============================================================
// Query params
// ============================================================

function buildOrderBy(sorts: Config["sorts"]): Record<string, unknown>[] {
  return (sorts ?? []).map((s) => {
    const apiKey = SORT_KEY_TO_API[s.key] ?? s.key;
    if (apiKey.includes(".")) {
      const [rel, field] = apiKey.split(".");
      return { [rel]: { [field]: s.direction } };
    }
    return { [apiKey]: s.direction };
  });
}

function buildParams(
  config: Config,
  liveSearch: string,
): Record<string, unknown> {
  const f = config.filters;
  const params: Record<string, unknown> = {
    take: config.limit,
    orderBy: buildOrderBy(
      config.sorts.length ? config.sorts : [{ key: "createdAt", direction: "desc" }],
    ),
    include: {
      item: true,
      user: { include: { sector: true } },
      reviewedByUser: true,
    },
  };

  const search = liveSearch || f.searchingFor;
  if (search) params.searchingFor = search;
  if (f.itemIds.length > 0) params.itemIds = f.itemIds;
  if (f.userIds.length > 0) params.userIds = f.userIds;

  const where: Record<string, unknown> = {};
  if (f.statuses.length > 0) {
    where.status = { in: f.statuses };
  }
  if (Object.keys(where).length > 0) params.where = where;
  return params;
}

// ============================================================
// Render
// ============================================================

function Render({ config, size }: WidgetRenderProps<Config>) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const sector = user?.sector?.privileges as SECTOR_PRIVILEGES | undefined;
  const canApprove =
    sector === SECTOR_PRIVILEGES.HUMAN_RESOURCES ||
    sector === SECTOR_PRIVILEGES.ADMIN;

  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
    shade: (config.accent as any)?.shade,
  });
  const Icon = accent.Icon;
  const display = config.display ?? TABLE_DISPLAY_DEFAULTS;
  const density = display.density as Density;

  const [search, setSearch] = useState("");
  const params = useMemo(
    () => buildParams(config, display.showSearchBox ? search : ""),
    [config, display.showSearchBox, search],
  );

  const refetchMs = Number(display.refetchInterval ?? "0");
  const { data, isLoading, isError, refetch, isRefetching } = usePpeDeliveries(
    params as any,
    refetchMs > 0 ? { refetchInterval: refetchMs } : undefined,
  );

  const allRows = (data?.data ?? []) as any[];

  // onlyActionable is a client-side filter — restricts the row set to the
  // statuses the current user's sector can act on.
  const rows = useMemo(() => {
    if (!config.filters.onlyActionable) return allRows;
    const set = actionableSetFor(sector);
    return allRows.filter((d) => set.has(d.status as PPE_DELIVERY_STATUS));
  }, [allRows, config.filters.onlyActionable, sector]);

  // Visible columns — guard against empty list.
  const visibleCols = useMemo<ColumnKey[]>(() => {
    return config.columns?.length
      ? (config.columns.filter((k) => COLUMN_DEFS[k]) as ColumnKey[])
      : (["itemName", "userName", "quantity", "status", "scheduledDate"] as ColumnKey[]);
  }, [config.columns]);

  // ---- Mutations + Reject dialog state ----
  const approveMutation = useBatchApprovePpeDeliveries();
  const rejectMutation = useBatchRejectPpeDeliveries();
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ActionTarget | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const onApprove = (id: string) => {
    approveMutation.mutate(
      { deliveryIds: [id] },
      {
        onSuccess: () => notify.success("Entrega aprovada"),
        onError: () => notify.error("Não foi possível aprovar a entrega"),
      },
    );
  };

  const onConfirmReject = () => {
    if (!rejectTarget) return;
    rejectMutation.mutate(
      {
        deliveryIds: [rejectTarget.id],
        reason: rejectReason.trim() || undefined,
      },
      {
        onSuccess: () => {
          setRejectTarget(null);
          setRejectReason("");
          notify.success("Entrega reprovada");
        },
        onError: () => notify.error("Não foi possível reprovar a entrega"),
      },
    );
  };

  // Build the long-press action sheet items lazily from the active target.
  const actionItems: ActionSheetItem[] = useMemo(() => {
    if (!actionTarget) return [];
    const items: ActionSheetItem[] = [
      {
        id: "open",
        label: "Abrir entrega",
        icon: "external-link",
        onPress: () =>
          router.push(
            `/(tabs)/estoque/epi/entregas/editar/${actionTarget.id}` as any,
          ),
      },
    ];
    if (canApprove && actionTarget.status === PPE_DELIVERY_STATUS.PENDING) {
      items.push({
        id: "approve",
        label: "Aprovar",
        icon: "circle-check",
        onPress: () => onApprove(actionTarget.id),
      });
      items.push({
        id: "reject",
        label: "Reprovar",
        icon: "x",
        destructive: true,
        onPress: () => {
          setRejectTarget(actionTarget);
          setRejectReason("");
        },
      });
    }
    return items;
  }, [actionTarget, canApprove, router]);

  return (
    <WidgetCard
      title={config.title || "Entregas de EPI"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref="/(tabs)/estoque/epi/entregas"
      showHeader={config.showHeader}
      density={density}
      bodyPadded={false}
      bodyMaxHeight={computeBodyMaxHeight(size.rows)}
      onRefresh={refetch}
      refreshing={isRefetching}
      accentColor={accent.hex}
      borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      count={config.showCount === false ? null : rows.length}
    >
      <WidgetTableContainer density={density}>
        {display.showSearchBox && (
          <WidgetTableSearch
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar EPI, código, colaborador..."
          />
        )}
        {display.showColumnHeaders && (
          <WidgetTableHeader
            columns={visibleCols.map((k) => COLUMN_DEFS[k])}
            reserveRowDot={display.showRowDot}
            density={density}
          />
        )}
        {isLoading ? (
          <SkeletonRows count={5} density={density} />
        ) : isError ? (
          <WidgetErrorState
            message="Erro ao carregar entregas."
            onRetry={() => refetch()}
          />
        ) : rows.length === 0 ? (
          <WidgetTableMessage>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                textAlign: "center",
              }}
            >
              {display.emptyStateMessage ||
                "Nenhuma entrega encontrada com os filtros atuais."}
            </Text>
          </WidgetTableMessage>
        ) : (
          rows.map((d, idx) => (
            <PpeDeliveryRow
              key={d.id}
              delivery={d}
              index={idx}
              visibleCols={visibleCols}
              density={density}
              accentHex={accent.hex}
              display={display}
              isDark={isDark}
              colors={colors}
              onTap={() =>
                router.push(`/(tabs)/estoque/epi/entregas/editar/${d.id}` as any)
              }
              onLongPress={() => {
                longPressHaptic();
                setActionTarget({
                  id: d.id,
                  label: d.item?.name ?? "Entrega",
                  status: d.status as PPE_DELIVERY_STATUS,
                });
              }}
            />
          ))
        )}
      </WidgetTableContainer>

      <ActionSheet
        visible={!!actionTarget}
        onClose={() => setActionTarget(null)}
        title={actionTarget?.label}
        items={actionItems}
      />

      {/* Reject reason dialog. Modal gives a styled native dialog without
          the AlertDialog button-typing constraints. */}
      <Modal
        visible={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reprovar entrega"
        animationType="fade"
        presentationStyle="overFullScreen"
        size="md"
      >
        <ModalContent>
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              Você está reprovando a entrega de {rejectTarget?.label}. Informe
              um motivo (opcional).
            </Text>
            <Input
              placeholder="Motivo da reprovação"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              {/* Cardinal-rule fix: chrome on outer View, Pressable is a tap surface. */}
              <View
                style={{
                  flex: 1,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                }}
              >
                <Pressable
                  disabled={rejectMutation.isPending}
                  onPress={() => setRejectTarget(null)}
                  android_ripple={{ color: "rgba(0,0,0,0.08)" }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.foreground }}>
                    Cancelar
                  </Text>
                </Pressable>
              </View>
              <View
                style={{
                  flex: 1,
                  borderRadius: 6,
                  // Theme-driven destructive color so dark mode renders the
                  // desaturated red from colors.ts instead of full-saturation
                  // red-700 that fails contrast on dark cards.
                  backgroundColor: colors.destructive,
                  opacity: rejectMutation.isPending ? 0.6 : 1,
                  overflow: "hidden",
                }}
              >
                <Pressable
                  disabled={rejectMutation.isPending}
                  onPress={onConfirmReject}
                  android_ripple={{ color: "rgba(255,255,255,0.18)" }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.destructiveForeground,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    Reprovar
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ModalContent>
      </Modal>
    </WidgetCard>
  );
}

// ============================================================
// Row
// ============================================================

interface PpeDeliveryRowProps {
  delivery: any;
  index: number;
  visibleCols: ColumnKey[];
  density: Density;
  accentHex: string;
  display: TableDisplay;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  onTap: () => void;
  onLongPress: () => void;
}

function PpeDeliveryRow({
  delivery,
  index,
  visibleCols,
  density,
  accentHex,
  display,
  isDark,
  colors,
  onTap,
  onLongPress,
}: PpeDeliveryRowProps) {
  const dens = densityClasses(density);
  const cellFontSize = dens.fontSize;
  const metaFontSize = Math.max(10, cellFontSize - 2);

  const tone = toneForPpeDeliveryStatus(
    delivery.status as PPE_DELIVERY_STATUS,
    isDark,
  );

  // Long-press opens the action sheet; the WidgetTableRow itself accepts onPress
  // for tap navigation. We wrap the row content in a Pressable that handles
  // both gestures so long-press doesn't conflict with the row's onPress.
  return (
    <WidgetTableRow
      density={density}
      index={index}
      striping={display.striping}
      gridLines={display.gridLines}
      hoverHighlight={display.hoverHighlight}
      rowDotColor={display.showRowDot ? accentHex : undefined}
      onPress={onTap}
    >
      {visibleCols.map((key) => {
        const def = COLUMN_DEFS[key];
        switch (key) {
          case "itemUniCode":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  fontFamily: "monospace",
                  color: colors.foreground,
                }}
              >
                {delivery.item?.uniCode || "—"}
              </Text>
            );
          case "itemName":
            return (
              <Pressable
                key={key}
                onPress={onTap}
                onLongPress={onLongPress}
                delayLongPress={350}
                style={[textCellStyleForColumn(def) as any, { minWidth: 0 }]}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: cellFontSize,
                    fontWeight: "600",
                    color: colors.foreground,
                  }}
                >
                  {delivery.item?.name || "—"}
                </Text>
              </Pressable>
            );
          case "userName":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: cellFontSize,
                  color: colors.foreground,
                }}
              >
                {delivery.user?.name || "—"}
              </Text>
            );
          case "userSector":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  color: colors.mutedForeground,
                }}
              >
                {delivery.user?.sector?.name || "—"}
              </Text>
            );
          case "quantity":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: cellFontSize,
                  fontWeight: "600",
                  color: colors.foreground,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatNumber(Number(delivery.quantity ?? 0))}
              </Text>
            );
          case "status":
            return (
              <View key={key} style={cellStyleForColumn(def)}>
                <View
                  style={{
                    backgroundColor: tone.bg,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: metaFontSize,
                      fontWeight: "600",
                      color: tone.fg,
                    }}
                  >
                    {PPE_DELIVERY_STATUS_LABELS[
                      delivery.status as PPE_DELIVERY_STATUS
                    ] ?? delivery.status}
                  </Text>
                </View>
              </View>
            );
          case "scheduledDate":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  color: colors.foreground,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatDate(delivery.scheduledDate)}
              </Text>
            );
          case "actualDeliveryDate":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  color: colors.foreground,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatDate(delivery.actualDeliveryDate)}
              </Text>
            );
          case "reviewedBy":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  color: colors.mutedForeground,
                }}
              >
                {delivery.reviewedByUser?.name || "—"}
              </Text>
            );
          case "reason":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  color: colors.mutedForeground,
                }}
              >
                {delivery.reason || "—"}
              </Text>
            );
          case "createdAt":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  color: colors.mutedForeground,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatDate(delivery.createdAt)}
              </Text>
            );
          case "updatedAt":
            return (
              <Text
                key={key}
                numberOfLines={1}
                style={{
                  ...textCellStyleForColumn(def),
                  fontSize: metaFontSize,
                  color: colors.mutedForeground,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatDate(delivery.updatedAt)}
              </Text>
            );
          default:
            return null;
        }
      })}
    </WidgetTableRow>
  );
}

// ============================================================
// Configure UI
// ============================================================

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const { colors } = useTheme();
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });
  const setFilter = <K extends keyof Config["filters"]>(
    key: K,
    value: Config["filters"][K],
  ) => onChange({ ...config, filters: { ...config.filters, [key]: value } });

  const { data: usersData } = useUsers({ orderBy: { name: "asc" } } as any);
  const { data: itemsData } = useItems({
    orderBy: { name: "asc" },
    take: 200,
  } as any);

  const userOptions = useMemo(
    () =>
      ((usersData?.data ?? []) as any[]).map((u) => ({
        value: u.id,
        label: u.name,
      })),
    [usersData?.data],
  );
  const itemOptions = useMemo(
    () =>
      ((itemsData?.data ?? []) as any[]).map((i) => ({
        value: i.id,
        label: i.uniCode ? `${i.uniCode} — ${i.name}` : i.name,
      })),
    [itemsData?.data],
  );

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => set("title", v)}
        placeholder="Entregas de EPI"
      />

      <Tabs defaultValue="appearance">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabsList style={{ minWidth: 360 }}>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="columns">Colunas</TabsTrigger>
            <TabsTrigger value="filters">Filtros</TabsTrigger>
            <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          </TabsList>
        </ScrollView>

        <TabsContent value="appearance">
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "amber") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "ClipboardCheck") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
      </Section>

      <Section title="Cabeçalho">
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.showHeader}
          onCheckedChange={(v) => set("showHeader", v)}
        />
        <ToggleRow
          label="Exibir contagem"
          checked={config.showCount}
          onCheckedChange={(v) => set("showCount", v)}
        />
        <ToggleRow
          label="Caixa de busca"
          checked={(config.display as TableDisplay).showSearchBox}
          onCheckedChange={(v) =>
            set("display", {
              ...(config.display as TableDisplay),
              showSearchBox: v,
            } as any)
          }
        />
      </Section>

      <TableDisplayConfigSection
        value={config.display as TableDisplay}
        onChange={(next) => set("display", next as any)}
        features={{ showSearchBox: false }}
      />
        </TabsContent>

        <TabsContent value="columns">
          <ColumnPicker
            catalog={COLUMN_OPTIONS}
            selected={config.columns}
            onChange={(next) => set("columns", next as Config["columns"])}
            sorts={config.sorts as ColumnSort<ColumnKey>[]}
            onSortsChange={(next) => set("sorts", next as Config["sorts"])}
            maxSorts={3}
            minVisible={1}
            title="Colunas e ordenação"
          />
        </TabsContent>

        <TabsContent value="filters">
      <Section title="Filtros" defaultOpen>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Busca padrão</Text>
          <Input
            value={config.filters.searchingFor}
            onChangeText={(v: string) =>
              setFilter("searchingFor", typeof v === "string" ? v : "")
            }
            placeholder="EPI, código, colaborador..."
          />
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            Aplicado sempre. A caixa de busca em tempo real (se ativada) prevalece.
          </Text>
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Status</Text>
          <Combobox
            mode="multiple"
            value={config.filters.statuses}
            onValueChange={(v: any) =>
              setFilter("statuses", asArray(v) as PPE_DELIVERY_STATUS[])
            }
            options={STATUS_OPTIONS}
            placeholder="Todos os status"
            searchPlaceholder="Buscar status..."
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>EPIs</Text>
          <Combobox
            mode="multiple"
            value={config.filters.itemIds}
            onValueChange={(v: any) => setFilter("itemIds", asArray(v))}
            options={itemOptions}
            placeholder="Todos os EPIs"
            searchPlaceholder="Buscar EPI..."
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Colaboradores</Text>
          <Combobox
            mode="multiple"
            value={config.filters.userIds}
            onValueChange={(v: any) => setFilter("userIds", asArray(v))}
            options={userOptions}
            placeholder="Todos os colaboradores"
            searchPlaceholder="Buscar colaborador..."
          />
        </View>
        <ToggleRow
          label="Apenas acionáveis"
          hint="Mostra somente entregas que o seu setor pode aprovar/reprovar (RH/Admin) ou registrar entrega física (Estoque)."
          checked={config.filters.onlyActionable}
          onCheckedChange={(v) => setFilter("onlyActionable", v)}
        />
      </Section>
        </TabsContent>

        <TabsContent value="behavior">
      <Section title="Limite">
        <LimitInput
          value={config.limit}
          onChange={(v) => set("limit", v)}
          min={5}
          max={200}
        />
      </Section>

      <TableRefreshSection
        value={(config.display as TableDisplay).refetchInterval ?? "0"}
        onChange={(v) =>
          set("display", { ...(config.display as TableDisplay), refetchInterval: v } as any)
        }
      />
        </TabsContent>
      </Tabs>
    </View>
  );
}

// ============================================================
// Definition
// ============================================================

export const ppeDeliveryTableWidget: WidgetDefinition<Config> = {
  id: "table.ppe-deliveries",
  name: "Entregas de EPI",
  description:
    "Aprove, reprove ou registre a entrega de EPIs. RH e Admin aprovam/reprovam (toque-longo); o estoque registra a entrega física.",
  icon: IconShieldCheck,
  category: "hr",
  // Mirrors web: HR/Admin approve, Warehouse delivers. Both see the widget.
  allowedSectors: [
    SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.WAREHOUSE,
  ],
  allowedSpans: [3],
  defaultSpan: 3,
  allowedHeights: [2, 3],
  defaultRows: 2,
  configSchema,
  defaultConfig: {
    title: "Entregas de EPI",
    showHeader: true,
    showCount: true,
    accent: { color: "amber", icon: "ClipboardCheck", borderColor: "none" },
    columns: ["itemName", "userName", "quantity", "status", "scheduledDate"],
    filters: {
      searchingFor: "",
      statuses: [
        PPE_DELIVERY_STATUS.PENDING,
        PPE_DELIVERY_STATUS.WAITING_SIGNATURE,
      ],
      itemIds: [],
      userIds: [],
      onlyActionable: false,
    },
    sorts: [{ key: "createdAt", direction: "desc" }],
    limit: 30,
    display: { ...TABLE_DISPLAY_DEFAULTS, density: "comfortable" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
