# Form Layout Standards

This document describes the standardized form layout patterns for consistent spacing, keyboard handling, and user experience across all forms in the application.

---

## Overview of Improvements

1. **Consistent spacing between form cards and action bar**
2. **Action bar hides when keyboard opens**
3. **Focused input scrolls above keyboard with proper offset**
4. **No excessive padding when keyboard is closed**
5. **Removed KeyboardAvoidingView in favor of `automaticallyAdjustKeyboardInsets`**

---

## 1. Form Container Structure

### Before (Old Pattern)
```tsx
<SafeAreaView>
  <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Form content */}
    </ScrollView>
    <ActionBar />
  </KeyboardAvoidingView>
</SafeAreaView>
```

### After (New Pattern)
```tsx
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
      {/* Form content */}
      <View style={styles.lastCardSpacer} />
    </ScrollView>
    <SimpleFormActionBar {...props} />
  </View>
</SafeAreaView>
```

---

## 2. Spacing Standards

### Action Bar Spacing
- `marginTop: spacing.md` (16px) - space between last card and action bar
- `marginBottom: insets.bottom + formSpacing.cardMarginBottom` - safe area + 16px
- `marginHorizontal: formSpacing.containerPaddingHorizontal` (16px) - aligned with form cards
- `padding: formSpacing.actionBarPadding` (16px) - internal padding

### Form Card Spacing
- Each `FormCard` has `marginBottom: formSpacing.cardMarginBottom` (16px)
- This creates 16px gap between cards
- The **last card's marginBottom must be offset** to avoid double spacing with action bar

### Last Card Spacer
```tsx
// Add after the last FormCard
<View style={styles.lastCardSpacer} />

// Style
lastCardSpacer: {
  marginTop: -spacing.md, // -16px to offset last FormCard's marginBottom
},
```

This results in:
- 0px from last card (marginBottom canceled out)
- 16px from action bar marginTop
- **Total: 16px gap** between last card and action bar

### Scroll Content Spacing
```tsx
scrollContent: {
  paddingHorizontal: formSpacing.containerPaddingHorizontal, // 16px
  paddingTop: formSpacing.containerPaddingVertical, // 16px
  // NO paddingBottom - handled by lastCardSpacer and action bar
},
```

---

## 3. Keyboard Handling

### Keyboard Visibility Hook
```tsx
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

### Why Different Events for iOS/Android?
- **iOS**: `keyboardWillShow/Hide` - fires before animation, smoother UX
- **Android**: `keyboardDidShow/Hide` - more reliable on Android

### ScrollView Configuration
```tsx
<ScrollView
  automaticallyAdjustKeyboardInsets  // Auto-adjusts for keyboard
  keyboardShouldPersistTaps="handled" // Taps on buttons work while keyboard open
  contentContainerStyle={[
    styles.scrollContent,
    isKeyboardVisible && styles.scrollContentKeyboardOpen,
  ]}
>
```

### Conditional Padding When Keyboard Open
```tsx
scrollContentKeyboardOpen: {
  paddingBottom: 150, // Extra space to push focused input above keyboard
},
```

This padding is **only applied when keyboard is visible**, so no extra space when keyboard is closed.

---

## 4. Action Bar Component

### SimpleFormActionBar Updates

The action bar now:
1. **Hides when keyboard is open** - more screen space for input
2. **Has consistent marginTop** - 16px spacing from content

```tsx
// In SimpleFormActionBar.tsx

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

// Hide when keyboard is visible
if (isKeyboardVisible) {
  return null;
}
```

### Action Bar Styles
```tsx
container: {
  flexDirection: "row",
  gap: formSpacing.rowGap, // 8px between buttons
  padding: formSpacing.actionBarPadding, // 16px
  borderRadius: formLayout.cardBorderRadius, // 12px
  borderWidth: formLayout.borderWidth, // 1px
  marginHorizontal: formSpacing.containerPaddingHorizontal, // 16px
  marginTop: spacing.md, // 16px
  // marginBottom set dynamically with safe area
},
```

---

## 5. Complete Form Template

```tsx
import { useState, useEffect } from "react";
import { View, ScrollView, Alert, StyleSheet, Keyboard, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SimpleFormActionBar } from "@/components/forms";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { Input } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";

