# External Withdrawal Form Components (Mobile)

Complete set of mobile-optimized React Native form components for External Withdrawal management with 100% feature parity with web.

## Components Overview

### 1. ExternalWithdrawalCreateForm
**File:** `external-withdrawal-create-form.tsx` (420 lines)

3-stage wizard for creating external withdrawals:
- **Stage 1: Basic Info** - Withdrawer name, type, notes, file uploads
- **Stage 2: Item Selection** - Async pagination, filters, multi-select
- **Stage 3: Review** - Summary cards with total calculations

**Features:**
- Progress bar with stage indicators
- Mobile-optimized navigation (touch-friendly buttons)
- Form state persistence in AsyncStorage
- File upload support (receipts, invoices)
- Real-time validation
- Loading states and error handling

**Usage:**
```tsx
import { ExternalWithdrawalCreateForm } from "@/components/inventory/external-withdrawal/form";

export function CreateWithdrawalScreen() {
  return <ExternalWithdrawalCreateForm />;
}
```

---

### 2. ExternalWithdrawalEditForm
**File:** `external-withdrawal-edit-form.tsx` (490 lines)

Pre-populated edit form with change detection:
- Same 3-stage structure as create form
- Loads existing withdrawal data
- Detects and highlights changes
- Preserves original file attachments
- Only enables submit when changes are detected

**Features:**
- Change detection (withdrawer, type, notes, items, quantities, prices, files)
- Pre-fills all fields from existing withdrawal
- File management (view existing, upload new)
- Validation against original data

**Usage:**
```tsx
import { ExternalWithdrawalEditForm } from "@/components/inventory/external-withdrawal/form";

export function EditWithdrawalScreen({ withdrawal }) {
  return <ExternalWithdrawalEditForm withdrawal={withdrawal} />;
}
```

---

### 3. ExternalWithdrawalItemSelector
**File:** `external-withdrawal-item-selector.tsx` (380 lines)

Full-featured item selection component:
- Async pagination (20/40/60/100 items per page)
- Search with debouncing (300ms)
- Advanced filters (categories, brands, suppliers, inactive items)
- Show selected only toggle
- Multi-select with checkbox
- Inline quantity/price editing
- Real-time stock display

**Features:**
- FlatList with pull-to-refresh
- Filter modal integration
- Active filter indicators with badges
- Select all (current page)
- Optimized rendering for large lists
- Loading and empty states

**Usage:**
```tsx
import { ExternalWithdrawalItemSelector } from "@/components/inventory/external-withdrawal/form";

<ExternalWithdrawalItemSelector
  selectedItems={selectedItems}
  quantities={quantities}
  prices={prices}
  type={type}
  showSelectedOnly={showSelectedOnly}
  searchTerm={searchTerm}
  page={page}
  pageSize={pageSize}
  onSelectItem={toggleItemSelection}
  onQuantityChange={setItemQuantity}
  onPriceChange={setItemPrice}
  onShowSelectedOnlyChange={setShowSelectedOnly}
  onSearchTermChange={setSearchTerm}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>
```

---

### 4. ExternalWithdrawalItemCard
**File:** `external-withdrawal-item-card.tsx` (185 lines)

Individual item card for selected items:
- Display item details (code, name, brand, category)
- Current and final stock calculation
- Stock warnings (negative stock highlight)
- Inline quantity editing (NumberInput)
- Inline price editing (CurrencyInput) - for CHARGEABLE type
- Remove button
- Custom price badge

**Features:**
- Stock validation with visual warnings
- Responsive layout (adapts to screen size)
- Type-aware (shows/hides price based on withdrawal type)
- Accessibility labels

