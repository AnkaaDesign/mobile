# External Withdrawal Detail Components - Usage Guide

This directory contains all the detail components for the External Withdrawal entity in the mobile application.

## Components

### 1. ExternalWithdrawalInfoCard
Displays complete information about the withdrawal including withdrawer details, withdrawal type, dates, and file attachments.

**Features:**
- Fixed type field mapping (using `withdrawal.type` instead of `withdrawal.willReturn`)
- Proper type labels from `EXTERNAL_WITHDRAWAL_TYPE_LABELS`
- File download functionality for NFE and receipts
- Support for all withdrawal types (RETURNABLE, CHARGEABLE, COURTESY)

**Props:**
```typescript
interface ExternalWithdrawalInfoCardProps {
  withdrawal: ExternalWithdrawal;
}
```

**Usage:**
```typescript
import { ExternalWithdrawalInfoCard } from "@/components/inventory/external-withdrawal/detail";

<ExternalWithdrawalInfoCard withdrawal={withdrawal} />
```

### 2. ExternalWithdrawalItemsCard
Displays all items in the withdrawal with return tracking and summary statistics.

**Features:**
- Summary section showing total withdrawn, returned, and pending items (for RETURNABLE type)
- Enhanced display with item details, brand, and category
- Return tracking with visual indicators
- Price display for CHARGEABLE items
- Progress indicators for return status

**Props:**
```typescript
interface ExternalWithdrawalItemsCardProps {
  items: ExternalWithdrawalItem[];
  withdrawalType?: EXTERNAL_WITHDRAWAL_TYPE;
}
```

**Usage:**
```typescript
import { ExternalWithdrawalItemsCard } from "@/components/inventory/external-withdrawal/detail";

<ExternalWithdrawalItemsCard
  items={withdrawal.items}
  withdrawalType={withdrawal.type}
/>
```

### 3. ExternalWithdrawalChangelogCard
Displays the complete audit trail of all changes made to the withdrawal.

**Features:**
- Uses the centralized ChangelogTimeline component
- Shows all field changes with before/after values
- Displays user information for each change
- Groups changes by date and time
- Summary statistics (total changes, recent changes, etc.)

**Props:**
```typescript
interface ExternalWithdrawalChangelogCardProps {
  withdrawal: ExternalWithdrawal;
}
```

**Usage:**
```typescript
import { ExternalWithdrawalChangelogCard } from "@/components/inventory/external-withdrawal/detail";

<ExternalWithdrawalChangelogCard withdrawal={withdrawal} />
```

### 4. ExternalWithdrawalTimelineCard
Shows a visual timeline of status changes over time.

**Features:**
- Visual timeline with icons and colors for each status
- Creation event
- Status change events with descriptions
- Chronological ordering (newest first)
- Color-coded by status type

**Props:**
```typescript
interface ExternalWithdrawalTimelineCardProps {
  withdrawal: ExternalWithdrawal;
}
```

**Usage:**
```typescript
import { ExternalWithdrawalTimelineCard } from "@/components/inventory/external-withdrawal/detail";

<ExternalWithdrawalTimelineCard withdrawal={withdrawal} />
```

## Complete Detail Screen Example

```typescript
import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useExternalWithdrawal } from "@/hooks";
import {
  ExternalWithdrawalInfoCard,
  ExternalWithdrawalItemsCard,
  ExternalWithdrawalChangelogCard,
  ExternalWithdrawalTimelineCard,
} from "@/components/inventory/external-withdrawal/detail";
import { spacing } from "@/constants/design-system";

export default function ExternalWithdrawalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: withdrawal, isLoading } = useExternalWithdrawal({
    where: { id },
    include: {
      items: {
        include: {
          item: {
            include: {
              brand: true,
              category: true,
            },
          },
        },
      },
      nfe: true,
      receipt: true,
    },
  });

  if (isLoading || !withdrawal) {
    return <LoadingState />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Basic Information */}
        <ExternalWithdrawalInfoCard withdrawal={withdrawal} />

        {/* Items with Return Tracking */}
        <ExternalWithdrawalItemsCard
          items={withdrawal.items || []}
          withdrawalType={withdrawal.type}
        />

        {/* Timeline */}
        <ExternalWithdrawalTimelineCard withdrawal={withdrawal} />

        {/* Changelog */}
        <ExternalWithdrawalChangelogCard withdrawal={withdrawal} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
});
```

## Key Improvements

### Info Card
1. **Fixed Type Mapping**: Changed from `withdrawal.willReturn` to `withdrawal.type` with proper enum values
2. **File Downloads**: Added clickable file components with download functionality
3. **Better Type Display**: Uses centralized type labels for consistency

### Items Card
1. **Summary Statistics**: Added visual summary for returnable items showing withdrawn/returned/pending counts
2. **Better Tracking**: Enhanced return tracking with color-coded indicators
3. **Flexible Display**: Adapts display based on withdrawal type

### Changelog Card
1. **Complete Audit Trail**: Shows all changes with full context
2. **User Tracking**: Displays who made each change
3. **Grouped Display**: Groups changes by date and action

### Timeline Card
1. **Visual Timeline**: Clear visual representation of status progression
2. **Status Context**: Provides descriptions for each status change
3. **Color Coding**: Uses status-specific colors for better clarity

## Dependencies

All components use:
- `@/components/ui/*` - Base UI components (Card, Badge, etc.)
- `@/constants` - Enums and labels
- `@/utils` - Formatting utilities
- `@/types` - TypeScript types
- `@tabler/icons-react-native` - Icons

## Mobile Optimizations

- Touch-friendly file download dialogs
- Optimized layouts for small screens
- Proper spacing and typography
- Responsive components that adapt to screen size
- Native mobile UI patterns (alerts, touchable areas)
