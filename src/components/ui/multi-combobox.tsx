import React, { useState, useRef, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, Keyboard, Platform, Dimensions, ActivityIndicator, Pressable, ScrollView , StyleSheet} from "react-native";
import { Icon } from "./icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface MultiComboboxOption {
  label: string;
  value: string;
  [key: string]: any;
}

interface MultiComboboxProps {
  options: MultiComboboxOption[];
  selectedValues?: string[];
  value?: string[];
  onValueChange?: (values: string[]) => void;
  onChange?: (values: string[]) => void;
  onCreate?: (newLabel: string) => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  placeholder?: string;
  label?: string;
  selectedText?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  onSearchChange?: (text: string) => void;
  renderOption?: (option: MultiComboboxOption, isSelected: boolean, onPress: () => void) => React.ReactNode;
  renderBadge?: (option: MultiComboboxOption, onRemove: () => void) => React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
  emptyText?: string;
  createNewText?: (searchText: string) => string;
  maxSelections?: number;
  showBadges?: boolean;
  badgeStyle?: "badge" | "chip";
}

const { height: SCREEN_HEIGHT, width: _SCREEN_WIDTH } = Dimensions.get("window");
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.6;
const LIST_MAX_HEIGHT = 300;

export const MultiCombobox = React.memo(function MultiCombobox({
  options,
  selectedValues = [],
  onValueChange,
  onCreate,
  onEndReached,
  onEndReachedThreshold = 0.5,
  placeholder = "Selecione itens",
  label,
  selectedText = "itens selecionados",
  searchPlaceholder = "Pesquisar...",
  disabled = false,
  error,
  loading = false,
  onSearchChange,
  renderOption,
  renderBadge,
  onOpen,
  onClose,
  emptyText = "Nenhuma opção encontrada",
  createNewText = (searchText: string) => `Adicionar "${searchText}"`,
  maxSelections,
  showBadges = true,
  badgeStyle = "badge",
}: MultiComboboxProps) {
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
  const badgeScrollRef = useRef<ScrollView>(null);

  // Filter options based on search text
  const filteredOptions = useMemo(() => {
    return options.filter((option) => option.label.toLowerCase().includes(searchText.toLowerCase())).map((option) => ({ ...option, key: `option-${option.value}` }));
  }, [options, searchText]);

  // Show create option if onCreate is provided and search text doesn't match any existing option
  const shouldShowCreateOption = useMemo(() => {
    return onCreate && searchText.trim().length > 0 && !filteredOptions.some((option) => option.label.toLowerCase() === searchText.trim().toLowerCase());
  }, [onCreate, searchText, filteredOptions]);

  // Combine options with create option if needed
  const combinedOptions = useMemo(() => {
    return shouldShowCreateOption
      ? [
          {
            label: createNewText(searchText),
            value: "__CREATE_OPTION__",
            key: "create-option",
          },
          ...filteredOptions,
        ]
      : filteredOptions;
  }, [shouldShowCreateOption, createNewText, searchText, filteredOptions]);

  // Measure input position for precise dropdown positioning
  const measureSelect = useCallback(() => {
    selectRef.current?.measureInWindow((x, y, width, height) => {
      setInputLayout({ x, y, width, height });
    });
  }, []);

  // Calculate dropdown position (above or below input)
  const spaceBelow = SCREEN_HEIGHT - (inputLayout.y + inputLayout.height);
  const shouldShowBelow = useMemo(() => {
    return spaceBelow >= Math.min(LIST_MAX_HEIGHT, combinedOptions.length * 48 + 56);
  }, [spaceBelow, combinedOptions.length]);

  // Get display text for trigger button
  const getDisplayText = useCallback(() => {
    if (selectedValues.length === 0) {
      return placeholder;
    }

    const count = selectedValues.length;
    const text = selectedText;

    // Handle Portuguese pluralization
    if (count === 1) {
      return `1 ${text.replace(/s$/, "")}`;
    }

    return `${count} ${text}`;
  }, [selectedValues.length, placeholder, selectedText]);

  // Get option by value for badge display
  const getOptionByValue = useCallback(
    (value: string) => {
      return options.find((option) => option.value === value);
    },
    [options],
  );

  const handleOpen = useCallback(() => {
    if (disabled) return;

    measureSelect();
    // Use setTimeout to prevent flicker when modal opens
    setTimeout(() => {
      setModalVisible(true);
    }, 0);
    setSearchText("");
    onOpen?.();
  }, [disabled, measureSelect, onOpen]);

  const handleClose = useCallback(() => {
    setModalVisible(false);
    onClose?.();
  }, [onClose]);

  const handleSelect = useCallback(
    (option: MultiComboboxOption) => {
      let newSelectedValues: string[];

      if (selectedValues.includes(option.value)) {
        // Remove if already selected
        newSelectedValues = selectedValues.filter((v) => v !== option.value);
      } else {
        // Check max selections limit
        if (maxSelections && selectedValues.length >= maxSelections) {
          return; // Don't add if at limit
        }
        // Add if not selected
        newSelectedValues = [...selectedValues, option.value];
      }

      onValueChange?.(newSelectedValues);
    },
    [selectedValues, onValueChange, maxSelections],
  );

  const handleCreate = useCallback(() => {
    if (onCreate && searchText.trim()) {
      onCreate(searchText.trim());
    }
    handleClose();
    setSearchText("");
    Keyboard.dismiss();
  }, [onCreate, searchText, handleClose]);

  const handleRemoveBadge = useCallback(
    (value: string) => {
      const newSelectedValues = selectedValues.filter((v) => v !== value);
      onValueChange?.(newSelectedValues);
    },
    [selectedValues, onValueChange],
  );

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
    ({ item }: { item: MultiComboboxOption }): React.ReactElement | null => {
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

      const isSelected = selectedValues.includes(item.value);
      const isAtLimit = !!(maxSelections && selectedValues.length >= maxSelections && !isSelected);

      // Use custom render if provided - wrap in TouchableOpacity with proper padding
      if (renderOption) {
        return (
          <TouchableOpacity
            style={StyleSheet.flatten([
              styles.option,
              {
                backgroundColor: isSelected ? colors.primary + "20" : "transparent",
                borderBottomColor: colors.border,
                opacity: isAtLimit ? 0.5 : 1,
              },
            ])}
            onPress={() => handleSelect(item)}
            disabled={loading || isAtLimit}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isSelected, disabled: isAtLimit }}
          >
            {renderOption(item, isSelected, () => handleSelect(item))}
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity
          style={StyleSheet.flatten([
            styles.option,
            {
              backgroundColor: isSelected ? colors.primary + "20" : "transparent",
              borderBottomColor: colors.border,
              opacity: isAtLimit ? 0.5 : 1,
            },
          ])}
          onPress={() => handleSelect(item)}
          disabled={loading || isAtLimit}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: isSelected, disabled: isAtLimit }}
        >
          <Text style={StyleSheet.flatten([styles.optionText, { color: colors.foreground }, isSelected && { fontWeight: fontWeight.medium }])} numberOfLines={1}>
            {item.label}
          </Text>
          {isSelected && <Icon name="check" size={20} color={colors.primary} />}
        </TouchableOpacity>
      );
    },
    [selectedValues, maxSelections, colors, loading, renderOption, handleSelect, handleCreate, searchText],
  );

  const renderSelectedBadges = useCallback(() => {
    if (!showBadges || selectedValues.length === 0) return null;

    return (
      <ScrollView
        ref={badgeScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.badgeContainer}
        onContentSizeChange={() => {
          badgeScrollRef.current?.scrollToEnd({ animated: true });
        }}
      >
        {selectedValues.map((value) => {
          const option = getOptionByValue(value);
          if (!option) return null;

          if (renderBadge) {
            return (
              <View key={`badge-${value}`} style={styles.badgeWrapper}>
                {renderBadge(option, () => handleRemoveBadge(value))}
              </View>
            );
          }

          if (badgeStyle === "chip") {
            return <Chip key={`badge-${value}`} label={option.label} onRemove={() => handleRemoveBadge(value)} colors={colors} />;
          }

          return <Badge key={`badge-${value}`} label={option.label} onRemove={() => handleRemoveBadge(value)} colors={colors} />;
        })}
      </ScrollView>
    );
  }, [showBadges, selectedValues, getOptionByValue, renderBadge, badgeStyle, handleRemoveBadge, colors]);

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
        accessibilityValue={{ text: getDisplayText() }}
      >
        <Text
          style={StyleSheet.flatten([
            styles.selectorText,
            {
              color: selectedValues.length > 0 ? colors.foreground : colors.mutedForeground,
            },
            disabled && { color: colors.mutedForeground },
          ])}
          numberOfLines={1}
        >
          {getDisplayText()}
        </Text>

        <View style={styles.iconContainer}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name={modalVisible ? "chevronUp" : "chevronDown"} size={20} color={disabled ? colors.mutedForeground : colors.foreground} />
          )}
        </View>
      </Pressable>

      {maxSelections && selectedValues.length >= maxSelections && (
        <Text style={StyleSheet.flatten([styles.limitText, { color: colors.mutedForeground }])}>
          Limite máximo de {maxSelections} {selectedText} atingido
        </Text>
      )}

      {error && <Text style={StyleSheet.flatten([styles.error, { color: colors.destructive }])}>{error}</Text>}

      {renderSelectedBadges()}

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
                <Text style={StyleSheet.flatten([styles.modalTitle, { color: colors.foreground }])}>{label || "Selecione itens"}</Text>
                <Pressable onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Fechar">
                  <Icon name="x" size={24} color={colors.foreground} />
                </Pressable>
              </View>
            )}

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
              {searchText.length > 0 && (
                <Pressable
                  onPress={() => setSearchText("")}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.clearButton}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar pesquisa"
                >
                  <Icon name="x" size={18} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>

            <FlatList
              ref={listRef}
              data={combinedOptions}
              renderItem={renderItem}
              keyExtractor={(item) => item.key || item.value}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              onEndReached={handleEndReached}
              onEndReachedThreshold={onEndReachedThreshold}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={<Text style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>{emptyText}</Text>}
              style={{
                maxHeight: inputLayout.width > 0 ? LIST_MAX_HEIGHT : undefined,
              }}
              contentContainerStyle={{
                flexGrow: 1,
              }}
              // Virtualization optimizations - disabled for custom renderOption to ensure proper measurement
              getItemLayout={!renderOption ? (_data: ArrayLike<MultiComboboxOption> | null | undefined, index: number) => ({
                length: 48, // Fixed item height
                offset: 48 * index,
                index,
              }) : undefined}
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={11}
              removeClippedSubviews={Platform.OS === 'android'}
              updateCellsBatchingPeriod={50}
              disableVirtualization={false}
              nestedScrollEnabled={true}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
});

