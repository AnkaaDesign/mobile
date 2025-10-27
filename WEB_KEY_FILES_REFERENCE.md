# WEB VERSION - KEY FILES REFERENCE

## Navigation Configuration Files (Primary Source of Truth)

### 1. `/web/src/constants/navigation.ts` - MAIN NAVIGATION CONFIG
**File Size**: ~1389 lines  
**Purpose**: Defines NAVIGATION_MENU array with complete hierarchy  
**Key Structure**:
```typescript
export const NAVIGATION_MENU: MenuItem[] = [
  {
    id: "home",
    title: "Início",
    icon: "home",
    path: "/",
  },
  {
    id: "administracao",
    title: "Administração",
    icon: "cog",
    path: "/administracao",
    requiredPrivilege: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
    children: [
      // ... nested items
    ]
  }
  // ... more modules
]

export const TABLER_ICONS = {
  // ... 400+ icon mappings
}
```

**What it contains**:
- All menu items with hierarchy
- All routes with their paths
- All privilege requirements
- All icons mappings
- Special flags (isDynamic, isControlPanel, onlyInStaging, etc.)

---

### 2. `/web/src/constants/routes.ts` - TYPED ROUTE CONSTANTS
**File Size**: ~595 lines  
**Purpose**: Centralized, type-safe route definitions  
**Structure**:
```typescript
export const routes = {
  administration: {
    customers: {
      batchEdit: "/administracao/clientes/editar-em-lote",
      create: "/administracao/clientes/cadastrar",
      details: (id: string) => `/administracao/clientes/detalhes/${id}`,
      edit: (id: string) => `/administracao/clientes/editar/${id}`,
      root: "/administracao/clientes",
    },
    // ... more entities
  },
  // ... all modules
} as const;

export type Routes = typeof routes;
```

**Why it matters**: 
- Provides TypeScript support for routes
- Centralized navigation changes
- Factory functions for dynamic routes

---

### 3. `/web/src/utils/navigation.ts` - NAVIGATION UTILITIES
**Purpose**: Helper functions for menu manipulation  
**Key Functions**:
```typescript
getFilteredMenuForUser()        // Filter by privilege + platform
filterMenuByPrivileges()         // Apply privilege filtering
filterMenuByEnvironment()        // Staging vs production
filterMenuByPlatform()          // Web/mobile specific
getTablerIcon()                 // Get icon name
getAllRoutes()                  // Get flattened route list
findMenuItemByPath()            // Search by path
getBreadcrumbs()                // Generate breadcrumbs
getMenuItemsByDomain()          // Get module by domain ID
hasAccessToMenuItem()           // Check permission
```

---

### 4. `/web/src/App.tsx` - REACT ROUTER CONFIGURATION
**File Size**: Very large (1000+ lines)  
**Purpose**: Defines all routes and lazy-loaded pages  
**Key Pattern**:
```typescript
const HomePage = lazy(() => 
  import("@/pages/home").then((module) => ({ default: module.HomePage }))
);

// ... 150+ page imports

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <FavoritesProvider>
            <Routes>
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path={routes.authentication.login} element={<LoginPage />} />
                // ...
              </Route>

              {/* Protected routes */}
              <Route element={<AutoPrivilegeRoute><MainLayout /></AutoPrivilegeRoute>}>
                <Route path="/" element={<HomePage />} />
                // ... all feature routes
              </Route>
            </Routes>
          </FavoritesProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
```

---

## Pages Directory Structure

### Location: `/web/src/pages/`

