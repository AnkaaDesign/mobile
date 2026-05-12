// Auto-generates a mobile config form from a Zod object schema. Spec §5 of
// MOBILE_WIDGETS_SPEC.md is the canonical contract — this file implements that
// type → primitive map. When a widget supplies a custom ConfigComponent, the
// modal uses that instead. This renderer is the fallback so widget authors
// can ship a config schema without writing UI for it.
//
// Supported shapes (spec §5):
//   - z.string()                          → Input (text)
//   - z.string().email()                  → Input keyboardType="email-address"
//   - z.string().url()                    → Input keyboardType="url"
//   - z.string() with .describe("multi"…) or large .max → TextArea
//   - z.string().regex(/^\d+$/)           → Input keyboardType="number-pad"
//   - z.number() / z.number().int()       → NumberInput (or Slider when range
//                                            ≤ 24 with min+max present)
//   - z.boolean()                         → Switch via ToggleRow
//   - z.enum([…]) length ≤ 4              → RadioGroup
//   - z.enum([…]) length > 4              → Combobox single
//   - z.nativeEnum(…)                     → Combobox single
//   - z.array(z.enum([…]))                → Combobox multiple
//   - z.array(z.nativeEnum(…))            → Combobox multiple
//   - z.array(z.string()) with column meta (.describe("__columns__:k1,k2,…"))
//                                          → ColumnPicker
//   - z.date() / z.string().datetime()    → DatePicker
//   - z.object({from,to}) when key has Range → DateRangePicker
//   - z.object({...})                     → recurse inside a Section
//   - z.union (discriminator)             → Tabs to switch shape
//   - z.optional / z.nullable / z.default → unwrapped recursively
//   - anything else                       → read-only "configuração customizada
//                                            necessária" notice (loud failure
//                                            so the widget author adds a
//                                            ConfigComponent — JSON textarea
//                                            on a phone is hostile)
//
// Labels: prefer `.describe()`, fall back to humanized key. A two-line
// describe convention `"Label\nHelper text"` splits into label + helper.
// A separate `${key}_help` sibling key is also honoured.

import { useMemo } from "react";
import { z } from "zod";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/lib/theme";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/text-area";
import { Combobox } from "@/components/ui/combobox";
import { NumberInput } from "@/components/ui/number-input";
import { Slider } from "@/components/ui/slider";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Section, ToggleRow, LabeledField } from "@/dashboard/widgets/_shared";
import { ColumnPicker, type ColumnDescriptor } from "./column-picker";

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface DynamicFormFieldProps {
  schema: z.ZodType<unknown>;
  value: unknown;
  onChange: (next: unknown) => void;
  /**
   * When recursing into a nested object schema, the parent owns the section
   * chrome. Keep the inner render flat so we don't double-wrap.
   */
  inline?: boolean;
}

