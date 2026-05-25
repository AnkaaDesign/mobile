import {
  IconArrowBack,
  IconBuildingFactory,
  IconCheck,
  IconClipboardList,
  IconClock,
  IconExternalLink,
  IconFile,
  IconHash,
  IconHistory,
  IconPlayerPlay,
  IconScissors,
  IconUser,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { shadow } from "@/constants/design-system";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_CUTS_LIST } from "../fixtures";
import type { SceneProps } from "./index";

// Status colors mirror the real detail Badge, which resolves through
// ENTITY_BADGE_CONFIG.CUT → BADGE_COLORS:
//   PENDING → "gray" (#737373), CUTTING → "blue" (#2563eb),
//   COMPLETED → "green" (#15803d). Solid pill, white text.
const CUT_STATUS_COLORS: Record<string, string> = {
  PENDING: "#737373",
  CUTTING: "#2563eb",
  COMPLETED: "#15803d",
};

// CUT_TYPE_LABELS / CUT_ORIGIN_LABELS mirror the real constants used by the
// screen (see config/list/production/cuts.ts: VINYL → "Adesivo").
const CUT_TYPE_LABELS: Record<string, string> = {
  VINYL: "Adesivo",
  STENCIL: "Espovo",
};

const CUT_ORIGIN_LABELS: Record<string, string> = {
  PLAN: "Plano",
  REQUEST: "Solicitação",
};

/**
 * Tutorial scene mirroring `src/app/(tabs)/producao/recorte/detalhes/[id].tsx`.
 *
 * Layout, top-to-bottom:
 *   1. Header card — page title ("Recorte - {arquivo}") + inline action buttons
 *      (request, advance status).
 *   2. "Informações Gerais" card — IconScissors header + status badge, file
 *      preview tile, then Origem / Tipo / Tempo de Execução info rows.
 *   3. "Informações da Tarefa" card — IconClipboardList header + "Ver" link,
 *      then Nome / Cliente / Setor info rows.
 *   4. "Datas" card — IconClock header, Solicitado / Iniciado / Concluído rows.
 *   5. "Histórico de Alterações" card — IconHistory header + empty timeline.
 */
