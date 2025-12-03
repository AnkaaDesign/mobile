import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Generic Multi-Step Form State Hook
 *
 * Provides:
 * - Multi-stage navigation with validation
 * - AsyncStorage persistence (debounced)
 * - Item selection with quantities and prices
 * - Filter and pagination state
 * - Form progress tracking
 *
 * Usage:
 * ```tsx
 * const form = useMultiStepForm({
 *   storageKey: '@my_form',
 *   totalSteps: 3,
 *   validateStep: async (step, state) => {
 *     if (step === 1) return state.formData.name?.trim().length > 0;
 *     if (step === 2) return state.selectedItems.size > 0;
 *     return true;
 *   },
 * });
 * ```
 */

export interface MultiStepFormValidationState {
  isCurrentStepValid: boolean;
  canProceedToNext: boolean;
  canSubmit: boolean;
  stepValidation: Record<number, boolean>;
  errors: Record<string, string>;
}

export interface MultiStepFormStateData<TFormData = Record<string, unknown>> {
  // Step navigation
  currentStep: number;
  totalSteps: number;
  formTouched: boolean;

  // Form data (generic)
  formData: TFormData;

  // Selection state (for item selection steps)
  selectedItems: string[];
  quantities: Record<string, number>;
  prices: Record<string, number>;

  // Filter state
  showSelectedOnly: boolean;
  searchTerm: string;
  showInactive: boolean;
  categoryIds: string[];
  brandIds: string[];
  supplierIds: string[];

  // Pagination state
  page: number;
  pageSize: number;
  totalRecords: number;

  // Timestamp for expiration
  lastModified?: number;
}

export interface UseMultiStepFormOptions<TFormData = Record<string, unknown>> {
  storageKey: string;
  totalSteps: number;
  defaultFormData?: TFormData;
  defaultQuantity?: number;
  defaultPrice?: number;
  preserveQuantitiesOnDeselect?: boolean;
  defaultPageSize?: number;
  validateOnStepChange?: boolean;
  autoSave?: boolean;
  debounceMs?: number;
  /** Time in milliseconds after which persisted data is considered stale and cleared (default: 24 hours) */
  expireAfterMs?: number;
  validateStep?: (
    step: number,
    state: MultiStepFormStateData<TFormData>,
  ) => boolean | Promise<boolean>;
  getStepErrors?: (
    step: number,
    state: MultiStepFormStateData<TFormData>,
  ) => Record<string, string>;
  onStateChange?: (state: MultiStepFormStateData<TFormData>) => void;
}

const createDefaultState = <TFormData>(
  totalSteps: number,
  defaultFormData: TFormData,
  defaultPageSize: number,
): MultiStepFormStateData<TFormData> => ({
  currentStep: 1,
  totalSteps,
  formTouched: false,
  formData: defaultFormData,
  selectedItems: [],
  quantities: {},
  prices: {},
  showSelectedOnly: false,
  searchTerm: "",
  showInactive: false,
  categoryIds: [],
  brandIds: [],
  supplierIds: [],
  page: 1,
  pageSize: defaultPageSize,
  totalRecords: 0,
  lastModified: Date.now(),
});

// Default expiration time: 24 hours
const DEFAULT_EXPIRE_AFTER_MS = 24 * 60 * 60 * 1000;