**Usage:**
```tsx
import { ExternalWithdrawalItemCard } from "@/components/inventory/external-withdrawal/form";

<ExternalWithdrawalItemCard
  itemId={item.id}
  itemName={item.name}
  itemCode={item.uniCode}
  itemBrand={item.brand?.name}
  itemCategory={item.category?.name}
  currentStock={item.quantity}
  itemPrice={item.prices[0]?.value}
  quantity={quantities[item.id]}
  unitPrice={prices[item.id]}
  type={type}
  onQuantityChange={(qty) => setItemQuantity(item.id, qty)}
  onPriceChange={(price) => setItemPrice(item.id, price)}
  onRemove={() => toggleItemSelection(item.id)}
/>
```

---

### 5. ExternalWithdrawalSummaryCards
**File:** `external-withdrawal-summary-cards.tsx` (270 lines)

Summary display for review stage:
- **Basic Info Card** - Withdrawer, type, notes
- **Items Summary Card** - Item count, total quantity
- **Total Calculation Card** - For CHARGEABLE type only

**Features:**
- Icon badges for visual hierarchy
- Color-coded type badges
- Stats grid with counters
- Currency formatting
- Responsive layout
- Empty state handling

**Usage:**
```tsx
import { ExternalWithdrawalSummaryCards } from "@/components/inventory/external-withdrawal/form";

<ExternalWithdrawalSummaryCards
  withdrawerName={withdrawerName}
  type={type}
  notes={notes}
  selectedItems={selectedItems}
  quantities={quantities}
  prices={prices}
  totalPrice={totalPrice}
/>
```

---

### 6. ExternalWithdrawalFormFilters
**File:** `external-withdrawal-form-filters.tsx` (260 lines)

Filter modal component:
- **Basic Tab** - Show inactive items toggle
- **Entities Tab** - Categories, brands, suppliers (multi-select)
- Active filter count badge
- Clear all functionality
- Apply/Cancel actions

**Features:**
- Tabbed interface (Basic / Entities)
- Multi-select comboboxes with search
- Local state (only applies on "Apply")
- Filter count display
- Loading states for async data
- Mobile-optimized modal

**Usage:**
```tsx
import { ExternalWithdrawalFormFilters } from "@/components/inventory/external-withdrawal/form";

<ExternalWithdrawalFormFilters
  open={isFilterModalOpen}
  onOpenChange={setIsFilterModalOpen}
  showInactive={showInactive}
  categoryIds={categoryIds}
  brandIds={brandIds}
  supplierIds={supplierIds}
  onShowInactiveChange={setShowInactive}
  onCategoryIdsChange={setCategoryIds}
  onBrandIdsChange={setBrandIds}
  onSupplierIdsChange={setSupplierIds}
/>
```

---

## State Management

All form components use the **`useExternalWithdrawalFormState`** hook for state management:

```tsx
import { useExternalWithdrawalFormState } from "@/hooks/use-external-withdrawal-form-state";

const {
  // Stage navigation
  stage,
  validation,
  formTouched,
  formProgress,

  // Form data
  withdrawerName,
  type,
  notes,
  nfeId,
  receiptId,

  // Selection state
  selectedItems,
  quantities,
  prices,

  // Filter state
  showSelectedOnly,
  searchTerm,
  showInactive,
  categoryIds,
  brandIds,
  supplierIds,

  // Pagination state
  page,
  pageSize,
  totalRecords,

  // Actions
  goToNextStage,
  goToPrevStage,
  updateWithdrawerName,
  updateType,
  updateNotes,
  toggleItemSelection,
  setItemQuantity,
  setItemPrice,
  getFormData,
  resetForm,
} = useExternalWithdrawalFormState({
  storageKey: "@external_withdrawal_create_form",
  defaultQuantity: 1,
  defaultPrice: 0,
  validateOnStageChange: true,
  autoSave: true,
});
```

### Key Features:
- **AsyncStorage persistence** - Survives app restarts
- **3-stage wizard** with validation
- **URL-like state management** adapted for mobile
- **Change detection** for edit forms
- **Progress tracking** (percentage, completed stages)
- **Auto-save** with debouncing (500ms)

---

## Integration Example

