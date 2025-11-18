# External Withdrawal Form State Hook (Mobile)

## Overview

The `useExternalWithdrawalFormState` hook provides comprehensive state management for External Withdrawal forms in the mobile application. It handles all aspects of the multi-stage form process, including selection management, validation, filtering, pagination, and persistent storage using AsyncStorage.

## File Location

```
/home/kennedy/Documents/repositories/mobile/src/hooks/use-external-withdrawal-form-state.ts
```

## Key Features

### 1. Multi-Stage Navigation (3 Stages)
- **Stage 1**: Basic Information (withdrawer name, type, notes, attachments)
- **Stage 2**: Item Selection (select items, configure quantities and prices)
- **Stage 3**: Review & Submit (review all data before submission)

### 2. State Persistence
- Uses AsyncStorage for automatic state persistence
- Survives app restarts and navigations
- Configurable auto-save with debouncing
- Manual save/load support

### 3. Item Selection Management
- Add/remove items from selection
- Configure quantity per item (minimum 0.01)
- Configure price per item (minimum 0)
- Bulk selection operations
- Optional preservation of quantities on deselection

### 4. Form Data Management
- Withdrawer name (required, min 2 characters)
- Withdrawal type (RETURNABLE, CHARGEABLE, COMPLIMENTARY)
- Notes (optional, max 500 characters)
- NFe attachment (optional file reference)
- Receipt attachment (optional file reference)

### 5. Validation System
- Stage-level validation
- Field-level validation with error messages
- Real-time validation state
- Progress tracking (percentage complete)

### 6. Filtering & Search
- Text search
- Category filtering
- Brand filtering
- Supplier filtering
- Show inactive items toggle
- Show selected only mode

### 7. Pagination Support
- Configurable page size
- Total records tracking
- Next/previous page helpers
- Auto-reset on filter changes

## All Exported Features

### State Values

```typescript
{
  // Loading States
  isLoading: boolean;           // True while loading from storage
  isSaving: boolean;            // True while saving to storage

  // Stage Navigation
  stage: 1 | 2 | 3;            // Current stage
  validation: {                 // Validation state
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
  };
  formTouched: boolean;         // User has interacted with form
  formProgress: {               // Progress tracking
    completed: number;
    total: number;
    percentage: number;
  };
  hasFormData: boolean;         // Form has any data
  stageHasData: {              // Stage-specific data status
    stage1: boolean;
    stage2: boolean;
    stage3: boolean;
  };

  // Selection State
  selectedItems: Set<string>;                    // Selected item IDs
  quantities: Record<string, number>;            // Item quantities
  prices: Record<string, number>;                // Item prices
  selectionCount: number;                        // Count of selected items

  // Form Data
  withdrawerName: string;                        // Withdrawer name
  type: EXTERNAL_WITHDRAWAL_TYPE;                // Withdrawal type
  notes: string;                                 // Optional notes
  nfeId: string | null;                          // NFe file reference
  receiptId: string | null;                      // Receipt file reference

  // Filters
  showSelectedOnly: boolean;                     // Show only selected items
  searchTerm: string;                            // Search filter
  showInactive: boolean;                         // Include inactive items
  categoryIds: string[];                         // Category filter
  brandIds: string[];                            // Brand filter
  supplierIds: string[];                         // Supplier filter
  hasActiveFilters: boolean;                     // Any filters active

  // Pagination
  page: number;                                  // Current page (1-indexed)
  pageSize: number;                              // Items per page
  totalRecords: number;                          // Total records count
  totalPages: number;                            // Total pages count
  hasNextPage: boolean;                          // Has next page
  hasPrevPage: boolean;                          // Has previous page

  // Raw State
  state: ExternalWithdrawalFormStateData;        // Complete state object
}
```

### Update Functions

