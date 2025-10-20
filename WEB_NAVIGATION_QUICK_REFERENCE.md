# Web Navigation System - Quick Reference Guide

## Core Files to Review

### 1. Privilege System (Read First)
- **privilege.ts** - `/web/src/utils/privilege.ts`
  - `getSectorPrivilegeLevel()` - Get numeric level (1-9)
  - `canAccessSector()` - Hierarchical privilege check
  - `canAccessAnyPrivilege()` - OR logic check
  - `canAccessAllPrivileges()` - AND logic check

- **user.ts** - `/web/src/utils/user.ts` (Lines 84-131)
  - `hasPrivilege()` - Main user privilege check
  - `hasAnyPrivilege()` - Check multiple privileges (OR)
  - `hasAllPrivileges()` - Check all privileges (AND)

- **usePrivileges.ts** - `/web/src/hooks/usePrivileges.ts`
  - React hook interface for components
  - Convenience shortcuts: `isAdmin`, `isLeader`, etc.

### 2. Navigation Configuration (Read Second)
- **navigation.ts** - `/web/src/constants/navigation.ts` (1389 lines!)
  - `NAVIGATION_MENU` - Complete menu structure (Line 442)
  - `TABLER_ICONS` - Icon mappings (Lines 18-440)
  - MenuItem interface (Lines 4-14)

- **routes.ts** - `/web/src/constants/routes.ts` (596 lines)
  - `routes` object - All route definitions
  - Type-safe route constants
  - Dynamic route functions: `details: (id) => ...`

- **enums.ts** - `/web/src/constants/enums.ts` (Lines 35-47)
  - `SECTOR_PRIVILEGES` enum definition

### 3. Navigation Logic (Read Third)
- **navigation.ts (utils)** - `/web/src/utils/navigation.ts`
  - `getFilteredMenuForUser()` - Main filtering function
  - `filterMenuByPrivileges()` - Filter by user privilege
  - `filterMenuByPlatform()` - Platform-specific filtering
  - `filterMenuByEnvironment()` - Staging vs production

### 4. Route Protection
- **privilege-route.tsx** - `/web/src/components/navigation/privilege-route.tsx`
  - Route guard component
  - Checks user privileges before rendering

---

## Privilege Levels (Hierarchical)

```
Level 1: BASIC - No advanced access
Level 2: MAINTENANCE - Maintenance operations  
Level 3: WAREHOUSE - Inventory operations
Level 4: PRODUCTION - Production operations
Level 5: LEADER - Team leadership
Level 6: HUMAN_RESOURCES - HR management
Level 7: FINANCIAL - Financial operations
Level 8: ADMIN - Full admin access (highest)
Level 9: EXTERNAL - External users
```

**Note:** DESIGNER and LOGISTIC are NOT in web hierarchy (only appear in menu filters)

---

## Key Menu Items with Privileges

| Menu Item | ID | Required Privilege | Key Children |
|-----------|----|--------------------|--------------|
| Home | `home` | None | - |
| Administração | `administracao` | HR, ADMIN | Customers, Users, Sectors, Notifications |
| Catálogo | `catalogo` | LEADER | - |
| Estatísticas | `estatisticas` | ADMIN | Admin, Stock, Production, HR stats |
| Estoque | `estoque` | WAREHOUSE, ADMIN | Products, Orders, Loans, PPE, Suppliers |
| Integrações | `integracoes` | LEADER | Secullum |
| Manutenção | `manutencao` | MAINTENANCE | - |
| Meu Pessoal | `meu-pessoal` | LEADER | Warnings, Loans, Vacations |
| Pintura | `pintura` | PRODUCTION, WAREHOUSE, ADMIN | Catalog, Types, Brands, Productions |
| Produção | `producao` | PRODUCTION, LEADER, HR, WAREHOUSE, ADMIN | Schedule, History, Cutting, Garages |
| Recursos Humanos | `recursos-humanos` | ADMIN, HR | Positions, Vacations, Holidays, Warnings, PPE |
| Servidor | `servidor` | ADMIN | Backup, Deployments, Logs, Metrics, Users |

---

## MenuItem Interface

```typescript
interface MenuItem {
  id: string;                              // Unique identifier
  title: string;                           // Display name (Portuguese)
  icon: string;                            // Icon key (generic)
  path?: string;                           // URL path (optional)
  children?: MenuItem[];                   // Sub-items (optional)
  requiredPrivilege?: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[]; // Access control
  isControlPanel?: boolean;                // Dashboard flag
  isDynamic?: boolean;                     // Has dynamic route params
  onlyInStaging?: boolean;                 // Only show in staging
}
```

---

## Filtering Examples

### Get Menu for User
```typescript
const filteredMenu = getFilteredMenuForUser(
  MENU_ITEMS,        // All menu items
  user,              // User object with sector.privileges
  "web"              // Platform: "web" or "mobile"
);
```

