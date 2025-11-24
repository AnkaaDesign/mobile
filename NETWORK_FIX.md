# Mobile App Network Connectivity Fix

## Issues Found and Fixed

### 1. API URL Configuration
**Problem**: The app was using `localhost:3030` which doesn't work on mobile devices/emulators.
**Fixed**: Changed to your local network IP `192.168.10.158:3030` in `.env.development`

### 2. Duplicate Error Alerts
**Cause**: Both the notification system and the login screen were showing alerts for errors.
- First alert comes from `src/lib/setup-notifications.ts` (line 82)
- Second alert comes from the login error handling in `src/app/(autenticacao)/entrar.tsx`

**Solution Options**:
1. Disable alerts in the notification handler for auth errors
2. Keep notification alerts but remove the login screen alerts
3. Filter specific error types in the notification handler

### 3. To Run the App Successfully:

1. **Make sure your API is running on port 3030**:
   ```bash
   # In your API directory
   npm run dev
   ```

2. **Verify the API is accessible**:
   ```bash
   curl http://192.168.10.158:3030/health
   ```

3. **Restart the Expo app**:
   ```bash
   npx expo start --clear
   ```

4. **If using a physical device**:
   - Make sure your phone is on the same Wi-Fi network as your computer
   - Your computer's firewall might be blocking port 3030 - allow it if needed

5. **If using Android Emulator**:
   - The IP address should work as is
   - Alternative: Use `10.0.2.2:3030` for Android emulator to access host machine

6. **If using iOS Simulator**:
   - You can use `localhost:3030` directly (change back in .env.development)

### Environment-Specific Configuration

For different development scenarios, update `.env.development`:

```bash
# For iOS Simulator
EXPO_PUBLIC_API_URL="http://localhost:3030"

# For Android Emulator
EXPO_PUBLIC_API_URL="http://10.0.2.2:3030"

# For Physical Device (current setting)
EXPO_PUBLIC_API_URL="http://192.168.10.158:3030"

# For Production/Staging
EXPO_PUBLIC_API_URL="https://your-api-domain.com"
```

### To Remove Duplicate Alerts

If you want to disable notification alerts for login errors specifically, you can modify `src/lib/setup-notifications.ts`:

```typescript
// Around line 62, add a filter:
notify.setHandler((type, title, message, options) => {
  // Skip auth-related error notifications to avoid duplicates
  if (type === 'error' && (title.includes('login') || title.includes('auth'))) {
    return;
  }

  // ... rest of the handler
});
```

## Testing

After making these changes:

1. Force close the Expo Go app
2. Clear Metro bundler cache: `npx expo start --clear`
3. Scan the QR code again with Expo Go
4. Try logging in

The network error should be resolved and you should only see one error alert if login fails.