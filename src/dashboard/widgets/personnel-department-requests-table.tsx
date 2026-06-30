// HR Requests widget — surfaces the same Secullum time-adjustment / justified-
// absence approval queue that lives at /departamento-pessoal/requisicoes.
// Mobile counterpart to `web/src/dashboard/widgets/hr-requests-table.tsx`
// (1318 lines), built as a card list (NOT a tabular grid) per spec §6.5:
//   • In-tile: compact list of request cards (one per Secullum request).
//   • Tap a card → detail StandardModal with metadata + comparison table +
//     Aprovar / Rejeitar footer actions.
// Action buttons live inside the detail modal, NOT inline on every row, so
// the list stays readable on narrow viewports.
//
// Hooks (already on mobile — see `mobile/src/hooks/secullum.ts`):
//   • useSecullumRequests        — list of pending+historical requests
//   • useSecullumApproveRequest  — POST /requests/:id/approve
//   • useSecullumRejectRequest   — POST /requests/:id/reject
// All three exist, so this widget renders end-to-end. No escalation needed.

import { useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, Pressable } from "react-native";
import {
  IconClock,
  IconClockEdit,
  IconUser,
  IconCalendar,
  IconFileDescription,
  IconArrowsExchange,
} from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { extendedColors } from "@/lib/theme/extended-colors";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import {
  useSecullumRequests,
  useSecullumApproveRequest,
  useSecullumRejectRequest,
} from "@/hooks/secullum";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { StandardModal } from "@/components/ui/standard-modal";
import { lightImpactHaptic } from "@/utils/haptics";
import { notify } from "@/api-client";

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
  LimitInput,
  ConfigTitleInput,
  TableRefreshSection,
  computeBodyMaxHeight,
  cardDensityClasses,
  DensitySegmented,
  type Density,
  DENSITY_VALUES,
} from "./_shared";
import { WidgetTableSearch, WidgetTableMessage } from "./_table";
import { SkeletonRows } from "./_skeleton";
import { WidgetErrorState } from "./_error-state";

// ============================================================
// Domain types — minimal subset of the Secullum request shape used
// by the widget. Full type lives in `web/src/types/secullum-*.ts`;
// we only need the fields the list + detail surfaces actually read.
// ============================================================

interface SecullumRequest {
  Id: number;
  Data: string;
  DataFim: string | null;
  FuncionarioId: number;
  FuncionarioNome: string;
  Entrada1: string | null;
  Saida1: string | null;
  Entrada2: string | null;
  Saida2: string | null;
  Entrada3: string | null;
  Saida3: string | null;
  Entrada1Original: string | null;
  Saida1Original: string | null;
  Entrada2Original: string | null;
  Saida2Original: string | null;
  Entrada3Original: string | null;
  Saida3Original: string | null;
  Tipo: number; // 0 = ajuste de ponto, 2 = justificar ausência
  TipoDescricao: string;
  Estado: number; // 0 = pendente, 1 = aprovado, 2 = rejeitado
  Observacoes: string | null;
  DataSolicitacao: string;
  AlteracoesFonteDados: any[];
  Versao: string;
  SolicitacaoFotoId?: number | null;
}

const ESTADO_LABELS: Record<number, string> = {
  0: "Pendente",
  1: "Aprovado",
  2: "Rejeitado",
};
const ESTADO_OPTIONS = [
  { value: "0", label: "Pendente" },
  { value: "1", label: "Aprovado" },
  { value: "2", label: "Rejeitado" },
];

const TIPO_LABELS: Record<number, string> = {
  0: "Ajuste de Ponto",
  2: "Justificar Ausência",
};
const TIPO_OPTIONS = [
  { value: "0", label: "Ajuste de Ponto" },
  { value: "2", label: "Justificativa de Ausência" },
];

const ACTIONABLE_ESTADOS = new Set<number>([0]);

