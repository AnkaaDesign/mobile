# Navigation System - Quick Reference

## Import

```typescript
import { useNavigationHelpers } from "@/hooks";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
```

## Basic Navigation

```typescript
const { navigate, navigateBack } = useNavigationHelpers();

// Navigate with history tracking
navigate("/(tabs)/production");

// Navigate without tracking
navigate("/(tabs)/production", { trackHistory: false });

// Navigate with replace
navigate("/(tabs)/production", { replace: true });

// Go back with fallback
navigateBack("/(tabs)/home");
```

## CRUD Patterns

```typescript
const {
  navigateToDetail,
  navigateToEdit,
  navigateToCreate,
  navigateToList,
} = useNavigationHelpers();

const basePath = "/(tabs)/administration/customers";

// List → Detail
navigateToDetail(basePath, "123");

// Detail → Edit
navigateToEdit(basePath, "123");

// List → Create
navigateToCreate(basePath);

// Any → List (smart back)
navigateToList(basePath);
```

## Post-Action Navigation

```typescript
const {
  handlePostSaveNavigation,
  handlePostDeleteNavigation,
} = useNavigationHelpers();

// After saving
handlePostSaveNavigation({
  entityId: "123",
  basePath: "/(tabs)/administration/customers",
  navigateToDetail: true,
  fallbackToList: true,
});

// After deleting
handlePostDeleteNavigation("/(tabs)/administration/customers");
```

## State Queries

```typescript
const {
  canNavigateBack,
  getPreviousPath,
  isRootRoute,
  navigationDepth,
} = useNavigationHelpers();

// Check if back is available
if (canNavigateBack) {
  // Show back button
}

// Get previous path
const prevPath = getPreviousPath();

// Check if on root
if (isRootRoute) {
  // Hide back button
}

// Get depth
console.log("Depth:", navigationDepth);
```

## History Management

```typescript
const {
  getHistory,
  getPreviousRoute,
  clearHistory,
  getNavigationDepth,
} = useNavigationHistory();

// Get full history
const history = getHistory();

// Get previous route with params
const prev = getPreviousRoute();
// Returns: { path: string, timestamp: number, params?: {...} } | null

// Clear history
clearHistory();

// Get depth
const depth = getNavigationDepth();
```

## Route Type Checking

```typescript
import { useRouteType } from "@/hooks";

const { checkRouteType } = useRouteType();

const info = checkRouteType(pathname);
// Returns: {
//   isList: boolean,
//   isDetail: boolean,
//   isEdit: boolean,
//   isCreate: boolean,
//   isHome: boolean,
//   isAuth: boolean,
//   isInitial: boolean,
// }
```

## Deep Links

```typescript
import { useDeepLinkNavigation } from "@/hooks";

const { handleDeepLink } = useDeepLinkNavigation();

// Handle deep link
handleDeepLink("myapp://path/to/screen");

// Clear history when handling
handleDeepLink("myapp://path/to/screen", true);
```

## Common Patterns

### Detail Screen

```typescript
export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const { navigateToEdit, navigateBack } = useNavigationHelpers();

  const basePath = "/(tabs)/module/entity";

  return (
    <>
      <Button onPress={() => navigateBack(`${basePath}/list`)}>
        Back
      </Button>
      <Button onPress={() => navigateToEdit(basePath, id)}>
        Edit
      </Button>
    </>
  );
}
```

### Edit Screen

```typescript
export default function EditScreen() {
  const { id } = useLocalSearchParams();
  const { handlePostSaveNavigation } = useNavigationHelpers();

  const basePath = "/(tabs)/module/entity";

  const onSave = async (data) => {
    await update(id, data);

    handlePostSaveNavigation({
      entityId: id,
      basePath,
      navigateToDetail: true,
      fallbackToList: true,
    });
  };

  return <Form onSubmit={onSave} />;
}
```

### List Screen

```typescript
export default function ListScreen() {
  const {
    navigateToDetail,
    navigateToCreate,
  } = useNavigationHelpers();

  const basePath = "/(tabs)/module/entity";

  return (
    <>
      <Button onPress={() => navigateToCreate(basePath)}>
        Create
      </Button>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigateToDetail(basePath, item.id)}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </>
  );
}
```

### Conditional Back Button

```typescript
export default function Screen() {
  const { canNavigateBack, navigateBack } = useNavigationHelpers();

  return (
    <>
      {canNavigateBack && (
        <IconButton
          icon="arrow-left"
          onPress={() => navigateBack("/(tabs)/home")}
        />
      )}
      {/* Content */}
    </>
  );
}
```

## API Cheat Sheet

| Function | Purpose | Example |
|----------|---------|---------|
| `navigate(path, opts)` | Navigate with options | `navigate("/(tabs)/home")` |
| `navigateBack(fallback?)` | Go back or fallback | `navigateBack("/(tabs)/home")` |
| `navigateToHome()` | Go to home | `navigateToHome()` |
| `navigateToDetail(base, id)` | Go to detail | `navigateToDetail(base, "123")` |
| `navigateToEdit(base, id)` | Go to edit | `navigateToEdit(base, "123")` |
| `navigateToCreate(base)` | Go to create | `navigateToCreate(base)` |
| `navigateToList(base)` | Go to list | `navigateToList(base)` |
| `redirectTo(path)` | Replace current | `redirectTo(path)` |
| `handlePostSaveNavigation(opts)` | After save | See example above |
| `handlePostDeleteNavigation(base)` | After delete | `handlePostDeleteNavigation(base)` |
| `canNavigateBack` | Check if can go back | `if (canNavigateBack) {...}` |
| `getPreviousPath()` | Get previous path | `const prev = getPreviousPath()` |
| `isRootRoute` | Check if on root | `if (isRootRoute) {...}` |
| `navigationDepth` | Get stack depth | `console.log(navigationDepth)` |
| `getHistory()` | Get full history | `const history = getHistory()` |
| `getPreviousRoute()` | Get previous entry | `const prev = getPreviousRoute()` |
| `clearHistory()` | Clear all history | `clearHistory()` |

## Tips

1. **Always provide fallbacks** for `navigateBack()`
2. **Use CRUD helpers** instead of manual navigation
3. **Check `canNavigateBack`** before showing back button
4. **Use post-action helpers** for consistent behavior
5. **Track params** when navigating to dynamic routes

## Debug

```typescript
// Enable dev logs
if (__DEV__) {
  const { getHistory, getNavigationDepth } = useNavigationHistory();
  console.log('History:', getHistory());
  console.log('Depth:', getNavigationDepth());
}
```

## See Also

- `NAVIGATION_HISTORY_GUIDE.md` - Full documentation
- `NAVIGATION_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `src/hooks/use-navigation-helpers.ts` - Source code
- `src/contexts/navigation-history-context.tsx` - Context implementation
