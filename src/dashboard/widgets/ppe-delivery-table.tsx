// PPE delivery widget — surfaces pending PPE delivery requests so HR/Admin
// can approve or reject them, and Warehouse can see what is queued for
// physical delivery. Mirrors web's ppe-delivery-table widget but adapted to
// mobile: card stack, bottom sheet for filters/sort, alert dialog for the
// rejection reason, and inline approve/reject buttons on each card.

import { useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import {
  IconShieldCheck,
  IconCircleCheck,
  IconX,
  IconRefresh,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { PPE_DELIVERY_STATUS, SECTOR_PRIVILEGES } from "@/constants/enums";
import { PPE_DELIVERY_STATUS_LABELS } from "@/constants/enum-labels";
import {
  usePpeDeliveries,
  useBatchApprovePpeDeliveries,
  useBatchRejectPpeDeliveries,
} from "@/hooks/usePpe";
import {
  Section,
  ToggleRow,
  LimitInput,
  type Density,
  makeTableDisplaySchema,
  makeTableSortSchema,
  TABLE_DISPLAY_DEFAULTS,
  TableDisplayConfigSection,
  TableSortConfigSection,
  type TableDisplay,
} from "./_shared";
import {
  WidgetTableContainer,
  WidgetTableRow,
  WidgetTableHeader,
  WidgetTableMessage,
  type WidgetTableColumn,
} from "./_table";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Modal, ModalContent, ModalHeader } from "@/components/ui/modal";
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

// Solid BADGE_COLORS palette (centralized in src/constants/badge-colors.ts).
const STATUS_TONES: Record<PPE_DELIVERY_STATUS, { bg: string; fg: string }> = {
  [PPE_DELIVERY_STATUS.PENDING]: { bg: "#d97706", fg: "#ffffff" },
  [PPE_DELIVERY_STATUS.APPROVED]: { bg: "#1d4ed8", fg: "#ffffff" },
  [PPE_DELIVERY_STATUS.WAITING_SIGNATURE]: { bg: "#ea580c", fg: "#ffffff" },
  [PPE_DELIVERY_STATUS.DELIVERED]: { bg: "#0891b2", fg: "#ffffff" },
  [PPE_DELIVERY_STATUS.COMPLETED]: { bg: "#15803d", fg: "#ffffff" },
  [PPE_DELIVERY_STATUS.REPROVED]: { bg: "#b91c1c", fg: "#ffffff" },
  [PPE_DELIVERY_STATUS.SIGNATURE_REJECTED]: { bg: "#b91c1c", fg: "#ffffff" },
  [PPE_DELIVERY_STATUS.CANCELLED]: { bg: "#6b7280", fg: "#ffffff" },
};

const PPE_COLUMNS: WidgetTableColumn[] = [
  { key: "item", label: "Item / Colaborador", flex: 1 },
  { key: "status", label: "Status", width: 110, align: "right" },
];

const PPE_SORT_OPTIONS = [
  { value: "createdAt", label: "Data" },
  { value: "status", label: "Status" },
  { value: "quantity", label: "Quantidade" },
];

const STATUS_OPTIONS = Object.values(PPE_DELIVERY_STATUS).map((s) => ({
  value: s,
  label: PPE_DELIVERY_STATUS_LABELS[s],
}));

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Entregas de EPI"),
  showHeader: z.boolean().default(true),
  showActionButtons: z.boolean().default(true),
  filters: z
    .object({
      statuses: z
        .array(z.nativeEnum(PPE_DELIVERY_STATUS))
        .default([
          PPE_DELIVERY_STATUS.PENDING,
          PPE_DELIVERY_STATUS.WAITING_SIGNATURE,
        ]),
      onlyActionable: z.boolean().default(false),
    })
    .default({
      statuses: [
        PPE_DELIVERY_STATUS.PENDING,
        PPE_DELIVERY_STATUS.WAITING_SIGNATURE,
      ],
      onlyActionable: false,
    }),
  limit: z.number().int().min(5).max(50).default(15),
  sort: makeTableSortSchema(
    ["createdAt", "status", "quantity"] as const,
    "createdAt",
    "desc",
  ),
  display: makeTableDisplaySchema({ density: "comfortable", showRowDot: true }),
  accent: makeAccentSchema({ color: "blue", icon: "ClipboardCheck", borderColor: "none" }),
});
type Config = z.infer<typeof configSchema>;

