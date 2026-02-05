import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, Keyboard, Platform, Dimensions, ActivityIndicator, Pressable, StyleSheet, KeyboardAvoidingView } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "./icon";
import { Badge } from "./badge";
import { Checkbox } from "./checkbox";
import { useTheme } from "@/lib/theme";
import { useDebouncedValue } from "@/hooks/useDebouncedSearch";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { useKeyboardAwareForm } from "@/contexts/KeyboardAwareFormContext";

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
  onCreate?: (value: string) => void | Promise<void> | TData | Promise<TData>;
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
  /** Container style */
  style?: any;
  /** Load options on mount for async mode (default: false) */
  loadOnMount?: boolean;

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

  // UI behavior
  hideDescription?: boolean;
  avoidKeyboard?: boolean; // Whether to use KeyboardAvoidingView in the modal (default: true)

  // Size variant
  size?: "default" | "sm";

  // Custom styling for the trigger button
  triggerStyle?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
  };

  // Scroll behavior - callback to notify parent when combobox opens
  // Parent can use this to scroll the combobox into view
  // Returns true if scrolling was performed
  onOpen?: (measurements: { inputY: number; inputHeight: number; requiredHeight: number }) => boolean | void;
  // Callback when combobox closes
  onClose?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.7;
const LIST_MAX_HEIGHT = 400;