```typescript
{
  // Stage Navigation
  setStage: (stage: 1 | 2 | 3) => void;
  goToNextStage: () => boolean;                  // Returns false if validation fails
  goToPrevStage: () => boolean;
  goToStage: (stage: 1 | 2 | 3) => boolean;     // Returns false if validation fails
  setFormTouched: (touched: boolean) => void;

  // Form Data Updates
  updateSelectedItems: (items: Set<string>) => void;
  updateQuantities: (quantities: Record<string, number>) => void;
  updatePrices: (prices: Record<string, number>) => void;
  updateWithdrawerName: (name: string) => void;
  updateType: (type: EXTERNAL_WITHDRAWAL_TYPE) => void;
  updateNotes: (notes: string) => void;
  updateNfeId: (id: string | null) => void;
  updateReceiptId: (id: string | null) => void;

  // Item Management Helpers
  toggleItemSelection: (itemId: string, quantity?: number, price?: number) => void;
  clearAllSelections: () => void;
  setItemQuantity: (itemId: string, quantity: number) => void;
  setItemPrice: (itemId: string, price: number) => void;
  getSelectedItemsWithData: () => Array<{
    id: string;
    quantity: number;
    price: number;
  }>;

  // Filter Updates
  setShowSelectedOnly: (show: boolean) => void;
  setSearchTerm: (term: string) => void;
  setShowInactive: (show: boolean) => void;
  setCategoryIds: (ids: string[]) => void;
  setBrandIds: (ids: string[]) => void;
  setSupplierIds: (ids: string[]) => void;

  // Pagination Updates
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalRecords: (total: number) => void;

  // Form Management
  getFormData: () => {
    withdrawerName: string;
    type: EXTERNAL_WITHDRAWAL_TYPE;
    notes?: string;
    nfeId: string | null;
    receiptId: string | null;
    items: Array<{
      itemId: string;
      quantity: number;
      unitPrice?: number;
    }>;
  };
  resetForm: () => Promise<void>;               // Clears form and storage
  resetFormData: () => void;                    // Resets only form fields
  resetFilters: () => void;                     // Resets only filters

  // State Persistence
  saveState: () => Promise<boolean>;            // Manual save
  loadState: () => Promise<boolean>;            // Manual load
  updateState: (updates: Partial<ExternalWithdrawalFormStateData>) => void;
}
```

## Configuration Options

```typescript
interface UseExternalWithdrawalFormStateOptions {
  // Storage configuration
  storageKey?: string;                          // Default: '@external_withdrawal_form'

  // Default values
  defaultQuantity?: number;                     // Default: 1
  defaultPrice?: number;                        // Default: 0
  defaultPageSize?: number;                     // Default: 40

  // Behavior options
  preserveQuantitiesOnDeselect?: boolean;       // Default: false
  validateOnStageChange?: boolean;              // Default: true
  autoSave?: boolean;                           // Default: true

  // Initial state
  initialData?: Partial<ExternalWithdrawalFormStateData>;

  // Callbacks
  onStateChange?: (state: ExternalWithdrawalFormStateData) => void;
}
```

## Usage Examples

### Basic Usage

```typescript
import { useExternalWithdrawalFormState } from '@/hooks';
import { EXTERNAL_WITHDRAWAL_TYPE } from '@/constants';

function ExternalWithdrawalForm() {
  const {
    stage,
    validation,
    formTouched,
    isLoading,
    withdrawerName,
    type,
    selectedItems,
    goToNextStage,
    goToPrevStage,
    updateWithdrawerName,
    updateType,
    toggleItemSelection,
  } = useExternalWithdrawalFormState();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View>
      {stage === 1 && (
        <Stage1BasicInfo
          withdrawerName={withdrawerName}
          type={type}
          validation={validation}
          formTouched={formTouched}
          onWithdrawerNameChange={updateWithdrawerName}
          onTypeChange={updateType}
          onNext={goToNextStage}
        />
      )}

      {stage === 2 && (
        <Stage2ItemSelection
          selectedItems={selectedItems}
          validation={validation}
          formTouched={formTouched}
          onToggleItem={toggleItemSelection}
          onNext={goToNextStage}
          onPrev={goToPrevStage}
        />
      )}

      {stage === 3 && (
        <Stage3Review
          onPrev={goToPrevStage}
          onSubmit={handleSubmit}
        />
      )}
    </View>
  );
}
```