function Render({ config }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const sector = user?.sector?.privileges as SECTOR_PRIVILEGES | undefined;
  const canApprove =
    sector === SECTOR_PRIVILEGES.HUMAN_RESOURCES ||
    sector === SECTOR_PRIVILEGES.ADMIN;

  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;
  const display = config.display ?? TABLE_DISPLAY_DEFAULTS;
  const density = display.density as Density;

  const queryParams = useMemo(
    () => ({
      where: {
        status: config.filters.statuses.length
          ? { in: config.filters.statuses }
          : undefined,
      },
      orderBy: { [config.sort.key]: config.sort.direction } as any,
      take: config.limit,
      include: { item: true, user: true, ppeSchedule: true },
    }),
    [
      config.filters.statuses,
      config.limit,
      config.sort.key,
      config.sort.direction,
    ],
  );

  const { data, isLoading, isError, refetch, isRefetching } = usePpeDeliveries(
    queryParams as any,
  );
  const rows = (data?.data ?? []) as any[];
  const visible = config.filters.onlyActionable
    ? rows.filter((r) => r.status === PPE_DELIVERY_STATUS.PENDING)
    : rows;

  const approveMutation = useBatchApprovePpeDeliveries();
  const rejectMutation = useBatchRejectPpeDeliveries();
  const [rejectTarget, setRejectTarget] = useState<{ id: string; label: string } | null>(
    null,
  );
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

  return (
    <WidgetCard
      title={config.title || "Entregas de EPI"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref="/(tabs)/estoque/epi/entregas"
      showHeader={config.showHeader}
      density={density}
      bodyPadded={false}
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
      count={visible.length}
    >
      <WidgetTableContainer density={density}>
        {display.showColumnHeaders && <WidgetTableHeader columns={PPE_COLUMNS} />}
        {isLoading ? (
          <WidgetTableMessage>
            <ActivityIndicator color={colors.primary} />
          </WidgetTableMessage>
        ) : isError ? (
          <WidgetTableMessage>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                textAlign: "center",
              }}
            >
              Erro ao carregar entregas.
            </Text>
          </WidgetTableMessage>
        ) : visible.length === 0 ? (
          <WidgetTableMessage>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                textAlign: "center",
              }}
            >
              {display.emptyStateMessage || "Nenhuma entrega encontrada."}
            </Text>
          </WidgetTableMessage>
        ) : (
          visible.map((d, idx) => {
            const tone = STATUS_TONES[d.status as PPE_DELIVERY_STATUS] ?? {
              bg: colors.muted,
              fg: colors.mutedForeground,
            };
            const itemLabel = d.item?.name ?? "Item";
            const userName = d.user?.name ?? "—";
            const isPending = d.status === PPE_DELIVERY_STATUS.PENDING;
            const showActions = config.showActionButtons && canApprove && isPending;

            return (
              <WidgetTableRow
                key={d.id}
                density={density}
                index={idx}
                striping={display.striping}
                gridLines={display.gridLines}
                hoverHighlight={display.hoverHighlight}
                rowDotColor={display.showRowDot ? accent.hex : undefined}
                onPress={() =>
                  router.push(`/(tabs)/estoque/epi/entregas/editar/${d.id}` as any)
                }
              >
                {/* Inner column wraps both the data row and the action buttons,
                    since WidgetTableRow itself is flexDirection:row. */}
                <View style={{ flex: 1, gap: 0 }}>
                <View
                  style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}
                    >
                      {itemLabel}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 11, color: colors.mutedForeground }}
                    >
                      {userName}
                      {d.quantity != null ? ` · ${d.quantity} un.` : ""}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: tone.bg,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "600", color: tone.fg }}>
                      {PPE_DELIVERY_STATUS_LABELS[d.status as PPE_DELIVERY_STATUS] ??
                        d.status}
                    </Text>
                  </View>
                </View>
                {showActions && (
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <Pressable
                      onPress={() => onApprove(d.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        paddingVertical: 8,
                        borderRadius: 6,
                        backgroundColor: "#15803d",
                        opacity:
                          pressed ||
                          approveMutation.isPending ||
                          rejectMutation.isPending
                            ? 0.6
                            : 1,
                      })}
                    >
                      <IconCircleCheck size={14} color="#fff" />
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                        Aprovar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setRejectTarget({ id: d.id, label: itemLabel });
                        setRejectReason("");
                      }}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        paddingVertical: 8,
                        borderRadius: 6,
                        backgroundColor: "#b91c1c",
                        opacity:
                          pressed ||
                          approveMutation.isPending ||
                          rejectMutation.isPending
                            ? 0.6
                            : 1,
                      })}
                    >
                      <IconX size={14} color="#fff" />
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                        Reprovar
                      </Text>
                    </Pressable>
                  </View>
                )}
                </View>
              </WidgetTableRow>
            );
          })
        )}
      </WidgetTableContainer>

      {/* Reject dialog. The Modal primitive gives us a styled native dialog
          without the AlertDialog button-typing constraints. */}
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
              <Pressable
                disabled={rejectMutation.isPending}
                onPress={() => setRejectTarget(null)}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text style={{ fontSize: 13, color: colors.foreground }}>
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                disabled={rejectMutation.isPending}
                onPress={onConfirmReject}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 6,
                  backgroundColor: "#b91c1c",
                  alignItems: "center",
                  opacity: pressed || rejectMutation.isPending ? 0.6 : 1,
                })}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                  Reprovar
                </Text>
              </Pressable>
            </View>
          </View>
        </ModalContent>
      </Modal>
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
          placeholder="Entregas de EPI"
        />
      </View>

      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "blue") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "ShieldCheck") as WidgetAccentIcon,
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
          label="Botões Aprovar/Reprovar"
          hint="Apenas RH e Admin podem aprovar; o estoque vê em modo somente leitura."
          checked={config.showActionButtons}
          onCheckedChange={(v) => set("showActionButtons", v)}
        />
      </Section>
      <TableDisplayConfigSection
        value={config.display as TableDisplay}
        onChange={(next) => set("display", next as any)}
        features={{ showSearchBox: false }}
      />

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
            placeholder="Todos os status"
          />
        </View>
        <ToggleRow
          label="Apenas pendentes"
          hint="Restringe a lista a entregas que aguardam aprovação."
          checked={config.filters.onlyActionable}
          onCheckedChange={(v) => setFilter("onlyActionable", v)}
        />
        <LimitInput
          value={config.limit}
          onChange={(v) => set("limit", v)}
          min={5}
          max={50}
        />
      </Section>
      <TableSortConfigSection
        value={config.sort}
        onChange={(next) => set("sort", next as any)}
        keyOptions={PPE_SORT_OPTIONS}
      />
    </View>
  );
}

export const ppeDeliveryTableWidget: WidgetDefinition<Config> = {
  id: "table.ppe-deliveries",
  name: "Entregas de EPI",
  description:
    "Aprove, reprove ou registre a entrega de EPIs. RH e Admin aprovam/reprovam; o estoque registra a entrega física.",
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
  defaultRows: 3,
  configSchema,
  defaultConfig: {
    title: "Entregas de EPI",
    showHeader: true,
    showActionButtons: true,
    filters: {
      statuses: [
        PPE_DELIVERY_STATUS.PENDING,
        PPE_DELIVERY_STATUS.WAITING_SIGNATURE,
      ],
      onlyActionable: false,
    },
    limit: 15,
    sort: { key: "createdAt", direction: "desc" },
    display: {
      ...TABLE_DISPLAY_DEFAULTS,
      density: "comfortable",
      showSearchBox: false,
    },
    accent: { color: "blue", icon: "ClipboardCheck", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
