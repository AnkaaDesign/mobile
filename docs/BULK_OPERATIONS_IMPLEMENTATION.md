# Task Bulk Operations Implementation

## Overview

This implementation provides a comprehensive system for performing bulk operations on production tasks in the mobile application. It supports four types of bulk operations:

1. **Bulk Arts** - Add artwork files to multiple tasks
2. **Bulk Documents** - Add a single document to multiple tasks (single-select only)
3. **Bulk Paints** - Configure general painting and logo paints for multiple tasks
4. **Bulk Cutting Plans** - Create cutting plans for multiple tasks using the same file

## Architecture

### Type System

**Location**: `/src/types/task-bulk-operations.ts`

The type system defines:
- `BulkOperationType` - Union type for operation types
- Individual operation data types for each operation
- Result types with success/error tracking
- Validation error types

### API Client

**Location**: `/src/api-client/task-bulk-operations.ts`

Provides four main functions:
- `bulkUpdateTaskArts()` - Updates task-artwork relationships
- `bulkUpdateTaskDocuments()` - Updates task-document relationships (single-select)
- `bulkUpdateTaskPaints()` - Updates task-paint relationships
- `bulkCreateCuttingPlans()` - Creates new cutting plan records

**Key Features**:
- Automatic FormData handling for file uploads
- Proper context tagging for backend file organization
- Type-safe API calls using Zod schemas
- Error handling with detailed error messages

### React Hooks

**Location**: `/src/hooks/use-task-bulk-operations.ts`

Provides React Query mutations for each operation:
- `useBulkUpdateTaskArts()`
- `useBulkUpdateTaskDocuments()`
- `useBulkUpdateTaskPaints()`
- `useBulkCreateCuttingPlans()`
- `useTaskBulkOperations()` - Combined hook for all operations

**Features**:
- Automatic cache invalidation after mutations
- User-friendly success/error alerts
- Loading states
- Optimistic updates support

### UI Components

#### BulkOperationModal

**Location**: `/src/components/production/task/modals/bulk-operation-modal.tsx`

A unified modal component that handles all four operation types:
- Dynamic content based on operation type
- Form validation
- File upload support
- Multi-select and single-select support
- Integration with paint selectors

#### BulkOperationsMenu

**Location**: `/src/components/production/task/list/bulk-operations-menu.tsx`

A menu component for triggering bulk operations:
- Shows count of selected tasks
- Lists all available operations
- Opens appropriate modal for each operation

## Usage

### Basic Integration

```tsx
import { useState } from 'react';
import { BulkOperationsMenu } from '@/components/production/task/list/bulk-operations-menu';

export function TaskListScreen() {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const handleOperationComplete = () => {
    // Refresh task list or clear selection
    setSelectedTaskIds([]);
  };

  return (
    <View>
      {/* Task selection UI */}

      {/* Bulk operations menu */}
      <BulkOperationsMenu
        selectedTaskIds={selectedTaskIds}
        onOperationComplete={handleOperationComplete}
      />
    </View>
  );
}
```

### Using Individual Hooks

```tsx
import { useBulkUpdateTaskArts } from '@/hooks/use-task-bulk-operations';

export function CustomBulkArtsComponent() {
  const bulkArts = useBulkUpdateTaskArts();

  const handleAddArts = async () => {
    await bulkArts.mutateAsync({
      type: 'arts',
      taskIds: ['task-id-1', 'task-id-2'],
      artworkIds: ['file-id-1', 'file-id-2'],
      artworkFiles: [], // Or new files
    });
  };

  return (
    <Button
      onPress={handleAddArts}
      loading={bulkArts.isPending}
    >
      Add Arts
    </Button>
  );
}
```

## Operation Details

### 1. Bulk Arts Operation

**Purpose**: Add artwork files to multiple tasks

**Data Structure**:
```typescript
{
  type: 'arts',
  taskIds: string[],
  artworkIds: string[], // Existing file IDs
  artworkFiles?: File[] // New files to upload
}
```

**Behavior**:
- Supports multiple file selection
- Can use existing files, new uploads, or both
- Updates `task.artworks` many-to-many relationship
- Validates file formats (images, PDF, AI, EPS)
- Prevents duplicate associations

**Data Integrity**:
- Uses transaction for atomicity
- Validates file existence before linking
- Checks for duplicate artwork associations
- Maintains foreign key constraints

### 2. Bulk Documents Operation

**Purpose**: Add a single document to multiple tasks

**Data Structure**:
```typescript
{
  type: 'documents',
  taskIds: string[],
  documentType: 'budget' | 'invoice' | 'receipt' | 'reimbursement' | 'reimbursementInvoice',
  documentId: string, // Single document ID
  documentFile?: File // Or new file to upload
}
```

**Special Characteristics**:
- **SINGLE-SELECT ONLY** - Only one document per operation
- Document type determines which relation to update
- Maps to appropriate field:
  - `budget` → `budgetIds`
  - `invoice` → `invoiceIds`
  - `receipt` → `receiptIds`
  - `reimbursement` → `reimbursementIds`
  - `reimbursementInvoice` → `reimbursementInvoiceIds`

**Data Integrity**:
- Validates document type
- Checks user permissions for document type
- Prevents duplicate document associations
- Updates many-to-many relationships correctly

