// Mobile widget configuration modal — opens from a tile's gear button or
// body-tap in edit mode. Mirrors web's
// `web/src/dashboard/components/configure-widget-modal.tsx` flow (sticky
// header → scrollable body of cards → sticky footer) but rendered as a
// bottom Sheet to fit phone ergonomics.
//
// Layout (top → bottom) — see spec §4 for the canonical contract:
//   1. Sticky header   — 20×20 accent-tinted icon square, stacked title
//                        ("Configurar: <name>", 18/600, letterSpacing -0.2)
//                        + description (13/400, lineHeight 18). Close (X)
//                        right-aligned (36×36, IconX 20px). Spec §4.2.
//   2. Scrollable body — three `ConfigCard`s in this order (spec §4.3):
//                          • Tamanho                    — SizeSelector
//                          • Configurações do widget    — ConfigComponent
//                                                          or DynamicFormField
//                          • Ações (always present)     — destructive
//                                                          "Remover widget"
//                                                          opens AlertDialog
//                        Inline error block sits between body and footer
//                        (spec §4.5 — fixed #ef4444 hex, intentional).
//   3. Sticky footer   — Restaurar (44×44 outlined IconButton, IconRestore
//                        18px) / Cancelar (flex:1 outlined) / Aplicar
//                        (flex:1 filled primary, IconCheck 16px). Spec §4.4.
//
// State management:
//   The inner ModalBody is keyed by instanceId so opening the modal for a
//   different widget remounts it with fresh draft state. This avoids a
//   setState-in-effect cascade that the React Compiler flags, and matches
//   how web's modal handles a different widget via component remount.
//   THIS PATTERN MUST NOT BE REFACTORED OUT — see spec §4.1.
//
// Notes:
//   - The Sheet primitive renders the drag-indicator pill above this body
//     (default `dragIndicator={true}`), so we MUST NOT add a second one
//     here — that would produce two visible grab handles.
//   - The Sheet expects integer percentages, NOT decimals — so
//     `snapPoints={[90]}` (not [0.9]).
//   - Destructive confirm uses the shared AlertDialog primitive
//     (`@/components/ui/alert-dialog`) — its native Content path renders
//     via `react-native`'s Modal so it layers above the Sheet correctly.

import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  IconX,
  IconRestore,
  IconSparkles,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { Sheet } from "@/components/ui/sheet";
import { borderRadius, spacing } from "@/constants/design-system";
import { lightImpactHaptic } from "@/utils/haptics";
import { widgetRegistry } from "../registry";
import { DynamicFormField } from "./dynamic-form-field";
import { SectionGroup } from "../widgets/_shared";
import {
  resolveAccent,
  withAlpha,
  type WidgetAccentColor,
  type WidgetAccentIcon,
} from "./widget-accent";
import {
  type WidgetInstance,
  type WidgetSize,
} from "../types";

interface ConfigureWidgetModalProps {
  /** When non-null, the modal opens for this instance. Pass null to close. */
  instance: WidgetInstance | null;
  onClose: () => void;
  onApplyConfig: (instanceId: string, config: unknown) => void;
  onApplySize: (instanceId: string, size: WidgetSize) => void;
  /** Called from the in-modal "Remover widget" action after the user
   *  confirms the AlertDialog. Spec §4.3 mandates this section is always
   *  present; if removal is wired (it normally is), the button is enabled. */
  onRemove?: (instanceId: string) => void;
}

export function ConfigureWidgetModal({
  instance,
  onClose,
  onApplyConfig,
  onApplySize,
  onRemove,
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
          onRemove={onRemove}
        />
      )}
    </Sheet>
  );
}

interface ModalBodyProps {
  instance: WidgetInstance;
  def: NonNullable<ReturnType<typeof widgetRegistry.get>>;
  onClose: () => void;
  onApplyConfig: (instanceId: string, config: unknown) => void;
  onApplySize: (instanceId: string, size: WidgetSize) => void;
  onRemove?: (instanceId: string) => void;
}