const ComboboxComponent = function Combobox<TData = ComboboxOption>({
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
  // staleTime and pageSize are defined in props but not used - handled by useQuery config
  staleTime: _staleTime,
  pageSize: _pageSize,
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
  // className and required are defined in props but not used in RN - kept for API compatibility
  className: _className,
  required: _required,
  style,
  loadOnMount = false,
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
  hideDescription = false,
  avoidKeyboard = true,
  size = "default",
  triggerStyle,
  onOpen,
  onClose: onCloseProp,
}: ComboboxProps<TData>) {
  const { colors } = useTheme();
  const keyboardContext = useKeyboardAwareForm();

  // Auto-integrate with keyboard context when available
  // This allows Combobox to work seamlessly within form containers
  // without requiring explicit onOpen/onClose props
  const effectiveOnOpen = onOpen ?? keyboardContext?.onComboboxOpen;
  const effectiveOnClose = onCloseProp ?? keyboardContext?.onComboboxClose;

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
  const inputLayoutRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
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
  const { data: asyncResponse, isLoading: isLoadingOptions, refetch } = useQuery({
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
    enabled: async && !!queryKey && !!queryFn,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: loadOnMount,
    refetchOnWindowFocus: false,
  });

  // Reset pagination when dropdown opens for async mode
  // Note: We don't refetch on every open to avoid resetting accumulated options
  // The first page is already loaded via useQuery, and hasMore is set from that response
  useEffect(() => {
    if (open && async && queryKey && queryFn) {
      // Only reset if we have no data yet
      if (allAsyncOptions.length === 0) {
        setCurrentPage(1);
        refetch();
      }
    }
  }, [open, async, queryKey, queryFn, refetch, allAsyncOptions.length]);

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
    consecutiveEmptyLoadsRef.current = 0; // Reset empty loads counter
    if (debouncedSearch !== '') {
      setAllAsyncOptions([]);
    }
  }, [debouncedSearch]);

  // Track last search to know when to reset vs merge
  const lastSearchRef = useRef<string>('');

  // Update all options when first page loads or search changes
  useEffect(() => {
    if (asyncResponse) {
      let newOptions = asyncResponse.data || [];
      const searchChanged = lastSearchRef.current !== debouncedSearch;
      lastSearchRef.current = debouncedSearch;

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

      // If search changed, replace all options with new page 1 data
      // If search didn't change (e.g., value changed), MERGE with existing options to preserve loadMore data
      if (searchChanged || currentPage === 1) {
        // Deduplicate items
        const deduplicatedData = newOptions.filter(
          (item, index, self) => {
            const itemValue = getOptionValueRef.current(item);
            return index === self.findIndex((t) => getOptionValueRef.current(t) === itemValue);
          }
        );
        setAllAsyncOptions(deduplicatedData);
      } else {
        // Merge: keep existing options, add any new ones from page 1 that aren't already present
        setAllAsyncOptions(prev => {
          const existingValues = new Set(prev.map(item => getOptionValueRef.current(item)));
          const newItems = newOptions.filter(item => !existingValues.has(getOptionValueRef.current(item)));
          // Also add selected items that aren't in existing
          const combined = [...prev, ...newItems];
          // Deduplicate
          const seen = new Set<string>();
          return combined.filter(item => {
            const itemValue = getOptionValueRef.current(item);
            if (seen.has(itemValue)) return false;
            seen.add(itemValue);
            return true;
          });
        });
      }

      setHasMore(asyncResponse.hasMore || false);
    } else if (asyncResponse === null) {
      setAllAsyncOptions([]);
      setHasMore(false);
    }
  }, [asyncResponse, debouncedSearch, value, currentPage]);

  // Track consecutive empty loads to prevent infinite loops with client-side filtering
  const consecutiveEmptyLoadsRef = useRef(0);
  const MAX_CONSECUTIVE_EMPTY_LOADS = 3;

  // Load more function
  const loadMore = useCallback(async () => {
    if (!queryFn || isLoadingMore || !hasMore) return;

    // Prevent infinite loops when client-side filtering yields empty results
    if (consecutiveEmptyLoadsRef.current >= MAX_CONSECUTIVE_EMPTY_LOADS) {
      setHasMore(false);
      return;
    }

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

        const newItemsCount = result.length;
        if (newItemsCount === 0) {
          consecutiveEmptyLoadsRef.current++;
        } else {
          consecutiveEmptyLoadsRef.current = 0;
        }

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
        const newData = result.data || [];
        newData.forEach(item => {
          const itemValue = getOptionValue(item);
          allItemsCacheRef.current.set(itemValue, item);
        });

        // Track if we got any new unique items
        let addedCount = 0;
        setAllAsyncOptions((prev) => {
          const existingValues = new Set(prev.map(item => getOptionValue(item)));
          const newUniqueItems = newData.filter(item => !existingValues.has(getOptionValue(item)));
          addedCount = newUniqueItems.length;

          const combined = [...prev, ...newUniqueItems];
          const seen = new Set();
          const deduplicated = combined.filter((item) => {
            const value = getOptionValue(item);
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
          });
          return deduplicated;
        });

        // Track consecutive empty loads for client-side filtering scenarios
        if (addedCount === 0 && newData.length === 0) {
          consecutiveEmptyLoadsRef.current++;
        } else {
          consecutiveEmptyLoadsRef.current = 0;
        }

        // Stop if server says no more OR if we've had too many empty loads
        const shouldStopLoading = !result.hasMore || consecutiveEmptyLoadsRef.current >= MAX_CONSECUTIVE_EMPTY_LOADS;
        setHasMore(!shouldStopLoading);
      }

      setCurrentPage(nextPage);
    } catch (error) {
      console.error("Error loading more options:", error);
      setHasMore(false); // Stop trying on error
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
    return new Promise<{ x: number; y: number; width: number; height: number }>((resolve) => {
      selectRef.current?.measureInWindow((x, y, width, height) => {
        const layout = { x, y, width, height };
        inputLayoutRef.current = layout;
        setInputLayout(layout);
        resolve(layout);
      });
    });
  }, []);


  const handleOpen = useCallback(async () => {
    if (disabled) return;

    setSearch("");

    const layout = await measureSelect();

    // Notify parent about the opening so it can scroll if needed
    let didScroll = false;
    if (effectiveOnOpen && layout.height > 0) {
      const dropdownHeight = Math.min(LIST_MAX_HEIGHT, options.length * 48 + 56);
      didScroll = effectiveOnOpen({
        inputY: layout.y,
        inputHeight: layout.height,
        requiredHeight: dropdownHeight,
      }) === true;
    }

    if (didScroll) {
      // Wait for scroll animation to complete, then re-measure and open
      // The parent's handleComboboxOpen waits 50ms before scrolling, then scroll takes ~300-400ms
      // So we need to wait at least 50 + 400 = 450ms, adding buffer for safety
      // eslint-disable-next-line no-undef
      setTimeout(async () => {
        // Re-measure after scroll completed - this updates inputLayoutRef
        await measureSelect();
        // Open immediately after measurement - ref is already updated
        setOpen(true);
      }, 550); // 50ms (parent delay) + 400ms (scroll) + 100ms (buffer)
    } else {
      // No scroll needed, open immediately
      setOpen(true);
    }
  }, [disabled, measureSelect, options, effectiveOnOpen]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearch("");
    Keyboard.dismiss();
    effectiveOnClose?.();
  }, [effectiveOnClose]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (isMultiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];
        onValueChange?.(newValues);
      } else {
        // Only toggle off if clearable is true, otherwise just select
        const newValue = clearable && value === optionValue ? undefined : optionValue;
        onValueChange?.(newValue);
        handleClose();
      }
    },
    [isMultiple, selectedValues, value, onValueChange, handleClose, clearable],
  );

  const handleCreate = useCallback(async () => {
    if (!onCreate || !search.trim()) return;

    const searchValue = search.trim();

    try {
      // Call onCreate and get the newly created item
      const createdItem = await onCreate(searchValue);

      // If onCreate returned the created item, process it
      if (createdItem) {
        const itemValue = getOptionValueRef.current(createdItem as TData);

        // Validate the extracted value
        if (!itemValue || (typeof itemValue === "string" && itemValue.trim() === "")) {
          console.error("[Combobox] ❌ Invalid itemValue extracted:", itemValue);
          return;
        }

        // Add to cache immediately (synchronous)
        allItemsCacheRef.current.set(itemValue, createdItem as TData);

        // Add to allAsyncOptions state FIRST so it's in the options when we select
        if (async) {
          setAllAsyncOptions((prev) => {
            // Check if it already exists to avoid duplicates
            const exists = prev.some((item) => getOptionValueRef.current(item) === itemValue);
            if (exists) {
              return prev;
            }
            return [createdItem as TData, ...prev];
          });
        }

        // Invalidate related query keys to refresh data
        if (queryKeysToInvalidate.length > 0) {
          try {
            await Promise.all(queryKeysToInvalidate.map((key) => queryClient.invalidateQueries({ queryKey: key })));
          } catch (error) {
            console.error("[Combobox] Error invalidating queries:", error);
          }
        }

        // CRITICAL: Wait for React Native to process the state updates
        // eslint-disable-next-line no-undef
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // Call onValueChange to update the form field
        onValueChange?.(itemValue);

        // Wait for form to process the update
        // eslint-disable-next-line no-undef
        await new Promise<void>((resolve) => setTimeout(resolve, 300));

        // Close the modal
        handleClose();
      } else {
        // Original behavior - just close
        if (queryKeysToInvalidate.length > 0) {
          await Promise.all(queryKeysToInvalidate.map((key) => queryClient.invalidateQueries({ queryKey: key })));
        }
        handleClose();
      }
    } catch (error) {
      console.error("[Combobox] Error creating item:", error);
      // Error handling done by parent
    }
  }, [onCreate, search, queryKeysToInvalidate, queryClient, handleClose, async, onValueChange]);

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
      // Check if there's a selected value that's not in selectedOptions (e.g., not loaded yet in async mode)
      if (selectedValues.length > 0) {
        // Try to get from cache for single select
        if (!isMultiple) {
          const cachedItem = allItemsCacheRef.current.get(selectedValues[0]);
          if (cachedItem) {
            return formatOptionLabel(cachedItem);
          }
          // If not in cache and async, show loading or truncated ID
          if (async) {
            return externalLoading ? loadingText : `ID: ${selectedValues[0].substring(0, 8)}...`;
          }
        } else {
          // For multiple select, try to get all from cache
          const cachedItems = selectedValues
            .map(val => allItemsCacheRef.current.get(val))
            .filter((item): item is TData => item !== undefined);

          if (cachedItems.length > 0) {
            if (singleMode) {
              const label = formatOptionLabel(cachedItems[0]);
              return showCount && cachedItems.length > 1 ? `${label} +${cachedItems.length - 1}` : label;
            }
            return showCount ? `${cachedItems.length} selecionado${cachedItems.length !== 1 ? "s" : ""}` : placeholder;
          }
        }
      }
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
  }, [renderValue, selectedOptions, selectedValues, placeholder, isMultiple, singleMode, showCount, formatOptionLabel, async, externalLoading, loadingText]);

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
                {!hideDescription && description && (
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
      hideDescription,
    ],
  );

  const renderFooter = useCallback(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Carregando mais...
          </Text>
        </View>
      );
    }

    // Show indicator when there are more items to load
    if (async && hasMore) {
      return (
        <View style={styles.loadingFooter}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Role para carregar mais
          </Text>
        </View>
      );
    }

    return null;
  }, [isLoadingMore, async, hasMore, colors]);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
      )}

      <Pressable
        ref={selectRef}
        style={[
          styles.selector,
          size === "sm" && styles.selectorSm,
          {
            backgroundColor: triggerStyle?.backgroundColor || colors.input,
            borderColor: error ? colors.destructive : (triggerStyle?.borderColor || colors.border),
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
            size === "sm" && styles.selectorTextSm,
            {
              color: triggerStyle?.textColor || (disabled
                ? colors.mutedForeground
                : selectedOptions.length > 0
                  ? colors.cardForeground || colors.foreground
                  : colors.mutedForeground),
            },
          ]}
          numberOfLines={1}
        >
          {triggerContent}
        </Text>

        <View style={styles.iconContainer}>
          {loading ? (
            <ActivityIndicator size="small" color={triggerStyle?.textColor || colors.primary} />
          ) : (
            <>
              {clearable && selectedOptions.length > 0 && !disabled && (
                <Pressable
                  onPress={handleClear}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar seleção"
                >
                  <Icon name="x" size={20} color={triggerStyle?.textColor || colors.mutedForeground} />
                </Pressable>
              )}
              <Icon
                name={open ? "chevronUp" : "chevronDown"}
                size={20}
                color={triggerStyle?.textColor || (disabled ? colors.mutedForeground : colors.foreground)}
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
                <Badge variant="outline" size="sm" style={styles.badge}>
                  <Text style={[styles.badgeText, { color: colors.foreground }]}>{formatOptionLabel(option)}</Text>
                  <View style={styles.badgeIcon}>
                    <Icon name="x" size={12} color={colors.foreground} />
                  </View>
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
        <Pressable
          style={[
            styles.modalOverlay,
            inputLayout.width === 0 && {
              justifyContent: "flex-start",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          ]}
          onPress={handleClose}
        >
          {avoidKeyboard ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={inputLayout.width === 0 ? styles.keyboardAvoidingView : undefined}
              keyboardVerticalOffset={0}
            >
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
                    // Always show below the input - parent is responsible for scrolling to ensure visibility
                    top: inputLayout.y + inputLayout.height + 4,
                    // Limit height to available space on screen
                    maxHeight: Math.min(LIST_MAX_HEIGHT + 100, SCREEN_HEIGHT - inputLayout.y - inputLayout.height - 20),
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
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.2}
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
                paddingBottom: 8,
              }}
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={11}
              removeClippedSubviews={Platform.OS === 'android'}
              updateCellsBatchingPeriod={50}
            />
          </Pressable>
            </KeyboardAvoidingView>
          ) : (
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
                    // Always show below the input - parent is responsible for scrolling to ensure visibility
                    top: inputLayout.y + inputLayout.height + 4,
                    // Limit height to available space on screen
                    maxHeight: Math.min(LIST_MAX_HEIGHT + 100, SCREEN_HEIGHT - inputLayout.y - inputLayout.height - 20),
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
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.2}
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
                paddingBottom: 8,
              }}
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={11}
              removeClippedSubviews={Platform.OS === 'android'}
              updateCellsBatchingPeriod={50}
            />
          </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
};

export const Combobox = React.memo(ComboboxComponent) as typeof ComboboxComponent & { displayName?: string };

Combobox.displayName = "Combobox";

const styles = StyleSheet.create({
  container: {
    // No marginBottom - let parent control spacing via gap
  },
  label: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    fontWeight: fontWeight.medium as "500",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderRadius: borderRadius.DEFAULT,
    borderWidth: 1,
    height: 42,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectorSm: {
    height: 36,
    paddingHorizontal: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  selectorText: {
    fontSize: fontSize.base,
    flex: 1,
    marginRight: spacing.xs,
  },
  selectorTextSm: {
    fontSize: fontSize.sm,
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
    backgroundColor: "transparent",
  },
  keyboardAvoidingView: {
    flex: 1,
    width: "100%",
  },
  modalContent: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 44 : spacing.sm,
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
    fontWeight: fontWeight.semibold as "600",
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
    fontWeight: fontWeight.medium as "500",
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
    fontWeight: fontWeight.medium as "500",
  },
  optionDescription: {
    fontSize: fontSize.xs - 1,
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
    fontWeight: fontWeight.medium as "500",
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
