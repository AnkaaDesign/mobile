import {
  IconBell,
  IconBriefcase,
  IconChevronDown,
  IconChevronRight,
  IconClipboardList,
  IconClockHour4,
  IconHome,
  IconLayoutDashboard,
  IconLogout,
  IconScissors,
  IconSettings,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "./slot-context";

/**
 * Fake side drawer — slides in from the RIGHT (matches the real app).
 *   - mode "menu"          → standard nav drawer
 *   - mode "notifications" → notifications panel
 *
 * Width 280px, positioned at the right edge with a backdrop scrim on the
 * left side that closes the drawer when tapped.
 */
interface Props {
  mode: "menu" | "notifications";
  onCloseBackdrop: () => void;
}

const DRAWER_WIDTH = 280;

export function FakeDrawer({ mode, onCloseBackdrop }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const slot = useSlotContext();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop fills the LEFT portion (everything not covered by the drawer) */}
      <Pressable
        ref={slot.registerRef("notificationsCloseBackdrop") as any}
        onLayout={slot.register("notificationsCloseBackdrop")}
        onPress={onCloseBackdrop}
        style={[styles.backdrop, { right: DRAWER_WIDTH }]}
      />
      {/* Panel pinned to the RIGHT edge */}
      <View
        style={[
          styles.panel,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: isDark ? "#212121" : "#fafafa",
            borderLeftColor: colors.border,
          },
        ]}
      >
        {mode === "menu" ? <MenuMode /> : <NotificationsMode />}
      </View>
    </View>
  );
}

function MenuMode() {
  const { colors } = useTheme();
  const slot = useSlotContext();
  return (
    <View style={{ flex: 1 }}>
      <Pressable
        ref={slot.registerRef("drawerAvatarButton") as any}
        onLayout={slot.register("drawerAvatarButton")}
        style={[styles.avatarRow, { borderBottomColor: colors.border }]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarInitial}>P</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.avatarName, { color: colors.text }]}>Pedro Demo</Text>
          <Text style={[styles.avatarRole, { color: colors.mutedForeground }]}>
            Pintor · Produção
          </Text>
        </View>
        <IconChevronDown size={18} color={colors.mutedForeground} />
      </Pressable>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <DrawerItem icon={IconHome} label="Início" slotName="drawerInicio" />

        <SectionHeader label="Produção" />
        <DrawerItem icon={IconClipboardList} label="Cronograma" slotName="drawerCronograma" />
        <DrawerItem icon={IconClockHour4} label="Histórico" slotName="drawerHistorico" />
        <DrawerItem icon={IconLayoutDashboard} label="Observações" slotName="drawerObservacoes" />
        <DrawerItem icon={IconScissors} label="Recorte" slotName="drawerRecorte" />

        <SectionHeader label="Pessoal" />
        <DrawerItem icon={IconUserCircle} label="Pessoal" slotName="drawerPessoal" />
        <DrawerItem icon={IconUserCircle} label="Meu Perfil" slotName="drawerPerfil" />
        <DrawerItem icon={IconSettings} label="Preferências" slotName="drawerConfiguracoes" />

        <SectionHeader label="Liderança" />
        <DrawerItem icon={IconUsers} label="Minha Equipe" slotName="drawerMinhaEquipe" />

        <View style={{ flex: 1 }} />
        <DrawerItem icon={IconLogout} label="Sair" />
      </ScrollView>
    </View>
  );
}

function NotificationsMode() {
  const { colors } = useTheme();
  return (
    <View style={styles.notifRoot}>
      <View style={[styles.notifHeader, { borderBottomColor: colors.border }]}>
        <IconBell size={20} color={colors.primary} />
        <Text style={[styles.notifTitle, { color: colors.text }]}>Notificações</Text>
        <View style={[styles.notifBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.notifBadgeText}>4</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {[
          { t: "Tarefa atribuída", d: "Você foi designado para Frota Modelo S.A.", time: "agora", unread: true },
          { t: "Recorte pronto", d: "Estrela lateral disponível para retirada.", time: "1 h", unread: true },
          { t: "Manutenção programada", d: "Sistema offline dia 23/06 22h-23h.", time: "ontem", unread: false },
          { t: "Tarefa em atraso", d: "Transportadora Tour com prazo vencido.", time: "ontem", unread: false },
        ].map((n, i) => (
          <View
            key={i}
            style={[
              styles.notifCard,
              {
                backgroundColor: colors.card,
                borderColor: n.unread ? colors.primary : colors.border,
              },
            ]}
          >
            <View style={styles.notifCardHeader}>
              <Text style={[styles.notifCardTitle, { color: colors.text }]}>{n.t}</Text>
              <Text style={[styles.notifCardTime, { color: colors.mutedForeground }]}>
                {n.time}
              </Text>
            </View>
            <Text style={[styles.notifCardBody, { color: colors.mutedForeground }]}>
              {n.d}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function SectionHeader({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
      {label}
    </Text>
  );
}

function DrawerItem({
  icon: Icon,
  label,
  slotName,
}: {
  icon: typeof IconHome;
  label: string;
  slotName?: string;
}) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const refCb = slotName ? slot.registerRef(slotName) : undefined;
  const onLayout = slotName ? slot.register(slotName) : undefined;
  return (
    <Pressable ref={refCb as any} onLayout={onLayout} style={styles.itemRow}>
      <Icon size={20} color={colors.text} />
      <Text style={[styles.itemLabel, { color: colors.text }]}>{label}</Text>
      <IconChevronRight size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  panel: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: { paddingHorizontal: 8, paddingVertical: 4, flexGrow: 1 },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "#fff", fontSize: 18, fontWeight: "700" },
  avatarName: { fontSize: 14, fontWeight: "700" },
  avatarRole: { fontSize: 11 },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
  },
  itemLabel: { fontSize: 14, fontWeight: "500", flex: 1 },
  notifRoot: { flex: 1 },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  notifTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  notifBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  notifCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  notifCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifCardTitle: { fontSize: 14, fontWeight: "700" },
  notifCardTime: { fontSize: 11 },
  notifCardBody: { fontSize: 13 },
});
