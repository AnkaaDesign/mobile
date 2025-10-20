# Web Version Navigation System - Complete Analysis

## Executive Summary
The web version implements a comprehensive navigation system with privilege-based access control, hierarchical menu structure, and route mapping. This document provides critical details for aligning the mobile app.

---

## 1. PRIVILEGE SYSTEM ARCHITECTURE

### 1.1 Privilege Hierarchy
File: `/Users/kennedycampos/Documents/repositories/web/src/utils/privilege.ts` (Lines 10-23)

**Privilege Levels (Hierarchical):**
```
1. BASIC - Entry level (no advanced access)
2. MAINTENANCE - Maintenance operations
3. WAREHOUSE - Warehouse & inventory operations
4. PRODUCTION - Production operations
5. LEADER - Team/sector leadership
6. HUMAN_RESOURCES - HR management
7. FINANCIAL - Financial operations
8. ADMIN - Full administrative access (highest)
9. EXTERNAL - External users
```

**Important Note:** The mobile app has DESIGNER (3) and LOGISTIC (3) at the same level as WAREHOUSE in privilege levels.

### 1.2 Core Privilege Functions
Location: `/Users/kennedycampos/Documents/repositories/web/src/utils/privilege.ts`

**Key Functions:**
- `getSectorPrivilegeLevel(privilege)` (L10) - Returns numeric level for comparison
- `canAccessSector(userPrivilege, targetPrivilege)` (L25) - Hierarchical check (user level >= target level)
- `canAccessAnyPrivilege(userPrivilege, privileges[])` (L35) - OR logic: user has ANY privilege
- `canAccessAllPrivileges(userPrivilege, privileges[])` (L43) - AND logic: user has ALL privileges
- `canAccessTeamFeatures(privilege, hasManagedSector)` (L56)
- `canManageTeam(privilege, managedSectorId, targetSectorId)` (L64)

### 1.3 User Privilege Checking Functions
Location: `/Users/kennedycampos/Documents/repositories/web/src/utils/user.ts`

**Public Utility Functions:**
- `hasPrivilege(user, requiredPrivilege)` (L84) - Hierarchical check using privilege levels
- `hasAnyPrivilege(user, requiredPrivileges[])` (L97) - OR logic
- `hasAllPrivileges(user, requiredPrivileges[])` (L107) - AND logic
- `canAccessWithPrivileges(user, allowedPrivileges[])` (L117) - Alias for hasAnyPrivilege
- `isUserAdmin(user)` (L124)
- `isUserLeader(user)` (L131)

### 1.4 Hook-Based Privilege Checking
Location: `/Users/kennedycampos/Documents/repositories/web/src/hooks/usePrivileges.ts`

**Main Hook: `usePrivileges()`**
Returns object with methods:
- `hasPrivilegeAccess(privilege)` (L15) - Single privilege check
- `hasAnyPrivilegeAccess(privileges[])` (L24) - OR logic
- `hasAllPrivilegeAccess(privileges[])` (L32) - AND logic
- `canAccess(privilege|privileges[], requireAll)` (L41) - Flexible function
- `canAccessExact(privilege|privileges[], requireAll)` (L54) - Direct match (non-hierarchical)

**Convenience Shortcuts:**
```javascript
isAdmin, isLeader, isHR, isWarehouse, isProduction, isMaintenance, isBasic
canManageWarehouse, canManageMaintenance, canManageProduction, canManageHR, canManageEPI, canCreateTasks, canViewStatistics
```

**User Information:**
```javascript
user, isAuthenticated, currentPrivilege, sectorName, userName
```

**Debug Helpers:**
- `debug.logPrivileges()` - Logs current privilege state
- `debug.checkAccess(privilege)` - Logs access check result

---

## 2. NAVIGATION STRUCTURE

### 2.1 Menu Items Definition
Location: `/Users/kennedycampos/Documents/repositories/web/src/constants/navigation.ts`

**MenuItem Interface (L4-14):**
```typescript
interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
  requiredPrivilege?: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[];
  isControlPanel?: boolean;
  isDynamic?: boolean;
  onlyInStaging?: boolean;
}
```

