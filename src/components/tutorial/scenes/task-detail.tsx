import {
  IconAlertTriangle,
  IconBrush,
  IconBuilding,
  IconBuildingFactory2,
  IconCalendar,
  IconCalendarEvent,
  IconCalendarStats,
  IconCalendarWeek,
  IconCategory,
  IconClipboardList,
  IconCoins,
  IconCut,
  IconEdit,
  IconFiles,
  IconHash,
  IconLayersSubtract,
  IconMapPin,
  IconNote,
  IconPaint,
  IconPaperclip,
  IconPhoto,
  IconSpray,
  IconTools,
  IconTrash,
} from "@tabler/icons-react-native";
import { useCallback, useEffect, useRef } from "react";
import {
  Dimensions,
  Image,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/lib/theme";
import {
  borderRadius,
  fontSize,
  fontWeight,
  shadow,
  spacing,
} from "@/constants/design-system";
import { useSlotContext } from "../chrome/slot-context";
import { useTutorialStore } from "../engine-store";
import { TUTORIAL_TASK_DETAIL } from "../fixtures";
import type { SceneProps } from "./index";

// Bonification is an enum (mirror of BONIFICATION_STATUS_LABELS), not a percentage.
const BONIFICATION_STATUS_LABELS: Record<string, string> = {
  NO_BONIFICATION: "Sem Bonificação",
  PARTIAL_BONIFICATION: "Bonificação Parcial",
  FULL_BONIFICATION: "Bonificação Integral",
  SUSPENDED_BONIFICATION: "Bonificação Suspensa",
};

// Cut type labels — the tutorial copy refers to vinyl cuts as "Adesivo"
// (sticker) and stencil cuts as "Espovo"; never show the raw enum.
const CUT_TYPE_LABELS: Record<string, string> = {
  VINYL: "Adesivo",
  STENCIL: "Espovo",
};

// Spotlight targets nested inside a scrollable section map to that section so
// we can still scroll them into view (their own onLayout y is relative to an
// inner row, not the scroll content).
const PARENT_SECTION: Record<string, string> = {
  taskBonificationBadge: "taskInfoCard",
  taskServiceObservationIndicator: "taskServicesCard",
};

// How far below the top of the scroll viewport a highlighted section lands —
// upper third, leaving room for the tooltip above or below it.
const REVEAL_GAP = Math.round(Dimensions.get("window").height * 0.22);

// The shared list Table renders alternating rows separated by a fixed
// translucent divider (Table/Row.tsx rowWrapper) — the inner tables used by
// observations/cuts/airbrushings detail cards inherit it. Match that line so
// the tutorial's table-style cards read like the real ones.
const ROW_DIVIDER = "rgba(0,0,0,0.05)";

// Status colors — mirror the centralized badge-colors.ts mapping so the
// service-order, cut and airbrushing pills all use the real semantic colors.
// Service orders: IN_PROGRESS/WAITING_APPROVE; cuts: CUTTING; airbrushings:
// IN_PRODUCTION; plus the shared PENDING/COMPLETED/CANCELLED.
const SO_STATUS_COLORS: Record<string, string> = {
  PENDING: "#737373", // gray
  IN_PROGRESS: "#1d4ed8", // blue-700
  WAITING_APPROVE: "#9333ea", // purple
  IN_PRODUCTION: "#2563eb", // blue-600 (AIRBRUSHING IN_PRODUCTION)
  CUTTING: "#2563eb", // blue-600 (CUT CUTTING)
  COMPLETED: "#15803d", // green-700
  CANCELLED: "#b91c1c", // red-700
};

// Portuguese status labels for cuts/airbrushings (mirror CUT_STATUS_LABELS /
// AIRBRUSHING_STATUS_LABELS) since the fixtures only carry the raw enum value.
const CUT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CUTTING: "Cortando",
  COMPLETED: "Concluído",
};