function ModalBody({
  instance,
  def,
  onClose,
  onApplyConfig,
  onApplySize,
  onRemove,
}: ModalBodyProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Drafts initialized once from props because the parent re-mounts via
  // the `key` whenever the instance changes — so this state always belongs
  // to the currently-active widget without needing an effect to sync.
  const [configDraft, setConfigDraft] = useState<unknown>(
    instance.config ?? def.defaultConfig ?? {},
  );
  const [sizeDraft, setSizeDraft] = useState<WidgetSize>(instance.size);
  const [error, setError] = useState<string | null>(null);
  // Transient banner shown for ~2.2s after the user presses Restaurar so the
  // reset is acknowledged visually (no toast primitive is available on
  // mobile yet — this inline banner is the canonical replacement).
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const restoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
    },
    [],
  );

  const Custom = def.ConfigComponent;

  // Resolve the per-widget accent for the header icon block. We try the
  // user-edited draft first (so changing color in the picker reflects in
  // the header live), then fall back to def.defaultConfig.accent.
  const draftAccent =
    (configDraft as { accent?: { color?: WidgetAccentColor; icon?: WidgetAccentIcon } } | null)
      ?.accent;
  const defaultAccent =
    (def.defaultConfig as { accent?: { color?: WidgetAccentColor; icon?: WidgetAccentIcon } } | null)
      ?.accent;
  const accent = resolveAccent({
    color: draftAccent?.color ?? defaultAccent?.color,
    icon: draftAccent?.icon ?? defaultAccent?.icon,
  });
  const hasAccent = !!(draftAccent || defaultAccent);
  // Fallback to def.icon (the registry-supplied component) when the widget
  // has no accent in its default config. Renders with foreground color so
  // it stays readable.
  const HeaderIconFallback = def.icon;

  // Apply-button press scale animation — gives the primary action a tactile
  // pulse instead of a flat opacity dip. 0.97 is just enough to register a
  // press without making the button feel mushy.
  const applyScale = useSharedValue(1);
  const applyAnim = useAnimatedStyle(() => ({
    transform: [{ scale: applyScale.value }],
  }));

  const handleApply = () => {
    const parsed = def.configSchema.safeParse(configDraft);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Configuração inválida.");
      return;
    }
    void lightImpactHaptic();
    onApplyConfig(instance.instanceId, parsed.data);
    onApplySize(instance.instanceId, sizeDraft);
    onClose();
  };

  const handleRestore = () => {
    void lightImpactHaptic();
    setConfigDraft(def.defaultConfig ?? {});
    setSizeDraft({
      span: def.defaultSpan,
      rows: def.defaultRows,
    });
    setError(null);
    setShowRestoreBanner(true);
    if (restoreTimer.current) clearTimeout(restoreTimer.current);
    restoreTimer.current = setTimeout(() => setShowRestoreBanner(false), 2200);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      {/* Sticky header — spec §4.2:
          paddingH 16, paddingTop 8, paddingBottom 14, border-bottom 1.
          Left: 20×20 accent-tinted square prepended to the title block.
          Title 18/600 letterSpacing -0.2, description 13/400 lineHeight 18.
          Right: 36×36 round close X. */}
      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingTop: 8,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* 20×20 accent-tinted icon square. Bg is the accent hex at
                low alpha; icon renders at full accent color. When the widget
                has no accent, falls back to def.icon over a neutral muted bg.
                Per spec §4.2 NEW REQUIRED: this prefix establishes the
                widget's identity in the header. */}
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                backgroundColor: hasAccent
                  ? withAlpha(accent.hex, isDark ? 0.18 : 0.14)
                  : colors.muted,
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {hasAccent ? (
                <accent.Icon size={14} color={accent.hex} />
              ) : (
                <HeaderIconFallback size={14} color={colors.foreground} />
              )}
            </View>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 18,
                fontWeight: "600",
                color: colors.foreground,
                letterSpacing: -0.2,
              }}
            >
              Configurar: {def.name}
            </Text>
          </View>
          {def.description && (
            <Text
              numberOfLines={2}
              style={{
                fontSize: 13,
                fontWeight: "400",
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
          hitSlop={12}
          accessibilityLabel="Fechar"
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? colors.muted : "transparent",
            flexShrink: 0,
          })}
        >
          <IconX size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Scrollable body — flat content (no card wrappers). Matches web's
          configure modal layout: header, body content direct under a Title
          input, then the widget's own Tabs (rendered by Custom or
          DynamicFormField), then a thin error band, then the footer.
          The Tamanho / Configurações / Ações wrapper cards were removed
          per user request — they added visual noise without clarifying
          the form. The destructive "Remover widget" action lives on the
          per-tile overflow sheet now, not inside this modal. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingTop: 14,
          paddingBottom: spacing.lg,
          gap: 14,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showRestoreBanner && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: withAlpha(colors.primary, 0.4),
              backgroundColor: withAlpha(colors.primary, isDark ? 0.16 : 0.1),
            }}
          >
            <IconSparkles size={16} color={colors.primary} />
            <Text
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: "600",
                color: colors.primary,
              }}
            >
              Configurações padrão restauradas. Toque em Aplicar para salvar.
            </Text>
          </View>
        )}

        {/* Widget-specific config — custom component (which renders its
            own Tabs) or the auto-generator from the configSchema. No
            outer card wrapper. The SizeSelector used to live above this
            but the user accesses size via the per-tile overflow menu
            (3-dots → Tamanho) — having it ALSO here was duplicative.
            Wrapped in `SectionGroup` so accordion sections inside the
            ConfigComp open one at a time (matches web). */}
        <SectionGroup>
          {Custom ? (
            <Custom config={configDraft} onChange={setConfigDraft} />
          ) : (
            <DynamicFormField
              schema={def.configSchema}
              value={configDraft}
              onChange={setConfigDraft}
            />
          )}
        </SectionGroup>

        {/* Validation error — fixed red-500 hex (do not swap to
            colors.destructive which reads as muted brown in dark mode). */}
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

      {/* Sticky footer — right-aligned compact buttons mirroring web's
          DialogFooter (Cancelar ghost + Aplicar primary). The previous
          flex:1 stretched layout made the buttons look like generic OK/
          Cancel rather than a polished form action row. Restaurar moved
          to the left so the destructive/utility action sits opposite the
          primary action — a classic dialog footer pattern. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingTop: 10,
          // Respect the home-indicator inset on iOS — without this the
          // Cancelar / Aplicar buttons touch the bottom of the sheet
          // (and on phones with a home indicator they sit awkwardly on top
          // of it). Adds the OS-reported bottom inset plus 12px breathing
          // room above it.
          paddingBottom: Math.max(spacing.md, insets.bottom + 12),
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <Pressable
          onPress={handleRestore}
          accessibilityLabel="Restaurar padrões"
          accessibilityRole="button"
          hitSlop={6}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: borderRadius.md,
            backgroundColor: pressed ? colors.muted : "transparent",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <IconRestore size={18} color={colors.mutedForeground} />
        </Pressable>
        {/* Right-aligned action group — Cancelar ghost + Aplicar primary. */}
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={onClose}
          accessibilityLabel="Cancelar"
          accessibilityRole="button"
          hitSlop={6}
          style={({ pressed }) => ({
            height: 40,
            paddingHorizontal: 16,
            borderRadius: borderRadius.md,
            backgroundColor: pressed ? colors.muted : "transparent",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.foreground,
            }}
          >
            Cancelar
          </Text>
        </Pressable>
        <Pressable
          onPress={handleApply}
          onPressIn={() => {
            applyScale.value = withTiming(0.97, { duration: 90 });
          }}
          onPressOut={() => {
            applyScale.value = withTiming(1, { duration: 140 });
          }}
          accessibilityLabel="Aplicar"
          accessibilityRole="button"
        >
          <Animated.View
            style={[
              {
                height: 40,
                paddingHorizontal: 20,
                borderRadius: borderRadius.md,
                backgroundColor: colors.primary,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 2,
              },
              applyAnim,
            ]}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.primaryForeground,
              }}
            >
              Aplicar
            </Text>
          </Animated.View>
        </Pressable>
      </View>

    </KeyboardAvoidingView>
  );
}

