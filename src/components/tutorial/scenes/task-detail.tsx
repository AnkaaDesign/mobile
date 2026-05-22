import {
  IconAlertTriangle,
  IconBuilding,
  IconCalendar,
  IconCalendarTime,
  IconClipboardList,
  IconCut,
  IconFactory,
  IconHash,
  IconMapPin,
  IconNote,
  IconNotes,
  IconPaint,
  IconPalette,
  IconPhoto,
  IconScissors,
  IconTags,
  IconTools,
  IconTruck,
  IconUser,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_TASK_DETAIL } from "../fixtures";
import type { SceneProps } from "./index";

// Per-service-order status colors — mirror task-services-card.tsx STATUS_COLORS.
const SO_STATUS_COLORS: Record<string, string> = {
  PENDING: "#737373",
  IN_PROGRESS: "#1d4ed8",
  WAITING_APPROVE: "#9333ea",
  COMPLETED: "#15803d",
  CANCELLED: "#b91c1c",
};

export function TaskDetailScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const t = TUTORIAL_TASK_DETAIL;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 100 }}
    >
      {/* Header card — large title + serial; matches detail header pattern */}
      <View
        ref={slot.registerRef("taskHeader") as any}
        onLayout={slot.register("taskHeader")}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={2}>
              {t.name}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              {t.serial} · {t.truckCategory}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: t.statusColor }]}>
            <Text style={styles.statusText} numberOfLines={1}>
              {t.statusLabel.split(" (")[0]}
            </Text>
          </View>
        </View>
      </View>

      {/* Informações Gerais */}
      <DetailCard
        slotRef={slot.registerRef("taskInfoCard")}
        onLayout={slot.register("taskInfoCard")}
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
        <DetailField icon={IconFactory} label="Setor" value={t.sectorName} colors={colors} />
        <DetailField icon={IconHash} label="Número de Série" value={t.serial} colors={colors} monospace />
        <DetailField icon={IconTruck} label="Categoria" value={t.truckCategory} colors={colors} />
        <DetailField icon={IconMapPin} label="Local" value={t.customerCity} colors={colors} />
        {t.isCommissionable && (
          <View
            ref={slot.registerRef("taskCommissionBadge") as any}
            onLayout={slot.register("taskCommissionBadge")}
            style={[
              styles.commissionRow,
              { borderColor: colors.primary, backgroundColor: colors.primary + "14" },
            ]}
          >
            <Text style={[styles.commissionText, { color: colors.primary }]}>
              Comissão: {t.commissionPercent}%
            </Text>
          </View>
        )}
      </DetailCard>

      {/* Datas */}
      <DetailCard
        slotRef={slot.registerRef("taskDatesCard")}
        onLayout={slot.register("taskDatesCard")}
        icon={IconCalendar}
        title="Datas"
        colors={colors}
      >
        <DetailField icon={IconCalendar} label="Entrada" value={t.entryDate} colors={colors} />
        <DetailField icon={IconCalendarTime} label="Prazo" value={t.term} colors={colors} />
        <DetailField icon={IconCalendar} label="Previsão" value={t.forecast} colors={colors} />
      </DetailCard>

      {/* Serviços */}
      <DetailCard
        slotRef={slot.registerRef("taskServicesCard")}
        onLayout={slot.register("taskServicesCard")}
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
              {/* Row 1: description + observation indicator */}
              <View style={styles.serviceDescRow}>
                <Text
                  style={[styles.serviceName, { color: colors.text, flex: 1 }]}
                  numberOfLines={1}
                >
                  {s.label}
                </Text>
                {s.hasObservation && (
                  <Pressable
                    ref={slot.registerRef("taskServiceObservationIndicator") as any}
                    onLayout={slot.register("taskServiceObservationIndicator")}
                    style={[styles.observationButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                  >
                    <IconNote size={14} color={colors.mutedForeground} />
                    <View style={styles.observationBadge}>
                      <Text style={styles.observationBadgeText}>!</Text>
                    </View>
                  </Pressable>
                )}
              </View>
              {/* Row 2: status pill (solid) */}
              <View style={styles.serviceStatusRow}>
                <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusText}>{s.statusLabel}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </DetailCard>

      {/* Tinta Geral — 56x56 swatch */}
      <DetailCard
        slotRef={slot.registerRef("taskPaintsCard")}
        onLayout={slot.register("taskPaintsCard")}
        icon={IconPaint}
        title="Tinta Geral"
        colors={colors}
      >
        <View style={styles.generalPaintRow}>
          <View
            style={[
              styles.generalPaintSwatch,
              { backgroundColor: t.generalPaint.hex, borderColor: colors.border },
            ]}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.paintName, { color: colors.text }]} numberOfLines={1}>
              {t.generalPaint.name}
            </Text>
            <Text style={[styles.paintMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
              {t.generalPaint.brand} · {t.generalPaint.type}
            </Text>
          </View>
        </View>
      </DetailCard>

      {/* Fundos — 44x44 swatches stacked */}
      <DetailCard
        slotRef={slot.registerRef("taskGroundPaintsCard")}
        onLayout={slot.register("taskGroundPaintsCard")}
        icon={IconPalette}
        title="Fundos"
        colors={colors}
      >
        {t.groundPaints.map((p, i) => (
          <View
            key={i}
            style={[
              styles.stackedPaintRow,
              i !== t.groundPaints.length - 1 && {
                borderBottomColor: colors.border,
                borderBottomWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <View
              style={[styles.mediumPaintSwatch, { backgroundColor: p.hex, borderColor: colors.border }]}
            />
            <Text style={[styles.paintName, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {p.name}
            </Text>
          </View>
        ))}
      </DetailCard>

      {/* Tintas de Logo — 44x44 swatches stacked */}
      <DetailCard
        slotRef={slot.registerRef("taskLogoPaintsCard")}
        onLayout={slot.register("taskLogoPaintsCard")}
        icon={IconTags}
        title="Tintas de Logo"
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
              styles.stackedPaintRow,
              i !== t.logoPaints.length - 1 && {
                borderBottomColor: colors.border,
                borderBottomWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <View
              style={[styles.mediumPaintSwatch, { backgroundColor: p.hex, borderColor: colors.border }]}
            />
            <Text style={[styles.paintName, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {p.name}
            </Text>
          </View>
        ))}
      </DetailCard>

      {/* Observações — table-like */}
      <DetailCard
        slotRef={slot.registerRef("taskObservationsTable")}
        onLayout={slot.register("taskObservationsTable")}
        icon={IconNotes}
        title="Observações"
        badge={
          <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.countBadgeText, { color: colors.text }]}>
              {t.observations.length}
            </Text>
          </View>
        }
        colors={colors}
      >
        {t.observations.map((o, i) => (
          <View
            key={o.id}
            style={[
              styles.tableRow,
              {
                backgroundColor: i % 2 === 0 ? colors.background : colors.card,
                borderBottomColor: colors.border,
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

      {/* Artworks — grid */}
      <DetailCard
        slotRef={slot.registerRef("taskArtworksGallery")}
        onLayout={slot.register("taskArtworksGallery")}
        icon={IconPhoto}
        title="Artworks"
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
            <View
              key={a.id}
              style={[styles.artworkTile, { borderColor: colors.border, backgroundColor: colors.background }]}
            >
              <IconPhoto size={32} color={colors.mutedForeground} />
              <Text
                style={[styles.artworkLabel, { color: colors.text }]}
                numberOfLines={2}
              >
                {a.label}
              </Text>
            </View>
          ))}
        </View>
      </DetailCard>

      {/* Recortes — table */}
      <DetailCard
        slotRef={slot.registerRef("taskCutsTable")}
        onLayout={slot.register("taskCutsTable")}
        icon={IconScissors}
        title="Recortes"
        badge={
          <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.countBadgeText, { color: colors.text }]}>
              {t.cuts.length}
            </Text>
          </View>
        }
        colors={colors}
      >
        {t.cuts.map((c, i) => (
          <View
            key={c.id}
            style={[
              styles.tableRow,
              {
                backgroundColor: i % 2 === 0 ? colors.background : colors.card,
                borderBottomColor: colors.border,
              },
              i === t.cuts.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <IconCut size={14} color={colors.mutedForeground} />
            <Text style={[styles.tableRowText, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {c.label}
            </Text>
            <Text style={[styles.tableRowMeta, { color: colors.mutedForeground }]}>
              {c.type}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: SO_STATUS_COLORS[c.status] ?? "#737373" }]}>
              <Text style={styles.statusText}>{c.status}</Text>
            </View>
          </View>
        ))}
      </DetailCard>

      {/* Aerografias — table */}
      <DetailCard
        slotRef={slot.registerRef("taskAirbrushingsTable")}
        onLayout={slot.register("taskAirbrushingsTable")}
        icon={IconPaint}
        title="Aerografias"
        badge={
          <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.countBadgeText, { color: colors.text }]}>
              {t.airbrushings.length}
            </Text>
          </View>
        }
        colors={colors}
      >
        {t.airbrushings.map((a, i) => (
          <View
            key={a.id}
            style={[
              styles.tableRow,
              {
                backgroundColor: i % 2 === 0 ? colors.background : colors.card,
                borderBottomColor: colors.border,
              },
              i === t.airbrushings.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <IconPaint size={14} color={colors.mutedForeground} />
            <Text style={[styles.tableRowText, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {a.label}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: SO_STATUS_COLORS[a.status] ?? "#737373" }]}>
              <Text style={styles.statusText}>{a.status}</Text>
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
            { color: colors.text },
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
  // Card — 8px radius, 1px border, card bg
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
  countBadge: {
    minWidth: 22,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Header card (task name + status)
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { fontSize: 12 },
  // Status pill — solid rectangular, radius 6, padX 10, padY 3, fs 12 w 500
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusText: { color: "#ffffff", fontSize: 12, fontWeight: "500" },
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
  // Commission banner
  commissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  commissionText: { fontSize: 13, fontWeight: "600" },
  // Service row — description on top, status pill below
  serviceRow: {
    paddingVertical: 10,
    gap: 6,
  },
  serviceDescRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  serviceName: { fontSize: 14, fontWeight: "500" },
  observationButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
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
  observationBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  serviceStatusRow: { marginTop: 2 },
  // General paint card — 56x56 swatch
  generalPaintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  generalPaintSwatch: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
  },
  paintName: { fontSize: 14, fontWeight: "600" },
  paintMeta: { fontSize: 12 },
  // Logo paint row — 44x44 swatch
  stackedPaintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  mediumPaintSwatch: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  // Table rows for observations, cuts, airbrushings — alternating bg, 48px-ish min height
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 48,
    borderBottomWidth: 1,
  },
  tableRowText: { fontSize: 13 },
  tableRowMeta: { fontSize: 11 },
  // Artworks grid — 3 columns
  artworksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  artworkTile: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 6,
  },
  artworkLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },
});
