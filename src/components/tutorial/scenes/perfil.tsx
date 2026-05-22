import { IconCamera, IconTrash } from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { TUTORIAL_USER } from "../fixtures";
import type { SceneProps } from "./index";

// Mirrors src/app/(tabs)/perfil/index.tsx — vertical stack of cards:
// 1) Foto de Perfil (100x100 circle with initials, Alterar/Remover buttons row)
// 2) Informações Básicas (name, email, phone, position, sector) — some disabled
// 3) Medidas (2-column grid: Camisa / Calça / Bota)
// 4) Endereço (full + complement + city/state split)
// 5) Sticky-style Salvar button at the bottom.
export function PerfilScene(_props: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();

  const initials = TUTORIAL_USER.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Drawer slot anchor (hidden) */}
        <View
          ref={slot.registerRef("drawerPerfil") as any}
          onLayout={slot.register("drawerPerfil")}
          style={{ height: 0 }}
        />

        {/* Foto de Perfil */}
        <View
          ref={slot.registerRef("perfilPhoto") as any}
          onLayout={slot.register("perfilPhoto")}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Foto de Perfil</Text>
          <View style={styles.photoSection}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.photoButtons}>
              <View
                style={[
                  styles.photoButton,
                  styles.outlineButton,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
              >
                <IconCamera size={16} color={colors.foreground} />
                <Text style={[styles.photoButtonText, { color: colors.foreground }]}>
                  Alterar
                </Text>
              </View>
              <View
                style={[
                  styles.photoButton,
                  { backgroundColor: colors.destructive },
                ]}
              >
                <IconTrash size={16} color="#fff" />
                <Text style={[styles.photoButtonText, { color: "#fff" }]}>Remover</Text>
              </View>
            </View>
            <Text style={[styles.photoHint, { color: colors.mutedForeground }]}>
              Formatos: JPG, PNG, GIF, WEBP (máx. 5MB)
            </Text>
          </View>
        </View>

        {/* Informações Básicas */}
        <View
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Informações Básicas
          </Text>
          <Field
            label="Nome"
            value={TUTORIAL_USER.fullName}
            disabled
            colors={colors}
          />
          <Field
            label="E-mail"
            value="pedro.demo@ankaa.com.br"
            colors={colors}
          />
          <Field
            label="Telefone"
            value="(43) 99876-5432"
            colors={colors}
          />
          <Field
            label="Cargo"
            value={TUTORIAL_USER.role}
            disabled
            colors={colors}
          />
          <Field
            label="Setor"
            value={TUTORIAL_USER.sectorName}
            disabled
            colors={colors}
          />
        </View>

        {/* Medidas */}
        <View
          ref={slot.registerRef("perfilSizes") as any}
          onLayout={slot.register("perfilSizes")}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Medidas</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Suas medidas para EPIs (somente leitura)
          </Text>
          <View style={styles.measuresGrid}>
            <Measure label="Camisa" value="M" colors={colors} />
            <Measure label="Calça" value="42" colors={colors} />
            <Measure label="Bota" value="40" colors={colors} />
          </View>
        </View>

        {/* Endereço */}
        <View
          ref={slot.registerRef("perfilAddress") as any}
          onLayout={slot.register("perfilAddress")}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Endereço</Text>
          <View style={styles.addressRow}>
            <View style={styles.addressField}>
              <Field
                label="Endereço"
                value="Rua das Flores"
                colors={colors}
                noBottom
              />
            </View>
            <View style={styles.addressNumberField}>
              <Field label="Nº" value="123" colors={colors} noBottom />
            </View>
          </View>
          <Field label="Complemento" value="Apto 12" colors={colors} />
          <View style={styles.addressRow}>
            <View style={styles.halfField}>
              <Field label="Cidade" value="Ibiporã" colors={colors} noBottom />
            </View>
            <View style={styles.stateField}>
              <Field label="UF" value="PR" colors={colors} noBottom />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky-style save action bar */}
      <View
        style={[
          styles.actionBar,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[
            styles.actionButtonOutline,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.actionButtonText, { color: colors.foreground }]}>
            Restaurar
          </Text>
        </Pressable>
        <Pressable style={[styles.actionButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.actionButtonText, { color: "#fff" }]}>Salvar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  colors,
  disabled,
  noBottom,
}: {
  label: string;
  value: string;
  colors: any;
  disabled?: boolean;
  noBottom?: boolean;
}) {
  return (
    <View style={[styles.fieldContainer, noBottom && { marginBottom: 0 }]}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View
        style={[
          styles.fieldInput,
          {
            borderColor: colors.border,
            backgroundColor: disabled ? colors.muted : colors.background,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Text style={[styles.fieldValue, { color: colors.foreground }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Measure({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.measureItem}>
      <Text style={[styles.measureLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.measureValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  photoSection: {
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  photoButtons: {
    flexDirection: "row",
    gap: 8,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  outlineButton: {
    borderWidth: 1,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  photoHint: {
    fontSize: 12,
    textAlign: "center",
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  fieldInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  fieldValue: {
    fontSize: 14,
  },
  measuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  measureItem: {
    width: "45%",
  },
  measureLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  measureValue: {
    fontSize: 16,
  },
  addressRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  addressField: {
    flex: 2,
  },
  addressNumberField: {
    flex: 1,
  },
  halfField: {
    flex: 1,
  },
  stateField: {
    width: 80,
  },
  actionBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionButtonOutline: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
