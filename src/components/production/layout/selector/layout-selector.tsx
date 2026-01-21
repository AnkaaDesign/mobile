import { ViewStyle } from "react-native";
import { Combobox } from "@/components/ui/combobox";
import { useLayoutList } from "@/hooks/useLayout";
import type { Layout } from "@/types";

interface LayoutSelectorProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
  required?: boolean;
  style?: ViewStyle;
  side?: "left" | "right" | "back";
}

export function LayoutSelector({
  value,
  onValueChange,
  placeholder = "Selecione um layout existente",
  disabled = false,
  label = "Layout Existente",
  error,
  required = false,
  style,
  side,
}: LayoutSelectorProps) {
  // Fetch available layouts with usage counts
  const { data: layouts, isLoading } = useLayoutList({
    includeUsage: true,
    includeSections: false,
  });

  // Format layouts for combobox
  const layoutOptions = (layouts || []).map((layout: Layout) => {
    const usageText = layout.usageCount ? ` (usado em ${layout.usageCount} caminhão${layout.usageCount !== 1 ? 'ões' : ''})` : '';
    const sideLabel = side ? ` - ${side === 'left' ? 'Motorista' : side === 'right' ? 'Sapo' : 'Traseira'}` : '';

    return {
      value: layout.id,
      label: `Layout ${sideLabel} - ${(layout.height || 0).toFixed(2)}m altura${usageText}`,
    };
  });

  return (
    <Combobox
      value={value || ""}
      onValueChange={onValueChange}
      options={layoutOptions}
      placeholder={placeholder}
      label={required ? `${label} *` : label}
      error={error}
      disabled={disabled || isLoading}
      searchable={true}
      clearable={!required}
      emptyText={isLoading ? "Carregando layouts..." : "Nenhum layout encontrado"}
    />
  );
}
