# Borrow Forms - Quick Reference Guide

## Form Availability Matrix

| Form Type | Web | Mobile | Notes |
|-----------|-----|--------|-------|
| Single Create | Yes | No | Mobile must use batch with 1 item |
| Batch Create | Yes | Yes | Different UX approaches |
| Edit | Yes | No | Web only allows editing active borrows |
| Return | Yes (dedicated) | Yes (dedicated) | Separate from edit on both |
| Mark as Lost | Yes (button) | Yes | Embedded in return flow |

---

## Field Comparison by Form

### Create Forms

#### Web Single & Batch
```
ITEM SELECTION
├── Search: uniCode, name
├── Filter: isActive=true, quantity>0, type=TOOL
├── Display: uniCode - name, Estoque: X
└── Async loaded

QUANTITY
├── Type: Number input
├── Min: 1
├── Max: availableQuantity
├── Help text shows available

USER SELECTION
├── Async paginated (50 per page)
├── Search: name, email, cpf
├── Filter: isActive=true
├── Display: name - position - sector
└── Status validation

DISPLAY
├── Item summary
├── Category badge
├── Validation warnings
└── Stock info
```

#### Mobile Batch Only
```
USER SELECTION (Global)
├── Combobox
├── Search enabled
├── Shows: name
└── Required

ITEM ADDITION (Manual List)
├── Search & add one at a time
├── Shows: name, brand
├── Max 50 items
├── Counter: X/50
└── No pagination

QUANTITY (Per Item)
├── Editable in list
├── Default: 1
├── Inline number input
└── Remove button per item
```

---

## Validation Rules Quick Reference

### Before Create

| Validation | Single Web | Batch Web | Batch Mobile | When |
|-----------|-----------|-----------|------------|------|
| User selected | Yes | Yes | Yes | Always |
| User active | Yes | Yes | No | Create time |
| Item selected | Yes | Yes | Yes | Always |
| Item is TOOL | Yes | Yes | Implicit | Create time |
| Item active | Yes | Yes | Implicit | Create time |
| Qty > 0 | Yes | Yes | Yes | Always |
| Qty integer | No | Yes | Yes | Batch only |
| Qty <= available | Yes | Yes | Server | Create time |
| Max 50 items | - | Yes | Yes | Batch |
| No duplicates | - | Yes | Yes | Batch |

### Before Return

| Check | Web | Mobile |
|-------|-----|--------|
| Not already returned | Yes | Yes |
| Not marked lost | Yes | Yes |
| Item info exists | Yes | No |
| User info exists | Yes | No |
| Item still TOOL | Yes | No |
| User still active | Warning | No |
| Borrow < 365 days | Yes | No |

---

## Form Field Details

### Item Selector

#### Web (Async Pagination)
```
Component: Combobox (async)
Query: /api/items
Page size: 50
Search fields: name, uniCode
Filters:
  - isActive: true
  - quantity: > 0
  - category.type: TOOL
Display:
  - uniCode - name
  - Description: Estoque: X
Events:
  - onChange -> fetch item details
  - Validation triggered
```

#### Mobile (Simple Search)
```
Component: Combobox
Query: /api/items
Search fields: name
Filters: Implicit (category filter)
Display:
  - name - brand
Events:
  - onAdd -> add to selectedItems list
  - Remove via trash button
```

### User Selector

#### Web (Async with Full Details)
```
Component: Combobox (async, paginated)
Query: /api/users
Page size: 50
Search fields: name, email, cpf
Filters:
  - isActive: true
  - status: ACTIVE
Display:
  - name
  - Description: position name
  - Badge: sector name
Includes:
  - position (name)
  - position.sector (name)
Events:
  - onChange -> update form
  - Validation triggered
```

#### Mobile (Basic Selection)
```
Component: Combobox
Query: /api/users
Search: name (email also)
Display: name
Events:
  - onChange -> update form
```

### Quantity Input

