// Mobile widget configuration modal — opens from a tile's gear button or
// body-tap in edit mode. Mirrors web's
// `web/src/dashboard/components/configure-widget-modal.tsx` flow (header →
// scrollable body → sticky footer), now hosted by the canonical
// StandardModal (native pageSheet) instead of a hand-rolled bottom Sheet.
//
// Layout (top → bottom) — see spec §4 for the canonical contract:
//   1. Header          — StandardModal's standardized header: the leading
//                        icon reflects the live draft accent (folding the old
//                        20×20 accent tile into the canonical bare icon),
//                        title ("Configurar: <name>") + description as the
//                        subtitle, rounded close button. Spec §4.2.
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
//   - StandardModal renders the drag-indicator pill + header + footer + the
//     KeyboardAvoidingView, so this body MUST NOT add its own. The footer is
//     handed to StandardModal via its `footer` slot.
//   - StandardModal is hosted INSIDE ModalBody (not the outer component) so
//     its header icon/iconColor can track the live draft accent, which lives
//     in ModalBody state.

import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  IconRestore,
  IconSparkles,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { StandardModal } from "@/components/ui/standard-modal";
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

  // ModalBody hosts the StandardModal itself so the header icon can reflect
  // the *live* draft accent (which lives in ModalBody's state). To let the
  // native sheet play its slide-OUT animation on close, ModalBody must stay
  // mounted while `instance` clears to null — so we latch the last open
  // instance/def and drive visibility with `open` (StandardModal visible={open}).
  // A mount `generation`, bumped on each open, preserves the spec §4.1 fresh-
  // draft remount semantics (reopening a widget shows its saved config, not a
  // stale draft) without a setState-in-effect the React Compiler would flag.
  const latched = useRef<{
    instance: WidgetInstance;
    def: NonNullable<ReturnType<typeof widgetRegistry.get>>;
  } | null>(null);
  const generation = useRef(0);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current) generation.current += 1;
  wasOpen.current = open;
  if (open && instance && def) latched.current = { instance, def };

  const active = latched.current;
  if (!active) return null;

  return (
    <ModalBody
      key={`${active.instance.instanceId}:${generation.current}`}
      open={open}
      instance={active.instance}
      def={active.def}
      onClose={onClose}
      onApplyConfig={onApplyConfig}
      onApplySize={onApplySize}
      onRemove={onRemove}
    />
  );
}

interface ModalBodyProps {
  /** Drives StandardModal visibility so it can animate out before unmounting. */
  open: boolean;
  instance: WidgetInstance;
  def: NonNullable<ReturnType<typeof widgetRegistry.get>>;
  onClose: () => void;
  onApplyConfig: (instanceId: string, config: unknown) => void;
  onApplySize: (instanceId: string, size: WidgetSize) => void;
  onRemove?: (instanceId: string) => void;
}

function ModalBody({
  open,
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

  // Sticky footer — right-aligned compact buttons mirroring web's
  // DialogFooter (Cancelar ghost + Aplicar primary). Restaurar sits on the
  // left so the utility action is opposite the primary action — a classic
  // dialog footer pattern. Passed to StandardModal via its `footer` slot.
  const footer = (
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
  );

  return (
    <StandardModal
      visible={open}
      onClose={onClose}
      title={`Configurar: ${def.name}`}
      subtitle={def.description}
      // Header icon reflects the *live* draft accent (full accent color),
      // falling back to the registry icon over the foreground color when the
      // widget has no accent. The old 20×20 accent tile is folded into the
      // canonical bare-icon header.
      icon={hasAccent ? accent.Icon : HeaderIconFallback}
      iconColor={hasAccent ? accent.hex : colors.foreground}
      padded={false}
      bodyStyle={{
        paddingHorizontal: spacing.md,
        paddingTop: 14,
        paddingBottom: spacing.lg,
        gap: 14,
      }}
      footer={footer}
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
    </StandardModal>
  );
}

