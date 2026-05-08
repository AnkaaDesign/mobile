// Auto-generates a form from a Zod object schema. Mirrors
// web/src/dashboard/components/dynamic-form-field.tsx but renders mobile-
// native controls (Input/Switch/Combobox) instead of HTML inputs.
//
// Supported field shapes:
//   - z.string()                      → TextInput
//   - z.string().email()              → TextInput (email keyboard)
//   - z.number() / z.number().int()   → TextInput (numeric keyboard)
//   - z.boolean()                     → Switch
//   - z.enum([...])                   → Combobox
//   - z.nativeEnum(...)               → Combobox
//   - Optional / Nullable / Default   → unwrapped recursively
//
// Anything else falls back to a JSON-textarea-style multiline input.

import { useMemo } from "react";
import { z } from "zod";
import { View, Text, TextInput } from "react-native";
import { useTheme } from "@/lib/theme";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";

interface DynamicFormFieldProps {
  schema: z.ZodType<unknown>;
  value: unknown;
  onChange: (next: unknown) => void;
}

export function DynamicFormField({
  schema,
  value,
  onChange,
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
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const setField = (name: string, v: unknown) =>
    onChange({ ...obj, [name]: v });

  return (
    <View style={{ gap: 12 }}>
      {fields.map((field) => (
        <FieldRow
          key={field.name}
          field={field}
          value={obj[field.name]}
          onChange={(v) => setField(field.name, v)}
        />
      ))}
    </View>
  );
}

// ---------- Field extraction (identical logic to web) ----------

interface FieldDescriptor {
  name: string;
  label: string;
  description?: string;
  kind: "string" | "number" | "boolean" | "enum" | "unknown";
  options?: Array<{ value: string; label: string }>;
  inputType?: "text" | "email" | "number";
  optional?: boolean;
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
      checks?: Array<{ kind: string }>;
      values?: unknown[];
    };
  })._def;
  const description = (schema._def as { description?: string }).description;
  const label = description ?? humanize(name);
  const typeName = innerDef?.typeName;

  if (typeName === "ZodString") {
    const checks = innerDef?.checks ?? [];
    const isEmail = checks.some((c) => c.kind === "email");
    return {
      name,
      label,
      description,
      kind: "string",
      inputType: isEmail ? "email" : "text",
      optional,
    };
  }
  if (typeName === "ZodNumber") {
    return { name, label, description, kind: "number", inputType: "number", optional };
  }
  if (typeName === "ZodBoolean") {
    return { name, label, description, kind: "boolean", optional };
  }
  if (typeName === "ZodEnum") {
    const values = (innerDef?.values as string[]) ?? [];
    return {
      name,
      label,
      description,
      kind: "enum",
      options: values.map((v) => ({ value: String(v), label: humanize(String(v)) })),
      optional,
    };
  }
  if (typeName === "ZodNativeEnum") {
    const valuesObj = (innerDef as unknown as { values: Record<string, string | number> })
      .values;
    const entries = Object.entries(valuesObj).filter(([, v]) => typeof v === "string");
    return {
      name,
      label,
      description,
      kind: "enum",
      options: entries.map(([k, v]) => ({ value: String(v), label: humanize(k) })),
      optional,
    };
  }
  return { name, label, description, kind: "unknown", optional };
}

function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema as z.ZodTypeAny & {
    _def: { typeName: string; innerType?: z.ZodTypeAny };
  };
  while (
    current &&
    current._def &&
    ["ZodOptional", "ZodNullable", "ZodDefault", "ZodEffects", "ZodBranded"].includes(
      current._def.typeName,
    ) &&
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

// ---------- Renderer ----------

interface FieldRowProps {
  field: FieldDescriptor;
  value: unknown;
  onChange: (next: unknown) => void;
}

function FieldRow({ field, value, onChange }: FieldRowProps) {
  const { colors } = useTheme();

  if (field.kind === "boolean") {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: colors.foreground }}>
            {field.label}
          </Text>
          {field.description && field.description !== field.label && (
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              {field.description}
            </Text>
          )}
        </View>
        <Switch checked={!!value} onCheckedChange={onChange} />
      </View>
    );
  }

  if (field.kind === "enum" && field.options) {
    return (
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 13, color: colors.foreground }}>
          {field.label}
        </Text>
        <Combobox
          value={value == null ? undefined : String(value)}
          onValueChange={(v: any) => onChange(typeof v === "string" ? v : v?.[0])}
          options={field.options}
          placeholder="Selecione..."
        />
      </View>
    );
  }

  if (field.kind === "number") {
    return (
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 13, color: colors.foreground }}>
          {field.label}
        </Text>
        <Input
          keyboardType="number-pad"
          value={value == null ? "" : String(value)}
          onChangeText={(text: string) => {
            const trimmed = text.replace(/[^0-9.-]/g, "");
            if (trimmed === "") {
              onChange(field.optional ? undefined : 0);
              return;
            }
            const n = Number(trimmed);
            onChange(Number.isFinite(n) ? n : 0);
          }}
        />
      </View>
    );
  }

  if (field.kind === "string") {
    return (
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 13, color: colors.foreground }}>
          {field.label}
        </Text>
        <Input
          keyboardType={field.inputType === "email" ? "email-address" : "default"}
          autoCapitalize={field.inputType === "email" ? "none" : "sentences"}
          value={value == null ? "" : String(value)}
          onChangeText={(text: string) =>
            onChange(text === "" && field.optional ? undefined : text)
          }
        />
      </View>
    );
  }

  // Fallback for unsupported shapes — multiline JSON-style input.
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 13, color: colors.foreground }}>{field.label}</Text>
      <TextInput
        multiline
        numberOfLines={4}
        style={{
          minHeight: 80,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontFamily: "monospace",
          fontSize: 12,
          color: colors.foreground,
          textAlignVertical: "top",
        }}
        value={value == null ? "" : JSON.stringify(value, null, 2)}
        onChangeText={(text: string) => {
          try {
            onChange(text ? JSON.parse(text) : undefined);
          } catch {
            // Keep partial text — wait for valid JSON before propagating.
          }
        }}
      />
    </View>
  );
}
