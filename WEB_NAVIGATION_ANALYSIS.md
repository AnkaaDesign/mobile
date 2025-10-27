# WEB VERSION NAVIGATION STRUCTURE ANALYSIS

## Overview
The web version uses **React Router with a pages directory structure** (NOT Next.js app directory).
- **Framework**: React + React Router v6
- **Page Structure**: `/src/pages` directory with file-based routing
- **Configuration**: Centralized navigation config in `/src/constants/navigation.ts` and `/src/constants/routes.ts`

---

## 1. NAVIGATION CONFIGURATION FILES

### Main Files:
- `/src/constants/navigation.ts` - NAVIGATION_MENU array with full menu hierarchy
- `/src/constants/routes.ts` - Centralized route constants object
- `/src/utils/navigation.ts` - Navigation utility functions
- `/src/App.tsx` - Route definitions and mapping

### Key Structure from navigation.ts:
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

---

## 2. ROUTING STRUCTURE (Web Version)

The web version uses **React Router** with lazy-loaded pages:

### Route Organization:
- **Auth Routes** (Public) - Login, Register, Password Recovery
- **Protected Routes** (Wrapped with AutoPrivilegeRoute + MainLayout)
  - All feature routes require authentication

### Main Domains/Modules:

#### 1. **ADMINISTRAÇÃO (Administration)**
- Customers: `/administracao/clientes`, `/administracao/clientes/cadastrar`, `/administracao/clientes/detalhes/:id`, `/administracao/clientes/editar/:id`
- Collaborators: `/administracao/colaboradores`, create, details, edit, batch-edit
- Sectors: `/administracao/setores` with CRUD operations
- Notifications: `/administracao/notificacoes`
- Change Logs: `/administracao/registros-de-alteracoes/detalhes/:id`

#### 2. **ESTOQUE (Inventory)**
- **Empréstimos (Loans)**: `/estoque/emprestimos`, create, details, batch-edit
- **EPI (PPE)**:
  - `/estoque/epi/` with CRUD
  - `/estoque/epi/agendamentos/` - Schedules
  - `/estoque/epi/entregas/` - Deliveries
- **Fornecedores (Suppliers)**: `/estoque/fornecedores`
- **Manutenção (Maintenance)**: `/estoque/manutencao`
- **Movimentações (Movements)**: `/estoque/movimentacoes`
- **Pedidos (Orders)**: `/estoque/pedidos`
  - `/estoque/pedidos/agendamentos/` - Order Schedules
  - `/estoque/pedidos/automaticos/` - Automatic Orders
- **Produtos (Products)**: `/estoque/produtos`
  - `/estoque/produtos/categorias/` - Categories
  - `/estoque/produtos/marcas/` - Brands
- **Retiradas Externas (External Withdrawals)**: `/estoque/retiradas-externas`

#### 3. **PINTURA (Painting)**
- **Catálogo (Catalog)**: `/pintura/catalogo`, `/pintura/catalogo-basico`
- **Marcas de Tinta (Paint Brands)**: `/pintura/marcas-de-tinta`
- **Produções (Productions)**: `/pintura/producoes`
- **Tipos de Tinta (Paint Types)**: `/pintura/tipos-de-tinta`

#### 4. **PRODUÇÃO (Production)**
- **Cronograma (Schedule/Tasks)**: `/producao/cronograma`
- **Em Espera (On Hold)**: `/producao/em-espera`
- **Histórico (History)**: `/producao/historico`
- **Recorte (Cutting)**: `/producao/recorte`
- **Garagens (Garages)**: `/producao/garagens`
- **Aerografia (Airbrushing)**: `/producao/aerografia`
- **Observações (Observations)**: `/producao/observacoes`
- **Ordens de Serviço (Service Orders)**: `/producao/ordens-de-servico`
- **Caminhões (Trucks)**: `/producao/caminhoes`
- **Serviços (Services)**: `/producao/servicos`