```
pages/
├── authentication/
│   ├── login.tsx
│   ├── register.tsx
│   ├── recover-password.tsx
│   ├── reset-password/[token].tsx
│   ├── verify-code.tsx
│   └── verify-password-reset.tsx
│
├── administration/
│   ├── customers/
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── batch-edit.tsx
│   │   ├── details/[id].tsx
│   │   └── edit/[id].tsx
│   ├── collaborators/ (same structure)
│   ├── sectors/ (same structure)
│   ├── notifications/ (same structure)
│   └── change-logs/
│       ├── list.tsx
│       └── details/[id].tsx
│
├── inventory/
│   ├── loans/
│   ├── ppe/
│   │   ├── list.tsx
│   │   ├── deliveries/
│   │   ├── schedules/
│   │   └── [id]/
│   ├── suppliers/
│   ├── maintenance/
│   │   ├── list.tsx
│   │   ├── schedules/
│   │   └── [id]/
│   ├── movements/
│   ├── orders/
│   │   ├── list.tsx
│   │   ├── schedules/
│   │   ├── automatic/
│   │   └── [id]/
│   ├── products/
│   │   ├── list.tsx
│   │   ├── categories/
│   │   ├── brands/
│   │   ├── stock-balance.tsx
│   │   └── [id]/
│   └── external-withdrawals/
│
├── production/
│   ├── cronograma/
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── batch-edit.tsx
│   │   ├── details/[id].tsx
│   │   └── edit/[id].tsx
│   ├── aerografia/
│   ├── cutting/
│   ├── garages/
│   ├── observations/
│   ├── service-orders/
│   ├── history.tsx
│   ├── schedule-on-hold.tsx
│   ├── root.tsx
│   └── [more features]
│
├── human-resources/
│   ├── warnings/
│   ├── positions/
│   │   ├── list.tsx
│   │   ├── hierarchy.tsx
│   │   ├── batch-edit.tsx
│   │   ├── details/[id].tsx
│   │   ├── create.tsx
│   │   └── edit/[id].tsx
│   ├── ppe/
│   ├── holidays/
│   ├── vacations/
│   ├── folha-de-pagamento/
│   │   ├── list.tsx
│   │   ├── detail.tsx
│   │   └── [more actions]
│   ├── time-clock/
│   ├── calculations/
│   ├── simulacao-bonus.tsx
│   ├── requisicoes/
│   ├── performance-levels/
│   └── root.tsx
│
├── painting/
│   ├── catalog/
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── details/[id]/
│   │   │   └── formulas/
│   │   └── edit/[id].tsx
│   ├── paint-types/
│   ├── paint-brands/
│   ├── formulas/
│   ├── productions/
│   └── root.tsx
│
├── personal/
│   ├── my-profile.tsx
│   ├── my-loans.tsx
│   ├── my-ppes.tsx
│   ├── my-holidays.tsx
│   ├── my-vacations.tsx
│   ├── my-notifications.tsx
│   ├── my-warnings.tsx
│   ├── preferences.tsx
│   └── root.tsx
│
├── my-team/
│   ├── index.tsx
│   ├── vacations.tsx
│   ├── warnings.tsx
│   └── loans.tsx
│
├── server/
│   ├── root.tsx
│   ├── backup.tsx (also at /admin/backup.tsx)
│   ├── database-sync.tsx
│   ├── deployments/
│   │   ├── list.tsx
│   │   └── [id].tsx
│   ├── logs.tsx
│   ├── metrics.tsx
│   ├── services.tsx
│   ├── shared-folders.tsx
│   ├── users.tsx
│   └── rate-limiting.tsx
│
├── maintenance/
│   ├── index.tsx
│   └── details/[id].tsx
│
├── catalog/
│   ├── list.tsx
│   └── details/[id].tsx
│
├── profile.tsx
├── home.tsx
├── favorites.tsx
├── not-found.tsx
├── under-construction.tsx
└── [other pages]
```

---

## Key Pattern Files

### 1. MenuItem Interface
**File**: `/web/src/constants/navigation.ts` (lines 4-14)
```typescript
interface MenuItem {
  id: string;                  // Unique identifier
  title: string;               // Display name (Portuguese)
  icon: string;                // Icon key (maps to TABLER_ICONS)
  path?: string;               // URL path or pattern
  children?: MenuItem[];        // Nested menu items
  requiredPrivilege?: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[];
  isControlPanel?: boolean;     // Special flag for dashboards
  isDynamic?: boolean;          // Has dynamic params (:id)
  onlyInStaging?: boolean;      // Visibility flag
}
```