// Per-state tones — sourced from `extendedColors` (the same palette table
// the global widget tone helpers in `_status-tones.tsx` use). The pendente
// /aprovado/rejeitado triad mirrors web's `bg-amber-*`/`bg-green-*`/`bg-red-*`
// chips on the request cards.
function toneForEstado(
  estado: number,
  isDark: boolean,
): { bg: string; fg: string } {
  switch (estado) {
    case 0: // pendente — amber 100/600 light, 900/300 dark
      return isDark
        ? { bg: extendedColors.amber[900], fg: extendedColors.amber[300] }
        : { bg: extendedColors.amber[100], fg: extendedColors.amber[800] };
    case 1: // aprovado — green
      return isDark
        ? { bg: extendedColors.green[900], fg: extendedColors.green[300] }
        : { bg: extendedColors.green[100], fg: extendedColors.green[800] };
    case 2: // rejeitado — red
      return isDark
        ? { bg: extendedColors.red[900], fg: extendedColors.red[300] }
        : { bg: extendedColors.red[100], fg: extendedColors.red[800] };
    default:
      return { bg: "transparent", fg: "" };
  }
}

const TIME_FIELDS = [
  { key: "Entrada1", origKey: "Entrada1Original", short: "E1" },
  { key: "Saida1", origKey: "Saida1Original", short: "S1" },
  { key: "Entrada2", origKey: "Entrada2Original", short: "E2" },
  { key: "Saida2", origKey: "Saida2Original", short: "S2" },
  { key: "Entrada3", origKey: "Entrada3Original", short: "E3" },
  { key: "Saida3", origKey: "Saida3Original", short: "S3" },
] as const;

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}
function formatDateTime(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
function isJustification(r: SecullumRequest): boolean {
  return r.Tipo === 2;
}
function justificationToken(r: SecullumRequest): string | undefined {
  for (const f of TIME_FIELDS) {
    const cur = (r[f.key as keyof SecullumRequest] as string | null) ?? "";
    if (cur) return cur;
  }
  return undefined;
}

// ============================================================
// Config schema — mirrors web (§6.5) field-for-field.
// ============================================================

const SORT_KEYS = [
  "dataSolicitacao",
  "data",
  "funcionarioName",
  "estado",
  "tipo",
] as const;
const SORT_OPTIONS = [
  { value: "dataSolicitacao", label: "Solicitada em" },
  { value: "data", label: "Data de referência" },
  { value: "funcionarioName", label: "Colaborador" },
  { value: "estado", label: "Status" },
  { value: "tipo", label: "Tipo" },
];

export const personnelDepartmentRequestsTableConfigSchema = z.object({
  title: z.string().min(1).max(80).default("Requisições de RH"),
  accent: makeAccentSchema({
    color: "indigo",
    icon: "Clock",
    borderColor: "none",
  }),
  display: z
    .object({
      density: z.enum(DENSITY_VALUES).default("comfortable"),
      striping: z.boolean().default(true),
      gridLines: z.boolean().default(true),
      hoverHighlight: z.boolean().default(true),
      showHeader: z.boolean().default(true),
      showCount: z.boolean().default(true),
      showSearchBox: z.boolean().default(true),
      emptyStateMessage: z.string().max(160).default(""),
      // Persisted-only fields (kept for cross-platform schema parity even
      // though the mobile widget doesn't surface them as toggles today).
      refetchInterval: z
        .string()
        .regex(/^\d+$/, "Intervalo inválido")
        .default("0"),
    })
    .default({
      density: "comfortable",
      striping: true,
      gridLines: true,
      hoverHighlight: true,
      showHeader: true,
      showCount: true,
      showSearchBox: true,
      emptyStateMessage: "",
      refetchInterval: "0",
    }),
  filters: z
    .object({
      searchingFor: z.string().default(""),
      estados: z.array(z.number().int()).default([0]),
      tipos: z.array(z.number().int()).default([]),
    })
    .default({ searchingFor: "", estados: [0], tipos: [] }),
  // Multi-key sort, mirrors web. The mobile config picker exposes only the
  // first entry (single-key), but we persist as an array for cross-platform
  // round-tripping.
  sorts: z
    .array(
      z.object({
        key: z.enum(SORT_KEYS),
        direction: z.enum(["asc", "desc"]),
      }),
    )
    .min(1)
    .default([{ key: "dataSolicitacao", direction: "desc" }]),
  limit: z.number().int().min(5).max(200).default(30),
  showActionButtons: z.boolean().default(true),
});
export type PersonnelDepartmentRequestsTableConfig = z.infer<typeof personnelDepartmentRequestsTableConfigSchema>;

// ============================================================
// Render
// ============================================================

function PersonnelDepartmentRequestsTableRender({
  config,
  size,
}: WidgetRenderProps<PersonnelDepartmentRequestsTableConfig>) {
  const { colors, isDark } = useTheme();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const HeaderIcon = accent.Icon;

  const display = config.display;
  const density = display.density as Density;
  const dens = cardDensityClasses(density);

  const [searchInput, setSearchInput] = useState(
    config.filters.searchingFor ?? "",
  );
  const [openRequest, setOpenRequest] = useState<SecullumRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SecullumRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Optimization: when filtering only to pending, ask the API for pending
  // only (mirrors web). Otherwise fetch all + filter client-side.
  const onlyPendingApi =
    config.filters.estados.length === 1 && config.filters.estados[0] === 0;

  const { data, isLoading, isError, refetch, isFetching } =
    useSecullumRequests(onlyPendingApi || undefined);
  const approveMutation = useSecullumApproveRequest();
  const rejectMutation = useSecullumRejectRequest();

  // Unwrap Secullum's nested response shape: { data: { success, message, data: [...] } }
  const allRows = useMemo<SecullumRequest[]>(() => {
    if (!data) return [];
    const anyData = data as any;
    if (anyData?.data?.data && Array.isArray(anyData.data.data)) {
      return anyData.data.data as SecullumRequest[];
    }
    if (anyData?.data && Array.isArray(anyData.data)) {
      return anyData.data as SecullumRequest[];
    }
    if (Array.isArray(anyData)) return anyData as SecullumRequest[];
    return [];
  }, [data]);

  const rows = useMemo(() => {
    const f = config.filters;
    const search = (searchInput || f.searchingFor).trim().toLowerCase();
    let out = allRows;

    if (f.estados.length > 0) {
      const allowed = new Set(f.estados);
      out = out.filter((r) => allowed.has(r.Estado));
    }
    if (f.tipos.length > 0) {
      const allowed = new Set(f.tipos);
      out = out.filter((r) => allowed.has(r.Tipo));
    }
    if (search) {
      out = out.filter((r) =>
        [r.FuncionarioNome, r.TipoDescricao, r.Observacoes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search),
      );
    }

    // Multi-sort: walk each sorts entry and use the first one that yields a
    // non-zero comparison. Mirrors the web table-sort utility.
    const fieldOf = (r: SecullumRequest, k: string): string | number => {
      if (k === "funcionarioName") return r.FuncionarioNome || "";
      if (k === "estado") return r.Estado;
      if (k === "tipo") return r.Tipo;
      if (k === "data") return new Date(r.Data || 0).getTime();
      return new Date(r.DataSolicitacao || 0).getTime();
    };
    const cmp = (a: SecullumRequest, b: SecullumRequest) => {
      for (const s of config.sorts) {
        const sign = s.direction === "asc" ? 1 : -1;
        const av = fieldOf(a, s.key);
        const bv = fieldOf(b, s.key);
        if (av < bv) return -1 * sign;
        if (av > bv) return 1 * sign;
      }
      return 0;
    };

    out = out.slice().sort(cmp);
    return out.slice(0, config.limit);
  }, [
    allRows,
    config.filters,
    config.sorts,
    config.limit,
    searchInput,
  ]);

  // ---- Mutations ----
  const onApprove = (r: SecullumRequest) => {
    const motivo = (r.Observacoes && r.Observacoes.trim()) || "Aprovado";
    const alteracoes = (r.AlteracoesFonteDados ?? []).map((c: any) => ({
      ...c,
      Motivo:
        c?.Motivo && String(c.Motivo).trim() !== "" ? c.Motivo : motivo,
    }));
    approveMutation.mutate(
      {
        requestId: String(r.Id),
        data: {
          Versao: r.Versao,
          AlteracoesFonteDados: alteracoes,
          TipoSolicitacao: r.Tipo ?? 0,
        },
      },
      {
        onSuccess: () => {
          // API client interceptor already shows the success toast
          setOpenRequest(null);
        },
      },
    );
  };

  const onConfirmReject = () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      notify.error("Informe o motivo da rejeição.");
      return;
    }
    rejectMutation.mutate(
      {
        requestId: String(rejectTarget.Id),
        data: {
          Versao: rejectTarget.Versao,
          Motivo: rejectReason,
          TipoSolicitacao: rejectTarget.Tipo ?? 0,
        },
      },
      {
        onSuccess: () => {
          // API client interceptor already shows the success toast
          setRejectTarget(null);
          setRejectReason("");
          setOpenRequest(null);
        },
        onSettled: () => undefined,
      },
    );
  };

  return (
    <WidgetCard
      title={config.title || "Requisições de RH"}
      icon={<HeaderIcon size={16} color={accent.hex} />}
      viewAllHref="/(tabs)/departamento-pessoal/requisicoes/listar"
      showHeader={config.display.showHeader ?? true}
      density={density}
      bodyPadded={false}
      bodyMaxHeight={computeBodyMaxHeight(size.rows)}
      onRefresh={refetch}
      refreshing={isFetching}
      accentColor={accent.hex}
      borderColor={borderHexFor(
        config.accent?.borderColor as WidgetBorderColor,
      )}
      count={(config.display.showCount ?? true) && !isLoading ? rows.length : null}
      fixedHeader={
        display.showSearchBox ? (
          <WidgetTableSearch
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Buscar por colaborador..."
          />
        ) : undefined
      }
    >
      {isLoading ? (
        <View style={{ padding: 12 }}>
          <SkeletonRows count={5} density={density} />
        </View>
      ) : isError ? (
        <WidgetErrorState
          message="Erro ao carregar requisições."
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
            {display.emptyStateMessage?.trim() ||
              "Nenhuma requisição encontrada com os filtros atuais."}
          </Text>
        </WidgetTableMessage>
      ) : (
        <View style={{ paddingHorizontal: 12, paddingBottom: 8, gap: 6 }}>
          {rows.map((r) => (
            <RequestCard
              key={r.Id}
              r={r}
              dens={dens}
              isDark={isDark}
              onPress={() => {
                lightImpactHaptic();
                setOpenRequest(r);
              }}
            />
          ))}
        </View>
      )}

      {/* Detail sheet — opens on row tap, shows full info + actions. */}
      <RequestDetailSheet
        request={openRequest}
        showActions={config.showActionButtons}
        approvePending={approveMutation.isPending}
        rejectPending={rejectMutation.isPending}
        onClose={() => setOpenRequest(null)}
        onApprove={onApprove}
        onReject={(r) => {
          // Close the detail sheet first — two opaque pageSheets stacked on iOS
          // can fail to present (blocking rejection). The request reference is
          // held in `rejectTarget`, so closing the detail sheet is safe.
          setOpenRequest(null);
          setRejectTarget(r);
          setRejectReason("");
        }}
      />

      {/* Reject modal — input the reason. */}
      <StandardModal
        visible={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
        title="Rejeitar requisição"
        actions={[
          {
            label: "Cancelar",
            variant: "outline",
            onPress: () => {
              setRejectTarget(null);
              setRejectReason("");
            },
            disabled: rejectMutation.isPending,
          },
          {
            label: "Rejeitar",
            variant: "destructive",
            onPress: onConfirmReject,
            disabled: rejectMutation.isPending || !rejectReason.trim(),
            loading: rejectMutation.isPending,
          },
        ]}
      >
        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
          Tem certeza que deseja rejeitar a requisição de{" "}
          <Text style={{ fontWeight: "600", color: colors.foreground }}>
            {rejectTarget?.FuncionarioNome ?? ""}
          </Text>
          ? O motivo é obrigatório e será anexado ao registro no Secullum.
        </Text>
        <Input
          placeholder="Ex.: marcação inconsistente, sem comprovante…"
          value={rejectReason}
          onChangeText={setRejectReason}
          multiline
          numberOfLines={3}
        />
      </StandardModal>
    </WidgetCard>
  );
}

