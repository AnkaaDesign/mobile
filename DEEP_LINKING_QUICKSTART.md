# Deep Linking Quick Start Guide

## Test Deep Links Immediately

### 1. Start the App
```bash
npm start
# or
npx expo start
```

### 2. Test on iOS
```bash
# Open app first, then test deep link
npx uri-scheme open ankaadesign://task/123 --ios

# Test different entity types
npx uri-scheme open ankaadesign://order/456 --ios
npx uri-scheme open ankaadesign://employee/789 --ios
```

### 3. Test on Android
```bash
# Open app first, then test deep link
npx uri-scheme open ankaadesign://task/123 --android

# Test different entity types
npx uri-scheme open ankaadesign://order/456 --android
npx uri-scheme open ankaadesign://employee/789 --android
```

## Common Deep Link Patterns

### Production
```bash
# Tasks
npx uri-scheme open ankaadesign://task/123 --ios

# Service Orders
npx uri-scheme open ankaadesign://service-order/456 --android

# Observations
npx uri-scheme open ankaadesign://observation/789 --ios
```

### Inventory
```bash
# Orders
npx uri-scheme open ankaadesign://order/101 --android

# Items
npx uri-scheme open ankaadesign://item/202 --ios

# Borrows
npx uri-scheme open ankaadesign://borrow/303 --android
```

### HR
```bash
# Employees
npx uri-scheme open ankaadesign://employee/404 --ios

# Bonuses
npx uri-scheme open ankaadesign://bonus/505 --android
```

## Test Notification Links
```bash
npx uri-scheme open "ankaadesign://notification?type=Task&id=123" --ios
npx uri-scheme open "ankaadesign://notification?type=Order&id=456" --android
```

## Test Universal Links (iOS Simulator)
```bash
xcrun simctl openurl booted "https://ankaadesign.com/app/task/123"
xcrun simctl openurl booted "https://ankaadesign.com/app/order/456"
```

## Test Universal Links (Android)
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://ankaadesign.com/app/task/123" \
  com.ankaadesign.management
```

## Use in Code

### Generate Deep Link
```typescript
import { generateDeepLink, generateUniversalLink } from '@/lib/deep-linking';

// Custom scheme
const link = generateDeepLink('Task', '123');
// Result: ankaadesign://task/123

// Universal link
const universalLink = generateUniversalLink('Task', '123');
// Result: https://ankaadesign.com/app/task/123
```

### Share Deep Link
```typescript
import { Share } from 'react-native';
import { generateUniversalLink } from '@/lib/deep-linking';

const shareTask = async (taskId: string) => {
  const link = generateUniversalLink('Task', taskId);

  await Share.share({
    message: `Check out this task: ${link}`,
    url: link,
  });
};
```

### Navigate Programmatically
```typescript
import { router } from 'expo-router';

// Navigate to task detail
router.push('/(tabs)/producao/tarefas/detalhes/123');

// Or use the helper from examples
import { navigateToEntity } from '@/lib/deep-linking.example';
navigateToEntity('Task', '123');
```

## Push Notification Example

Send notification with this payload:
```json
{
  "to": "ExponentPushToken[xxx]",
  "title": "New Task Assigned",
  "body": "You have a new task",
  "data": {
    "entityType": "Task",
    "entityId": "123"
  }
}
```

## Debugging

Enable verbose logging in console:
```typescript
// In deep-linking.ts
console.log('[Deep Link] Parsing URL:', url);
```

Check logs:
```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

## Supported Entity Types

| Entity | URL Example |
|--------|-------------|
| Task | `ankaadesign://task/123` |
| ServiceOrder | `ankaadesign://service-order/123` |
| Order | `ankaadesign://order/123` |
| Item | `ankaadesign://item/123` |
| Employee | `ankaadesign://employee/123` |
| Borrow | `ankaadesign://borrow/123` |
| Observation | `ankaadesign://observation/123` |
| Paint | `ankaadesign://paint/123` |
| Airbrushing | `ankaadesign://airbrushing/123` |
| Customer | `ankaadesign://customer/123` |
| User | `ankaadesign://user/123` |
| Bonus | `ankaadesign://bonus/123` |
| Warning | `ankaadesign://warning/123` |
| Vacation | `ankaadesign://vacation/123` |

See `/src/lib/deep-linking.ts` for complete list of 40+ entity types.

## Next Steps

1. **Read Full Documentation**: `/src/lib/DEEP_LINKING.md`
2. **Review Examples**: `/src/lib/deep-linking.example.ts`
3. **Check Implementation**: `/DEEP_LINKING_IMPLEMENTATION.md`
4. **Test All Flows**: Cold start, warm start, auth required
5. **Integrate with Backend**: Add deep links to notifications

## Need Help?

- Check error logs in console
- Verify route exists in `/src/lib/deep-linking.ts` ROUTE_MAP
- Ensure entity ID is valid
- Test authentication flow
- Review `/src/lib/DEEP_LINKING.md` troubleshooting section

## Production Checklist

- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Verify universal links work from Safari/Chrome
- [ ] Test authentication redirects
- [ ] Test notification taps
- [ ] Verify all entity types
- [ ] Test expired/invalid links
- [ ] Setup apple-app-site-association file
- [ ] Setup assetlinks.json file
- [ ] Monitor analytics/logs
