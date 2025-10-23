# Route Parameter Migration Examples

This document shows actual code changes for migrating from unsafe parameter handling to type-safe parameter extraction.

## Example 1: Basic Detail Screen (Customer Details)

### Before (Current Implementation)
```typescript
// app/(tabs)/administration/customers/details/[id].tsx
import { useLocalSearchParams, router } from "expo-router";

export default function CustomerDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useCustomer(id, {
    include: { /* ... */ },
    enabled: !!id && id !== "",
  });

  const customer = response?.data;

  if (error || !customer || !id || id === "") {
    return (
      <ErrorScreen message="Cliente não encontrado" />
    );
  }

  // Rest of component...
}
```

### After (With Type-Safe Hooks)
```typescript
// app/(tabs)/administration/customers/details/[id].tsx
import { router } from "expo-router";
import { useRequiredIdParam } from "@/hooks";

export default function CustomerDetailScreen() {
  // Automatically validates UUID and throws on error
  const id = useRequiredIdParam();

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useCustomer(id, {
    include: { /* ... */ },
    // No need for 'enabled' check - id is always valid
  });

  const customer = response?.data;

  if (error || !customer) {
    return (
      <ErrorScreen message="Cliente não encontrado" />
    );
  }

  // Rest of component...
}
```

**Benefits:**
- ✅ Removed redundant empty string checks
- ✅ Automatic UUID validation
- ✅ Cleaner error handling
- ✅ Less code to maintain

---

## Example 2: Nested Parameters (Order Items)

### Before (Current Implementation)
```typescript
// app/(tabs)/inventory/orders/[orderId]/items/details/[id].tsx
import { useRouter, useLocalSearchParams } from "expo-router";

export default function OrderItemDetailScreen() {
  const router = useRouter();
  const { orderId, id } = useLocalSearchParams<{ orderId: string; id: string }>();

  const {
    data: orderItem,
    isLoading,
    error,
    refetch,
  } = useOrderItem(id!, {
    include: { /* ... */ },
    enabled: !!id,
  });

  const handleEdit = () => {
    router.push(`/inventory/orders/${orderId}/items/edit/${id}` as any);
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando item..." />;
  }

  if (error || !orderItem) {
    return <ErrorScreen message="Erro ao carregar item" />;
  }

  // Rest of component...
}
```

### After (With Type-Safe Hooks)
```typescript
// app/(tabs)/inventory/orders/[orderId]/items/details/[id].tsx
import { router } from "expo-router";
import { useRequiredNestedIdParams } from "@/hooks";

export default function OrderItemDetailScreen() {
  // Extracts and validates both orderId and id
  const { orderId, id } = useRequiredNestedIdParams();

  const {
    data: orderItem,
    isLoading,
    error,
    refetch,
  } = useOrderItem(id, {
    include: { /* ... */ },
    // No enabled check needed
  });

  const handleEdit = () => {
    // Type-safe navigation
    router.push(`/(tabs)/inventory/orders/${orderId}/items/edit/${id}`);
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando item..." />;
  }

  if (error || !orderItem) {
    return <ErrorScreen message="Erro ao carregar item" />;
  }

  // Rest of component...
}
```

**Benefits:**
- ✅ Validates both parameters automatically
- ✅ No need for non-null assertions (`id!`)
- ✅ Removed type casting (`as any`)
- ✅ Clearer intent

---

## Example 3: Formula Components (Custom Nested Routes)

### Before (Current Implementation)
```typescript
// app/(tabs)/painting/formulas/[formulaId]/components/details/[id].tsx
import { useLocalSearchParams } from "expo-router";

export default function ComponentDetailsScreen() {
  const { formulaId, id } = useLocalSearchParams<{ formulaId: string; id: string }>();

  const {
    data: component,
    isLoading,
    error,
    refetch,
  } = usePaintFormulaComponent(id!, {
    include: { /* ... */ }
  });

  const handleEdit = () => {
    router.push(`/painting/formulas/${formulaId}/components/edit/${id}`);
  };

  if (error || !component?.data) {
    return <ErrorScreen message="Erro ao carregar componente" />;
  }

  // Rest of component...
}
```

### After (With Type-Safe Hooks)
```typescript
// app/(tabs)/painting/formulas/[formulaId]/components/details/[id].tsx
import { router } from "expo-router";
import { useRequiredFormulaComponentParams } from "@/hooks";

export default function ComponentDetailsScreen() {
  // Dedicated hook for formula component params
  const { formulaId, id } = useRequiredFormulaComponentParams();

  const {
    data: component,
    isLoading,
    error,
    refetch,
  } = usePaintFormulaComponent(id, {
    include: { /* ... */ }
  });

  const handleEdit = () => {
    router.push(`/(tabs)/painting/formulas/${formulaId}/components/edit/${id}`);
  };

  if (error || !component?.data) {
    return <ErrorScreen message="Erro ao carregar componente" />;
  }

  // Rest of component...
}
```