**Export:** `NAVIGATION_MENU: MenuItem[]` (Line 442)
**Alias:** `MENU_ITEMS = NAVIGATION_MENU` (Line 1388)

### 2.2 Top-Level Menu Items (Line 442+)

1. **Home** (L444-449)
   - ID: `home`
   - Path: `/`
   - No privilege requirement

2. **Administração** (L451-508)
   - ID: `administracao`
   - Required Privilege: `[HUMAN_RESOURCES, ADMIN]`
   - Children:
     - Clientes (customers)
     - Colaboradores (collaborators/users)
     - Notificações (notifications)
     - Setores (sectors)

3. **Catálogo** (L510-517)
   - ID: `catalogo`
   - Path: `/pintura/catalogo-basico`
   - Required Privilege: `LEADER`

4. **Estatísticas** (L519-543)
   - ID: `estatisticas`
   - Required Privilege: `ADMIN`
   - Nested structure with sub-categories

5. **Estoque** (L545-775) - WAREHOUSE
   - ID: `estoque`
   - Required Privilege: `[WAREHOUSE, ADMIN]`
   - Major sub-items:
     - Empréstimos (loans)
     - EPI (safety equipment)
     - Fornecedores (suppliers)
     - Manutenção (maintenance)
     - Movimentações (movements)
     - Pedidos (orders)
     - Produtos (products)
     - Retiradas Externas (external withdrawals)

6. **Integrações** (L777-821)
   - ID: `integracoes`
   - Required Privilege: `LEADER`
   - Children: Secullum integration

7. **Manutenção** (L823-835)
   - ID: `manutencao`
   - Required Privilege: `[MAINTENANCE]`

8. **Meu Pessoal** (L837-867) - Team Management
   - ID: `meu-pessoal`
   - Required Privilege: `LEADER`
   - Children:
     - Advertências (warnings)
     - Empréstimos (loans)
     - Férias (vacations)

9. **Pintura** (L870-920) - PAINTING
   - ID: `pintura`
   - Required Privilege: `[PRODUCTION, WAREHOUSE, ADMIN]`
   - Children:
     - Catálogo (catalog)
     - Marcas de Tinta (paint brands)
     - Produções (productions)
     - Tipos de Tinta (paint types)

10. **Produção** (L922-1069) - PRODUCTION
    - ID: `producao`
    - Required Privilege: `[PRODUCTION, LEADER, HUMAN_RESOURCES, WAREHOUSE, ADMIN]`
    - Major children:
      - Aerografia (airbrusing)
      - Cronograma (schedule)
      - Em Espera (on hold)
      - Garagens (garages)
      - Histórico (history)
      - Observações (observations)
      - Recorte (cutting)

11. **Direct Menu Items for Specific Roles** (L1075-1145)
    - Cronograma-direct: `[DESIGNER, FINANCIAL, LOGISTIC]`
    - Em-espera-direct: `[DESIGNER, FINANCIAL, LOGISTIC]`
    - Histórico-direct: `[DESIGNER, FINANCIAL, LOGISTIC]`
    - Recorte-direct: `[DESIGNER]`
    - Garagens-direct: `[LOGISTIC]`
    - Aerografia-direct: `[FINANCIAL]`
    - Catálogo-tintas-direct: `[DESIGNER]`
    - Clientes-direct: `[FINANCIAL]`

12. **Recursos Humanos** (L1147-1304) - HUMAN RESOURCES
    - ID: `recursos-humanos`
    - Required Privilege: `[ADMIN, HUMAN_RESOURCES]`
    - Children:
      - Advertências (warnings)
      - Cálculos (calculations)
      - Cargos (positions)
      - Controle de Ponto (time clock)
      - EPI (safety equipment)
      - Feriados (holidays)
      - Férias (vacations)
      - Folha de Pagamento (payroll)
      - Níveis de Desempenho (performance levels)
      - Requisições (requisitions)
      - Simulação de Bônus (bonus simulation)