### Advanced Configuration

```typescript
const {
  stage,
  validation,
  hasFormData,
  formProgress,
  saveState,
  resetForm,
} = useExternalWithdrawalFormState({
  storageKey: '@external_withdrawal_draft',
  defaultQuantity: 1,
  defaultPrice: 0,
  preserveQuantitiesOnDeselect: true,
  validateOnStageChange: true,
  autoSave: true,
  initialData: {
    type: EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE,
  },
  onStateChange: (state) => {
    console.log('Form state updated:', state);
  },
});
```

### With File Attachments

```typescript
import DocumentPicker from 'react-native-document-picker';
import { uploadFile } from '@/api/files';

function ExternalWithdrawalFormWithAttachments() {
  const {
    nfeId,
    receiptId,
    updateNfeId,
    updateReceiptId,
  } = useExternalWithdrawalFormState();

  const handleNfeUpload = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });

      const uploadedFile = await uploadFile(result);
      updateNfeId(uploadedFile.id);

      Alert.alert('Sucesso', 'NFe anexada com sucesso!');
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert('Erro', 'Falha ao anexar NFe');
      }
    }
  };

  const handleReceiptUpload = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
      });

      const uploadedFile = await uploadFile(result);
      updateReceiptId(uploadedFile.id);

      Alert.alert('Sucesso', 'Comprovante anexado com sucesso!');
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert('Erro', 'Falha ao anexar comprovante');
      }
    }
  };

  return (
    <View>
      <Button title="Anexar NFe" onPress={handleNfeUpload} />
      {nfeId && <Text>NFe anexada: {nfeId}</Text>}

      <Button title="Anexar Comprovante" onPress={handleReceiptUpload} />
      {receiptId && <Text>Comprovante anexado: {receiptId}</Text>}
    </View>
  );
}
```

### With Item Selection and Configuration

```typescript
import { FlatList, TextInput, CheckBox } from 'react-native';

function ItemSelectionScreen() {
  const {
    selectedItems,
    quantities,
    prices,
    type,
    searchTerm,
    toggleItemSelection,
    setItemQuantity,
    setItemPrice,
    setSearchTerm,
  } = useExternalWithdrawalFormState();

  const { data: items } = useItemsInfiniteMobile({
    searchTerm,
    // ... other filters
  });

  return (
    <View>
      <TextInput
        placeholder="Buscar itens..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <CheckBox
              value={selectedItems.has(item.id)}
              onValueChange={() => toggleItemSelection(item.id)}
            />
            <Text>{item.name}</Text>

            {selectedItems.has(item.id) && (
              <View style={styles.configuration}>
                <TextInput
                  keyboardType="decimal-pad"
                  placeholder="Quantidade"
                  value={String(quantities[item.id] || 1)}
                  onChangeText={(text) => {
                    const value = parseFloat(text) || 0;
                    setItemQuantity(item.id, value);
                  }}
                />

                {type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && (
                  <TextInput
                    keyboardType="decimal-pad"
                    placeholder="Preço"
                    value={String(prices[item.id] || 0)}
                    onChangeText={(text) => {
                      const value = parseFloat(text) || 0;
                      setItemPrice(item.id, value);
                    }}
                  />
                )}
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}
```

### With Progress Tracking

```typescript
function FormProgressIndicator() {
  const { formProgress, stage, stageHasData } = useExternalWithdrawalFormState();

  return (
    <View style={styles.progressContainer}>
      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${formProgress.percentage}%` },
          ]}
        />
      </View>

      {/* Progress Text */}
      <Text style={styles.progressText}>
        {formProgress.completed} de {formProgress.total} etapas concluídas
        ({formProgress.percentage}%)
      </Text>

      {/* Stage Indicators */}
      <View style={styles.stageIndicators}>
        <StageIndicator
          number={1}
          label="Informações"
          active={stage === 1}
          complete={stageHasData.stage1}
        />
        <StageIndicator
          number={2}
          label="Itens"
          active={stage === 2}
          complete={stageHasData.stage2}
        />
        <StageIndicator
          number={3}
          label="Revisão"
          active={stage === 3}
          complete={false}
        />
      </View>
    </View>
  );
}
```

### With Unsaved Changes Warning

```typescript
import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';

