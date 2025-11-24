# Mobile Authentication Fix Guide

## Issues Identified and Resolved

### 1. ✅ Duplicate Alert Notifications
**Problem**: Alerts were being shown twice - once from the API client's notification handler and once from the authentication screens.

**Fixed**: Removed all `Alert.alert()` calls from authentication screens:
- `/src/app/(autenticacao)/entrar.tsx` - Removed alerts, kept only navigation logic
- The API client notification handler in `/src/lib/setup-notifications.ts` now handles all error notifications

### 2. ❌ Server Error: "stream is not readable"
**Problem**: The API server is throwing a body-parser error when processing login requests from mobile.

**Root Cause**: This error typically happens when:
1. The request body is being read twice
2. Body-parser middleware is configured incorrectly
3. The Content-Type header is missing or incorrect

**Server-Side Fix Required** (in the API project):

Check your API's `main.ts` or middleware configuration:

```typescript
// In api/src/main.ts or similar
// Make sure body-parser is only applied once
app.use(express.json()); // or bodyParser.json()

// OR if using NestJS
// In main.ts, ensure you're not double-parsing
const app = await NestFactory.create(AppModule, {
  bodyParser: true, // Should be true, not false
});

// Remove any duplicate body-parser middleware
// app.use(bodyParser.json()); // Remove if NestJS already handles it
```

**Temporary Workaround**:
The mobile app is sending the correct headers. Check that your API isn't trying to parse the body multiple times.

### 3. ✅ Network Configuration
**Fixed**: Updated `.env.development` to use local network IP instead of localhost:
- Changed from: `http://localhost:3030`
- Changed to: `http://192.168.10.158:3030`

## Authentication Flow Comparison

### Web App (Working) ✅
1. Calls `authService.login({ contact, password })`
2. API client handles all notifications via interceptors
3. Login component only handles navigation
4. Uses `localhost:3030` (works in browser)

### Mobile App (Now Fixed) ✅
1. Same API call structure
2. API client handles all notifications
3. Login screen only handles navigation (alerts removed)
4. Uses IP address for network access

## How to Test

1. **Start your API server**:
```bash
cd ../api
npm run start:dev
```

2. **Verify the API is working**:
```bash
# Test from your terminal
curl -X POST http://localhost:3030/auth/login \
  -H "Content-Type: application/json" \
  -d '{"contact":"test@example.com","password":"test123"}'
```

3. **Clear and restart the mobile app**:
```bash
cd mobile
npx expo start --clear
```

4. **Test login**:
- You should see only ONE error notification if login fails
- The server error needs to be fixed on the API side

## API Server Fix Instructions

The "stream is not readable" error is happening in your NestJS API. Here's how to fix it:

### Option 1: Check for Duplicate Body Parsing
Look for duplicate body-parser middleware in:
- `api/src/main.ts`
- Any global middleware files
- Module configurations

### Option 2: Update NestJS Configuration
```typescript
// api/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true, // Ensure this is true
    rawBody: true, // Add this if you need raw body for webhooks
  });

  // Don't add express.json() or bodyParser.json() here
  // NestJS handles it automatically

  await app.listen(3030);
}
```

### Option 3: Check Middleware Order
Make sure authentication middleware comes AFTER body parsing:
```typescript
// Correct order:
app.use(helmet());
app.use(cors());
// Body parsing happens here (built-in with NestJS)
// Then your custom middleware
app.use(authMiddleware);
```

### Option 4: Debug the Request
Add logging to see what's happening:
```typescript
// In your auth controller
@Post('login')
async login(@Body() dto: LoginDto, @Req() req: Request) {
  console.log('Headers:', req.headers);
  console.log('Body:', dto);
  console.log('Raw Body exists:', !!(req as any).rawBody);

  // Your login logic
}
```

## Environment Variables

For different scenarios:

```bash
# Mobile on Physical Device (current)
EXPO_PUBLIC_API_URL="http://192.168.10.158:3030"

# Mobile on Android Emulator
EXPO_PUBLIC_API_URL="http://10.0.2.2:3030"

# Mobile on iOS Simulator
EXPO_PUBLIC_API_URL="http://localhost:3030"

# Production
EXPO_PUBLIC_API_URL="https://api.yourdomain.com"
```

## Next Steps

1. **Fix the API server body-parser issue** (see instructions above)
2. **Test authentication** once the server is fixed
3. **Consider adding request/response logging** to debug future issues

## Debugging Tips

If you still see issues:

1. **Check API logs**:
```bash
# In your API project
tail -f logs/error.log
```

2. **Monitor network requests**:
- Use React Native Debugger
- Or add Flipper for network inspection

3. **Verify headers**:
```javascript
// In mobile/src/api-client/axiosClient.ts
// Add logging to see exact headers
console.log('Request headers:', config.headers);
```

4. **Test with a simple curl**:
```bash
# Test if API accepts JSON properly
curl -X POST http://192.168.10.158:3030/auth/login \
  -H "Content-Type: application/json" \
  -d '{"contact":"test@test.com","password":"test"}'
```

## Summary

✅ **Fixed**: Duplicate alerts removed from mobile app
✅ **Fixed**: Network configuration for mobile development
❌ **Pending**: Server-side body-parser fix needed
✅ **Working**: Authentication flow matches web app pattern