export default function ExampleFormScreen() {
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  // Keyboard visibility tracking
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

  const onSubmit = async (data) => {
    // Handle submission
  };

  const handleCancel = () => {
    // Handle cancel
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
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
          {/* First Section */}
          <FormCard title="Section Title">
            <FormFieldGroup label="Field Label" required error={errors.field?.message}>
              <Controller
                control={control}
                name="field"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Placeholder"
                    error={!!errors.field}
                  />
                )}
              />
            </FormFieldGroup>
          </FormCard>

          {/* More sections... */}

          {/* Last Section */}
          <FormCard title="Last Section">
            <FormFieldGroup label="Last Field">
              {/* Input */}
            </FormFieldGroup>
          </FormCard>

          {/* IMPORTANT: Spacer to offset last card's marginBottom */}
          <View style={styles.lastCardSpacer} />
        </ScrollView>

        <SimpleFormActionBar
          onCancel={handleCancel}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          canSubmit={isValid}
          submitLabel="Salvar"
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
    marginTop: -spacing.md,
  },
});
```

---

## 6. Required Imports

```tsx
// React Native
import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Keyboard, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Forms
import { SimpleFormActionBar } from "@/components/forms";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";

// Spacing constants
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
```

---

## 7. Checklist for Form Implementation

- [ ] Use `SafeAreaView` with `edges={[]}`
- [ ] Use simple `View` wrapper (NOT `KeyboardAvoidingView`)
- [ ] Add `isKeyboardVisible` state with keyboard listeners
- [ ] ScrollView has `automaticallyAdjustKeyboardInsets`
- [ ] ScrollView has `keyboardShouldPersistTaps="handled"`
- [ ] ScrollView `contentContainerStyle` conditionally applies keyboard padding
- [ ] `scrollContent` has horizontal and top padding only (no bottom)
- [ ] `scrollContentKeyboardOpen` has `paddingBottom: 150`
- [ ] `lastCardSpacer` view added after the last `FormCard`
- [ ] `lastCardSpacer` has `marginTop: -spacing.md`
- [ ] Using `SimpleFormActionBar` (single-step) or `FormActionBar` (multi-step)
- [ ] Cleanup unused imports (e.g., `KeyboardAvoidingView`)

---

## 8. Files Reference

### Modified Components
- `src/components/forms/SimpleFormActionBar.tsx` - Keyboard hide behavior, spacing
- `src/components/ui/form-section.tsx` - FormCard, FormFieldGroup, FormRow components

### Constants
- `src/constants/form-styles.ts` - formSpacing, formLayout, formTypography
- `src/constants/design-system.ts` - spacing values (xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48)

### Reference Implementation
- `src/app/(tabs)/administracao/clientes/cadastrar.tsx` - Complete working example

---

## Prompt for Updating All Forms

Copy and paste this prompt into a new Claude Code session:

```
I need you to update ALL form pages in my React Native (Expo) application to implement consistent layout, spacing, and keyboard handling improvements.

## Reference Implementation
See `src/app/(tabs)/administracao/clientes/cadastrar.tsx` and `docs/FORM_LAYOUT_STANDARDS.md` for the complete working examples and documentation.

## Changes Required for Each Form

### 1. Imports Update
- Add: `Keyboard, Platform` from "react-native"
- Remove: `KeyboardAvoidingView` if present
- Ensure: `spacing` from "@/constants/design-system"
- Ensure: `formSpacing` from "@/constants/form-styles"

### 2. Replace KeyboardAvoidingView
Change from:
```tsx
<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
```
To simple:
```tsx
<View style={styles.container}>
```

### 3. Add Keyboard Visibility State
Add this after other useState declarations:
```tsx
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

### 4. Update ScrollView
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

### 5. Add Last Card Spacer
After the LAST `FormCard` in the ScrollView, add:
```tsx
<View style={styles.lastCardSpacer} />
```

### 6. Update Styles
Ensure these styles exist:
```tsx
scrollContent: {
  paddingHorizontal: formSpacing.containerPaddingHorizontal,
  paddingTop: formSpacing.containerPaddingVertical,
  // NO paddingBottom
},
scrollContentKeyboardOpen: {
  paddingBottom: 150,
},
lastCardSpacer: {
  marginTop: -spacing.md,
},
```

Remove any existing `paddingBottom` from `scrollContent`.

### 7. For Multi-Step Forms
Also update:
- `src/components/forms/FormActionBar.tsx` - Add keyboard hide behavior (same as SimpleFormActionBar)
- `src/components/forms/MultiStepFormContainer.tsx` - If it wraps ScrollView, apply same patterns

## Files to Update

Search and update ALL files matching these patterns:
- `src/app/(tabs)/**/cadastrar.tsx` (create forms)
- `src/app/(tabs)/**/editar/[id].tsx` (edit forms)
- Any component using `SimpleFormActionBar` or `FormActionBar`

## Process
1. First, read the reference implementation: `src/app/(tabs)/administracao/clientes/cadastrar.tsx`
2. Read the documentation: `docs/FORM_LAYOUT_STANDARDS.md`
3. Find all form files using Glob/Grep
4. Create a todo list with all files to update
5. Update each file systematically
6. Mark each as complete after updating

Please proceed with finding all form files and updating them to match the new standards.
```
