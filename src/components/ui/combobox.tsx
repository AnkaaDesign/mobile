import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, Keyboard, Platform, Dimensions, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "./icon";
import { Badge } from "./badge";
import { Checkbox } from "./checkbox";
import { useTheme } from "@/lib/theme";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  metadata?: any;
  // Extended properties for specific use cases
  unicode?: string;
  brand?: string;
  category?: string;
  [key: string]: any;
}

interface ComboboxProps<TData = ComboboxOption> {
  // Core props
  value?: string | string[];
  onValueChange?: (value: string | string[] | null | undefined) => void;
  options?: TData[];

  // Mode configuration
  mode?: "single" | "multiple";
  async?: boolean;

  // Async configuration
  queryKey?: unknown[];
  queryFn?: (searchTerm: string, page?: number) => Promise<{ data: TData[]; hasMore?: boolean; total?: number }>;
  initialOptions?: TData[];
  minSearchLength?: number;
  debounceMs?: number;
  staleTime?: number;
  pageSize?: number;

  // Create functionality
  allowCreate?: boolean;
  onCreate?: (value: string) => void | Promise<void>;
  createLabel?: (value: string) => string;
  isCreating?: boolean;
  queryKeysToInvalidate?: unknown[][];

  // Display customization
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  loadingText?: string;

  // Option configuration
  getOptionValue?: (option: TData) => string;
  getOptionLabel?: (option: TData) => string;
  getOptionDescription?: (option: TData) => string | undefined;
  isOptionDisabled?: (option: TData) => boolean;

  // UI configuration
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  className?: string;
  required?: boolean;

  // Custom rendering
  renderOption?: (option: TData, isSelected: boolean) => React.ReactNode;
  renderValue?: (option: TData | TData[]) => React.ReactNode;
  formatDisplay?: "category" | "brand";

  // Loading states
  loading?: boolean;

  // Form integration
  name?: string;
  label?: string;
  error?: string;

