import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, Keyboard, Platform, Dimensions, ActivityIndicator, Pressable , StyleSheet} from "react-native";
import { Icon } from "./icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

export interface ComboboxOption {
  label: string;
  value: string;
  key?: string;
  [key: string]: any;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  onChange?: (value: string | undefined) => void;
  onCreate?: (newLabel: string) => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  placeholder?: string;
  label?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  onSearchChange?: (text: string) => void;
  renderOption?: (option: ComboboxOption, isSelected: boolean, onPress: () => void) => React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
  emptyText?: string;
  createNewText?: (searchText: string) => string;
  multiple?: boolean;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.6;
const LIST_MAX_HEIGHT = 300;

export const Combobox = React.memo(function Combobox({
  options,
  value,
  onValueChange,
  onCreate,
  onEndReached,
  onEndReachedThreshold = 0.5,
  placeholder = "Selecione uma opção",
  label,
  searchPlaceholder = "Pesquisar...",
  searchable = true,
  clearable = true,
  disabled = false,
  error,
  loading = false,
  onSearchChange,
  renderOption,
  onOpen,
  onClose,
  emptyText = "Nenhuma opção encontrada",
  createNewText = (searchText: string) => `Adicionar "${searchText}"`,
}: ComboboxProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [inputLayout, setInputLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const selectRef = useRef<View>(null);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search text
  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchText.toLowerCase())).map((option) => ({ ...option, key: `option-${option.value}` }));

  // Show create option if onCreate is provided and search text doesn't match any existing option
  const shouldShowCreateOption = onCreate && searchText.trim().length > 0 && !filteredOptions.some((option) => option.label.toLowerCase() === searchText.trim().toLowerCase());

  // Combine options with create option if needed
  const combinedOptions = shouldShowCreateOption
    ? [
        {
          label: createNewText(searchText),
          value: "__CREATE_OPTION__",
          key: "create-option",
        },
        ...filteredOptions,
      ]
    : filteredOptions;

  // Measure input position for precise dropdown positioning
  const measureSelect = useCallback(() => {
    selectRef.current?.measureInWindow((x, y, width, height) => {
      setInputLayout({ x, y, width, height });
    });
  }, []);

  // Calculate dropdown position (above or below input)
  const spaceBelow = SCREEN_HEIGHT - (inputLayout.y + inputLayout.height);
  const shouldShowBelow = spaceBelow >= Math.min(LIST_MAX_HEIGHT, combinedOptions.length * 48 + 56);

  const handleOpen = useCallback(() => {
    if (disabled) return;

    measureSelect();
    setModalVisible(true);
    setSearchText("");
    onOpen?.();
  }, [disabled, measureSelect, onOpen]);

  const handleClose = useCallback(() => {
    setModalVisible(false);
    onClose?.();
  }, [onClose]);

  const handleSelect = useCallback(
    (option: ComboboxOption) => {
      if (option.value === value) {
        // Deselect if clicking the same option
        onValueChange(undefined);
      } else {
        onValueChange(option.value);
      }
      handleClose();
      setSearchText("");
      Keyboard.dismiss();
    },
    [value, onValueChange, handleClose],
  );

  const handleCreate = useCallback(() => {
    if (onCreate && searchText.trim()) {
      onCreate(searchText.trim());
    }
    handleClose();
    setSearchText("");
    Keyboard.dismiss();
  }, [onCreate, searchText, handleClose]);

  const handleClear = useCallback(() => {
    onValueChange(undefined);
  }, [onValueChange]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      onSearchChange?.(text);
    },
    [onSearchChange],
  );

  const handleEndReached = useCallback(() => {
    if (!loading && onEndReached) {
      onEndReached();
    }
  }, [loading, onEndReached]);

  const renderFooter = useCallback(() => {
    if (!loading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [loading, colors.primary]);

  const renderItem = useCallback(
    ({ item }: { item: ComboboxOption & { key?: string } }) => {
      // Handle create option
      if (item.value === "__CREATE_OPTION__") {
        return (
          <TouchableOpacity
            style={StyleSheet.flatten([styles.option, styles.createOption, { borderBottomColor: colors.border }])}
            onPress={handleCreate}
            accessibilityRole="button"
            accessibilityLabel={`Criar nova opção: ${searchText}`}
          >
            <Text style={StyleSheet.flatten([styles.optionText, styles.createOptionText, { color: colors.primary }])}>{item.label}</Text>
            <Icon name="plus" size={20} color={colors.primary} />
          </TouchableOpacity>
        );
      }

      const isSelected = item.value === value;

      // Use custom render if provided
      if (renderOption) {
        return renderOption(item, isSelected, () => handleSelect(item));
      }

      return (
        <TouchableOpacity
          style={StyleSheet.flatten([
            styles.option,
            {
              backgroundColor: isSelected ? colors.primary + "20" : "transparent",
              borderBottomColor: colors.border,
            },
          ])}
          onPress={() => handleSelect(item)}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: isSelected }}
        >
          <Text style={StyleSheet.flatten([styles.optionText, { color: colors.foreground }, isSelected && { fontWeight: fontWeight.medium }])} numberOfLines={1}>
            {item.label}
          </Text>
          {isSelected && <Icon name="check" size={20} color={colors.primary} />}
        </TouchableOpacity>
      );
    },
    [value, colors, loading, renderOption, handleSelect, handleCreate, searchText],
  );

