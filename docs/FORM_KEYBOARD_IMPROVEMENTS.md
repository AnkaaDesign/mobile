# Form Keyboard & Layout Improvements

This document describes the improvements made to form layouts for better keyboard handling and consistent spacing.

## Summary of Changes

### 1. Action Bar Hides When Keyboard Opens

The `SimpleFormActionBar` component now automatically hides when the keyboard is visible, providing more screen space for the user to see their input.

**Implementation in `SimpleFormActionBar.tsx`:**
```tsx
import { Keyboard, Platform } from "react-native";

// Inside the component:
const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

useEffect(() => {
  const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
  const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

  const keyboardShowListener = Keyboard.addListener(showEvent, () => {
    setIsKeyboardVisible(true);
  });
  const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
    setIsKeyboardVisible(false);
  });

  return () => {
    keyboardShowListener.remove();
    keyboardHideListener.remove();
  };
}, []);

if (isKeyboardVisible) {
  return null;
}
```

### 2. Focused Input Scrolls Above Keyboard

Using `automaticallyAdjustKeyboardInsets` on ScrollView ensures the focused input is visible above the keyboard. Combined with conditional padding when keyboard is open.

**Implementation:**
```tsx
// Track keyboard state in the form component
const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

useEffect(() => {
  const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
  const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

  const showListener = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
  const hideListener = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

  return () => {
    showListener.remove();
    hideListener.remove();
  };
}, []);

// ScrollView configuration
<ScrollView
  style={styles.scrollView}
  contentContainerStyle={[
    styles.scrollContent,
    isKeyboardVisible && styles.scrollContentKeyboardOpen,
  ]}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  automaticallyAdjustKeyboardInsets
>
```

**Styles:**
```tsx
scrollContent: {
  paddingHorizontal: formSpacing.containerPaddingHorizontal,
  paddingTop: formSpacing.containerPaddingVertical,
},
scrollContentKeyboardOpen: {
  paddingBottom: 150, // Extra padding to push input above keyboard
},
```

### 3. Consistent Spacing Between Last Card and Action Bar

The spacing between the last form card and action bar is controlled by:
- Action bar `marginTop: spacing.md` (16px)
- A negative margin spacer after the last card to offset FormCard's built-in marginBottom

**Implementation:**
```tsx
// After the last FormCard, add:
<View style={styles.lastCardSpacer} />

// Style:
lastCardSpacer: {
  marginTop: -spacing.md, // -16px to offset last FormCard's marginBottom
},
```

### 4. No KeyboardAvoidingView Needed

Replaced `KeyboardAvoidingView` with a simple `View` wrapper since `automaticallyAdjustKeyboardInsets` handles keyboard adjustments better with ScrollView.

**Before:**
```tsx
<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardView}>
```

**After:**
```tsx
<View style={styles.keyboardView}>
```

## Complete Form Structure

```tsx
import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Keyboard, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SimpleFormActionBar } from "@/components/forms";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";

export default function ExampleFormScreen() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showListener = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isKeyboardVisible && styles.scrollContentKeyboardOpen,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {/* Form Cards */}
          <FormCard title="Section 1">
            <FormFieldGroup label="Field 1">
              {/* Input component */}
            </FormFieldGroup>
          </FormCard>

          <FormCard title="Section 2">
            <FormFieldGroup label="Field 2">
              {/* Input component */}
            </FormFieldGroup>
          </FormCard>

          {/* Last card spacer - offsets FormCard marginBottom */}
          <View style={styles.lastCardSpacer} />
        </ScrollView>

        <SimpleFormActionBar
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          canSubmit={isValid}
          submitLabel="Criar"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingTop: formSpacing.containerPaddingVertical,
  },
  scrollContentKeyboardOpen: {
    paddingBottom: 150,
  },
  lastCardSpacer: {
    marginTop: -spacing.md, // -16px
  },
});
```

## Files Modified

1. **`src/components/forms/SimpleFormActionBar.tsx`**
   - Added keyboard visibility detection
   - Returns `null` when keyboard is open
   - `marginTop: spacing.md` (16px) for consistent spacing

2. **Form pages (e.g., `src/app/(tabs)/administracao/clientes/cadastrar.tsx`)**
   - Removed `KeyboardAvoidingView`, replaced with simple `View`
   - Added keyboard visibility state
   - Added `automaticallyAdjustKeyboardInsets` to ScrollView
   - Added conditional `scrollContentKeyboardOpen` style
   - Added `lastCardSpacer` view after the last FormCard

---

## Prompt for Updating All Forms

Use this prompt in a new Claude Code session to update all forms in the application:

```
I need you to update ALL form pages in my React Native (Expo) application to implement consistent keyboard handling and spacing improvements.

## Requirements

### 1. For ALL single-step forms using `SimpleFormActionBar`:

Each form page should:

a) **Remove KeyboardAvoidingView** - Replace with a simple `View` wrapper

b) **Add keyboard visibility tracking:**
```tsx
import { Keyboard, Platform } from "react-native";

const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

useEffect(() => {
  const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
  const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

  const showListener = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
  const hideListener = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

  return () => {
    showListener.remove();
    hideListener.remove();
  };
}, []);
```

c) **Update ScrollView:**
```tsx
<ScrollView
  style={styles.scrollView}
  contentContainerStyle={[
    styles.scrollContent,
    isKeyboardVisible && styles.scrollContentKeyboardOpen,
  ]}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  automaticallyAdjustKeyboardInsets
>
```

d) **Add lastCardSpacer after the last FormCard:**
```tsx
<View style={styles.lastCardSpacer} />
```

e) **Update/add styles:**
```tsx
scrollContent: {
  paddingHorizontal: formSpacing.containerPaddingHorizontal,
  paddingTop: formSpacing.containerPaddingVertical,
  // Remove any paddingBottom
},
scrollContentKeyboardOpen: {
  paddingBottom: 150,
},
lastCardSpacer: {
  marginTop: -spacing.md,
},
```

f) **Remove unnecessary imports** like `KeyboardAvoidingView` if no longer used

### 2. For multi-step forms using `MultiStepFormContainer` or `FormActionBar`:

Apply the same keyboard handling pattern to the `FormActionBar` component:
- Hide when keyboard is open
- Ensure proper spacing with marginTop

Update the multi-step form container/wrapper to:
- Use `automaticallyAdjustKeyboardInsets` on ScrollView
- Add conditional keyboard padding
- Add lastCardSpacer after the last content

### 3. Files to check and update:

Search for all form pages in:
- `src/app/(tabs)/**/cadastrar.tsx` (create forms)
- `src/app/(tabs)/**/editar/[id].tsx` (edit forms)
- Any other files using `SimpleFormActionBar`, `FormActionBar`, or `MultiStepFormContainer`

Also update:
- `src/components/forms/FormActionBar.tsx` (multi-step action bar) - add keyboard hide behavior
- `src/components/forms/MultiStepFormContainer.tsx` - if it contains ScrollView, add keyboard handling

### Reference implementation:
See `src/app/(tabs)/administracao/clientes/cadastrar.tsx` for the complete working example.

Please find all form files, analyze each one, and apply these consistent improvements. Create a todo list to track progress through all the forms.
```
