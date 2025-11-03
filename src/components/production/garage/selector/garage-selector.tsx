import { ViewStyle } from "react-native";
import { Combobox } from "@/components/ui/combobox";

interface GarageSelectorProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
  required?: boolean;
  style?: ViewStyle;
}

export function GarageSelector({
  value,
  onValueChange,
  placeholder = "Selecione uma garagem",
  disabled = false,
  label = "Garagem",
  error,
  required = false,
  style,
}: GarageSelectorProps) {
  // TODO: Implement actual garage options when needed
  const garageOptions: { value: string; label: string }[] = [];

  return (
    <Combobox
      value={value || ""}
      onValueChange={onValueChange}
      options={garageOptions}
      placeholder={placeholder}
      label={required ? `${label} *` : label}
      error={error}
      disabled={disabled}
      searchable={true}
      clearable={!required}
      emptyText="Nenhuma garagem encontrada"
      preferFullScreen={true}
    />
  );
}
