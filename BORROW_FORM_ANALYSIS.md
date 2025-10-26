# Borrow Form Analysis - Web vs Mobile

## Executive Summary

The Borrow (employee item loan) system is implemented across both Web and Mobile platforms with significant differences in functionality and form complexity. The Web platform offers comprehensive single and batch create operations, editing capabilities, and a sophisticated return form with validation. The Mobile platform provides limited functionality focused on batch creation and basic return operations.

---

## Part 1: Complete Field List

### Core Borrow Entity Fields (Database Schema)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| itemId | UUID | Yes | Foreign key to Item |
| userId | UUID | Yes | Foreign key to User (borrower) |
| quantity | Number | Yes | Quantity borrowed |
| status | Enum | Yes | ACTIVE, RETURNED, LOST, EXTENSION_REQUESTED |
| statusOrder | Number | No | For sorting status |
| returnedAt | DateTime | No | Date item was returned |
| createdAt | DateTime | Yes | Record creation timestamp |
| updatedAt | DateTime | Yes | Last update timestamp |

### Related Data (Populated via Includes)

**Item Relations:**
- id, name, uniCode, quantity, isActive
- brand (id, name)
- category (id, name, type - TOOL, PPE, etc.)
- supplier (id, name)
- price
- measureUnit

**User Relations:**
- id, name, email, status (ACTIVE, INACTIVE)
- position (id, name)
- sector (id, name, privileges)
- ppeSize (for PPE items)

---

## Part 2: Form-by-Form Comparison

### 1. SINGLE BORROW CREATE FORM

#### Web Implementation
**File:** `/home/kennedy/repositories/web/src/components/inventory/borrow/form/borrow-create-form.tsx`

**Fields:**
- Item Selection (BorrowItemSelector)
  - Async combobox with search
  - Filters: isActive=true, quantity>0, category.type="TOOL"
  - Shows: uniCode, name, quantity, category
  
- Quantity Input (QuantityInput)
  - Number input with min=1, max=availableQuantity
  - Real-time validation
  - Shows available stock
  
- User Selection (BorrowUserSelector)
  - Async combobox with pagination (pageSize=50)
  - Filters: isActive=true
  - Shows: name, position, sector
  - Searchable by: name, email, cpf

**Display Section:**
- Item summary with category and available quantity
- Validation warnings

**Validation Rules:**
```typescript
1. Item must be selected
2. User must be selected
3. Quantity must be > 0
4. Quantity <= availableQuantity
5. Item must be a TOOL category
6. Item must be isActive=true
7. Selected item must be found in database
```

**Workflow:**
1. User navigates to "Criar Empréstimo" page
2. Selects item (searches by uniCode or name)
3. Enters quantity (validated against stock)
4. Selects responsible user
5. System shows validation summary
6. Submit creates borrow record
7. Redirects to borrow list

**Error Handling:**
- Toast notifications for each validation error
- Form field-level error messages
- Console logging for debugging

---

#### Mobile Implementation
**File:** `/home/kennedy/repositories/mobile/src/components/inventory/borrow/form/borrow-batch-create-form.tsx`

**Status:** NOT AVAILABLE FOR SINGLE BORROW
- Mobile only has batch create form
- Single borrow creation must be done via batch with 1 item

---

### 2. BATCH BORROW CREATE FORM

#### Web Implementation
**File:** `/home/kennedy/repositories/web/src/components/inventory/borrow/form/borrow-batch-create-form.tsx`

**Architecture:**
- URL state management for pagination and selections
- Paginated item selector component
- Global user selection
- Item quantity adjustment per item
- Batch result dialog showing individual results

**Fields:**
- Global User Selection (required for all items)
  - Combobox
  - Filters: status in [EXPERIENCE_PERIOD_1, EXPERIENCE_PERIOD_2, CONTRACTED]
  - Shows: name, sector
  - Max 100 users loaded
  
- Item Selector (paginated)
  - BorrowItemSelector with pagination
  - Filters: isActive=true, category.type="TOOL"
  - Shows: uniCode, name, brand, category
  - Search capability
  - Multiple selection checkbox
  
- Quantity per Item
  - Number input for each selected item
  - Min=1, default=1
  - Max=50 items per batch

**URL State Tracking:**
- selectedItems (Set<string>)
- quantities (Record<itemId, quantity>)
- globalUserId
- searchTerm
- showSelectedOnly
- categoryIds, brandIds, supplierIds
- page, pageSize
- showInactive flag