// ============================================================
// Card row (list-mode summary)
// ============================================================

function RequestCard({
  r,
  dens,
  isDark,
  onPress,
}: {
  r: SecullumRequest;
  dens: ReturnType<typeof cardDensityClasses>;
  isDark: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const tipoLabel = TIPO_LABELS[r.Tipo] || r.TipoDescricao || "—";
  const estadoLabel = ESTADO_LABELS[r.Estado] ?? String(r.Estado);
  const tone = toneForEstado(r.Estado, isDark);

  return (
    <View
      style={{
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: colors.muted }}
        style={{
          paddingVertical: dens.cardPaddingY,
          paddingHorizontal: dens.cardPaddingX,
          gap: 4,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <IconUser size={14} color={colors.mutedForeground} />
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: dens.primaryFontSize,
              fontWeight: "600",
              color: colors.foreground,
              textTransform: "uppercase",
              letterSpacing: 0.2,
            }}
          >
            {r.FuncionarioNome || "—"}
          </Text>
          {/* Tipo badge */}
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: colors.mutedForeground,
                fontWeight: "500",
              }}
              numberOfLines={1}
            >
              {tipoLabel}
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <IconCalendar size={12} color={colors.mutedForeground} />
          <Text
            style={{
              fontSize: dens.metaFontSize,
              color: colors.mutedForeground,
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatDate(r.Data)}
          </Text>
          <View style={{ flex: 1 }} />
          {/* Estado badge */}
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: tone.bg,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: tone.fg || colors.mutedForeground,
                fontWeight: "600",
              }}
            >
              {estadoLabel}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ============================================================