### 2. SECTOR_PRIVILEGES Enum
**File**: `/web/src/constants/enums.ts` (reference)
```typescript
enum SECTOR_PRIVILEGES {
  ADMIN = "ADMIN",
  HUMAN_RESOURCES = "HUMAN_RESOURCES",
  PRODUCTION = "PRODUCTION",
  WAREHOUSE = "WAREHOUSE",
  LEADER = "LEADER",
  DESIGNER = "DESIGNER",
  FINANCIAL = "FINANCIAL",
  LOGISTIC = "LOGISTIC",
  MAINTENANCE = "MAINTENANCE"
}
```

### 3. TABLER_ICONS Mapping
**File**: `/web/src/constants/navigation.ts` (lines 18-440)
```typescript
export const TABLER_ICONS = {
  // ==================== MAIN NAVIGATION ====================
  dashboard: "IconDashboard",
  menu: "IconMenu2",
  home: "IconHome",
  
  // ... 400+ more mappings
  
  // ==================== DOMAIN MODULE ICONS ====================
  factory: "IconBuilding",
  production: "IconTool",
  package: "IconPackage",
  inventory: "IconBox",
  // ... etc
} as const;
```

---

## Component Files

### AutoPrivilegeRoute
**File**: `/web/src/components/navigation/auto-privilege-route.tsx`  
**Purpose**: Protects routes and applies privilege filtering

### MainLayout
**File**: `/web/src/layouts/main-layout.tsx`  
**Purpose**: Main layout with navigation sidebar

### AuthLayout
**File**: `/web/src/layouts/auth-layout.tsx`  
**Purpose**: Layout for authentication pages

---

## Hook Files (Custom Hooks)

Location: `/web/src/hooks/`

### Navigation-related hooks:
- `useAuth()` - Authentication state
- `useNavigation()` - Navigation state management
- `usePrivileges()` - Privilege checking
- `useUser()` - User data

### Data-related hooks:
- Various API hooks for each module (useCustomers, useProducts, etc.)

---

## Context Files

Location: `/web/src/contexts/`

### Key Contexts:
1. **AuthContext** - Authentication and user state
2. **ThemeContext** - Theme (light/dark) management
3. **FavoritesContext** - User favorites management
4. **FileViewerContext** - File preview functionality

---

## API Client Structure

Location: `/web/src/api-client/`

**Pattern**: One file per entity/module
```
api-client/
├── auth.ts
├── activity.ts
├── borrow.ts
├── changelog.ts
├── customer.ts
├── item.ts
├── order.ts
├── position.ts
├── ppe.ts
├── sector.ts
├── service.ts
├── serviceOrder.ts
└── [more modules]
```

Each file typically exports:
- GET functions (list, details)
- POST functions (create)
- PUT functions (update)
- DELETE functions (delete)

---

## How the Web Version Organizes Routes

### 1. Configuration Layer
- Navigation config defines menu structure
- Routes constants define URL patterns
- Enum defines privileges

### 2. Component Layer
- Pages are organized by domain
- Each domain has its own directory
- Standard CRUD page pattern (list, create, details, edit)

### 3. Navigation Layer
- AutoPrivilegeRoute checks permissions
- MainLayout renders navigation
- NavMenu component displays menu

### 4. Data Layer
- API client handles server communication
- Custom hooks manage state
- Contexts provide global state

---

## FOR MOBILE ALIGNMENT

### What to Copy:
1. The NAVIGATION_MENU structure
2. The SECTOR_PRIVILEGES enum
3. The TABLER_ICONS mapping
4. The route paths exactly
5. The privilege filtering logic

### What to Adapt:
1. Page components (mobile-optimized versions)
2. Layout structure (mobile navigation patterns)
3. API client (might reuse, might adapt)
4. Data fetching (might use React Query)

### What to Ignore:
1. React Router (mobile uses React Navigation)
2. Desktop-specific UI components
3. Desktop-specific features (batch edit, advanced tables)
4. Admin-only features (server management)

---

## Key Insights for Mobile Development

1. **The navigation config is the blueprint** - Start with NAVIGATION_MENU
2. **Route patterns are consistent** - Use same Portuguese names
3. **Privilege system is crucial** - Implement full filtering
4. **Nested routes are important** - Support /module/entity/subentity patterns
5. **Dynamic routes use :id pattern** - Support parameterized routes
6. **Icons map consistently** - Use TABLER_ICONS mapping