**Validation Rules:**
```typescript
1. Global user must be selected (required)
2. At least 1 item must be selected
3. Max 50 items per batch
4. Each quantity must be > 0
5. Quantity must be integer
6. All items must be TOOL category
7. All items must be isActive
```

**Workflow:**
1. Navigate to "Criar Empréstimos" (batch page)
2. Select global user (applies to all items)
3. Browse paginated item list
4. Select items individually
5. Adjust quantity for each item
6. Submit batch
7. View detailed results in dialog
8. Clear selections automatically

**Features:**
- Pagination support (configurable pageSize)
- Select all items functionality
- Item deselection
- Quantity editing in-list
- Live selection count display
- Filter items by category, brand, supplier
- Search items
- Hide inactive items toggle

**Batch Result Dialog:**
- Shows successful creates
- Shows failures with reasons
- Per-item status display

#### Mobile Implementation
**File:** `/home/kennedy/repositories/mobile/src/components/inventory/borrow/form/borrow-batch-create-form.tsx`

**Architecture:**
- React Hook Form with Zod schema
- Fixed form, no URL state
- Themed scroll view for mobile
- Card-based layout

**Fields:**
- User Selection
  - Combobox
  - Searchable
  - Shows: name
  - Email search enabled
  - Loading state
  
- Item Addition (manual list building)
  - Combobox (search and add)
  - Shows selected items count (current/50)
  - Manual quantity input per item
  - Trash button to remove items
  
- Selected Items Display
  - List of added items
  - Quantity input for each
  - Remove buttons

**Form Schema:**
```typescript
borrowBatchFormSchema = {
  userId: string (UUID, required),
  items: [
    { itemId: UUID, quantity: number (>0) }
  ] (min: 1, max: 50)
}
```

**Validation Rules:**
```typescript
1. User is required (UUID format)
2. At least 1 item required
3. Max 50 items per batch
4. Quantity must be positive number
5. No duplicate items in selection
6. Item quantity <= availableQuantity (checked at submit)
```

**Workflow:**
1. User selects responsible person
2. Searches and adds items one by one
3. Sets quantity for each item
4. Can remove items before submit
5. Submit button shows count: "Criar X Empréstimos"
6. Optional Alert confirmation
7. Creates batch
8. Shows inline loading state

**Limitations:**
- No pagination (max 50 items to add)
- No URL state persistence
- No filter UI for category/brand/supplier
- No "select all" functionality
- Manual item-by-item addition

---

### 3. BORROW EDIT FORM

#### Web Implementation
**File:** `/home/kennedy/repositories/web/src/components/inventory/borrow/form/borrow-edit-form.tsx`

**Purpose:** Edit existing borrow record (except returned items)

**Fields:**
- Item Selection (read-only if returned, editable if active)
  - Same as create form
  
- Quantity Input (read-only if returned)
  - Same as create form
  - Considers current borrowed quantity in availability calculation
  
- User Selection (read-only if returned)
  - Same as create form
  
- Return Date Input (always editable)
  - DateTime input
  - Min: borrow creation date
  - Max: today
  - Disables future dates
  - Validates against borrow date

**Status Display:**
- Badge showing ACTIVE or DEVOLVIDO
- Warning if already returned
- Cannot edit if returned (some fields disabled)

**Validation Rules:**
```typescript
1. If returned: item, quantity, user are read-only
2. If not returned: all fields editable
3. returnedAt cannot be in future
4. returnedAt cannot be before createdAt
5. Quantity rules same as create
6. Item and user rules same as create
```

**Workflow:**
1. View borrow details page
2. Click "Editar Empréstimo"
3. Modify allowed fields
4. Return date can be set (backdated to actual return)
5. Submit saves changes
6. Redirects to borrow details

#### Mobile Implementation
**Status:** NOT AVAILABLE
- Mobile does not have edit form

---

### 4. BORROW RETURN FORM

#### Web Implementation
**File:** `/home/kennedy/repositories/web/src/components/inventory/borrow/form/borrow-return-form.tsx`

**Purpose:** Dedicated form to mark item as returned (not edit form)

**Display Sections:**

1. **Status Banner**
   - If already returned: Green success banner
   - If marked lost: Red warning banner
   - If active: Amber warning banner showing days borrowed
   - Validation errors: Red error banner

2. **Item Information Card**
   - Item name with category badge
   - UniCode
   - Quantity borrowed
   - Current stock (for reference)
   - Measure unit

3. **User Information Card**
   - Name with status badge (ACTIVE/INACTIVE)
   - Email
   - Position
   - Status warning if user inactive

4. **Date Information Card**
   - Borrow creation date (formatted)
   - Return date (if already returned)
   - Duration calculation