13. **Servidor** (L1306-1384) - SERVER
    - ID: `servidor`
    - Required Privilege: `ADMIN`
    - Children:
      - Backup do Sistema (system backup)
      - Sincronização BD (database sync - staging only)
      - Implantações (deployments)
      - Logs do Sistema (system logs)
      - Métricas do Sistema (system metrics)
      - Pastas Compartilhadas (shared folders)
      - Serviços do Sistema (system services)
      - Usuários do Sistema (system users)
      - Rate Limiting
      - Registros de Alterações (change logs)

### 2.3 Icon System
Location: `/Users/kennedycampos/Documents/repositories/web/src/constants/navigation.ts` (Lines 18-440)

**TABLER_ICONS Object** - Maps generic icon keys to Tabler icon names
- Example: `dashboard: "IconDashboard"`
- Example: `factory: "IconBuilding"`
- Example: `users: "IconUsers"`

**Total Icons Defined:** 200+

---

## 3. ROUTE STRUCTURE

### 3.1 Routes Configuration
Location: `/Users/kennedycampos/Documents/repositories/web/src/constants/routes.ts`

**Export:** `const routes` object (Line 3)

**Structure Example:**
```typescript
routes.administration.customers = {
  batchEdit: "/administracao/clientes/editar-em-lote",
  create: "/administracao/clientes/cadastrar",
  details: (id) => `/administracao/clientes/detalhes/${id}`,
  edit: (id) => `/administracao/clientes/editar/${id}`,
  root: "/administracao/clientes"
}
```

### 3.2 Major Route Groups

1. **Administration** (L5-63)
   - customers, collaborators, files, notifications, sectors, users, monitoring

2. **Authentication** (L65-73)
   - login, recoverPassword, register, resetPassword, verifyCode, verifyPasswordReset

3. **Catalog** (L75-79)
   - Basic catalog for leaders

4. **Human Resources** (L96-198)
   - calculations, holidays, positions, performanceLevels, ppe, requisicoes, timeClock, vacations, warnings, payroll, bonus

5. **Inventory** (L200-311)
   - externalWithdrawals, loans, maintenance, movements, orders, ppe, products, suppliers

6. **Maintenance** (L313-318)
   - create, details, edit, list, root

7. **Meu Pessoal** (L320-335)
   - Sector employee management for leaders

8. **My Team** (L337-343)
   - loans, vacations, warnings

9. **Painting** (L345-397)
   - catalog, components, formulas, formulations, paintTypes, paintBrands, productions

10. **Personal** (L399-431)
    - myHolidays, myLoans, myNotifications, myPpes, myProfile, myVacations, myWarnings, preferences

11. **Production** (L433-508)
    - airbrushings, cutting, garages, history, observations, schedule, scheduleOnHold, serviceOrders, services, trucks

12. **Server** (L510-536)
    - backup, changeLogs, databaseSync, deployments, throttler, logs, metrics, services, sharedFolders, users

13. **Statistics** (L538-567)
    - administration, humanResources, inventory, production, orders, financial, analytics, dashboards, reports

14. **Integrations** (L569-581)
    - secullum integrations

---

## 4. NAVIGATION FILTERING & DISPLAY

### 4.1 Menu Filtering Functions
Location: `/Users/kennedycampos/Documents/repositories/web/src/utils/navigation.ts`

**Main Filter Function:**
- `getFilteredMenuForUser(menuItems, user, platform)` (L22)
  - Filters by platform ("web" | "mobile")
  - Filters by environment (staging vs production)
  - Filters by privileges

**Component Functions:**
- `filterMenuByPrivileges(menuItems, userPrivilege)` (L79)
  - Uses exact matching for single privileges (L72)
  - Uses array inclusion for multiple privileges (L68)
  - Recursively filters children

- `filterMenuByPlatform(menuItems, platform)` (L103)
  - Currently shows all items on all platforms (platforms field removed)

- `filterMenuByEnvironment(menuItems)` (L124)
  - Checks `item.onlyInStaging` flag
  - Filters based on API URL environment

**Helper Functions:**
- `hasMenuItemAccess(item, userPrivilege)` (L58)
- `hasAccessToMenuItem(item, userPrivilege)` (L267)
- `getControlPanelItems(menuItems)` (L157)
- `getAllRoutes(menuItems)` (L178)
- `findMenuItemByPath(menuItems, path)` (L199)
- `getBreadcrumbs(menuItems, path)` (L215)
- `getMenuItemsByDomain(menuItems, domain)` (L259)

