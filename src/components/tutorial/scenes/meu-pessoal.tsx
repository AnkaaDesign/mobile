import {
  IconChevronRight,
  IconClockHour4,
  IconShield,
  IconUserCheck,
  IconUsers,
} from "@tabler/icons-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import type { SceneProps } from "./index";

// Leader-only "Minha Equipe" dashboard.
// Top: 3 metric tiles (Total / Ativos hoje / EPIs pendentes).
// Below: stylized team member list (avatar circle + name + role + sector + chevron).
// No real "meu-pessoal" route exists — this is the leader hub the tutorial narrates.
const TEAM = [
  {
    id: "u1",
    name: "Ana Beatriz Souza",
    role: "Pintora",
    sector: "Pintura",
    initials: "AB",
    color: "#0ea5e9",
    status: "active",
    ppePending: 0,
  },
  {
    id: "u2",
    name: "Carlos Henrique Lima",
    role: "Auxiliar de Pintura",
    sector: "Pintura",
    initials: "CH",
    color: "#f97316",
    status: "active",
    ppePending: 1,
  },
  {
    id: "u3",
    name: "Daniela Ferreira",
    role: "Lixadeira",
    sector: "Preparação",
    initials: "DF",
    color: "#8b5cf6",
    status: "active",
    ppePending: 0,
  },
  {
    id: "u4",
    name: "Eduardo Martins",
    role: "Polidor",
    sector: "Acabamento",
    initials: "EM",
    color: "#10b981",
    status: "absent",
    ppePending: 2,
  },
  {
    id: "u5",
    name: "Fabiana Ribeiro",
    role: "Pintora",
    sector: "Pintura",
    initials: "FR",
    color: "#ec4899",
    status: "active",
    ppePending: 0,
  },
  {
    id: "u6",
    name: "Gustavo Almeida",
    role: "Auxiliar Geral",
    sector: "Preparação",
    initials: "GA",
    color: "#f59e0b",
    status: "vacation",
    ppePending: 0,
  },
];

const TOTAL_MEMBERS = TEAM.length;
const ACTIVE_TODAY = TEAM.filter((m) => m.status === "active").length;
const PPE_PENDING = TEAM.reduce((acc, m) => acc + m.ppePending, 0);

export function MeuPessoalScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  const statusMeta = (s: string) => {
    if (s === "active") return { label: "Ativo", color: colors.success };
    if (s === "vacation") return { label: "Férias", color: colors.warning };
    return { label: "Ausente", color: colors.mutedForeground };
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Drawer slot anchor (hidden) + scene-level highlight target */}
      <View
        ref={slot.registerRef("drawerMinhaEquipe") as any}
        onLayout={slot.register("drawerMinhaEquipe")}
        style={{ height: 0 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <IconUsers size={32} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Minha Equipe
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          Acompanhe seus subordinados, escalas e EPIs
        </Text>
      </View>

      {/* Metrics row */}
      <View style={styles.metricsRow}>
        <View
          style={[
            styles.metricTile,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.metricIcon, { backgroundColor: colors.primary + "1a" }]}
          >
            <IconUsers size={18} color={colors.primary} />
          </View>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>
            {TOTAL_MEMBERS}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
            Total
          </Text>
        </View>
        <View
          style={[
            styles.metricTile,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.metricIcon, { backgroundColor: colors.success + "1a" }]}
          >
            <IconUserCheck size={18} color={colors.success} />
          </View>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>
            {ACTIVE_TODAY}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
            Ativos hoje
          </Text>
        </View>
        <View
          style={[
            styles.metricTile,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.metricIcon,
              { backgroundColor: colors.warning + "1a" },
            ]}
          >
            <IconShield size={18} color={colors.warning} />
          </View>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>
            {PPE_PENDING}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
            EPIs pendentes
          </Text>
        </View>
      </View>

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 4,
              height: 18,
              borderRadius: 2,
              backgroundColor: colors.primary,
            }}
          />
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            Subordinados
          </Text>
        </View>
        <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
          {TEAM.length} pessoas
        </Text>
      </View>

      {/* Team list */}
      <View
        style={[
          styles.listCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {TEAM.map((m, idx) => {
          const meta = statusMeta(m.status);
          const isLast = idx === TEAM.length - 1;
          return (
            <View
              key={m.id}
              style={[
                styles.row,
                !isLast && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: m.color }]}>
                <Text style={styles.avatarText}>{m.initials}</Text>
              </View>
              <View style={styles.rowMain}>
                <View style={styles.rowTitleLine}>
                  <Text
                    style={[styles.name, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {m.name}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: meta.color },
                    ]}
                  >
                    <Text style={styles.statusBadgeText} numberOfLines={1}>
                      {meta.label}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.role, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {m.role}
                </Text>
                <View style={styles.metaLine}>
                  <View
                    style={[
                      styles.sectorPill,
                      {
                        backgroundColor: colors.muted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectorPillText,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {m.sector}
                    </Text>
                  </View>
                  {m.ppePending > 0 && (
                    <View
                      style={[
                        styles.ppeBadge,
                        {
                          backgroundColor: colors.warning + "22",
                          borderColor: colors.warning,
                        },
                      ]}
                    >
                      <IconShield size={10} color={colors.warning} />
                      <Text
                        style={[styles.ppeBadgeText, { color: colors.warning }]}
                      >
                        {m.ppePending} EPI{m.ppePending > 1 ? "s" : ""}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <IconChevronRight size={18} color={colors.mutedForeground} />
            </View>
          );
        })}
      </View>

      {/* Footer hint */}
      <View
        style={[
          styles.hintCard,
          { backgroundColor: colors.muted },
        ]}
      >
        <IconClockHour4 size={16} color={colors.mutedForeground} />
        <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
          Toque em um membro para ver detalhes, escalas e histórico de EPIs.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 14, paddingBottom: 100, gap: 12 },
  header: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  metricTile: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 4,
    // Matches the real `Card` (shadow.md).
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  metricLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
    paddingHorizontal: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  sectionCount: { fontSize: 12 },
  listCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    // Matches the real `Card` (shadow.md).
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  // Canonical status badge: r4, padH8/padV2, 11/500, solid bg + white text.
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
  },
  role: {
    fontSize: 12,
  },
  metaLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  sectorPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  sectorPillText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  ppeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  ppeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
