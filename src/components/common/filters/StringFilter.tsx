import { View, StyleSheet } from 'react-native';
import { TextInput } from '@/components/ui/text-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { IconX } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/constants/design-system';

export type StringFilterMode = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'notContains' | 'notEquals';

export interface StringFilterValue {
  value: string;
  mode?: StringFilterMode;
}

export interface StringFilterProps {
  /** Current filter value (string or object with mode) */
  value?: string | StringFilterValue;
  /** Callback when value changes */
  onChange: (value: string | StringFilterValue | undefined) => void;
  /** Label for the input */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show mode selector (contains, equals, etc.) */
  showModeSelector?: boolean;
  /** Default mode when using mode selector */
  defaultMode?: StringFilterMode;
  /** Whether to show clear button */
  showClearButton?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

const MODE_LABELS: Record<StringFilterMode, string> = {
  contains: 'Contém',
  equals: 'Igual a',
  startsWith: 'Começa com',
  endsWith: 'Termina com',
  notContains: 'Não contém',
  notEquals: 'Diferente de',
};

/**
 * StringFilter Component
 *
 * A text input filter with optional operator mode selection.
 * Supports simple string value or object with {value, mode}.
 *
 * @example
 * ```tsx
 * // Simple string value
 * <StringFilter
 *   label="Nome"
 *   value={filters.name}
 *   onChange={(v) => setFilters({...filters, name: v})}
 *   placeholder="Digite o nome..."
 * />
 *
 * // With mode selector
 * <StringFilter
 *   label="Email"
 *   value={filters.email}
 *   onChange={(v) => setFilters({...filters, email: v})}
 *   showModeSelector={true}
 *   defaultMode="contains"
 * />
 * ```
 */
export function StringFilter({
  value,
  onChange,
  label,
  placeholder = 'Digite...',
  showModeSelector = false,
  defaultMode = 'contains',
  showClearButton = true,
  disabled = false,
}: StringFilterProps) {
  const { colors } = useTheme();

  // Parse value to get string and mode
  const currentValue = typeof value === 'string' ? value : value?.value || '';
  const currentMode = typeof value === 'object' && value?.mode ? value.mode : defaultMode;

  const handleTextChange = (newText: string) => {
    if (newText === '') {
      onChange(undefined);
      return;
    }

    if (showModeSelector) {
      onChange({ value: newText, mode: currentMode });
    } else {
      onChange(newText);
    }
  };

  const handleModeChange = (newMode: StringFilterMode) => {
    if (currentValue) {
      onChange({ value: currentValue, mode: newMode });
    }
  };

  const handleClear = () => {
    onChange(undefined);
  };

  const hasValue = currentValue !== '';

  const styles = StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    inputRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
    },
    inputContainer: {
      flex: 1,
      position: 'relative',
    },
    input: {
      paddingRight: showClearButton && hasValue ? 40 : spacing.md,
    },
    clearButton: {
      position: 'absolute',
      right: spacing.sm,
      top: '50%',
      transform: [{ translateY: -12 }],
      padding: 4,
    },
    modeSelector: {
      width: 140,
    },
  });

  return (
    <View style={styles.container}>
      {label && <Label>{label}</Label>}

      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <TextInput
            value={currentValue}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            editable={!disabled}
            inputStyle={styles.input}
          />
          {showClearButton && hasValue && !disabled && (
            <Button
              variant="ghost"
              size="sm"
              onPress={handleClear}
              style={styles.clearButton}
            >
              <IconX size={16} color={colors.mutedForeground} />
            </Button>
          )}
        </View>

        {showModeSelector && (
          <Combobox
            value={currentMode}
            onValueChange={(v) => handleModeChange(v as StringFilterMode)}
            disabled={disabled}
            options={(Object.keys(MODE_LABELS) as StringFilterMode[]).map((mode) => ({
              value: mode,
              label: MODE_LABELS[mode]
            }))}
            placeholder="Modo"
            searchable={false}
            style={styles.modeSelector}
          />
        )}
      </View>
    </View>
  );
}
