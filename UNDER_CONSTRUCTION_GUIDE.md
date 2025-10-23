# Under Construction Page System

## Overview

This mobile application implements a comprehensive "Under Construction" page system for routes that are planned but not yet fully implemented. This provides a better user experience by showing informative placeholders instead of errors or blank pages.

## Component Location

**File:** `/src/components/ui/under-construction.tsx`

## Features

The `UnderConstruction` component provides:

1. **Informative Messaging**: Clear communication that the feature is coming soon
2. **Route Display**: Shows the current route path for debugging and user awareness
3. **Themed Styling**: Automatically adapts to light/dark mode
4. **Navigation Support**: Includes optional back button functionality
5. **Professional Design**: Construction icon, dashed borders, and feature previews
6. **Responsive Layout**: Works on all screen sizes

## Component Props

```typescript
interface UnderConstructionProps {
  title: string;                    // Page title (required)
  description?: string;              // Custom description (optional)
  icon?: string;                     // Icon name (optional, default: "construction")
  showBackButton?: boolean;          // Show back navigation button (optional, default: false)
}
```

## Usage

### Basic Usage

```typescript
import { UnderConstruction } from "@/components/ui/under-construction";

export default function MyUnimplementedScreen() {
  return <UnderConstruction title="My Feature" />;
}
```

### With Custom Description

```typescript
export default function MyScreen() {
  return (
    <UnderConstruction
      title="Advanced Analytics"
      description="Visualize dados detalhados de produção e desempenho. Esta funcionalidade incluirá gráficos interativos e relatórios customizáveis."
    />
  );
}
```

### With Back Button

```typescript
export default function MyScreen() {
  return (
    <UnderConstruction
      title="Settings"
      showBackButton={true}
    />
  );
}
```

## Current Implementation Status

### Statistics

- **Total Route Files**: 333 files
- **Files Using UnderConstruction**: 136 files (41%)
- **Fully Implemented Routes**: 197 files (59%)

### Modules Coverage

All major modules have a mix of implemented and under-construction routes:

#### Production Module
- Schedule (details/list implemented)
- Airbrushing (under construction)
- Cutting (under construction)
- Garages (under construction)
- Service Orders (under construction)
- Paints (list implemented, create/edit under construction)

#### Inventory Module
- Products (implemented)
- Orders (partially implemented)
- Maintenance (under construction)
- PPE (partially implemented)
- Suppliers (under construction)

#### Human Resources Module
- Employees (implemented)
- Positions (implemented)
- Holidays (partially implemented)
- PPE (under construction)
- Payroll (under construction)
- Performance Levels (under construction)
- Sectors (under construction)

#### Administration Module
- Customers (details/list implemented)
- Collaborators (under construction)
- Users (implemented)
- Notifications (under construction)
- Files (partially implemented)
- Sectors (under construction)

#### Painting Module
- Formulas (under construction)
- Paint Brands (under construction)
- Paint Types (under construction)
- Catalog (partially implemented)
- Productions (under construction)

#### Server Module
- Backups (implemented)
- Change Logs (implemented)
- Deployments (under construction)
- Other server features (under construction)

#### Personal Module
- My Profile (implemented)
- Preferences (partially implemented)
- My Notifications (partially implemented)
- My Borrows (under construction)
- My Holidays (under construction)

#### Integrations Module
- Secullum integration (under construction)

#### My Team Module (Leader Features)
- Borrows (implemented)
- Vacations (partially implemented)
- Warnings (partially implemented)

## Navigation Integration

The application's drawer layout (in `src/app/(tabs)/_layout.tsx`) registers all routes dynamically, including those using the UnderConstruction component. This ensures:

1. **Consistent Navigation**: Users can navigate to all planned features from the menu
2. **Back Button Support**: The header back button works automatically for all routes
3. **Breadcrumb Display**: Each under construction page shows its route path

## Design System Integration

The UnderConstruction component integrates with the app's design system:

- Uses `useTheme()` hook for color consistency
- Follows the app's spacing system
- Matches border radius and elevation standards
- Supports both light and dark modes

## Best Practices

### When to Use

