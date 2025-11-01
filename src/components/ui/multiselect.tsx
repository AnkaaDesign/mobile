import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, Keyboard, Platform, Dimensions, Pressable, StyleSheet } from "react-native";
import { Icon } from "./icon";
import { useTheme } from "@/contexts/theme-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface MultiselectOption {
  label: string;
  value: string | number;
}

interface MultiselectProps {
  options: MultiselectOption[];
  value?: (string | number)[];
  onValueChange: (value: (string | number)[]) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  renderOption?: (option: MultiselectOption, isSelected: boolean) => React.ReactNode;
  maxSelections?: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.6;

export function Multiselect({
  options,
  value = [],
  onValueChange,
  placeholder = "Selecione as opções",
  label,
  searchable = true,
  clearable = true,
  disabled = false,
  error,
  loading = false,
  renderOption,
  maxSelections,
}: MultiselectProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const inputRef = useRef<TextInput>(null);

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  useEffect(() => {
    if (searchText) {
      const filtered = options.filter((option) => option.label.toLowerCase().includes(searchText.toLowerCase()));
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchText, options]);

  const handleToggleOption = (option: MultiselectOption) => {
    const isSelected = value.includes(option.value);

    if (isSelected) {
      onValueChange(value.filter((v) => v !== option.value));
    } else {
      if (maxSelections && value.length >= maxSelections) {
        return;
      }
      onValueChange([...value, option.value]);
    }
  };

  const handleClear = () => {
    onValueChange([]);
  };

  const handleDone = () => {
    setModalVisible(false);
    setSearchText("");
    Keyboard.dismiss();
  };

  const renderItem = ({ item }: { item: MultiselectOption }) => {
    const isSelected = value.includes(item.value);
    const isDisabled = !!(!isSelected && maxSelections && value.length >= maxSelections);

    return (
      <TouchableOpacity
        style={StyleSheet.flatten([
          styles.option,
          {
            backgroundColor: isSelected ? colors.primary + "20" : "transparent",
            borderBottomColor: colors.border,
          },
          isDisabled && styles.optionDisabled,
        ])}
        onPress={() => handleToggleOption(item)}
        disabled={!!loading || !!isDisabled}
      >
        <View
          style={StyleSheet.flatten([
            styles.checkbox,
            {
              borderColor: isSelected ? colors.primary : colors.border,
              backgroundColor: isSelected ? colors.primary : "transparent",
            },
          ])}
        >
          {isSelected && <Icon name="check" size={16} color={colors.card} />}
        </View>
        {renderOption ? renderOption(item, isSelected) : <Text style={StyleSheet.flatten([styles.optionText, { color: colors.foreground }])}>{item.label}</Text>}
      </TouchableOpacity>
    );
  };

  const getDisplayText = () => {
    if (selectedOptions.length === 0) {
      return placeholder;
    }
    if (selectedOptions.length === 1) {
      return "Selecionado 1";
    }
    return `Selecionados ${selectedOptions.length} itens`;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={StyleSheet.flatten([styles.label, { color: colors.foreground }])}>{label}</Text>}

      <TouchableOpacity
        style={StyleSheet.flatten([
          styles.selector,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.destructive : colors.border,
          },
          disabled && styles.disabled,
        ])}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={StyleSheet.flatten([styles.selectorText, { color: selectedOptions.length > 0 ? colors.foreground : colors.mutedForeground }])} numberOfLines={1}>
          {getDisplayText()}
        </Text>

        <View style={styles.iconContainer}>
          {loading ? (
            <Text style={{ color: colors.mutedForeground }}>...</Text>
          ) : (
            <>
              {clearable && selectedOptions.length > 0 && !disabled && (
                <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Icon name="x" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
              <Icon name={modalVisible ? "chevronUp" : "chevronDown"} size={20} color={colors.mutedForeground} />
            </>
          )}
        </View>
      </TouchableOpacity>

      {selectedOptions.length > 0 && (
        <View style={styles.selectedContainer}>
          {selectedOptions.map((option) => (
            <Pressable
              key={String(option.value)}
              style={StyleSheet.flatten([
                styles.selectedBadge,
                {
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                },
              ])}
              onPress={() => handleToggleOption(option)}
            >
              <Text style={StyleSheet.flatten([styles.selectedBadgeText, { color: colors.foreground }])}>{option.label}</Text>
              <Icon name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      )}

      {error && <Text style={StyleSheet.flatten([styles.error, { color: colors.destructive }])}>{error}</Text>}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View
            style={StyleSheet.flatten([
              styles.modalContent,
              {
                backgroundColor: colors.card,
                maxHeight: MAX_MODAL_HEIGHT,
              },
            ])}
          >
            <View style={StyleSheet.flatten([styles.modalHeader, { borderBottomColor: colors.border }])}>
              <Text style={StyleSheet.flatten([styles.modalTitle, { color: colors.foreground }])}>{label || "Selecione as opções"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="x" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={StyleSheet.flatten([styles.searchContainer, { borderBottomColor: colors.border }])}>
                <Icon name="search" size={20} color={colors.mutedForeground} />
                <TextInput
                  ref={inputRef}
                  style={StyleSheet.flatten([styles.searchInput, { color: colors.foreground }])}
                  placeholder="Pesquisar..."
                  placeholderTextColor={colors.mutedForeground}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoFocus
                />
              </View>
            )}

            {maxSelections && (
              <View style={StyleSheet.flatten([styles.selectionInfo, { borderBottomColor: colors.border }])}>
                <Text style={StyleSheet.flatten([styles.selectionInfoText, { color: colors.mutedForeground }])}>
                  {value.length} de {maxSelections} selecionados
                </Text>
              </View>
            )}

            <FlatList
              data={filteredOptions}
              renderItem={renderItem}
              keyExtractor={(item) => String(item.value)}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>Nenhuma opção encontrada</Text>}
            />

            <View style={StyleSheet.flatten([styles.footer, { borderTopColor: colors.border }])}>
              <TouchableOpacity style={StyleSheet.flatten([styles.footerButton, { backgroundColor: colors.primary }])} onPress={handleDone}>
                <Text style={StyleSheet.flatten([styles.footerButtonText, { color: colors.card }])}>Concluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

Multiselect.displayName = "Multiselect";

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  selectorText: {
    fontSize: fontSize.base,
    flex: 1,
    marginRight: spacing.xs,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  error: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 0,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  searchInput: {
    fontSize: fontSize.base,
    flex: 1,
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selectionInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  selectionInfoText: {
    fontSize: fontSize.xs,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    fontSize: fontSize.base,
    flex: 1,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: "center",
  },
  footerButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  selectedContainer: {
    marginTop: spacing.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    gap: spacing.xs,
  },
  selectedBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
