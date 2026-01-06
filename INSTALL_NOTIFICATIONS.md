# Install Push Notifications Packages

## Quick Start

Run one of the following commands to install the required packages:

### Using npm
```bash
npm install expo-notifications expo-device
```

### Using npx expo (Recommended)
```bash
npx expo install expo-notifications expo-device
```

### Using yarn
```bash
yarn add expo-notifications expo-device
```

## After Installation

1. **Rebuild your development build** (required for native modules):

   ```bash
   # For Android
   npx expo run:android

   # For iOS
   npx expo run:ios
   ```

2. **Update your EAS build** (if using EAS):

   ```bash
   # Preview build
   eas build --platform android --profile preview

   # Production build
   eas build --platform all --profile production
   ```

3. **Test on a physical device** (simulators/emulators won't receive push notifications)

## Verify Installation

After rebuilding, the app should:
- Request notification permissions on first launch
- Generate an Expo push token
- Register the token with your backend
- Display the token in console logs

Check the logs for:
```
Push token registered with backend: ExponentPushToken[...]
```

## Troubleshooting

### "Module not found: expo-notifications"

Make sure you've rebuilt the app after installation:
```bash
npx expo run:android
```

### npm Authentication Error

If you see authentication errors during installation, try:
```bash
npm logout
npm login
```

Or use the Expo CLI installer which doesn't require npm auth:
```bash
npx expo install expo-notifications expo-device
```

## Next Steps

See [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md) for complete documentation on:
- Configuration
- Usage
- Testing
- Backend integration
