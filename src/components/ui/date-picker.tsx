import React, { useState } from "react";
import { Modal, Platform, TouchableOpacity, View , StyleSheet} from "react-native";
import { IconCalendar } from "@tabler/icons-react-native";
import { Text } from "@/components/ui/text";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useTheme } from "@/lib/theme";
import { borderRadius, spacing } from "@/constants/design-system";
import type { DatePickerProps } from "@/types/components/form-props";

/**
 * A unified Date/Time/DateTime picker for both iOS and Android.
 * - iOS uses a custom modal to allow "Limpar", "Hoje", and "17:30" buttons.
 * - Android uses the default native picker (which doesn't allow custom buttons).
 */
export function DatePicker({ value, onChange, label, type = "date", style, placeholder, disabled }: DatePickerProps) {
  const { colors, isDark } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);

  const isDateOnly = type === "date";
  const isTimeOnly = type === "time";
  const isDateTime = type === "datetime";

  // Displayed text in the main "input" row
  let displayValue = placeholder || (isDateOnly ? "dd/mm/yyyy" : "dd/mm/yyyy hh:mm");
  if (value instanceof Date) {
    if (isDateOnly) {
      displayValue = value.toLocaleDateString("pt-BR");
    } else if (isTimeOnly) {
      displayValue = value.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (isDateTime) {
      displayValue = `${value.toLocaleDateString("pt-BR")} ${value.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
  }

  /** Opens the appropriate picker(s) depending on `type`. */
  const handleOpenPicker = () => {
    setTempDate(value || new Date());
    if (Platform.OS === "ios") {
      // iOS: show a custom modal
      if (isTimeOnly) {
        setShowTimePicker(true);
      } else {
        setShowDatePicker(true);
      }
    } else {
      // Android: use the native date/time pickers
      if (isDateOnly || isDateTime) {
        setShowDatePicker(true);
      } else if (isTimeOnly) {
        setShowTimePicker(true);
      }
    }
  };

  /** Clears the date/time in the form */
  const handleClear = () => {
    onChange?.(undefined);
    setTempDate(undefined);
  };

  /** Sets tempDate to the current date/time */
  const handleSetToday = () => {
    setTempDate(new Date());
  };

  /** Specifically sets tempDate to 17:30 on the same day */
  const handleSetHour1730 = () => {
    const newDate = tempDate ? new Date(tempDate) : new Date();
    newDate.setHours(17, 30, 0, 0);
    setTempDate(newDate);
  };

  /**
   * Handles the "date" portion of picking (on Android),
   * or the first step in "datetime" on iOS/Android.
   */
  const onDateSelected = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "set" && selectedDate) {
      setTempDate(selectedDate);
      // On Android, if "datetime", show time next
      if (Platform.OS === "android") {
        if (isDateOnly) {
          onChange?.(selectedDate);
          setShowDatePicker(false);
        } else if (isDateTime) {
          setShowDatePicker(false);
          setShowTimePicker(true);
        }
      }
    } else {
      // User canceled
      setShowDatePicker(false);
      setTempDate(undefined);
    }
  };

  /**
   * Handles the "time" portion of picking (on Android),
   * or the second step in "datetime" on iOS/Android.
   */
  const onTimeSelected = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (event.type === "set" && selectedTime) {
      const finalDate = tempDate || new Date();
      finalDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setTempDate(finalDate);
      if (Platform.OS === "android") {
        onChange?.(finalDate);
        setShowTimePicker(false);
        setTempDate(undefined);
      }
    } else {
      setShowTimePicker(false);
      setTempDate(undefined);
    }
  };

  const styles = StyleSheet.create({
    container: {
      width: "100%",
    },
    touchable: {
      height: 48,
      borderRadius: borderRadius.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.input,
    },
    displayText: {
      color: value ? colors.foreground : colors.mutedForeground,
    },
    icon: {
      color: colors.mutedForeground,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
    },
    modalContent: {
      backgroundColor: colors.popover,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      width: 350,
      maxWidth: "90%",
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    buttonGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
  });

  return (
    <View style={StyleSheet.flatten([styles.container, style])}>
      {label && <Label>{label}</Label>}

      <TouchableOpacity
        onPress={disabled ? undefined : handleOpenPicker}
        style={StyleSheet.flatten([styles.touchable, disabled && { opacity: 0.5 }])}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
      >
        <Text style={styles.displayText}>{displayValue}</Text>
        <IconCalendar size={20} />
      </TouchableOpacity>

      {/* iOS Date Picker Modal */}
      {Platform.OS === "ios" && showDatePicker && !isTimeOnly && (
        <Modal transparent animationType="fade" visible={showDatePicker}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={tempDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                  if (selectedDate) {
                    setTempDate(selectedDate);
                  }
                }}
              />

              {/* Buttons row */}
              <View style={styles.buttonsRow}>
                {value ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => {
                      handleClear();
                      setShowDatePicker(false);
                    }}
                  >
                    Limpar
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onPress={handleSetToday}>
                    Hoje
                  </Button>
                )}

                <View style={styles.buttonGroup}>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      setTempDate(undefined);
                      setShowDatePicker(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onPress={() => {
                      setShowDatePicker(false);
                      if (isDateTime) {
                        // If we also have a time step, open it next
                        setShowTimePicker(true);
                      } else {
                        // If date-only, finalize
                        if (tempDate) onChange?.(tempDate);
                        setTempDate(undefined);
                      }
                    }}
                  >
                    {isDateTime ? "Próximo" : "Selecionar"}
                  </Button>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* iOS Time Picker Modal */}
      {Platform.OS === "ios" && showTimePicker && (
        <Modal transparent animationType="fade" visible={showTimePicker}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={tempDate || new Date()}
                mode="time"
                display="spinner"
                onChange={(event: DateTimePickerEvent, selectedTime?: Date) => {
                  if (selectedTime) {
                    const finalDate = tempDate || new Date();
                    finalDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
                    setTempDate(finalDate);
                  }
                }}
              />

              {/* Buttons row */}
              <View style={styles.buttonsRow}>
                {value ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => {
                      handleClear();
                      setShowTimePicker(false);
                    }}
                  >
                    Limpar
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onPress={handleSetHour1730}>
                    17:30
                  </Button>
                )}

                <View style={styles.buttonGroup}>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      setTempDate(undefined);
                      setShowTimePicker(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onPress={() => {
                      if (tempDate) onChange?.(tempDate);
                      setShowTimePicker(false);
                      setTempDate(undefined);
                    }}
                  >
                    Selecionar
                  </Button>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android Date Picker */}
      {Platform.OS === "android" && showDatePicker && !isTimeOnly && <DateTimePicker value={tempDate || new Date()} mode="date" display="default" onChange={onDateSelected} />}

      {/* Android Time Picker */}
      {Platform.OS === "android" && showTimePicker && <DateTimePicker value={tempDate || new Date()} mode="time" display="default" onChange={onTimeSelected} />}
    </View>
  );
}

// Export DatePickerInput as an alias for compatibility
export const DatePickerInput = DatePicker;
