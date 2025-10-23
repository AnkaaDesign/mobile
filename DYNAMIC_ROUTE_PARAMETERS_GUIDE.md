# Dynamic Route Parameters - Complete Guide

This guide explains how to properly handle dynamic route parameters in the mobile application using Expo Router.

## Table of Contents

1. [Overview](#overview)
2. [Common Issues](#common-issues)
3. [Type-Safe Solutions](#type-safe-solutions)
4. [Navigation Best Practices](#navigation-best-practices)
5. [Migration Guide](#migration-guide)
6. [Examples](#examples)

## Overview

Dynamic routes in Expo Router use file-based routing with square brackets for parameters:
- Single parameter: `details/[id].tsx`
- Multiple parameters: `[orderId]/items/details/[id].tsx`
- Custom parameter: `payroll/[userId].tsx`

## Common Issues

### Issue 1: Inconsistent Parameter Extraction

❌ **Problem:**
```typescript
// Different patterns across the codebase
const { id } = useLocalSearchParams();  // May be string or string[]
const params = useLocalSearchParams<{ id: string }>();
const id = params?.id || "";
const id = Array.isArray(id) ? id[0] : id;
```

✅ **Solution:**
```typescript
import { useIdParam, useRequiredIdParam } from '@/hooks';

// For optional validation
const { id, isValid, error } = useIdParam();

// For required parameters (throws on error)
const id = useRequiredIdParam();
```

### Issue 2: Missing Type Safety

❌ **Problem:**
```typescript
const params = useLocalSearchParams();
const id = params.id;  // Type: string | string[] | undefined
```

✅ **Solution:**
```typescript
import { useLocalSearchParams } from 'expo-router';
import { IdParams } from '@/types/route-params';

const params = useLocalSearchParams<IdParams>();
const id = params.id;  // Type: string
```

### Issue 3: UUID Validation Missing

❌ **Problem:**
```typescript
const { id } = useLocalSearchParams();
// No validation - may crash with invalid ID
const { data } = useQuery(['item', id], () => fetchItem(id));
```

✅ **Solution:**
```typescript
import { useRequiredIdParam } from '@/hooks';

const id = useRequiredIdParam();  // Throws if invalid UUID
const { data } = useQuery(['item', id], () => fetchItem(id));
```

### Issue 4: Navigation to Dynamic Routes

❌ **Problem:**
```typescript
// Inconsistent navigation patterns
router.push(`/products/details/${id}` as any);
router.push(routeToMobilePath(routes.inventory.products.details(id)) as any);
```

✅ **Solution:**
```typescript
import { router } from 'expo-router';
import { routeToMobilePath } from '@/lib/route-mapper';
import { routes } from '@/constants';

// Type-safe navigation
router.push(routeToMobilePath(routes.inventory.products.details(id)));
```

## Type-Safe Solutions

### 1. Basic Route Parameter Types

```typescript
// types/route-params.ts
export interface IdParams {
  id: string;
}

export interface NestedIdParams {
  orderId: string;
  id: string;
}

export interface FormulaComponentParams {
  formulaId: string;
  id: string;
}
```

### 2. Safe Parameter Extraction Hooks

```typescript
// Single ID parameter
import { useIdParam, useRequiredIdParam } from '@/hooks';

// With validation
const { id, isValid, error } = useIdParam();
if (!isValid) {
  return <ErrorScreen message={error} />;
}

// Required (throws on error)
const id = useRequiredIdParam();
```

```typescript
// Nested parameters (e.g., order items)
import { useNestedIdParams, useRequiredNestedIdParams } from '@/hooks';

// With validation
const { orderId, id, isValid, error } = useNestedIdParams();

// Required (throws on error)
const { orderId, id } = useRequiredNestedIdParams();
```

```typescript
// Formula components
import { useFormulaComponentParams, useRequiredFormulaComponentParams } from '@/hooks';

const { formulaId, id } = useRequiredFormulaComponentParams();
```

### 3. Utility Functions

```typescript
import { extractParam, isValidUUID, requireIdParam } from '@/types/route-params';

// Extract single value from array or string
const id = extractParam(params.id);

// Validate UUID format
if (isValidUUID(id)) {
  // Safe to use
}

// Extract and validate (throws on error)
const id = requireIdParam(params);
```

## Navigation Best Practices

### Pattern 1: Navigation from List Views

```typescript
// In a list component
import { router } from 'expo-router';
import { routeToMobilePath } from '@/lib/route-mapper';
import { routes } from '@/constants';

function CustomerTable({ customers }: Props) {
  const handleCustomerPress = (customerId: string) => {
    // Use route mapper for consistency
    router.push(routeToMobilePath(routes.administration.customers.details(customerId)));
  };

  return (
    <TouchableOpacity onPress={() => handleCustomerPress(customer.id)}>
      <CustomerRow customer={customer} />
    </TouchableOpacity>
  );
}
```

### Pattern 2: Navigation to Edit Routes

```typescript
// In a detail screen
const id = useRequiredIdParam();

const handleEdit = () => {
  router.push(routeToMobilePath(routes.administration.customers.edit(id)));
};
```

### Pattern 3: Navigation to Nested Routes

```typescript
// Navigate to order item detail
const handleItemPress = (orderId: string, itemId: string) => {
  router.push(`/(tabs)/inventory/orders/${orderId}/items/details/${itemId}`);
};

// Navigate to formula component detail
const handleComponentPress = (formulaId: string, componentId: string) => {
  router.push(`/(tabs)/painting/formulas/${formulaId}/components/details/${componentId}`);
};
```

### Pattern 4: Navigation with Query Parameters

```typescript
// With query params
router.push({
  pathname: routeToMobilePath(routes.humanResources.payroll.details('userId')),
  params: { year: '2024', month: '1' }
});

// Extract in detail screen
const { userId } = useUserIdParam();
const { year, month } = useQueryParams<{ year: string; month: string }>();
```

## Migration Guide

### Step 1: Update Imports

**Before:**
```typescript
import { useLocalSearchParams } from 'expo-router';
```

**After:**
```typescript
import { useLocalSearchParams } from 'expo-router';
import { useRequiredIdParam } from '@/hooks';
import { IdParams } from '@/types/route-params';
```

### Step 2: Replace Parameter Extraction

**Before:**
```typescript
const params = useLocalSearchParams<{ id: string }>();
const id = params?.id || "";

if (!id || id === "") {
  return <ErrorScreen />;
}
```

**After:**
```typescript
const id = useRequiredIdParam();
// Automatically validated and throws on error
```

### Step 3: Update Navigation Calls

**Before:**
```typescript
router.push(`/products/details/${id}` as any);
```

**After:**
```typescript
import { routeToMobilePath } from '@/lib/route-mapper';
import { routes } from '@/constants';

router.push(routeToMobilePath(routes.inventory.products.details(id)));
```

## Examples

### Example 1: Basic Detail Screen

```typescript
// app/(tabs)/products/details/[id].tsx
import React from 'react';
import { useRequiredIdParam } from '@/hooks';
import { useProduct } from '@/hooks';

export default function ProductDetailScreen() {
  // Automatically validates UUID and throws on error
  const id = useRequiredIdParam();

  const { data: product, isLoading, error } = useProduct(id);

  if (isLoading) return <LoadingScreen />;
  if (error || !product) return <ErrorScreen />;

  return <ProductDetails product={product} />;
}
```

### Example 2: Nested Parameters

```typescript
// app/(tabs)/orders/[orderId]/items/details/[id].tsx
import React from 'react';
import { useRequiredNestedIdParams } from '@/hooks';
import { useOrderItem } from '@/hooks';

export default function OrderItemDetailScreen() {
  const { orderId, id } = useRequiredNestedIdParams();

  const { data: orderItem } = useOrderItem(id, {
    include: { order: true, item: true }
  });

  return <OrderItemDetails orderItem={orderItem} />;
}
```

### Example 3: List with Navigation

```typescript
// app/(tabs)/products/list.tsx
import React from 'react';
import { router } from 'expo-router';
import { routeToMobilePath } from '@/lib/route-mapper';
import { routes } from '@/constants';

export default function ProductListScreen() {
  const { products } = useProducts();

  const handleProductPress = (productId: string) => {
    router.push(routeToMobilePath(routes.inventory.products.details(productId)));
  };

  const handleProductEdit = (productId: string) => {
    router.push(routeToMobilePath(routes.inventory.products.edit(productId)));
  };

  return (
    <ProductTable
      products={products}
      onProductPress={handleProductPress}
      onProductEdit={handleProductEdit}
    />
  );
}
```

### Example 4: Formula Components (Multiple Nested Params)

```typescript
// app/(tabs)/painting/formulas/[formulaId]/components/details/[id].tsx
import React from 'react';
import { router } from 'expo-router';
import { useRequiredFormulaComponentParams } from '@/hooks';

export default function ComponentDetailScreen() {
  const { formulaId, id } = useRequiredFormulaComponentParams();

  const { data: component } = usePaintFormulaComponent(id, {
    include: { item: true, formula: true }
  });

  const handleEdit = () => {
    router.push(`/(tabs)/painting/formulas/${formulaId}/components/edit/${id}`);
  };

  return <ComponentDetails component={component} onEdit={handleEdit} />;
}
```

### Example 5: Error Handling with Optional Validation

```typescript
// When you need custom error handling
import React from 'react';
import { useIdParam } from '@/hooks';

export default function ProductDetailScreen() {
  const { id, isValid, error } = useIdParam();

  if (!isValid) {
    return (
      <ErrorScreen
        message="Invalid Product ID"
        detail={error || 'The product ID in the URL is not valid'}
        onRetry={() => router.back()}
      />
    );
  }

  const { data: product } = useProduct(id);

  return <ProductDetails product={product} />;
}
```

## Testing Dynamic Routes

### Unit Testing Route Parameters

```typescript
// __tests__/hooks/use-route-params.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useRequiredIdParam } from '@/hooks';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn()
}));

describe('useRequiredIdParam', () => {
  it('should extract valid UUID', () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000';
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: validId });

    const { result } = renderHook(() => useRequiredIdParam());
    expect(result.current).toBe(validId);
  });

  it('should throw on invalid UUID', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'invalid' });

    expect(() => {
      renderHook(() => useRequiredIdParam());
    }).toThrow('Invalid ID format');
  });
});
```

### Integration Testing Navigation

```typescript
// __tests__/navigation/dynamic-routes.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import ProductList from '@/app/(tabs)/products/list';

jest.mock('expo-router');

describe('Dynamic Route Navigation', () => {
  it('should navigate to product detail with correct ID', () => {
    const { getByText } = render(<ProductList />);
    const product = getByText('Test Product');

    fireEvent.press(product);

    expect(router.push).toHaveBeenCalledWith(
      expect.stringContaining('/products/details/')
    );
  });
});
```

## Troubleshooting

### Issue: "Invalid ID format" error

**Cause:** The ID in the URL is not a valid UUID.

**Solution:**
1. Check that navigation passes valid UUID
2. Use `useIdParam()` instead of `useRequiredIdParam()` for custom error handling
3. Verify the route constant function returns proper UUID

### Issue: TypeScript error "Property 'id' does not exist"

**Cause:** Missing type annotation on `useLocalSearchParams`.

**Solution:**
```typescript
import { IdParams } from '@/types/route-params';

const params = useLocalSearchParams<IdParams>();
```

### Issue: Navigation shows "as any" type cast

**Cause:** TypeScript doesn't recognize the route path.

**Solution:**
Use `routeToMobilePath` helper:
```typescript
import { routeToMobilePath } from '@/lib/route-mapper';
router.push(routeToMobilePath(routes.products.details(id)));
```

## Best Practices Summary

1. ✅ Always use type-safe hooks for parameter extraction
2. ✅ Use `useRequiredIdParam()` for simple cases
3. ✅ Use `useIdParam()` when you need custom error handling
4. ✅ Validate UUID format before making API calls
5. ✅ Use `routeToMobilePath()` for consistent navigation
6. ✅ Export route parameter interfaces from `types/route-params.ts`
7. ✅ Handle array parameters properly with `extractParam()`
8. ❌ Don't cast navigation paths with `as any`
9. ❌ Don't use raw `useLocalSearchParams()` without types
10. ❌ Don't skip UUID validation on dynamic routes

## Related Files

- `/src/types/route-params.ts` - Type definitions
- `/src/hooks/use-route-params.ts` - Custom hooks
- `/src/lib/route-mapper.ts` - Navigation utilities
- `/src/constants/routes.ts` - Route constants