#### Web
```
Type: Number input
HTML: <input type="number" min="1" max={available} />
Behavior:
  - min: 1
  - max: availableQuantity
  - step: 1
  - Validation: quantity > 0 and <= max
  - Shows: "Máximo disponível: X"
```

#### Mobile
```
Type: Text input (numeric keyboard)
Behavior:
  - Inline in selected items list
  - Per-item quantity
  - Editable after adding
  - Validation: quantity > 0
```

---

## Return Form Differences

### Web Return Form
```
DISPLAY SECTIONS:
├── Status Banner
│   ├── If returned: Green success
│   ├── If lost: Red warning
│   └── If active: Amber with duration
├── Validation Errors: Red error banner
├── Item Info Card
│   ├── Name + category badge
│   ├── UniCode
│   ├── Quantity borrowed
│   ├── Current stock
│   └── Measure unit
├── User Info Card
│   ├── Name + status badge
│   ├── Email
│   ├── Position
│   └── Status warning if inactive
├── Date Info Card
│   ├── Borrow date
│   ├── Return date (if returned)
│   └── Duration
└── Action Buttons
    ├── Voltar (Back)
    ├── Marcar como Devolvido (if active)
    └── Item Perdido (if active, shows as disabled if lost)

CONFIRMATION DIALOG:
├── Shows summary
├── Item name + quantity
├── User name
└── Requires explicit confirm

VALIDATION BEFORE ALLOW:
├── Not returned
├── Not lost
├── Item exists & is TOOL
├── User exists
├── Borrow < 365 days
└── User status warning only
```

### Mobile Return Form
```
DISPLAY SECTIONS:
├── Borrow Info Card
│   ├── Status badge (colored)
│   ├── Item + brand
│   ├── User
│   ├── Quantity
│   ├── Creation date
│   └── Return date (if applicable)
│
├── Actions Card (if active)
│   ├── Marcar como Devolvido (green)
│   ├── Marcar como Perdido (red)
│   └── Help text
│
└── Back Button
    └── Full width

NATIVE ALERT:
├── Uses native iOS/Android dialog
├── Simple message
├── Cancel / Confirm buttons

VALIDATION:
├── Not returned
├── Not lost
└── Otherwise allow action
```

---

## URL State Management (Web Batch Only)

```
Query Parameters Tracked:
├── selectedItems: Set<itemId>
├── quantities: Record<itemId, quantity>
├── globalUserId: string | null
├── page: number
├── pageSize: number
├── totalRecords: number
├── searchTerm: string
├── showSelectedOnly: boolean
├── showInactive: boolean
├── categoryIds: string[]
├── brandIds: string[]
├── supplierIds: string[]

Behavior:
├── State persists on page refresh
├── Can share URL with selections
├── Pagination maintains selections
├── Filter changes update URL
└── Submit clears selections

Mobile Batch:
├── NO URL state
├── Selections lost on refresh
├── No sharable state URL
└── Local component state only
```

---

## Error Handling Comparison

### Web
```
Toast Notifications:
├── Error: "Erro ao criar empréstimo"
├── Success: Automatic via API client
├── Warning: "Aviso: Usuário do empréstimo está inativo"

Form-level Errors:
├── Field: "Máximo disponível: X"
├── Field: "Quantidade deve ser maior que zero"
├── Field: "Apenas ferramentas podem ser emprestadas"
└── Field: "Item inativo não pode ser emprestado"

Validation Summary:
└── Rounded box showing:
    ├── Item selecionado: name
    ├── Quantidade disponível: X
    ├── Categoria: name
    └── Warnings if any

Console Logging:
├── Form submission
├── Validation results
├── API responses
└── Error details
```

### Mobile
```
Alert Dialogs:
├── "Atenção" title with message
├── Confirmation prompts
└── Native platform styling

Inline Validation:
├── Field error text (red)
├── Help text below fields
├── Error at top of form

No Status Summary:
└── Just success/fail on submit
```

---

## Batch Processing Differences

