# Breadcrumb Navigation System

This document describes the breadcrumb navigation system implemented in the mobile application.

## Overview

The breadcrumb system provides:
- Visual indication of current location in the app hierarchy
- Quick navigation to parent routes
- Alternative navigation when back button has issues
- Better UX for deeply nested routes

## Components

### 1. Breadcrumb Component

Location: `/src/components/ui/breadcrumb.tsx`

The main component that renders breadcrumb navigation.

#### Basic Usage

```tsx
import { Breadcrumb } from "@/components/ui/breadcrumb";

// Auto-generated breadcrumbs (from current route)
<Breadcrumb showHome={true} />

// Manual breadcrumbs
<Breadcrumb
  segments={[
    { label: "Produção", path: "/(tabs)/production" },
    { label: "Cronograma", path: "/(tabs)/production/schedule" },
    { label: "Detalhes", path: "", isLast: true },
  ]}
  showHome={true}
/>
```

#### Props

- `segments?: BreadcrumbSegment[]` - Manual segments (overrides auto-generated)
- `showHome?: boolean` - Show home icon as first segment (default: true)
- `maxSegments?: number` - Max segments before truncating (default: 5)
- `style?: ViewStyle` - Custom container style
- `onSegmentPress?: (segment) => void` - Custom navigation handler

### 2. Route Labels Configuration

Location: `/src/components/ui/breadcrumb.tsx` (ROUTE_LABELS constant)

Maps route segments to Portuguese labels:

```tsx
export const ROUTE_LABELS: Record<string, string> = {
  "production": "Produção",
  "schedule": "Cronograma",
  "customers": "Clientes",
  // ... more labels
};
```

To add new labels, simply extend this object.

### 3. Breadcrumb Hooks

Location: `/src/hooks/use-breadcrumbs.ts`

Provides utilities for generating breadcrumbs programmatically.

#### useBreadcrumbs Hook

Generate breadcrumbs from the current route with customization:

```tsx
import { useBreadcrumbs } from "@/hooks";

const breadcrumbs = useBreadcrumbs({
  config: {
    // Custom label for a segment
    "schedule": { label: "Tarefas" },
    // Hide a segment
    "(tabs)": { hidden: true },
  },
  // Dynamic labels (e.g., from API data)
  getDynamicLabel: (segment, index) => {
    if (segment === taskId) return task?.name;
    return undefined;
  },
});
```

#### breadcrumbHelpers

Pre-built breadcrumb generators for common patterns:

```tsx
import { breadcrumbHelpers } from "@/hooks";

// Detail page
const segments = breadcrumbHelpers.forDetail(
  "Administração",
  "/(tabs)/administration",
  "Clientes",
  "/(tabs)/administration/customers",
  customerName
);

// Schedule detail
const segments = breadcrumbHelpers.forScheduleDetail(taskName, taskId);

// Customer detail
const segments = breadcrumbHelpers.forCustomerDetail(customerName, customerId);

// Product detail
const segments = breadcrumbHelpers.forProductDetail(productName, productId);
```

#### useBreadcrumbsWithEntity Hook

Automatically update breadcrumbs with entity data:

```tsx
import { useBreadcrumbsWithEntity } from "@/hooks";

const baseBreadcrumbs = [
  { label: "Produção", path: "/(tabs)/production" },
  { label: "Cronograma", path: "/(tabs)/production/schedule" },
  { label: "Carregando...", path: "", isLast: true },
];

const breadcrumbs = useBreadcrumbsWithEntity(
  task, // Entity with id and name
  baseBreadcrumbs,
  "name" // Key to use for label (default: "name")
);
```

## Implementation Examples

### Example 1: Simple Detail Page

```tsx
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { breadcrumbHelpers } from "@/hooks";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: customer } = useCustomer(id);

  const breadcrumbs = breadcrumbHelpers.forCustomerDetail(
    customer?.fantasyName || "Detalhes",
    id
  );

  return (
    <ScrollView>
      <Breadcrumb segments={breadcrumbs} showHome={true} />
      {/* Rest of the page */}
    </ScrollView>
  );
}
```

### Example 2: Auto-Generated Breadcrumbs

```tsx
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function SomeScreen() {
  return (
    <ScrollView>
      {/* Will automatically generate breadcrumbs from route */}
      <Breadcrumb showHome={true} />
      {/* Rest of the page */}
    </ScrollView>
  );
}
```

### Example 3: Dynamic Labels with Entity Data

