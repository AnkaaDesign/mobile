import {
  IconBell,
  IconChevronRight,
  IconPalette,
  IconRefresh,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/pessoal/preferencias/index.tsx — header + vertical
// list of preference cards (Tema, Notificações, Repetir tutorial). Each row:
// icon (primary 20px) + title (semibold 16) + subtitle (muted 13) + chevron.
export function PreferenciasScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Preferências</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Configure suas preferências do aplicativo
        </Text>
      </View>

      {/* Preference items */}
      <View style={styles.content}>
        <PreferenceRow
          slotRegister={slot.registerRef("preferencesThemeCard")}
          slotLayout={slot.register("preferencesThemeCard")}
          icon={IconPalette}
          title="Tema"
          description="Aparência do aplicativo"
          colors={colors}
        />
        <PreferenceRow
          slotRegister={slot.registerRef("preferencesNotificationsCard")}
          slotLayout={slot.register("preferencesNotificationsCard")}
          icon={IconBell}
          title="Notificações"
          description="Configurar notificações"
          colors={colors}
        />
        <PreferenceRow
          slotRegister={slot.registerRef("preferencesReplayButton")}
          slotLayout={slot.register("preferencesReplayButton")}
          icon={IconRefresh}
          title="Repetir tutorial"
          description="Reveja o tour guiado do app"
          colors={colors}
        />
      </View>
    </ScrollView>
  );
}

function PreferenceRow({
  slotRegister,
  slotLayout,
  icon: Icon,
  title,
  description,
  colors,
}: {
  slotRegister: any;
  slotLayout: any;
  icon: any;
  title: string;
  description: string;
  colors: any;
}) {
  return (
    <Pressable
      ref={slotRegister}
      onLayout={slotLayout}
      style={[
        styles.preferenceCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.preferenceLeft}>
        <Icon size={20} color={colors.primary} />
        <View style={styles.preferenceText}>
          <Text style={[styles.preferenceTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.preferenceDescription, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        </View>
      </View>
      <IconChevronRight size={20} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: 16,
  },
  preferenceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    // Matches the real `Card` (shadow.md).
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  preferenceLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
  },
});
