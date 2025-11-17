// packages/utils/src/form-variants.ts
// Unified form input variant system for consistent styling across all form components

import type { ThemeColors } from '@/types/theme';

// =====================
// Input Variants
// =====================

export type InputVariant = 'default' | 'error' | 'success' | 'warning' | 'loading' | 'disabled';

export interface InputVariantStyles {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  placeholderColor: string;
  iconColor?: string;
  focusBorderColor?: string;
  opacity?: number;
}

export function getInputVariantStyles(
  variant: InputVariant,
  colors: ThemeColors
): InputVariantStyles {
  switch (variant) {
    case 'error':
      return {
        borderColor: colors.destructive,
        backgroundColor: colors.input,
        textColor: colors.foreground,
        placeholderColor: colors.mutedForeground,
        iconColor: colors.destructive,
        focusBorderColor: colors.destructive,
      };

    case 'success':
      return {
        borderColor: colors.success || '#16a34a',
        backgroundColor: colors.input,
        textColor: colors.foreground,
        placeholderColor: colors.mutedForeground,
        iconColor: colors.success || '#16a34a',
        focusBorderColor: colors.success || '#16a34a',
      };

    case 'warning':
      return {
        borderColor: colors.warning || '#f59e0b',
        backgroundColor: colors.input,
        textColor: colors.foreground,
        placeholderColor: colors.mutedForeground,
        iconColor: colors.warning || '#f59e0b',
        focusBorderColor: colors.warning || '#f59e0b',
      };

    case 'loading':
      return {
        borderColor: colors.border,
        backgroundColor: colors.input,
        textColor: colors.mutedForeground,
        placeholderColor: colors.mutedForeground,
        iconColor: colors.mutedForeground,
        focusBorderColor: colors.ring,
        opacity: 0.7,
      };

    case 'disabled':
      return {
        borderColor: colors.border,
        backgroundColor: colors.muted,
        textColor: colors.mutedForeground,
        placeholderColor: colors.mutedForeground,
        iconColor: colors.mutedForeground,
        opacity: 0.5,
      };

    case 'default':
    default:
      return {
        borderColor: colors.border,
        backgroundColor: colors.input,
        textColor: colors.foreground,
        placeholderColor: colors.mutedForeground,
        iconColor: colors.mutedForeground,
        focusBorderColor: colors.ring,
      };
  }
}

// =====================
// Input Size Variants
// =====================

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputSizeStyles {
  height: number;
  fontSize: number;
  paddingHorizontal: number;
  paddingVertical: number;
  iconSize: number;
  borderRadius: number;
}

export function getInputSizeStyles(size: InputSize): InputSizeStyles {
  switch (size) {
    case 'sm':
      return {
        height: 36,
        fontSize: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        iconSize: 16,
        borderRadius: 6,
      };

    case 'lg':
      return {
        height: 56,
        fontSize: 18,
        paddingHorizontal: 20,
        paddingVertical: 16,
        iconSize: 24,
        borderRadius: 10,
      };

    case 'md':
    default:
      return {
        height: 48,
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        iconSize: 20,
        borderRadius: 8,
      };
  }
}

// =====================
// Form Field Status
// =====================

export interface FormFieldStatus {
  variant: InputVariant;
  message?: string;
  icon?: string;
}

export function getFormFieldStatus(
  value: any,
  error?: string,
  isValidating?: boolean,
  isSuccess?: boolean
): FormFieldStatus {
  if (isValidating) {
    return {
      variant: 'loading',
      message: 'Validando...',
      icon: 'IconLoader',
    };
  }

  if (error) {
    return {
      variant: 'error',
      message: error,
      icon: 'IconAlertCircle',
    };
  }

  if (isSuccess && value) {
    return {
      variant: 'success',
      message: undefined,
      icon: 'IconCheck',
    };
  }

  return {
    variant: 'default',
    message: undefined,
  };
}

// =====================
// Label Variants
// =====================

export interface LabelVariantStyles {
  color: string;
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700';
}

export function getLabelVariantStyles(
  variant: InputVariant,
  colors: ThemeColors
): LabelVariantStyles {
  const baseStyles: LabelVariantStyles = {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '500',
  };

  switch (variant) {
    case 'error':
      return {
        ...baseStyles,
        color: colors.destructive,
      };

    case 'success':
      return {
        ...baseStyles,
        color: colors.success || '#16a34a',
      };

    case 'warning':
      return {
        ...baseStyles,
        color: colors.warning || '#f59e0b',
      };

    case 'disabled':
      return {
        ...baseStyles,
        color: colors.mutedForeground,
      };

    default:
      return baseStyles;
  }
}

// =====================
// Helper Text Variants
// =====================

export interface HelperTextStyles {
  color: string;
  fontSize: number;
}

export function getHelperTextStyles(
  variant: InputVariant,
  colors: ThemeColors
): HelperTextStyles {
  switch (variant) {
    case 'error':
      return {
        color: colors.destructive,
        fontSize: 12,
      };

    case 'success':
      return {
        color: colors.success || '#16a34a',
        fontSize: 12,
      };

    case 'warning':
      return {
        color: colors.warning || '#f59e0b',
        fontSize: 12,
      };

    default:
      return {
        color: colors.mutedForeground,
        fontSize: 12,
      };
  }
}

// =====================
// Complete Form Field Styles
// =====================

export interface CompleteFormFieldStyles {
  input: InputVariantStyles & InputSizeStyles;
  label: LabelVariantStyles;
  helper: HelperTextStyles;
  status: FormFieldStatus;
}

export function getCompleteFormFieldStyles(
  variant: InputVariant,
  size: InputSize,
  colors: ThemeColors,
  value?: any,
  error?: string,
  isValidating?: boolean,
  isSuccess?: boolean
): CompleteFormFieldStyles {
  const status = getFormFieldStatus(value, error, isValidating, isSuccess);
  const effectiveVariant = status.variant;

  return {
    input: {
      ...getInputVariantStyles(effectiveVariant, colors),
      ...getInputSizeStyles(size),
    },
    label: getLabelVariantStyles(effectiveVariant, colors),
    helper: getHelperTextStyles(effectiveVariant, colors),
    status,
  };
}