MultiCombobox.displayName = "MultiCombobox";

// Badge component for selected values
interface BadgeProps {
  label: string;
  onRemove: () => void;
  colors: {
    primary: string;
    foreground: string;
    background: string;
    muted: string;
    mutedForeground: string;
    border: string;
  };
}

const Badge = React.memo<BadgeProps>(({ label, onRemove, colors }) => {
  return (
    <View style={StyleSheet.flatten([styles.badge, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }])}>
      <Text style={StyleSheet.flatten([styles.badgeText, { color: colors.primary }])} numberOfLines={1} ellipsizeMode="tail">
        {label}
      </Text>
      <Pressable onPress={onRemove} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }} accessibilityRole="button" accessibilityLabel={`Remover ${label}`}>
        <Icon name="x" size={14} color={colors.primary} />
      </Pressable>
    </View>
  );
});

// Chip component for selected values
interface ChipProps {
  label: string;
  onRemove: () => void;
  colors: {
    primary: string;
    foreground: string;
    background: string;
    muted: string;
    mutedForeground: string;
    border: string;
  };
}

const Chip = React.memo<ChipProps>(({ label, onRemove, colors }) => {
  return (
    <View style={StyleSheet.flatten([styles.chip, { backgroundColor: colors.muted }])}>
      <Text style={StyleSheet.flatten([styles.chipText, { color: colors.foreground }])} numberOfLines={1} ellipsizeMode="tail">
        {label}
      </Text>
      <Pressable onPress={onRemove} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }} accessibilityRole="button" accessibilityLabel={`Remover ${label}`}>
        <Icon name="x" size={14} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    fontWeight: fontWeight.medium,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
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
  limitText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  error: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  badgeContainer: {
    marginTop: spacing.sm,
    flexDirection: "row",
  },
  badgeWrapper: {
    marginRight: spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    marginRight: spacing.xs,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: fontSize.xs,
    marginRight: 4,
    fontWeight: fontWeight.medium,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginRight: spacing.xs,
  },
  chipText: {
    fontSize: fontSize.xs,
    marginRight: 4,
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
    position: "relative",
  },
  searchInput: {
    fontSize: fontSize.base,
    flex: 1,
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingRight: spacing.lg,
    borderRadius: 6,
    minHeight: 36,
  },
  clearButton: {
    position: "absolute",
    right: spacing.md,
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