  // Multi-select specific
  singleMode?: boolean;
  showCount?: boolean;
  hideDefaultBadges?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.7;
const LIST_MAX_HEIGHT = 400;

export const Combobox = React.memo(function Combobox<TData = ComboboxOption>({
  value,
  onValueChange,
  options: propOptions,
  mode = "single",
  async = false,
  queryKey,
  queryFn,
  initialOptions = [],
  minSearchLength = 1,
  debounceMs = 300,
  staleTime = 5 * 60 * 1000,
  pageSize = 20,
  allowCreate = false,
  onCreate,
  createLabel = (value) => `Criar "${value}"`,
  isCreating = false,
  queryKeysToInvalidate = [],
  placeholder = "Selecione uma opção",
  emptyText = "Nenhuma opção encontrada",
  searchPlaceholder = "Pesquisar...",
  loadingText = "Carregando...",
  getOptionValue = (option: any) => option.value,
  getOptionLabel = (option: any) => option.label,
  getOptionDescription = (option: any) => option.description,
  isOptionDisabled = (option: any) => option.disabled || false,
  disabled = false,
  searchable = true,
  clearable = true,
  className,
  required = false,
  renderOption,
  renderValue,
  formatDisplay,
  loading: externalLoading,
  name,
  label,
  error,
  singleMode = false,
  showCount = true,
  hideDefaultBadges = false,
}: ComboboxProps<TData>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [allAsyncOptions, setAllAsyncOptions] = useState<TData[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const debouncedSearch = useDebouncedValue(search, debounceMs);
  const queryClient = useQueryClient();

  const [inputLayout, setInputLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const selectRef = useRef<View>(null);

  // Use refs for getter functions and initialOptions to prevent infinite loops
  const getOptionValueRef = useRef(getOptionValue);
  const getOptionLabelRef = useRef(getOptionLabel);
  const getOptionDescriptionRef = useRef(getOptionDescription);
  const isOptionDisabledRef = useRef(isOptionDisabled);
  const initialOptionsRef = useRef(initialOptions);

  // Cache to maintain all items that have been loaded or selected
  const allItemsCacheRef = useRef<Map<string, TData>>(new Map());

  // Update refs when props change
  useEffect(() => {
    getOptionValueRef.current = getOptionValue;
    getOptionLabelRef.current = getOptionLabel;
    getOptionDescriptionRef.current = getOptionDescription;
    isOptionDisabledRef.current = isOptionDisabled;
    initialOptionsRef.current = initialOptions;
  }, [getOptionValue, getOptionLabel, getOptionDescription, isOptionDisabled, initialOptions]);

  const isMultiple = mode === "multiple";
  const selectedValues = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Async query for first page
  const { data: asyncResponse, isLoading: isLoadingOptions } = useQuery({
    queryKey: queryKey ? [...queryKey, debouncedSearch, 1] : ["combobox", debouncedSearch, 1],
    queryFn: async () => {
      if (!queryFn) {
        return { data: initialOptions || [], hasMore: false };
      }

      // Check minimum search length
      if (debouncedSearch.length < minSearchLength) {
        if (minSearchLength === 0) {
          const result = await queryFn("", 1);
          if (Array.isArray(result)) {
            return { data: result, hasMore: false };
          }
          return result;
        }
        return { data: initialOptions || [], hasMore: false };
      }

      const result = await queryFn(debouncedSearch, 1);

      // Handle backward compatibility
      if (Array.isArray(result)) {
        return { data: result, hasMore: false };
      }
      return result;
    },
    enabled: async && !!queryKey && !!queryFn && open,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Initialize with initialOptions on mount
  useEffect(() => {
    const currentInitialOptions = initialOptionsRef.current;
    if (async && currentInitialOptions && currentInitialOptions.length > 0 && allAsyncOptions.length === 0) {
      setAllAsyncOptions(currentInitialOptions);
    }
  }, [async, allAsyncOptions.length]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
    if (debouncedSearch !== '') {
      setAllAsyncOptions([]);
    }
  }, [debouncedSearch]);

  // Update all options when first page loads or search changes
  useEffect(() => {
    if (asyncResponse) {
      let newOptions = asyncResponse.data || [];

      // Add all fetched items to the cache
      newOptions.forEach(item => {
        const itemValue = getOptionValueRef.current(item);
        allItemsCacheRef.current.set(itemValue, item);
      });

      // If we have initialOptions, add them to cache
      const currentInitialOptions = initialOptionsRef.current;
      if (currentInitialOptions && currentInitialOptions.length > 0) {
        currentInitialOptions.forEach(opt => {
          const itemValue = getOptionValueRef.current(opt);
          if (!allItemsCacheRef.current.has(itemValue)) {
            allItemsCacheRef.current.set(itemValue, opt);
          }
        });
      }

      // Get current selected values
      const currentSelectedValues = Array.isArray(value) ? value : (value ? [value] : []);

      // Merge in selected items from cache that aren't in the current response
      const fetchedValues = new Set(newOptions.map(item => getOptionValueRef.current(item)));
      currentSelectedValues.forEach(selectedValue => {
        if (!fetchedValues.has(selectedValue) && allItemsCacheRef.current.has(selectedValue)) {
          const cachedItem = allItemsCacheRef.current.get(selectedValue);
          if (cachedItem) {
            newOptions = [cachedItem, ...newOptions];
          }
        }
      });

      // Deduplicate items
      const deduplicatedData = newOptions.filter(
        (item, index, self) => {
          const itemValue = getOptionValueRef.current(item);
          return index === self.findIndex((t) => getOptionValueRef.current(t) === itemValue);
        }
      );

      setAllAsyncOptions(deduplicatedData);
      setHasMore(asyncResponse.hasMore || false);
    } else if (asyncResponse === null) {
      setAllAsyncOptions([]);
      setHasMore(false);
    }
  }, [asyncResponse, debouncedSearch, value]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (!queryFn || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await queryFn(debouncedSearch, nextPage);

      // Handle backward compatibility
      if (Array.isArray(result)) {
        result.forEach(item => {
          const itemValue = getOptionValue(item);
          allItemsCacheRef.current.set(itemValue, item);
        });

        setAllAsyncOptions((prev) => {
          const combined = [...prev, ...result];
          const seen = new Set();
          return combined.filter((item) => {
            const value = getOptionValue(item);
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
          });
        });
        setHasMore(false);
      } else {
        (result.data || []).forEach(item => {
          const itemValue = getOptionValue(item);
          allItemsCacheRef.current.set(itemValue, item);
        });

        setAllAsyncOptions((prev) => {
          const combined = [...prev, ...(result.data || [])];
          const seen = new Set();
          return combined.filter((item) => {
            const value = getOptionValue(item);
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
          });
        });
        setHasMore(result.hasMore || false);
      }

      setCurrentPage(nextPage);
    } catch (error) {
      console.error("Error loading more options:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [queryFn, isLoadingMore, hasMore, currentPage, debouncedSearch, getOptionValue]);

  // Determine options source
  const options = async ? allAsyncOptions : propOptions || [];
  const loading = async ? isLoadingOptions && currentPage === 1 : externalLoading;

  // Filter options - only filter locally for non-async mode
  const filteredOptions = useMemo(() => {
    if (async) return options;

    if (!searchable || !search) return options;

    const searchLower = search.toLowerCase();
    return options.filter((option) => {
      const label = getOptionLabel(option).toLowerCase();
      const description = getOptionDescription(option)?.toLowerCase() || "";
      return label.includes(searchLower) || description.includes(searchLower);
    });
  }, [async, options, search, searchable, getOptionLabel, getOptionDescription]);

  // Get selected option(s)
  const selectedOptions = useMemo(() => {
    return options.filter((option) => selectedValues.includes(getOptionValue(option)));
  }, [options, selectedValues, getOptionValue]);

  const formatOptionLabel = useCallback(
    (option: TData) => {
      const label = getOptionLabel(option);
      const optionAny = option as any;

      if (formatDisplay === "category" && optionAny.category) {
        return `${label} (${optionAny.category})`;
      }
      if (formatDisplay === "brand") {
        const parts = [];
        if (optionAny.unicode) parts.push(optionAny.unicode);
        parts.push(label);
        if (optionAny.brand || optionAny.category) {
          parts.push(`(${optionAny.brand || optionAny.category})`);
        }
        return parts.join(" ");
      }
      return label;
    },
    [getOptionLabel, formatDisplay],
  );

  // Measure input position for precise dropdown positioning
  const measureSelect = useCallback(() => {
    selectRef.current?.measureInWindow((x, y, width, height) => {
      setInputLayout({ x, y, width, height });
    });
  }, []);

  // Calculate dropdown position
  const spaceBelow = SCREEN_HEIGHT - (inputLayout.y + inputLayout.height);
  const shouldShowBelow = spaceBelow >= Math.min(LIST_MAX_HEIGHT, filteredOptions.length * 48 + 56);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    measureSelect();
    setTimeout(() => {
      setOpen(true);
    }, 0);
    setSearch("");
  }, [disabled, measureSelect]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearch("");
    Keyboard.dismiss();
  }, []);

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (isMultiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];
        onValueChange?.(newValues);
      } else {
        const newValue = value === optionValue ? undefined : optionValue;
        onValueChange?.(newValue);
        handleClose();
      }
    },
    [isMultiple, selectedValues, value, onValueChange, handleClose],
  );

  const handleCreate = useCallback(async () => {
    if (!onCreate || !search.trim()) return;

    try {
      await onCreate(search.trim());

      if (queryKeysToInvalidate.length > 0) {
        await Promise.all(queryKeysToInvalidate.map((key) => queryClient.invalidateQueries({ queryKey: key })));
      }

      handleClose();
    } catch (error) {
      // Error handling done by parent
    }
  }, [onCreate, search, queryKeysToInvalidate, queryClient, handleClose]);

  const handleClear = useCallback(
    (e?: any) => {
      e?.stopPropagation?.();
      onValueChange?.(isMultiple ? [] : null);
    },
    [isMultiple, onValueChange],
  );

  const handleSelectAll = useCallback(() => {
    const allValues = filteredOptions
      .filter((option) => !isOptionDisabled(option))
      .map((option) => getOptionValue(option));
    onValueChange?.(allValues);
  }, [filteredOptions, isOptionDisabled, getOptionValue, onValueChange]);

  const handleClearAll = useCallback(() => {
    onValueChange?.([]);
  }, [onValueChange]);

  const handleEndReached = useCallback(() => {
    if (async && hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [async, hasMore, isLoadingMore, loadMore]);

  const triggerContent = useMemo(() => {
    if (renderValue) {
      return renderValue(isMultiple ? selectedOptions : selectedOptions[0]);
    }

    if (selectedOptions.length === 0) {
      return placeholder;
    }

    if (isMultiple) {
      if (singleMode) {
        const label = formatOptionLabel(selectedOptions[0]);
        return showCount && selectedOptions.length > 1 ? `${label} +${selectedOptions.length - 1}` : label;
      }
      return showCount ? `${selectedOptions.length} selecionado${selectedOptions.length !== 1 ? "s" : ""}` : placeholder;
    }

    return formatOptionLabel(selectedOptions[0]);
  }, [renderValue, selectedOptions, placeholder, isMultiple, singleMode, showCount, formatOptionLabel]);

  const showCreateOption = allowCreate && search.trim() && filteredOptions.length === 0 && !filteredOptions.some((opt) => getOptionLabel(opt).toLowerCase() === search.toLowerCase());

  const renderItem = useCallback(
    ({ item }: { item: TData }) => {
      const optionValue = getOptionValue(item);
      const isSelected = selectedValues.includes(optionValue);
      const isDisabled = isOptionDisabled(item);
      const description = getOptionDescription(item);

      return (
        <TouchableOpacity
          style={[
            styles.option,
            {
              backgroundColor: isSelected && !isMultiple ? colors.primary + "20" : "transparent",
              borderBottomColor: colors.border,
            },
            isDisabled && styles.disabledOption,
          ]}
          onPress={isDisabled ? undefined : () => handleSelect(optionValue)}
          disabled={isDisabled}
          accessibilityRole="button"
          accessibilityLabel={getOptionLabel(item)}
          accessibilityState={{ selected: isSelected, disabled: isDisabled }}
        >
          {isMultiple && (
            <Checkbox
              checked={isSelected}
              disabled={isDisabled}
              style={styles.checkbox}
              onCheckedChange={() => handleSelect(optionValue)}
            />
          )}

          <View style={styles.optionContent}>
            {renderOption ? (
              renderOption(item, isSelected)
            ) : (
              <View style={styles.optionTextContainer}>
                <Text
                  style={[
                    styles.optionLabel,
                    { color: colors.foreground },
                    isSelected && !isMultiple && styles.selectedOptionLabel,
                  ]}
                  numberOfLines={1}
                >
                  {formatOptionLabel(item)}
                </Text>
                {description && (
                  <Text
                    style={[
                      styles.optionDescription,
                      {
                        color: isSelected && !isMultiple ? colors.foreground : colors.mutedForeground,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {description}
                  </Text>
                )}
              </View>
            )}
          </View>

          {!isMultiple && isSelected && (
            <Icon name="check" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      );
    },
    [
      selectedValues,
      isMultiple,
      colors,
      getOptionValue,
      getOptionLabel,
      getOptionDescription,
      isOptionDisabled,
      formatOptionLabel,
      handleSelect,
      renderOption,
    ],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Carregando mais...
        </Text>
      </View>
    );
  }, [isLoadingMore, colors]);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      )}

      <Pressable
        ref={selectRef}
        style={[
          styles.selector,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.destructive : colors.border,
          },
          disabled && styles.disabled,
        ]}
        onPress={handleOpen}
        disabled={disabled}
        accessibilityRole="combobox"
        accessibilityLabel={name || label || placeholder}
        accessibilityState={{ expanded: open, disabled }}
        accessibilityValue={{ text: typeof triggerContent === 'string' ? triggerContent : placeholder }}
      >
        <Text
          style={[
            styles.selectorText,
            {
              color: selectedOptions.length > 0 ? colors.foreground : colors.mutedForeground,
            },
            disabled && { color: colors.mutedForeground },
          ]}
          numberOfLines={1}
        >
          {triggerContent}
        </Text>

        <View style={styles.iconContainer}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              {clearable && selectedOptions.length > 0 && !disabled && (
                <Pressable
                  onPress={handleClear}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar seleção"
                >
                  <Icon name="x" size={20} color={colors.mutedForeground} />
                </Pressable>
              )}
              <Icon
                name={open ? "chevronUp" : "chevronDown"}
                size={20}
                color={disabled ? colors.mutedForeground : colors.foreground}
              />
            </>
          )}
        </View>
      </Pressable>

      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      )}

