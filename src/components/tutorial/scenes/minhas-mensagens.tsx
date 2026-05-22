import { IconInbox } from "@tabler/icons-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_MESSAGES } from "../fixtures";
import type { SceneProps } from "./index";

const GRID_PADDING = 16;
const CARD_GAP = 8;
const CARD_BODY_HEIGHT = 180;

// Mirrors src/app/(tabs)/pessoal/minhas-mensagens/index.tsx — 2-column grid.
// Each card has a compact tinted header (title + date + "Novo" badge if unread)
// and a body region with a scaled-down preview of the content. Unread cards
// get a 1.5px primary border and tinted header background.
export function MinhasMensagensScene({ state }: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const modalOpen = !!state.mensagensModalOpen;
  // We don't know the actual screen width here (Stage clips to a viewport),
  // so we use a relative 50%-minus-gap layout via the wrapper width.
  return (
    <View
      ref={slot.registerRef("pessoalMensagens") as any}
      onLayout={slot.register("pessoalMensagens")}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {TUTORIAL_MESSAGES.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.muted }]}>
              <IconInbox size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nenhuma mensagem
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              Você não possui mensagens no momento.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {TUTORIAL_MESSAGES.map((m, i) => {
              const isUnread = m.unread;
              return (
                <View
                  key={m.id}
                  ref={i === 0 ? (slot.registerRef("pessoalMensagensFirstItem") as any) : undefined}
                  onLayout={i === 0 ? slot.register("pessoalMensagensFirstItem") : undefined}
                  style={styles.cardWrapper}
                >
                  <View
                    style={[
                      styles.messageCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: isUnread ? colors.primary : colors.border,
                        borderWidth: isUnread ? 1.5 : 1,
                      },
                    ]}
                  >
                    {/* Compact header */}
                    <View
                      style={[
                        styles.cardHeader,
                        {
                          backgroundColor: isUnread
                            ? colors.primary + "15"
                            : colors.muted,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cardTitle,
                          { color: isUnread ? colors.primary : colors.foreground },
                        ]}
                        numberOfLines={1}
                      >
                        {m.title}
                      </Text>
                      <View style={styles.headerMeta}>
                        <Text
                          style={[styles.cardDate, { color: colors.mutedForeground }]}
                          numberOfLines={1}
                        >
                          {m.time}
                        </Text>
                        {isUnread ? (
                          <View
                            style={[
                              styles.newBadge,
                              { backgroundColor: colors.primary },
                            ]}
                          >
                            <Text style={styles.newBadgeText}>Novo</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* Scaled-down content preview */}
                    <View style={styles.cardBody}>
                      <Text
                        style={[styles.bodyText, { color: colors.foreground }]}
                        numberOfLines={8}
                      >
                        {m.excerpt}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {modalOpen ? (
        <View style={styles.modalRoot}>
          <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Procedimento de inspeção
            </Text>
            <Text style={[styles.modalBody, { color: colors.foreground }]}>
              Atenção colaboradores: novo procedimento de inspeção entra em vigor a partir de
              segunda-feira. Toda a equipe de produção deve revisar o material anexo antes do
              próximo turno.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: GRID_PADDING,
    paddingVertical: GRID_PADDING,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  cardWrapper: {
    // 2-column layout: 50% width minus half the gap
    width: `48%`,
  },
  messageCard: {
    overflow: "hidden",
    borderRadius: 8,
  },
  cardHeader: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  cardDate: {
    fontSize: 10,
    lineHeight: 13,
    flex: 1,
  },
  newBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "700",
    lineHeight: 10,
  },
  cardBody: {
    height: CARD_BODY_HEIGHT,
    padding: 8,
    overflow: "hidden",
  },
  bodyText: {
    fontSize: 11,
    lineHeight: 16,
  },
  emptyCard: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyDescription: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 300,
  },
  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 360,
    padding: 18,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalBody: { fontSize: 13, lineHeight: 20 },
});
