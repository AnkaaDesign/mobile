import { ViewStyle } from "react-native";
import { Combobox } from "@/components/ui/combobox";

interface TaskSelectorProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
  required?: boolean;
  style?: ViewStyle;
}

export function TaskSelector({
  value,
  onValueChange,
  placeholder = "Selecione uma tarefa",
  disabled = false,
  label = "Tarefa",
  error,
  required = false,
  style,
}: TaskSelectorProps) {
  // TODO: Implement actual task options when needed
  const taskOptions: { value: string; label: string }[] = [];

  return (
    <Combobox
      value={value || ""}
      onValueChange={onValueChange}
      options={taskOptions}
      placeholder={placeholder}
      label={required ? `${label} *` : label}
      error={error}
      disabled={disabled}
      searchable={true}
      clearable={!required}
      emptyText="Nenhuma tarefa encontrada"
    />
  );
}
