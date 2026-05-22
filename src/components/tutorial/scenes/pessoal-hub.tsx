import {
  IconActivity,
  IconAlertTriangle,
  IconCalendarEvent,
  IconClock,
  IconCoin,
  IconMessageCircle,
  IconPackage,
  IconShield,
} from "@tabler/icons-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/pessoal/index.tsx structure 1:1 — same icons, labels,
// descriptions, ordering and 2-column 120px-card grid.
const CARDS: { slot: string; title: string; description: string; icon: any }[] = [
  {
    slot: "pessoalGridCardFeriados",
    title: "Meus Feriados",
    description: "Feriados do ano",
    icon: IconCalendarEvent,
  },
  {
    slot: "pessoalGridCardEpis",
    title: "Meus EPIs",
    description: "Equipamentos de proteção",
    icon: IconShield,
  },
  {
    slot: "pessoalGridCardEmprestimos",
    title: "Meus Empréstimos",
    description: "Ferramentas emprestadas",
    icon: IconPackage,
  },
  {
    slot: "pessoalGridCardMovimentacoes",
    title: "Minhas Movimentações",
    description: "Histórico de movimentações",
    icon: IconActivity,
  },
  {
    slot: "pessoalGridCardBonus",
    title: "Meu Bônus",
    description: "Bônus e simulações",
    icon: IconCoin,
  },
  {
    slot: "pessoalGridCardPontos",
    title: "Meus Pontos",
    description: "Registro de ponto",
    icon: IconClock,
  },
  {
    slot: "pessoalGridCardMensagens",
    title: "Minhas Mensagens",
    description: "Mensagens e comunicados",
    icon: IconMessageCircle,
  },
  {
    slot: "pessoalGridCardAdvertencias",
    title: "Minhas Advertências",
    description: "Registros de advertências",
    icon: IconAlertTriangle,
  },
];

export function PessoalHubScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View
        ref={slot.registerRef("pessoalGrid") as any}
        onLayout={slot.register("pessoalGrid")}
        style={styles.grid}
      >
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <View key={c.slot} style={styles.itemContainer}>
              <View
                ref={slot.registerRef(c.slot) as any}
                onLayout={slot.register(c.slot)}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.iconContainer}>
                  <Icon size={28} color={colors.primary} />
                </View>
                <Text
                  style={[styles.title, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {c.title}
                </Text>
                <Text
                  style={[styles.description, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {c.description}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  itemContainer: {
    width: "50%",
    padding: 4,
  },
  card: {
    paddingHorizontal: 8,
    paddingVertical: 16,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 12 * 1.3,
    height: 12 * 1.3 * 2,
  },
});