// Detail sheet — full request info + comparison + actions
// ============================================================

function RequestDetailSheet({
  request,
  showActions,
  approvePending,
  rejectPending,
  onClose,
  onApprove,
  onReject,
}: {
  request: SecullumRequest | null;
  showActions: boolean;
  approvePending: boolean;
  rejectPending: boolean;
  onClose: () => void;
  onApprove: (r: SecullumRequest) => void;
  onReject: (r: SecullumRequest) => void;
}) {
  const { colors, isDark } = useTheme();
  const open = request != null;
  const isActionable = request ? ACTIONABLE_ESTADOS.has(request.Estado) : false;

  return (
    <StandardModal
      visible={open}
      onClose={onClose}
      title={request?.FuncionarioNome ?? ""}
      subtitle={request ? TIPO_LABELS[request.Tipo] || request.TipoDescricao : ""}
      bodyStyle={{ gap: 12 }}
      actions={
        showActions && isActionable && request
          ? [
              {
                label: "Rejeitar",
                variant: "destructive",
                onPress: () => onReject(request),
                disabled: approvePending || rejectPending,
                loading: rejectPending,
              },
              {
                label: "Aprovar",
                onPress: () => onApprove(request),
                disabled: approvePending || rejectPending,
                loading: approvePending,
              },
            ]
          : undefined
      }
    >
          {request && (
            <>
              {/* Information section */}
              <View
                style={{
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  gap: 8,
                  backgroundColor: colors.card,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <IconFileDescription size={14} color={colors.primary} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: colors.foreground,
                    }}
                  >
                    Informações da Solicitação
                  </Text>
                </View>
                <InfoRow
                  label="Data do Ponto"
                  value={formatDate(request.Data)}
                />
                <InfoRow
                  label="Solicitado em"
                  value={formatDateTime(request.DataSolicitacao)}
                />
                <InfoRow
                  label="Status"
                  value={ESTADO_LABELS[request.Estado] ?? String(request.Estado)}
                />
                {request.Observacoes && (
                  <InfoRow
                    label="Observação"
                    value={request.Observacoes}
                    multiline
                  />
                )}
              </View>

              {/* Comparison or justification card */}
              {isJustification(request) ? (
                <JustificationCard
                  token={justificationToken(request)}
                  observacoes={request.Observacoes}
                />
              ) : (
                <ComparisonCard r={request} />
              )}
            </>
          )}
    </StandardModal>
  );
}

function InfoRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text
        style={{
          fontSize: 10,
          color: colors.mutedForeground,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: colors.foreground,
          fontVariant: multiline ? undefined : ["tabular-nums"],
        }}
        numberOfLines={multiline ? undefined : 1}
      >
        {value}
      </Text>
    </View>
  );
}

function ComparisonCard({ r }: { r: SecullumRequest }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
        gap: 8,
        backgroundColor: colors.card,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
      >
        <IconArrowsExchange size={14} color={colors.primary} />
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.foreground,
          }}
        >
          Comparativo de marcações
        </Text>
      </View>
      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          paddingBottom: 4,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ width: 40 }} />
        <Text
          style={{
            flex: 1,
            fontSize: 10,
            fontWeight: "700",
            color: colors.mutedForeground,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          Original
        </Text>
        <Text
          style={{
            flex: 1,
            fontSize: 10,
            fontWeight: "700",
            color: colors.mutedForeground,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            textAlign: "right",
          }}
        >
          Solicitada
        </Text>
      </View>
      {TIME_FIELDS.map((f) => {
        const orig = r[f.origKey as keyof SecullumRequest] as string | null;
        const cur = r[f.key as keyof SecullumRequest] as string | null;
        if (!orig && !cur) return null;
        const changed = orig !== cur;
        return (
          <View
            key={f.short}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                width: 40,
                fontSize: 11,
                fontWeight: "600",
                color: colors.mutedForeground,
              }}
            >
              {f.short}
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: 12,
                color: colors.foreground,
                fontVariant: ["tabular-nums"],
              }}
            >
              {orig ?? "—"}
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: changed ? "600" : "400",
                color: changed ? colors.primary : colors.foreground,
                fontVariant: ["tabular-nums"],
                textAlign: "right",
              }}
            >
              {cur ?? "—"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function JustificationCard({
  token,
  observacoes,
}: {
  token: string | undefined;
  observacoes: string | null;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
        gap: 8,
        backgroundColor: colors.card,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
      >
        <IconClock size={14} color={colors.primary} />
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.foreground,
          }}
        >
          Justificativa de Ausência
        </Text>
      </View>
      {token && <InfoRow label="Código" value={token} />}
      {observacoes ? (
        <InfoRow label="Observação" value={observacoes} multiline />
      ) : (
        <Text
          style={{
            fontSize: 12,
            fontStyle: "italic",
            color: colors.mutedForeground,
          }}
        >
          Sem observações.
        </Text>
      )}
    </View>
  );
}

