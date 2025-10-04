import React, { useState } from "react";
import { Modal, Platform, StyleSheet,
  TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "@/lib/theme";
import { borderRadius, spacing } from "@/constants/design-system";

interface TimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  label?: string;
  labelColor?: string;
  labelSize?: number;
  fontSize?: number;
  selectText?: string;
  style?: ViewStyle;
}

// TimePicker.tsx
export function TimePicker({ value, onChange, label, labelColor, labelSize = 64, fontSize = 12, selectText = "Selecionar", style }: TimePickerProps) {
  const { colors, isDark } = useTheme();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);

  let displayValue = "--:--";
  if (value instanceof Date) {
    displayValue = value.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const handleOpenPicker = () => {
    setTempDate(value || new Date());
    setShowTimePicker(true);
  };

  const onTimeSelected = (event: any, selectedTime?: Date) => {
    if (event.type === "set" && selectedTime) {
      const finalDate = tempDate || new Date();
      finalDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      if (Platform.OS === "android") {
        onChange?.(finalDate);
        setShowTimePicker(false);
        setTempDate(undefined);
      } else {
        setTempDate(finalDate);
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
      flex: 1,
      height: 48,
      justifyContent: "center",
      borderRadius: borderRadius.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 48,
    },
    displayText: {
      textAlign: "center" as const,
      width: labelSize,
      color: labelColor || colors.foreground,
      fontSize: fontSize,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
    },
    modalContent: {
      backgroundColor: colors.secondary,
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
  });

  return (
    <View style={StyleSheet.flatten([styles.container, style])}>
      {label && <Label>{label}</Label>}

      <TouchableOpacity onPress={handleOpenPicker} style={styles.touchable} activeOpacity={0.7}>
        <Text style={styles.displayText}>{displayValue}</Text>
      </TouchableOpacity>

      {/* iOS Time Picker */}
      {Platform.OS === "ios" && showTimePicker && (
        <Modal transparent animationType="fade" visible={showTimePicker}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={tempDate || new Date()}
                mode="time"
                display="spinner"
                onChange={(event, selectedTime) => {
                  if (selectedTime) {
                    const finalDate = tempDate || new Date();
                    finalDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
                    setTempDate(finalDate);
                  }
                }}
              />

              <View style={styles.buttonsRow}>
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
                  {selectText}
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android Time Picker */}
      {Platform.OS === "android" && showTimePicker && <DateTimePicker value={tempDate || new Date()} mode="time" display="default" onChange={onTimeSelected} />}
    </View>
  );
}
