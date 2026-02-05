import type { TextInputProps, TextStyle, ViewStyle } from "react-native";
import type React from "react";

// Base Option Types
export interface ComboboxOption {
  label: string;
  value: string;
  [key: string]: any;
}

export interface MultiComboboxOption {
  label: string;
  value: string;
  [key: string]: any;
}

export interface MultiselectOption {
  label: string;
  value: string | number;
}

// Combobox Component Props
export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string | undefined) => void;
  onCreate?: (newLabel: string) => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  placeholder?: string;
  label?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  onSearchChange?: (text: string) => void;
  renderOption?: (option: ComboboxOption, isSelected: boolean, onPress: () => void) => React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
  emptyText?: string;
  createNewText?: (searchText: string) => string;
}

// MultiCombobox Component Props
export interface MultiComboboxProps {
  options: MultiComboboxOption[];
  selectedValues?: string[];
  onValueChange: (values: string[]) => void;
  onCreate?: (newLabel: string) => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  placeholder?: string;
  label?: string;
  selectedText?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  onSearchChange?: (text: string) => void;
  renderOption?: (option: MultiComboboxOption, isSelected: boolean, onPress: () => void) => React.ReactNode;
  renderBadge?: (option: MultiComboboxOption, onRemove: () => void) => React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
  emptyText?: string;
  createNewText?: (searchText: string) => string;
  maxSelections?: number;
  showBadges?: boolean;
  badgeStyle?: "badge" | "chip";
}

// Multiselect Component Props
export interface MultiselectProps {
  options: MultiselectOption[];
  value?: (string | number)[];
  onValueChange: (value: (string | number)[]) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  renderOption?: (option: MultiselectOption, isSelected: boolean) => React.ReactNode;
  maxSelections?: number;
}

// Date/Time Picker Props
export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  label?: string;
  type?: "date" | "time" | "datetime";
  /** Alias for type - for compatibility */
  mode?: "date" | "time" | "datetime";
  style?: ViewStyle;
  placeholder?: string;
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  disabledDates?: Date[]; // Array of dates that should be disabled
  disablePastDates?: boolean; // Disable all dates before today
  disableFutureDates?: boolean; // Disable all dates after today
  disableWeekends?: boolean; // Disable Saturdays and Sundays
  onlyBusinessDays?: boolean; // Only allow weekdays (Mon-Fri)
  error?: string; // Error message to display
}

export interface TimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  label?: string;
  labelColor?: string;
  labelSize?: number;
  fontSize?: number;
  selectText?: string;
  style?: ViewStyle;
}

// Currency Input Props
export interface CurrencyInputProps extends Omit<TextInputProps, "onChange" | "value" | "onChangeText" | "keyboardType"> {
  value?: number;
  onChange?: (value: number | undefined) => void;
  onBlur?: (e: any) => void;
  error?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

// Themed Text Input Props
export interface ThemedTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  withIcon?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  inputContainerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftIconContainerStyle?: ViewStyle;
  rightIconContainerStyle?: ViewStyle;
}