// ============================================================
// Config component
// ============================================================

function PersonnelDepartmentRequestsTableConfigComponent({
  config,
  onChange,
}: WidgetConfigProps<PersonnelDepartmentRequestsTableConfig>) {
  const { colors } = useTheme();
  const set = <K extends keyof PersonnelDepartmentRequestsTableConfig>(
    key: K,
    value: PersonnelDepartmentRequestsTableConfig[K],
  ) => onChange({ ...config, [key]: value });
  const setDisplay = <K extends keyof PersonnelDepartmentRequestsTableConfig["display"]>(
    key: K,
    value: PersonnelDepartmentRequestsTableConfig["display"][K],
  ) =>
    onChange({
      ...config,
      display: { ...config.display, [key]: value },
    });
  const setFilters = <K extends keyof PersonnelDepartmentRequestsTableConfig["filters"]>(
    key: K,
    value: PersonnelDepartmentRequestsTableConfig["filters"][K],
  ) =>
    onChange({
      ...config,
      filters: { ...config.filters, [key]: value },
    });

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => set("title", v)}
        placeholder="Requisições de RH"
      />

      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "indigo") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "Clock") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) =>
            set("accent", next as PersonnelDepartmentRequestsTableConfig["accent"])
          }
        />
      </Section>

      <Section title="Cabeçalho">
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.display.showHeader}
          onCheckedChange={(v) => setDisplay("showHeader", v)}
        />
        <ToggleRow
          label="Mostrar contador"
          checked={config.display.showCount}
          onCheckedChange={(v) => setDisplay("showCount", v)}
        />
        <ToggleRow
          label="Caixa de busca"
          checked={config.display.showSearchBox}
          onCheckedChange={(v) => setDisplay("showSearchBox", v)}
        />
      </Section>

      <Section title="Densidade" defaultOpen>
        <DensitySegmented
          value={config.display.density as Density}
          onChange={(d) => setDisplay("density", d)}
        />
      </Section>

      <Section title="Mensagem quando vazio">
        <Input
          placeholder="Nenhuma requisição encontrada"
          value={config.display.emptyStateMessage}
          onChangeText={(v: string) =>
            setDisplay("emptyStateMessage", v.slice(0, 160))
          }
        />
      </Section>

      <Section title="Filtros" defaultOpen>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Status
          </Text>
          <Combobox
            mode="multiple"
            value={config.filters.estados.map(String)}
            onValueChange={(v: any) => {
              const arr = (Array.isArray(v) ? v : [v]).filter(Boolean);
              setFilters(
                "estados",
                arr.map((s: string) => Number(s)),
              );
            }}
            options={ESTADO_OPTIONS}
            placeholder="Todos"
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Tipo
          </Text>
          <Combobox
            mode="multiple"
            value={config.filters.tipos.map(String)}
            onValueChange={(v: any) => {
              const arr = (Array.isArray(v) ? v : [v]).filter(Boolean);
              setFilters(
                "tipos",
                arr.map((s: string) => Number(s)),
              );
            }}
            options={TIPO_OPTIONS}
            placeholder="Todos"
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Busca padrão
          </Text>
          <Input
            value={config.filters.searchingFor}
            onChangeText={(v) => setFilters("searchingFor", v)}
            placeholder="Termo padrão (opcional)"
          />
        </View>
        <LimitInput
          value={config.limit}
          onChange={(v) => set("limit", v)}
          min={5}
          max={200}
        />
      </Section>

      <Section title="Ordenação">
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Ordenar por
          </Text>
          <Combobox
            value={config.sorts[0]?.key ?? "dataSolicitacao"}
            onValueChange={(v: any) => {
              const k = (typeof v === "string" ? v : "dataSolicitacao") as
                (typeof SORT_KEYS)[number];
              const head = config.sorts[0] ?? {
                key: "dataSolicitacao" as const,
                direction: "desc" as const,
              };
              const tail = config.sorts.slice(1);
              set(
                "sorts",
                [{ ...head, key: k }, ...tail] as PersonnelDepartmentRequestsTableConfig["sorts"],
              );
            }}
            options={SORT_OPTIONS}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Direção
          </Text>
          <Combobox
            value={config.sorts[0]?.direction ?? "desc"}
            onValueChange={(v: any) => {
              const dir = (typeof v === "string" ? v : "desc") as "asc" | "desc";
              const head = config.sorts[0] ?? {
                key: "dataSolicitacao" as const,
                direction: "desc" as const,
              };
              const tail = config.sorts.slice(1);
              set(
                "sorts",
                [{ ...head, direction: dir }, ...tail] as PersonnelDepartmentRequestsTableConfig["sorts"],
              );
            }}
            options={[
              { value: "asc", label: "Crescente" },
              { value: "desc", label: "Decrescente" },
            ]}
          />
        </View>
      </Section>

      <Section title="Ações">
        <ToggleRow
          label="Botões Aprovar / Rejeitar"
          hint="Mostra os botões dentro do detalhe ao tocar em uma requisição pendente."
          checked={config.showActionButtons}
          onCheckedChange={(v) => set("showActionButtons", v)}
        />
      </Section>

      <TableRefreshSection
        value={config.display.refetchInterval ?? "0"}
        onChange={(v) => setDisplay("refetchInterval", v)}
      />
    </View>
  );
}

