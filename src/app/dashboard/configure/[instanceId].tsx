// Configure-widget screen — expo-router route reached from a tile's gear
// button in edit mode. Renders the widget's custom ConfigComponent if it
// exposes one, otherwise auto-generates a form from the Zod schema via
// DynamicFormField. Validates draft on save; surfaces inline error on fail.

import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedSafeAreaView } from "@/components/ui/themed-safe-area-view";
import { useDashboardLayout } from "@/dashboard/hooks/use-dashboard-layout";
import { widgetRegistry } from "@/dashboard/registry";
import { DynamicFormField } from "@/dashboard/components/dynamic-form-field";

export default function ConfigureWidgetScreen() {
  const { instanceId } = useLocalSearchParams<{ instanceId: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  // The configure route is only reachable through edit mode, so the layout
  // hook is already in `isEditing`. We still pull it here to mutate config.
  const { layout, configureWidget } = useDashboardLayout();

  const instance = useMemo(
    () => layout.items.find((it) => it.instanceId === instanceId),
    [layout.items, instanceId],
  );
  const def = instance ? widgetRegistry.get(instance.widgetId) : undefined;

  // Local draft so the user can cancel without committing to the layout state.
  const [draft, setDraft] = useState<unknown>(
    instance?.config ?? def?.defaultConfig ?? {},
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (instance) {
      setDraft(instance.config ?? def?.defaultConfig ?? {});
      setError(null);
    }
  }, [instance, def]);

  if (!instance || !def) {
    return (
      <ThemedSafeAreaView edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ padding: 16 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 }}
          >
            <IconArrowLeft size={18} color={colors.foreground} />
            <Text style={{ fontSize: 14, color: colors.foreground }}>Voltar</Text>
          </Pressable>
          <Text style={{ color: colors.mutedForeground }}>
            Widget não encontrado.
          </Text>
        </View>
      </ThemedSafeAreaView>
    );
  }

  const handleSave = () => {
    const parsed = def.configSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Configuração inválida.");
      return;
    }
    configureWidget(instance.instanceId, parsed.data);
    router.back();
  };

  const Custom = def.ConfigComponent;

  return (
    <ThemedSafeAreaView edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Custom header — keeps consistent chrome regardless of stack config */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              opacity: pressed ? 0.5 : 1,
              minWidth: 80,
            })}
          >
            <IconArrowLeft size={20} color={colors.foreground} />
            <Text style={{ fontSize: 14, color: colors.foreground }}>Voltar</Text>
          </Pressable>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.foreground,
              flex: 1,
              textAlign: "center",
            }}
          >
            Configurar: {def.name}
          </Text>
          <Pressable
            onPress={handleSave}
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              opacity: pressed ? 0.5 : 1,
              minWidth: 80,
              justifyContent: "flex-end",
            })}
          >
            <IconCheck size={20} color={colors.primary} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>
              Aplicar
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {def.description && (
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              {def.description}
            </Text>
          )}
          {Custom ? (
            <Custom config={draft} onChange={setDraft} />
          ) : (
            <DynamicFormField
              schema={def.configSchema}
              value={draft}
              onChange={setDraft}
            />
          )}
          {error && (
            <Text style={{ fontSize: 13, color: "#ef4444" }}>{error}</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}