**Icon Helper:**
- `getTablerIcon(iconKey)` (L40) - Maps icon keys to Tabler icon names

---

## 5. PRIVILEGE ROUTE GUARD

### 5.1 PrivilegeRoute Component
Location: `/Users/kennedycampos/Documents/repositories/web/src/components/navigation/privilege-route.tsx`

**Component Props (L10-14):**
```typescript
interface PrivilegeRouteProps {
  children: ReactNode;
  requiredPrivilege?: keyof typeof SECTOR_PRIVILEGES | (keyof typeof SECTOR_PRIVILEGES)[];
  fallbackRoute?: string;
}
```

**Behavior (L68-108):**
1. Shows loading spinner while auth is loading (L73-78)
2. Redirects unauthenticated users to login (L82-84)
3. Redirects users with BASIC privilege to welcome page (L87-92)
4. If no privilege required, renders children for basic routes (L95-97)
5. Checks if user has required privileges (L100)
6. Shows "Access Denied" screen if access denied (L102-104)
7. Renders children if access granted (L107)

**Privilege Check Function (L23-39):**
- Supports single privileges and arrays
- Supports AND logic (requireAll) and OR logic (default)
- Uses `hasPrivilege` and `hasAnyPrivilege` utility functions

**Unauthorized Access UI (L41-66):**
- Displays shield icon
- Shows "Acesso Negado" (Access Denied) message
- Shows contact admin message
- Provides "Voltar" (Back) button

---

## 6. ENUM DEFINITIONS

### 6.1 SECTOR_PRIVILEGES Enum
Location: `/Users/kennedycampos/Documents/repositories/web/src/constants/enums.ts` (Lines 35-47)

```typescript
enum SECTOR_PRIVILEGES {
  BASIC = "BASIC",
  MAINTENANCE = "MAINTENANCE",
  WAREHOUSE = "WAREHOUSE",
  DESIGNER = "DESIGNER",
  FINANCIAL = "FINANCIAL",
  LOGISTIC = "LOGISTIC",
  ADMIN = "ADMIN",
  PRODUCTION = "PRODUCTION",
  LEADER = "LEADER",
  HUMAN_RESOURCES = "HUMAN_RESOURCES",
  EXTERNAL = "EXTERNAL",
}
```

---

## 7. CRITICAL DIFFERENCES FROM MOBILE APP

### 7.1 Privilege Level Inconsistencies

**Web Version (privilege.ts L10-22):**
```
WAREHOUSE: 3
```

**Mobile Version (privilege.ts L14-16):**
```
WAREHOUSE: 3
DESIGNER: 3
LOGISTIC: 3
```

**Issue:** Mobile treats DESIGNER and LOGISTIC as same level as WAREHOUSE, but they should potentially have different hierarchies.

### 7.2 Menu Structure Differences

The web version has:
1. **Direct menu items for specific roles** (Lines 1075-1145) - These appear at top level for DESIGNER, FINANCIAL, LOGISTIC instead of nested under Produção
2. **More granular control** - Some items have privilege requirements at the child level (e.g., "Colaboradores - Cadastrar" requires ADMIN L477)
3. **Environment flags** - Some items only show in staging (L1325)

### 7.3 Icon System

Web uses Tabler icons exclusively with a mapping system. Mobile might need similar mapping for consistency.

---

## 8. KEY CONFIGURATION FILES

### 8.1 Essential Files for Navigation

1. **Privilege System**
   - `/Users/kennedycampos/Documents/repositories/web/src/utils/privilege.ts` - Core privilege logic
   - `/Users/kennedycampos/Documents/repositories/web/src/utils/user.ts` - User privilege checks
   - `/Users/kennedycampos/Documents/repositories/web/src/hooks/usePrivileges.ts` - React hook interface

2. **Navigation Definition**
   - `/Users/kennedycampos/Documents/repositories/web/src/constants/navigation.ts` - Menu items (1389 lines)
   - `/Users/kennedycampos/Documents/repositories/web/src/constants/routes.ts` - Route structure (596 lines)
   - `/Users/kennedycampos/Documents/repositories/web/src/constants/enums.ts` - Privilege enums