**Benefits:**
- ✅ Dedicated hook for this specific parameter pattern
- ✅ No non-null assertions
- ✅ Consistent error handling

---

## Example 4: Optional Parameters with Custom Error Handling

### Before (Current Implementation)
```typescript
// app/(tabs)/production/schedule/details/[id].tsx
import { useLocalSearchParams } from "expo-router";

export default function ScheduleDetailsScreen() {
  const { id } = useLocalSearchParams();

  // Check if id is valid
  if (!id || (Array.isArray(id) && id.length === 0)) {
    return <ErrorScreen message="ID da tarefa não fornecido" />;
  }

  // Extract string from array if needed
  const taskId = Array.isArray(id) ? id[0] : id;

  const { data: response, isLoading, error, refetch } = useTaskDetail(taskId as string, {
    include: { /* ... */ },
  });

  // Rest of component...
}
```

### After (With Type-Safe Hooks - Option 1: Required)
```typescript
// app/(tabs)/production/schedule/details/[id].tsx
import { useRequiredIdParam } from "@/hooks";

export default function ScheduleDetailsScreen() {
  // Throws error if ID is missing or invalid
  const id = useRequiredIdParam();

  const { data: response, isLoading, error, refetch } = useTaskDetail(id, {
    include: { /* ... */ },
  });

  // Rest of component...
}
```

### After (With Type-Safe Hooks - Option 2: Custom Error Handling)
```typescript
// app/(tabs)/production/schedule/details/[id].tsx
import { useIdParam } from "@/hooks";

export default function ScheduleDetailsScreen() {
  // Returns validation state for custom handling
  const { id, isValid, error } = useIdParam();

  if (!isValid) {
    return (
      <ErrorScreen
        message="ID da tarefa inválido"
        detail={error || "O ID fornecido não é válido"}
        onRetry={() => router.back()}
      />
    );
  }

  const { data: response, isLoading, error: queryError, refetch } = useTaskDetail(id, {
    include: { /* ... */ },
  });

  // Rest of component...
}
```

**Benefits:**
- ✅ No manual array handling
- ✅ UUID validation built-in
- ✅ Choice between automatic error throwing or custom handling
- ✅ No type assertions needed

---

## Example 5: List Navigation (Customer List)

### Before (Current Implementation)
```typescript
// app/(tabs)/administration/customers/list.tsx
import { useRouter } from "expo-router";
import { routes } from '@/constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function CustomerListScreen() {
  const router = useRouter();

  const handleCustomerPress = (customerId: string) => {
    router.push(routeToMobilePath(routes.administration.customers.details(customerId)) as any);
  };

  const handleEditCustomer = (customerId: string) => {
    router.push(routeToMobilePath(routes.administration.customers.edit(customerId)) as any);
  };

  return (
    <CustomerTable
      customers={customers}
      onCustomerPress={handleCustomerPress}
      onCustomerEdit={handleEditCustomer}
    />
  );
}
```

### After (Type-Safe Navigation)
```typescript
// app/(tabs)/administration/customers/list.tsx
import { router } from "expo-router";
import { routes } from '@/constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function CustomerListScreen() {
  const handleCustomerPress = (customerId: string) => {
    // No type casting needed
    router.push(routeToMobilePath(routes.administration.customers.details(customerId)));
  };

  const handleEditCustomer = (customerId: string) => {
    router.push(routeToMobilePath(routes.administration.customers.edit(customerId)));
  };

  return (
    <CustomerTable
      customers={customers}
      onCustomerPress={handleCustomerPress}
      onCustomerEdit={handleEditCustomer}
    />
  );
}
```

**Benefits:**
- ✅ Removed unnecessary `as any` type casts
- ✅ Type-safe navigation paths
- ✅ Better IDE autocomplete

---

## Example 6: User-Specific Route (Payroll)

### Before (Current Implementation)
```typescript
// app/(tabs)/human-resources/payroll/[userId].tsx
import { useLocalSearchParams } from "expo-router";

export default function PayrollScreen() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;

  const { data: payroll } = usePayrollByUser(userId, {
    year: Number(params.year) || new Date().getFullYear(),
    month: Number(params.month) || new Date().getMonth() + 1,
  });

  // Rest of component...
}
```

### After (With Type-Safe Hooks)
```typescript
// app/(tabs)/human-resources/payroll/[userId].tsx
import { useUserIdParam, useQueryParams } from "@/hooks";

export default function PayrollScreen() {
  const { userId, isValid, error } = useUserIdParam();
  const { year, month } = useQueryParams<{ year: string; month: string }>();

  if (!isValid) {
    return <ErrorScreen message="ID do usuário inválido" detail={error} />;
  }

  const { data: payroll } = usePayrollByUser(userId, {
    year: Number(year) || new Date().getFullYear(),
    month: Number(month) || new Date().getMonth() + 1,
  });

  // Rest of component...
}
```