export function useMultiStepForm<TFormData = Record<string, unknown>>(
  options: UseMultiStepFormOptions<TFormData>,
) {
  const {
    storageKey,
    totalSteps,
    defaultFormData = {} as TFormData,
    defaultQuantity = 1,
    defaultPrice = 0,
    preserveQuantitiesOnDeselect = false,
    defaultPageSize = 20,
    validateOnStepChange = true,
    autoSave = true,
    debounceMs = 500,
    expireAfterMs = DEFAULT_EXPIRE_AFTER_MS,
    validateStep,
    getStepErrors,
    onStateChange,
  } = options;

  // State
  const [state, setState] = useState<MultiStepFormStateData<TFormData>>(() =>
    createDefaultState(totalSteps, defaultFormData, defaultPageSize),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stepValidationCache, setStepValidationCache] = useState<
    Record<number, boolean>
  >({});

  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from AsyncStorage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as MultiStepFormStateData<TFormData>;

          // Check if data has expired
          const lastModified = parsed.lastModified || 0;
          const isExpired = Date.now() - lastModified > expireAfterMs;

          if (isExpired) {
            // Data is stale, clear it and use default state
            console.log(`[MultiStepForm:${storageKey}] Clearing expired data (last modified: ${new Date(lastModified).toISOString()})`);
            await AsyncStorage.removeItem(storageKey);
            // Keep default state (already set in useState)
          } else {
            // Data is fresh, use it
            setState((prev) => ({
              ...prev,
              ...parsed,
              totalSteps, // Always use current totalSteps
            }));
          }
        }
      } catch (error) {
        console.error(`[MultiStepForm:${storageKey}] Failed to load state:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, [storageKey, totalSteps, expireAfterMs]);

  // Save state to AsyncStorage when it changes (debounced)
  useEffect(() => {
    if (isLoading || !autoSave) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        // Always update lastModified timestamp when saving
        const stateToSave = { ...state, lastModified: Date.now() };
        await AsyncStorage.setItem(storageKey, JSON.stringify(stateToSave));
        onStateChange?.(state);
      } catch (error) {
        console.error(`[MultiStepForm:${storageKey}] Failed to save state:`, error);
      } finally {
        setIsSaving(false);
      }
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, storageKey, isLoading, autoSave, debounceMs, onStateChange]);

  // Convert selectedItems array to Set for easier manipulation
  const selectedItems = useMemo(() => {
    return new Set<string>(state.selectedItems);
  }, [state.selectedItems]);

  // Invalidate validation cache when form data or selections change
  // This allows the "Next" button to be re-enabled after user makes changes
  useEffect(() => {
    setStepValidationCache((prev) => {
      // Only clear the current step's cache, not all steps
      const { [state.currentStep]: _, ...rest } = prev;
      return rest;
    });
  }, [state.formData, state.selectedItems, state.currentStep]);

  // Validate current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    if (!validateStep) return true;
    const isValid = await validateStep(state.currentStep, state);
    setStepValidationCache((prev) => ({
      ...prev,
      [state.currentStep]: isValid,
    }));
    return isValid;
  }, [validateStep, state]);

  // Get errors for current step
  const currentStepErrors = useMemo((): Record<string, string> => {
    if (!getStepErrors) return {};
    return getStepErrors(state.currentStep, state);
  }, [getStepErrors, state]);

  // Validation state
  const validation = useMemo((): MultiStepFormValidationState => {
    const stepValidation: Record<number, boolean> = { ...stepValidationCache };

    // Default validation if no custom validator provided
    if (!validateStep) {
      for (let i = 1; i <= totalSteps; i++) {
        stepValidation[i] = true;
      }
    }

    const isCurrentStepValid = stepValidation[state.currentStep] ?? true;
    const canProceedToNext =
      state.currentStep < totalSteps && isCurrentStepValid;
    const canSubmit =
      state.currentStep === totalSteps &&
      Object.values(stepValidation).every((v) => v !== false);

    return {
      isCurrentStepValid,
      canProceedToNext,
      canSubmit,
      stepValidation,
      errors: currentStepErrors,
    };
  }, [
    stepValidationCache,
    validateStep,
    totalSteps,
    state.currentStep,
    currentStepErrors,
  ]);

  // Update state helper
  const updateState = useCallback(
    (updates: Partial<MultiStepFormStateData<TFormData>>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  // Update form data
  const updateFormData = useCallback(
    (updates: Partial<TFormData>) => {
      setState((prev) => ({
        ...prev,
        formData: { ...prev.formData, ...updates },
      }));
    },
    [],
  );

  // Step navigation
  const setCurrentStep = useCallback(
    (step: number) => {
      const validStep = Math.max(1, Math.min(totalSteps, step));
      updateState({ currentStep: validStep });
    },
    [totalSteps, updateState],
  );

  const goToNextStep = useCallback(async (): Promise<boolean> => {
    if (state.currentStep >= totalSteps) return false;

    // Validate before proceeding if validation is enabled
    if (validateOnStepChange) {
      const isValid = await validateCurrentStep();
      if (!isValid) {
        updateState({ formTouched: true });
        return false;
      }
    }

    const nextStep = state.currentStep + 1;
    updateState({ currentStep: nextStep, formTouched: true });
    return true;
  }, [
    state.currentStep,
    totalSteps,
    validateOnStepChange,
    validateCurrentStep,
    updateState,
  ]);

  const goToPrevStep = useCallback((): boolean => {
    if (state.currentStep <= 1) return false;
    const prevStep = state.currentStep - 1;
    updateState({ currentStep: prevStep });
    return true;
  }, [state.currentStep, updateState]);

  const goToStep = useCallback(
    async (targetStep: number): Promise<boolean> => {
      if (targetStep < 1 || targetStep > totalSteps) return false;

      // If going forward, validate intermediary steps
      if (validateOnStepChange && targetStep > state.currentStep) {
        for (let step = state.currentStep; step < targetStep; step++) {
          if (validateStep) {
            const isValid = await validateStep(step, state);
            if (!isValid) {
              updateState({ formTouched: true });
              return false;
            }
          }
        }
      }

      updateState({ currentStep: targetStep, formTouched: true });
      return true;
    },
    [totalSteps, validateOnStepChange, validateStep, state, updateState],
  );

  // Item selection helpers
  const toggleItemSelection = useCallback(
    (itemId: string, quantity?: number, price?: number) => {
      const newSelected = new Set(selectedItems);
      const newQuantities = { ...state.quantities };
      const newPrices = { ...state.prices };

      if (newSelected.has(itemId)) {
        // Deselect
        newSelected.delete(itemId);
        if (!preserveQuantitiesOnDeselect) {
          delete newQuantities[itemId];
          delete newPrices[itemId];
        }
      } else {
        // Select
        newSelected.add(itemId);
        newQuantities[itemId] =
          quantity ?? state.quantities[itemId] ?? defaultQuantity;
        newPrices[itemId] = price ?? state.prices[itemId] ?? defaultPrice;
      }

      updateState({
        selectedItems: Array.from(newSelected),
        quantities: newQuantities,
        prices: newPrices,
      });
    },
    [
      selectedItems,
      state.quantities,
      state.prices,
      defaultQuantity,
      defaultPrice,
      preserveQuantitiesOnDeselect,
      updateState,
    ],
  );

  const setItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity < 0.01) return;

      const newSelected = new Set(selectedItems);
      newSelected.add(itemId);

      updateState({
        selectedItems: Array.from(newSelected),
        quantities: { ...state.quantities, [itemId]: quantity },
      });
    },
    [selectedItems, state.quantities, updateState],
  );

  const setItemPrice = useCallback(
    (itemId: string, price: number) => {
      if (price < 0) return;
      updateState({
        prices: { ...state.prices, [itemId]: price },
      });
    },
    [state.prices, updateState],
  );

  const clearAllSelections = useCallback(() => {
    const resetData: Partial<MultiStepFormStateData<TFormData>> = {
      selectedItems: [],
    };

    if (!preserveQuantitiesOnDeselect) {
      resetData.quantities = {};
      resetData.prices = {};
    }

    updateState(resetData);
  }, [preserveQuantitiesOnDeselect, updateState]);

  const selectAllItems = useCallback(
    (itemIds: string[], getDefaultPrice?: (itemId: string) => number) => {
      const newSelected = new Set(selectedItems);
      const newQuantities = { ...state.quantities };
      const newPrices = { ...state.prices };

      itemIds.forEach((itemId) => {
        if (!newSelected.has(itemId)) {
          newSelected.add(itemId);
          newQuantities[itemId] = newQuantities[itemId] ?? defaultQuantity;
          newPrices[itemId] =
            newPrices[itemId] ?? getDefaultPrice?.(itemId) ?? defaultPrice;
        }
      });

      updateState({
        selectedItems: Array.from(newSelected),
        quantities: newQuantities,
        prices: newPrices,
      });
    },
    [
      selectedItems,
      state.quantities,
      state.prices,
      defaultQuantity,
      defaultPrice,
      updateState,
    ],
  );

  const deselectAllItems = useCallback(
    (itemIds: string[]) => {
      const newSelected = new Set(selectedItems);
      const newQuantities = { ...state.quantities };
      const newPrices = { ...state.prices };

      itemIds.forEach((itemId) => {
        newSelected.delete(itemId);
        if (!preserveQuantitiesOnDeselect) {
          delete newQuantities[itemId];
          delete newPrices[itemId];
        }
      });

      updateState({
        selectedItems: Array.from(newSelected),
        quantities: newQuantities,
        prices: newPrices,
      });
    },
    [selectedItems, state.quantities, state.prices, preserveQuantitiesOnDeselect, updateState],
  );

  // Filter functions
  const setShowSelectedOnly = useCallback(
    (show: boolean) => {
      updateState({ showSelectedOnly: show, page: 1 });
    },
    [updateState],
  );

  const setSearchTerm = useCallback(
    (term: string) => {
      updateState({ searchTerm: term, page: 1 });
    },
    [updateState],
  );

  const setShowInactive = useCallback(
    (show: boolean) => {
      updateState({ showInactive: show, page: 1 });
    },
    [updateState],
  );

  const setCategoryIds = useCallback(
    (ids: string[]) => {
      updateState({ categoryIds: ids, page: 1 });
    },
    [updateState],
  );

  const setBrandIds = useCallback(
    (ids: string[]) => {
      updateState({ brandIds: ids, page: 1 });
    },
    [updateState],
  );

  const setSupplierIds = useCallback(
    (ids: string[]) => {
      updateState({ supplierIds: ids, page: 1 });
    },
    [updateState],
  );

  const resetFilters = useCallback(() => {
    updateState({
      showSelectedOnly: false,
      searchTerm: "",
      showInactive: false,
      categoryIds: [],
      brandIds: [],
      supplierIds: [],
      page: 1,
    });
  }, [updateState]);

  // Pagination functions
  const setPage = useCallback(
    (newPage: number) => {
      updateState({ page: Math.max(1, newPage) });
    },
    [updateState],
  );

  const setPageSize = useCallback(
    (newPageSize: number) => {
      updateState({ pageSize: Math.max(1, Math.min(100, newPageSize)), page: 1 });
    },
    [updateState],
  );

  const setTotalRecords = useCallback(
    (total: number) => {
      updateState({ totalRecords: Math.max(0, total) });
    },
    [updateState],
  );

  // Form helpers
  const getSelectedItemsWithData = useCallback(() => {
    return Array.from(selectedItems).map((id) => ({
      id,
      quantity: state.quantities[id] ?? defaultQuantity,
      price: state.prices[id] ?? defaultPrice,
    }));
  }, [selectedItems, state.quantities, state.prices, defaultQuantity, defaultPrice]);

  const resetForm = useCallback(async () => {
    setState(createDefaultState(totalSteps, defaultFormData, defaultPageSize));
    setStepValidationCache({});

    try {
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`[MultiStepForm:${storageKey}] Failed to clear storage:`, error);
    }
  }, [totalSteps, defaultFormData, defaultPageSize, storageKey]);

  const saveState = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      // Always update lastModified timestamp when saving
      const stateToSave = { ...state, lastModified: Date.now() };
      await AsyncStorage.setItem(storageKey, JSON.stringify(stateToSave));
      onStateChange?.(state);
      return true;
    } catch (error) {
      console.error(`[MultiStepForm:${storageKey}] Failed to save state:`, error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [state, storageKey, onStateChange]);

  // Computed values
  const formProgress = useMemo(() => {
    const percentage = ((state.currentStep - 1) / (totalSteps - 1)) * 100;
    return {
      current: state.currentStep,
      total: totalSteps,
      percentage: Math.round(Math.max(0, Math.min(100, percentage))),
      isFirstStep: state.currentStep === 1,
      isLastStep: state.currentStep === totalSteps,
    };
  }, [state.currentStep, totalSteps]);

  const hasActiveFilters = useMemo(() => {
    return (
      state.showInactive !== false ||
      state.categoryIds.length > 0 ||
      state.brandIds.length > 0 ||
      state.supplierIds.length > 0 ||
      state.searchTerm !== ""
    );
  }, [
    state.showInactive,
    state.categoryIds,
    state.brandIds,
    state.supplierIds,
    state.searchTerm,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (state.showInactive) count++;
    if (state.categoryIds.length > 0) count++;
    if (state.brandIds.length > 0) count++;
    if (state.supplierIds.length > 0) count++;
    if (state.searchTerm) count++;
    return count;
  }, [
    state.showInactive,
    state.categoryIds,
    state.brandIds,
    state.supplierIds,
    state.searchTerm,
  ]);

  const totalPages = useMemo(
    () =>
      state.totalRecords > 0
        ? Math.ceil(state.totalRecords / state.pageSize)
        : 1,
    [state.totalRecords, state.pageSize],
  );

  return {
    // Loading states
    isLoading,
    isSaving,

    // Step navigation
    currentStep: state.currentStep,
    totalSteps,
    formProgress,
    validation,
    formTouched: state.formTouched,

    // Form data
    formData: state.formData,
    updateFormData,

    // Selection state
    selectedItems,
    quantities: state.quantities,
    prices: state.prices,
    selectionCount: selectedItems.size,

    // Filter state
    showSelectedOnly: state.showSelectedOnly,
    searchTerm: state.searchTerm,
    showInactive: state.showInactive,
    categoryIds: state.categoryIds,
    brandIds: state.brandIds,
    supplierIds: state.supplierIds,

    // Pagination state
    page: state.page,
    pageSize: state.pageSize,
    totalRecords: state.totalRecords,
    totalPages,

    // Step navigation functions
    setCurrentStep,
    goToNextStep,
    goToPrevStep,
    goToStep,
    validateCurrentStep,

    // Form data functions
    setFormTouched: (touched: boolean) => updateState({ formTouched: touched }),

    // Item selection functions
    toggleItemSelection,
    setItemQuantity,
    setItemPrice,
    clearAllSelections,
    selectAllItems,
    deselectAllItems,
    getSelectedItemsWithData,

    // Filter functions
    setShowSelectedOnly,
    setSearchTerm,
    setShowInactive,
    setCategoryIds,
    setBrandIds,
    setSupplierIds,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,

    // Pagination functions
    setPage,
    setPageSize,
    setTotalRecords,

    // Form management
    resetForm,
    saveState,

    // Raw state access
    state,
    updateState,
  };
}

export type UseMultiStepFormReturn<TFormData = Record<string, unknown>> =
  ReturnType<typeof useMultiStepForm<TFormData>>;