3. **Navigation Utilities**
   - `/Users/kennedycampos/Documents/repositories/web/src/utils/navigation.ts` - Menu filtering
   - `/Users/kennedycampos/Documents/repositories/web/src/components/navigation/sidebar.tsx` - Menu display

4. **Route Protection**
   - `/Users/kennedycampos/Documents/repositories/web/src/components/navigation/privilege-route.tsx` - Route guard component

5. **Contexts**
   - `/Users/kennedycampos/Documents/repositories/web/src/contexts/sidebar-context.tsx` - Sidebar state

---

## 9. CRITICAL IMPLEMENTATION PATTERNS

### 9.1 Privilege Checking Pattern

**Web Pattern:**
```typescript
// In utility functions (non-React)
const hasAccess = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

// In React components
const privileges = usePrivileges();
if (privileges.isAdmin) { ... }

// In route guards
<PrivilegeRoute requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
  <AdminPage />
</PrivilegeRoute>
```

### 9.2 Menu Filtering Pattern

```typescript
const filteredMenu = getFilteredMenuForUser(
  MENU_ITEMS,
  user,
  "web"  // or "mobile"
);
```

### 9.3 Privilege Array Pattern

**Single privilege:** `requiredPrivilege: SECTOR_PRIVILEGES.ADMIN`

**Multiple (OR logic):** `requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.LEADER]`

---

## 10. ROUTING CONVENTIONS

### 10.1 URL Patterns

**List Pages:**
- `/administracao/clientes` (customers list)
- `/estoque/produtos` (products list)

**Create Pages:**
- `/administracao/clientes/cadastrar`
- `/estoque/produtos/cadastrar`

**Details Pages (Dynamic):**
- `/administracao/clientes/detalhes/:id`
- `/estoque/produtos/detalhes/:id`

**Edit Pages (Dynamic):**
- `/administracao/clientes/editar/:id`
- `/estoque/produtos/editar/:id`

**Batch Edit Pages:**
- `/administracao/clientes/editar-em-lote`
- `/estoque/produtos/editar-em-lote`

---

## 11. TABLER ICONS MAPPING

Over 200 icons mapped in TABLER_ICONS object:

**Examples:**
- `dashboard: "IconDashboard"`
- `home: "IconHome"`
- `factory: "IconBuilding"`
- `users: "IconUsers"`
- `warehouse: "IconBuildingWarehouse"`
- `settings: "IconSettings"`
- `shield: "IconShield"`
- `edit: "IconEdit"`
- `trash: "IconTrash"`

---

## 12. RECOMMENDATIONS FOR MOBILE ALIGNMENT

1. **Match privilege hierarchy exactly** - Align DESIGNER and LOGISTIC levels
2. **Use same MenuItem interface** - Ensure compatibility
3. **Implement same filtering logic** - Use getFilteredMenuForUser pattern
4. **Use hierarchical privilege checks** - Use canAccessSector and hasPrivilege
5. **Implement route mapping** - Use routes constants for type safety
6. **Use same SECTOR_PRIVILEGES enum** - Shared constants package
7. **Consider direct menu items for roles** - For better UX on mobile with specific roles
8. **Implement exact matching for menu privileges** - Currently using exact match, not hierarchical

---

## 13. FILE LOCATIONS SUMMARY

| Component | Location | Lines |
|-----------|----------|-------|
| SECTOR_PRIVILEGES enum | src/constants/enums.ts | 35-47 |
| TABLER_ICONS mapping | src/constants/navigation.ts | 18-440 |
| NAVIGATION_MENU | src/constants/navigation.ts | 442-1389 |
| routes object | src/constants/routes.ts | 3-591 |
| Privilege utilities | src/utils/privilege.ts | Full file |
| User utilities | src/utils/user.ts | Full file |
| Navigation utilities | src/utils/navigation.ts | Full file |
| usePrivileges hook | src/hooks/usePrivileges.ts | Full file |
| PrivilegeRoute component | src/components/navigation/privilege-route.tsx | Full file |
| Sidebar component | src/components/navigation/sidebar.tsx | Full file |