      {/* Badges for multi-select */}
      {!hideDefaultBadges && isMultiple && selectedOptions.length > 0 && !singleMode && (
        <View style={styles.badgesContainer}>
          {selectedOptions.map((option) => {
            const optionValue = getOptionValue(option);
            return (
              <TouchableOpacity
                key={optionValue}
                onPress={() => handleSelect(optionValue)}
                activeOpacity={0.7}
              >
                <Badge variant="secondary" size="sm" style={styles.badge}>
                  <Text style={styles.badgeText}>{formatOptionLabel(option)}</Text>
                  <Icon name="x" size={12} color={colors.secondaryForeground} style={styles.badgeIcon} />
                </Badge>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <Pressable style={styles.modalOverlay} onPress={handleClose}>
          <Pressable
            style={[
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
                  maxHeight: LIST_MAX_HEIGHT + 100,
                }),
                ...(inputLayout.width === 0 && {
                  maxHeight: MAX_MODAL_HEIGHT,
                }),
              },
            ]}
            onPress={() => {}}
          >
            {inputLayout.width === 0 && (
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {label || "Selecione uma opção"}
                </Text>
                <Pressable
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                >
                  <Icon name="x" size={24} color={colors.foreground} />
                </Pressable>
              </View>
            )}

            {searchable && (
              <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
                <Icon name="search" size={20} color={colors.mutedForeground} />
                <TextInput
                  style={[
                    styles.searchInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.input,
                    },
                  ]}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={search}
                  onChangeText={setSearch}
                  autoFocus={inputLayout.width === 0}
                  accessibilityLabel="Campo de pesquisa"
                />
              </View>
            )}

            {isMultiple && filteredOptions.length > 0 && (
              <View style={[styles.multiSelectActions, { borderBottomColor: colors.border }]}>
                <Text style={[styles.multiSelectCount, { color: colors.mutedForeground }]}>
                  {selectedValues.length} de {filteredOptions.length} selecionados
                </Text>
                <View style={styles.multiSelectButtons}>
                  <TouchableOpacity onPress={handleSelectAll} style={styles.actionButton}>
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                      Selecionar todos
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleClearAll} style={styles.actionButton}>
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                      Limpar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <FlatList
              data={filteredOptions}
              renderItem={renderItem}
              keyExtractor={(item) => getOptionValue(item)}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              ListHeaderComponent={
                <>
                  {!isMultiple && clearable && selectedValues.length > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.clearOption,
                        { borderBottomColor: colors.border },
                      ]}
                      onPress={handleClear}
                    >
                      <Icon name="x" size={20} color={colors.destructive} />
                      <Text style={[styles.clearOptionText, { color: colors.destructive }]}>
                        Limpar seleção
                      </Text>
                    </TouchableOpacity>
                  )}

                  {showCreateOption && (
                    <TouchableOpacity
                      style={[
                        styles.createOption,
                        { borderBottomColor: colors.border },
                        isCreating && styles.disabledOption,
                      ]}
                      onPress={isCreating ? undefined : handleCreate}
                      disabled={isCreating}
                    >
                      <Icon name="plus" size={20} color={colors.primary} />
                      <Text style={[styles.createOptionText, { color: colors.primary }]}>
                        {createLabel(search.trim())}
                      </Text>
                      {isCreating && (
                        <ActivityIndicator size="small" color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                </>
              }
              ListEmptyComponent={
                loading ? (
                  <View style={styles.emptyContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                      {loadingText}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      {emptyText}
                    </Text>
                  </View>
                )
              }
              style={{
                maxHeight: inputLayout.width > 0 ? LIST_MAX_HEIGHT : undefined,
              }}
              contentContainerStyle={{
                flexGrow: 1,
              }}
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={11}
              removeClippedSubviews={Platform.OS === 'android'}
              updateCellsBatchingPeriod={50}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}) as <TData = ComboboxOption>(props: ComboboxProps<TData>) => React.ReactElement;

Combobox.displayName = "Combobox";

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
    paddingHorizontal: 12,
    borderRadius: borderRadius.DEFAULT,
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
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  badgeIcon: {
    marginLeft: 2,
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
    borderRadius: borderRadius.DEFAULT,
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
  multiSelectActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  multiSelectCount: {
    fontSize: fontSize.sm,
  },
  multiSelectButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  disabledOption: {
    opacity: 0.5,
  },
  checkbox: {
    marginRight: spacing.sm,
  },
  optionContent: {
    flex: 1,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: fontSize.base,
  },
  selectedOptionLabel: {
    fontWeight: fontWeight.medium,
  },
  optionDescription: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  clearOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  clearOptionText: {
    fontSize: fontSize.base,
  },
  createOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  createOptionText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  loadingFooter: {
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
});

export { Combobox };