#### 5. **RECURSOS HUMANOS (Human Resources)**
- **Avisos (Warnings)**: `/recursos-humanos/avisos`
- **Cálculos (Calculations)**: `/recursos-humanos/calculos`
- **Cargos (Positions)**: `/recursos-humanos/cargos`
- **Controle de Ponto (Time Clock)**: `/recursos-humanos/controle-ponto`
- **EPI**: `/recursos-humanos/epi` with schedules, deliveries, sizes
- **Feriados (Holidays)**: `/recursos-humanos/feriados`
- **Férias (Vacations)**: `/recursos-humanos/ferias`
- **Folha de Pagamento (Payroll)**: `/recursos-humanos/folha-de-pagamento`
- **Níveis de Desempenho (Performance Levels)**: `/recursos-humanos/niveis-desempenho`
- **Requisições (Requests)**: `/recursos-humanos/requisicoes`
- **Simulação de Bônus (Bonus Simulation)**: `/recursos-humanos/simulacao-bonus`
- **Bonificações (Bonuses)**: `/recursos-humanos/bonificacoes`

#### 6. **PESSOAL (Personal - User-specific)**
- **Meu Perfil (My Profile)**: `/pessoal/meu-perfil`
- **Meus Empréstimos (My Loans)**: `/pessoal/meus-emprestimos`
- **Meus EPIs (My PPE)**: `/pessoal/meus-epis`
- **Meus Feriados (My Holidays)**: `/pessoal/meus-feriados`
- **Minhas Férias (My Vacations)**: `/pessoal/minhas-ferias`
- **Minhas Notificações (My Notifications)**: `/pessoal/minhas-notificacoes`
- **Meus Avisos (My Warnings)**: `/pessoal/meus-avisos`
- **Preferências (Preferences)**: `/pessoal/preferencias`

#### 7. **MEU PESSOAL (My Team - for Leaders)**
- **Avisos**: `/meu-pessoal/avisos`
- **Empréstimos**: `/meu-pessoal/emprestimos`
- **Férias**: `/meu-pessoal/ferias`

#### 8. **SERVIDOR (Server - Admin only)**
- **Backup do Sistema**: `/servidor/backup`
- **Sincronização BD**: `/servidor/sincronizacao-bd` (staging only)
- **Implantações (Deployments)**: `/servidor/implantacoes`
- **Logs do Sistema**: `/servidor/logs`
- **Métricas do Sistema**: `/servidor/metricas`
- **Pastas Compartilhadas (Shared Folders)**: `/servidor/pastas-compartilhadas`
- **Serviços do Sistema**: `/servidor/servicos`
- **Usuários do Sistema**: `/servidor/usuarios`
- **Rate Limiting**: `/servidor/rate-limiting`
- **Registros de Alterações (Change Logs)**: `/servidor/registros-de-alteracoes`

#### 9. **INTEGRAÇÕES (Integrations - LEADER privilege)**
- **Secullum**:
  - `/integracoes/secullum/calculos` - Time calculations
  - `/integracoes/secullum/registros-ponto` - Time entries
  - `/integracoes/secullum/status-sincronizacao` - Sync status

#### 10. **ESTATÍSTICAS (Statistics - ADMIN only)**
- `/estatisticas` - Root
- `/estatisticas/administracao`
- `/estatisticas/estoque` with sub-routes (consumo, movimentacao, tendencias, top-itens)
- `/estatisticas/producao`
- `/estatisticas/recursos-humanos`

#### 11. **Special Direct Access Routes (for specific privileges)**
- Cronograma direct: `/producao/cronograma` (DESIGNER, FINANCIAL, LOGISTIC)
- Em Espera direct: `/producao/em-espera` (DESIGNER, FINANCIAL, LOGISTIC)
- Histórico direct: `/producao/historico` (DESIGNER, FINANCIAL, LOGISTIC)
- Recorte direct: `/producao/recorte` (DESIGNER only)
- Garagens direct: `/producao/garagens` (LOGISTIC only)
- Aerografia direct: `/producao/aerografia` (FINANCIAL only)
- Catálogo de Tintas direct: `/pintura/catalogo` (DESIGNER only)
- Clientes direct: `/financeiro/clientes` (FINANCIAL only)

#### 12. **Other Routes**
- Home: `/`
- Profile: `/perfil`
- Favorites: `/favoritos`
- Maintenance (standalone): `/manutencao`
- Catalog (basic): `/pintura/catalogo-basico` (LEADER only)
- Finance: `/financeiro/clientes`

