import {
  IconBell,
  IconBuildingFactory2,
  IconChevronDown,
  IconChevronRight,
  IconClipboardList,
  IconClockHour4,
  IconHome,
  IconLayoutDashboard,
  IconLogout,
  IconMoon,
  IconPackage,
  IconScissors,
  IconSettings,
  IconSun,
  IconUser,
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
import { NOTIFICATION_TYPE } from "@/constants";
import {
  borderRadius,
  fontSize,
  fontWeight,
  spacing,
} from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { useTheme } from "@/lib/theme";
import { useTutorialStore } from "../engine-store";
import { TUTORIAL_NOTIFICATIONS, TUTORIAL_USER } from "../fixtures";
import { useSlotContext } from "./slot-context";

/**
 * Type-driven icon + colors for notification cards, mirroring the real
 * NotificationDrawerContent (getNotificationIcon / getNotificationIconColor /
 * getNotificationIconBgColor). Each fixture item carries a real `type` field
 * (a NOTIFICATION_TYPE value), so we key the helpers off that enum directly.
 */
const NOTIF_ICON: Record<NOTIFICATION_TYPE, typeof IconBell> = {
  [NOTIFICATION_TYPE.SYSTEM]: IconBell,
  [NOTIFICATION_TYPE.PRODUCTION]: IconBuildingFactory2,
  [NOTIFICATION_TYPE.STOCK]: IconPackage,
  [NOTIFICATION_TYPE.USER]: IconUsers,
  [NOTIFICATION_TYPE.GENERAL]: IconBell,
};

function notifIconColor(type: NOTIFICATION_TYPE, isDark: boolean): string {
  switch (type) {
    case NOTIFICATION_TYPE.SYSTEM:
      return extendedColors.blue[600];
    case NOTIFICATION_TYPE.PRODUCTION:
      return extendedColors.purple[600];
    case NOTIFICATION_TYPE.STOCK:
      return extendedColors.orange[600];
    case NOTIFICATION_TYPE.USER:
      return extendedColors.teal[600];
    case NOTIFICATION_TYPE.GENERAL:
      return extendedColors.indigo[600];
    default:
      return isDark ? extendedColors.neutral[400] : extendedColors.neutral[600];
  }
}

function notifIconBgColor(type: NOTIFICATION_TYPE, isDark: boolean): string {
  switch (type) {
    case NOTIFICATION_TYPE.SYSTEM:
      return isDark ? extendedColors.blue[900] : extendedColors.blue[100];
    case NOTIFICATION_TYPE.PRODUCTION:
      return isDark ? extendedColors.purple[900] : extendedColors.purple[100];
    case NOTIFICATION_TYPE.STOCK:
      return isDark ? extendedColors.orange[900] : extendedColors.orange[100];
    case NOTIFICATION_TYPE.USER:
      return isDark ? extendedColors.teal[900] : extendedColors.teal[100];
    case NOTIFICATION_TYPE.GENERAL:
      return isDark ? extendedColors.indigo[900] : extendedColors.indigo[100];
    default:
      return isDark ? extendedColors.neutral[800] : extendedColors.neutral[100];
  }
}

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
  const { isDark } = useTheme();
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
      {/* Panel pinned to the RIGHT edge. Background matches the real drawers'
          container color (#212121 dark / #fafafa light); the left edge uses the
          dedicated header-border tone (#3a3a3a / #e3e3e3) for a subtle seam. */}
      <View
        style={[
          styles.panel,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: isDark ? "#212121" : "#fafafa",
            borderLeftColor: isDark ? "#3a3a3a" : "#e3e3e3",
          },
        ]}
      >
        {mode === "menu" ? <MenuMode /> : <NotificationsMode />}
      </View>
    </View>
  );
}

