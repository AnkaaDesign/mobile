import React from "react";
import { View, ViewStyle } from "react-native";
import { SCHEDULE_FREQUENCY, SCHEDULE_FREQUENCY_LABELS } from '../../../../constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { IconCalendar, IconCalendarEvent, IconCalendarWeek, IconCalendarMonth } from "@tabler/icons-react-native";

interface FrequencySelectorProps {
  value?: SCHEDULE_FREQUENCY;
  onValueChange?: (value: SCHEDULE_FREQUENCY) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function FrequencySelector({
  value,
  onValueChange,
  disabled = false,
  style,
}: FrequencySelectorProps) {
  const { colors } = useTheme();

  const getFrequencyIcon = (frequency: SCHEDULE_FREQUENCY) => {
    const iconProps = { size: 20, color: colors.mutedForeground };

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
  };

  const getFrequencyColor = (frequency: SCHEDULE_FREQUENCY) => {
    switch (frequency) {
      case SCHEDULE_FREQUENCY.DAILY:
        return "default";
      case SCHEDULE_FREQUENCY.WEEKLY:
        return "secondary";
      case SCHEDULE_FREQUENCY.MONTHLY:
        return "primary";
      case SCHEDULE_FREQUENCY.CUSTOM:
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <View style={style}>
      <Select
        value={value || ""}
        onValueChange={(val) => onValueChange?.(val as SCHEDULE_FREQUENCY)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione a frequ�ncia">
            {value ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {getFrequencyIcon(value)}
                <ThemedText weight="medium">
                  {SCHEDULE_FREQUENCY_LABELS[value]}
                </ThemedText>
              </View>
            ) : (
              <ThemedText variant="muted">Selecione a frequ�ncia</ThemedText>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.values(SCHEDULE_FREQUENCY).map((frequency) => (
            <SelectItem key={frequency} value={frequency}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {getFrequencyIcon(frequency)}
                <View style={{ flex: 1 }}>
                  <ThemedText weight="medium">
                    {SCHEDULE_FREQUENCY_LABELS[frequency]}
                  </ThemedText>
                  {frequency === SCHEDULE_FREQUENCY.DAILY && (
                    <ThemedText size="xs" variant="muted">
                      Pedido criado todos os dias
                    </ThemedText>
                  )}
                  {frequency === SCHEDULE_FREQUENCY.WEEKLY && (
                    <ThemedText size="xs" variant="muted">
                      Pedido criado em dias espec�ficos da semana
                    </ThemedText>
                  )}
                  {frequency === SCHEDULE_FREQUENCY.MONTHLY && (
                    <ThemedText size="xs" variant="muted">
                      Pedido criado em dias espec�ficos do m�s
                    </ThemedText>
                  )}
                  {frequency === SCHEDULE_FREQUENCY.CUSTOM && (
                    <ThemedText size="xs" variant="muted">
                      Express�o cron personalizada
                    </ThemedText>
                  )}
                </View>
                <Badge variant={getFrequencyColor(frequency) as any}>
                  <ThemedText size="xs">{frequency}</ThemedText>
                </Badge>
              </View>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </View>
  );
}