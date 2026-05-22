/**
 * Stub scene generator. Each scene file imports this and exports its own
 * named component. Used to keep the registry compiling while real scenes
 * are filled in iteratively.
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import type { SceneProps } from "./index";

export function makeStubScene(name: string, slots: string[]) {
  return function StubScene(_props: SceneProps) {
    const { colors } = useTheme();
    const slot = useSlotContext();
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 80 }}
      >
        <View
          style={[
            styles.placeholder,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Cena em construção
          </Text>
        </View>
        {slots.map((s) => (
          <View
            key={s}
            ref={slot.registerRef(s) as any}
            onLayout={slot.register(s)}
            style={[
              styles.slot,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>{s}</Text>
          </View>
        ))}
      </ScrollView>
    );
  };
}

const styles = StyleSheet.create({
  placeholder: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 13 },
  slot: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});