// ============================================================
// Definition
// ============================================================

export const personnelDepartmentRequestsTableWidget: WidgetDefinition<PersonnelDepartmentRequestsTableConfig> = {
  id: "table.hr-requests",
  name: "Requisições de RH",
  description:
    "Aprove ou rejeite requisições de ajuste de ponto e justificativas de ausência. Toque em uma requisição para ver detalhes e agir.",
  icon: IconClockEdit,
  category: "hr",
  // Per spec §6.5 — HR + Admin only.
  allowedSectors: [
    SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    SECTOR_PRIVILEGES.ADMIN,
  ],
  allowedSpans: [3],
  defaultSpan: 3,
  allowedHeights: [3, 4],
  defaultRows: 3,
  configSchema: personnelDepartmentRequestsTableConfigSchema,
  defaultConfig: {
    title: "Requisições de RH",
    accent: { color: "indigo", icon: "Clock" },
    display: {
      density: "comfortable",
      striping: true,
      gridLines: true,
      hoverHighlight: true,
      showHeader: true,
      showCount: true,
      showSearchBox: true,
      emptyStateMessage: "",
      refetchInterval: "0",
    },
    filters: {
      searchingFor: "",
      estados: [0],
      tipos: [],
    },
    sorts: [{ key: "dataSolicitacao", direction: "desc" }],
    limit: 30,
    showActionButtons: true,
  },
  RenderComponent: PersonnelDepartmentRequestsTableRender,
  ConfigComponent: PersonnelDepartmentRequestsTableConfigComponent,
};