---

## 3. PRIVILEGE/PERMISSION SYSTEM

### SECTOR_PRIVILEGES Enum (from enums.ts):
```
ADMIN
HUMAN_RESOURCES
PRODUCTION
WAREHOUSE
LEADER
DESIGNER
FINANCIAL
LOGISTIC
MAINTENANCE
```

### Privilege Handling:
- **Single privilege**: `requiredPrivilege: SECTOR_PRIVILEGES.ADMIN`
- **Multiple privileges (OR logic)**: `requiredPrivilege: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.LEADER]`
- **No privilege**: Item shows to all authenticated users

### Navigation Filtering:
- Function `filterMenuByPrivileges()` filters menu items based on user's privilege
- Removes parent items if all children are filtered out
- Used in `getFilteredMenuForUser()` with platform filtering

### Route Protection:
- Uses `AutoPrivilegeRoute` component in App.tsx
- Wraps protected routes with MainLayout
- Auth routes use separate AuthLayout

---

## 4. EXACT PATH PATTERNS IN WEB

### Naming Convention:
- **Portuguese names** for routes: `/administracao`, `/estoque`, `/producao`, etc.
- **Action patterns**:
  - List: `/module/entity` or `/module/entity/listar` (implicit list on root)
  - Create: `/module/entity/cadastrar`
  - Details: `/module/entity/detalhes/:id`
  - Edit: `/module/entity/editar/:id`
  - Batch Edit: `/module/entity/editar-em-lote`
  - Batch Edit Alt: `/module/entity/editar-lote`

### Examples:
- `/estoque/emprestimos` (list)
- `/estoque/emprestimos/cadastrar` (create)
- `/estoque/emprestimos/detalhes/123` (details)
- `/estoque/emprestimos/editar/123` (edit)
- `/estoque/emprestimos/editar-lote` (batch edit)
- `/estoque/epi/agendamentos` (nested: schedules list)
- `/recursos-humanos/cargos/detalhes/:id` (details)
- `/pintura/catalogo` (paint catalog - note: NOT "catálogo")

### Special Cases:
- Catalog has TWO routes: `/pintura/catalogo-basico` (basic for LEADER) and `/pintura/catalogo` (full)
- Finance section: `/financeiro/clientes` (NOTE: "financeiro" not "finanzas")
- Secullum integration: `/integracoes/secullum/registros-ponto` (time entries)

---

## 5. PAGES DIRECTORY STRUCTURE

Location: `/src/pages/`

Main directories:
- `administration/` - customers, collaborators, notifications, sectors, change-logs
- `authentication/` - login, register, recover-password, reset-password, verify-code
- `catalog/` - basic catalog
- `human-resources/` - warnings, positions, ppe, holidays, vacations, time-clock, payroll, bonus
- `inventory/` - loans, ppe, suppliers, maintenance, movements, orders, products, external-withdrawals
- `maintenance/` - standalone maintenance module
- `my-team/` - team management for leaders (vacations, warnings, loans)
- `painting/` - catalog, paint-types, paint-brands, formulas, productions
- `personal/` - my-profile, my-loans, my-ppes, my-holidays, my-vacations, my-notifications, my-warnings, preferences
- `production/` - cronograma (schedule), aerografia, garages, cutting, history, observations, service-orders, services, trucks
- `profile/` - user profile management
- `server/` - backup, database-sync, deployments, logs, metrics, services, shared-folders, users, rate-limiting
- `admin/` - backup (duplicate path)
- `financeiro/` - financeiro specific routes
- `favorites.tsx` - favorites page
- `home.tsx` - home page
- `under-construction.tsx` - placeholder

---

## 6. FEATURES IN WEB BUT POTENTIALLY MISSING IN MOBILE

### Clearly Full-Featured Modules:
1. **Finance Module** - `/financeiro/clientes` (might not be in mobile yet)
2. **Integration Module** - Secullum integration with full sync management
3. **Server Administration** - Deployment, database sync, system metrics
4. **Statistics Module** - Advanced analytics dashboard
5. **Payroll & Bonuses** - Complete HR financial management
6. **Time Clock Control** - Detailed time tracking
7. **Performance Levels** - HR performance metrics
8. **Paint Production Tracking** - Formulas, components, productions
9. **Truck Management** - Production trucks
10. **Service Orders** - Production service orders
11. **Advanced Maintenance Scheduling** - Preventive maintenance
12. **File Management** - Document upload, orphan file management