function ExternalWithdrawalFormScreen({ navigation }) {
  const { hasFormData, resetForm } = useExternalWithdrawalFormState();

  useEffect(() => {
    const handleBackButton = () => {
      if (hasFormData) {
        Alert.alert(
          'Descartar alterações?',
          'Você tem alterações não salvas. Deseja descartá-las?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Descartar',
              style: 'destructive',
              onPress: async () => {
                await resetForm();
                navigation.goBack();
              },
            },
          ]
        );
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackButton);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackButton);
    };
  }, [hasFormData, resetForm, navigation]);

  // ... rest of component
}
```

### With Manual State Persistence

```typescript
function DraftManagement() {
  const {
    saveState,
    loadState,
    resetForm,
    isSaving,
    hasFormData,
  } = useExternalWithdrawalFormState({
    autoSave: false, // Disable auto-save
  });

  const handleSaveDraft = async () => {
    const success = await saveState();
    if (success) {
      Alert.alert('Sucesso', 'Rascunho salvo com sucesso!');
    } else {
      Alert.alert('Erro', 'Falha ao salvar rascunho');
    }
  };

  const handleLoadDraft = async () => {
    const success = await loadState();
    if (success) {
      Alert.alert('Sucesso', 'Rascunho carregado com sucesso!');
    } else {
      Alert.alert('Info', 'Nenhum rascunho encontrado');
    }
  };

  const handleClearDraft = async () => {
    Alert.alert(
      'Confirmar',
      'Deseja remover o rascunho salvo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await resetForm();
            Alert.alert('Sucesso', 'Rascunho removido!');
          },
        },
      ]
    );
  };

  return (
    <View>
      <Button
        title="Salvar Rascunho"
        onPress={handleSaveDraft}
        disabled={!hasFormData || isSaving}
      />
      <Button title="Carregar Rascunho" onPress={handleLoadDraft} />
      <Button title="Remover Rascunho" onPress={handleClearDraft} />
      {isSaving && <ActivityIndicator />}
    </View>
  );
}
```

### With Filtering and Pagination

```typescript
function ItemList() {
  const {
    searchTerm,
    categoryIds,
    brandIds,
    showInactive,
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,
    hasActiveFilters,
    setSearchTerm,
    setCategoryIds,
    setBrandIds,
    setShowInactive,
    setPage,
    resetFilters,
  } = useExternalWithdrawalFormState();

  return (
    <View>
      {/* Filters */}
      <TextInput
        placeholder="Buscar..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <CategoryPicker
        selectedIds={categoryIds}
        onChange={setCategoryIds}
      />

      <BrandPicker
        selectedIds={brandIds}
        onChange={setBrandIds}
      />

      <Switch
        value={showInactive}
        onValueChange={setShowInactive}
      />

      {hasActiveFilters && (
        <Button title="Limpar Filtros" onPress={resetFilters} />
      )}

      {/* Pagination */}
      <View style={styles.pagination}>
        <Button
          title="Anterior"
          onPress={() => setPage(page - 1)}
          disabled={!hasPrevPage}
        />
        <Text>Página {page} de {totalPages}</Text>
        <Button
          title="Próximo"
          onPress={() => setPage(page + 1)}
          disabled={!hasNextPage}
        />
      </View>
    </View>
  );
}
```

### Complete Form Submission

```typescript
function ReviewAndSubmit() {
  const {
    getFormData,
    validation,
    resetForm,
  } = useExternalWithdrawalFormState();

  const createMutation = useCreateExternalWithdrawal();

  const handleSubmit = async () => {
    if (!validation.canSubmit) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const formData = getFormData();

      await createMutation.mutateAsync({
        withdrawerName: formData.withdrawerName,
        type: formData.type,
        status: EXTERNAL_WITHDRAWAL_STATUS.PENDING,
        notes: formData.notes || null,
        nfeId: formData.nfeId,
        receiptId: formData.receiptId,
        items: formData.items.map(item => ({
          itemId: item.itemId,
          withdrawedQuantity: item.quantity,
          price: item.unitPrice || null,
        })),
      });

      Alert.alert('Sucesso', 'Retirada externa criada com sucesso!');
      await resetForm();
      navigation.navigate('ExternalWithdrawalList');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar retirada externa');
      console.error('Submission error:', error);
    }
  };

  return (
    <Button
      title="Confirmar Retirada"
      onPress={handleSubmit}
      disabled={!validation.canSubmit || createMutation.isLoading}
    />
  );
}
```

## Integration Points

### 1. With External Withdrawal API Hooks
```typescript
import {
  useCreateExternalWithdrawal,
  useUpdateExternalWithdrawal,
} from '@/hooks';
```

### 2. With Items API and Filters
```typescript
import { useItemsInfiniteMobile } from '@/hooks';
import { Item } from '@/types';
```

### 3. With File Upload API
```typescript
import { useUploadFile } from '@/hooks';
```

### 4. With Form Utilities
```typescript
import {
  calculateExternalWithdrawalTotals,
  validateExternalWithdrawalForm,
} from '@/components/inventory/external-withdrawal/form/external-withdrawal-form-utils';
```

### 5. With Navigation
```typescript
import { useNavigation } from '@react-navigation/native';
import type { ExternalWithdrawalStackParamList } from '@/navigation/types';
```

## Type Definitions

### ExternalWithdrawalFormStateData
```typescript
interface ExternalWithdrawalFormStateData {
  stage: ExternalWithdrawalFormStage;
  formTouched: boolean;
  selectedItems: string[];
  quantities: Record<string, number>;
  prices: Record<string, number>;
  withdrawerName: string;
  type: EXTERNAL_WITHDRAWAL_TYPE;
  notes: string;
  nfeId?: string | null;
  receiptId?: string | null;
  showSelectedOnly: boolean;
  searchTerm: string;
  showInactive: boolean;
  categoryIds: string[];
  brandIds: string[];
  supplierIds: string[];
  page: number;
  pageSize: number;
  totalRecords: number;
}
```

### ExternalWithdrawalFormValidationState
```typescript
interface ExternalWithdrawalFormValidationState {
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
```

## Best Practices

1. **Always check loading state** before rendering form content
2. **Use validation state** to control navigation and submission
3. **Handle unsaved changes** with proper warnings
4. **Clear form** after successful submission
5. **Provide feedback** during save/load operations
6. **Validate quantities and prices** before submission
7. **Use debounced search** for better UX
8. **Reset to page 1** when changing filters
9. **Show progress indicators** for multi-stage forms
10. **Test error scenarios** (storage failures, validation errors)

## Performance Considerations

1. Auto-save is debounced (500ms) to prevent excessive storage writes
2. State updates are batched where possible
3. Memoized values prevent unnecessary re-renders
4. AsyncStorage operations are asynchronous and non-blocking
5. Form data is validated only when needed

## Differences from Web Version

1. **Storage**: Uses AsyncStorage instead of URL state
2. **File Attachments**: Includes nfeId and receiptId fields
3. **Loading States**: Provides isLoading and isSaving states
4. **Mobile Navigation**: Optimized for mobile navigation patterns
5. **Manual Persistence**: Offers manual save/load functions
6. **State Callbacks**: Supports onStateChange callback
7. **No URL Filters Hook**: Standalone implementation without dependencies

## Testing Recommendations

1. Test form persistence across app restarts
2. Test validation at each stage
3. Test file attachment uploads
4. Test filter and pagination interactions
5. Test unsaved changes warnings
6. Test manual save/load operations
7. Test error scenarios (storage failures)
8. Test with various withdrawal types
9. Test quantity and price validations
10. Test stage navigation edge cases
