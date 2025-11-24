/**
 * Form Styles Constants
 *
 * Single source of truth for all form-related styling across the mobile application.
 * These constants ensure consistency between all forms and match the web application patterns.
 *
 * Usage:
 * import { formStyles, formSpacing, formTypography } from "@/constants/form-styles";
 */

import { StyleSheet } from "react-native";
import { spacing, fontSize, fontWeight, borderRadius } from "./design-system";

// =============================================================================
// FORM SPACING CONSTANTS
// =============================================================================

export const formSpacing = {
  /** Spacing between form fields (marginBottom) */
  fieldGap: spacing.md, // 16px

  /** Spacing within field groups (gap between label and input) */
  labelInputGap: spacing.xs, // 4px

  /** Spacing between error message and input */
  errorGap: spacing.xs, // 4px

  /** Spacing between helper text and input */
  helperGap: spacing.xs, // 4px

  /** Card section padding */
  cardPadding: spacing.md, // 16px

  /** Card section margin bottom */
  cardMarginBottom: spacing.md, // 16px

  /** Form container horizontal padding */
  containerPaddingHorizontal: spacing.md, // 16px

  /** Form container vertical padding */
  containerPaddingVertical: spacing.md, // 16px

  /** Spacing between card header and content */
  cardHeaderContentGap: spacing.sm, // 8px

  /** Row gap for multi-column layouts */
  rowGap: spacing.sm, // 8px

  /** Action bar padding */
  actionBarPadding: spacing.md, // 16px
} as const;

// =============================================================================
// FORM TYPOGRAPHY CONSTANTS
// =============================================================================

export const formTypography = {
  /** Label text */
  label: {
    fontSize: fontSize.sm, // 14px
    fontWeight: fontWeight.medium, // 500
    lineHeight: 20,
  },

  /** Helper text below inputs */
  helper: {
    fontSize: fontSize.xs, // 12px
    fontWeight: fontWeight.normal, // 400
    lineHeight: 16,
  },

  /** Error message text */
  error: {
    fontSize: fontSize.xs, // 12px
    fontWeight: fontWeight.medium, // 500
    lineHeight: 16,
  },

  /** Card title text */
  cardTitle: {
    fontSize: fontSize.base, // 16px
    fontWeight: fontWeight.semibold, // 600
    lineHeight: 24,
  },

  /** Card subtitle text */
  cardSubtitle: {
    fontSize: fontSize.sm, // 14px
    fontWeight: fontWeight.normal, // 400
    lineHeight: 20,
  },

  /** Section header text */
  sectionTitle: {
    fontSize: fontSize.lg, // 18px
    fontWeight: fontWeight.semibold, // 600
    lineHeight: 28,
  },

  /** Required asterisk */
  requiredAsterisk: {
    fontSize: fontSize.sm, // 14px
    fontWeight: fontWeight.medium, // 500
    marginLeft: 4,
  },
} as const;

// =============================================================================
// FORM LAYOUT CONSTANTS
// =============================================================================

export const formLayout = {
  /** Input height */
  inputHeight: 40,

  /** Large input height */
  inputHeightLarge: 48,

  /** Textarea minimum height */
  textareaMinHeight: 100,

  /** Button minimum height */
  buttonMinHeight: 48,

  /** Icon size in labels */
  labelIconSize: 16,

  /** Icon size in inputs */
  inputIconSize: 20,

  /** Card border radius */
  cardBorderRadius: borderRadius.lg, // 12px

  /** Input border radius */
  inputBorderRadius: borderRadius.md, // 8px

  /** Button border radius */
  buttonBorderRadius: borderRadius.md, // 8px

  /** Border width */
  borderWidth: 1,

  /** Maximum form width for tablets */
  maxFormWidth: 600,
} as const;

// =============================================================================
// FORM ELEMENT STYLES (StyleSheet)
// =============================================================================