const AIRBRUSHING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  IN_PRODUCTION: "Em produção",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export function TaskDetailScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const t = TUTORIAL_TASK_DETAIL;

  const scrollRef = useRef<ScrollView>(null);
  // Content-relative y of each section, captured from its onLayout.
  const offsets = useRef<Record<string, number>>({});
  const activeSlot = useTutorialStore((s) => s.activeSlot);

  // onLayout that records the section's scroll offset AND forwards to the
  // slot measurement. Used on every spotlight-eligible section.
  const track = useCallback(
    (name: string) => (e: LayoutChangeEvent) => {
      offsets.current[name] = e.nativeEvent.layout.y;
      slot.register(name)(e);
    },
    [slot],
  );

  // When the highlighted section changes, scroll it into view so the spotlight
  // target is actually on screen. A programmatic scroll does NOT re-fire the
  // children's onLayout, so the cached rect would be stale — onScroll
  // remeasures every frame so the spotlight/tooltip track the section as it
  // moves, and a settle timer covers the final resting position.
  useEffect(() => {
    if (!activeSlot) return;
    const sectionSlot = PARENT_SECTION[activeSlot] ?? activeSlot;
    const y = offsets.current[sectionSlot];
    if (y == null) return; // slot lives outside this scene (e.g. header back)
    scrollRef.current?.scrollTo({ y: Math.max(0, y - REVEAL_GAP), animated: true });
    const id = setTimeout(() => slot.remeasureAll(), 380);
    return () => clearTimeout(id);
  }, [activeSlot, slot]);

  return (
    <ScrollView
      ref={scrollRef}
      onScroll={() => slot.remeasureAll()}
      scrollEventThrottle={16}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 100 }}
    >
      {/* Header card — task name + Edit/Delete action buttons (no status pill,
          no subtitle); mirrors the real ScheduleDetailsScreen header card. */}
      <View
        ref={slot.registerRef("taskHeader") as any}
        onLayout={track("taskHeader")}
        style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={2}>
              {t.name}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.actionButton, { backgroundColor: colors.primary }]}>
              <IconEdit size={18} color={colors.primaryForeground} />
            </View>
            <View style={[styles.actionButton, { backgroundColor: colors.destructive }]}>
              <IconTrash size={18} color={colors.destructiveForeground} />
            </View>
          </View>
        </View>
      </View>

      {/* Informações Gerais */}
      <DetailCard
        slotRef={slot.registerRef("taskInfoCard")}
        onLayout={track("taskInfoCard")}
        icon={IconClipboardList}
        title="Informações Gerais"
        badge={
          <View style={[styles.statusPill, { backgroundColor: t.statusColor }]}>
            <Text style={styles.statusText} numberOfLines={1}>
              {t.statusLabel.split(" (")[0]}
            </Text>
          </View>
        }
        colors={colors}
      >
        <DetailField icon={IconBuilding} label="Razão Social" value={t.customer} colors={colors} />
        <DetailField icon={IconBuildingFactory2} label="Setor" value={t.sectorName} colors={colors} />
        {t.isBonifiable && (
          /* Real card shows bonification as a "Bonificação" DetailField (icon coins);
             the spotlight slot lives on its wrapping row. */
          <View
            ref={slot.registerRef("taskBonificationBadge") as any}
            onLayout={track("taskBonificationBadge")}
          >
            <DetailField
              icon={IconCoins}
              label="Bonificação"
              value={BONIFICATION_STATUS_LABELS[t.bonification] ?? t.bonification}
              colors={colors}
            />
          </View>
        )}
        <DetailField icon={IconHash} label="Número de Série" value={t.serial} colors={colors} monospace />
        <DetailField icon={IconCategory} label="Categoria" value={t.truckCategory} colors={colors} />
        <DetailField icon={IconMapPin} label="Local" value={t.customerCity} colors={colors} />
      </DetailCard>

      {/* Datas */}
      <DetailCard
        slotRef={slot.registerRef("taskDatesCard")}
        onLayout={track("taskDatesCard")}
        icon={IconCalendarWeek}
        title="Datas"
        colors={colors}
      >
        <DetailField icon={IconCalendar} label="Entrada" value={t.entryDate} colors={colors} />
        <DetailField icon={IconCalendarEvent} label="Prazo" value={t.term} colors={colors} />
        <DetailField icon={IconCalendarStats} label="Previsão de Liberação" value={t.forecast} colors={colors} />
      </DetailCard>

      {/* Serviços */}
      <DetailCard
        slotRef={slot.registerRef("taskServicesCard")}
        onLayout={track("taskServicesCard")}
        icon={IconTools}
        title="Serviços"
        badge={
          <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.countBadgeText, { color: colors.text }]}>
              {t.services.length}
            </Text>
          </View>
        }
        colors={colors}
      >
        {t.services.map((s, i) => {
          const statusColor = SO_STATUS_COLORS[s.status] ?? "#737373";
          return (
            <View
              key={s.id}
              style={[
                styles.serviceRow,
                i !== t.services.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
            >
              {/* Single row: name (left, fills space) + status pill + observation
                  indicator (far right). The obs icon sits AFTER the badge. */}
              <Text
                style={[styles.serviceName, { color: colors.foreground, flex: 1 }]}
                numberOfLines={1}
              >
                {s.label}
              </Text>
              <View style={[styles.statusPill, styles.serviceStatusPill, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{s.statusLabel}</Text>
              </View>
              {s.hasObservation && (
                <Pressable
                  ref={slot.registerRef("taskServiceObservationIndicator") as any}
                  onLayout={track("taskServiceObservationIndicator")}
                  style={[styles.observationButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                >
                  <IconNote size={14} color={colors.mutedForeground} />
                  <View style={styles.observationBadge}>
                    <Text style={styles.observationBadgeText}>!</Text>
                  </View>
                </Pressable>
              )}
            </View>
          );
        })}
      </DetailCard>

      {/* Pintura Geral — 56x56 swatch */}
      <DetailCard
        slotRef={slot.registerRef("taskPaintsCard")}
        onLayout={track("taskPaintsCard")}
        icon={IconBrush}
        title="Pintura Geral"
        colors={colors}
      >
        {/* Tinted container + 56x56 preview + name and type/brand chip badges */}
        <View style={[styles.paintItemContainer, { backgroundColor: colors.muted + "50" }]}>
          <View style={styles.generalPaintRow}>
            <View
              style={[
                styles.generalPaintSwatch,
                { backgroundColor: t.generalPaint.hex, borderColor: colors.border },
              ]}
            />
            <View style={{ flex: 1, gap: 4, justifyContent: "center" }}>
              <Text style={[styles.paintName, { color: colors.foreground }]} numberOfLines={1}>
                {t.generalPaint.name}
              </Text>
              <View style={styles.paintBadgesRow}>
                <View style={[styles.paintChip, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.paintChipText, { color: colors.mutedForeground }]}>
                    {t.generalPaint.type}
                  </Text>
                </View>
                <View style={[styles.paintChip, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.paintChipText, { color: colors.mutedForeground }]}>
                    {t.generalPaint.brand}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </DetailCard>

      {/* Fundos Recomendados — 44x44 swatches stacked */}
      <DetailCard
        slotRef={slot.registerRef("taskGroundPaintsCard")}
        onLayout={track("taskGroundPaintsCard")}
        icon={IconLayersSubtract}
        title="Fundos Recomendados"
        badge={
          <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.countBadgeText, { color: colors.text }]}>
              {t.groundPaints.length}
            </Text>
          </View>
        }
        colors={colors}
      >
        {t.groundPaints.map((p, i) => (
          <View
            key={i}
            style={[
              styles.paintItemContainer,
              styles.stackedPaintRow,
              { backgroundColor: colors.muted + "50" },
            ]}
          >
            <View
              style={[styles.mediumPaintSwatch, { backgroundColor: p.hex, borderColor: colors.border }]}
            />
            <View style={styles.paintInfo}>
              <Text style={[styles.paintName, { color: colors.foreground }]} numberOfLines={1}>
                {p.name}
              </Text>
              <PaintChips type={p.type} brand={p.brand} finish={p.finish} colors={colors} />
            </View>
          </View>
        ))}
      </DetailCard>

      {/* Tintas da Logomarca — 44x44 swatches stacked */}
      <DetailCard
        slotRef={slot.registerRef("taskLogoPaintsCard")}
        onLayout={track("taskLogoPaintsCard")}
        icon={IconPaint}
        title="Tintas da Logomarca"
        badge={
          <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.countBadgeText, { color: colors.text }]}>
              {t.logoPaints.length}
            </Text>
          </View>
        }
        colors={colors}
      >
        {t.logoPaints.map((p, i) => (
          <View
            key={i}
            style={[
              styles.paintItemContainer,
              styles.stackedPaintRow,
              { backgroundColor: colors.muted + "50" },
            ]}
          >
            <View
              style={[styles.mediumPaintSwatch, { backgroundColor: p.hex, borderColor: colors.border }]}
            />
            <View style={styles.paintInfo}>
              <Text style={[styles.paintName, { color: colors.foreground }]} numberOfLines={1}>
                {p.name}
              </Text>
              <PaintChips type={p.type} brand={p.brand} finish={p.finish} colors={colors} />
            </View>
          </View>
        ))}
      </DetailCard>

      {/* Observações — table-style Card (muted-foreground icon, count in title) */}
      <DetailCard
        slotRef={slot.registerRef("taskObservationsTable")}
        onLayout={track("taskObservationsTable")}
        icon={IconPaperclip}
        iconColor={colors.mutedForeground}
        title={`Observações (${t.observations.length})`}
        colors={colors}
      >
        {t.observations.map((o, i) => (
          <View
            key={o.id}
            style={[
              styles.tableRow,
              {
                backgroundColor: i % 2 === 0 ? colors.background : colors.card,
                borderBottomColor: ROW_DIVIDER,
              },
              i === t.observations.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <IconAlertTriangle size={14} color="#dc2626" />
            <Text style={[styles.tableRowText, { color: colors.text, flex: 1 }]} numberOfLines={2}>
              {o.text}
            </Text>
            <Text style={[styles.tableRowMeta, { color: colors.mutedForeground }]}>
              {o.createdAt}
            </Text>
          </View>
        ))}
      </DetailCard>

      {/* Layouts (artworks) — grid; table-style Card (muted-foreground icon) */}
      <DetailCard
        slotRef={slot.registerRef("taskArtworksGallery")}
        onLayout={track("taskArtworksGallery")}
        icon={IconFiles}
        iconColor={colors.mutedForeground}
        title="Layouts"
        badge={
          <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.countBadgeText, { color: colors.text }]}>
              {t.artworks.length}
            </Text>
          </View>
        }
        colors={colors}
      >
        <View style={styles.artworksGrid}>
          {t.artworks.map((a) => (
            /* Mirrors the real FileItem grid tile: rounded card, square
               cover-fit thumbnail on top, filename strip below. */
            <View
              key={a.id}
              style={[styles.artworkTile, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <View style={[styles.artworkThumb, { backgroundColor: colors.muted + "20" }]}>
                {a.thumbnail ? (
                  <Image
                    source={a.thumbnail}
                    style={styles.artworkThumbImage}
                    resizeMode="cover"
                  />
                ) : (
                  <IconPhoto size={32} color={colors.mutedForeground} />
                )}
              </View>
              <View style={[styles.artworkCaption, { backgroundColor: colors.background + "F0" }]}>
                <Text
                  style={[styles.artworkLabel, { color: colors.foreground }]}
                  numberOfLines={2}
                  ellipsizeMode="middle"
                >
                  {a.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </DetailCard>

      {/* Recortes — table-style Card (muted-foreground icon, count in title) */}
      <DetailCard
        slotRef={slot.registerRef("taskCutsTable")}
        onLayout={track("taskCutsTable")}
        icon={IconCut}
        iconColor={colors.mutedForeground}
        title={`Recortes (${t.cuts.length})`}
        colors={colors}
      >
        {t.cuts.map((c, i) => (
          <View
            key={c.id}
            style={[
              styles.tableRow,
              {
                backgroundColor: i % 2 === 0 ? colors.background : colors.card,
                borderBottomColor: ROW_DIVIDER,
              },
              i === t.cuts.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <IconCut size={14} color={colors.mutedForeground} />
            <Text style={[styles.tableRowText, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {c.label}
            </Text>
            <Text style={[styles.tableRowMeta, { color: colors.mutedForeground }]}>
              {CUT_TYPE_LABELS[c.type] ?? c.type}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: SO_STATUS_COLORS[c.status] ?? "#737373" }]}>
              <Text style={styles.statusText}>{CUT_STATUS_LABELS[c.status] ?? c.status}</Text>
            </View>
          </View>
        ))}
      </DetailCard>

      {/* Aerografias — table-style Card (muted-foreground icon, count in title) */}
      <DetailCard
        slotRef={slot.registerRef("taskAirbrushingsTable")}
        onLayout={track("taskAirbrushingsTable")}
        icon={IconSpray}
        iconColor={colors.mutedForeground}
        title={`Aerografias (${t.airbrushings.length})`}
        colors={colors}
      >
        {t.airbrushings.map((a, i) => (
          <View
            key={a.id}
            style={[
              styles.tableRow,
              {
                backgroundColor: i % 2 === 0 ? colors.background : colors.card,
                borderBottomColor: ROW_DIVIDER,
              },
              i === t.airbrushings.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <IconPaint size={14} color={colors.mutedForeground} />
            <Text style={[styles.tableRowText, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {a.label}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: SO_STATUS_COLORS[a.status] ?? "#737373" }]}>
              <Text style={styles.statusText}>{AIRBRUSHING_STATUS_LABELS[a.status] ?? a.status}</Text>
            </View>
          </View>
        ))}
      </DetailCard>
    </ScrollView>
  );
}

// ─── DetailCard mock (mirrors src/components/ui/detail-page-layout.tsx) ─────

interface DetailCardProps {
  icon: any;
  title: string;
  /** Header icon color. DetailCard sections default to primary; table-style
      Card sections (observations/cuts/airbrushings/layouts) pass mutedForeground. */
  iconColor?: string;
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
  iconColor,
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
          <Icon size={20} color={iconColor ?? colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
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
}: {
  icon: any;
  label: string;
  value: string;
  colors: any;
  monospace?: boolean;
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
            { color: colors.foreground },
            monospace && { fontFamily: "monospace" },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

// ─── PaintChips — type / brand / finish chips for ground & logo paints ──────
// Mirrors task-ground-paints-card / task-logo-paints-card badge row:
// paintType.name, paintBrand.name and PAINT_FINISH_LABELS[finish] as chips.

function PaintChips({
  type,
  brand,
  finish,
  colors,
}: {
  type?: string;
  brand?: string;
  finish?: string;
  colors: any;
}) {
  const chips = [type, brand, finish].filter(Boolean) as string[];
  if (chips.length === 0) return null;
  return (
    <View style={styles.paintBadgesRow}>
      {chips.map((chip) => (
        <View key={chip} style={[styles.paintChip, { backgroundColor: colors.muted }]}>
          <Text style={[styles.paintChipText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {chip}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Card — mirrors the real Card (card.tsx) + detail-page-layout: radius 8
  // (borderRadius.lg), 1px border, shadow.md, paddingHorizontal 8 (spacing.sm),
  // paddingVertical 16 (spacing.md).
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    ...shadow.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  // cardTitle — fontSize.lg (18), fontWeight.medium (500)
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
  cardContent: {
    gap: spacing.md,
  },
  // Count badge — secondary Badge (muted bg, rounded) shown beside section titles.
  countBadge: {
    minWidth: 22,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  // Header card (task name + Edit/Delete actions) — mirrors ScheduleDetailsScreen
  // headerCard: a real Card (radius 8, border, shadow.md), padH16/padV4.
  headerCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadow.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  headerLeft: { flex: 1, marginRight: spacing.sm },
  // taskTitle — fontSize.xl (20), fontWeight.bold (700)
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  // 36×36 inline action buttons, radius 6 (borderRadius.md).
  headerActions: { flexDirection: "row", gap: spacing.sm },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  // Status badge — solid rectangular, radius 6, padH10/padV3, 12/500, white text
  // (mirrors CellContent/Badge solid status badges).
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.md,
    alignSelf: "flex-start",
  },
  statusText: { color: "#ffffff", fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  // DetailField — icon + label above, value in bordered muted card below.
  // Mirrors detail-page-layout: labelText fontSize.sm (14) weight 500,
  // fieldValueCard radius md (6) + padding spacing.sm (8), valueText fontSize.sm (14) weight 600.
  // DetailField — icon+label above, value in bordered muted card below.
  fieldRow: { gap: spacing.xs },
  fieldLabel: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  labelText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  fieldValueCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
  },
  valueText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  // Service row — name + status pill + observation indicator on a single row.
  // The name's flex:1 pushes the status badge and then the observation icon to
  // the right edge; the obs indicator renders AFTER the badge (its far right).
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  serviceName: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  // Inline status pill on the service row — center-aligned, never shrinks
  // (mirrors statusBadgeInline flexShrink:0 in task-services-card).
  serviceStatusPill: { alignSelf: "center", flexShrink: 0 },
  // Observation indicator — 28×28 r6 bordered button with a red "!" badge.
  observationButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  observationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
  },
  observationBadgeText: { color: "#fff", fontSize: 9, fontWeight: fontWeight.bold },
  // General paint card — tinted container (muted+50, r8, pad16) + 56×56 swatch
  // + type/brand chips (mirrors task-general-paint-card paintItemContainer).
  paintItemContainer: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  generalPaintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  generalPaintSwatch: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  // paintName — fontSize.base (16), weight 600
  paintName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  paintBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  // Type/brand chips — r4, padH8/padV3, 12 (task-general-paint-card badge).
  paintChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  paintChipText: { fontSize: fontSize.xs },
  // Logo/ground paint row — 44×44 swatch inside the tinted paintItemContainer
  // (mirrors task-logo-paints-card / task-ground-paints-card 44px preview).
  // The container supplies the padding; this only sets the row layout.
  stackedPaintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mediumPaintSwatch: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  // Info column beside a ground/logo swatch — name + chip row (mirrors the
  // paintInfo column in task-ground-paints-card / task-logo-paints-card).
  paintInfo: { flex: 1, justifyContent: "center", gap: spacing.xs },
  // Table rows (observations, cuts, airbrushings) — alternating bg, minHeight 48,
  // padH10, divider 1px (mirrors the list Table rows used by *-table.tsx cards).
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 48,
    borderBottomWidth: 1,
  },
  tableRowText: { fontSize: 13 },
  tableRowMeta: { fontSize: 11 },
  // Artworks (Layouts) grid — mirrors the real FileItem grid tiles: a rounded
  // bordered card (radius md), a square cover-fit thumbnail on top and a
  // filename caption strip below. 3 per row.
  artworksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  artworkTile: {
    width: "31%",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  artworkThumb: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  artworkThumbImage: {
    width: "100%",
    height: "100%",
  },
  artworkCaption: {
    padding: spacing.sm,
  },
  artworkLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, textAlign: "center" },
});