**Benefits:**
- ✅ Dedicated hook for userId parameter
- ✅ Separate hook for query parameters
- ✅ Validation before API call
- ✅ No type assertions

---

## Migration Checklist

For each dynamic route file, follow these steps:

### Step 1: Update Imports
```typescript
// Add new imports
import { useRequiredIdParam, useIdParam } from "@/hooks";
// or for nested params
import { useRequiredNestedIdParams } from "@/hooks";
```

### Step 2: Replace Parameter Extraction
```typescript
// Remove this
const params = useLocalSearchParams<{ id: string }>();
const id = params?.id || "";

// Replace with this
const id = useRequiredIdParam();
```

### Step 3: Remove Redundant Checks
```typescript
// Remove this
if (!id || id === "") {
  return <ErrorScreen />;
}

// The hook already validates
```

### Step 4: Update Query Hooks
```typescript
// Before
useQuery(['item', id], () => fetchItem(id), {
  enabled: !!id && id !== "",
});

// After
useQuery(['item', id], () => fetchItem(id));
// No enabled check needed - id is always valid
```

### Step 5: Fix Navigation Calls
```typescript
// Remove 'as any' casts
router.push(path as any);  // ❌

// Use routeToMobilePath
router.push(routeToMobilePath(routes.products.details(id)));  // ✅
```

### Step 6: Test
1. Navigate to the route with a valid ID
2. Try navigating with an invalid ID (should show error)
3. Verify all navigation from list views works
4. Check that edit/delete actions work correctly

---

## Common Patterns Reference

### Pattern: Basic Detail Screen
```typescript
const id = useRequiredIdParam();
const { data } = useEntity(id);
```

### Pattern: Nested Detail Screen
```typescript
const { orderId, id } = useRequiredNestedIdParams();
const { data } = useEntityItem(id, { include: { order: true } });
```

### Pattern: Custom Nested Parameters
```typescript
const { formulaId, id } = useRequiredFormulaComponentParams();
const { data } = useFormulaComponent(id);
```

### Pattern: Optional Validation
```typescript
const { id, isValid, error } = useIdParam();
if (!isValid) return <ErrorScreen message={error} />;
```

### Pattern: Query Parameters
```typescript
const id = useRequiredIdParam();
const { year, month } = useQueryParams<{ year: string; month: string }>();
```

### Pattern: Navigation to Detail
```typescript
const handlePress = (id: string) => {
  router.push(routeToMobilePath(routes.module.entity.details(id)));
};
```

### Pattern: Navigation to Edit
```typescript
const id = useRequiredIdParam();
const handleEdit = () => {
  router.push(routeToMobilePath(routes.module.entity.edit(id)));
};
```

---

## Files to Migrate (Priority Order)

### High Priority (Most Used)
1. `/app/(tabs)/administration/customers/details/[id].tsx`
2. `/app/(tabs)/administration/customers/list.tsx`
3. `/app/(tabs)/inventory/products/details/[id].tsx`
4. `/app/(tabs)/inventory/products/list.tsx`
5. `/app/(tabs)/production/schedule/details/[id].tsx`

### Medium Priority
6. `/app/(tabs)/inventory/orders/[orderId]/items/details/[id].tsx`
7. `/app/(tabs)/painting/formulas/[formulaId]/components/details/[id].tsx`
8. `/app/(tabs)/human-resources/employees/details/[id].tsx`

### Lower Priority
- All other detail screens
- All other edit screens
- List views with navigation

---

## Testing After Migration

### Manual Testing Checklist
- [ ] Navigate from list to detail view
- [ ] Navigate from detail to edit view
- [ ] Try with invalid ID in URL
- [ ] Try with missing ID in URL
- [ ] Verify back navigation works
- [ ] Check deep linking still works

### Automated Tests
```typescript
// Example test
describe('CustomerDetailScreen', () => {
  it('should load customer with valid ID', () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000';
    // Mock useRequiredIdParam
    jest.spyOn(hooks, 'useRequiredIdParam').mockReturnValue(validId);

    const { getByText } = render(<CustomerDetailScreen />);
    expect(getByText('Customer Name')).toBeInTheDocument();
  });

  it('should throw error with invalid ID', () => {
    jest.spyOn(hooks, 'useRequiredIdParam').mockImplementation(() => {
      throw new Error('Invalid ID format');
    });

    expect(() => render(<CustomerDetailScreen />)).toThrow('Invalid ID format');
  });
});
```
