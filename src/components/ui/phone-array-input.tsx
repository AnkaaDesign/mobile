import { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { IconPlus, IconTrash, IconPhone } from "@tabler/icons-react-native";
import { ThemedText } from "./themed-text";
import { Input } from "./input";
import { Button } from "./button";
import { useTheme } from "@/lib/theme";
import { formatBrazilianPhone, cleanPhone } from "@/utils";

interface PhoneArrayInputProps {
  phones: string[];
  onChange: (phones: string[]) => void;
  disabled?: boolean;
  maxPhones?: number;
  label?: string;
  placeholder?: string;
}

export function PhoneArrayInput({
  phones = [],
  onChange,
  disabled = false,
  maxPhones = 5,
  label = "Telefones",
  placeholder = "(00) 00000-0000",
}: PhoneArrayInputProps) {
  const { colors } = useTheme();
  const [newPhone, setNewPhone] = useState("");

  const handleAddPhone = () => {
    const cleanedPhone = cleanPhone(newPhone);
    if (
      cleanedPhone &&
      cleanedPhone.length >= 10 &&
      !phones.includes(cleanedPhone) &&
      phones.length < maxPhones
    ) {
      onChange([...phones, cleanedPhone]);
      setNewPhone("");
    }
  };

  const handleRemovePhone = (index: number) => {
    const updatedPhones = phones.filter((_, i) => i !== index);
    onChange(updatedPhones);
  };

  const canAddMore = phones.length < maxPhones;
  const cleanNewPhone = cleanPhone(newPhone);
  const isDuplicate = phones.includes(cleanNewPhone);
  const isAddDisabled =
    disabled || !cleanNewPhone || cleanNewPhone.length < 10 || isDuplicate || !canAddMore;

  return (
    <View style={styles.container}>
      {/* Label with counter */}
      <View style={styles.labelContainer}>
        <View style={styles.labelLeft}>
          <IconPhone size={16} color={colors.foreground} />
          <ThemedText style={styles.label}>{label}</ThemedText>
          {phones.length > 0 && (
            <ThemedText style={[styles.counter, { color: colors.mutedForeground }]}>
              ({phones.length}/{maxPhones})
            </ThemedText>
          )}
        </View>
        {!canAddMore && (
          <ThemedText style={[styles.limitText, { color: colors.mutedForeground }]}>
            Limite atingido
          </ThemedText>
        )}
      </View>

      <View style={styles.content}>
        {/* Add new phone input */}
        {canAddMore && (
          <View style={styles.addPhoneRow}>
            <Input
              value={newPhone ? formatBrazilianPhone(newPhone) : ""}
              onChangeText={(text: string | number | null) =>
                setNewPhone(cleanPhone(text?.toString() || ""))
              }
              placeholder={placeholder}
              keyboardType="phone-pad"
              maxLength={15}
              editable={!disabled}
              style={styles.phoneInput}
            />
            <TouchableOpacity
              onPress={handleAddPhone}
              disabled={isAddDisabled}
              style={[
                styles.addButton,
                {
                  backgroundColor: isAddDisabled
                    ? colors.muted
                    : colors.border,
                  borderColor: colors.border,
                },
              ]}
            >
              <IconPlus
                size={16}
                color={isAddDisabled ? colors.mutedForeground : colors.foreground}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Show duplicate message */}
        {isDuplicate && newPhone && (
          <ThemedText style={[styles.duplicateText, { color: colors.mutedForeground }]}>
            Este telefone já foi adicionado
          </ThemedText>
        )}

        {/* List existing phones */}
        {phones.length > 0 && (
          <View style={styles.phoneList}>
            <ThemedText style={[styles.listLabel, { color: colors.mutedForeground }]}>
              {label} adicionados:
            </ThemedText>
            {phones.map((phone, index) => {
              const formatted = formatBrazilianPhone(phone);

              return (
                <View
                  key={`phone-${index}`}
                  style={[styles.phoneItem, { backgroundColor: colors.muted }]}
                >
                  <IconPhone size={16} color={colors.mutedForeground} />
                  <ThemedText style={styles.phoneText}>{formatted}</ThemedText>
                  <TouchableOpacity
                    onPress={() => handleRemovePhone(index)}
                    disabled={disabled}
                    style={styles.removeButton}
                  >
                    <IconTrash
                      size={16}
                      color={disabled ? colors.mutedForeground : colors.destructive}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  labelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  counter: {
    fontSize: 14,
    marginLeft: 8,
  },
  limitText: {
    fontSize: 12,
  },
  content: {
    gap: 12,
  },
  addPhoneRow: {
    flexDirection: "row",
    gap: 8,
  },
  phoneInput: {
    flex: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  duplicateText: {
    fontSize: 14,
  },
  phoneList: {
    gap: 8,
  },
  listLabel: {
    fontSize: 14,
  },
  phoneItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  phoneText: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: 14,
  },
  removeButton: {
    padding: 4,
  },
});
