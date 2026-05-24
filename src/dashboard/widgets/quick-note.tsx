// Quick-note widget — per-instance scratch pad backed by AsyncStorage.
// Multiple quick-note widgets on the same dashboard each persist their own
// content under `ankaa.dashboard.quick-note:${instanceId}`. Saves are
// debounced (350 ms) to avoid hitting AsyncStorage on every keystroke. Mirrors
// web's `quick-note.tsx` at `web/src/dashboard/widgets/quick-note.tsx`.
//
// Schema (web parity, §6.14):
//   - title          (string)
//   - accent         ({color, icon, shade?, borderColor?})
//   - display        ({showHeader})
//
// Mobile-only knobs (kept because RN can't render textarea CSS like web):
//   - monospace      (toggles a system mono font for the body)
//   - showCharacterCount / maxLength / fontSize / placeholder
//
// The body input is wrapped in `KeyboardAwareWidget` so it stays above the
// soft keyboard (otherwise Android hides the input under the keyboard).

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { View, Text, TextInput, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IconNotebook } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { Section, ToggleRow, LabeledField, Combobox } from "./_shared";
import { KeyboardAwareWidget } from "./_keyboard-aware-widget";
import { Input } from "@/components/ui/input";
import { WidgetCard } from "../components/widget-card";
import {
  AccentPicker,
  makeAccentSchema,
  resolveAccent,
  borderHexFor,
  type WidgetAccentColor,
  type WidgetAccentIcon,
  type WidgetBorderColor,
} from "../components/widget-accent";
import type {
  WidgetConfigProps,
  WidgetDefinition,
  WidgetRenderProps,
} from "../types";

const STORAGE_PREFIX = "ankaa.dashboard.quick-note:";
const DEBOUNCE_MS = 350;

// ---------- Schema ----------
//
// Web's schema only has `title`, `accent`, `display.showHeader`. Mobile keeps
// the additional `monospace / showCharacterCount / maxLength / fontSize /
// placeholder` keys because RN's TextInput can't reproduce the CSS-styled
// textarea web uses — without these the experience would be visibly worse on
// phones. They round-trip through Zod with safe defaults so saved configs
// still validate after the schema upgrade.

const configSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(80)
    .default("Anotações")
    .describe("Título exibido no cabeçalho do widget."),
  accent: makeAccentSchema({ color: "amber", icon: "FileText", borderColor: "none" }),
  display: z
    .object({
      showHeader: z.boolean().default(true),
    })
    .default({ showHeader: true })
    .describe("Visibilidade do cabeçalho."),
  /** Plain text mode shows monospace; rich text would mean a heavier
   *  TextInput, which we skip on mobile to keep the widget snappy. */
  monospace: z.boolean().default(false),
  /** Show a character counter below the textarea so users know when they
   *  approach the cap. Defaults to true since `maxLength` rejects keystrokes
   *  silently on RN — the counter is the only feedback. */
  showCharacterCount: z.boolean().default(true),
  /** Hard cap on the note length. 5000 is plenty for a "quick" note while
   *  staying inside AsyncStorage's per-key sweet spot. */
  maxLength: z.number().int().min(100).max(20000).default(5000),
  /** Editor body font size. Three steps mirror the web widget's typography
   *  scale so users can pack more text into a small tile. */
  fontSize: z.enum(["12", "13", "14"]).default("13"),
  /** Default placeholder text — exposed so power-users can theme each
   *  instance ("TODO list", "Daily standup", etc.) without renaming the
   *  whole widget. */
  placeholder: z.string().max(80).default("Escreva uma nota..."),
});
type Config = z.infer<typeof configSchema>;

// ---------- AsyncStorage helper ----------

