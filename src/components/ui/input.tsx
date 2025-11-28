import * as React from "react";
import { TextInput, View, ViewStyle, TextStyle, TextInputProps, Animated, StyleSheet, ActivityIndicator, LayoutChangeEvent, Text } from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, fontSize, transitions } from "@/constants/design-system";
import { useKeyboardAwareForm } from "@/contexts/KeyboardAwareFormContext";
import {
  formatCPF,
  formatCNPJ,
  formatBrazilianPhone,
  formatPIS,
  formatCEP,
  formatCurrency,
  formatPercentage,
  formatNumberWithDecimals,
  formatChassis,
  cleanCPF,
  cleanCNPJ,
  cleanPhone,
  cleanPIS,
  cleanCEP,
  cleanNumeric,
  cleanChassis,
  parseCurrency,
} from "@/utils";

type InputType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "decimal"
  | "currency"
  | "percentage"
  | "cpf"
  | "cnpj"
  | "cpf-cnpj"
  | "phone"
  | "pis"
  | "cep"
  | "date"
  | "time"
  | "rg"
  | "plate"
  | "chassis"
  | "integer"
  | "natural";

interface CepData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface InputProps extends Omit<TextInputProps, "value" | "onChangeText" | "style"> {
  type?: InputType;
  value?: string | number | null;
  onChange?: (value: string | number | null) => void;
  onChangeText?: (value: string | number | null) => void; // Alias for onChange
  decimals?: number;
  documentType?: "cpf" | "cnpj";
  onCepLookup?: (data: CepData) => void;
  showCepLoading?: boolean;
  style?: ViewStyle | ViewStyle[];
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  error?: boolean;
  errorMessage?: string;
  withIcon?: boolean;
  className?: string;
  disabled?: boolean;
  transparent?: boolean;
  // Min/Max for number/decimal/natural/integer types
  min?: number;
  max?: number;
  step?: number;
  loading?: boolean;
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
  // Keyboard-aware form integration
  // Unique identifier for this field to enable keyboard-aware scrolling
  fieldKey?: string;
  // Suffix text to display after the input value (e.g., "g", "kg", "ml")
  suffix?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      type = "text",
      value,
      onChange,
      onChangeText,
      decimals = 2,
      documentType,
      onCepLookup,
      showCepLoading = false,
      style,
      containerStyle,
      inputStyle,
      error,
      errorMessage,
      editable = true,
      disabled,
      withIcon,
      className,
      transparent = false,
      min,
      max,
      step,
      loading = false,
      fieldKey,
      suffix,
      ...props
    },
    ref,
  ) => {
    // Merge onChange and onChangeText
    const handleValueChange = onChange || onChangeText;

    // Handle disabled prop
    const isEditable = disabled !== undefined ? !disabled : editable;
    const { colors } = useTheme();
    const keyboardContext = useKeyboardAwareForm();
    const [isFocused, setIsFocused] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState("");
    const [isCepLoading, setIsCepLoading] = React.useState(false);
    const [previousCep, setPreviousCep] = React.useState("");
    const borderColorAnim = React.useRef(new Animated.Value(0)).current;
    const shadowAnim = React.useRef(new Animated.Value(0)).current;
    const inputRef = React.useRef<TextInput>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as TextInput);

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(borderColorAnim, {
          toValue: isFocused ? 1 : 0,
          duration: transitions.fast,
          useNativeDriver: false,
        }),
        Animated.timing(shadowAnim, {
          toValue: isFocused ? 1 : 0,
          duration: transitions.fast,
          useNativeDriver: false,
        }),
      ]).start();
    }, [isFocused, borderColorAnim, shadowAnim]);

    // Format value based on type
    const formatValue = React.useCallback(
      (val: string | number | null | undefined, inputType: InputType, docType?: "cpf" | "cnpj"): string => {
        if (val === null || val === undefined) return "";

        const strValue = String(val);

        switch (inputType) {
          case "cpf":
            return formatCPF(strValue);
          case "cnpj":
            return formatCNPJ(strValue);
          case "cpf-cnpj":
            return docType === "cnpj" ? formatCNPJ(strValue) : formatCPF(strValue);
          case "phone":
            return formatBrazilianPhone(strValue);
          case "pis":
            return formatPIS(strValue);
          case "cep":
            return formatCEP(strValue);
          case "currency": {
            if (typeof val === "number") {
              return formatCurrency(val);
            }
            const cleanStr = strValue.replace(/[^\d,-]/g, "").replace(",", ".");
            const numVal = parseFloat(cleanStr);
            if (!isNaN(numVal)) {
              return formatCurrency(numVal);
            }
            const cents = parseInt(strValue.replace(/\D/g, ""), 10) || 0;
            return formatCurrency(cents / 100);
          }
          case "percentage": {
            const pctVal = typeof val === "number" ? val : parseFloat(strValue.replace(/[^\d,.-]/g, "").replace(",", "."));
            return isNaN(pctVal) ? "" : formatNumberWithDecimals(pctVal, decimals) + "%";
          }
          case "decimal":
          case "number": {
            const decVal = typeof val === "number" ? val : parseFloat(strValue.replace(/[^\d,.-]/g, "").replace(",", "."));
            if (isNaN(decVal)) return "";
            if (inputType === "decimal") {
              return decVal.toString().replace(".", ",");
            }
            return formatNumberWithDecimals(decVal, 0);
          }
          case "integer":
          case "natural": {
            const intVal = typeof val === "number" ? val : parseInt(strValue.replace(/[^\d-]/g, ""), 10);
            if (isNaN(intVal)) return "";
            if (inputType === "natural" && intVal < 0) return "0";
            return String(intVal);
          }
          case "plate":
            return strValue.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8);
          case "chassis":
            return formatChassis(strValue);
          case "rg":
            return strValue.replace(/[^0-9A-Za-z.-]/g, "").slice(0, 15);
          default:
            return strValue;
        }
      },
      [decimals],
    );

    // Clean value to get the actual data value
    const cleanValue = React.useCallback(
      (val: string, inputType: InputType, docType?: "cpf" | "cnpj"): string | number | null => {
        if (!val) return null;

        switch (inputType) {
          case "cpf":
            return cleanCPF(val);
          case "cnpj":
            return cleanCNPJ(val);
          case "cpf-cnpj":
            return docType === "cnpj" ? cleanCNPJ(val) : cleanCPF(val);
          case "phone":
            return cleanPhone(val);
          case "pis":
            return cleanPIS(val);
          case "cep":
            return cleanCEP(val);
          case "currency": {
            try {
              return parseCurrency(val);
            } catch {
              const cleaned = val.replace(/[^\d,-]/g, "");
              const normalized = cleaned.replace(",", ".");
              const parsed = parseFloat(normalized);
              return isNaN(parsed) ? null : parsed;
            }
          }
          case "percentage": {
            const cleaned = val.replace(/[^\d,.-]/g, "").replace(",", ".");
            const pct = parseFloat(cleaned);
            return isNaN(pct) ? null : pct;
          }
          case "decimal":
          case "number": {
            const cleaned = val.replace(/[^\d,.-]/g, "").replace(",", ".");
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
          }
          case "integer": {
            const intVal = parseInt(val.replace(/[^\d-]/g, ""), 10);
            return isNaN(intVal) ? null : intVal;
          }
          case "natural": {
            const natVal = parseInt(val.replace(/\D/g, ""), 10);
            return isNaN(natVal) || natVal < 0 ? null : natVal;
          }
          case "plate":
            return val.toUpperCase().replace(/[^A-Z0-9-]/g, "");
          case "chassis":
            return cleanChassis(val);
          case "rg":
            return val.replace(/[^0-9A-Za-z.-]/g, "");
          default:
            return val;
        }
      },
      [],
    );

    // Update internal value when prop changes
    React.useEffect(() => {
      if (type === "currency") {
        if (!isFocused) {
          const cents = value !== undefined && value !== null ? Math.round(Number(value) * 100) : 0;

          if (cents === 0) {
            setInternalValue("");
          } else {
            const whole = Math.floor(cents / 100);
            const decimal = cents % 100;
            const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            const decimalStr = decimal.toString().padStart(2, "0");
            const formatted = `R$ ${wholeStr},${decimalStr}`;
            setInternalValue(formatted);
          }
        }
      } else {
        const formatted = formatValue(value, type, documentType);
        setInternalValue(formatted);
      }
    }, [value, type, documentType, formatValue, isFocused]);

    // Handle CEP lookup
    React.useEffect(() => {
      if (type === "cep" && onCepLookup) {
        const cleanedCep = cleanCEP(internalValue);
        if (cleanedCep.length === 8 && cleanedCep !== previousCep) {
          setPreviousCep(cleanedCep);
          setIsCepLoading(true);

          // Simulate CEP lookup (replace with actual API call)
          fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`)
            .then(res => res.json())
            .then(data => {
              if (!data.erro) {
                onCepLookup({
                  logradouro: data.logradouro || "",
                  bairro: data.bairro || "",
                  localidade: data.localidade || "",
                  uf: data.uf || "",
                });
              }
            })
            .catch(() => {})
            .finally(() => setIsCepLoading(false));
        }
      }
    }, [internalValue, type, onCepLookup, previousCep]);

    const handleChange = (text: string) => {
      // For currency - build from cents
      if (type === "currency") {
        const digitsOnly = text.replace(/\D/g, "");

        if (!digitsOnly) {
          setInternalValue("");
          handleValueChange?.(null);
          return;
        }

        let centsValue = parseInt(digitsOnly, 10);
        const maxCents = 99999999999;
        if (centsValue > maxCents) {
          centsValue = maxCents;
        }

        const realValue = centsValue / 100;
        const whole = Math.floor(centsValue / 100);
        const decimal = centsValue % 100;
        const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        const decimalStr = decimal.toString().padStart(2, "0");
        const formattedValue = `R$ ${wholeStr},${decimalStr}`;

        setInternalValue(formattedValue);
        handleValueChange?.(realValue > 0 ? realValue : null);
        return;
      }

      // For percentage
      if (type === "percentage") {
        const cleanedForPercentage = text.replace(/[^\d.,]/g, "");
        const hasDecimal = cleanedForPercentage.includes(",") || cleanedForPercentage.includes(".");

        if (!cleanedForPercentage || cleanedForPercentage === "," || cleanedForPercentage === ".") {
          setInternalValue("");
          handleValueChange?.(null);
          return;
        }

        let percentValue: number;

        if (hasDecimal) {
          const normalized = cleanedForPercentage.replace(",", ".");
          percentValue = parseFloat(normalized);
        } else {
          const digits = cleanedForPercentage.replace(/\D/g, "");
          if (digits.length <= 2) {
            percentValue = parseInt(digits, 10);
          } else {
            const wholePart = digits.slice(0, -2);
            const decimalPart = digits.slice(-2);
            percentValue = parseFloat(`${wholePart}.${decimalPart}`);
          }
        }

        if (isNaN(percentValue)) {
          setInternalValue("");
          handleValueChange?.(null);
          return;
        }

        if (percentValue > 9999.99) {
          percentValue = 9999.99;
        }

        const formattedValue = formatNumberWithDecimals(percentValue, decimals) + "%";
        setInternalValue(formattedValue);
        handleValueChange?.(percentValue);
        return;
      }

      // For decimal/number
      if (type === "decimal" || type === "number") {
        const cleanedForNumber = text.replace(/[^\d.,-]/g, "");

        if (!cleanedForNumber || cleanedForNumber === "," || cleanedForNumber === ".") {
          setInternalValue("");
          handleValueChange?.(null);
          return;
        }

        let displayValue = cleanedForNumber.replace(/\./g, ",");
        const commaCount = (displayValue.match(/,/g) || []).length;
        if (commaCount > 1) {
          const firstCommaIndex = displayValue.indexOf(",");
          displayValue = displayValue.slice(0, firstCommaIndex + 1) + displayValue.slice(firstCommaIndex + 1).replace(/,/g, "");
        }

        const normalized = displayValue.replace(",", ".");
        const numValue = parseFloat(normalized);

        if (isNaN(numValue)) {
          setInternalValue(displayValue);
          return;
        }

        let constrainedValue = numValue;
        if (min !== undefined && constrainedValue < min) {
          constrainedValue = min;
        }
        if (max !== undefined && constrainedValue > max) {
          constrainedValue = max;
        }

        setInternalValue(displayValue);
        handleValueChange?.(constrainedValue);
        return;
      }

      // For phone
      if (type === "phone") {
        const digits = text.replace(/\D/g, "");
        if (!digits) {
          setInternalValue("");
          handleValueChange?.(null);
          return;
        }

        const limitedDigits = digits.slice(0, 11);
        const formatted = formatBrazilianPhone(limitedDigits);
        setInternalValue(formatted);
        handleValueChange?.(limitedDigits);
        return;
      }

      // For CPF
      if (type === "cpf") {
        const digits = text.replace(/\D/g, "");
        if (!digits) {
          setInternalValue("");
          handleValueChange?.(null);
          return;
        }

        const limitedDigits = digits.slice(0, 11);
        let formatted = "";
        for (let i = 0; i < limitedDigits.length; i++) {
          if (i === 3 || i === 6) formatted += ".";
          if (i === 9) formatted += "-";
          formatted += limitedDigits[i];
        }

        setInternalValue(formatted);
        handleValueChange?.(limitedDigits);
        return;
      }

      // For CNPJ
      if (type === "cnpj") {
        const digits = text.replace(/\D/g, "");
        if (!digits) {
          setInternalValue("");
          handleValueChange?.(null);
          return;
        }

        const limitedDigits = digits.slice(0, 14);
        let formatted = "";
        for (let i = 0; i < limitedDigits.length; i++) {
          if (i === 2 || i === 5) formatted += ".";
          if (i === 8) formatted += "/";
          if (i === 12) formatted += "-";
          formatted += limitedDigits[i];
        }

        setInternalValue(formatted);
        handleValueChange?.(limitedDigits);
        return;
      }

      // For CEP
      if (type === "cep") {
        const digits = text.replace(/\D/g, "");
        if (!digits) {
          setInternalValue("");
          handleValueChange?.(null);
          return;
        }

        const limitedDigits = digits.slice(0, 8);
        let formatted = "";
        for (let i = 0; i < limitedDigits.length; i++) {
          if (i === 5) formatted += "-";
          formatted += limitedDigits[i];
        }

        setInternalValue(formatted);
        handleValueChange?.(limitedDigits);
        return;
      }

      // For PIS
      if (type === "pis") {
        const digits = text.replace(/\D/g, "");
        if (!digits) {
          setInternalValue("");
          handleValueChange?.(null);
          return;
        }

        const limitedDigits = digits.slice(0, 11);
        const formatted = formatPIS(limitedDigits);
        setInternalValue(formatted);
        handleValueChange?.(limitedDigits);
        return;
      }

      // For natural numbers
      if (type === "natural") {
        const processedValue = text.replace(/[^\d]/g, "");
        setInternalValue(processedValue);
        const numVal = parseInt(processedValue, 10);
        handleValueChange?.(isNaN(numVal) ? null : numVal);
        return;
      }

      // For integers
      if (type === "integer") {
        let processedValue = text.replace(/[^\d-]/g, "");
        const minusCount = (processedValue.match(/-/g) || []).length;
        if (minusCount > 1) {
          processedValue = "-" + processedValue.replace(/-/g, "");
        }
        setInternalValue(processedValue);
        const numVal = parseInt(processedValue, 10);
        handleValueChange?.(isNaN(numVal) ? null : numVal);
        return;
      }

      // For plate
      if (type === "plate") {
        const processed = text.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8);
        setInternalValue(processed);
        handleValueChange?.(processed || null);
        return;
      }

      // For chassis
      if (type === "chassis") {
        const processed = text.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 20);
        setInternalValue(processed);
        handleValueChange?.(cleanNumeric(processed.replace(/\s/g, "")) || null);
        return;
      }

      // For RG
      if (type === "rg") {
        const processed = text.replace(/[^0-9A-Za-z.-]/g, "").slice(0, 15);
        setInternalValue(processed);
        handleValueChange?.(processed || null);
        return;
      }

      // Default: text, email, password
      setInternalValue(text);
      handleValueChange?.(text || null);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);

      // Enforce min value on blur for decimal/number inputs
      if ((type === "decimal" || type === "number") && min !== undefined) {
        const normalized = internalValue.replace(",", ".");
        const numValue = parseFloat(normalized);

        if (isNaN(numValue) || internalValue === "" || internalValue === ",") {
          const minDisplay = min.toString().replace(".", ",");
          setInternalValue(minDisplay);
          handleValueChange?.(min);
        } else if (numValue < min) {
          const minDisplay = min.toString().replace(".", ",");
          setInternalValue(minDisplay);
          handleValueChange?.(min);
        } else if (max !== undefined && numValue > max) {
          const maxDisplay = max.toString().replace(".", ",");
          setInternalValue(maxDisplay);
          handleValueChange?.(max);
        }
      }

      // Enforce min value on blur for natural numbers
      if (type === "natural" && min !== undefined) {
        const numValue = parseInt(internalValue.replace(/\D/g, ""), 10);

        if (isNaN(numValue) || internalValue === "") {
          setInternalValue(min.toString());
          handleValueChange?.(min);
        } else if (numValue < min) {
          setInternalValue(min.toString());
          handleValueChange?.(min);
        } else if (max !== undefined && numValue > max) {
          setInternalValue(max.toString());
          handleValueChange?.(max);
        }
      }

      // Enforce min value on blur for integers
      if (type === "integer" && min !== undefined) {
        const numValue = parseInt(internalValue.replace(/[^\d-]/g, ""), 10);

        if (isNaN(numValue) || internalValue === "") {
          setInternalValue(min.toString());
          handleValueChange?.(min);
        } else if (numValue < min) {
          setInternalValue(min.toString());
          handleValueChange?.(min);
        } else if (max !== undefined && numValue > max) {
          setInternalValue(max.toString());
          handleValueChange?.(max);
        }
      }

      props.onBlur?.(e);
    };

    const getKeyboardType = (): TextInputProps["keyboardType"] => {
      switch (type) {
        case "cpf":
        case "cnpj":
        case "cpf-cnpj":
        case "phone":
        case "pis":
        case "cep":
        case "currency":
        case "number":
        case "integer":
        case "natural":
          return "numeric";
        case "decimal":
        case "percentage":
          return "decimal-pad";
        case "email":
          return "email-address";
        default:
          return "default";
      }
    };

    const getPlaceholder = (): string => {
      if (props.placeholder) return props.placeholder;

      switch (type) {
        case "cpf":
          return "000.000.000-00";
        case "cnpj":
          return "00.000.000/0000-00";
        case "cpf-cnpj":
          return documentType === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00";
        case "phone":
          return "(00) 00000-0000";
        case "pis":
          return "000.00000.00-0";
        case "cep":
          return "00000-000";
        case "currency":
          return "R$ 0,00";
        case "percentage":
          return "0%";
        case "plate":
          return "ABC1234";
        case "chassis":
          return "9BD 17205 1R 123456";
        case "rg":
          return "12.345.678-9";
        case "integer":
        case "natural":
          return "123";
        default:
          return "";
      }
    };

    const getMaxLength = (): number | undefined => {
      switch (type) {
        case "cpf":
          return 14;
        case "cnpj":
          return 18;
        case "phone":
          return 15;
        case "pis":
          return 14;
        case "cep":
          return 9;
        case "plate":
          return 8;
        case "chassis":
          return 20;
        case "rg":
          return 15;
        case "currency":
          return 20;
        default:
          return undefined;
      }
    };

    const getSecureTextEntry = (): boolean => {
      return type === "password";
    };

    const baseContainerStyles: ViewStyle = {
      width: "100%",
      ...containerStyle,
    };

    const animatedBorderColor = borderColorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.border, colors.ring],
    });

    // Extract borderColor from style prop if it exists
    const styleProp = Array.isArray(style) ? Object.assign({}, ...style) : style;
    const { borderColor: _ignoredBorderColor, ...styleWithoutBorder } = (styleProp || {}) as any;

    const baseContainerViewStyles: ViewStyle = {
      height: 42,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      backgroundColor: transparent ? "transparent" : colors.input,
      ...(isEditable === false && {
        opacity: 0.5,
        backgroundColor: colors.input,
      }),
      ...styleWithoutBorder,
    };

    const baseInputStyles: TextStyle = {
      flex: 1,
      paddingHorizontal: 12,
      paddingRight: withIcon || loading || (type === "cep" && showCepLoading && isCepLoading) ? 40 : suffix ? 30 : 12,
      paddingVertical: 0,
      fontSize: fontSize.base,
      color: colors.foreground,
      height: "100%",
      textAlignVertical: "center",
      includeFontPadding: false,
      ...inputStyle,
    };

    // Determine border color based on state - force re-evaluation on each render
    const getBorderColor = () => {
      if (error) return colors.destructive;
      if (isFocused) return colors.ring;
      return colors.border;
    };

    const animatedStyles = {
      borderColor: getBorderColor(),
    };

    const animatedShadowStyles = {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.08],
      }),
      shadowRadius: shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 3],
      }),
      elevation: shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 2],
      }),
    };

    const isLoading = loading || (type === "cep" && showCepLoading && isCepLoading);

    // Handle layout for keyboard-aware scrolling
    const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
      if (fieldKey && keyboardContext?.onFieldLayout) {
        keyboardContext.onFieldLayout(fieldKey, event);
      }
    }, [fieldKey, keyboardContext]);

    // Handle focus for keyboard-aware scrolling
    const handleInputFocus = React.useCallback((e: any) => {
      setIsFocused(true);
      // Notify keyboard context about focus for auto-scrolling
      if (fieldKey && keyboardContext?.onFieldFocus) {
        keyboardContext.onFieldFocus(fieldKey);
      }
      props.onFocus?.(e);
    }, [fieldKey, keyboardContext, props.onFocus]);

    return (
      <View
        style={baseContainerStyles}
        className={className}
        onLayout={handleLayout}
      >
        <Animated.View style={animatedShadowStyles}>
          <Animated.View style={[baseContainerViewStyles, animatedStyles]}>
            <TextInput
              {...props}
              ref={inputRef}
              style={baseInputStyles}
              value={internalValue}
              onChangeText={handleChange}
              placeholderTextColor={colors.mutedForeground}
              editable={isEditable}
              keyboardType={getKeyboardType()}
              placeholder={getPlaceholder()}
              maxLength={getMaxLength()}
              secureTextEntry={getSecureTextEntry()}
              onFocus={handleInputFocus}
              onBlur={handleBlur}
              accessible={true}
              accessibilityLabel={props.accessibilityLabel || getPlaceholder()}
              accessibilityHint={props.accessibilityHint}
              accessibilityValue={{ text: String(internalValue || '') }}
            />

            {/* Suffix */}
            {suffix && (
              <View style={styles.suffixContainer}>
                <Text style={[styles.suffixText, { color: colors.mutedForeground }]}>{suffix}</Text>
              </View>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <View style={styles.iconContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    );
  },
);

Input.displayName = "Input";

const styles = StyleSheet.create({
  iconContainer: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  suffixContainer: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  suffixText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export { Input };
