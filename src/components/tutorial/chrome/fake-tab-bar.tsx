import {
  IconBriefcase,
  IconHome,
  IconPackages,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";

type TabId = "inicio" | "pessoal" | "estoque" | "producao" | "rh";

interface Props {
  active: TabId | null;
}

const TABS: { id: TabId; label: string; icon: typeof IconHome }[] = [
  { id: "inicio", label: "Início", icon: IconHome },
  { id: "pessoal", label: "Pessoal", icon: IconUserCircle },
  { id: "estoque", label: "Estoque", icon: IconPackages },
  { id: "producao", label: "Produção", icon: IconBriefcase },
  { id: "rh", label: "Rec. Humanos", icon: IconUsers },
];

export function FakeTabBar({ active }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: insets.bottom + 4,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      ]}
    >
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = t.id === active;
        const tint = isActive ? colors.primary : colors.mutedForeground;
        return (
          <Pressable key={t.id} style={styles.tab} disabled>
            <Icon size={22} color={tint} />
            <Text
              style={[styles.label, { color: tint }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
  },
});
