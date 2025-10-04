import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable, ViewStyle } from "react-native";
import { SCHEDULE_FREQUENCY, WEEK_DAY, WEEK_DAY_LABELS } from '../../../../constants';
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { IconCalendar, IconClock, IconCode } from "@tabler/icons-react-native";

interface ScheduleConfigurationFormProps {
  frequency: SCHEDULE_FREQUENCY;
  value?: any;
  onValueChange?: (value: any) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function ScheduleConfigurationForm({
  frequency,
  value,
  onValueChange,
  disabled = false,
  style,
}: ScheduleConfigurationFormProps) {
  const { colors, spacing } = useTheme();
  const [config, setConfig] = useState(value || {});

  useEffect(() => {
    setConfig(value || {});
  }, [value]);

  const handleWeekdayToggle = (weekday: string) => {
    if (disabled) return;

    const currentWeekdays = config.weekdays || [];
    const newWeekdays = currentWeekdays.includes(weekday)
      ? currentWeekdays.filter((w: string) => w !== weekday)
      : [...currentWeekdays, weekday];

    const newConfig = { ...config, weekdays: newWeekdays };
    setConfig(newConfig);
    onValueChange?.(newConfig);
  };

  const handleMonthDayChange = (text: string) => {
    if (disabled) return;

    const days = text
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d && !isNaN(Number(d)))
      .map(Number)
      .filter((d) => d >= 1 && d <= 31);

    const newConfig = { ...config, monthDays: days };
    setConfig(newConfig);
    onValueChange?.(newConfig);
  };

  const handleTimeChange = (text: string) => {
    if (disabled) return;

    const newConfig = { ...config, time: text };
    setConfig(newConfig);
    onValueChange?.(newConfig);
  };

  const handleCronChange = (text: string) => {
    if (disabled) return;

    const newConfig = { ...config, cron: text };
    setConfig(newConfig);
    onValueChange?.(newConfig);
  };

  if (frequency === SCHEDULE_FREQUENCY.DAILY) {
    return (
      <View style={style}>
        <Card style={{ padding: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
            <IconClock size={20} color={colors.primary} />
            <ThemedText weight="semibold">Hor�rio do Pedido</ThemedText>
          </View>
          <Input
            placeholder="HH:MM (ex: 08:00)"
            value={config.time || ""}
            onChangeText={handleTimeChange}
            editable={!disabled}
            keyboardType="numbers-and-punctuation"
          />
          <ThemedText size="xs" variant="muted" style={{ marginTop: spacing.xs }}>
            Hor�rio em que o pedido ser� criado diariamente
          </ThemedText>
        </Card>
      </View>
    );
  }

  if (frequency === SCHEDULE_FREQUENCY.WEEKLY) {
    return (
      <View style={style}>
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
            <IconCalendar size={20} color={colors.primary} />
            <ThemedText weight="semibold">Dias da Semana</ThemedText>
          </View>
          <View style={{ gap: spacing.sm }}>
            {Object.values(WEEK_DAY).map((weekday) => (
              <Pressable
                key={weekday}
                onPress={() => handleWeekdayToggle(weekday)}
                disabled={disabled}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    padding: spacing.sm,
                    borderRadius: 8,
                    backgroundColor: (config.weekdays || []).includes(weekday)
                      ? colors.primary + "10"
                      : "transparent",
                  }}
                >
                  <Checkbox
                    checked={(config.weekdays || []).includes(weekday)}
                    onCheckedChange={() => handleWeekdayToggle(weekday)}
                    disabled={disabled}
                  />
                  <ThemedText weight="medium">{WEEK_DAY_LABELS[weekday as keyof typeof WEEK_DAY_LABELS]}</ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={{ padding: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
            <IconClock size={20} color={colors.primary} />
            <ThemedText weight="semibold">Hor�rio do Pedido</ThemedText>
          </View>
          <Input
            placeholder="HH:MM (ex: 08:00)"
            value={config.time || ""}
            onChangeText={handleTimeChange}
            editable={!disabled}
            keyboardType="numbers-and-punctuation"
          />
          <ThemedText size="xs" variant="muted" style={{ marginTop: spacing.xs }}>
            Hor�rio em que o pedido ser� criado nos dias selecionados
          </ThemedText>
        </Card>
      </View>
    );
  }

  if (frequency === SCHEDULE_FREQUENCY.MONTHLY) {
    return (
      <View style={style}>
        <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
            <IconCalendar size={20} color={colors.primary} />
            <ThemedText weight="semibold">Dias do M�s</ThemedText>
          </View>
          <Input
            placeholder="1, 15, 30 (separados por v�rgula)"
            value={(config.monthDays || []).join(", ")}
            onChangeText={handleMonthDayChange}
            editable={!disabled}
            keyboardType="numbers-and-punctuation"
          />
          <ThemedText size="xs" variant="muted" style={{ marginTop: spacing.xs }}>
            Digite os dias do m�s separados por v�rgula (1-31)
          </ThemedText>
        </Card>

        <Card style={{ padding: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
            <IconClock size={20} color={colors.primary} />
            <ThemedText weight="semibold">Hor�rio do Pedido</ThemedText>
          </View>
          <Input
            placeholder="HH:MM (ex: 08:00)"
            value={config.time || ""}
            onChangeText={handleTimeChange}
            editable={!disabled}
            keyboardType="numbers-and-punctuation"
          />
          <ThemedText size="xs" variant="muted" style={{ marginTop: spacing.xs }}>
            Hor�rio em que o pedido ser� criado nos dias especificados
          </ThemedText>
        </Card>
      </View>
    );
  }

  if (frequency === SCHEDULE_FREQUENCY.CUSTOM) {
    return (
      <View style={style}>
        <Card style={{ padding: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
            <IconCode size={20} color={colors.primary} />
            <ThemedText weight="semibold">Express�o Cron</ThemedText>
          </View>
          <Input
            placeholder="0 8 * * 1-5"
            value={config.cron || ""}
            onChangeText={handleCronChange}
            editable={!disabled}
          />
          <ThemedText size="xs" variant="muted" style={{ marginTop: spacing.xs }}>
            Formato: minuto hora dia m�s dia-da-semana
          </ThemedText>

          <View style={{ marginTop: spacing.md }}>
            <ThemedText size="xs" weight="semibold" variant="muted">Exemplos:</ThemedText>
            <View style={{ marginTop: spacing.xs, gap: spacing.xs }}>
              <View style={{ flexDirection: "row", gap: spacing.xs }}>
                <Badge variant="secondary">
                  <ThemedText size="xs">0 8 * * *</ThemedText>
                </Badge>
                <ThemedText size="xs" variant="muted">Todo dia �s 8:00</ThemedText>
              </View>
              <View style={{ flexDirection: "row", gap: spacing.xs }}>
                <Badge variant="secondary">
                  <ThemedText size="xs">0 8 * * 1-5</ThemedText>
                </Badge>
                <ThemedText size="xs" variant="muted">Seg-Sex �s 8:00</ThemedText>
              </View>
              <View style={{ flexDirection: "row", gap: spacing.xs }}>
                <Badge variant="secondary">
                  <ThemedText size="xs">0 8 1,15 * *</ThemedText>
                </Badge>
                <ThemedText size="xs" variant="muted">Dias 1 e 15 �s 8:00</ThemedText>
              </View>
            </View>
          </View>
        </Card>
      </View>
    );
  }

  return null;
}