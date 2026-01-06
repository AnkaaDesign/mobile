# Deep Linking Implementation Guide

This guide covers the complete deep linking implementation for the Ankaa Design mobile app using Expo Router.

## Table of Contents

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [URL Formats](#url-formats)
4. [Testing](#testing)
5. [Integration Guide](#integration-guide)
6. [Troubleshooting](#troubleshooting)

## Overview

The deep linking system allows users to navigate directly to specific screens within the app from:

- Push notifications
- Email links
- SMS messages
- QR codes
- External apps
- Web browsers

### Key Features

- **Custom URL Scheme**: `ankaadesign://`
- **Universal Links**: `https://ankaadesign.com/app/...`
- **Authentication Handling**: Redirects to login if needed, stores pending links
- **Notification Integration**: Automatic navigation from push notifications
- **Route Mapping**: Centralized mapping of entity types to app routes

## Configuration

### 1. App Configuration (app.json)

The app is configured with:

```json
{
  "expo": {
    "scheme": "ankaadesign",
    "ios": {
      "associatedDomains": [
        "applinks:ankaadesign.com",
        "applinks:www.ankaadesign.com"
      ]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "ankaadesign.com",
              "pathPrefix": "/app"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### 2. Route Mapping

Routes are defined in `/src/lib/deep-linking.ts` in the `ROUTE_MAP` constant:

```typescript
export const ROUTE_MAP = {
  Task: '/(tabs)/producao/tarefas/detalhes/[id]',
  Order: '/(tabs)/estoque/pedidos/detalhes/[id]',
  Employee: '/(tabs)/recursos-humanos/funcionarios/detalhes/[id]',
  // ... more routes
};
```

### 3. Components Setup

The `DeepLinkHandler` component (in `/src/components/deep-link-handler.tsx`) is integrated into the root layout and handles:

- Initial URL detection (cold start)
- URL events while app is running (warm start)
- Authentication state changes
- App state transitions (background/foreground)

## URL Formats

### Custom Scheme URLs

**Format**: `ankaadesign://{entity-type}/{id}`

**Examples**:

```
ankaadesign://task/123
ankaadesign://order/456
ankaadesign://employee/789
ankaadesign://service-order/101
```

### Universal Links (HTTPS)

**Format**: `https://ankaadesign.com/app/{entity-type}/{id}`

**Examples**:

```
https://ankaadesign.com/app/task/123
https://ankaadesign.com/app/order/456
https://ankaadesign.com/app/employee/789
```

### Notification Links

**Format**: `ankaadesign://notification?type={EntityType}&id={id}`

**Examples**:

```
ankaadesign://notification?type=Task&id=123
ankaadesign://notification?type=Order&id=456
```

### Full Path URLs

**Format**: `ankaadesign://{section}/{entity-type}/{id}`

**Examples**:

```
ankaadesign://producao/tasks/123
ankaadesign://estoque/orders/456
ankaadesign://recursos-humanos/employees/789
```

## Supported Entity Types

### Production (Produção)

- `Task` / `tasks` / `tarefas`
- `ServiceOrder` / `service-orders` / `ordem-servico`
- `Service` / `services` / `servico` / `servicos`
- `Airbrushing` / `aerografia`
- `Cut` / `cuts` / `recorte`
- `Observation` / `observations` / `observacao` / `observacoes`
- `Paint` / `paints` / `tinta` / `tintas`

### Inventory (Estoque)

- `Order` / `orders` / `pedido` / `pedidos`
- `Item` / `items` / `produto` / `produtos`
- `Borrow` / `borrows` / `emprestimo` / `emprestimos`
- `ExternalWithdrawal` / `external-withdrawal` / `retirada` / `retiradas`
- `Maintenance` / `manutencao`
- `Activity` / `activities` / `movimentacao` / `movimentacoes`
- `Supplier` / `suppliers` / `fornecedor` / `fornecedores`
- `Brand` / `marcas`
- `Category` / `categorias`

### Human Resources (Recursos Humanos)

- `Employee` / `employees` / `funcionario` / `funcionarios`
- `Bonus` / `bonus`
- `Warning` / `warnings` / `advertencia` / `advertencias`
- `Vacation` / `vacations` / `ferias`
- `Holiday` / `holidays` / `feriado` / `feriados`
- `TimeRecord` / `controle-ponto`
- `Position` / `cargo` / `cargos`

### Administration

- `User` / `users` / `usuario` / `usuarios`
- `Customer` / `customers` / `cliente` / `clientes`
- `Sector` / `sectors` / `setor` / `setores`
- `Notification` / `notifications` / `notificacao` / `notificacoes`
- `ChangeLog` / `registros-de-alteracoes`

### Personal (Pessoal)

- `MyBonus` / `meus-bonus`
- `MyBorrow` / `meus-emprestimos`
- `MyWarning` / `minhas-advertencias`
- `MyVacation` / `minhas-ferias`
- `MyHoliday` / `meus-feriados`
- `MyNotification` / `minhas-notificacoes`

### Painting (Pintura)

- `PaintFormula` / `formulas`
- `PaintCatalog` / `catalogo`
- `PaintBrand` / `marcas-de-tinta`
- `PaintProduction` / `producoes`

## Testing

### Using uri-scheme CLI Tool

Test deep links on a device or simulator:

```bash
# Test custom scheme URL
npx uri-scheme open ankaadesign://task/123 --ios
npx uri-scheme open ankaadesign://task/123 --android

# Test notification link
npx uri-scheme open "ankaadesign://notification?type=Task&id=123" --ios

# Test full path
npx uri-scheme open ankaadesign://producao/tasks/123 --android
```

### Using adb (Android Only)

```bash
# Test custom scheme
adb shell am start -W -a android.intent.action.VIEW -d "ankaadesign://task/123" com.ankaadesign.management

# Test universal link
adb shell am start -W -a android.intent.action.VIEW -d "https://ankaadesign.com/app/task/123" com.ankaadesign.management
```

### Using xcrun (iOS Simulator)

```bash
# Test on iOS simulator
xcrun simctl openurl booted "ankaadesign://task/123"
xcrun simctl openurl booted "https://ankaadesign.com/app/task/123"
```

### Manual Testing Scenarios

1. **Cold Start (App Closed)**
   - Send notification with deep link
   - Close app completely
   - Tap notification
   - Verify app opens to correct screen

2. **Warm Start (App Background)**
   - Open app
   - Send to background
   - Send notification with deep link
   - Tap notification
   - Verify app navigates to correct screen

3. **Authentication Required**
   - Logout from app
   - Tap deep link that requires auth
   - Verify redirected to login
   - Login
   - Verify navigates to intended screen

4. **Invalid Links**
   - Test with invalid entity IDs
   - Test with unsupported entity types
   - Verify graceful fallback to home screen

## Integration Guide

### Generating Deep Links

Use the helper functions from `deep-linking.ts`:

```typescript
import { generateDeepLink, generateUniversalLink, generateNotificationLink } from '@/lib/deep-linking';

// Generate custom scheme deep link
const taskLink = generateDeepLink('Task', '123');
// Result: ankaadesign://task/123

// Generate universal link
const taskUniversalLink = generateUniversalLink('Task', '123');
// Result: https://ankaadesign.com/app/task/123

// Generate notification link
const notificationLink = generateNotificationLink('Task', '123');
// Result: ankaadesign://notification?type=Task&id=123
```

### Push Notification Integration

When sending push notifications, include deep link data:

**Option 1: Direct URL**

```json
{
  "title": "New Task Assigned",
  "body": "You have a new task: Install Graphics",
  "data": {
    "url": "ankaadesign://task/123"
  }
}
```

**Option 2: Entity Type + ID**

```json
{
  "title": "New Task Assigned",
  "body": "You have a new task: Install Graphics",
  "data": {
    "entityType": "Task",
    "entityId": "123"
  }
}
```

**Option 3: Screen Path (Legacy)**

```json
{
  "title": "New Task Assigned",
  "body": "You have a new task: Install Graphics",
  "data": {
    "screen": "/(tabs)/producao/tarefas/detalhes/[id]",
    "params": {
      "id": "123"
    }
  }
}
```

### Email/SMS Integration

Include deep links in email or SMS content:

**HTML Email**:

```html
<a href="https://ankaadesign.com/app/task/123">View Task #123</a>
```

**Plain Text**:

```
View Task #123: https://ankaadesign.com/app/task/123
```

### QR Code Generation

Generate QR codes with deep links:

```typescript
import QRCode from 'qrcode';
import { generateUniversalLink } from '@/lib/deep-linking';

const taskLink = generateUniversalLink('Task', '123');
const qrCodeDataUrl = await QRCode.toDataURL(taskLink);
```

### Custom Share Actions

```typescript
import { Share } from 'react-native';
import { generateUniversalLink } from '@/lib/deep-linking';

const shareTask = async (taskId: string) => {
  const link = generateUniversalLink('Task', taskId);

  await Share.share({
    message: `Check out this task: ${link}`,
    url: link, // iOS only
    title: 'Share Task',
  });
};
```

## Troubleshooting

### Deep Links Not Working

1. **Check URL Scheme Configuration**
   - Verify `scheme` in `app.json`
   - Rebuild app after changing configuration
   - Run `npx expo prebuild --clean` if needed

2. **Universal Links Not Working (iOS)**
   - Verify Apple App Site Association file is hosted at:
     `https://ankaadesign.com/.well-known/apple-app-site-association`
   - Ensure associated domains are configured in app.json
   - Check entitlements in Xcode

3. **Intent Filters Not Working (Android)**
   - Verify intent filters in `app.json`
   - Check Android manifest after build
   - Ensure `autoVerify: true` is set
   - Host Digital Asset Links file at:
     `https://ankaadesign.com/.well-known/assetlinks.json`

### Authentication Issues

1. **Pending Link Not Processed After Login**
   - Check that `processPendingDeepLink()` is called after login
   - Verify AsyncStorage permissions
   - Check logs for deep link storage/retrieval

2. **Redirected to Login Every Time**
   - Verify `isAuthenticated` is properly set
   - Check auth token persistence
   - Ensure DeepLinkHandler has access to AuthContext

### Navigation Issues

1. **Wrong Screen Opened**
   - Verify route mapping in `ROUTE_MAP`
   - Check entity type aliases in `ENTITY_ALIAS_MAP`
   - Ensure dynamic route files exist (e.g., `[id].tsx`)

2. **Screen Not Found Error**
   - Verify route path matches actual file structure
   - Check for typos in route definitions
   - Ensure proper Expo Router file-based routing

### Debugging Tips

Enable verbose logging:

```typescript
// In deep-linking.ts
console.log('[Deep Link] Parsing URL:', url);
console.log('[Deep Link] Parsed result:', { route, params });
console.log('[Deep Link] Navigation params:', params);
```

Monitor deep link events:

```typescript
// In DeepLinkHandler component
useEffect(() => {
  const subscription = Linking.addEventListener('url', (event) => {
    console.log('[Deep Link Event]', event.url);
  });

  return () => subscription.remove();
}, []);
```

Check notification data:

```typescript
// In notification handler
console.log('[Notification] Data:', notification.request.content.data);
```

## Best Practices

1. **Always use universal links for sharing** - They work on web and in-app
2. **Include fallback handling** - Always have a default route
3. **Test on physical devices** - Push notifications don't work in simulators
4. **Validate entity IDs** - Check if entity exists before navigating
5. **Handle expired links gracefully** - Show helpful error messages
6. **Log deep link events** - Monitor usage and debug issues
7. **Keep route mapping updated** - Update when adding new features
8. **Document new entity types** - Add to this guide when extending

## Security Considerations

1. **Validate all input** - Never trust deep link parameters
2. **Check permissions** - Verify user can access requested resource
3. **Rate limit** - Prevent abuse of deep link endpoints
4. **Sanitize data** - Prevent injection attacks
5. **Use HTTPS only** - For universal links and API calls

## Further Reading

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [Expo Router Deep Linking](https://docs.expo.dev/router/reference/deep-links/)
- [Apple Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