Complete example integrating all components:

```tsx
import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import {
  ExternalWithdrawalCreateForm,
  ExternalWithdrawalEditForm,
} from "@/components/inventory/external-withdrawal/form";
import { useExternalWithdrawal } from "@/hooks";

// Create Screen
export function CreateExternalWithdrawalScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ExternalWithdrawalCreateForm />
    </View>
  );
}

// Edit Screen
export function EditExternalWithdrawalScreen({ id }) {
  const { data: withdrawal, isLoading } = useExternalWithdrawal(id);

  if (isLoading) return <LoadingSpinner />;
  if (!withdrawal) return <NotFound />;

  return (
    <View style={{ flex: 1 }}>
      <ExternalWithdrawalEditForm withdrawal={withdrawal} />
    </View>
  );
}
```

---

## Component Architecture

```
external-withdrawal/form/
├── external-withdrawal-create-form.tsx      (420 lines) - 3-stage wizard
├── external-withdrawal-edit-form.tsx        (490 lines) - Edit with change detection
├── external-withdrawal-item-selector.tsx    (380 lines) - Async item selector
├── external-withdrawal-item-card.tsx        (185 lines) - Item display card
├── external-withdrawal-summary-cards.tsx    (270 lines) - Review summaries
├── external-withdrawal-form-filters.tsx     (260 lines) - Filter modal
├── external-withdrawal-form-utils.ts        (existing)  - Utility functions
├── external-withdrawal-form-validation.ts   (existing)  - Validation logic
├── index.tsx                                 (new)      - Component exports
└── README.md                                 (this file)
```

---

## Feature Parity with Web

### ✅ Create Form (100%)
- ✅ 3-stage wizard
- ✅ Progress indicators
- ✅ Basic info form (withdrawer, type, notes)
- ✅ File uploads (receipts, invoices)
- ✅ Item selection with pagination
- ✅ Advanced filters
- ✅ Quantity/price inputs
- ✅ Review and confirmation
- ✅ Validation per stage
- ✅ AsyncStorage persistence

### ✅ Edit Form (100%)
- ✅ Pre-populated fields
- ✅ Change detection
- ✅ File management
- ✅ Same structure as create
- ✅ Validation
- ✅ Submit only when changed

### ✅ Item Selector (100%)
- ✅ Async pagination (20/40/60/100)
- ✅ Search with debouncing
- ✅ All filters (category, brand, supplier, inactive)
- ✅ Show selected only toggle
- ✅ Multi-select checkboxes
- ✅ Inline quantity/price editing
- ✅ Stock display
- ✅ Select all (current page)
- ✅ Pull-to-refresh
- ✅ Loading states

### ✅ Item Card (100%)
- ✅ Display all item info
- ✅ Stock calculation
- ✅ Stock warnings
- ✅ Quantity input (NumberInput)
- ✅ Price input (CurrencyInput)
- ✅ Remove button
- ✅ Custom price badge

### ✅ Summary Cards (100%)
- ✅ Basic info summary
- ✅ Items list summary
- ✅ Total calculation (CHARGEABLE)
- ✅ Icon badges
- ✅ Stats counters
- ✅ Currency formatting

### ✅ Filters (100%)
- ✅ Filter modal
- ✅ Tabbed interface
- ✅ Show inactive toggle
- ✅ Category multi-select
- ✅ Brand multi-select
- ✅ Supplier multi-select
- ✅ Filter indicators/badges
- ✅ Clear all
- ✅ Apply/Cancel

---

## Mobile Optimizations

### Touch-First Design
- Large touch targets (min 44x44 dp)
- Swipe gestures for navigation
- Pull-to-refresh for data
- Native keyboard handling

### Performance
- FlatList for efficient rendering
- Debounced search (300ms)
- Lazy loading with pagination
- Optimized re-renders with useMemo/useCallback