### Check Privilege
```typescript
// Hierarchical check
const hasAccess = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);

// Multiple (OR logic)
const canAccess = hasAnyPrivilege(user, [
  SECTOR_PRIVILEGES.ADMIN,
  SECTOR_PRIVILEGES.LEADER
]);

// All required (AND logic)
const fullAccess = hasAllPrivileges(user, [
  SECTOR_PRIVILEGES.ADMIN,
  SECTOR_PRIVILEGES.WAREHOUSE
]);
```

---

## URL Patterns Used in Routes

```
/administracao/clientes               - List page
/administracao/clientes/cadastrar     - Create page
/administracao/clientes/detalhes/:id  - Details page
/administracao/clientes/editar/:id    - Edit page
/administracao/clientes/editar-em-lote - Batch edit
```

---

## Top 13 Menu Items with Line Numbers

| # | Item | Lines | Privilege |
|---|------|-------|-----------|
| 1 | Home | 444-449 | None |
| 2 | Administração | 451-508 | [HR, ADMIN] |
| 3 | Catálogo | 510-517 | LEADER |
| 4 | Estatísticas | 519-543 | ADMIN |
| 5 | Estoque | 545-775 | [WAREHOUSE, ADMIN] |
| 6 | Integrações | 777-821 | LEADER |
| 7 | Manutenção | 823-835 | MAINTENANCE |
| 8 | Meu Pessoal | 837-867 | LEADER |
| 9 | Pintura | 870-920 | [PRODUCTION, WAREHOUSE, ADMIN] |
| 10 | Produção | 922-1069 | [PRODUCTION, LEADER, HR, WAREHOUSE, ADMIN] |
| 11 | Role-specific items | 1075-1145 | DESIGNER, FINANCIAL, LOGISTIC |
| 12 | Recursos Humanos | 1147-1304 | [ADMIN, HR] |
| 13 | Servidor | 1306-1384 | ADMIN |

---

## Critical Implementation Notes

### 1. Privilege Checking is Hierarchical
- `canAccessSector()` uses `userLevel >= targetLevel`
- Higher level users automatically have access to lower levels
- Example: ADMIN (8) can access WAREHOUSE (3) content

### 2. Menu Filtering Uses Exact Matching
- Single privilege: exact match only
- Array of privileges: exact match to ANY in array
- NOT hierarchical like privilege checking

### 3. Direct Menu Items for Roles
- Lines 1075-1145 create top-level items for:
  - DESIGNER: Cronograma, Em Espera, Histórico, Recorte, Catálogo de Tintas
  - FINANCIAL: Cronograma, Em Espera, Histórico, Aerografia, Clientes
  - LOGISTIC: Cronograma, Em Espera, Histórico, Garagens

### 4. Environment Filtering
- `onlyInStaging: true` - Item only shows in staging
- Example: "Sincronização BD" at Line 1325

### 5. Icon System
- Uses Tabler icons exclusively
- Mapping in TABLER_ICONS object (200+ icons)
- Web sidebar.tsx imports all icons

---

## Mobile App Differences Found

### Privilege Levels Discrepancy
Web privilege.ts (Lines 10-23):
```
WAREHOUSE: 3
```

Mobile privilege.ts (Lines 14-16):
```
WAREHOUSE: 3
DESIGNER: 3      <-- Mobile adds these
LOGISTIC: 3      <-- Mobile adds these
```

### Menu Structure
- Web has "direct" menu items for DESIGNER, FINANCIAL, LOGISTIC roles (not nested)
- Mobile likely needs these for proper UX

### Privilege Checking
- Web: Hierarchical (level comparison)
- Mobile: Should also be hierarchical but DESIGNER/LOGISTIC need proper levels

---

## Complete File Checklist

- [ ] /web/src/constants/enums.ts - SECTOR_PRIVILEGES enum
- [ ] /web/src/constants/navigation.ts - NAVIGATION_MENU & TABLER_ICONS
- [ ] /web/src/constants/routes.ts - routes object
- [ ] /web/src/utils/privilege.ts - Privilege logic
- [ ] /web/src/utils/user.ts - User privilege checks
- [ ] /web/src/utils/navigation.ts - Menu filtering
- [ ] /web/src/hooks/usePrivileges.ts - React hook
- [ ] /web/src/components/navigation/privilege-route.tsx - Route guard
- [ ] /web/src/components/navigation/sidebar.tsx - Menu display

---

## Critical Actions for Mobile Alignment

1. **Verify DESIGNER and LOGISTIC privilege levels** - Should these be 3.5 or different?
2. **Add direct menu items for specialized roles** - For DESIGNER, FINANCIAL, LOGISTIC
3. **Implement exact matching for menu filtering** - Not hierarchical
4. **Mirror icon system** - Use same mappings or build compatible set
5. **Match route structure exactly** - Use routes constants
6. **Implement hierarchical privilege checking** - For route guards
7. **Add environment flags** - Support staging-only features
8. **Test privilege edge cases** - Particularly around DESIGNER/LOGISTIC/WAREHOUSE conflicts
