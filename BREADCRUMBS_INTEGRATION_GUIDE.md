# Breadcrumb Integration Guide

Quick reference for integrating breadcrumbs into existing detail pages.

## Integration Checklist

- [ ] Import Breadcrumb component
- [ ] Import breadcrumbHelpers (optional, recommended)
- [ ] Add Breadcrumb to JSX (after ScrollView, before content)
- [ ] Test navigation by clicking segments
- [ ] Verify entity name displays correctly

## Quick Integration (Copy-Paste Template)

### For Production Schedule Details

```tsx
// 1. Add imports
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { breadcrumbHelpers } from "@/hooks";

// 2. In your component, add breadcrumbs
export default function ScheduleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { data: task } = useTaskDetail(id);

  // Generate breadcrumbs
  const breadcrumbs = breadcrumbHelpers.forScheduleDetail(
    task?.name || "Detalhes",
    id as string
  );

  return (
    <ScrollView>
      <View style={styles.container}>
        {/* Add breadcrumb here */}
        <Breadcrumb segments={breadcrumbs} showHome={true} />

        {/* Rest of your content */}
      </View>
    </ScrollView>
  );
}
```

### For Customer Details

```tsx
// 1. Add imports
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { breadcrumbHelpers } from "@/hooks";

// 2. In your component
export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: customer } = useCustomer(id);

  const breadcrumbs = breadcrumbHelpers.forCustomerDetail(
    customer?.fantasyName || "Detalhes",
    id as string
  );

  return (
    <ScrollView>
      <View style={styles.container}>
        <Breadcrumb segments={breadcrumbs} showHome={true} />
        {/* ... */}
      </View>
    </ScrollView>
  );
}
```

### For Product Details

```tsx
// 1. Add imports
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { breadcrumbHelpers } from "@/hooks";

// 2. In your component
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: product } = useProduct(id);

  const breadcrumbs = breadcrumbHelpers.forProductDetail(
    product?.name || "Detalhes",
    id as string
  );

  return (
    <ScrollView>
      <View style={styles.container}>
        <Breadcrumb segments={breadcrumbs} showHome={true} />
        {/* ... */}
      </View>
    </ScrollView>
  );
}
```

### Generic Detail Page Template

```tsx
// 1. Add imports
import { Breadcrumb, BreadcrumbSegment } from "@/components/ui/breadcrumb";

// 2. In your component
export default function GenericDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: entity } = useEntity(id);

  const breadcrumbs: BreadcrumbSegment[] = [
    { label: "Section Name", path: "/(tabs)/section" },
    { label: "Entity Type", path: "/(tabs)/section/entity-type" },
    { label: entity?.name || "Detalhes", path: `/(tabs)/section/entity-type/details/${id}`, isLast: true },
  ];

  return (
    <ScrollView>
      <View style={styles.container}>
        <Breadcrumb segments={breadcrumbs} showHome={true} />
        {/* ... */}
      </View>
    </ScrollView>
  );
}
```

## All Available Breadcrumb Helpers

```tsx
import { breadcrumbHelpers } from "@/hooks";

// Schedule/Task details
breadcrumbHelpers.forScheduleDetail(taskName, taskId);

// Customer details
breadcrumbHelpers.forCustomerDetail(customerName, customerId);

// Product details
breadcrumbHelpers.forProductDetail(productName, productId);

// Generic detail page
breadcrumbHelpers.forDetail(
  "Section Label",
  "/(tabs)/section",
  "Entity Label",
  "/(tabs)/section/entity",
  "Detail Name"
);

// List page
breadcrumbHelpers.forList(
  "Section Label",
  "/(tabs)/section",
  "List Label",
  "/(tabs)/section/entity/list"
);

// Edit page
breadcrumbHelpers.forEdit(
  "Section Label",
  "/(tabs)/section",
  "Entity Label",
  "/(tabs)/section/entity",
  "Detail Name",
  "/(tabs)/section/entity/details/123"
);

// Create page
breadcrumbHelpers.forCreate(
  "Section Label",
  "/(tabs)/section",
  "Entity Label",
  "/(tabs)/section/entity"
);
```

## Pages to Update (Priority List)

