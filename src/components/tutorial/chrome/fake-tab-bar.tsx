import {
  IconBriefcase,
  IconHome,
  IconPackages,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fontWeight, spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

/**
 * Fake bottom tab bar.
 *
 * NOTE: the real Ankaa app navigates via a RIGHT-side Drawer
 * (`src/navigation/privilege-layout.tsx`) and renders NO bottom
 * tab bar, so the tutorial Stage (`fake-stage.tsx`) does not mount this
 * component. It is retained for the `SCENE_TAB` mapping contract and as an
 * optional bottom-nav affordance. When shown, it uses the real palette: active
 * tab tinted with the primary (#15803d), inactive with mutedForeground, on the
 * scene background with a 1px top border in the dedicated chrome border tone.
 */
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
  const { colors, isDark } = useTheme();
  // Dedicated chrome border tone (matches the fake header / drawer seam).
  const chromeBorder = isDark ? "#3a3a3a" : "#e3e3e3";
  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: insets.bottom + spacing.xs,
          backgroundColor: colors.background,
          borderTopColor: chromeBorder,
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
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
  },
  label: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
  },
});