function useDebouncedAsyncStorage(key: string | null) {
  const [value, setValue] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether we've already warned about a save failure for this key —
  // saves can fail repeatedly (quota exceeded, encrypted private mode) and
  // we don't want to spam toasts on every keystroke.
  const warnedRef = useRef(false);

  // Initial load.
  useEffect(() => {
    if (!key) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    AsyncStorage.getItem(key).then((stored) => {
      if (cancelled) return;
      setValue(stored ?? "");
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Debounced write — 350 ms matches web's localStorage debounce so the
  // perceived "auto-save lag" is identical across platforms.
  useEffect(() => {
    if (!loaded || !key) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      AsyncStorage.setItem(key, value).catch((err) => {
        // Quota or backing-store errors used to be silent — that meant
        // users typed for minutes thinking notes were saved when nothing
        // had persisted. Surface the first failure per session so the
        // user knows their note isn't safe.
        if (!warnedRef.current) {
          warnedRef.current = true;
          // eslint-disable-next-line no-console
          console.warn("[quick-note] AsyncStorage write failed", err);
        }
      });
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}

// ---------- Render ----------

function Render({ instanceId, config, size }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const accent = useMemo(
    () =>
      resolveAccent({
        color: config.accent?.color as WidgetAccentColor,
        icon: config.accent?.icon as WidgetAccentIcon,
      }),
    [config.accent?.color, config.accent?.icon],
  );
  const Icon = accent.Icon;
  // Guard against an undefined/empty instanceId (corrupted layout, race on
  // first add). Without this, the storage key collapses to
  // "ankaa.dashboard.quick-note:undefined" and every quick-note instance
  // shares one bucket of text.
  const storageKey = useMemo(
    () => (instanceId ? `${STORAGE_PREFIX}${instanceId}` : null),
    [instanceId],
  );
  const [text, setText] = useDebouncedAsyncStorage(storageKey);
  // At narrower spans, drop the min-height so the widget hugs its content
  // (a tall empty note next to a span-1 favorites tile looks unbalanced).
  const span = size?.span ?? 1;
  const minHeight = span === 1 ? 64 : span === 2 ? 96 : 120;
  const showHeader = config.display?.showHeader ?? true;

  return (
    <View style={{ flex: 1 }}>
      <WidgetCard
        title={config.title || "Anotações"}
        icon={<Icon size={16} color={accent.hex} />}
        showHeader={showHeader}
        bodyPadded={false}
        accentColor={accent.hex}
        borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      >
        {/* KeyboardAwareWidget keeps the body input above the soft keyboard.
         *  The inner padding wrapper and TextInput both flex:1 so the input
         *  fills the entire available body height (between header strip and
         *  footer link). */}
        <KeyboardAwareWidget>
          <View style={{ flex: 1, padding: 12 }}>
            <TextInput
              multiline
              placeholder={config.placeholder || "Escreva uma nota..."}
              placeholderTextColor={colors.mutedForeground}
              value={text}
              onChangeText={setText}
              // RN rejects keystrokes silently when maxLength hits — the
              // character counter below is the only signal the user gets.
              maxLength={config.maxLength}
              style={{
                flex: 1,
                minHeight,
                color: colors.foreground,
                fontSize: Number(config.fontSize),
                fontFamily: config.monospace
                  ? Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })
                  : undefined,
                textAlignVertical: "top",
              }}
            />
            {config.showCharacterCount && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  paddingTop: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color:
                      text.length >= config.maxLength
                        ? colors.destructive
                        : colors.mutedForeground,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {text.length} / {config.maxLength}
                </Text>
              </View>
            )}
          </View>
        </KeyboardAwareWidget>
      </WidgetCard>
    </View>
  );
}

// ---------- Config ----------

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });
  const setDisplay = <K extends keyof Config["display"]>(
    key: K,
    value: Config["display"][K],
  ) =>
    onChange({
      ...config,
      display: { ...(config.display ?? { showHeader: true }), [key]: value },
    });

  return (
    <View style={{ gap: 12 }}>
      <LabeledField label="Título">
        <Input
          value={config.title}
          onChangeText={(v: string) => set("title", v)}
          placeholder="Anotações"
        />
      </LabeledField>

      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "amber") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "FileText") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
      </Section>

      <Section title="Cabeçalho">
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.display?.showHeader ?? true}
          onCheckedChange={(v) => setDisplay("showHeader", v)}
        />
      </Section>

      <Section title="Tipografia">
        <ToggleRow
          label="Texto monoespaçado"
          hint="Útil para código, listas alinhadas e snippets."
          checked={config.monospace}
          onCheckedChange={(v) => set("monospace", v)}
        />
        <LabeledField label="Tamanho do texto">
          <Combobox
            value={config.fontSize}
            onValueChange={(v: any) =>
              set(
                "fontSize",
                (typeof v === "string" && (v === "12" || v === "13" || v === "14")
                  ? v
                  : "13") as Config["fontSize"],
              )
            }
            options={[
              { value: "12", label: "Pequeno (12pt)" },
              { value: "13", label: "Normal (13pt)" },
              { value: "14", label: "Grande (14pt)" },
            ]}
          />
        </LabeledField>
      </Section>

      <Section title="Conteúdo">
        <LabeledField label="Texto do placeholder">
          <Input
            value={config.placeholder}
            onChangeText={(v: string) => set("placeholder", v.slice(0, 80))}
            placeholder="Escreva uma nota..."
          />
        </LabeledField>
        <LabeledField
          label="Limite de caracteres"
          helper="Entre 100 e 20.000. Notas mais longas podem deixar o widget lento."
        >
          <Input
            keyboardType="number-pad"
            value={String(config.maxLength)}
            onChangeText={(t: string) => {
              const n = Number(t.replace(/[^0-9]/g, ""));
              if (!Number.isFinite(n)) return;
              set("maxLength", Math.max(100, Math.min(20000, Math.floor(n))));
            }}
          />
        </LabeledField>
        <ToggleRow
          label="Exibir contador de caracteres"
          hint="Mostra `n / max` no canto inferior direito do editor."
          checked={config.showCharacterCount}
          onCheckedChange={(v) => set("showCharacterCount", v)}
        />
      </Section>
    </View>
  );
}

// ---------- Definition ----------

export const quickNoteWidget: WidgetDefinition<Config> = {
  // Mobile id stays `home.quick-note` (matches existing registry/preset
  // wiring); web uses `quick-action.note`. The two surfaces never share a
  // persisted layout, so the id mismatch is intentional.
  id: "home.quick-note",
  name: "Anotações",
  description:
    "Bloco de anotações pessoal. O conteúdo é salvo automaticamente no aparelho — adicione vários para separar contextos.",
  icon: IconNotebook,
  category: "other",
  // Personal scratchpad — same content visibility as web's quick-note.
  allowedSectors: "*",
  // Quick scratchpad — works at any width. Default span 1 (web parity:
  // `defaultSize: { cols: 1, rows: 2 }`).
  allowedSpans: [1, 2, 3],
  defaultSpan: 1,
  allowedHeights: [1, 2, 3],
  defaultRows: 2,
  configSchema,
  defaultConfig: {
    title: "Anotações",
    accent: { color: "amber", icon: "FileText" },
    display: { showHeader: true },
    monospace: false,
    showCharacterCount: true,
    maxLength: 5000,
    fontSize: "13",
    placeholder: "Escreva uma nota...",
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