### Web Batch
```
SUBMISSION:
1. Validate all items at once
2. Call batchCreateAsync() or batchCreate()
3. API processes all in transaction
4. Returns per-item results

RESULT HANDLING:
├── Dialog shows:
│   ├── Successful creates
│   ├── Failed creates with reasons
│   └── Per-item status
├── Success toast shown
├── Selections cleared
└── Form reset

ERROR HANDLING:
├── Per-item failures visible
├── Summary of successes/failures
└── Can retry from dialog
```

### Mobile Batch
```
SUBMISSION:
1. Validate at submit time
2. Call onSubmit(formData)
3. Optional Alert confirmation
4. API processes all
5. Inline loading indicator

RESULT HANDLING:
├── Callback-based (parent handles)
├── onCancel() for back
├── isSubmitting prop controls UI
└── No built-in result dialog

ERROR HANDLING:
├── Alert for generic errors
├── No per-item feedback
└── Must retry entire batch
```

---

## Key Implementation Files

### Web
```
CREATE:
└── borrow-create-form.tsx (single)
└── borrow-batch-create-form.tsx (batch)
    └── BorrowItemSelector (paginated)
    └── BorrowUserSelector (async)
    └── QuantityInput

EDIT:
└── borrow-edit-form.tsx

RETURN:
└── borrow-return-form.tsx

UTILITIES:
├── validation-utils.ts (business rules)
├── use-direct-filter-update.ts (URL state)
├── filter-utils.ts
└── /schemas/borrow.ts (Zod schemas)
```

### Mobile
```
CREATE:
└── borrow-batch-create-form.tsx (only batch)
    └── Manual item list management
    └── No pagination

RETURN:
└── borrow-return-form.tsx

SCHEMAS:
└── /schemas/borrow.ts (Zod schemas)
```

---

## Common Issues & Gotchas

### Web
1. **Mark as Lost Button**: Rendered but may need handler verification
2. **Batch Pagination**: URL state persists across page changes, can be confusing
3. **Edit Form**: Read-only enforcement on returned items may need manual testing
4. **Quantity Calculation**: Uses current + already borrowed, confusing math in some cases

### Mobile
1. **No Edit After Create**: User must delete and recreate to change
2. **Max 50 Items**: Hard limit, no pagination workaround
3. **Selection Loss**: Refresh loses all selections, no persistence
4. **No Validation Feedback**: Backend errors don't display nicely
5. **No Filters**: Category/brand filter UI missing

---

## Testing Checklist

### Critical Paths
- [ ] Create single borrow with valid item and user
- [ ] Create single borrow with insufficient stock (should reject)
- [ ] Create batch with multiple items
- [ ] Return active borrow (should update stock)
- [ ] Edit active borrow and change quantity
- [ ] Mark borrow as lost
- [ ] Attempt to create with inactive item (should reject)
- [ ] Attempt to create with inactive user (should reject on web)
- [ ] Search items by name and uniCode
- [ ] Search users by name, email, cpf (web)

### Validation Paths
- [ ] Quantity = 0 (should reject)
- [ ] Quantity > available (should reject)
- [ ] Quantity > 100 (should reject)
- [ ] Non-TOOL item (should reject)
- [ ] Inactive item (should reject)
- [ ] Inactive user (should warn on return, reject on create)
- [ ] Return date in future (should reject)
- [ ] Return date before borrow date (should reject)

### Batch Specific (Web)
- [ ] Batch with 1 item (should work)
- [ ] Batch with 50 items (should work)
- [ ] Batch with 51 items (should reject)
- [ ] Batch pagination (select on page 1, go to page 2, selections persist)
- [ ] Batch filters (filter by category, select items, submit)
- [ ] Result dialog (shows per-item success/fail)

### Batch Specific (Mobile)
- [ ] Add items one by one
- [ ] Edit quantity for added item
- [ ] Remove item from list
- [ ] Submit with 1 item (should work)
- [ ] Try to add 51st item (should reject)
- [ ] Submit with duplicates (should reject)
