import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
}

export function MultiSelect({
  options,
  selectedValues,
  onValuesChange,
  placeholder = "Selecione...",
  disabled = false,
  searchable = true,
  error,
  label,
  required = false,
}: MultiSelectProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onValuesChange(selectedValues.filter((v) => v !== value));
    } else {
      onValuesChange([...selectedValues, value]);
    }
  };

  const removeSelected = (value: string) => {
    onValuesChange(selectedValues.filter((v) => v !== value));
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label} {required && <Text style={{ color: colors.destructive }}>*</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.destructive : colors.border,
          },
          disabled && styles.disabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.triggerText,
            { color: selectedValues.length > 0 ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {selectedValues.length > 0
            ? `${selectedValues.length} selecionado(s)`
            : placeholder}
        </Text>
      </TouchableOpacity>

      {/* Selected Items Chips */}
      {selectedValues.length > 0 && (
        <View style={styles.selectedContainer}>
          {selectedOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, { backgroundColor: colors.primary }]}
              onPress={() => !disabled && removeSelected(option.value)}
              disabled={disabled}
            >
              <Text style={[styles.chipText, { color: colors.primaryForeground }]}>
                {option.label}
              </Text>
              {!disabled && (
                <Text style={[styles.chipClose, { color: colors.primaryForeground }]}>×</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Selecionar Itens
              </Text>
              <Button variant="ghost" onPress={() => setModalVisible(false)}>
                <Text>Fechar</Text>
              </Button>
            </View>

            {searchable && (
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Buscar..."
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            )}

            <ScrollView style={styles.optionsList}>
              {filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      isSelected && { backgroundColor: colors.accent },
                    ]}
                    onPress={() => toggleOption(option.value)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: colors.border,
                          backgroundColor: isSelected ? colors.primary : "transparent",
                        },
                      ]}
                    >
                      {isSelected && (
                        <Text style={{ color: colors.primaryForeground, fontSize: 14 }}>✓</Text>
                      )}
                    </View>
                    <Text style={[styles.optionText, { color: colors.foreground }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                variant="outline"
                onPress={() => onValuesChange([])}
                style={{ flex: 1 }}
              >
                <Text>Limpar Tudo</Text>
              </Button>
              <Button onPress={() => setModalVisible(false)} style={{ flex: 1 }}>
                <Text>Confirmar ({selectedValues.length})</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  trigger: {
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  triggerText: {
    fontSize: fontSize.base,
  },
  disabled: {
    opacity: 0.5,
  },
  selectedContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  chipText: {
    fontSize: fontSize.sm,
  },
  chipClose: {
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: "80%",
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  searchInput: {
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: borderRadius.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: fontSize.base,
    flex: 1,
  },
  modalFooter: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
});