### UX Enhancements
- Progress bars with percentages
- Visual stage indicators
- Inline validation messages
- Loading spinners
- Empty states
- Error boundaries

### Persistence
- AsyncStorage for form state
- Survives app restarts
- Auto-save (debounced 500ms)
- Draft recovery

---

## TypeScript Support

All components are fully typed:

```tsx
interface ExternalWithdrawalCreateFormProps {
  // No props - uses internal state hook
}

interface ExternalWithdrawalEditFormProps {
  withdrawal: ExternalWithdrawal & {
    items: ExternalWithdrawalItem[];
  };
}

interface ExternalWithdrawalItemSelectorProps {
  selectedItems: Set<string>;
  quantities: Record<string, number>;
  prices: Record<string, number>;
  type: EXTERNAL_WITHDRAWAL_TYPE;
  // ... all state and callbacks
}

interface ExternalWithdrawalItemCardProps {
  itemId: string;
  itemName: string;
  itemCode?: string | null;
  itemBrand?: string | null;
  itemCategory?: string | null;
  currentStock: number;
  itemPrice?: number | null;
  quantity: number;
  unitPrice?: number | null;
  type: EXTERNAL_WITHDRAWAL_TYPE;
  onQuantityChange: (quantity: number) => void;
  onPriceChange?: (price: number) => void;
  onRemove: () => void;
}

interface ExternalWithdrawalSummaryCardsProps {
  withdrawerName: string;
  type: EXTERNAL_WITHDRAWAL_TYPE;
  notes?: string;
  selectedItems: Set<string>;
  quantities: Record<string, number>;
  prices: Record<string, number>;
  totalPrice?: number;
}

interface ExternalWithdrawalFormFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showInactive?: boolean;
  categoryIds?: string[];
  brandIds?: string[];
  supplierIds?: string[];
  onShowInactiveChange?: (value: boolean) => void;
  onCategoryIdsChange?: (ids: string[]) => void;
  onBrandIdsChange?: (ids: string[]) => void;
  onSupplierIdsChange?: (ids: string[]) => void;
}
```

---

## Testing

All components support testing:

```tsx
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { ExternalWithdrawalCreateForm } from "@/components/inventory/external-withdrawal/form";

describe("ExternalWithdrawalCreateForm", () => {
  it("renders 3 stages", () => {
    const { getByText } = render(<ExternalWithdrawalCreateForm />);
    expect(getByText("Informações Básicas")).toBeTruthy();
  });

  it("validates stage 1 before proceeding", async () => {
    const { getByText, getByPlaceholderText } = render(<ExternalWithdrawalCreateForm />);

    const nextButton = getByText("Próximo");
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(getByText(/Nome do retirador/)).toBeTruthy();
    });
  });
});
```

---

## Dependencies

### Required UI Components:
- Button, Card, Input, Combobox, Badge, Chip
- Switch, Checkbox, FormLabel, Modal, Tabs
- Text, View, ScrollView, FlatList
- NumberInput, CurrencyInput, FileUpload
- ProgressBar, Pagination, Separator

### Required Hooks:
- useExternalWithdrawalFormState
- useExternalWithdrawalMutations
- useItems, useItemCategories, useItemBrands, useSuppliers

### Required Utils:
- formatCurrency, formatDate
- createWithdrawalFormData

---

## Accessibility

All components follow accessibility best practices:
- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatible
- Color contrast compliance
- Focus management

---

## Future Enhancements

Potential improvements:
- [ ] Offline mode support
- [ ] Barcode scanner integration
- [ ] Camera for receipt capture
- [ ] Voice input for notes
- [ ] Signature capture
- [ ] GPS location tracking
- [ ] Multi-language support
- [ ] Dark mode optimization

---

## Contributing

When adding new features:
1. Maintain TypeScript strict mode
2. Follow mobile design system
3. Add proper error handling
4. Include loading states
5. Test on both iOS and Android
6. Update this README

---

## License

Internal use only - Ankaa Design