5. **Action Buttons**
   - "Voltar" (Back button)
   - "Marcar como Devolvido" (if not returned/lost)
   - "Item Perdido" (if not returned) - disabled if lost

**Validation Before Return:**
```typescript
1. Not already returned
2. Not marked as lost
3. Item info exists
4. User info exists
5. Item still valid TOOL category
6. Borrow not older than 365 days
7. Cannot devolvido if previously returned/lost
```

**Confirmation Dialog:**
- Shows item name, quantity, user
- Asks for confirmation
- Confirms action details

**Workflow:**
1. Navigate to borrow detail
2. Click "Devolver Item" or return button
3. See current status and details
4. Click "Marcar como Devolvido"
5. Confirm in dialog
6. Update sent to API
7. Status changes to RETURNED with returnedAt timestamp
8. Stock is updated
9. Redirect to borrow list

**Key Features:**
- Comprehensive validation
- Status-aware display
- User feedback on item status
- Cannot return if invalid state
- Automatic stock restoration

#### Mobile Implementation
**File:** `/home/kennedy/repositories/mobile/src/components/inventory/borrow/form/borrow-return-form.tsx`

**Display Sections:**

1. **Borrow Information Card**
   - Status badge with color coding
   - Item name with brand
   - User name
   - Quantity
   - Creation date
   - Return date (if applicable)
   - All as info rows

2. **Actions Card** (if not returned/lost)
   - "Marcar como Devolvido" button (green, with checkmark icon)
   - "Marcar como Perdido" button (red/destructive, with alert icon)
   - Help text explaining actions

3. **Back Button**
   - Full-width outline button

**Validation:**
```typescript
1. Check if already returned
2. Check if marked lost
3. Show appropriate UI for each state
4. Disable actions if completed
```

**Workflow:**
1. Navigate to borrow detail
2. View compact information display
3. Tap "Marcar como Devolvido"
4. System shows confirmation Alert
5. Confirm action
6. Call onReturn() callback
7. Disable buttons during processing
8. Navigate back after completion