### 3. Bulk Paints Operation

**Purpose**: Configure painting options for multiple tasks

**Data Structure**:
```typescript
{
  type: 'paints',
  taskIds: string[],
  generalPaintingId?: string, // Single general paint
  logoPaintIds?: string[] // Multiple logo paints
}
```

**Behavior**:
- General painting is one-to-one (single selection)
- Logo paints are many-to-many (multiple selection)
- Updates `task.generalPainting` and `task.logoPaints` relations
- Can set one or both paint types

**Data Integrity**:
- Validates paint IDs exist
- Checks paint compatibility with task
- May trigger inventory checks
- Calculates paint quantities if needed

### 4. Bulk Cutting Plans Operation

**Purpose**: Create cutting plans for multiple tasks

**Data Structure**:
```typescript
{
  type: 'cutting-plans',
  taskIds: string[],
  cuttingPlanData: {
    fileId?: string,
    file?: File,
    type: CUT_TYPE,
    measurements?: string,
    quantity?: number,
    origin: CUT_ORIGIN
  }
}
```

**Special Behavior**:
- Creates a **NEW** cutting plan record for each task
- Uses the **SAME** document reference for all plans
- Links each plan to its specific task
- Establishes one-to-many task-cuttingPlan relationship

**Data Integrity**:
- Creates separate Cut record for each task
- All cuts reference the same file
- Sets `cut.taskId` to link to task
- Sets `cut.origin` to `BULK_OPERATION`
- Validates cut type and measurements
- Ensures proper task-cut relationship

**Example Flow**:
```
Input:
- 3 selected tasks
- 1 cutting plan file

Output:
- 3 new Cut records created
- All 3 reference the same file
- Cut 1 linked to Task 1
- Cut 2 linked to Task 2
- Cut 3 linked to Task 3
```

## Data Relationships

### Task-Artwork (Many-to-Many)
```
Task.artworks ←→ File.tasksArtworks
```

### Task-Document (Many-to-Many)
```
Task.budgets ←→ File.taskBudgets
Task.invoices ←→ File.taskNfes
Task.receipts ←→ File.taskReceipts
Task.reimbursements ←→ File.taskReimbursements
Task.reimbursementInvoices ←→ File.taskReimbursementInvoices
```

### Task-Paint
```
Task.generalPainting → Paint (one-to-one)
Task.logoPaints ←→ Paint.logoTasks (many-to-many)
```

### Task-Cut (One-to-Many)
```
Task.cuts ← Cut.task
Cut.file → File (many-to-one)
```

## Error Handling

All operations return detailed error information:

```typescript
{
  success: boolean,
  errors?: Array<{
    taskId: string,
    error: string
  }>
}
```

This allows:
- Partial success handling
- Task-specific error messages
- Retry mechanisms for failed tasks
- User-friendly error display

## Cache Invalidation

After successful operations, the following query keys are invalidated:

- `['tasks']` - Task list queries
- `['task-infinite']` - Infinite scroll queries
- `['cuts']` - Cut list queries (for cutting plans)
- `['cutting-plans']` - Cutting plan queries

This ensures the UI reflects the latest data.

## Validation

Each operation performs validation at multiple levels:

1. **Client-side validation** (Modal component)
   - Required fields
   - File format validation
   - Task selection validation

2. **API validation** (Backend)
   - Business rule validation
   - Permission checks
   - Data integrity checks

3. **Database constraints**
   - Foreign key constraints
   - Unique constraints
   - Check constraints

## Performance Considerations

- **Batch operations** reduce API calls
- **FormData streaming** for large file uploads
- **Optimistic updates** for better UX
- **Query invalidation** is scoped to relevant queries
- **Error handling** prevents cascading failures

## Testing Recommendations

### Unit Tests
- Test validation logic
- Test data transformation
- Test error handling

### Integration Tests
- Test API endpoints with real database
- Test file upload handling
- Test transaction rollback on errors

### E2E Tests
- Test complete user flow
- Test with multiple tasks
- Test with file uploads
- Test error scenarios

## Future Enhancements

Potential improvements:

1. **Progress indicators** for large batch operations
2. **Undo functionality** for bulk operations
3. **Bulk operation history** tracking
4. **Scheduled bulk operations**
5. **Export bulk operation reports**
6. **Bulk operation templates** for common scenarios

## API Endpoints Used

- `PUT /tasks/batch` - Batch update tasks
- `POST /cuts/batch` - Batch create cuts
- `POST /files` - Upload files
- `GET /files` - Search files
- `GET /paints` - Search paints

## Dependencies

- `@tanstack/react-query` - Data fetching and caching
- `react-hook-form` - Form state management (in modal)
- `zod` - Schema validation
- `axios` - HTTP client
- React Native core components

## Migration Notes

If integrating into existing code:

1. Ensure `TaskBatchUpdateFormData` schema exists in schemas
2. Backend must support `/tasks/batch` endpoint
3. Backend must support `/cuts/batch` endpoint
4. File upload context handling must be implemented
5. Query key naming should match existing patterns

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify API endpoint availability
3. Ensure proper TypeScript types are imported
4. Review backend logs for server-side errors
