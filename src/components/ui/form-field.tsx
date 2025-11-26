import { View } from "react-native";
import { Controller, Control, FieldPath, FieldValues, FieldError } from "react-hook-form";
import { Text } from "./text";
import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Combobox } from "./combobox";
import { Checkbox } from "./checkbox";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { DatePicker } from "./date-picker";
import { NumberInput } from "./number-input";
import { Switch } from "./switch";
import { cn } from "@/lib/cn";
import { useKeyboardAwareForm } from "@/contexts/KeyboardAwareFormContext";

// Base FormField props that all field types share
export interface BaseFormFieldProps<TFormData extends FieldValues> {
  control: Control<TFormData>;
  name: FieldPath<TFormData>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  className?: string;
  error?: FieldError;
}

// Text input field
export interface TextFormFieldProps<TFormData extends FieldValues> extends BaseFormFieldProps<TFormData> {
  type: "text" | "email" | "password";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "url";
}

// Number input field
export interface NumberFormFieldProps<TFormData extends FieldValues> extends BaseFormFieldProps<TFormData> {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
}

// Currency input field
export interface CurrencyFormFieldProps<TFormData extends FieldValues> extends BaseFormFieldProps<TFormData> {
  type: "currency";
}

// Textarea field
export interface TextareaFormFieldProps<TFormData extends FieldValues> extends BaseFormFieldProps<TFormData> {
  type: "textarea";
  numberOfLines?: number;
}

// Select field
export interface SelectFormFieldProps<TFormData extends FieldValues> extends BaseFormFieldProps<TFormData> {
  type: "select";
  options: Array<{ value: string; label: string }>;
  emptyOption?: string;
}

// Checkbox field
export interface CheckboxFormFieldProps<TFormData extends FieldValues> extends BaseFormFieldProps<TFormData> {
  type: "checkbox";
}

// Radio group field
export interface RadioFormFieldProps<TFormData extends FieldValues> extends BaseFormFieldProps<TFormData> {
  type: "radio";
  options: Array<{ value: string; label: string }>;
}

// Switch field
export interface SwitchFormFieldProps<TFormData extends FieldValues> extends BaseFormFieldProps<TFormData> {
  type: "switch";
}

// Date picker field
export interface DateFormFieldProps<TFormData extends FieldValues> extends BaseFormFieldProps<TFormData> {
  type: "date" | "time" | "datetime";
}

// Union type for all form field props
export type FormFieldProps<TFormData extends FieldValues> =
  | TextFormFieldProps<TFormData>
  | NumberFormFieldProps<TFormData>
  | CurrencyFormFieldProps<TFormData>
  | TextareaFormFieldProps<TFormData>
  | SelectFormFieldProps<TFormData>
  | CheckboxFormFieldProps<TFormData>
  | RadioFormFieldProps<TFormData>
  | SwitchFormFieldProps<TFormData>
  | DateFormFieldProps<TFormData>;

