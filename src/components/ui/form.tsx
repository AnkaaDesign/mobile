import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import type { ControllerProps, FieldPath, FieldValues } from "react-hook-form";
import { useTheme } from "@/lib/theme";

import { formSpacing, formTypography, formStyles as standardFormStyles } from "@/constants/form-styles";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

interface FormItemProps {
  children: React.ReactNode;
  style?: any;
}

const FormItem = React.forwardRef<View, FormItemProps>(({ style, children, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <View ref={ref} style={[styles.formItem, style]} {...props}>
        {children}
      </View>
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

interface FormLabelProps {
  children: React.ReactNode;
  style?: any;
  /** Whether the field is required (shows red asterisk) */
  required?: boolean;
  /** Whether to show the label inline with icon */
  withIcon?: boolean;
  /** Custom color for the required asterisk (defaults to destructive color) */
  asteriskColor?: string;
}

const FormLabel = React.forwardRef<Text, FormLabelProps>(
  ({ style, children, required, withIcon, asteriskColor, ...props }, ref) => {
    const { error, formItemId } = useFormField();
    const { colors } = useTheme();

    const labelColor = error ? colors.destructive : colors.foreground;

    // If required, wrap children with asterisk
    const labelContent = required ? (
      <Text
        ref={ref}
        nativeID={formItemId}
        style={[styles.formLabel, { color: labelColor }, style]}
        {...props}
      >
        {children}
        <Text style={[styles.requiredAsterisk, { color: asteriskColor ?? colors.destructive }]}> *</Text>
      </Text>
    ) : (
      <Text
        ref={ref}
        nativeID={formItemId}
        style={[styles.formLabel, { color: labelColor }, style]}
        {...props}
      >
        {children}
      </Text>
    );

    // If withIcon is true, wrap in a row layout
    if (withIcon) {
      return (
        <View style={styles.labelRow}>
          {labelContent}
        </View>
      );
    }

    return labelContent;
  }
);
FormLabel.displayName = "FormLabel";

interface FormControlProps {
  children: React.ReactElement;
}

const FormControl = React.forwardRef<View, FormControlProps>(({ children, ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  // Clone the child element and pass down relevant props
  return React.cloneElement(children, {
    nativeID: formItemId,
    "aria-describedby": !error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`,
    "aria-invalid": !!error,
    error: !!error,
    ref,
    ...props,
  } as any);
});
FormControl.displayName = "FormControl";

interface FormDescriptionProps {
  children: React.ReactNode;
  style?: any;
}

const FormDescription = React.forwardRef<Text, FormDescriptionProps>(
  ({ style, children, ...props }, ref) => {
    const { formDescriptionId } = useFormField();
    const { colors } = useTheme();

    return (
      <Text
        ref={ref}
        nativeID={formDescriptionId}
        style={[styles.formDescription, { color: colors.mutedForeground }, style]}
        {...props}
      >
        {children}
      </Text>
    );
  }
);
FormDescription.displayName = "FormDescription";

interface FormMessageProps {
  children?: React.ReactNode;
  style?: any;
}

const FormMessage = React.forwardRef<Text, FormMessageProps>(
  ({ style, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const { colors } = useTheme();
    const body = error ? String(error?.message ?? "") : children;

    if (!body) {
      return null;
    }

    return (
      <Text
        ref={ref}
        nativeID={formMessageId}
        style={[styles.formMessage, { color: colors.destructive }, style]}
        {...props}
      >
        {body}
      </Text>
    );
  }
);
FormMessage.displayName = "FormMessage";

const styles = StyleSheet.create({
  formItem: {
    marginBottom: formSpacing.fieldGap, // 16px - consistent spacing between fields
  },
  formLabel: {
    fontSize: formTypography.label.fontSize, // 14px
    fontWeight: formTypography.label.fontWeight as any, // 500 (medium)
    marginBottom: formSpacing.labelInputGap, // 4px
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  requiredAsterisk: {
    fontSize: formTypography.requiredAsterisk.fontSize,
    fontWeight: formTypography.requiredAsterisk.fontWeight as any,
  },
  formDescription: {
    fontSize: formTypography.helper.fontSize, // 12px
    marginTop: formSpacing.helperGap, // 4px
  },
  formMessage: {
    fontSize: formTypography.error.fontSize, // 12px
    fontWeight: formTypography.error.fontWeight as any, // 500
    marginTop: formSpacing.errorGap, // 4px
  },
});

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
