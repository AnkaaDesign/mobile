import { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { IconPlus, IconX, IconPhone } from "@tabler/icons-react-native";
import { ThemedText, Input, Button } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { formatBrazilianPhone, cleanPhone } from '@/utils';

interface PhoneManagerProps {
  phones: string[];
  onChange: (phones: string[]) => void;
}

export function PhoneManager({ phones, onChange }: PhoneManagerProps) {
  const { colors } = useTheme();
  const [newPhone, setNewPhone] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Focus input only when isAdding becomes true
  useEffect(() => {
    if (isAdding) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isAdding]);

  const handleAddPhone = () => {
    if (!newPhone.trim()) return;

    const cleanedPhone = cleanPhone(newPhone);
    if (cleanedPhone.length < 10) {
      // Minimum valid phone length
      return;
    }

    if (!phones.includes(cleanedPhone)) {
      onChange([...phones, cleanedPhone]);
    }

    setNewPhone("");
    setIsAdding(false);
  };

  const handleRemovePhone = (index: number) => {
    const updatedPhones = phones.filter((_, i) => i !== index);
    onChange(updatedPhones);
  };

  return (
    <View style={styles.container}>
      {/* Phone List */}
      {phones.length > 0 && (
        <View style={styles.phoneList}>
          {phones.map((phone, index) => (
            <View key={index} style={[styles.phoneItem, { backgroundColor: colors.muted }]}>
              <View style={styles.phoneInfo}>
                <IconPhone size={16} color={colors.mutedForeground} />
                <ThemedText style={styles.phoneText}>{formatBrazilianPhone(phone)}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => handleRemovePhone(index)} style={styles.removeButton}>
                <IconX size={16} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add Phone Input */}
      {isAdding ? (
        <View style={styles.addPhoneContainer}>
          <Input
            ref={inputRef}
            value={newPhone ? formatBrazilianPhone(newPhone) : ""}
            onChangeText={(text) => setNewPhone(cleanPhone(text))}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            maxLength={15}
            style={styles.phoneInput}
          />
          <View style={styles.addPhoneActions}>
            <Button variant="outline" size="sm" onPress={() => setIsAdding(false)} style={styles.addPhoneButton}>
              <ThemedText>Cancelar</ThemedText>
            </Button>
            <Button variant="default" size="sm" onPress={handleAddPhone} style={styles.addPhoneButton}>
              <ThemedText style={{ color: "white" }}>Adicionar</ThemedText>
            </Button>
          </View>
        </View>
      ) : (
        <Button variant="outline" onPress={() => setIsAdding(true)} style={styles.addButton}>
          <IconPlus size={16} />
          <ThemedText>Adicionar Telefone</ThemedText>
        </Button>
      )}

      {phones.length === 0 && !isAdding && (
        <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhum telefone cadastrado</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  phoneList: {
    gap: 8,
  },
  phoneItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
  },
  phoneInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  phoneText: {
    fontSize: 14,
  },
  removeButton: {
    padding: 4,
  },
  addPhoneContainer: {
    gap: 8,
  },
  phoneInput: {
    flex: 1,
  },
  addPhoneActions: {
    flexDirection: "row",
    gap: 8,
  },
  addPhoneButton: {
    flex: 1,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 8,
  },
});
