# Badge Design System - Mobile Application

## Overview

The mobile application uses a comprehensive, centralized badge system that ensures visual consistency across all status indicators. This system matches the web version design to provide a unified user experience across platforms.

## Color Philosophy

The badge system follows a semantic color coding approach:

- **Green (`#16a34a`)**: Success, completed, positive actions (entry, approved, active)
- **Red (`#dc2626`)**: Failure, cancelled, negative actions (exit, rejected, lost)
- **Orange (`#f97316`)**: Warning states (critical issues, overdue)
- **Amber (`#f59e0b`)**: Pending states (awaiting action, low priority warnings)
- **Blue (`#2563eb` / `#3b82f6`)**: Information, in-progress, neutral active states
- **Gray (`#6b7280`)**: Inactive, muted, disabled states

## Badge Variants

### Available Variants

| Variant | Color | Use Case |
|---------|-------|----------|
| `default` | Gray (#6b7280) | Neutral, default state |
| `primary` | Blue (#2563eb) | Primary actions, created items |
| `secondary` | Light gray (#e5e5e5) | Secondary information |
| `destructive` | Red (#dc2626) | Destructive actions, dismissed, rejected |
| `outline` | Transparent | Outlined badges for emphasis |
| `success` | Green (#16a34a) | Successful completion, approved |
| `warning` | Orange (#f97316) | Important warnings, overdue |
| `error` | Red (#dc2626) | Errors, failures |
| `info` | Sky blue (#0ea5e9) | Informational states |
| `muted` | Gray (#6b7280) | Low priority, muted states |
| `pending` | Amber (#f59e0b) | Pending actions, waiting |
| `active` | Green (#16a34a) | Active states |
| `inactive` | Gray (#6b7280) | Inactive states |
| `completed` | Green (#16a34a) | Completed tasks/orders |
| `cancelled` | Red (#dc2626) | Cancelled items |
| `onHold` | Orange (#f97316) | On hold states |
| `inProgress` | Blue (#3b82f6) | In progress states |

## Entity-Specific Badge Configurations

### Order Status
```typescript
ORDER_STATUS.CREATED → primary (Blue)
ORDER_STATUS.PARTIALLY_FULFILLED → warning (Orange)
ORDER_STATUS.FULFILLED → pending (Amber) // "Feito" - matches web
ORDER_STATUS.OVERDUE → warning (Orange)
ORDER_STATUS.PARTIALLY_RECEIVED → warning (Orange)
ORDER_STATUS.RECEIVED → success (Green)
ORDER_STATUS.CANCELLED → cancelled (Red)
```

### Task Status
```typescript
TASK_STATUS.PENDING → pending (Amber)
TASK_STATUS.IN_PRODUCTION → inProgress (Blue)
TASK_STATUS.ON_HOLD → onHold (Orange)
TASK_STATUS.COMPLETED → completed (Green)
TASK_STATUS.CANCELLED → cancelled (Red)
```

### User Status
```typescript
USER_STATUS.EXPERIENCE_PERIOD_1 → pending (Amber) // First trial period
USER_STATUS.EXPERIENCE_PERIOD_2 → warning (Orange) // Second trial period
USER_STATUS.CONTRACTED → success (Green) // Fully hired
USER_STATUS.DISMISSED → destructive (Red) // Dismissed
```

### Maintenance Status
```typescript
MAINTENANCE_STATUS.PENDING → pending (Amber)
MAINTENANCE_STATUS.IN_PROGRESS → inProgress (Blue)
MAINTENANCE_STATUS.COMPLETED → completed (Green)
MAINTENANCE_STATUS.CANCELLED → cancelled (Red)
MAINTENANCE_STATUS.OVERDUE → warning (Orange)
```

### Vacation Status
```typescript
VACATION_STATUS.PENDING → pending (Amber)
VACATION_STATUS.APPROVED → success (Green)
VACATION_STATUS.REJECTED → destructive (Red)
VACATION_STATUS.CANCELLED → cancelled (Red)
VACATION_STATUS.IN_PROGRESS → inProgress (Blue)
VACATION_STATUS.COMPLETED → completed (Green)
```

### External Withdrawal Status
```typescript
EXTERNAL_WITHDRAWAL_STATUS.PENDING → pending (Amber)
EXTERNAL_WITHDRAWAL_STATUS.PARTIALLY_RETURNED → warning (Orange)
EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED → success (Green)
EXTERNAL_WITHDRAWAL_STATUS.CHARGED → primary (Blue)
EXTERNAL_WITHDRAWAL_STATUS.CANCELLED → cancelled (Red)
```

### Borrow Status
```typescript
BORROW_STATUS.ACTIVE → inProgress (Blue)
BORROW_STATUS.RETURNED → completed (Green)
BORROW_STATUS.LOST → destructive (Red)
```

### Garage Status
```typescript
GARAGE_STATUS.ACTIVE → active (Green)
GARAGE_STATUS.INACTIVE → inactive (Gray)
GARAGE_STATUS.MAINTENANCE → warning (Orange)
```

### Stock Level
```typescript
STOCK_LEVEL.NEGATIVE_STOCK → destructive (Red)
STOCK_LEVEL.OUT_OF_STOCK → error (Red)
STOCK_LEVEL.CRITICAL → warning (Orange)
STOCK_LEVEL.LOW → pending (Amber)
STOCK_LEVEL.OPTIMAL → success (Green)
STOCK_LEVEL.OVERSTOCKED → info (Sky Blue)
```

## Usage Examples

### Basic Badge Usage

```typescript
import { Badge } from "@/components/ui/badge";

// Simple badge with variant
<Badge variant="success">Completed</Badge>

// Badge with size
<Badge variant="warning" size="lg">Overdue</Badge>

// Badge with custom styling
<Badge
  variant="primary"
  style={{ marginHorizontal: 8 }}
  textStyle={{ fontWeight: "700" }}
>
  Created
</Badge>
```

### Using Entity-Specific Badge Components

#### User Status Badge
```typescript
import { UserStatusBadge } from "@/components/common/user-status-badge";
import { USER_STATUS } from "@/constants";

<UserStatusBadge status={USER_STATUS.CONTRACTED} />
<UserStatusBadge status={USER_STATUS.EXPERIENCE_PERIOD_1} size="lg" />
```

#### Order Status Badge
```typescript
import { OrderStatusBadge } from "@/components/inventory/order/list/order-status-badge";
import { ORDER_STATUS } from "@/constants";

<OrderStatusBadge status={ORDER_STATUS.RECEIVED} />
<OrderStatusBadge status={ORDER_STATUS.OVERDUE} size="sm" />
```

#### Task Status Badge
```typescript
import { TaskStatusBadge } from "@/components/production/task/list/task-status-badge";
import { TASK_STATUS } from "@/constants";

<TaskStatusBadge status={TASK_STATUS.IN_PRODUCTION} />
<TaskStatusBadge status={TASK_STATUS.ON_HOLD} size="default" />
```

#### Maintenance Status Badge
```typescript
import { MaintenanceStatusBadge } from "@/components/inventory/maintenance/common/maintenance-status-badge";
import { MAINTENANCE_STATUS } from "@/constants";

<MaintenanceStatusBadge status={MAINTENANCE_STATUS.IN_PROGRESS} />
<MaintenanceStatusBadge status={MAINTENANCE_STATUS.OVERDUE} />
```

#### Vacation Status Badge
```typescript
import { VacationStatusBadge } from "@/components/human-resources/vacation/common/vacation-status-badge";
import { VACATION_STATUS } from "@/constants";

<VacationStatusBadge status={VACATION_STATUS.APPROVED} />
<VacationStatusBadge status={VACATION_STATUS.PENDING} />
```

#### External Withdrawal Status Badge
```typescript
import { ExternalWithdrawalStatusBadge } from "@/components/inventory/external-withdrawal/common/external-withdrawal-status-badge";
import { EXTERNAL_WITHDRAWAL_STATUS } from "@/constants";

<ExternalWithdrawalStatusBadge status={EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED} />
```

#### Borrow Status Badge
```typescript
import { BorrowStatusBadge } from "@/components/inventory/borrow/common/borrow-status-badge";
import { BORROW_STATUS } from "@/constants";

<BorrowStatusBadge status={BORROW_STATUS.ACTIVE} />
<BorrowStatusBadge status={BORROW_STATUS.ACTIVE} isOverdue={true} />
```

#### Garage Status Badge
```typescript
import { GarageStatusBadge } from "@/components/production/garage/common/garage-status-badge";
import { GARAGE_STATUS } from "@/constants";

<GarageStatusBadge status={GARAGE_STATUS.ACTIVE} />
<GarageStatusBadge status={GARAGE_STATUS.MAINTENANCE} />
```

### Using Helper Functions

#### Get Badge Variant Dynamically
```typescript
import { getBadgeVariant, TASK_STATUS } from "@/constants";

const variant = getBadgeVariant(TASK_STATUS.COMPLETED, "TASK");
// Returns: "completed"

// Generic fallback
const genericVariant = getBadgeVariant("APPROVED");
// Returns: "success"
```

#### Get Badge Colors
```typescript
import { getBadgeColors } from "@/constants";

const colors = getBadgeColors("success");
// Returns: { bg: "#16a34a", text: "#ffffff" }
```

#### Boolean Badge Variants
```typescript
import { getBooleanBadgeVariant } from "@/constants";

const activeVariant = getBooleanBadgeVariant("isActive", true);
// Returns: "active"

const overdueVariant = getBooleanBadgeVariant("isOverdue", true);
// Returns: "warning"
```

## Badge Sizes

Three sizes are available:

- **`sm`**: Small badges (fontSize: 11, paddingHorizontal: 8, paddingVertical: 1)
- **`default`**: Default badges (fontSize: 12, paddingHorizontal: 10, paddingVertical: 2)
- **`lg`**: Large badges (fontSize: 14, paddingHorizontal: 12, paddingVertical: 4)

```typescript
<Badge variant="success" size="sm">Small</Badge>
<Badge variant="success" size="default">Default</Badge>
<Badge variant="success" size="lg">Large</Badge>
```

## Customization

### Custom Styling

You can override default styles using the `style` and `textStyle` props:

```typescript
<Badge
  variant="primary"
  style={{
    marginVertical: 4,
    borderRadius: 12,
  }}
  textStyle={{
    fontSize: 10,
    fontWeight: "bold",
  }}
>
  Custom Badge
</Badge>
```

### Creating New Badge Components

When creating a new entity-specific badge component, follow this pattern:

```typescript
import React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { YOUR_STATUS_ENUM, YOUR_STATUS_LABELS, getBadgeVariant } from "@/constants";

interface YourStatusBadgeProps {
  status: YOUR_STATUS_ENUM;
  size?: BadgeProps["size"];
  style?: BadgeProps["style"];
  textStyle?: BadgeProps["textStyle"];
}

export function YourStatusBadge({
  status,
  size = "default",
  style,
  textStyle,
}: YourStatusBadgeProps) {
  // Use centralized badge configuration with entity context
  const variant = getBadgeVariant(status, "YOUR_ENTITY");

  // Get display text
  const displayText = YOUR_STATUS_LABELS[status] || status;

  return (
    <Badge variant={variant} size={size} style={style} textStyle={textStyle}>
      {displayText}
    </Badge>
  );
}
```

## Files Structure

### Core Files
- `/mobile/src/constants/badge-colors.ts` - Centralized badge configuration
- `/mobile/src/components/ui/badge.tsx` - Base Badge component

### Entity-Specific Badge Components
- `/mobile/src/components/common/user-status-badge.tsx`
- `/mobile/src/components/inventory/order/list/order-status-badge.tsx`
- `/mobile/src/components/production/task/list/task-status-badge.tsx`
- `/mobile/src/components/inventory/maintenance/common/maintenance-status-badge.tsx`
- `/mobile/src/components/human-resources/vacation/common/vacation-status-badge.tsx`
- `/mobile/src/components/inventory/external-withdrawal/common/external-withdrawal-status-badge.tsx`
- `/mobile/src/components/inventory/borrow/common/borrow-status-badge.tsx`
- `/mobile/src/components/production/garage/common/garage-status-badge.tsx`

## Special Badge Types

### ABC/XYZ Category Badges
For inventory analysis, special soft-colored badges are available:

```typescript
import { getABCBadgeColors, getXYZBadgeColors, ABC_CATEGORY, XYZ_CATEGORY } from "@/constants";

// ABC Category
const abcColors = getABCBadgeColors(ABC_CATEGORY.A);
// Returns: { bg: "#fee2e2", text: "#b91c1c" } (red tones)

// XYZ Category
const xyzColors = getXYZBadgeColors(XYZ_CATEGORY.X);
// Returns: { bg: "#dbeafe", text: "#1e40af" } (blue tones)
```

## Best Practices

1. **Always use entity-specific badge components** when available rather than the base Badge component
2. **Use the centralized `getBadgeVariant()` function** to ensure consistency
3. **Match web version colors** to maintain cross-platform consistency
4. **Provide appropriate labels** using the `*_STATUS_LABELS` constants
5. **Consider accessibility** - all badges use sufficient color contrast
6. **Use semantic variants** - don't use `error` for warnings or `success` for pending states
7. **Keep badge text concise** - use abbreviations when appropriate for mobile screens

## Migration Guide

### Updating Existing Badge Usage

If you have old badge code that doesn't use the centralized system:

**Before:**
```typescript
<Badge
  variant="outline"
  style={{ backgroundColor: "#dbeafe", borderColor: "#1e40af" }}
  textStyle={{ color: "#1e40af" }}
>
  {status}
</Badge>
```

**After:**
```typescript
import { TaskStatusBadge } from "@/components/production/task/list/task-status-badge";

<TaskStatusBadge status={status} />
```

## Consistency Checklist

When implementing badges, ensure:

- [ ] Using correct variant from `getBadgeVariant()`
- [ ] Using entity-specific component when available
- [ ] Colors match web version
- [ ] Labels use proper constants (`*_STATUS_LABELS`)
- [ ] Size prop is appropriate for context
- [ ] Styling is minimal and only for layout adjustments
- [ ] Badge is accessible (proper contrast, readable text)

## Support

For questions or issues with the badge system, contact the frontend team or refer to:
- Web badge system: `/web/src/constants/badge-colors.ts`
- Design system: `/mobile/src/constants/design-system.ts`
