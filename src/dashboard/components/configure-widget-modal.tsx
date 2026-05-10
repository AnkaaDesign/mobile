// Mobile widget configuration modal — opens from a tile's gear button in
// edit mode. Replaces the previous full-screen `/dashboard/configure/[id]`
// route with a Sheet, mirroring web's `<ConfigureWidgetModal>` flow so the
// user can adjust size + appearance + filters without losing the dashboard
// behind it. Holds a draft of the config locally and only commits via
// configureWidget()/resizeWidget() on Aplicar.
//
// Layout (top → bottom):
//   1. Sticky header   — title + close (X) on the right
//   2. Scrollable body — Tamanho section, custom or dynamic config, error
//   3. Sticky footer   — Cancelar / Aplicar buttons
//
// State management:
//   The inner ModalBody is keyed by instanceId so opening the modal for a
//   different widget remounts it with fresh draft state. This avoids a
//   setState-in-effect cascade that the React Compiler flags, and matches
//   how web's modal handles a different widget via component remount.
//
// The Sheet from @/components/ui/sheet expects integer percentages, NOT
// decimals — so snapPoints={[90]} (not [0.9]).

import { type ReactNode, useState } from "react";
import { View, Text, Pressable, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { IconX, IconCheck, IconRestore } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { Sheet } from "@/components/ui/sheet";
import { widgetRegistry } from "../registry";
import { DynamicFormField } from "./dynamic-form-field";
import { SizeSelector } from "./size-selector";
import type { WidgetInstance, WidgetSize } from "../types";

interface ConfigureWidgetModalProps {
  /** When non-null, the modal opens for this instance. Pass null to close. */
  instance: WidgetInstance | null;
  onClose: () => void;
  onApplyConfig: (instanceId: string, config: unknown) => void;
  onApplySize: (instanceId: string, size: WidgetSize) => void;
}

export function ConfigureWidgetModal({
  instance,
  onClose,
  onApplyConfig,
  onApplySize,
}: ConfigureWidgetModalProps) {
  const def = instance ? widgetRegistry.get(instance.widgetId) : undefined;
  const open = !!instance && !!def;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      snapPoints={[90]}
      backdropOpacity={0.45}
    >
      {open && instance && def && (
        <ModalBody
          key={instance.instanceId}
          instance={instance}
          def={def}
          onClose={onClose}
          onApplyConfig={onApplyConfig}
          onApplySize={onApplySize}
        />
      )}
    </Sheet>
  );
}

interface ModalBodyProps {
  instance: WidgetInstance;
  def: ReturnType<typeof widgetRegistry.get>;
  onClose: () => void;
  onApplyConfig: (instanceId: string, config: unknown) => void;
  onApplySize: (instanceId: string, size: WidgetSize) => void;
}

function ModalBody({
  instance,
  def,
  onClose,
  onApplyConfig,
  onApplySize,
}: ModalBodyProps) {
  const { colors } = useTheme();

  // Drafts initialized once from props because the parent re-mounts via
  // the `key` whenever the instance changes — so this state always belongs
  // to the currently-active widget without needing an effect to sync.
  const [configDraft, setConfigDraft] = useState<unknown>(
    instance.config ?? def?.defaultConfig ?? {},
  );
  const [sizeDraft, setSizeDraft] = useState<WidgetSize>(instance.size);
  const [error, setError] = useState<string | null>(null);

  if (!def) return null;
  const Custom = def.ConfigComponent;

  const handleApply = () => {
    const parsed = def.configSchema.safeParse(configDraft);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Configuração inválida.");
      return;
    }
    onApplyConfig(instance.instanceId, parsed.data);
    onApplySize(instance.instanceId, sizeDraft);
    onClose();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      {/* Sticky header — taller padding so the title block has breathing
          room and doesn't sit flush with the sheet edge. The Sheet
          primitive itself renders the drag-indicator pill above this
          header (default `dragIndicator={true}`), so we must NOT add a
          second one here — that produced two visible grab handles. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 17,
              fontWeight: "600",
              color: colors.foreground,
            }}
          >
            Configurar: {def.name}
          </Text>
          {def.description && (
            <Text
              numberOfLines={2}
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                marginTop: 4,
                lineHeight: 18,
              }}
            >
              {def.description}
            </Text>
          )}
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          accessibilityLabel="Fechar"
          style={({ pressed }) => ({
            padding: 8,
            borderRadius: 6,
            backgroundColor: pressed ? colors.muted : "transparent",
          })}
        >
          <IconX size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Scrollable body */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 24,
          gap: 12,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Tamanho — always rendered so the user discovers width/height
            controls without having to dig. */}
        <ConfigCard title="Tamanho">
          <SizeSelector
            value={sizeDraft}
            allowedSpans={def.allowedSpans}
            allowedHeights={def.allowedHeights}
            onChange={setSizeDraft}
          />
        </ConfigCard>

        {/* Widget-specific config (custom component or auto-generated). */}
        <ConfigCard title="Configurações do widget">
          {Custom ? (
            <Custom config={configDraft} onChange={setConfigDraft} />
          ) : (
            <DynamicFormField
              schema={def.configSchema}
              value={configDraft}
              onChange={setConfigDraft}
            />
          )}
        </ConfigCard>

        {error && (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#ef4444",
              backgroundColor: "rgba(239,68,68,0.08)",
              borderRadius: 6,
              padding: 10,
            }}
          >
            <Text style={{ fontSize: 12, color: "#ef4444" }}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky footer — Restaurar / Cancelar / Aplicar.
          Restaurar resets the in-flight draft to def.defaultConfig but keeps
          the modal open so the user can review before committing. */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <Pressable
          onPress={() => {
            setConfigDraft(def.defaultConfig ?? {});
            setSizeDraft({
              span: def.defaultSpan,
              rows: def.defaultRows,
            });
            setError(null);
          }}
          accessibilityLabel="Restaurar padrões"
          style={({ pressed }) => ({
            minHeight: 44,
            width: 44,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: pressed ? colors.muted : "transparent",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <IconRestore size={18} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 44,
            paddingVertical: 12,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: pressed ? colors.muted : "transparent",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            Cancelar
          </Text>
        </Pressable>
        <Pressable
          onPress={handleApply}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 44,
            paddingVertical: 12,
            borderRadius: 6,
            backgroundColor: colors.primary,
            opacity: pressed ? 0.85 : 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          })}
        >
          <IconCheck size={16} color={colors.primaryForeground} />
          <Text
            style={{ fontSize: 14, fontWeight: "700", color: colors.primaryForeground }}
          >
            Aplicar
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// ConfigCard — non-collapsible sibling of `<Section>` (from `widgets/_shared`).
// Kept here rather than imported because only this modal needs the
// non-collapsible variant. Visual contract intentionally MATCHES Section so
// both card systems read as a single form: same borderRadius, same border
// tone, same title typography (no uppercase, no muted bg). The previous
// uppercase + muted-background header made ConfigCards look like a
// different control family from the inner Sections.
// ---------------------------------------------------------------------------

function ConfigCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        backgroundColor: colors.card,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: colors.foreground,
          }}
        >
          {title}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: 12,
          paddingBottom: 12,
          paddingTop: 4,
          gap: 12,
        }}
      >
        {children}
      </View>
    </View>
  );
}
