# Bulk Operations Integration Guide

## Quick Start

This guide shows how to integrate bulk operations into the existing task list.

## Step 1: Export Types

Add the bulk operations types to the main types index:

**File**: `/src/types/index.ts`

```typescript
// Add this export
export * from './task-bulk-operations';
```

## Step 2: Update Task List Component

### Option A: Using the Layout Component (Recommended)

If you're using the `Layout` component from the list system migration, add bulk operations to the config:

**File**: `/src/config/list/production/tasks.ts`

```typescript
import { BulkOperationsMenu } from '@/components/production/task/list/bulk-operations-menu';

export const tasksListConfig: ListConfig<Task> = {
  // ... existing config ...

  // Add bulk operations to actions
  actions: {
    create: {
      label: 'Nova Tarefa',
      route: '/producao/cronograma/criar',
    },

    // Add bulk operations component
    bulkComponent: BulkOperationsMenu,

    // Or add individual bulk actions
    bulk: [
      {
        key: 'add-arts',
        label: 'Adicionar Artes',
        icon: 'palette',
        requiresSelection: true,
        onPress: ({ selectedIds, openBulkModal }) => {
          openBulkModal('arts', selectedIds);
        },
      },
      {
        key: 'add-document',
        label: 'Adicionar Documento',
        icon: 'file-text',
        requiresSelection: true,
        onPress: ({ selectedIds, openBulkModal }) => {
          openBulkModal('documents', selectedIds);
        },
      },
      {
        key: 'configure-paints',
        label: 'Configurar Tintas',
        icon: 'droplet',
        requiresSelection: true,
        onPress: ({ selectedIds, openBulkModal }) => {
          openBulkModal('paints', selectedIds);
        },
      },
      {
        key: 'create-cutting-plans',
        label: 'Criar Planos de Recorte',
        icon: 'scissors',
        requiresSelection: true,
        onPress: ({ selectedIds, openBulkModal }) => {
          openBulkModal('cutting-plans', selectedIds);
        },
      },
    ],
  },
};
```

### Option B: Direct Integration in Screen

If you're using a custom task list screen:

**File**: `/src/app/(tabs)/producao/cronograma/listar.tsx`

```typescript
import { useState } from 'react';
import { View } from 'react-native';
import { BulkOperationsMenu } from '@/components/production/task/list/bulk-operations-menu';
// ... other imports

export default function TaskListScreen() {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const handleTaskSelect = (taskId: string, selected: boolean) => {
    setSelectedTaskIds(prev =>
      selected
        ? [...prev, taskId]
        : prev.filter(id => id !== taskId)
    );
  };

  const handleBulkOperationComplete = () => {
    // Clear selection after operation
    setSelectedTaskIds([]);
    // Refresh task list if needed
    // refetch();
  };

  return (
    <View>
      {/* Your existing task list UI */}
      <TaskList
        onTaskSelect={handleTaskSelect}
        selectedTaskIds={selectedTaskIds}
      />

      {/* Add bulk operations menu */}
      <BulkOperationsMenu
        selectedTaskIds={selectedTaskIds}
        onOperationComplete={handleBulkOperationComplete}
      />
    </View>
  );
}
```

## Step 3: Add Task Selection UI

If you don't have task selection yet, add checkboxes to your task list:

```typescript
import { Checkbox } from '@/components/ui/checkbox';

function TaskRow({ task, selected, onSelect }: TaskRowProps) {
  return (
    <View style={styles.row}>
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onSelect(task.id, checked)}
      />

      {/* Rest of task row content */}
      <Text>{task.name}</Text>
    </View>
  );
}
```

## Step 4: Test the Integration

### Test Bulk Arts
1. Select multiple tasks
2. Open "Operações em Lote" menu
3. Select "Adicionar Artes"
4. Upload or select artwork files
5. Click "Aplicar"
6. Verify arts are added to all selected tasks