**UI Differences from Web:**
- Compact info row layout
- Native Alert dialogs instead of AlertDialog component
- Green (#10b981) for return action
- Destructive red for lost action
- Loading indicator during submit

**Key Features:**
- Status-color-coded display
- Simple action interface
- Native confirmation dialogs
- Loading states
- Separate "mark as lost" functionality

---

## Part 3: Use Cases & Workflows

### Use Case 1: Creating New Single Borrow (Web Only)

**Actor:** Warehouse Manager

**Steps:**
1. Access: Menu > Estoque > Empréstimos > Criar
2. Search and select item (must be TOOL category with stock)
3. Confirm quantity available
4. Select responsible user
5. Review validation summary
6. Click "Criar Empréstimo"
7. System validates all rules
8. Creates record in database
9. Redirects to borrow list

**Validation Checkpoints:**
- Item exists and is active TOOL
- Quantity <= available stock
- User exists and is active
- User has required sector privileges (warehouse check)

**Output:** New Borrow record with status=ACTIVE, createdAt set

---

### Use Case 2: Creating Batch Borrows (Web & Mobile)

**Actor:** Warehouse Manager / Team Lead

#### Web Workflow:
1. Access: Estoque > Empréstimos > Criar (batch option)
2. Select global user (applies to all items)
3. Use pagination to browse items
4. Check items to select (single or batch)
5. Adjust quantity for each selected item
6. URL state maintains selections across pagination
7. Click "Criar X Empréstimos"
8. System validates user + items
9. Submit batch request
10. API processes in parallel
11. Results dialog shows per-item status
12. Success: Selects are cleared, form reset

**Advantages:**
- Pagination support (handles large catalogs)
- URL state persistence (can refresh without losing selections)
- Live pagination with filters
- Select all functionality

#### Mobile Workflow:
1. Access: Empréstimos > Criar Empréstimos
2. Select user
3. Click "Adicionar Item"
4. Search for item
5. Tap item to add to list
6. Item appears in "Selected Items" section
7. Edit quantity in the list
8. Remove items with trash button
9. Repeat steps 3-8 for each item
10. Tap "Criar X Empréstimos"
11. Optional Alert confirmation
12. Submit batch
13. Inline loading indicator

**Limitations:**
- No pagination (must add items one-by-one)
- No URL state (lose selections on refresh)
- Max 50 items enforced client-side

---

### Use Case 3: Returning Borrowed Items

**Actor:** Warehouse Manager / Item Borrower

#### Web Workflow:
1. View: Estoque > Empréstimos > [Select Borrow] > Details
2. Click "Devolver Item" button
3. Form loads with full details:
   - Item info + current stock
   - User info + status
   - Borrow dates
   - Duration calculation
4. Form validates state:
   - If already returned: Show green success, disable actions
   - If marked lost: Show red warning, disable actions
   - If active: Show amber warning, show available actions
5. If valid state:
   - Click "Marcar como Devolvido"
   - Confirmation dialog appears
   - Shows item name, quantity, user
   - User confirms
6. Submit update:
   - Sets returnedAt = now
   - Sets status = RETURNED
   - Updates item stock
7. Redirect to borrow list
8. Update confirmed via toast

#### Mobile Workflow:
1. View: Empréstimos > [Select Borrow]
2. See compact borrow details
3. If active status, see action buttons:
   - Green "Marcar como Devolvido"
   - Red "Marcar como Perdido"
4. Tap return button
5. Native iOS/Android confirmation dialog:
   - Shows message
   - Cancel or Confirm
6. Confirm action:
   - Button disabled during processing
   - Loading indicator on button
7. API updates record
8. Navigation back on success

---

### Use Case 4: Extending/Modifying Borrow Period (Web Only)

**Actor:** Warehouse Manager

**Steps:**
1. Navigate to borrow details
2. Click "Editar Empréstimo"
3. If borrow is still ACTIVE:
   - Can edit item (if changing)
   - Can edit quantity (if increasing)
   - Can edit user (if reassigning)
   - Can SET returnedAt (to record backdated return)
4. If borrow is RETURNED:
   - All fields are read-only
   - Can only view info
   - Warning banner shown

**Note:** The form allows setting a return date (returnedAt) even when creating/editing, effectively supporting "extend by entering actual return date". True extension (pushing the due date forward) would require an expectedReturnDate field not currently in schema.

---

### Use Case 5: Marking Item as Lost (Mobile Only)

**Actor:** Warehouse Manager

**Workflow:**
1. Navigate to active borrow
2. In return form actions section
3. Tap "Marcar como Perdido"
4. Confirmation dialog asks for confirmation
5. Confirm to mark as LOST
6. Calls onMarkAsLost() callback
7. API updates status to LOST
8. Item stock adjusted (lost quantity removed)
9. Navigation back
10. Item can no longer be returned

**Web Note:** Web return form shows "Item Perdido" button but disabled if already lost. Implementation appears ready but the button click handler integration may need verification.

---

## Part 4: Validation Comparison

### Create Validation

| Rule | Web Single | Web Batch | Mobile Batch |
|------|-----------|----------|-------------|
| Item required | Yes | Yes | Yes |
| Item = TOOL | Yes | Yes | Implicit |
| Item active | Yes | Yes | Implicit |
| Item quantity > 0 | Yes | Yes | Implicit |
| Quantity > 0 | Yes | Yes | Yes |
| Quantity integer | No | Yes | Yes |
| Quantity <= available | Yes | Yes | Server-side |
| User required | Yes | Yes | Yes |
| User active | Yes | Yes | No (warning only) |
| User format (UUID) | Yes | Yes | Yes |
| User privileges | Yes (warehouse) | Yes (warehouse) | No |
| Max items per batch | N/A | 50 | 50 |
| Duplicate items | N/A | Implicit (selection) | Yes (explicit check) |

### Return Validation

| Check | Web | Mobile |
|-------|-----|--------|
| Not returned | Yes | Yes |
| Not lost | Yes | Yes |
| Item info exists | Yes | No |
| User info exists | Yes | No |
| Item still TOOL | Yes | No |
| User still active | Warning | No |
| Borrow < 365 days | Yes | No |
| Can return if all valid | Yes | Yes |

---

## Part 5: Missing Functionality & Gaps

### Web Gaps:

1. **No "Mark as Lost" Implementation**
   - Button rendered but click handler may not be fully integrated
   - Should allow marking borrow as LOST status
   - Should adjust item stock accordingly

2. **No Expected Return Date**
   - Current schema only has returnedAt (actual)
   - No expectedReturnDate or dueDate field
   - Cannot enforce return deadline

3. **No Return Date Extension**
   - Cannot extend borrow period beyond initial creation
   - Can only edit by changing returnedAt value

4. **No Notes/Reason Field**
   - No text field for borrow reason or notes
   - No field for extension justification

5. **No Batch Delete**
   - UI supports batch operations but no bulk delete shown

### Mobile Gaps:

1. **No Edit Form**
   - Cannot edit existing borrows
   - Cannot change item, quantity, or user after creation

2. **No Single Item Creation**
   - Only batch create available
   - Must use batch form even for single item

3. **No Pagination in Batch**
   - No pagination on item selector
   - Limited for large catalogs
   - Must add items one-by-one

4. **No URL State**
   - No persistence of selections
   - Refresh loses all work

5. **No Advanced Filters**
   - No filter by category, brand, supplier in mobile UI
   - No "show selected only" toggle
   - Basic search only

6. **No Validation Error Display**
   - Backend validation errors not displayed
   - Inline error messages not shown
   - Just generic submit failure

7. **No Return History**
   - Cannot see modification history
   - No timeline of status changes

---

## Part 6: Field Requirements Summary

### Form Fields Required by Use Case

**Create Single Borrow (Web):**
- itemId (required, UUID)
- userId (required, UUID)
- quantity (required, 1-availableQty)

**Create Batch Borrow (Web & Mobile):**
- userId (required, UUID) - global
- items[] (required, min=1, max=50)
  - itemId (UUID)
  - quantity (positive number)

**Update/Edit Borrow (Web):**
- itemId (optional, UUID) - if changing
- userId (optional, UUID) - if reassigning
- quantity (optional, positive) - if adjusting
- returnedAt (optional, date) - can set return date
- status (optional, enum) - if changing status

**Return Borrow (Web & Mobile):**
- returnedAt (computed as now) - set when user confirms
- status (computed as RETURNED) - set when confirmed
- No user input fields needed in return form

---

## Part 7: Data Validation & Rules

### Stock Management:

1. **Available Quantity Calculation:**
   ```
   availableForBorrow = item.quantity - (sum of active borrows for that item)
   ```

2. **Stock Update on Borrow Create:**
   ```
   item.quantity -= borrowRequest.quantity
   ```

3. **Stock Update on Return:**
   ```
   item.quantity += borrow.quantity
   ```

4. **Stock Update on Lost:**
   ```
   item.quantity -= borrow.quantity (permanent loss)
   ```

### Status Transitions:

```
ACTIVE -> RETURNED (via return form)
ACTIVE -> LOST (via lost action)
RETURNED -> (no further changes)
LOST -> (no further changes)
```

### User Eligibility:

- User must be ACTIVE status
- User must have appropriate sector privileges
- User cannot exceed max active borrows (config: 10)
- Cannot create duplicate borrow (user + item) while active

---

## Part 8: Implementation Quality Assessment

### Web Platform:
- **Strengths:**
  - Comprehensive validation
  - Multiple form types (create, batch, edit, return)
  - URL state management for pagination
  - Detailed error messages
  - Batch result feedback
  - Return date flexibility
  
- **Weaknesses:**
  - Mark as lost incomplete
  - No notes/reason field
  - No return date expectations
  - Edit form complexity for read-only state handling

### Mobile Platform:
- **Strengths:**
  - Simple, focused interface
  - Batch creation available
  - Native confirmation dialogs
  - Compact form layout
  - Works offline capability (not implemented)
  
- **Weaknesses:**
  - Missing edit functionality
  - No pagination on batch
  - No URL state persistence
  - Limited filter options
  - No single item create
  - Minimal validation feedback

---

## Recommendations

### High Priority:

1. **Complete Mobile Feature Parity:**
   - Add edit form to mobile
   - Implement single item create
   - Add pagination to item selector
   - Implement URL state management

2. **Fix Mark as Lost:**
   - Complete implementation on web
   - Integrate lost action button click handler
   - Test stock adjustment

3. **Add Notes/Reason Field:**
   - Add to both platforms
   - Optional field for borrow justification
   - Include in return form

4. **Improve Mobile Validation:**
   - Display backend validation errors
   - Show inline error messages
   - Field-level error feedback

### Medium Priority:

1. **Expected Return Date:**
   - Add expectedReturnDate to schema
   - Show deadline in UI
   - Alert if overdue
   - Support for return deadline extension

2. **Return History/Timeline:**
   - Show status change history
   - Display creation, modification, return timestamps
   - Track who made changes

3. **Batch Operations:**
   - Add batch delete functionality
   - Add batch edit capability
   - Add batch return capability

### Low Priority:

1. **Advanced Filtering:**
   - Add filters by status duration
   - Filter overdue items
   - Filter by date range

2. **Bulk Import:**
   - CSV import for batch creates
   - Verification workflow before import

3. **Analytics:**
   - Borrow statistics per user
   - Item circulation metrics
   - Return rate calculations
