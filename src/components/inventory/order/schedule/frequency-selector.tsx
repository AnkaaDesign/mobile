import { useCallback, useMemo } from "react";
import { View, ViewStyle, Text } from "react-native";
import { SCHEDULE_FREQUENCY, SCHEDULE_FREQUENCY_LABELS } from '../../../../constants';
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { IconCalendar, IconCalendarEvent, IconCalendarWeek, IconCalendarMonth } from "@tabler/icons-react-native";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface FrequencySelectorProps {
  value?: SCHEDULE_FREQUENCY;
  onValueChange?: (value: SCHEDULE_FREQUENCY | undefined) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  style?: ViewStyle;
}

interface FrequencyOption {
  value: SCHEDULE_FREQUENCY;
  label: string;
  description: string;
}

export function FrequencySelector({
  value,
  onValueChange,
  disabled = false,
  label = "Frequência",
  placeholder = "Selecione a frequência",
  required = false,
  error,
  style,
}: FrequencySelectorProps) {
  const { colors } = useTheme();

  const getFrequencyIcon = useCallback((frequency: SCHEDULE_FREQUENCY) => {
    const iconProps = { size: 20, color: colors.foreground };

    switch (frequency) {
      case SCHEDULE_FREQUENCY.DAILY:
        return <IconCalendar {...iconProps} />;
      case SCHEDULE_FREQUENCY.WEEKLY:
        return <IconCalendarWeek {...iconProps} />;
      case SCHEDULE_FREQUENCY.MONTHLY:
        return <IconCalendarMonth {...iconProps} />;
      case SCHEDULE_FREQUENCY.CUSTOM:
        return <IconCalendarEvent {...iconProps} />;
      default:
        return null;
    }
  }, [colors.foreground]);

  const getFrequencyDescription = (frequency: SCHEDULE_FREQUENCY) => {
    switch (frequency) {
      case SCHEDULE_FREQUENCY.DAILY:
        return "Pedido criado todos os dias";
      case SCHEDULE_FREQUENCY.WEEKLY:
        return "Pedido criado em dias específicos da semana";
      case SCHEDULE_FREQUENCY.MONTHLY:
        return "Pedido criado em dias específicos do mês";
      case SCHEDULE_FREQUENCY.CUSTOM:
        return "Expressão cron personalizada";
      default:
        return "";
    }
  };

  const frequencyOptions = useMemo<FrequencyOption[]>(() =>
    Object.values(SCHEDULE_FREQUENCY).map((frequency) => ({
      value: frequency,
      label: SCHEDULE_FREQUENCY_LABELS[frequency],
      description: getFrequencyDescription(frequency),
    })),
    []
  );

  const renderOption = useCallback(
    (option: FrequencyOption, isSelected: boolean) => {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 }}>
          {getFrequencyIcon(option.value)}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: fontSize.base,
                fontWeight: isSelected ? fontWeight.semibold : fontWeight.medium,
                color: colors.foreground,
              }}
            >
              {option.label}
            </Text>
            <Text
              style={{
                fontSize: fontSize.xs,
                color: colors.mutedForeground,
                marginTop: 2,
              }}
            >
              {option.description}
            </Text>
          </View>
          <Badge variant="outline">
            <Text style={{ fontSize: fontSize.xs }}>{option.value}</Text>
          </Badge>
        </View>
      );
    },
    [colors, getFrequencyIcon]
  );

  return (
    <View style={style}>
      <Combobox<FrequencyOption>
        value={value || ""}
        onValueChange={(val) => onValueChange?.(val as SCHEDULE_FREQUENCY | undefined)}
        options={frequencyOptions}
        placeholder={placeholder}
        label={required ? `${label} *` : label}
        error={error}
        disabled={disabled}
        searchable={false}
        clearable={!required}
        renderOption={renderOption}
        getOptionValue={(option) => option.value}
        getOptionLabel={(option) => option.label}
        preferFullScreen={true}
      />
    </View>
  );
}