### Test Bulk Documents
1. Select multiple tasks
2. Open "Operações em Lote" menu
3. Select "Adicionar Documento"
4. Choose document type (e.g., "Orçamento")
5. Upload or select ONE document
6. Click "Aplicar"
7. Verify document is added to all selected tasks

### Test Bulk Paints
1. Select multiple tasks
2. Open "Operações em Lote" menu
3. Select "Configurar Tintas"
4. Choose general painting and/or logo paints
5. Click "Aplicar"
6. Verify paints are configured for all selected tasks

### Test Bulk Cutting Plans
1. Select multiple tasks
2. Open "Operações em Lote" menu
3. Select "Criar Planos de Recorte"
4. Upload cutting plan file
5. Choose cut type
6. Click "Aplicar"
7. Verify ONE cutting plan is created for EACH task

## Step 5: Customize as Needed

### Customize Success Messages

Edit `/src/hooks/use-task-bulk-operations.ts` to change success messages:

```typescript
Alert.alert(
  'Sucesso!',
  `Custom message for ${taskCount} tasks`
);
```

### Add Custom Validation

Edit `/src/components/production/task/modals/bulk-operation-modal.tsx`:

```typescript
const validateForm = (): { isValid: boolean; message?: string } => {
  // Add your custom validation logic
  if (customCondition) {
    return { isValid: false, message: 'Custom error message' };
  }

  return { isValid: true };
};
```

### Customize Operation Options

Edit the `BULK_OPERATIONS` constant in `/src/components/production/task/list/bulk-operations-menu.tsx`:

```typescript
const BULK_OPERATIONS = [
  {
    type: 'arts' as BulkOperationType,
    label: 'Custom Label',
    icon: 'custom-icon',
    description: 'Custom description',
  },
  // ... other operations
];
```

## Common Issues

### Issue: "File not found" error
**Solution**: Ensure file upload endpoint `/files` is properly configured

### Issue: Bulk operation doesn't update UI
**Solution**: Check that query keys match in invalidation:
```typescript
queryClient.invalidateQueries({ queryKey: ['tasks'] });
```

### Issue: Permission denied
**Solution**: Verify user has necessary privileges for bulk operations

### Issue: Cutting plans not showing
**Solution**: Ensure `/cuts/batch` endpoint is available and working

## Advanced Usage

### Custom Bulk Operation Hook

Create a custom hook for specific business logic:

```typescript
// /src/hooks/use-custom-bulk-operation.ts

export function useCustomBulkOperation() {
  const queryClient = useQueryClient();
  const bulkArts = useBulkUpdateTaskArts();

  return useMutation({
    mutationFn: async (data: CustomData) => {
      // Custom pre-processing
      const processedData = processData(data);

      // Execute bulk operation
      return bulkArts.mutateAsync(processedData);
    },
    onSuccess: () => {
      // Custom post-processing
      queryClient.invalidateQueries({ queryKey: ['custom'] });
    },
  });
}
```

### Conditional Bulk Operations

Show different operations based on task status:

```typescript
const availableOperations = useMemo(() => {
  const allTasks = tasks.filter(t => selectedTaskIds.includes(t.id));
  const allPending = allTasks.every(t => t.status === TASK_STATUS.PENDING);

  if (allPending) {
    // Only show certain operations for pending tasks
    return BULK_OPERATIONS.filter(op => op.type !== 'cutting-plans');
  }

  return BULK_OPERATIONS;
}, [selectedTaskIds, tasks]);
```

## Next Steps

1. Add analytics tracking for bulk operations
2. Implement bulk operation history
3. Add undo functionality
4. Create bulk operation templates
5. Add progress indicators for large batches

## Support

For help:
- Check `/docs/BULK_OPERATIONS_IMPLEMENTATION.md` for detailed architecture
- Review console logs for detailed error messages
- Verify API endpoints are available
- Check network tab for failed requests
