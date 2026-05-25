import {
  IconBell,
  IconBrandWhatsapp,
  IconBuildingFactory2,
  IconChevronDown,
  IconDeviceMobile,
  IconInfoCircle,
  IconMail,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import type { SceneProps } from "./index";

// Channel metadata mirrors the real notification-preferences screen.
type ChannelKey = "IN_APP" | "PUSH" | "EMAIL" | "WHATSAPP";

const CHANNELS: {
  key: ChannelKey;
  label: string;
  icon: any;
  color: string;
  bg: string; // light-mode bg
  bgDark: string;
  border: string;
  borderDark: string;
}[] = [
  {
    key: "IN_APP",
    label: "In-App",
    icon: IconBell,
    color: "#f97316", // orange
    bg: "#fff7ed",
    bgDark: "#431407",
    border: "#fed7aa",
    borderDark: "#9a3412",
  },
  {
    key: "PUSH",
    label: "Push",
    icon: IconDeviceMobile,
    color: "#3b82f6", // blue
    bg: "#eff6ff",
    bgDark: "#172554",
    border: "#bfdbfe",
    borderDark: "#1e40af",
  },
  {
    key: "EMAIL",
    label: "E-mail",
    icon: IconMail,
    color: "#a855f7", // purple
    bg: "#faf5ff",
    bgDark: "#3b0764",
    border: "#e9d5ff",
    borderDark: "#6b21a8",
  },
  {
    key: "WHATSAPP",
    label: "WhatsApp",
    icon: IconBrandWhatsapp,
    color: "#22c55e", // green
    bg: "#f0fdf4",
    bgDark: "#052e16",
    border: "#bbf7d0",
    borderDark: "#166534",
  },
];

// "selected" = a tuple of booleans, one per CHANNELS entry.
type SelectedTuple = [boolean, boolean, boolean, boolean];

const SECTIONS: {
  id: string;
  title: string;
  icon: any;
  items: { label: string; selected: SelectedTuple; mandatory?: SelectedTuple }[];
}[] = [
  {
    id: "task",
    title: "Produção",
    icon: IconBuildingFactory2,
    items: [
      { label: "Tarefa atribuída", selected: [true, true, false, false] },
      { label: "Status alterado", selected: [true, false, false, false] },
      { label: "Prazo próximo", selected: [true, true, true, false], mandatory: [true, false, false, false] },
    ],
  },
  {
    id: "user",
    title: "Usuário",
    icon: IconUsers,
    items: [
      { label: "Advertência recebida", selected: [true, true, true, false], mandatory: [true, false, false, false] },
      { label: "Ausência registrada", selected: [true, false, false, false] },
      { label: "EPI disponível", selected: [true, true, false, false] },
    ],
  },
  {
    id: "sys",
    title: "Sistema",
    icon: IconSettings,
    items: [
      { label: "Comunicados", selected: [true, true, false, false] },
      { label: "Manutenção programada", selected: [true, false, false, false] },
    ],
  },
];

export function NotifPrefsScene(_props: SceneProps) {
  const { colors, isDark } = useTheme();
  const slot = useSlotContext();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Preferências de Notificação
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Escolha como deseja ser notificado para cada tipo de evento
        </Text>
      </View>

      {/* Channel Legend */}
      <View
        ref={slot.registerRef("notifPrefsLegend") as any}
        onLayout={slot.register("notifPrefsLegend")}
        style={[styles.legend, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>
          Canais:
        </Text>
        <View style={styles.legendChannels}>
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            return (
              <View key={c.key} style={styles.legendItem}>
                <Icon size={16} color={c.color} />
                <Text style={[styles.legendText, { color: colors.foreground }]}>
                  {c.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Search */}
      <View
        style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <IconSearch size={18} color={colors.mutedForeground} />
        <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
          Buscar notificação...
        </Text>
      </View>

      {/* Accordion sections */}
      {SECTIONS.map((section, si) => {
        const SectionIcon = section.icon;
        return (
          <View
            key={section.id}
            ref={si === 0 ? (slot.registerRef("notifPrefsFirstSection") as any) : undefined}
            onLayout={si === 0 ? slot.register("notifPrefsFirstSection") : undefined}
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* Accordion trigger */}
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <SectionIcon size={18} color={colors.primary} />
              </View>
              <View style={styles.sectionInfo}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {section.title}
                </Text>
                <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                  {section.items.length} eventos
                </Text>
              </View>
              <IconChevronDown size={18} color={colors.mutedForeground} />
            </View>

            {/* Rows */}
            <View style={styles.sectionContent}>
              {section.items.map((item, ri) => {
                const isFirstChannelRow = si === 0 && ri === 0;
                return (
                  <View
                    key={item.label}
                    ref={isFirstChannelRow ? (slot.registerRef("notifPrefsChannelToggles") as any) : undefined}
                    onLayout={isFirstChannelRow ? slot.register("notifPrefsChannelToggles") : undefined}
                    style={[styles.preferenceRow, { borderBottomColor: colors.border }]}
                  >
                    <View style={styles.preferenceInfo}>
                      <Text style={[styles.preferenceLabel, { color: colors.foreground }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.preferenceDescription, { color: colors.mutedForeground }]}>
                        Notificar quando ocorrer
                      </Text>
                    </View>
                    <View style={styles.channelsRow}>
                      {CHANNELS.map((c, ci) => {
                        const Icon = c.icon;
                        const isSelected = item.selected[ci];
                        const isMandatory = item.mandatory?.[ci] ?? false;
                        const filled = isMandatory; // mandatory = filled bg + colored border
                        const outlined = isSelected && !isMandatory; // selected = colored border, no fill
                        const muted = !isSelected && !isMandatory;
                        return (
                          <View
                            key={c.key}
                            style={[
                              styles.channelButton,
                              filled
                                ? {
                                    borderColor: isDark ? c.borderDark : c.border,
                                    backgroundColor: isDark ? c.bgDark : c.bg,
                                  }
                                : outlined
                                ? {
                                    borderColor: isDark ? c.borderDark : c.border,
                                    backgroundColor: colors.background,
                                  }
                                : {
                                    borderColor: colors.muted,
                                    backgroundColor: colors.background,
                                  },
                            ]}
                          >
                            <Icon
                              size={20}
                              color={muted ? colors.mutedForeground : c.color}
                            />
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      {/* Info card */}
      <View
        style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <IconInfoCircle size={20} color={colors.primary} />
        <View style={styles.infoText}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>
            Alterações são salvas automaticamente
          </Text>
          <Text style={[styles.infoDescription, { color: colors.mutedForeground }]}>
            Suas preferências são atualizadas imediatamente ao alternar os canais.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    // Matches the real `Card` (shadow.md).
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  legendChannels: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendText: {
    fontSize: 13,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    // Matches the real `Card` (shadow.md).
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    // Matches the real `Card` (shadow.md).
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionInfo: {
    marginLeft: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionCount: {
    fontSize: 12,
  },
  sectionContent: {
    marginTop: 8,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 8,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 12,
  },
  channelsRow: {
    flexDirection: "row",
    gap: 4,
  },
  channelButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    // Matches the real `Card` (shadow.md).
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 12,
  },
});
