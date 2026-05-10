// Quick-note widget — per-instance scratch pad backed by AsyncStorage.
// Multiple quick-note widgets on the same dashboard each persist their own
// content under `ankaa.dashboard.quick-note:${instanceId}`. Saves are
// debounced (350 ms) to avoid hitting AsyncStorage on every keystroke.

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { View, Text, TextInput, Pressable, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IconNotebook } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { Section, ToggleRow } from "./_shared";
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

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Anotações"),
  showHeader: z.boolean().default(true),
  /** Plain text mode shows monospace; rich text would mean a heavier
   *  TextInput, which we skip on mobile to keep the widget snappy. */
  monospace: z.boolean().default(false),
  accent: makeAccentSchema({ color: "amber", icon: "FileText", borderColor: "none" }),
});
type Config = z.infer<typeof configSchema>;

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

  // Debounced write.
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

function Render({ instanceId, config, size }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
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
  const span = size?.span ?? 3;
  const minHeight = span === 1 ? 64 : span === 2 ? 96 : 120;

  return (
    <WidgetCard
      title={config.title || "Anotações"}
      icon={<Icon size={16} color={accent.hex} />}
      showHeader={config.showHeader}
      bodyPadded={false}
      borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
    >
      <KeyboardAwareWidget>
        <View style={{ padding: 12 }}>
          <TextInput
            multiline
            placeholder="Escreva uma nota..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            // Cap to avoid unbounded growth — at 5000 chars the TextInput
            // can still get expensive on RN, and most quick notes are <500.
            maxLength={5000}
            style={{
              minHeight,
              color: colors.foreground,
              fontSize: 13,
              fontFamily: config.monospace
                ? Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })
                : undefined,
              textAlignVertical: "top",
            }}
          />
        </View>
      </KeyboardAwareWidget>
    </WidgetCard>
  );
}

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const { colors } = useTheme();
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>Título</Text>
        <Input
          value={config.title}
          onChangeText={(v: string) => set("title", v)}
          placeholder="Anotações"
        />
      </View>
      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "amber") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "FileText") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
        <ToggleRow
          label="Texto monoespaçado"
          hint="Útil para código, listas alinhadas e snippets."
          checked={config.monospace}
          onCheckedChange={(v) => set("monospace", v)}
        />
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.showHeader}
          onCheckedChange={(v) => set("showHeader", v)}
        />
      </Section>
    </View>
  );
}

export const quickNoteWidget: WidgetDefinition<Config> = {
  id: "home.quick-note",
  name: "Anotações",
  description:
    "Bloco de anotações pessoal. O conteúdo é salvo automaticamente no aparelho — adicione vários para separar contextos.",
  icon: IconNotebook,
  category: "other",
  // Personal scratchpad — same content visibility as web's quick-note.
  allowedSectors: "*",
  // Quick scratchpad — works at any width. Mobile preset starts at 2/3.
  allowedSpans: [1, 2, 3],
  defaultSpan: 2,
  allowedHeights: [1, 2, 3],
  defaultRows: 2,
  configSchema,
  defaultConfig: {
    title: "Anotações",
    showHeader: true,
    monospace: false,
    accent: { color: "amber", icon: "FileText", borderColor: "none" },
  },
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