export function DynamicFormField({
  schema,
  value,
  onChange,
  inline = false,
}: DynamicFormFieldProps) {
  const { colors } = useTheme();
  const fields = useMemo(() => extractFields(schema), [schema]);

  if (fields.length === 0) {
    return (
      <Text
        style={{
          fontSize: 13,
          fontStyle: "italic",
          color: colors.mutedForeground,
        }}
      >
        Este widget não possui configurações.
      </Text>
    );
  }

  const obj =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const setField = (name: string, v: unknown) =>
    onChange({ ...obj, [name]: v });

  // Hide `${key}_help` siblings — those are paired-helper-text fields, not
  // independently rendered.
  const helpKeys = new Set(
    fields.filter((f) => f.name.endsWith("_help")).map((f) => f.name),
  );
  const visibleFields = fields.filter((f) => !helpKeys.has(f.name));

  return (
    <View style={{ gap: inline ? 10 : 12 }}>
      {visibleFields.map((field) => {
        const helpFromSibling = obj[`${field.name}_help`];
        const helper =
          field.helper ??
          (typeof helpFromSibling === "string" ? helpFromSibling : undefined);
        return (
          <FieldRow
            key={field.name}
            field={{ ...field, helper }}
            value={obj[field.name]}
            onChange={(v) => setField(field.name, v)}
          />
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Field extraction
// ---------------------------------------------------------------------------

type FieldKind =
  | "string"
  | "string-email"
  | "string-url"
  | "string-multiline"
  | "string-numeric"
  | "string-date"
  | "number"
  | "number-slider"
  | "boolean"
  | "enum-radio"
  | "enum-combobox"
  | "multi-enum"
  | "column-picker"
  | "date"
  | "date-range"
  | "object"
  | "union-tabs"
  | "unknown";

interface FieldDescriptor {
  name: string;
  label: string;
  helper?: string;
  kind: FieldKind;
  options?: Array<{ value: string; label: string }>;
  optional?: boolean;
  // numbers
  min?: number;
  max?: number;
  step?: number;
  // string max length (for textarea heuristic)
  maxLen?: number;
  // ColumnPicker catalog (parsed from .describe("__columns__:..."))
  columns?: ColumnDescriptor<string>[];
  // nested object schema (for recursion)
  innerSchema?: z.ZodTypeAny;
  // discriminated union
  discriminator?: string;
  variants?: Array<{ value: string; label: string; schema: z.ZodTypeAny }>;
}

function extractFields(schema: z.ZodType<unknown>): FieldDescriptor[] {
  const obj = unwrap(schema);
  const def = (obj as {
    _def?: { typeName?: string; shape?: () => Record<string, z.ZodTypeAny> };
  })._def;
  if (def?.typeName !== "ZodObject" || !def.shape) return [];
  const shape = def.shape();
  return Object.entries(shape).map(([name, raw]) => describeField(name, raw));
}

function describeField(name: string, schema: z.ZodTypeAny): FieldDescriptor {
  const optional = isOptional(schema);
  const inner = unwrap(schema);
  const innerDef = (inner as {
    _def?: {
      typeName?: string;
      checks?: Array<{ kind: string; value?: number; regex?: RegExp }>;
      values?: unknown[];
      type?: z.ZodTypeAny;
      shape?: () => Record<string, z.ZodTypeAny>;
      options?: z.ZodTypeAny[];
      discriminator?: string;
    };
  })._def;

  const rawDescribe = (schema._def as { description?: string }).description;
  const { label, helper } = splitDescribe(rawDescribe, humanize(name));
  const typeName = innerDef?.typeName;

  // ----- z.boolean -----
  if (typeName === "ZodBoolean") {
    return { name, label, helper, kind: "boolean", optional };
  }

  // ----- z.string (with refinement variants) -----
  if (typeName === "ZodString") {
    const checks = innerDef?.checks ?? [];
    const isEmail = checks.some((c) => c.kind === "email");
    if (isEmail) return { name, label, helper, kind: "string-email", optional };
    const isUrl = checks.some((c) => c.kind === "url");
    if (isUrl) return { name, label, helper, kind: "string-url", optional };
    const isDateTime = checks.some((c) => c.kind === "datetime");
    if (isDateTime || /Date$|At$|date$/.test(name)) {
      return { name, label, helper, kind: "string-date", optional };
    }
    const numericRegex = checks.find(
      (c) => c.kind === "regex" && c.regex && /^\^\\d\+\$$/.test(c.regex.source),
    );
    if (numericRegex) {
      return { name, label, helper, kind: "string-numeric", optional };
    }
    const maxCheck = checks.find((c) => c.kind === "max");
    const maxLen = typeof maxCheck?.value === "number" ? maxCheck.value : undefined;
    const multilineHint =
      (rawDescribe ?? "").toLowerCase().includes("multi") ||
      (rawDescribe ?? "").toLowerCase().includes("multiline") ||
      /(notes?|description|details?|content|body|observ)/i.test(name);
    if (multilineHint || (typeof maxLen === "number" && maxLen > 120)) {
      return {
        name,
        label,
        helper,
        kind: "string-multiline",
        optional,
        maxLen,
      };
    }
    return { name, label, helper, kind: "string", optional, maxLen };
  }

  // ----- z.number -----
  if (typeName === "ZodNumber") {
    const checks = innerDef?.checks ?? [];
    const minCheck = checks.find((c) => c.kind === "min");
    const maxCheck = checks.find((c) => c.kind === "max");
    const min = typeof minCheck?.value === "number" ? minCheck.value : undefined;
    const max = typeof maxCheck?.value === "number" ? maxCheck.value : undefined;
    const range =
      typeof min === "number" && typeof max === "number"
        ? max - min
        : undefined;
    const isInt = checks.some((c) => c.kind === "int");
    if (typeof range === "number" && range > 0 && range <= 24 && isInt) {
      return {
        name,
        label,
        helper,
        kind: "number-slider",
        optional,
        min,
        max,
        step: 1,
      };
    }
    return { name, label, helper, kind: "number", optional, min, max };
  }

  // ----- z.enum -----
  if (typeName === "ZodEnum") {
    const values = (innerDef?.values as string[]) ?? [];
    const options = values.map((v) => ({
      value: String(v),
      label: humanizeEnumValue(String(v)),
    }));
    return {
      name,
      label,
      helper,
      kind: options.length <= 4 ? "enum-radio" : "enum-combobox",
      options,
      optional,
    };
  }

  // ----- z.nativeEnum — always combobox -----
  if (typeName === "ZodNativeEnum") {
    const valuesObj = (innerDef as unknown as {
      values: Record<string, string | number>;
    }).values;
    const entries = Object.entries(valuesObj).filter(
      ([k, v]) => typeof v === "string" || typeof v === "number",
    );
    // Native enums emit reverse mappings for numeric enums; dedupe by value.
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string }> = [];
    for (const [k, v] of entries) {
      // Skip numeric reverse entries whose key is a digit string.
      if (/^\d+$/.test(k)) continue;
      const value = String(v);
      if (seen.has(value)) continue;
      seen.add(value);
      options.push({ value, label: humanizeEnumValue(k) });
    }
    return { name, label, helper, kind: "enum-combobox", options, optional };
  }

  // ----- z.array -----
  if (typeName === "ZodArray") {
    const elem = unwrap(innerDef?.type as z.ZodTypeAny);
    const elemDef = (elem as { _def?: { typeName?: string; values?: unknown[] } })._def;
    const elemType = elemDef?.typeName;

    // ColumnPicker — z.array(z.string()) (or z.enum) with .describe carrying
    // the column catalog as `__columns__:key:label,key2:label2,...`.
    const cat = parseColumnCatalog(rawDescribe);
    if (cat) {
      return {
        name,
        label: cat.label ?? label,
        helper,
        kind: "column-picker",
        columns: cat.columns,
        optional,
      };
    }

    if (elemType === "ZodEnum") {
      const values = (elemDef?.values as string[]) ?? [];
      return {
        name,
        label,
        helper,
        kind: "multi-enum",
        options: values.map((v) => ({
          value: String(v),
          label: humanizeEnumValue(String(v)),
        })),
        optional,
      };
    }
    if (elemType === "ZodNativeEnum") {
      const valuesObj = (elemDef as unknown as {
        values: Record<string, string | number>;
      }).values;
      const seen = new Set<string>();
      const options: Array<{ value: string; label: string }> = [];
      for (const [k, v] of Object.entries(valuesObj)) {
        if (/^\d+$/.test(k)) continue;
        const value = String(v);
        if (seen.has(value)) continue;
        seen.add(value);
        options.push({ value, label: humanizeEnumValue(k) });
      }
      return { name, label, helper, kind: "multi-enum", options, optional };
    }
    // Free-form arrays: spec §5 says "widget MUST supply ConfigComponent".
    return { name, label, helper, kind: "unknown", optional };
  }

  // ----- z.date -----
  if (typeName === "ZodDate") {
    return { name, label, helper, kind: "date", optional };
  }

  // ----- z.object -----
  if (typeName === "ZodObject") {
    // Date-range heuristic: { from: …, to: … } when the key suggests range.
    const shape = innerDef?.shape?.() ?? {};
    const keys = Object.keys(shape);
    const isFromTo =
      keys.length === 2 &&
      keys.includes("from") &&
      keys.includes("to") &&
      /Range|Period/.test(name);
    if (isFromTo) {
      return { name, label, helper, kind: "date-range", optional };
    }
    return {
      name,
      label,
      helper,
      kind: "object",
      innerSchema: inner,
      optional,
    };
  }

  // ----- z.discriminatedUnion / z.union with literal discriminator -----
  if (typeName === "ZodDiscriminatedUnion" || typeName === "ZodUnion") {
    const options = (innerDef?.options as z.ZodTypeAny[] | undefined) ?? [];
    const discriminator =
      (innerDef as { discriminator?: string } | undefined)?.discriminator ??
      detectDiscriminator(options);
    if (discriminator && options.length > 0) {
      const variants = options
        .map((opt) => {
          const optShape = (
            unwrap(opt) as {
              _def?: { shape?: () => Record<string, z.ZodTypeAny> };
            }
          )._def?.shape?.();
          const litVal = optShape?.[discriminator]
            ? extractLiteralValue(optShape[discriminator])
            : undefined;
          if (litVal == null) return null;
          return {
            value: String(litVal),
            label: humanizeEnumValue(String(litVal)),
            schema: opt,
          };
        })
        .filter((v): v is NonNullable<typeof v> => !!v);
      if (variants.length > 0) {
        return {
          name,
          label,
          helper,
          kind: "union-tabs",
          discriminator,
          variants,
          optional,
        };
      }
    }
    return { name, label, helper, kind: "unknown", optional };
  }

  return { name, label, helper, kind: "unknown", optional };
}

function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema as z.ZodTypeAny & {
    _def: { typeName: string; innerType?: z.ZodTypeAny };
  };
  while (
    current &&
    current._def &&
    [
      "ZodOptional",
      "ZodNullable",
      "ZodDefault",
      "ZodEffects",
      "ZodBranded",
      "ZodCatch",
      "ZodReadonly",
    ].includes(current._def.typeName) &&
    current._def.innerType
  ) {
    current = current._def.innerType as typeof current;
  }
  return current;
}

function isOptional(schema: z.ZodTypeAny): boolean {
  const tn = (schema._def as { typeName?: string }).typeName;
  return tn === "ZodOptional" || tn === "ZodNullable" || tn === "ZodDefault";
}

function humanize(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function humanizeEnumValue(v: string): string {
  // ALL_CAPS_SNAKE → "All caps snake"; camelCase → "Camel case".
  return humanize(v.toLowerCase().replace(/_/g, " "));
}

function splitDescribe(
  raw: string | undefined,
  fallback: string,
): { label: string; helper?: string } {
  if (!raw) return { label: fallback };
  // Convention: "Label\nHelper text". Helper is optional.
  const idx = raw.indexOf("\n");
  if (idx === -1) {
    // Special markers (column catalog, multiline flag) are stripped before
    // surfacing as label.
    if (raw.startsWith("__columns__:")) return { label: fallback };
    return { label: raw };
  }
  return { label: raw.slice(0, idx), helper: raw.slice(idx + 1) };
}

interface ColumnCatalogParse {
  columns: ColumnDescriptor<string>[];
  label?: string;
}

function parseColumnCatalog(
  raw: string | undefined,
): ColumnCatalogParse | null {
  if (!raw) return null;
  // Format: "__columns__:key:Label,key2:Label2,..."
  // OR     "__columns__:key1,key2,..." (label = humanized key)
  // Optional label suffix on a second line.
  const [first, ...rest] = raw.split("\n");
  const m = /^__columns__:(.*)$/.exec(first);
  if (!m) return null;
  const body = m[1];
  if (!body.trim()) return { columns: [] };
  const columns: ColumnDescriptor<string>[] = body
    .split(",")
    .map((entry) => {
      const [key, ...labelParts] = entry.split(":");
      const k = key.trim();
      const labelText = labelParts.join(":").trim();
      return { key: k, label: labelText || humanize(k) };
    })
    .filter((c) => c.key.length > 0);
  const labelLine = rest.length > 0 ? rest[0] : undefined;
  return { columns, label: labelLine };
}

function detectDiscriminator(options: z.ZodTypeAny[]): string | undefined {
  // Walk option shapes; find a key that is a ZodLiteral in every option.
  const candidates = new Map<string, number>();
  for (const opt of options) {
    const inner = unwrap(opt) as {
      _def?: { shape?: () => Record<string, z.ZodTypeAny>; typeName?: string };
    };
    if (inner._def?.typeName !== "ZodObject" || !inner._def.shape) return undefined;
    const shape = inner._def.shape();
    for (const [k, v] of Object.entries(shape)) {
      const tn = (unwrap(v) as { _def?: { typeName?: string } })._def?.typeName;
      if (tn === "ZodLiteral") {
        candidates.set(k, (candidates.get(k) ?? 0) + 1);
      }
    }
  }
  for (const [k, count] of candidates) {
    if (count === options.length) return k;
  }
  return undefined;
}

function extractLiteralValue(schema: z.ZodTypeAny): string | number | boolean | undefined {
  const inner = unwrap(schema) as {
    _def?: { typeName?: string; value?: string | number | boolean };
  };
  if (inner._def?.typeName === "ZodLiteral") return inner._def.value;
  return undefined;
}

// ---------------------------------------------------------------------------
// FieldRow renderer — switch on FieldKind and render the matching primitive.
// ---------------------------------------------------------------------------

interface FieldRowProps {
  field: FieldDescriptor;
  value: unknown;
  onChange: (next: unknown) => void;
}

function FieldRow({ field, value, onChange }: FieldRowProps) {
  const { colors } = useTheme();

  switch (field.kind) {
    // -----------------------------------------------------------------------
    case "boolean":
      return (
        <ToggleRow
          label={field.label}
          hint={field.helper}
          checked={!!value}
          onCheckedChange={onChange}
        />
      );

    // -----------------------------------------------------------------------
    case "string":
    case "string-email":
    case "string-url":
    case "string-numeric": {
      const keyboardType =
        field.kind === "string-email"
          ? "email-address"
          : field.kind === "string-url"
            ? "url"
            : field.kind === "string-numeric"
              ? "number-pad"
              : "default";
      const autoCapitalize =
        field.kind === "string-email" || field.kind === "string-url"
          ? "none"
          : "sentences";
      return (
        <LabeledField label={field.label} helper={field.helper}>
          <Input
            keyboardType={keyboardType as never}
            autoCapitalize={autoCapitalize as never}
            value={value == null ? "" : String(value)}
            onChangeText={(text: string) =>
              onChange(text === "" && field.optional ? undefined : text)
            }
            maxLength={field.maxLen}
          />
        </LabeledField>
      );
    }

    // -----------------------------------------------------------------------
    case "string-multiline":
      return (
        <LabeledField label={field.label} helper={field.helper}>
          <TextArea
            value={value == null ? "" : String(value)}
            onChangeText={(text: string) =>
              onChange(text === "" && field.optional ? undefined : text)
            }
            maxLength={field.maxLen}
            minHeight={96}
            numberOfLines={4}
          />
        </LabeledField>
      );

    // -----------------------------------------------------------------------
    case "string-date":
    case "date": {
      const dateValue = parseDateLoose(value);
      return (
        <LabeledField label={field.label} helper={field.helper}>
          <DatePicker
            value={dateValue}
            onChange={(d) => {
              if (!d) {
                onChange(field.optional ? null : undefined);
                return;
              }
              if (field.kind === "string-date") {
                onChange(d instanceof Date ? d.toISOString() : String(d));
              } else {
                onChange(d);
              }
            }}
            type="date"
          />
        </LabeledField>
      );
    }

    // -----------------------------------------------------------------------
    case "date-range": {
      const v = (value ?? {}) as { from?: unknown; to?: unknown };
      const range = {
        from: parseDateLoose(v.from),
        to: parseDateLoose(v.to),
      };
      return (
        <LabeledField label={field.label} helper={field.helper}>
          <DateRangePicker
            value={range}
            onChange={(r) => {
              const next = {
                from: r?.from ? r.from.toISOString() : null,
                to: r?.to ? r.to.toISOString() : null,
              };
              onChange(next);
            }}
            showPresets
          />
        </LabeledField>
      );
    }

    // -----------------------------------------------------------------------
    case "number": {
      const num =
        typeof value === "number"
          ? value
          : value == null || value === ""
            ? undefined
            : Number(value);
      return (
        <LabeledField label={field.label} helper={field.helper}>
          <NumberInput
            value={num}
            min={field.min}
            max={field.max}
            onChange={(n) => onChange(n == null ? (field.optional ? undefined : 0) : n)}
          />
        </LabeledField>
      );
    }

    // -----------------------------------------------------------------------
    case "number-slider": {
      const min = field.min ?? 0;
      const max = field.max ?? 10;
      const step = field.step ?? 1;
      const num =
        typeof value === "number"
          ? value
          : value == null || value === ""
            ? min
            : Number(value);
      return (
        <LabeledField
          label={`${field.label} (${num})`}
          helper={field.helper}
        >
          <Slider
            value={num}
            minimumValue={min}
            maximumValue={max}
            step={step}
            onValueChange={(n) => onChange(Math.round(n))}
          />
        </LabeledField>
      );
    }

    // -----------------------------------------------------------------------
    case "enum-radio":
      return (
        <LabeledField label={field.label} helper={field.helper}>
          <RadioGroup
            value={value == null ? undefined : String(value)}
            onValueChange={(v: string) => onChange(v)}
          >
            <View style={{ gap: 6 }}>
              {(field.options ?? []).map((opt) => (
                <RadioOptionRow
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                />
              ))}
            </View>
          </RadioGroup>
        </LabeledField>
      );

    // -----------------------------------------------------------------------
    case "enum-combobox":
      return (
        <LabeledField label={field.label} helper={field.helper}>
          <Combobox
            mode="single"
            value={value == null ? undefined : String(value)}
            onValueChange={(v) => {
              const next = Array.isArray(v) ? v[0] : v;
              onChange(next ?? undefined);
            }}
            options={field.options ?? []}
            placeholder="Selecione..."
            searchable={(field.options ?? []).length > 8}
          />
        </LabeledField>
      );

    // -----------------------------------------------------------------------
    case "multi-enum": {
      const arr = Array.isArray(value) ? (value as unknown[]).map(String) : [];
      return (
        <LabeledField label={field.label} helper={field.helper}>
          <Combobox
            mode="multiple"
            value={arr}
            onValueChange={(v) => {
              const next = Array.isArray(v) ? v : v == null ? [] : [v];
              onChange(next);
            }}
            options={field.options ?? []}
            placeholder="Selecione..."
            searchable={(field.options ?? []).length > 8}
          />
        </LabeledField>
      );
    }

    // -----------------------------------------------------------------------
    case "column-picker": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <LabeledField label={field.label} helper={field.helper}>
          <ColumnPicker
            catalog={field.columns ?? []}
            selected={arr}
            onChange={(next) => onChange(next)}
          />
        </LabeledField>
      );
    }

    // -----------------------------------------------------------------------
    case "object": {
      // Recurse into the nested schema, wrapped in a Section so the user gets
      // visual hierarchy. The recursive call uses inline=true to skip extra
      // outer padding.
      const nested = (value && typeof value === "object" ? value : {}) as Record<
        string,
        unknown
      >;
      return (
        <Section title={field.label} defaultOpen>
          {field.helper && (
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              {field.helper}
            </Text>
          )}
          <DynamicFormField
            schema={field.innerSchema as z.ZodType<unknown>}
            value={nested}
            onChange={onChange}
            inline
          />
        </Section>
      );
    }

    // -----------------------------------------------------------------------
    case "union-tabs": {
      const variants = field.variants ?? [];
      const obj =
        value && typeof value === "object" ? (value as Record<string, unknown>) : {};
      const currentDiscriminatorVal = field.discriminator
        ? obj[field.discriminator]
        : undefined;
      const activeVariant =
        variants.find((v) => v.value === String(currentDiscriminatorVal)) ??
        variants[0];
      return (
        <LabeledField label={field.label} helper={field.helper}>
          <Tabs
            value={activeVariant?.value}
            onValueChange={(v: string) => {
              // When the user switches branch, seed the new discriminator
              // value but otherwise keep matching keys to minimise data loss.
              if (!field.discriminator) return;
              onChange({ ...obj, [field.discriminator]: v });
            }}
          >
            <TabsList>
              {variants.map((v) => (
                <TabsTrigger key={v.value} value={v.value}>
                  {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {variants.map((v) => (
              <TabsContent key={v.value} value={v.value}>
                <DynamicFormField
                  schema={v.schema as z.ZodType<unknown>}
                  value={obj}
                  onChange={onChange}
                  inline
                />
              </TabsContent>
            ))}
          </Tabs>
        </LabeledField>
      );
    }

    // -----------------------------------------------------------------------
    case "unknown":
    default:
      return (
        <LabeledField label={field.label} helper={field.helper}>
          <View
            style={{
              padding: 10,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 6,
              backgroundColor: colors.muted,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              Esta configuração precisa de uma tela personalizada — abra a
              versão web ou peça ao desenvolvedor do widget para adicionar um
              ConfigComponent.
            </Text>
          </View>
        </LabeledField>
      );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function RadioOptionRow({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 6,
      }}
    >
      <RadioGroupItem value={value} />
      <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function parseDateLoose(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === "string" && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
}