### High Priority (Most Used)
- [x] Production → Schedule → Details (`/production/schedule/details/[id].tsx`)
- [x] Administration → Customers → Details (`/administration/customers/details/[id].tsx`)
- [ ] Production → Service Orders → Details
- [ ] Inventory → Products → Details
- [ ] Human Resources → Employees → Details

### Medium Priority
- [ ] Production → Trucks → Details
- [ ] Production → Garages → Details
- [ ] Painting → Catalog → Details
- [ ] Administration → Collaborators → Details
- [ ] Administration → Sectors → Details

### Low Priority (Less Frequently Used)
- [ ] Production → Cutting → Details
- [ ] Production → Airbrushing → Details
- [ ] Inventory → Suppliers → Details
- [ ] Server → Backups → Details
- [ ] Server → Deployments → Details

## Common Patterns

### Pattern 1: With Entity Name

When you have an entity with a name property:

```tsx
const breadcrumbs = [
  { label: "Section", path: "/(tabs)/section" },
  { label: "Type", path: "/(tabs)/section/type" },
  { label: entity?.name || "Loading...", path: "", isLast: true },
];
```

### Pattern 2: With Fantasy Name (for Customers)

```tsx
const breadcrumbs = breadcrumbHelpers.forCustomerDetail(
  customer?.fantasyName || customer?.companyName || "Detalhes",
  id as string
);
```

### Pattern 3: Nested Resources

For nested routes like `/painting/formulas/[formulaId]/components/[id]`:

```tsx
const breadcrumbs = [
  { label: "Pintura", path: "/(tabs)/painting" },
  { label: "Fórmulas", path: "/(tabs)/painting/formulas" },
  { label: formula?.name || "Fórmula", path: `/(tabs)/painting/formulas/details/${formulaId}` },
  { label: "Componentes", path: `/(tabs)/painting/formulas/${formulaId}/components` },
  { label: component?.name || "Detalhes", path: "", isLast: true },
];
```

### Pattern 4: Auto-Generated (Use When Appropriate)

For simple pages where auto-generation works well:

```tsx
<Breadcrumb showHome={true} />
```

## Styling Tips

### Adjust Padding

```tsx
<Breadcrumb
  style={{
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  }}
  segments={breadcrumbs}
/>
```

### Hide on Mobile (if needed)

```tsx
import { useWindowDimensions } from "react-native";

const { width } = useWindowDimensions();
const showBreadcrumbs = width > 768; // Hide on small screens

{showBreadcrumbs && <Breadcrumb segments={breadcrumbs} />}
```

### Custom Colors (Usually Not Needed)

The component automatically adapts to your theme, but if needed:

```tsx
// Add to your theme configuration instead of styling the component directly
```

## Testing Checklist

When adding breadcrumbs to a page:

1. **Visual Test**
   - [ ] Breadcrumbs appear at the top of the page
   - [ ] Text is readable in both light and dark mode
   - [ ] Icons are properly sized and colored
   - [ ] Segments don't overflow on small screens

2. **Navigation Test**
   - [ ] Home icon navigates to home page
   - [ ] Each segment navigates to correct route
   - [ ] Last segment is not clickable (appears as text only)
   - [ ] Back navigation works as expected

3. **Dynamic Content Test**
   - [ ] Loading state shows appropriate label
   - [ ] Entity name appears when data loads
   - [ ] Name updates if entity changes

4. **Edge Cases**
   - [ ] Works with very long entity names
   - [ ] Handles missing/null entity data gracefully
   - [ ] Works on different screen sizes

## Troubleshooting

### "Cannot find module '@/components/ui/breadcrumb'"

Make sure the file exists at:
`/src/components/ui/breadcrumb.tsx`

### Breadcrumb not showing

Check:
1. Component is imported correctly
2. Segments array has at least one item
3. Component is inside a View/ScrollView
4. No conditional rendering hiding it

### Navigation not working

Verify:
1. Paths start with `/(tabs)/`
2. Routes exist in your app structure
3. `isLast` is only true for the final segment

### Entity name not showing

Check:
1. Entity data has loaded (not undefined)
2. Property name is correct (name, fantasyName, etc.)
3. Fallback text is provided (e.g., "Detalhes")

## Next Steps

After integrating breadcrumbs:

1. Test on a real device or emulator
2. Verify navigation flows work correctly
3. Check performance (breadcrumbs should be lightweight)
4. Consider adding to more pages based on usage patterns
5. Gather user feedback on navigation improvements