export function FormField<TFormData extends FieldValues>(props: FormFieldProps<TFormData>) {
  const { control, name, label, helperText, error, required, disabled, className } = props;
  const keyboardContext = useKeyboardAwareForm();

  // Handlers for keyboard-aware integration
  const handleFocus = () => {
    keyboardContext?.onFieldFocus(name);
  };

  const renderField = (field: any) => {
    switch (props.type) {
      case "text":
      case "email":
      case "password":
        return (
          <Input
            {...field}
            placeholder={props.placeholder}
            secureTextEntry={props.type === "password"}
            autoCapitalize={props.autoCapitalize}
            keyboardType={props.keyboardType}
            editable={!disabled}
            error={!!error}
            onFocus={handleFocus}
          />
        );

      case "number":
        return (
          <NumberInput
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={props.placeholder}
            min={props.min}
            max={props.max}
            step={props.step}
            editable={!disabled}
            error={!!error}
            onFocus={handleFocus}
          />
        );

      case "currency":
        return (
          <Input
            type="currency"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={props.placeholder}
            disabled={disabled}
            error={!!error}
            onFocus={handleFocus}
          />
        );

      case "textarea":
        return (
          <Textarea
            {...field}
            placeholder={props.placeholder}
            numberOfLines={props.numberOfLines}
            editable={!disabled}
            error={!!error}
            onFocus={handleFocus}
          />
        );

      case "select":
        return (
          <Combobox
            value={field.value || ""}
            onValueChange={field.onChange}
            options={props.options}
            placeholder={props.placeholder}
            disabled={disabled}
            searchable={false}
            clearable={!!props.emptyOption}
            onOpen={keyboardContext?.onComboboxOpen}
            onClose={keyboardContext?.onComboboxClose}
          />
        );

      case "checkbox":
        return (
          <View className="flex-row items-center space-x-3">
            <Checkbox
              checked={field.value || false}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
            {label && (
              <Text className="text-sm text-foreground flex-1">
                {label}
                {required && <Text className="text-destructive ml-1">*</Text>}
              </Text>
            )}
          </View>
        );

      case "radio":
        return (
          <RadioGroup value={field.value} onValueChange={field.onChange} disabled={disabled}>
            {props.options.map((option) => (
              <View key={option.value} className="flex-row items-center space-x-3 py-2">
                <RadioGroupItem value={option.value} disabled={disabled} />
                <Text className="text-sm text-foreground">
                  {option.label}
                </Text>
              </View>
            ))}
          </RadioGroup>
        );

      case "switch":
        return (
          <View className="flex-row items-center justify-between">
            {label && (
              <Text className="text-sm font-medium text-foreground">
                {label}
                {required && <Text className="text-destructive ml-1">*</Text>}
              </Text>
            )}
            <Switch
              checked={field.value || false}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </View>
        );

      case "date":
      case "time":
      case "datetime":
        return (
          <DatePicker
            value={field.value}
            onChange={field.onChange}
            type={props.type}
            placeholder={props.placeholder}
            disabled={disabled}
          />
        );

      default:
        return null;
    }
  };

  const showLabel = label && !["checkbox", "switch"].includes(props.type);
  const showFieldWrapper = !["checkbox", "switch"].includes(props.type);

  return (
    <View
      className={cn("mb-4", className)}
      onLayout={keyboardContext ? (e) => keyboardContext.onFieldLayout(name, e) : undefined}
    >
      {showLabel && (
        <Label className="mb-2">
          {label}
          {required && <Text className="text-destructive ml-1">*</Text>}
        </Label>
      )}

      {helperText && !error && (
        <Text className="text-xs text-muted-foreground mb-2">
          {helperText}
        </Text>
      )}

      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const fieldElement = renderField(field);
          if (!fieldElement) return <View />;

          return showFieldWrapper ? (
            <View>
              {fieldElement}
            </View>
          ) : (
            <>{fieldElement}</>
          );
        }}
      />

      {error && (
        <Text className="text-xs text-destructive mt-1.5">
          {error.message}
        </Text>
      )}
    </View>
  );
}

// Convenient wrapper components for specific field types
export function TextFormField<TFormData extends FieldValues>(
  props: Omit<TextFormFieldProps<TFormData>, "type">
) {
  return <FormField {...props} type="text" />;
}

export function EmailFormField<TFormData extends FieldValues>(
  props: Omit<TextFormFieldProps<TFormData>, "type" | "keyboardType">
) {
  return <FormField {...props} type="email" keyboardType="email-address" />;
}

export function PasswordFormField<TFormData extends FieldValues>(
  props: Omit<TextFormFieldProps<TFormData>, "type">
) {
  return <FormField {...props} type="password" />;
}

export function NumberFormField<TFormData extends FieldValues>(
  props: Omit<NumberFormFieldProps<TFormData>, "type">
) {
  return <FormField {...props} type="number" />;
}

export function CurrencyFormField<TFormData extends FieldValues>(
  props: Omit<CurrencyFormFieldProps<TFormData>, "type">
) {
  return <FormField {...props} type="currency" />;
}

export function TextareaFormField<TFormData extends FieldValues>(
  props: Omit<TextareaFormFieldProps<TFormData>, "type">
) {
  return <FormField {...props} type="textarea" />;
}

export function SelectFormField<TFormData extends FieldValues>(
  props: Omit<SelectFormFieldProps<TFormData>, "type">
) {
  return <FormField {...props} type="select" />;
}

export function CheckboxFormField<TFormData extends FieldValues>(
  props: Omit<CheckboxFormFieldProps<TFormData>, "type">
) {
  return <FormField {...props} type="checkbox" />;
}

export function RadioFormField<TFormData extends FieldValues>(
  props: Omit<RadioFormFieldProps<TFormData>, "type">
) {
  return <FormField {...props} type="radio" />;
}

export function SwitchFormField<TFormData extends FieldValues>(
  props: Omit<SwitchFormFieldProps<TFormData>, "type">
) {
  return <FormField {...props} type="switch" />;
}

export function DateFormField<TFormData extends FieldValues>(
  props: Omit<DateFormFieldProps<TFormData>, "type">
) {
  return <FormField {...props} type="date" />;
}

export function TimeFormField<TFormData extends FieldValues>(
  props: Omit<DateFormFieldProps<TFormData>, "type">
) {
  return <FormField {...props} type="time" />;
}

export function DateTimeFormField<TFormData extends FieldValues>(
  props: Omit<DateFormFieldProps<TFormData>, "type">
) {
  return <FormField {...props} type="datetime" />;
}