function MenuMode() {
  const { colors, isDark } = useTheme();
  const slot = useSlotContext();
  // Mirror the real OriginalMenuDrawer: tapping the avatar opens a dropdown
  // popover (Meu Perfil / Preferências / Tema). The tutorial reveals it by
  // setting `avatarMenuOpen: true` in the step's sceneState; we read that key
  // straight off the shared engine store (fake-stage only forwards `mode`).
  const avatarMenuOpen = useTutorialStore(
    (s) => s.activeSceneState.avatarMenuOpen === true,
  );
  return (
    <View style={{ flex: 1 }}>
      {/* Profile header — tapping the avatar opens Perfil / Configurações in the
          real app, so we expose a dedicated spotlight slot (`chromeDrawerAvatar`)
          alongside the legacy `drawerAvatarButton` anchor. Both register the same
          node, so each resolves to the same rect; the tutorial highlights
          `chromeDrawerAvatar` while `drawer:"menu"`. */}
      <Pressable
        ref={(node) => {
          slot.registerRef("drawerAvatarButton")(node as any);
          slot.registerRef("chromeDrawerAvatar")(node as any);
        }}
        onLayout={(e) => {
          slot.register("drawerAvatarButton")(e);
          slot.register("chromeDrawerAvatar")(e);
        }}
        style={[styles.avatarRow, { borderBottomColor: "rgba(0, 0, 0, 0.05)" }]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarInitial}>{TUTORIAL_USER.firstName.charAt(0)}</Text>
        </View>
        <View style={styles.avatarTextWrap}>
          <Text style={[styles.avatarName, { color: colors.text }]} numberOfLines={1}>
            {TUTORIAL_USER.fullName}
          </Text>
          <Text
            style={[styles.avatarRole, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {TUTORIAL_USER.role} · {TUTORIAL_USER.sectorName}
          </Text>
        </View>
        <IconChevronDown size={16} color={colors.mutedForeground} />
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

      {/* Avatar dropdown popover — mirrors OriginalMenuDrawer's `userDropdown`
          (Meu Perfil / Preferências / Tema). Rendered as an absolute overlay
          anchored just below the 64px avatar row so the spotlight can frame it
          cleanly. Only visible while the step sets `avatarMenuOpen: true`. */}
      {avatarMenuOpen ? <AvatarPopover isDark={isDark} /> : null}
    </View>
  );
}

/**
 * Overlay dropdown shown when the drawer avatar is tapped. Lists "Meu Perfil",
 * "Preferências" and a "Tema" toggle (claro/escuro), matching the real
 * OriginalMenuDrawer user menu. Registers two spotlight slots:
 *   - `chromeAvatarMenu`              → the popover container
 *   - `chromeAvatarMenuPreferencias`  → the Preferências row (interactive target)
 */
function AvatarPopover({ isDark }: { isDark: boolean }) {
  const slot = useSlotContext();
  const rowColor = isDark ? "#d4d4d4" : "#404040";
  return (
    <View
      ref={slot.registerRef("chromeAvatarMenu") as any}
      onLayout={slot.register("chromeAvatarMenu")}
      style={[
        styles.avatarMenu,
        {
          backgroundColor: isDark ? "#2a2a2a" : "#ffffff",
          borderColor: isDark ? "#404040" : "#e0e0e0",
        },
      ]}
    >
      <View style={styles.avatarMenuRow}>
        <IconUser size={22} color={rowColor} />
        <Text style={[styles.avatarMenuLabel, { color: rowColor }]}>Meu Perfil</Text>
      </View>

      <View
        ref={slot.registerRef("chromeAvatarMenuPreferencias") as any}
        onLayout={slot.register("chromeAvatarMenuPreferencias")}
        style={styles.avatarMenuRow}
      >
        <IconSettings size={22} color={rowColor} />
        <Text style={[styles.avatarMenuLabel, { color: rowColor }]}>Preferências</Text>
      </View>

      <View style={styles.avatarMenuRow}>
        {isDark ? (
          <IconMoon size={22} color={rowColor} />
        ) : (
          <IconSun size={22} color={rowColor} />
        )}
        <Text style={[styles.avatarMenuLabel, { color: rowColor }]}>
          {isDark ? "Tema Escuro" : "Tema Claro"}
        </Text>
      </View>
    </View>
  );
}

function NotificationsMode() {
  const { isDark } = useTheme();

  const unread = TUTORIAL_NOTIFICATIONS.filter((n) => n.unread);
  const read = TUTORIAL_NOTIFICATIONS.filter((n) => !n.unread);
  const unreadCount = unread.length;

  return (
    <View style={styles.notifRoot}>
      {/* Header — green avatar + "Notificações" + unread summary + chevron */}
      <View style={styles.notifHeader}>
        <View style={styles.notifHeaderRow}>
          <View style={styles.notifAvatar}>
            <IconBell size={18} color="#fafafa" />
          </View>
          <View style={styles.notifHeaderText}>
            <Text
              style={[styles.notifHeaderTitle, { color: isDark ? "#ffffff" : "#171717" }]}
              numberOfLines={1}
            >
              Notificações
            </Text>
            <Text
              style={[styles.notifHeaderSubtitle, { color: isDark ? "#d4d4d4" : "#525252" }]}
              numberOfLines={1}
            >
              {unreadCount > 0
                ? `${unreadCount} não ${unreadCount === 1 ? "lida" : "lidas"}`
                : "Todas lidas"}
            </Text>
          </View>
          <IconChevronDown size={16} color={isDark ? "#8c8c8c" : "#737373"} />
        </View>
      </View>

      {/* Notification list — split into "NÃO LIDAS" / "LIDAS" sections */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.notifScrollContent}
      >
        {unread.length > 0 && (
          <View style={{ marginBottom: 4 }}>
            <View style={styles.notifSectionHeader}>
              <Text style={[styles.notifSectionTitle, { color: isDark ? "#8c8c8c" : "#737373" }]}>
                NÃO LIDAS
              </Text>
            </View>
            {unread.map((n) => (
              <NotificationCard key={n.id} notification={n} isDark={isDark} />
            ))}
          </View>
        )}

        {read.length > 0 && (
          <View style={{ marginBottom: 4 }}>
            <View style={styles.notifSectionHeader}>
              <Text style={[styles.notifSectionTitle, { color: isDark ? "#8c8c8c" : "#737373" }]}>
                LIDAS
              </Text>
            </View>
            {read.map((n) => (
              <NotificationCard key={n.id} notification={n} isDark={isDark} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function NotificationCard({
  notification,
  isDark,
}: {
  notification: (typeof TUTORIAL_NOTIFICATIONS)[number];
  isDark: boolean;
}) {
  const isUnread = notification.unread;
  // The fixture's `type` is a NOTIFICATION_TYPE value; fall back to GENERAL for
  // any unexpected value so the helpers always resolve to a valid icon/color.
  const type = (notification.type as NOTIFICATION_TYPE) ?? NOTIFICATION_TYPE.GENERAL;
  const Icon = NOTIF_ICON[type] ?? NOTIF_ICON[NOTIFICATION_TYPE.GENERAL];
  const iconColor = notifIconColor(type, isDark);
  const iconBgColor = notifIconBgColor(type, isDark);

  return (
    <View style={styles.notifItem}>
      <View
        style={[
          styles.notifItemPressable,
          isUnread && {
            backgroundColor: isDark
              ? "rgba(21, 128, 61, 0.15)"
              : "rgba(21, 128, 61, 0.1)",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(21, 128, 61, 0.4)"
              : "rgba(21, 128, 61, 0.3)",
          },
        ]}
      >
        <View style={styles.notifItemInner}>
          <View style={styles.notifItemContent}>
            <View style={[styles.notifItemIcon, { backgroundColor: iconBgColor }]}>
              <Icon size={18} color={iconColor} />
            </View>
            <View style={styles.notifTextContainer}>
              <Text
                style={[
                  styles.notifItemTitle,
                  {
                    color: isDark ? "#cccccc" : "#525252",
                    fontWeight: isUnread ? "600" : "500",
                  },
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              <Text
                style={[styles.notifItemBody, { color: isDark ? "#d4d4d4" : "#525252" }]}
                numberOfLines={2}
              >
                {notification.body}
              </Text>
              <Text
                style={[styles.notifItemTime, { color: isDark ? "#8c8c8c" : "#737373" }]}
              >
                {notification.time}
              </Text>
            </View>
          </View>

          {isUnread && (
            <View style={styles.notifUnreadIndicator}>
              <View style={styles.notifUnreadDot} />
            </View>
          )}
        </View>
      </View>
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
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexGrow: 1,
  },
  // Mirrors OriginalMenuDrawer header: minHeight 64, 32×32 avatar, name 14/600.
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md - spacing.xs, // 12, matching the real header avatar gutter
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 64,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarTextWrap: { flex: 1, justifyContent: "center" },
  avatarInitial: { color: "#fafafa", fontSize: fontSize.base, fontWeight: fontWeight.bold },
  avatarName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  avatarRole: { fontSize: fontSize.xs, marginTop: 2 },
  // Avatar dropdown popover — mirrors OriginalMenuDrawer's `userDropdown`:
  // rounded 12 card, 1px border, soft shadow, anchored below the 64px avatar row.
  avatarMenu: {
    position: "absolute",
    top: 64 + spacing.sm,
    left: spacing.md,
    right: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    paddingVertical: spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarMenuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md - spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  avatarMenuLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginLeft: spacing.md - spacing.xs },
  sectionHeader: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md - spacing.xs,
    paddingBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md - spacing.xs,
    paddingHorizontal: spacing.md - spacing.xs,
    paddingVertical: spacing.md - spacing.xs,
    borderRadius: borderRadius.lg,
    minHeight: 44,
  },
  itemLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, flex: 1, letterSpacing: 0.1 },
  notifRoot: { flex: 1 },
  // Header — mirrors NotificationDrawerContent header
  notifHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
  },
  notifHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  notifAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#15803d",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifHeaderText: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    justifyContent: "center",
  },
  notifHeaderTitle: { fontSize: 14, fontWeight: "600" },
  notifHeaderSubtitle: { fontSize: 12, marginTop: 2 },
  // List
  notifScrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  notifSectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  notifSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  // Cards — mirror renderNotificationItem
  notifItem: {
    marginBottom: 4,
  },
  notifItemPressable: {
    borderRadius: 8,
    minHeight: 44,
    marginLeft: 8,
    marginRight: 8,
    overflow: "hidden",
  },
  notifItemInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    minHeight: 44,
  },
  notifItemContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 4,
  },
  notifItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  notifTextContainer: {
    flex: 1,
    gap: 2,
  },
  notifItemTitle: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  notifItemBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  notifItemTime: {
    fontSize: 11,
    marginTop: 4,
  },
  notifUnreadIndicator: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  notifUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#15803d",
  },
});
