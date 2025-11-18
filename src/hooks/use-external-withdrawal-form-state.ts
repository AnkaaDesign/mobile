import { useCallback, useMemo, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXTERNAL_WITHDRAWAL_TYPE } from "@/constants";

/**
 * External Withdrawal Form State Hook (Mobile)
 *
 * Important behaviors:
 * - Manages 3-stage form navigation (Basic Info → Item Selection → Review)
 * - Manages selected items, their quantities and prices in AsyncStorage
 * - Manages form data (withdrawerName, type, notes, files) in AsyncStorage
 * - Handles form validation state across stages
 * - Persists all state in AsyncStorage for app restart recovery
 * - Use preserveQuantitiesOnDeselect option to keep values when deselecting items
 *
 * Differences from web version:
 * - Uses AsyncStorage instead of URL state for persistence
 * - Includes file attachments support (nfeId, receiptId)
 * - Optimized for mobile navigation patterns
 * - Includes loading states for async operations
 */

export type ExternalWithdrawalFormStage = 1 | 2 | 3;

export interface ExternalWithdrawalFormValidationState {
  stage1Valid: boolean;
  stage2Valid: boolean;
  canProceedToStage2: boolean;
  canProceedToStage3: boolean;
  canSubmit: boolean;
  errors: {
    withdrawerName?: string;
    selectedItems?: string;
    quantities?: Record<string, string>;
    prices?: Record<string, string>;
  };
}

export interface ExternalWithdrawalFormStateData {
  // Stage navigation
  stage: ExternalWithdrawalFormStage;
  formTouched: boolean;

  // Selection state
  selectedItems: string[];
  quantities: Record<string, number>;
  prices: Record<string, number>;

  // Form data
  withdrawerName: string;
  type: EXTERNAL_WITHDRAWAL_TYPE;
  notes: string;
  nfeId?: string | null;
  receiptId?: string | null;

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
}

interface UseExternalWithdrawalFormStateOptions {
  storageKey?: string;
  defaultQuantity?: number;
  defaultPrice?: number;
  preserveQuantitiesOnDeselect?: boolean;
  defaultPageSize?: number;
  validateOnStageChange?: boolean;
  initialData?: Partial<ExternalWithdrawalFormStateData>;
  autoSave?: boolean;
  onStateChange?: (state: ExternalWithdrawalFormStateData) => void;
}

const DEFAULT_STATE: ExternalWithdrawalFormStateData = {
  stage: 1,
  formTouched: false,
  selectedItems: [],
  quantities: {},
  prices: {},
  withdrawerName: "",
  type: EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE,
  notes: "",
  nfeId: null,
  receiptId: null,
  showSelectedOnly: false,
  searchTerm: "",
  showInactive: false,
  categoryIds: [],
  brandIds: [],
  supplierIds: [],
  page: 1,
  pageSize: 40,
  totalRecords: 0,
};

