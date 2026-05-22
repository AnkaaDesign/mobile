import {
  IconAlertCircle,
  IconArrowBack,
  IconCalendar,
  IconCheck,
  IconClipboardList,
  IconClock,
  IconExternalLink,
  IconFile,
  IconHash,
  IconHistory,
  IconPlayerPlay,
  IconReload,
  IconScissors,
  IconUser,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_CUTS_LIST } from "../fixtures";
import type { SceneProps } from "./index";

// Status colors mirror ENTITY_BADGE_CONFIG.CUT used by the real cut-detail screen.
const CUT_STATUS_COLORS: Record<string, string> = {
  PENDING: "#737373",
  CUTTING: "#1d4ed8",
  COMPLETED: "#15803d",
};

const CUT_TYPE_LABELS: Record<string, string> = {
  VINYL: "Vinil",
  STENCIL: "Stencil",
};

const CUT_ORIGIN_LABELS: Record<string, string> = {
  PLAN: "Planejado",
  REQUEST: "Solicitado",
};

/**
 * Tutorial v5 scene mirroring `src/app/(tabs)/producao/recorte/detalhes/[id].tsx`.
 *
 * Layout, top-to-bottom:
 *   1. Header card — cut name (filename) + serial-like sub line + status pill
 *      with quick action buttons (request, advance status).
 *   2. "Informações Gerais" card — file preview placeholder + origin/type/duration rows.
 *   3. "Informações da Tarefa" card — task name/customer/sector link-style row.
 *   4. "Datas" card — solicitado/iniciado/concluído.
 *   5. "Histórico de Alterações" card — empty timeline placeholder.
 */
export function CutDetailScene({ state: _state }: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  // Use first fixture item as the displayed cut.
  const cut = TUTORIAL_CUTS_LIST[0];
  const statusColor = CUT_STATUS_COLORS[cut.status] ?? "#737373";
  const typeLabel = CUT_TYPE_LABELS[cut.type] ?? cut.type;
  const originLabel = CUT_ORIGIN_LABELS[cut.origin] ?? cut.origin;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 100 }}
    >
      {/* ─── Header card — cut name + status pill + actions ──────────────── */}
      <View
        ref={slot.registerRef("cutDetailHeader") as any}
        onLayout={slot.register("cutDetailHeader")}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerIconWrap}>
            <IconScissors size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={2}>
              {cut.label}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
              {cut.taskName}
            </Text>
          </View>
          <View
            ref={slot.registerRef("cutDetailStatusPill") as any}
            onLayout={slot.register("cutDetailStatusPill")}
            style={[styles.statusPill, { backgroundColor: statusColor }]}
          >
            <Text style={styles.statusText} numberOfLines={1}>
              {cut.statusLabel}
            </Text>
          </View>
        </View>

        {/* Quick action buttons row */}
        <View
          ref={slot.registerRef("cutDetailActions") as any}
          onLayout={slot.register("cutDetailActions")}
          style={styles.actionsRow}
        >
          <Pressable
            style={[styles.actionButton, { backgroundColor: "#3b82f6" }]}
          >
            <IconScissors size={18} color="#ffffff" />
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
          >
            <IconPlayerPlay size={18} color="#ffffff" />
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: "#16a34a" }]}
          >
            <IconCheck size={18} color="#ffffff" />
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }]}
          >
            <IconReload size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {/* ─── Informações Gerais — file preview + meta rows ───────────────── */}
      <DetailCard
        slotRef={slot.registerRef("cutDetailInfoCard")}
        onLayout={slot.register("cutDetailInfoCard")}
        icon={IconScissors}
        title="Informações Gerais"
        badge={
          <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText} numberOfLines={1}>
              {cut.statusLabel}
            </Text>
          </View>
        }
        colors={colors}
      >
        {/* File preview placeholder — mirrors the FileItem grid tile */}
        <View
          ref={slot.registerRef("cutDetailFilePreview") as any}
          onLayout={slot.register("cutDetailFilePreview")}
          style={[
            styles.filePreview,
            { borderColor: colors.border, backgroundColor: colors.muted },
          ]}
        >
          <IconFile size={48} color={colors.mutedForeground} />
          <Text style={[styles.filePreviewName, { color: colors.text }]} numberOfLines={1}>
            estrela-lateral.svg
          </Text>
          <Text style={[styles.filePreviewMeta, { color: colors.mutedForeground }]}>
            420 mm × 280 mm
          </Text>
        </View>

        <DetailField icon={IconArrowBack} label="Origem" value={originLabel} colors={colors} />
        <DetailField icon={IconHash} label="Tipo" value={typeLabel} colors={colors} />
        <DetailField icon={IconHash} label="Quantidade" value="1 un" colors={colors} monospace />
        <DetailField icon={IconClock} label="Tempo de Execução" value="Não iniciado" colors={colors} muted />
      </DetailCard>

      {/* ─── Informações da Tarefa — link-style row ─────────────────────── */}
      <DetailCard
        slotRef={slot.registerRef("cutDetailTaskCard")}
        onLayout={slot.register("cutDetailTaskCard")}
        icon={IconClipboardList}
        title="Informações da Tarefa"
        badge={
          <View style={styles.linkBadge}>
            <IconExternalLink size={14} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.primary }]}>Ver</Text>
          </View>
        }
        colors={colors}
      >
        <Pressable
          ref={slot.registerRef("cutDetailTaskLink") as any}
          onLayout={slot.register("cutDetailTaskLink")}
          style={[
            styles.linkRow,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.linkRowTitle, { color: colors.text }]} numberOfLines={1}>
              {cut.taskName}
            </Text>
            <Text style={[styles.linkRowMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
              Cliente Demonstração Ltda
            </Text>
          </View>
          <IconExternalLink size={18} color={colors.mutedForeground} />
        </Pressable>

        <DetailField icon={IconUser} label="Cliente" value="Cliente Demonstração Ltda" colors={colors} />
        <DetailField icon={IconClipboardList} label="Setor" value="Produção" colors={colors} />
      </DetailCard>

      {/* ─── Datas card ───────────────────────────────────────────────── */}
      <DetailCard
        slotRef={slot.registerRef("cutDetailDatesCard")}
        onLayout={slot.register("cutDetailDatesCard")}
        icon={IconCalendar}
        title="Datas"
        colors={colors}
      >
        <DetailField icon={IconCalendar} label="Solicitado em" value="12/05/2026" colors={colors} />
        <DetailField icon={IconClock} label="Iniciado em" value="—" colors={colors} muted />
        <DetailField icon={IconCheck} label="Concluído em" value="—" colors={colors} muted />
      </DetailCard>

      {/* ─── Histórico de Alterações — empty timeline placeholder ─────── */}
      <DetailCard
        slotRef={slot.registerRef("cutDetailChangelogCard")}
        onLayout={slot.register("cutDetailChangelogCard")}
        icon={IconHistory}
        title="Histórico de Alterações"
        colors={colors}
      >
        <View style={styles.timelineEmpty}>
          <IconAlertCircle size={20} color={colors.mutedForeground} />
          <Text style={[styles.timelineEmptyText, { color: colors.mutedForeground }]}>
            Nenhuma alteração registrada ainda.
          </Text>
        </View>
      </DetailCard>
    </ScrollView>
  );
}