### Features Shared Between Web and Mobile (typically):
- Basic CRUD for: Customers, Products, Suppliers, Tasks, PPE, EPI Schedules
- Personal dashboards and notifications
- My Team/Meu Pessoal management
- Basic paint catalog

---

## 7. ROUTING AND LAZY LOADING PATTERN

The web version uses:
- **React Router v6**: BrowserRouter with Routes
- **Code Splitting**: `lazy()` for all pages except auth pages
- **Suspense**: PageLoader component for loading states
- **Layout Wrapping**: All protected routes use MainLayout
- **Context Providers**: Auth, Theme, Favorites, FileViewer

### Auth Flow:
1. Public routes (auth pages)
2. AutoPrivilegeRoute wrapper (checks authentication)
3. MainLayout (navigation, layout)
4. Protected feature routes

---

## 8. KEY DIFFERENCES FROM MOBILE EXPECTED STRUCTURE

### Web Advantages:
- Desktop-optimized UI with full navigation sidebar
- More granular privilege system with multiple privilege types
- Advanced features like statistics dashboards
- File management module
- Integration modules
- Server administration
- More detailed CRUD operations (batch edit, schedule management)

### Mobile Considerations:
- Likely simplified navigation (bottom tabs or hamburger menu)
- Fewer modules visible at once
- Simpler privilege system or just ADMIN/USER
- Limited file management
- No server admin features
- Simplified statistics/dashboards

---

## 9. PRIVILEGE-BASED DIRECT MENU ITEMS (Not in submenu)

These special items appear at top level for specific users:

```
- Cronograma (direct) → /producao/cronograma (DESIGNER, FINANCIAL, LOGISTIC)
- Em Espera (direct) → /producao/em-espera (DESIGNER, FINANCIAL, LOGISTIC)
- Histórico (direct) → /producao/historico (DESIGNER, FINANCIAL, LOGISTIC)
- Recorte (direct) → /producao/recorte (DESIGNER only)
- Garagens (direct) → /producao/garagens (LOGISTIC only)
- Aerografia (direct) → /producao/aerografia (FINANCIAL only)
- Catálogo de Tintas (direct) → /pintura/catalogo (DESIGNER only)
- Clientes (direct) → /financeiro/clientes (FINANCIAL only)
```

This creates a "flattened" menu for specialists rather than making them navigate through full modules.

---

## 10. NAVIGATION UTILITY FUNCTIONS

Key functions available:
- `getFilteredMenuForUser()` - Filter menu by privilege and platform
- `filterMenuByPrivileges()` - Apply privilege filtering
- `filterMenuByEnvironment()` - Staging vs production
- `getTablerIcon()` - Map icon names to Tabler icons
- `getAllRoutes()` - Get flattened list of all routes
- `findMenuItemByPath()` - Find menu item by path
- `getBreadcrumbs()` - Generate breadcrumb trail
- `getMenuItemsByDomain()` - Get module by domain ID

---

## 11. ENVIRONMENT-SPECIFIC ROUTES

- **onlyInStaging: true** applied to:
  - `/servidor/sincronizacao-bd` (Database Sync - staging only)

---

## SUMMARY FOR MOBILE ALIGNMENT

To align the mobile app with the web version:

1. **Use same Portuguese path patterns** (`/estoque/`, `/producao/`, etc.)
2. **Implement the same privilege system** (SECTOR_PRIVILEGES enum)
3. **Support nested routes** for subitems (especially inventory and HR)
4. **Create mobile-specific navigation** using the same menu config
5. **Flatten complex menus** for mobile usability
6. **Focus on core mobile features** (not all server admin or advanced stats)
7. **Use consistent action patterns** (cadastrar, detalhes, editar, editar-lote)
8. **Implement privilege-based menu filtering** at runtime
9. **Support batch operations** where applicable
10. **Maintain consistency with icon mappings** from TABLER_ICONS

