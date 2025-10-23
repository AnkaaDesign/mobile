# Breadcrumb Quick Start Guide

Get breadcrumbs working in your page in 2 minutes.

## 30-Second Integration

### Step 1: Import (1 line)

```tsx
import { Breadcrumb } from "@/components/ui/breadcrumb";
```

### Step 2: Add Component (3 lines)

```tsx
<Breadcrumb
  segments={[...]} // See examples below
  showHome={true}
/>
```

Done! 🎉

---

## Copy-Paste Examples

### Production Schedule Details

```tsx
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function ScheduleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { data: task } = useTaskDetail(id);

  return (
    <ScrollView>
      <View style={styles.container}>
        <Breadcrumb
          segments={[
            { label: "Produção", path: "/(tabs)/production" },
            { label: "Cronograma", path: "/(tabs)/production/schedule" },
            { label: task?.name || "Detalhes", path: "", isLast: true },
          ]}
          showHome={true}
        />
        {/* Your content */}
      </View>
    </ScrollView>
  );
}
```

### Customer Details

```tsx
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: customer } = useCustomer(id);

  return (
    <ScrollView>
      <View style={styles.container}>
        <Breadcrumb
          segments={[
            { label: "Administração", path: "/(tabs)/administration" },
            { label: "Clientes", path: "/(tabs)/administration/customers" },
            { label: customer?.fantasyName || "Detalhes", path: "", isLast: true },
          ]}
          showHome={true}
        />
        {/* Your content */}
      </View>
    </ScrollView>
  );
}
```

### Product Details

```tsx
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: product } = useProduct(id);

  return (
    <ScrollView>
      <View style={styles.container}>
        <Breadcrumb
          segments={[
            { label: "Estoque", path: "/(tabs)/inventory" },
            { label: "Produtos", path: "/(tabs)/inventory/products" },
            { label: product?.name || "Detalhes", path: "", isLast: true },
          ]}
          showHome={true}
        />
        {/* Your content */}
      </View>
    </ScrollView>
  );
}
```

---

## Using Helpers (Even Easier!)

### Step 1: Import (2 lines)

```tsx
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { breadcrumbHelpers } from "@/hooks";
```

### Step 2: Use Helper (1 line)

```tsx
const breadcrumbs = breadcrumbHelpers.forScheduleDetail(task?.name || "Detalhes", id);
```

### Step 3: Render (1 line)

```tsx
<Breadcrumb segments={breadcrumbs} showHome={true} />
```

### Complete Example with Helper

```tsx
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { breadcrumbHelpers } from "@/hooks";

export default function ScheduleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { data: task } = useTaskDetail(id);

  const breadcrumbs = breadcrumbHelpers.forScheduleDetail(
    task?.name || "Detalhes",
    id as string
  );

  return (
    <ScrollView>
      <View style={styles.container}>
        <Breadcrumb segments={breadcrumbs} showHome={true} />
        {/* Your content */}
      </View>
    </ScrollView>
  );
}
```

---

## All Available Helpers

```tsx
// Schedule/Task
breadcrumbHelpers.forScheduleDetail(taskName, taskId)

// Customer
breadcrumbHelpers.forCustomerDetail(customerName, customerId)

// Product
breadcrumbHelpers.forProductDetail(productName, productId)

// Generic Detail
breadcrumbHelpers.forDetail(
  "Section",
  "/(tabs)/section",
  "Entity Type",
  "/(tabs)/section/entity",
  "Entity Name"
)

// List Page
breadcrumbHelpers.forList(
  "Section",
  "/(tabs)/section",
  "List Name",
  "/(tabs)/section/list"
)

// Edit Page
breadcrumbHelpers.forEdit(
  "Section",
  "/(tabs)/section",
  "Entity Type",
  "/(tabs)/section/entity",
  "Entity Name",
  "/(tabs)/section/entity/details/123"
)

// Create Page
breadcrumbHelpers.forCreate(
  "Section",
  "/(tabs)/section",
  "Entity Type",
  "/(tabs)/section/entity"
)
```

---

## Common Patterns

### Pattern 1: Simple (2 levels)

```tsx
<Breadcrumb
  segments={[
    { label: "Section", path: "/(tabs)/section" },
    { label: "Current", path: "", isLast: true },
  ]}
  showHome={true}
/>
```

### Pattern 2: With Entity (3 levels)

```tsx
<Breadcrumb
  segments={[
    { label: "Section", path: "/(tabs)/section" },
    { label: "Type", path: "/(tabs)/section/type" },
    { label: entity?.name || "Detalhes", path: "", isLast: true },
  ]}
  showHome={true}
/>
```

### Pattern 3: Deep Nesting (4+ levels)

```tsx
<Breadcrumb
  segments={[
    { label: "Section", path: "/(tabs)/section" },
    { label: "Type", path: "/(tabs)/section/type" },
    { label: "Parent", path: "/(tabs)/section/type/parent" },
    { label: "Current", path: "", isLast: true },
  ]}
  showHome={true}
/>
```

---

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `segments` | `BreadcrumbSegment[]` | Auto-generated | Array of breadcrumb segments |
| `showHome` | `boolean` | `true` | Show home icon as first segment |
| `maxSegments` | `number` | `5` | Max segments before truncating |
| `style` | `ViewStyle` | `undefined` | Custom container style |
| `onSegmentPress` | `function` | Navigation | Custom navigation handler |

### BreadcrumbSegment Type

```tsx
interface BreadcrumbSegment {
  label: string;      // Display text
  path: string;       // Navigation path (empty for last segment)
  isLast?: boolean;   // Is this the current/last segment?
}
```

---

## Troubleshooting

### Issue: Breadcrumb not showing

**Solution:**
```tsx
// Make sure it's inside your View/ScrollView
<ScrollView>
  <View style={styles.container}>
    <Breadcrumb segments={[...]} showHome={true} />
  </View>
</ScrollView>
```

### Issue: Navigation not working

**Solution:**
```tsx
// Paths must start with /(tabs)/
{ label: "Produção", path: "/(tabs)/production" } // ✓
{ label: "Produção", path: "/production" }        // ✗
```

### Issue: Entity name not showing

**Solution:**
```tsx
// Use optional chaining and fallback
{ label: entity?.name || "Detalhes", path: "", isLast: true } // ✓
{ label: entity.name, path: "", isLast: true }                // ✗
```

### Issue: Last segment is clickable

**Solution:**
```tsx
// Set isLast: true and empty path
{ label: "Current", path: "", isLast: true } // ✓
{ label: "Current", path: "/(tabs)/..." }    // ✗
```

---

## What's Next?

After adding breadcrumbs to your page:

1. **Test it**: Click each segment to verify navigation
2. **Check visuals**: View in both light and dark mode
3. **Test loading**: Ensure it handles loading states
4. **Test edges**: Try with long names

---

## Full Documentation

For complete documentation, see:
- `BREADCRUMBS.md` - Full technical docs
- `BREADCRUMBS_INTEGRATION_GUIDE.md` - Detailed integration guide
- `BREADCRUMBS_VISUAL_GUIDE.md` - Visual examples
- `BREADCRUMBS_IMPLEMENTATION_SUMMARY.md` - Overview

---

## Need Help?

Check existing implementations:
- `/src/app/(tabs)/production/schedule/details/[id].tsx`
- `/src/app/(tabs)/administration/customers/details/[id].tsx`

Or refer to the full documentation files listed above.

---

**That's it!** You now have breadcrumbs working in your page. 🎉