export function useExternalWithdrawalFormState(
  options: UseExternalWithdrawalFormStateOptions = {},
) {
  const {
    storageKey = "@external_withdrawal_form",
    defaultQuantity = 1,
    defaultPrice = 0,
    preserveQuantitiesOnDeselect = false,
    defaultPageSize = 40,
    validateOnStageChange = true,
    initialData,
    autoSave = true,
    onStateChange,
  } = options;

  // Initialize state with defaults and initial data
  const [state, setState] = useState<ExternalWithdrawalFormStateData>(() => ({
    ...DEFAULT_STATE,
    pageSize: defaultPageSize,
    ...initialData,
  }));

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load state from AsyncStorage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as ExternalWithdrawalFormStateData;
          setState((prev) => ({
            ...prev,
            ...parsed,
            ...initialData, // Initial data takes precedence
          }));
        }
      } catch (error) {
        console.error("[ExternalWithdrawalForm] Failed to load state:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, [storageKey, initialData]);

  // Save state to AsyncStorage when it changes (debounced)
  useEffect(() => {
    if (isLoading || !autoSave) return;

    const saveState = async () => {
      setIsSaving(true);
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(state));
        onStateChange?.(state);
      } catch (error) {
        console.error("[ExternalWithdrawalForm] Failed to save state:", error);
      } finally {
        setIsSaving(false);
      }
    };

    const timeoutId = setTimeout(saveState, 500); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [state, storageKey, isLoading, autoSave, onStateChange]);

  // Convert selectedItems array to Set for easier manipulation
  const selectedItems = useMemo(() => {
    return new Set<string>(state.selectedItems);
  }, [state.selectedItems]);

  // Extract state values
  const {
    stage,
    formTouched,
    quantities,
    prices,
    withdrawerName,
    type,
    notes,
    nfeId,
    receiptId,
    showSelectedOnly,
    searchTerm,
    showInactive,
    categoryIds,
    brandIds,
    supplierIds,
    page,
    pageSize,
    totalRecords,
  } = state;

  // Form validation logic
  const validation = useMemo((): ExternalWithdrawalFormValidationState => {
    const errors: ExternalWithdrawalFormValidationState["errors"] = {};

    // Stage 1 validation (Basic Info)
    let stage1Valid = true;
    if (!withdrawerName?.trim() || withdrawerName.trim().length < 2) {
      errors.withdrawerName = "Nome do retirador deve ter pelo menos 2 caracteres";
      stage1Valid = false;
    }

    // Stage 2 validation (Item Selection)
    let stage2Valid = true;
    if (selectedItems.size === 0) {
      errors.selectedItems = "Selecione pelo menos um item";
      stage2Valid = false;
    }

    // Validate quantities
    const quantityErrors: Record<string, string> = {};
    Array.from(selectedItems).forEach((itemId) => {
      const quantity = quantities[itemId];
      if (!quantity || quantity < 0.01) {
        quantityErrors[itemId] = "Quantidade deve ser maior que 0";
        stage2Valid = false;
      }
    });
    if (Object.keys(quantityErrors).length > 0) {
      errors.quantities = quantityErrors;
    }

    // Validate prices (optional, but if set must be >= 0)
    const priceErrors: Record<string, string> = {};
    Array.from(selectedItems).forEach((itemId) => {
      const price = prices[itemId];
      if (price !== undefined && price < 0) {
        priceErrors[itemId] = "Preço deve ser maior ou igual a 0";
      }
    });
    if (Object.keys(priceErrors).length > 0) {
      errors.prices = priceErrors;
    }

    return {
      stage1Valid,
      stage2Valid,
      canProceedToStage2: stage1Valid,
      canProceedToStage3: stage1Valid && stage2Valid,
      canSubmit: stage1Valid && stage2Valid,
      errors,
    };
  }, [withdrawerName, selectedItems, quantities, prices]);

  // Update functions
  const updateState = useCallback(
    (updates: Partial<ExternalWithdrawalFormStateData>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  const updateSelectedItems = useCallback(
    (newSelected: Set<string>) => {
      updateState({ selectedItems: Array.from(newSelected) });
    },
    [updateState],
  );

  const updateQuantities = useCallback(
    (newQuantities: Record<string, number>) => {
      const filtered = Object.fromEntries(
        Object.entries(newQuantities).filter(([_, v]) => v >= 0.01),
      );
      updateState({ quantities: filtered });
    },
    [updateState],
  );

  const updatePrices = useCallback(
    (newPrices: Record<string, number>) => {
      const filtered = Object.fromEntries(
        Object.entries(newPrices).filter(([_, v]) => v >= 0),
      );
      updateState({ prices: filtered });
    },
    [updateState],
  );

  const updateWithdrawerName = useCallback(
    (name: string) => {
      updateState({ withdrawerName: name });
    },
    [updateState],
  );

  const updateType = useCallback(
    (value: EXTERNAL_WITHDRAWAL_TYPE) => {
      updateState({ type: value });
    },
    [updateState],
  );

  const updateNotes = useCallback(
    (text: string) => {
      updateState({ notes: text });
    },
    [updateState],
  );

  const updateNfeId = useCallback(
    (id: string | null) => {
      updateState({ nfeId: id });
    },
    [updateState],
  );

  const updateReceiptId = useCallback(
    (id: string | null) => {
      updateState({ receiptId: id });
    },
    [updateState],
  );

  const setFormTouched = useCallback(
    (touched: boolean) => {
      updateState({ formTouched: touched });
    },
    [updateState],
  );

  // Stage navigation
  const setStage = useCallback(
    (newStage: ExternalWithdrawalFormStage) => {
      updateState({ stage: newStage });
    },
    [updateState],
  );

  const goToNextStage = useCallback(() => {
    if (stage < 3) {
      const nextStage = (stage + 1) as ExternalWithdrawalFormStage;

      // Validate before proceeding if validation is enabled
      if (validateOnStageChange) {
        if (stage === 1 && !validation.canProceedToStage2) {
          setFormTouched(true);
          return false;
        }
        if (stage === 2 && !validation.canProceedToStage3) {
          setFormTouched(true);
          return false;
        }
      }

      setStage(nextStage);
      setFormTouched(true);
      return true;
    }
    return false;
  }, [stage, validation, validateOnStageChange, setStage, setFormTouched]);

  const goToPrevStage = useCallback(() => {
    if (stage > 1) {
      const prevStage = (stage - 1) as ExternalWithdrawalFormStage;
      setStage(prevStage);
      return true;
    }
    return false;
  }, [stage, setStage]);

  const goToStage = useCallback(
    (targetStage: ExternalWithdrawalFormStage) => {
      // Validate intermediary stages if validation is enabled
      if (validateOnStageChange && targetStage > stage) {
        if (targetStage >= 2 && !validation.canProceedToStage2) {
          setFormTouched(true);
          return false;
        }
        if (targetStage >= 3 && !validation.canProceedToStage3) {
          setFormTouched(true);
          return false;
        }
      }

      setStage(targetStage);
      setFormTouched(true);
      return true;
    },
    [stage, validation, validateOnStageChange, setStage, setFormTouched],
  );

  // Filter update functions
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
      updateState({ showInactive: show });
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

  // Pagination functions
  const setPage = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, newPage);
      updateState({ page: validPage });
    },
    [updateState],
  );

  const setPageSize = useCallback(
    (newPageSize: number) => {
      const validPageSize = Math.max(1, Math.min(100, newPageSize));
      updateState({ pageSize: validPageSize, page: 1 });
    },
    [updateState],
  );

  const setTotalRecords = useCallback(
    (total: number) => {
      const validTotal = Math.max(0, total);
      updateState({ totalRecords: validTotal });
    },
    [updateState],
  );

  // Item management helpers
  const toggleItemSelection = useCallback(
    (itemId: string, quantity?: number, price?: number) => {
      const newSelected = new Set(selectedItems);
      const newQuantities = { ...quantities };
      const newPrices = { ...prices };

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
          quantity !== undefined ? quantity : quantities[itemId] || defaultQuantity;
        newPrices[itemId] =
          price !== undefined ? price : prices[itemId] || defaultPrice;
      }

      updateState({
        selectedItems: Array.from(newSelected),
        quantities: newQuantities,
        prices: newPrices,
      });
    },
    [
      selectedItems,
      quantities,
      prices,
      defaultQuantity,
      defaultPrice,
      preserveQuantitiesOnDeselect,
      updateState,
    ],
  );

  const clearAllSelections = useCallback(() => {
    const resetData: Partial<ExternalWithdrawalFormStateData> = {
      selectedItems: [],
    };

    if (!preserveQuantitiesOnDeselect) {
      resetData.quantities = {};
      resetData.prices = {};
    }

    updateState(resetData);
  }, [preserveQuantitiesOnDeselect, updateState]);

  const setItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      // Validate quantity is at least 0.01
      if (quantity < 0.01) {
        return;
      }

      // Ensure the item is selected and update quantity atomically
      const newSelected = new Set(selectedItems);
      newSelected.add(itemId); // Ensure item is selected

      const newQuantities = { ...quantities, [itemId]: quantity };

      updateState({
        selectedItems: Array.from(newSelected),
        quantities: newQuantities,
      });
    },
    [quantities, selectedItems, updateState],
  );

  const setItemPrice = useCallback(
    (itemId: string, price: number) => {
      // Validate price is at least 0
      if (price < 0) {
        return;
      }
      const newPrices = { ...prices, [itemId]: price };
      updatePrices(newPrices);
    },
    [prices, updatePrices],
  );

  // Get selected items with data
  const getSelectedItemsWithData = useCallback(() => {
    return Array.from(selectedItems).map((id) => ({
      id,
      quantity: quantities[id] || defaultQuantity,
      price: prices[id] || defaultPrice,
    }));
  }, [selectedItems, quantities, prices, defaultQuantity, defaultPrice]);

  // Form data helpers
  const getFormData = useCallback(() => {
    return {
      withdrawerName: withdrawerName.trim(),
      type,
      notes: notes.trim() || undefined,
      nfeId: nfeId || null,
      receiptId: receiptId || null,
      items: getSelectedItemsWithData().map((item) => ({
        itemId: item.id,
        quantity: item.quantity,
        unitPrice: item.price > 0 ? item.price : undefined,
      })),
    };
  }, [withdrawerName, type, notes, nfeId, receiptId, getSelectedItemsWithData]);

  const resetForm = useCallback(async () => {
    setState({
      ...DEFAULT_STATE,
      pageSize: defaultPageSize,
    });

    // Clear from storage immediately
    try {
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error("[ExternalWithdrawalForm] Failed to clear storage:", error);
    }
  }, [defaultPageSize, storageKey]);

  const resetFormData = useCallback(() => {
    updateState({
      withdrawerName: "",
      type: EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE,
      notes: "",
      nfeId: null,
      receiptId: null,
      formTouched: false,
    });
  }, [updateState]);

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

  // Check if form has any data
  const hasFormData = useMemo(() => {
    return (
      withdrawerName.trim() !== "" ||
      type !== EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE ||
      notes.trim() !== "" ||
      selectedItems.size > 0 ||
      nfeId !== null ||
      receiptId !== null
    );
  }, [withdrawerName, type, notes, selectedItems.size, nfeId, receiptId]);

  // Check if specific stages have data
  const stageHasData = useMemo(() => {
    return {
      stage1:
        withdrawerName.trim() !== "" ||
        type !== EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE ||
        notes.trim() !== "" ||
        nfeId !== null ||
        receiptId !== null,
      stage2: selectedItems.size > 0,
      stage3: true, // Review stage always accessible if previous stages are valid
    };
  }, [withdrawerName, type, notes, nfeId, receiptId, selectedItems.size]);

  // Form progress calculation
  const formProgress = useMemo(() => {
    let completed = 0;
    const total = 2; // 2 required stages (basic info + items)

    if (validation.stage1Valid) completed++;
    if (validation.stage2Valid) completed++;

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [validation.stage1Valid, validation.stage2Valid]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      showInactive !== false ||
      categoryIds.length > 0 ||
      brandIds.length > 0 ||
      supplierIds.length > 0 ||
      searchTerm !== ""
    );
  }, [showInactive, categoryIds, brandIds, supplierIds, searchTerm]);

  // Pagination computed values
  const totalPages = useMemo(
    () => (totalRecords > 0 ? Math.ceil(totalRecords / pageSize) : 1),
    [totalRecords, pageSize],
  );

  const hasNextPage = useMemo(
    () => page < totalPages,
    [page, totalPages],
  );

  const hasPrevPage = useMemo(() => page > 1, [page]);

  // Manual save function (for non-auto-save scenarios)
  const saveState = useCallback(async () => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(state));
      onStateChange?.(state);
      return true;
    } catch (error) {
      console.error("[ExternalWithdrawalForm] Failed to save state:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [state, storageKey, onStateChange]);

  // Load state manually
  const loadState = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ExternalWithdrawalFormStateData;
        setState((prev) => ({
          ...prev,
          ...parsed,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("[ExternalWithdrawalForm] Failed to load state:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  return {
    // Loading states
    isLoading,
    isSaving,

    // Stage Navigation State
    stage,
    validation,
    formTouched,
    formProgress,
    hasFormData,
    stageHasData,

    // Core Form State
    selectedItems,
    quantities,
    prices,
    withdrawerName,
    type,
    notes,
    nfeId,
    receiptId,

    // Filter and Pagination State
    showSelectedOnly,
    searchTerm,
    showInactive,
    categoryIds,
    brandIds,
    supplierIds,
    page,
    pageSize,
    totalRecords,

    // Stage Navigation Functions
    setStage,
    goToNextStage,
    goToPrevStage,
    goToStage,
    setFormTouched,

    // Form Data Update Functions
    updateSelectedItems,
    updateQuantities,
    updatePrices,
    updateWithdrawerName,
    updateType,
    updateNotes,
    updateNfeId,
    updateReceiptId,

    // Filter Update Functions
    setShowSelectedOnly,
    setSearchTerm,
    setShowInactive,
    setCategoryIds,
    setBrandIds,
    setSupplierIds,
    setPage,
    setPageSize,
    setTotalRecords,

    // Item Management Helper Functions
    toggleItemSelection,
    clearAllSelections,
    setItemQuantity,
    setItemPrice,
    getSelectedItemsWithData,

    // Form Management Helper Functions
    getFormData,
    resetForm,
    resetFormData,
    resetFilters,

    // State persistence functions
    saveState,
    loadState,

    // Computed Values
    selectionCount: selectedItems.size,
    hasActiveFilters,
    totalPages,
    hasNextPage,
    hasPrevPage,

    // Raw State Access (for advanced usage)
    state,
    updateState,
  };
}

/**
 * Usage Examples:
 *
 * Basic usage with stage navigation:
 * ```tsx
 * const {
 *   stage,
 *   validation,
 *   formTouched,
 *   isLoading,
 *   withdrawerName,
 *   type,
 *   notes,
 *   selectedItems,
 *   quantities,
 *   prices,
 *   goToNextStage,
 *   goToPrevStage,
 *   updateWithdrawerName,
 *   updateType,
 *   updateNotes,
 *   toggleItemSelection,
 *   getFormData,
 * } = useExternalWithdrawalFormState();
 *
 * if (isLoading) {
 *   return <LoadingSpinner />;
 * }
 *
 * // Stage 1: Basic Info Form
 * if (stage === 1) {
 *   return (
 *     <View>
 *       <TextInput
 *         value={withdrawerName}
 *         onChangeText={updateWithdrawerName}
 *         placeholder="Nome do retirador"
 *       />
 *       <Picker
 *         selectedValue={type}
 *         onValueChange={updateType}
 *       >
 *         <Picker.Item label="Retornável" value={EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE} />
 *         <Picker.Item label="Cobrável" value={EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE} />
 *         <Picker.Item label="Cortesia" value={EXTERNAL_WITHDRAWAL_TYPE.COMPLIMENTARY} />
 *       </Picker>
 *       <TextInput
 *         value={notes}
 *         onChangeText={updateNotes}
 *         placeholder="Observações (opcional)"
 *         multiline
 *       />
 *       {formTouched && validation.errors.withdrawerName && (
 *         <Text style={styles.error}>{validation.errors.withdrawerName}</Text>
 *       )}
 *       <Button
 *         onPress={goToNextStage}
 *         disabled={!validation.canProceedToStage2}
 *         title="Próximo"
 *       />
 *     </View>
 *   );
 * }
 *
 * // Stage 2: Item Selection
 * if (stage === 2) {
 *   return (
 *     <View>
 *       <FlatList
 *         data={items}
 *         keyExtractor={(item) => item.id}
 *         renderItem={({ item }) => (
 *           <View>
 *             <CheckBox
 *               value={selectedItems.has(item.id)}
 *               onValueChange={() => toggleItemSelection(item.id)}
 *             />
 *             <Text>{item.name}</Text>
 *             {selectedItems.has(item.id) && (
 *               <View>
 *                 <TextInput
 *                   keyboardType="numeric"
 *                   value={String(quantities[item.id] || 1)}
 *                   onChangeText={(text) =>
 *                     setItemQuantity(item.id, parseFloat(text) || 0)
 *                   }
 *                   placeholder="Quantidade"
 *                 />
 *                 {type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && (
 *                   <TextInput
 *                     keyboardType="numeric"
 *                     value={String(prices[item.id] || 0)}
 *                     onChangeText={(text) =>
 *                       setItemPrice(item.id, parseFloat(text) || 0)
 *                     }
 *                     placeholder="Preço (opcional)"
 *                   />
 *                 )}
 *               </View>
 *             )}
 *           </View>
 *         )}
 *       />
 *       {formTouched && validation.errors.selectedItems && (
 *         <Text style={styles.error}>{validation.errors.selectedItems}</Text>
 *       )}
 *       <Button onPress={goToPrevStage} title="Anterior" />
 *       <Button
 *         onPress={goToNextStage}
 *         disabled={!validation.canProceedToStage3}
 *         title="Próximo"
 *       />
 *     </View>
 *   );
 * }
 *
 * // Stage 3: Review and Submit
 * if (stage === 3) {
 *   const formData = getFormData();
 *
 *   return (
 *     <ScrollView>
 *       <Text style={styles.heading}>Revisão</Text>
 *       <Text>Retirador: {formData.withdrawerName}</Text>
 *       <Text>Tipo: {formData.type}</Text>
 *       <Text>Itens: {formData.items.length}</Text>
 *       <Button onPress={goToPrevStage} title="Anterior" />
 *       <Button
 *         onPress={() => onSubmit(formData)}
 *         disabled={!validation.canSubmit}
 *         title="Confirmar Retirada"
 *       />
 *     </ScrollView>
 *   );
 * }
 * ```
 *
 * Advanced usage with custom storage key and initial data:
 * ```tsx
 * const hook = useExternalWithdrawalFormState({
 *   storageKey: '@external_withdrawal_draft_123',
 *   defaultQuantity: 1,
 *   defaultPrice: 0,
 *   preserveQuantitiesOnDeselect: true,
 *   validateOnStageChange: false, // Manual validation
 *   autoSave: true,
 *   initialData: {
 *     withdrawerName: 'John Doe',
 *     type: EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE,
 *   },
 *   onStateChange: (state) => {
 *     console.log('Form state changed:', state);
 *   },
 * });
 *
 * const handleCustomNext = () => {
 *   if (hook.stage === 1 && !hook.validation.canProceedToStage2) {
 *     Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
 *     hook.setFormTouched(true);
 *     return;
 *   }
 *   hook.goToNextStage();
 * };
 * ```
 *
 * State monitoring and progress tracking:
 * ```tsx
 * const { formProgress, stageHasData, hasFormData, resetForm } = useExternalWithdrawalFormState();
 *
 * // Show progress bar
 * <View style={styles.progressContainer}>
 *   <View
 *     style={[styles.progressBar, { width: `${formProgress.percentage}%` }]}
 *   />
 *   <Text>
 *     {formProgress.completed} de {formProgress.total} etapas concluídas
 *   </Text>
 * </View>
 *
 * // Warn about unsaved changes
 * useEffect(() => {
 *   const handleBackButton = () => {
 *     if (hasFormData) {
 *       Alert.alert(
 *         'Descartar alterações?',
 *         'Você tem alterações não salvas. Deseja descartá-las?',
 *         [
 *           { text: 'Cancelar', style: 'cancel' },
 *           {
 *             text: 'Descartar',
 *             style: 'destructive',
 *             onPress: () => {
 *               resetForm();
 *               navigation.goBack();
 *             },
 *           },
 *         ]
 *       );
 *       return true;
 *     }
 *     return false;
 *   };
 *
 *   BackHandler.addEventListener('hardwareBackPress', handleBackButton);
 *   return () => BackHandler.removeEventListener('hardwareBackPress', handleBackButton);
 * }, [hasFormData, resetForm, navigation]);
 * ```
 *
 * File attachments usage:
 * ```tsx
 * const { nfeId, receiptId, updateNfeId, updateReceiptId } = useExternalWithdrawalFormState();
 *
 * const handleNfeUpload = async () => {
 *   const result = await DocumentPicker.getDocumentAsync({});
 *   if (result.type === 'success') {
 *     const uploadedId = await uploadDocument(result);
 *     updateNfeId(uploadedId);
 *   }
 * };
 *
 * const handleReceiptUpload = async () => {
 *   const result = await DocumentPicker.getDocumentAsync({});
 *   if (result.type === 'success') {
 *     const uploadedId = await uploadDocument(result);
 *     updateReceiptId(uploadedId);
 *   }
 * };
 * ```
 *
 * Manual state persistence:
 * ```tsx
 * const { saveState, loadState, resetForm } = useExternalWithdrawalFormState({
 *   autoSave: false, // Disable auto-save
 * });
 *
 * // Manually save state
 * const handleSaveDraft = async () => {
 *   const success = await saveState();
 *   if (success) {
 *     Alert.alert('Sucesso', 'Rascunho salvo!');
 *   }
 * };
 *
 * // Manually load state
 * const handleLoadDraft = async () => {
 *   const success = await loadState();
 *   if (success) {
 *     Alert.alert('Sucesso', 'Rascunho carregado!');
 *   }
 * };
 *
 * // Clear saved state
 * const handleClearDraft = async () => {
 *   await resetForm();
 *   Alert.alert('Sucesso', 'Rascunho removido!');
 * };
 * ```
 */