```tsx
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useBreadcrumbsWithEntity } from "@/hooks";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: task } = useTaskDetail(id);

  const baseBreadcrumbs = [
    { label: "Produção", path: "/(tabs)/production" },
    { label: "Cronograma", path: "/(tabs)/production/schedule" },
    { label: "Carregando...", path: `/(tabs)/production/schedule/details/${id}`, isLast: true },
  ];

  const breadcrumbs = useBreadcrumbsWithEntity(task, baseBreadcrumbs, "name");

  return (
    <ScrollView>
      <Breadcrumb segments={breadcrumbs} showHome={true} />
      {/* Rest of the page */}
    </ScrollView>
  );
}
```

### Example 4: Custom Navigation Handler

```tsx
import { Breadcrumb, BreadcrumbSegment } from "@/components/ui/breadcrumb";
import { router } from "expo-router";

export default function CustomScreen() {
  const handleSegmentPress = (segment: BreadcrumbSegment) => {
    // Custom navigation logic
    console.log("Navigating to:", segment.path);
    router.push(segment.path as any);
  };

  return (
    <ScrollView>
      <Breadcrumb
        segments={[...]}
        onSegmentPress={handleSegmentPress}
      />
    </ScrollView>
  );
}
```

## Adding Breadcrumbs to Existing Pages

### Step 1: Import the component

```tsx
import { Breadcrumb } from "@/components/ui/breadcrumb";
```

### Step 2: Add to your JSX (usually at the top of ScrollView content)

```tsx
<ScrollView>
  <View style={styles.container}>
    {/* Add breadcrumb here */}
    <Breadcrumb
      segments={[
        { label: "Section", path: "/(tabs)/section" },
        { label: "Entity", path: "/(tabs)/section/entity" },
        { label: entityName || "Details", path: "", isLast: true },
      ]}
      showHome={true}
    />

    {/* Rest of your content */}
  </View>
</ScrollView>
```

### Step 3 (Optional): Use helpers for common patterns

```tsx
import { breadcrumbHelpers } from "@/hooks";

const breadcrumbs = breadcrumbHelpers.forDetail(
  "Section Label",
  "/(tabs)/section",
  "Entity Label",
  "/(tabs)/section/entity",
  entityName || "Details"
);

<Breadcrumb segments={breadcrumbs} showHome={true} />
```

## Styling

The breadcrumb component uses the app's theme system and design tokens:

- Respects light/dark mode
- Uses theme colors for text and icons
- Follows spacing and typography guidelines
- Responsive to different screen sizes

To customize styling, pass a `style` prop:

```tsx
<Breadcrumb
  style={{ paddingHorizontal: 20, paddingVertical: 10 }}
  segments={breadcrumbs}
/>
```

## Route Label Management

### Adding New Labels

To add labels for new routes, edit the `ROUTE_LABELS` object in `/src/components/ui/breadcrumb.tsx`:

```tsx
export const ROUTE_LABELS: Record<string, string> = {
  // Existing labels...
  "new-route": "Nova Rota",
  "another-route": "Outra Rota",
};
```

### Dynamic Routes

For dynamic routes (with IDs), the system automatically:
1. Detects dynamic segments (UUIDs, numbers, or [param] syntax)
2. Uses the previous segment's label as context
3. Falls back to "Detalhes" if no context is available

You can override this with manual segments or the `getDynamicLabel` option in `useBreadcrumbs`.

## Best Practices

1. **Use helpers when possible** - They ensure consistency across the app
2. **Show entity names** - Use actual entity names in the last segment when available
3. **Keep it simple** - Don't nest too deep (3-4 levels is usually enough)
4. **Consider mobile** - Breadcrumbs truncate on small screens
5. **Test navigation** - Make sure all segments navigate correctly

## Troubleshooting

### Breadcrumbs not showing

- Check that the component is imported correctly
- Verify segments array is not empty
- Ensure proper route structure in your app

### Wrong labels

- Check if the route segment is in `ROUTE_LABELS`
- Add missing labels to the mapping
- Verify segment names match your route structure

### Navigation not working

- Ensure paths are correct (start with `/(tabs)/`)
- Check that routes exist in your app structure
- Verify `isLast` is set to `true` for the final segment

### Dynamic labels not updating

- Make sure entity data is loaded before rendering breadcrumbs
- Use `useBreadcrumbsWithEntity` hook for automatic updates
- Check that the entity has the field you're trying to display

## Future Enhancements

Potential improvements to consider:

1. **Breadcrumb persistence** - Remember breadcrumb state across navigation
2. **Collapse on mobile** - More aggressive truncation on small screens
3. **Dropdown navigation** - Click on "..." to see hidden segments
4. **Analytics** - Track which breadcrumb segments users click most
5. **Keyboard shortcuts** - Navigate breadcrumbs with keyboard on tablets
6. **Accessibility** - Improve screen reader support and ARIA labels