  return (
    <View style={styles.container}>
      {label && <Text style={StyleSheet.flatten([styles.label, { color: colors.foreground }])}>{label}</Text>}

      <Pressable
        ref={selectRef}
        style={StyleSheet.flatten([
          styles.selector,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.destructive : colors.border,
          },
          disabled && styles.disabled,
        ])}
        onPress={handleOpen}
        disabled={disabled}
        accessibilityRole="combobox"
        accessibilityLabel={label || placeholder}
        accessibilityState={{ expanded: modalVisible, disabled }}
        accessibilityValue={{ text: selectedOption?.label || placeholder }}
      >
        <Text
          style={StyleSheet.flatten([styles.selectorText, { color: selectedOption ? colors.foreground : colors.mutedForeground }, disabled && { color: colors.mutedForeground }])}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>

        <View style={styles.iconContainer}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              {clearable && selectedOption && !disabled && (
                <Pressable onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Limpar seleção">
                  <Icon name="x" size={20} color={colors.mutedForeground} />
                </Pressable>
              )}
              <Icon name={modalVisible ? "chevronUp" : "chevronDown"} size={20} color={disabled ? colors.mutedForeground : colors.foreground} />
            </>
          )}
        </View>
      </Pressable>

      {error && <Text style={StyleSheet.flatten([styles.error, { color: colors.destructive }])}>{error}</Text>}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
        <Pressable style={styles.modalOverlay} onPress={handleClose}>
          <Pressable
            style={StyleSheet.flatten([
              inputLayout.width > 0 ? styles.dropdownContent : styles.modalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                ...(inputLayout.width > 0 && {
                  position: "absolute",
                  width: inputLayout.width,
                  left: inputLayout.x,
                  top: shouldShowBelow ? inputLayout.y + inputLayout.height + 4 : undefined,
                  bottom: !shouldShowBelow ? SCREEN_HEIGHT - inputLayout.y + 4 : undefined,
                  maxHeight: LIST_MAX_HEIGHT + 56,
                }),
                ...(inputLayout.width === 0 && {
                  maxHeight: MAX_MODAL_HEIGHT,
                }),
              },
            ])}
            onPress={() => {}}
          >
            {inputLayout.width === 0 && (
              <View style={StyleSheet.flatten([styles.modalHeader, { borderBottomColor: colors.border }])}>
                <Text style={StyleSheet.flatten([styles.modalTitle, { color: colors.foreground }])}>{label || "Selecione uma opção"}</Text>
                <Pressable onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Fechar">
                  <Icon name="x" size={24} color={colors.foreground} />
                </Pressable>
              </View>
            )}

            {searchable && (
              <View style={StyleSheet.flatten([styles.searchContainer, { borderBottomColor: colors.border }])}>
                <Icon name="search" size={20} color={colors.mutedForeground} />
                <TextInput
                  ref={inputRef}
                  style={StyleSheet.flatten([styles.searchInput, { color: colors.foreground, backgroundColor: colors.input }])}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={searchText}
                  onChangeText={handleSearchChange}
                  autoFocus={inputLayout.width === 0}
                  accessibilityLabel="Campo de pesquisa"
                />
              </View>
            )}

            <FlatList
              ref={listRef}
              data={combinedOptions}
              renderItem={renderItem}
              keyExtractor={(item) => (item.key || item.value) as string}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onEndReached={handleEndReached}
              onEndReachedThreshold={onEndReachedThreshold}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={<Text style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>{emptyText}</Text>}
              style={{
                maxHeight: inputLayout.width > 0 ? LIST_MAX_HEIGHT : undefined,
              }}
              // Virtualization optimizations
              getItemLayout={(data, index) => ({
                length: 48, // Fixed item height
                offset: 48 * index,
                index,
              })}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews={true}
              updateCellsBatchingPeriod={50}
              disableVirtualization={false}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
});

Combobox.displayName = "Combobox";

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
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    paddingBottom: Platform.OS === "ios" ? 34 : spacing.lg,
  },
  dropdownContent: {
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    backgroundColor: "transparent",
  },
  searchInput: {
    fontSize: fontSize.base,
    flex: 1,
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    minHeight: 36,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  createOption: {
    backgroundColor: "transparent",
  },
  createOptionText: {
    fontWeight: fontWeight.medium,
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
  loadingFooter: {
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