// ─── DetailCard mock (mirrors src/components/ui/detail-page-layout.tsx) ─────

interface DetailCardProps {
  icon: any;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  colors: any;
  onLayout?: any;
  /** Tutorial slot ref forwarded to the outer View so the spotlight can measure it. */
  slotRef?: (node: any) => void;
}

function DetailCard({
  icon: Icon,
  title,
  badge,
  children,
  colors,
  onLayout,
  slotRef,
}: DetailCardProps) {
  return (
    <View
      ref={slotRef as any}
      onLayout={onLayout}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.cardHeaderLeft}>
          <Icon size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {badge}
      </View>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

// ─── DetailField — icon + label above, value in bordered muted card below ───

function DetailField({
  icon: Icon,
  label,
  value,
  colors,
  monospace,
  muted,
}: {
  icon: any;
  label: string;
  value: string;
  colors: any;
  monospace?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldLabel}>
        <Icon size={18} color={colors.mutedForeground} />
        <Text style={[styles.labelText, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <View
        style={[
          styles.fieldValueCard,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <Text
          style={[
            styles.valueText,
            { color: muted ? colors.mutedForeground : colors.text },
            monospace && { fontFamily: "monospace" },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Card — 8px radius, 1px border (matches detail-page-layout)
  card: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    flexShrink: 1,
  },
  cardContent: {
    gap: 14,
  },
  // Header card (cut name + status)
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { fontSize: 12 },
  // Status pill — solid rectangular, radius 6
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusText: { color: "#ffffff", fontSize: 12, fontWeight: "500" },
  // Action buttons row in the header card
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#0000001a",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  // File preview placeholder
  filePreview: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  filePreviewName: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  filePreviewMeta: {
    fontSize: 11,
  },
  // DetailField — icon + label above, value in bordered muted card below
  fieldRow: { gap: 4 },
  fieldLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  labelText: { fontSize: 13, fontWeight: "500" },
  fieldValueCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  valueText: { fontSize: 13, fontWeight: "600" },
  // Link-style row for related task
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkRowTitle: { fontSize: 14, fontWeight: "600" },
  linkRowMeta: { fontSize: 12 },
  linkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkText: { fontSize: 12, fontWeight: "500" },
  // Empty timeline state
  timelineEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  timelineEmptyText: { fontSize: 13 },
});
