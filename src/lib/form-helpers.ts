import type { Control, FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

/**
 * Creates a properly typed form control for use with generic form data types
 * This helper eliminates the need for type casting in form components
 */
export function createTypedControl<TFormData extends FieldValues>(
  form: UseFormReturn<TFormData>
) {
  return form.control;
}

/**
 * Type-safe field name helper for form components
 * Ensures field names are valid keys of the form data type
 */
export function createFieldName<TFormData extends FieldValues>(
  fieldName: FieldPath<TFormData>
): FieldPath<TFormData> {
  return fieldName;
}

/**
 * Generic control props interface for form field components
 */
export interface FormFieldProps<TFormData extends FieldValues> {
  control: Control<TFormData>;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Extended form field props with additional common properties
 */
export interface ExtendedFormFieldProps<TFormData extends FieldValues>
  extends FormFieldProps<TFormData> {
  placeholder?: string;
  error?: string;
  helperText?: string;
}

/**
 * Props for form field components that create new options
 */
export interface CreateableFormFieldProps<TFormData extends FieldValues>
  extends FormFieldProps<TFormData> {
  onCreate?: (newValue: string) => Promise<string> | void;
  onCreateError?: (error: Error) => void;
}