Use the UnderConstruction component for:

1. **Planned Features**: Routes that are in the navigation but not yet implemented
2. **Create/Edit Forms**: Form pages that haven't been built yet
3. **Advanced Features**: Complex features that need more development time
4. **Module Placeholders**: Top-level module pages that redirect to sub-routes

### When NOT to Use

Don't use for:

1. **Error States**: Use proper error boundaries instead
2. **Loading States**: Use Loading component instead
3. **Permission Denied**: Use PrivilegeGuard component instead
4. **Not Found (404)**: Create a dedicated NotFound page

### Recommended Pattern

For entity CRUD operations:

```typescript
// Index/redirect page
export default function PaintsScreen() {
  useEffect(() => {
    router.replace("/(tabs)/production/paints/list");
  }, []);
  return null;
}

// List page (implemented)
export default function PaintsListScreen() {
  // Full implementation
}

// Create page (under construction)
export default function PaintsCreateScreen() {
  return <UnderConstruction title="Cadastrar Tinta" />;
}

// Edit page (under construction)
export default function PaintEditScreen() {
  return <UnderConstruction title="Editar Tinta" />;
}

// Details page (under construction)
export default function PaintDetailsScreen() {
  return <UnderConstruction title="Detalhes da Tinta" />;
}
```

## Automatic Features

The enhanced UnderConstruction component automatically:

1. **Displays Route Path**: Shows the current pathname formatted for easy reading
2. **Adapts to Theme**: Changes colors based on light/dark mode
3. **Scrollable Content**: Full-height scrollable layout
4. **Touch-Friendly**: Proper spacing and tap targets for mobile

## Future Enhancements

Potential improvements for the Under Construction system:

1. **Progress Indicators**: Show estimated completion percentage
2. **Feature Voting**: Allow users to vote on which features to prioritize
3. **Email Notifications**: Let users request notification when feature is ready
4. **Detailed Roadmap**: Link to development roadmap or issue tracker
5. **Beta Access**: Option to join beta testing for specific features

## Testing

To test the Under Construction pages:

1. Navigate through the app menu to any route marked "under construction"
2. Verify the page displays correctly in both light and dark modes
3. Check that the route path is displayed correctly
4. Test the back button (if enabled) returns to previous page
5. Ensure scrolling works for long content

## Maintenance

When implementing a feature that currently shows UnderConstruction:

1. Replace the component import with actual implementation
2. Update this documentation if it's a significant module
3. Test navigation to/from the new page
4. Ensure theme consistency with the rest of the app

## Examples in Codebase

### Simple Example
**File**: `/src/app/(tabs)/production/paints/create.tsx`
```typescript
import { UnderConstruction } from "@/components/ui/under-construction";

export default function PaintsCreateScreen() {
  return <UnderConstruction title="Cadastrar Tinta" />;
}
```

### With Custom Description
**File**: `/src/app/(tabs)/integrations.tsx`
```typescript
import { UnderConstruction } from "@/components/ui/under-construction";

export default function IntegrationsScreen() {
  return <UnderConstruction title="Integrações" description="Gerencie integrações do sistema em breve." />;
}
```

### Module Index Pattern
**File**: `/src/app/(tabs)/production.tsx`
```typescript
import { UnderConstruction } from "@/components/ui/under-construction";

export default function ProductionScreen() {
  return <UnderConstruction title="Produção" />;
}
```

## Accessibility

The component includes:

- Semantic HTML structure
- Proper text contrast ratios
- Scrollable content for screen readers
- Clear, descriptive text
- Icons with decorative role (not critical for understanding)

## Conclusion

The Under Construction system provides a professional, user-friendly way to communicate feature availability while maintaining excellent UX. It's an integral part of the app's phased development approach, allowing the navigation structure to be complete even as features are still being built.

## Quick Reference

| Element | Description |
|---------|-------------|
| Component | `/src/components/ui/under-construction.tsx` |
| Total Files Using It | 136 files |
| Key Features | Route display, theme support, feature preview, optional back button |
| Integration | Works with drawer navigation, theme system, and routing |
| Maintenance | Replace with real implementation when feature is ready |
