# Navigation Overlay Debug Guide

## Logging Added
Comprehensive console logging has been added to the navigation loading context to help identify issues. Look for logs prefixed with `[NavigationLoading]`, `[FAB]`, and component-specific prefixes.

## Known Issues Fixed

### 1. Forward Navigation (Create Forms)
- **Fixed**: Components now use `pushWithLoading()` instead of `router.push()`
- **Affected Files**:
  - `src/app/(tabs)/producao/agenda/index.tsx`
  - `src/components/list/Layout/index.tsx`
  - `src/components/production/task/schedule/TaskScheduleLayout.tsx`

### 2. Back Navigation
- **Fixed**: Components now use `goBackWithLoading()` instead of `router.back()`
- **Affected Files**:
  - `src/app/(tabs)/producao/agenda/cadastrar.tsx`
  - `src/app/(tabs)/producao/ordens-de-servico/cadastrar.tsx`
  - `src/app/(tabs)/producao/ordens-de-servico/editar/[id].tsx`

## How to Debug Remaining Issues

### 1. Check Console Logs
Run the app with console open and look for these log patterns:

```
[NavigationLoading] startNavigation called
[NavigationLoading] Pathname changed: from X to Y
[NavigationLoading] Auto-hiding overlay due to pathname change
[NavigationLoading] Safety timeout triggered
```

### 2. Key Things to Check

#### When overlay gets stuck:
1. Check if `startNavigation` was called
2. Check if pathname changed (should log "Pathname changed")
3. Check if safety timeout triggered after 2 seconds
4. Check if there are any navigation errors

#### Log sequence for successful navigation:
```
[FAB] handlePress called
[NavigationLoading] pushWithLoading: { route: "/path" }
[NavigationLoading] startNavigation called
[NavigationLoading] showOverlay called
[NavigationLoading] Pathname changed: from /old to /new
[NavigationLoading] Auto-hiding overlay due to pathname change
[NavigationLoading] Fade out complete
```

#### Log sequence for back navigation:
```
[Component] handleCancel called
[NavigationLoading] goBackWithLoading
[NavigationLoading] startNavigation called
[NavigationLoading] Executing router.back()
[NavigationLoading] Pathname changed
[NavigationLoading] Auto-hiding overlay
```

### 3. Common Problem Patterns

#### Issue: Overlay stays after navigation
- **Cause**: Pathname not changing or not detected
- **Debug**: Check if `previousPathnameRef.current` is null on first navigation
- **Solution**: Safety timeout should clear after 2 seconds

#### Issue: Double overlay
- **Cause**: Multiple navigation attempts
- **Debug**: Look for "Navigation already in progress, skipping"
- **Solution**: Navigation loading prevents double navigation

#### Issue: Overlay appears but disappears immediately
- **Cause**: Navigation happens too fast
- **Debug**: Check MIN_DISPLAY_TIME value
- **Solution**: Currently set to 0 for instant feedback

### 4. Testing Checklist

- [ ] Open create form from FAB → Overlay shows → Form loads → Overlay hides
- [ ] Cancel form (with back) → Overlay shows → Returns to list → Overlay hides
- [ ] Hardware back button → Should work same as cancel
- [ ] Quick navigation (spam FAB) → Should prevent double navigation
- [ ] Failed navigation → Safety timeout after 2 seconds

### 5. If Issues Persist

1. **Check if using correct navigation methods**:
   - Forward: `pushWithLoading()` or `replaceWithLoading()`
   - Back: `goBackWithLoading()`
   - Never use raw `router.push()`, `router.back()` with loading overlays

2. **Check pathname detection**:
   - Add log in component: `console.log('Current path:', usePathname())`
   - Verify path actually changes on navigation

3. **Check for navigation errors**:
   - Look for `[NavigationLoading] Navigation error:` in logs
   - Check if routes are valid

4. **Force clear overlay** (temporary workaround):
   - Call `endNavigation()` manually after navigation
   - Reduce DEFAULT_TIMEOUT from 2000ms if needed

## Files with Debug Logs

1. `src/contexts/navigation-loading-context.tsx` - Main context with all navigation logic
2. `src/components/ui/fab.tsx` - FAB button logging
3. `src/app/(tabs)/producao/agenda/cadastrar.tsx` - Task creation form
4. `src/app/(tabs)/producao/ordens-de-servico/cadastrar.tsx` - Service order creation
5. `src/app/(tabs)/producao/ordens-de-servico/editar/[id].tsx` - Service order editing

## Next Steps

1. Run the app and test navigation scenarios
2. Collect console logs when overlay gets stuck
3. Look for patterns in the logs
4. Share the log output to identify remaining issues

The logging will help identify:
- If navigation is starting correctly
- If pathname changes are detected
- If timeouts are working
- Where in the flow things break