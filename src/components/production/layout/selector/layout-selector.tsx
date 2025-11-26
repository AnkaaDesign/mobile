import { ViewStyle } from "react-native";
import { Combobox } from "@/components/ui/combobox";

interface LayoutSelectorProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
  required?: boolean;
  style?: ViewStyle;
}

export function LayoutSelector({
  value,
  onValueChange,
  placeholder = "Selecione um layout",
  disabled = false,
  label = "Layout",
  error,
  required = false,
  style,
}: LayoutSelectorProps) {
  // TODO: Implement actual layout options when needed
  const layoutOptions: { value: string; label: string }[] = [];

  return (
    <Combobox
      value={value || ""}
      onValueChange={onValueChange}
      options={layoutOptions}
      placeholder={placeholder}
      label={required ? `${label} *` : label}
      error={error}
      disabled={disabled}
      searchable={true}
      clearable={!required}
      emptyText="Nenhum layout encontrado"
    />
  );
}