export const formStyles = StyleSheet.create({
  // Container styles
  formContainer: {
    flex: 1,
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingVertical: formSpacing.containerPaddingVertical,
  },

  scrollContent: {
    paddingBottom: spacing.xxl, // Extra padding for keyboard
  },

  // Field styles
  fieldWrapper: {
    marginBottom: formSpacing.fieldGap,
  },

  fieldLabel: {
    fontSize: formTypography.label.fontSize,
    fontWeight: formTypography.label.fontWeight as any,
    marginBottom: formSpacing.labelInputGap,
  },

  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: formSpacing.labelInputGap,
  },

  requiredAsterisk: {
    fontSize: formTypography.requiredAsterisk.fontSize,
    fontWeight: formTypography.requiredAsterisk.fontWeight as any,
    marginLeft: formTypography.requiredAsterisk.marginLeft,
  },

  fieldHelper: {
    fontSize: formTypography.helper.fontSize,
    fontWeight: formTypography.helper.fontWeight as any,
    marginTop: formSpacing.helperGap,
  },

  fieldError: {
    fontSize: formTypography.error.fontSize,
    fontWeight: formTypography.error.fontWeight as any,
    marginTop: formSpacing.errorGap,
  },

  // Card styles
  formCard: {
    borderRadius: formLayout.cardBorderRadius,
    borderWidth: formLayout.borderWidth,
    marginBottom: formSpacing.cardMarginBottom,
    overflow: "hidden",
  },

  formCardHeader: {
    paddingHorizontal: formSpacing.cardPadding,
    paddingTop: formSpacing.cardPadding,
    paddingBottom: formSpacing.cardHeaderContentGap,
    borderBottomWidth: formLayout.borderWidth,
  },

  formCardTitle: {
    fontSize: formTypography.cardTitle.fontSize,
    fontWeight: formTypography.cardTitle.fontWeight as any,
  },

  formCardSubtitle: {
    fontSize: formTypography.cardSubtitle.fontSize,
    fontWeight: formTypography.cardSubtitle.fontWeight as any,
    marginTop: 2,
  },

  formCardContent: {
    padding: formSpacing.cardPadding,
  },

  // Row layouts
  fieldRow: {
    flexDirection: "row",
    gap: formSpacing.rowGap,
  },

  fieldRowItem: {
    flex: 1,
  },

  // Action bar styles
  actionBar: {
    flexDirection: "row",
    gap: formSpacing.rowGap,
    paddingHorizontal: formSpacing.actionBarPadding,
    paddingVertical: formSpacing.actionBarPadding,
    borderTopWidth: formLayout.borderWidth,
  },

  actionButton: {
    flex: 1,
    minHeight: formLayout.buttonMinHeight,
  },

  // Section styles
  sectionTitle: {
    fontSize: formTypography.sectionTitle.fontSize,
    fontWeight: formTypography.sectionTitle.fontWeight as any,
    marginBottom: formSpacing.cardPadding,
  },

  // Separator
  separator: {
    height: formLayout.borderWidth,
    marginVertical: formSpacing.cardPadding,
  },
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get colors for form elements based on state
 */
export function getFormColors(colors: {
  foreground: string;
  mutedForeground: string;
  destructive: string;
  border: string;
  card: string;
  background: string;
  primary: string;
}) {
  return {
    label: {
      default: colors.foreground,
      error: colors.destructive,
    },
    helper: colors.mutedForeground,
    error: colors.destructive,
    required: colors.destructive,
    border: {
      default: colors.border,
      error: colors.destructive,
    },
    card: {
      background: colors.card,
      border: colors.border,
    },
    input: {
      background: colors.background,
      border: colors.border,
    },
  };
}

/**
 * Generate consistent form field styles with theme colors
 */
export function createFieldStyles(colors: ReturnType<typeof getFormColors>) {
  return {
    label: {
      ...formStyles.fieldLabel,
      color: colors.label.default,
    },
    labelError: {
      ...formStyles.fieldLabel,
      color: colors.label.error,
    },
    required: {
      ...formStyles.requiredAsterisk,
      color: colors.required,
    },
    helper: {
      ...formStyles.fieldHelper,
      color: colors.helper,
    },
    error: {
      ...formStyles.fieldError,
      color: colors.error,
    },
  };
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type FormSpacing = typeof formSpacing;
export type FormTypography = typeof formTypography;
export type FormLayout = typeof formLayout;