export function CutDetailScene({ state: _state }: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  // Use first fixture item as the displayed cut.
  const cut = TUTORIAL_CUTS_LIST[0];
  const statusColor = CUT_STATUS_COLORS[cut.status] ?? "#737373";
  const typeLabel = CUT_TYPE_LABELS[cut.type] ?? cut.type;
  const originLabel = CUT_ORIGIN_LABELS[cut.origin] ?? cut.origin;
  // Prefer the real fixture filename; fall back to the cut label so any cuts
  // source without a `filename` (e.g. TUTORIAL_TASK_DETAIL.cuts) doesn't regress.
  const fileName = cut.filename ?? cut.label;
  const pageTitle = `Recorte - ${fileName}`;
  const mutedRow = colors.muted + "30";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, gap: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Header card — page title + inline action buttons ───────────── */}
      <View
        ref={slot.registerRef("cutDetailHeader") as any}
        onLayout={slot.register("cutDetailHeader")}
        style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.pageTitle, { color: colors.foreground }]} numberOfLines={2}>
              {pageTitle}
            </Text>
          </View>
          <View
            ref={slot.registerRef("cutDetailActions") as any}
            onLayout={slot.register("cutDetailActions")}
            style={styles.headerActions}
          >
            <Pressable style={[styles.actionButton, { backgroundColor: colors.info }]}>
              <IconScissors size={18} color="#ffffff" />
            </Pressable>
            <Pressable style={[styles.actionButton, { backgroundColor: colors.primary }]}>
              <IconPlayerPlay size={18} color={colors.primaryForeground} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* ─── Informações Gerais — file preview + meta rows ───────────────── */}
      <DetailCard
        slotRef={slot.registerRef("cutDetailInfoCard")}
        onLayout={slot.register("cutDetailInfoCard")}
        icon={IconScissors}
        title="Informações Gerais"
        colors={colors}
        badge={
          <View
            ref={slot.registerRef("cutDetailStatusPill") as any}
            onLayout={slot.register("cutDetailStatusPill")}
            style={[styles.statusBadge, { backgroundColor: statusColor }]}
          >
            <Text style={styles.statusBadgeText} numberOfLines={1}>
              {cut.statusLabel}
            </Text>
          </View>
        }
      >
        {/* File preview tile — mirrors the FileItem grid preview */}
        <View
          ref={slot.registerRef("cutDetailFilePreview") as any}
          onLayout={slot.register("cutDetailFilePreview")}
          style={styles.fileContainer}
        >
          <View style={[styles.filePreview, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <IconFile size={48} color={colors.mutedForeground} />
            <Text style={[styles.filePreviewName, { color: colors.foreground }]} numberOfLines={1}>
              {fileName}
            </Text>
          </View>
        </View>

        <View style={styles.infoRows}>
          <InfoRow icon={IconArrowBack} label="Origem" value={originLabel} colors={colors} bg={mutedRow} />
          <InfoRow icon={IconHash} label="Tipo" value={typeLabel} colors={colors} bg={mutedRow} />
          <InfoRow icon={IconClock} label="Tempo de Execução" value="Não iniciado" colors={colors} bg={mutedRow} muted />
        </View>
      </DetailCard>

      {/* ─── Informações da Tarefa ──────────────────────────────────────── */}
      <DetailCard
        slotRef={slot.registerRef("cutDetailTaskCard")}
        onLayout={slot.register("cutDetailTaskCard")}
        icon={IconClipboardList}
        title="Informações da Tarefa"
        colors={colors}
        badge={
          <View style={styles.linkButton}>
            <IconExternalLink size={14} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.primary }]}>Ver</Text>
          </View>
        }
      >
        <View style={styles.infoRows}>
          {/* Task name row — best match for the "task link" spotlight slot */}
          <View
            ref={slot.registerRef("cutDetailTaskLink") as any}
            onLayout={slot.register("cutDetailTaskLink")}
            style={[styles.infoRow, { backgroundColor: mutedRow }]}
          >
            <View style={styles.infoRowLeft}>
              <IconClipboardList size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Nome</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>
              {cut.taskName}
            </Text>
          </View>

          <InfoRow icon={IconUser} label="Cliente" value="Cliente Demonstração Ltda" colors={colors} bg={mutedRow} />
          <InfoRow icon={IconBuildingFactory} label="Setor" value="Produção" colors={colors} bg={mutedRow} />
        </View>
      </DetailCard>

      {/* ─── Datas card ───────────────────────────────────────────────── */}
      <DetailCard
        slotRef={slot.registerRef("cutDetailDatesCard")}
        onLayout={slot.register("cutDetailDatesCard")}
        icon={IconClock}
        title="Datas"
        colors={colors}
      >
        <View style={styles.infoRows}>
          <View style={[styles.infoRow, { backgroundColor: mutedRow }]}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Solicitado em</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>12/05/2026</Text>
          </View>
        </View>
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
          <IconCheck size={20} color={colors.mutedForeground} />
          <Text style={[styles.timelineEmptyText, { color: colors.mutedForeground }]}>
            Nenhuma alteração registrada ainda.
          </Text>
        </View>
      </DetailCard>
    </ScrollView>
  );
}

// ─── DetailCard mock (mirrors the real Card + sectionHeader pattern) ─────────

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
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <Icon size={20} color={colors.mutedForeground} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        {badge ? <View style={{ marginLeft: "auto" }}>{badge}</View> : null}
      </View>
      {children}
    </View>
  );
}

// ─── InfoRow — horizontal row: icon + label (left), value (right) ────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  colors,
  bg,
  muted,
}: {
  icon: any;
  label: string;
  value: string;
  colors: any;
  bg: string;
  muted?: boolean;
}) {
  return (
    <View style={[styles.infoRow, { backgroundColor: bg }]}>
      <View style={styles.infoRowLeft}>
        <Icon size={16} color={colors.mutedForeground} />
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <Text
        style={[styles.infoValue, { color: muted ? colors.mutedForeground : colors.foreground }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header card — compact title bar (paddingH 16, paddingV 4); mirrors the real
  // Card (radius 8, 1px border, shadow.md)
  headerCard: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...shadow.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  // Section card — radius 8, 1px border, padding 16, shadow.md (mirrors Card)
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    ...shadow.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  // Status badge — solid, radius 6, white text 12/600 (mirrors Badge default size)
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  // File preview tile
  fileContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  filePreview: {
    width: "100%",
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
  // Info rows — horizontal label/value, muted bg
  infoRows: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    maxWidth: "50%",
    textAlign: "right",
  },
  // "Ver" link in the task card header
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkText: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Empty timeline state
  timelineEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  timelineEmptyText: { fontSize: 13 },
});
