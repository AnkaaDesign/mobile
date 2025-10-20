# Web Application Folder Structure Analysis

**Repository Path:** `/Users/kennedycampos/Documents/repositories/web`
**Analysis Date:** 2025-10-19

## Executive Summary

The web application follows a **flat page structure** under `/src/pages` with domain-based organization. Routes use Portuguese URL paths (e.g., `/administracao`, `/estoque`, `/recursos-humanos`) while folder names are in English.

### Key Differences from Mobile:
1. **"Collaborators"** (web) vs **"Employees"** (mobile) - Same entity, different naming
2. **"Movements"** (web) vs **"Activities"** (mobile) - Same entity, different naming
3. **"Change Logs"** - Located under **Server** routes in web, under **Administration** in mobile
4. **"Files"** - Exists in web (`/administracao/arquivos`), exists in mobile
5. **"Commissions"** - Does NOT exist as a dedicated route in web

---

## Complete Folder Structure

```
src/pages/
├── admin/
│   └── backup.tsx
│
├── administration/                    # DOMAIN: Administration
│   ├── administration.tsx
│   ├── index.tsx
│   ├── root.tsx
│   ├── change-logs/                   # ⚠️ Note: Routes to /servidor/registros-de-alteracoes
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   └── details/
│   │       └── [id].tsx
│   ├── collaborators/                 # ⚠️ Called "employees" in mobile
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── batch-edit.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── customers/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── batch-edit.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── files/                         # ✅ Exists in web
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── upload.tsx
│   │   ├── upload-with-webdav.tsx
│   │   ├── orphans.tsx
│   │   └── details/
│   │       └── [id].tsx
│   ├── notifications/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── sectors/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── batch-edit.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   └── users/
│       └── list.tsx                   # Alias for collaborators
│
├── authentication/                    # DOMAIN: Authentication
│   ├── index.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── recover-password.tsx
│   ├── verify-code.tsx
│   ├── verify-password-reset.tsx
│   └── reset-password/
│       └── [token].tsx
│
├── catalog/                           # DOMAIN: Basic Catalog (for leaders)
│   ├── index.tsx
│   ├── list.tsx
│   └── details/
│       └── [id].tsx
│
├── deployments/                       # DOMAIN: Deployments
│   ├── overview.tsx
│   └── history.tsx
│
├── favorites.tsx                      # User favorites
│
├── financeiro/                        # DOMAIN: Financial (partial)
│   ├── index.tsx
│   └── clientes/
│       ├── index.tsx
│       └── list.tsx
│
├── home.tsx                           # Home page
│
├── human-resources/                   # DOMAIN: Human Resources
│   ├── human-resources.tsx
│   ├── index.tsx
│   ├── root.tsx
│   ├── calculations/
│   │   └── list.tsx
│   ├── folha-de-pagamento/            # Payroll
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   └── detail.tsx
│   ├── holidays/
│   │   ├── list.tsx
│   │   ├── calendar.tsx
│   │   └── cadastrar.tsx
│   ├── performance-levels/
│   │   └── list.tsx
│   ├── positions/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── batch-edit.tsx
│   │   ├── hierarchy.tsx
│   │   ├── [positionId]/
│   │   │   └── remunerations.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── ppe/                           # Personal Protective Equipment
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── deliveries.tsx
│   │   ├── sizes.tsx
│   │   ├── deliveries/
│   │   │   ├── list.tsx
│   │   │   ├── create.tsx
│   │   │   ├── details/
│   │   │   │   └── [id].tsx
│   │   │   └── edit/
│   │   │       └── [id].tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   ├── edit/
│   │   │   └── [id].tsx
│   │   ├── reports/
│   │   │   └── index.tsx
│   │   ├── schedules/
│   │   │   ├── list.tsx
│   │   │   ├── create.tsx
│   │   │   ├── details/
│   │   │   │   └── [id].tsx
│   │   │   └── edit/
│   │   │       └── [id].tsx
│   │   └── sizes/
│   │       ├── index.tsx
│   │       ├── list.tsx
│   │       ├── create.tsx
│   │       └── edit/
│   │           └── [id].tsx
│   ├── requisicoes/
│   │   └── list.tsx
│   ├── simulacao-bonus.tsx
│   ├── time-clock/
│   │   └── list.tsx
│   ├── vacations/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── batch-edit.tsx
│   │   ├── calendar.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   └── warnings/
│       ├── list.tsx
│       ├── create.tsx
│       ├── batch-edit.tsx
│       ├── details/
│       │   └── [id].tsx
│       └── edit/
│           └── [id].tsx
│
├── inventory/                         # DOMAIN: Inventory
│   ├── index.tsx
│   ├── root.tsx
│   ├── external-withdrawals/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── details/
│   │   │   ├── [id].tsx
│   │   │   └── [id].tsx.bak2
│   │   └── edit/
│   │       └── [id].tsx
│   ├── loans/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── batch-edit.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── maintenance/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── schedule.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   ├── edit/
│   │   │   └── [id].tsx
│   │   └── schedules/
│   │       ├── index.tsx
│   │       ├── list.tsx
│   │       ├── create.tsx
│   │       ├── details/
│   │       │   └── [id].tsx
│   │       └── edit/
│   │           └── [id].tsx
│   ├── movements/                     # ⚠️ Called "activities" in mobile
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── batch-edit.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── orders/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── automatic/
│   │   │   ├── index.tsx
│   │   │   ├── list.tsx
│   │   │   └── configure.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   ├── edit/
│   │   │   └── [id].tsx
│   │   └── schedules/
│   │       ├── index.tsx
│   │       ├── list.tsx
│   │       ├── create.tsx
│   │       └── edit/
│   │           └── [id].tsx
│   ├── ppe/                           # Personal Protective Equipment
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── deliveries/
│   │   │   ├── list.tsx
│   │   │   ├── create.tsx
│   │   │   ├── details/
│   │   │   │   └── [id].tsx
│   │   │   └── edit/
│   │   │       └── [id].tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   ├── edit/
│   │   │   └── [id].tsx
│   │   └── schedules/
│   │       ├── list.tsx
│   │       ├── create.tsx
│   │       ├── details/
│   │       │   └── [id].tsx
│   │       └── edit/
│   │           └── [id].tsx
│   ├── products/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── list-infinite.tsx
│   │   ├── create.tsx
│   │   ├── batch-edit.tsx
│   │   ├── stock-balance.tsx
│   │   ├── brands/
│   │   │   ├── index.tsx
│   │   │   ├── list.tsx
│   │   │   ├── create.tsx
│   │   │   ├── batch-edit.tsx
│   │   │   ├── details/
│   │   │   │   └── [id].tsx
│   │   │   └── edit/
│   │   │       └── [id].tsx
│   │   ├── categories/
│   │   │   ├── index.tsx
│   │   │   ├── list.tsx
│   │   │   ├── create.tsx
│   │   │   ├── batch-edit.tsx
│   │   │   ├── details/
│   │   │   │   └── [id].tsx
│   │   │   └── edit/
│   │   │       └── [id].tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── statistics/
│   │   ├── index.tsx
│   │   ├── consumption.tsx
│   │   ├── stock-movement.tsx
│   │   ├── top-items.tsx
│   │   └── trends.tsx
│   └── suppliers/
│       ├── index.tsx
│       ├── list.tsx
│       ├── list-with-batch-demo.tsx
│       ├── create.tsx
│       ├── batch-edit.tsx
│       ├── details/
│       │   └── [id].tsx
│       └── edit/
│           └── [id].tsx
│
├── maintenance/                       # DOMAIN: Maintenance (standalone)
│   ├── index.tsx
│   └── details/
│       └── [id].tsx
│
├── my-team/                           # DOMAIN: Team Management (for leaders)
│   ├── index.tsx
│   ├── loans.tsx
│   ├── vacations.tsx
│   └── warnings.tsx
│
├── not-found.tsx                      # 404 page
│
├── painting/                          # DOMAIN: Paint Management
│   ├── index.tsx
│   ├── root.tsx
│   ├── productions.tsx
│   ├── catalog/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── details/
│   │   │   ├── [id].tsx
│   │   │   └── [id]/
│   │   │       └── formulas/
│   │   │           ├── index.tsx
│   │   │           └── details/
│   │   │               └── [formulaId].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── formulas/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── [formulaId]/
│   │   │   └── components.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── paint-brands/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── paint-types/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   └── productions/
│       ├── index.tsx
│       ├── list.tsx
│       └── details/
│           └── [id].tsx
│
├── personal/                          # DOMAIN: Personal (user-specific)
│   ├── index.tsx
│   ├── root.tsx
│   ├── my-holidays.tsx
│   ├── my-loans.tsx
│   ├── my-notifications.tsx
│   ├── my-profile.tsx
│   ├── my-vacations.tsx
│   ├── my-warnings.tsx
│   ├── preferences.tsx
│   └── my-ppes/
│       ├── index.tsx
│       ├── list.tsx
│       └── request.tsx
│
├── production/                        # DOMAIN: Production
│   ├── index.tsx
│   ├── root.tsx
│   ├── history.tsx
│   ├── schedule.tsx
│   ├── schedule-on-hold.tsx
│   ├── aerografia/                    # Airbrushing
│   │   ├── cadastrar.tsx
│   │   ├── create.tsx
│   │   ├── list.tsx
│   │   ├── listar.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── cronograma/                    # Schedule/Tasks
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── batch-edit.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── cutting/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── root.tsx
│   │   ├── create.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── garages/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── [garageId]/              # Empty folder
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   ├── edit/
│   │   │   └── [id].tsx
│   │   └── lanes/
│   │       └── details/
│   │           └── [id].tsx
│   ├── history/
│   │   ├── list.tsx
│   │   ├── cancelled.tsx
│   │   └── completed.tsx
│   ├── observations/
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── schedule/
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── on-hold.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── service-orders/
│   │   ├── index.tsx
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   ├── services/
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   ├── details/
│   │   │   └── [id].tsx
│   │   └── edit/
│   │       └── [id].tsx
│   └── trucks/
│       ├── index.tsx
│       ├── list.tsx
│       ├── create.tsx
│       ├── details/
│       │   └── [id].tsx
│       └── edit/
│           └── [id].tsx
│
├── profile/                           # User profile
│   └── index.tsx
│
├── search-system-demo.tsx             # Demo page
│
├── server/                            # DOMAIN: Server Management
│   ├── index.ts
│   ├── root.tsx
│   ├── server-root-wrapper.tsx
│   ├── database-sync.tsx
│   ├── logs.tsx
│   ├── metrics.tsx
│   ├── rate-limiting.tsx
│   ├── services.tsx
│   ├── shared-folders.tsx
│   ├── users.tsx
│   └── deployments/
│       ├── index.tsx
│       ├── list.tsx
│       └── [id].tsx
│
└── under-construction.tsx             # Under construction placeholder
```

---

## Naming Conventions

### Entity Name Variations (Web vs Mobile)

| Entity | Web Terminology | Mobile Terminology | Notes |
|--------|----------------|-------------------|-------|
| Staff Members | **Collaborators** | **Employees** | Same entity, different naming |
| Stock Changes | **Movements** | **Activities** | Same entity, different naming |
| Audit Trail | **Change Logs** | **Change Logs** | Same name, different location |
| People Management | **Human Resources** | **Human Resources** | Same |
| Stock | **Inventory** | **Inventory** | Same |
| Manufacturing | **Production** | **Production** | Same |

### URL Pattern (Portuguese)

Web application uses **Portuguese URLs** with **English folder names**:

```
Folder: administration/customers
URL:    /administracao/clientes

Folder: inventory/products
URL:    /estoque/produtos

Folder: human-resources/vacations
URL:    /recursos-humanos/ferias

Folder: production/schedule
URL:    /producao/cronograma
```

---

## Domain Organization

### 1. Administration Routes (`/administracao`)

**Location in routes.ts:** `routes.administration.*`

**Features:**
- ✅ Customers (Clientes)
- ✅ Collaborators/Employees (Colaboradores)
- ✅ Sectors (Setores)
- ✅ Notifications (Notificações)
- ✅ Files (Arquivos) - **Exists in web**
- ✅ Users (alias for Collaborators)
- ⚠️ Change Logs - Files exist in `/administration/change-logs/` but routes to `/servidor/registros-de-alteracoes`
- ✅ Monitoring (dashboard, metrics, alerts, logs)

**Page Structure:**
```
entity/
├── index.tsx          # Barrel export
├── list.tsx           # List view
├── create.tsx         # Create form
├── batch-edit.tsx     # Batch operations
├── details/
│   └── [id].tsx       # Detail view
└── edit/
    └── [id].tsx       # Edit form
```

### 2. Server Routes (`/servidor`)

**Location in routes.ts:** `routes.server.*`

**Features:**
- ✅ Backup
- ✅ Database Sync
- ✅ Deployments
- ✅ Logs
- ✅ Metrics
- ✅ Services
- ✅ Shared Folders
- ✅ Users
- ✅ Rate Limiting
- ✅ **Change Logs** - Routed here despite files being in `/administration/change-logs/`

### 3. Inventory Routes (`/estoque`)

**Location in routes.ts:** `routes.inventory.*`

**Features:**
- ✅ Products (Produtos)
  - ✅ Brands (Marcas)
  - ✅ Categories (Categorias)
  - ✅ Stock Balance
- ✅ Suppliers (Fornecedores)
- ✅ **Movements** (Movimentações) - Called "activities" in mobile
- ✅ Orders (Pedidos)
  - ✅ Automatic Orders
  - ✅ Order Schedules
- ✅ External Withdrawals (Retiradas Externas)
- ✅ Loans (Empréstimos)
- ✅ Maintenance (Manutenção)
  - ✅ Maintenance Schedules
- ✅ PPE (EPI - Equipment)
  - ✅ Deliveries
  - ✅ Schedules
- ✅ Statistics
  - Consumption
  - Stock Movement
  - Top Items
  - Trends

**Pattern:** Same CRUD structure as Administration

### 4. Human Resources Routes (`/recursos-humanos`)

**Location in routes.ts:** `routes.humanResources.*`

**Features:**
- ✅ Positions (Cargos)
  - ✅ Hierarchy view
  - ✅ Remunerations per position
- ✅ Performance Levels (Níveis de Desempenho)
- ✅ Vacations (Férias)
  - ✅ Calendar view
- ✅ Warnings (Avisos)
- ✅ Holidays (Feriados)
  - ✅ Calendar view
- ✅ PPE (EPI)
  - ✅ Deliveries
  - ✅ Schedules
  - ✅ Sizes
  - ✅ Reports
- ✅ Time Clock (Controle de Ponto)
- ✅ Calculations (Cálculos)
- ✅ Requisitions (Requisições)
- ✅ Payroll (Folha de Pagamento)
- ✅ Bonus Simulation (Simulação de Bônus)

**Note:** Employees/Collaborators are managed under Administration, not HR.

### 5. Production Routes (`/producao`)

**Location in routes.ts:** `routes.production.*`

**Features:**
- ✅ Schedule/Tasks (Cronograma) - Main production schedule
- ✅ Service Orders (Ordens de Serviço)
- ✅ Trucks (Caminhões)
- ✅ Garages (Garagens)
  - ✅ Lanes
- ✅ Airbrushing (Aerografia)
- ✅ Cutting (Recorte)
- ✅ Observations (Observações)
- ✅ Services (Serviços)
- ✅ History
  - ✅ Completed
  - ✅ Cancelled
- ✅ On Hold (Em Espera)

**Pattern:** Same CRUD structure with additional features like history tracking

---

## Key Findings: Web vs Mobile Differences

### 1. ✅ Files Route - EXISTS in Web

**Web:**
- Location: `/src/pages/administration/files/`
- URL: `/administracao/arquivos`
- Features:
  - List view
  - Create/Upload
  - Details view
  - Orphans view
  - WebDAV upload option

**Mobile:**
- Location: `/src/app/(tabs)/administration/files/`
- URL: `/administration/files`
- Features: List view only

**Status:** ✅ Feature parity exists

### 2. ❌ Commissions Route - DOES NOT EXIST in Web

**Search Results:**
- No dedicated `/commissions` route in web
- Only mentioned in observation details page comments
- No folder structure for commissions

**Mobile:**
- Location: `/src/app/(tabs)/administration/commissions/`
- URL: `/administration/commissions`

**Status:** ❌ Mobile has feature that web doesn't

### 3. ⚠️ Activities vs Movements - NAMING DIFFERENCE

**Web:**
- Folder: `/inventory/movements/`
- URL: `/estoque/movimentacoes`
- Terminology: "Movements" (Movimentações)

**Mobile:**
- Folder: `/inventory/activities/`
- URL: `/inventory/activities`
- Terminology: "Activities"

**Status:** ⚠️ Same entity, different naming convention

### 4. ⚠️ Change Logs Location - ROUTING DIFFERENCE

**Web:**
- Files: `/src/pages/administration/change-logs/`
- Routes: `routes.server.changeLogs.*` (under Server!)
- URL: `/servidor/registros-de-alteracoes`

**Mobile:**
- Folder: `/src/app/(tabs)/administration/change-logs/`
- URL: `/administration/change-logs`

**Status:** ⚠️ Files in administration, but routed to server section

### 5. ⚠️ Collaborators vs Employees - NAMING DIFFERENCE

**Web:**
- Folder: `/administration/collaborators/`
- URL: `/administracao/colaboradores`
- Terminology: "Collaborators" (Colaboradores)
- Alias: `routes.users` points to collaborators

**Mobile:**
- Folder: `/administration/employees/`
- URL: `/administration/employees`
- Terminology: "Employees"

**Status:** ⚠️ Same entity, different naming convention

---

## Page Organization Patterns

### Standard CRUD Pattern

All entities follow this consistent structure:

```
entity-name/
├── index.tsx              # Barrel export (exports all routes)
├── list.tsx               # List/table view with filters
├── create.tsx             # Create new record form
├── batch-edit.tsx         # Batch operations (optional)
├── details/
│   └── [id].tsx           # Read-only detail view
└── edit/
    └── [id].tsx           # Edit existing record form
```

**Example (Customers):**
```
customers/
├── index.tsx              → export * from "./list"
├── list.tsx               → /administracao/clientes
├── create.tsx             → /administracao/clientes/cadastrar
├── batch-edit.tsx         → /administracao/clientes/editar-em-lote
├── details/
│   └── [id].tsx           → /administracao/clientes/detalhes/:id
└── edit/
    └── [id].tsx           → /administracao/clientes/editar/:id
```

### Extended Patterns

#### 1. Entities with Sub-entities (e.g., Products)

```
products/
├── index.tsx
├── list.tsx
├── create.tsx
├── batch-edit.tsx
├── stock-balance.tsx      # Additional feature
├── brands/                # Sub-entity
│   ├── index.tsx
│   ├── list.tsx
│   ├── create.tsx
│   └── ...
├── categories/            # Sub-entity
│   ├── index.tsx
│   ├── list.tsx
│   └── ...
├── details/
│   └── [id].tsx
└── edit/
    └── [id].tsx
```

#### 2. Entities with Schedules/Deliveries (e.g., PPE)

```
ppe/
├── index.tsx
├── list.tsx
├── create.tsx
├── deliveries/            # Related entity
│   ├── list.tsx
│   ├── create.tsx
│   ├── details/
│   │   └── [id].tsx
│   └── edit/
│       └── [id].tsx
├── schedules/             # Related entity
│   ├── list.tsx
│   ├── create.tsx
│   └── ...
├── sizes/                 # Related entity (HR PPE only)
│   └── ...
├── details/
│   └── [id].tsx
└── edit/
    └── [id].tsx
```

#### 3. Entities with Calendar Views (e.g., Vacations)

```
vacations/
├── index.tsx
├── list.tsx
├── create.tsx
├── batch-edit.tsx
├── calendar.tsx           # Calendar view
├── details/
│   └── [id].tsx
└── edit/
    └── [id].tsx
```

#### 4. Entities with Hierarchies (e.g., Positions)

```
positions/
├── index.tsx
├── list.tsx
├── create.tsx
├── batch-edit.tsx
├── hierarchy.tsx          # Tree/hierarchy view
├── [positionId]/
│   └── remunerations.tsx  # Nested resource
├── details/
│   └── [id].tsx
└── edit/
    └── [id].tsx
```

### File Naming Conventions

1. **List pages:** Always `list.tsx`
2. **Create pages:** Always `create.tsx` or `cadastrar.tsx` (Portuguese)
3. **Edit pages:** Always `edit/[id].tsx` or `editar/[id].tsx`
4. **Detail pages:** Always `details/[id].tsx` or `detalhes/[id].tsx`
5. **Batch operations:** Always `batch-edit.tsx`
6. **Index files:** Always `index.tsx` (barrel exports)
7. **Root pages:** Always `root.tsx` (domain landing page)

### URL Conventions (Portuguese)

| English | Portuguese (URL) |
|---------|-----------------|
| list | (implied, root URL) |
| create | `/cadastrar` |
| edit | `/editar/:id` |
| details | `/detalhes/:id` |
| batch-edit | `/editar-em-lote` |
| calendar | `/calendario` |
| hierarchy | `/hierarquia` |
| schedules | `/agendamentos` |
| deliveries | `/entregas` |

---

## Route Configuration

Routes are centralized in:
- **File:** `/src/constants/routes.ts`
- **Type:** Strongly typed object with nested structure
- **Pattern:** Domain → Entity → Action

**Example:**
```typescript
routes.administration.customers.details(id)
// → /administracao/clientes/detalhes/:id

routes.inventory.movements.create
// → /estoque/movimentacoes/cadastrar

routes.humanResources.vacations.calendar
// → /recursos-humanos/ferias/calendario
```

---

## Summary Table: Feature Comparison

| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Customers | ✅ | ✅ | Parity |
| Collaborators/Employees | ✅ (Collaborators) | ✅ (Employees) | Naming differs |
| Sectors | ✅ | ✅ | Parity |
| Notifications | ✅ | ✅ | Parity |
| **Files** | ✅ | ✅ | **Parity** |
| **Commissions** | ❌ | ✅ | **Missing in web** |
| Change Logs | ✅ (Server routes) | ✅ (Admin routes) | Location differs |
| Movements/Activities | ✅ (Movements) | ✅ (Activities) | Naming differs |
| Products | ✅ | ✅ | Parity |
| Orders | ✅ | ✅ | Parity |
| PPE | ✅ | ✅ | Parity |
| Vacations | ✅ | ✅ | Parity |
| Production Schedule | ✅ | ✅ | Parity |
| Service Orders | ✅ | ✅ | Parity |

---

## Recommendations for Mobile Alignment

Based on this analysis:

1. **Terminology Alignment:**
   - Decide: "Collaborators" (web) vs "Employees" (mobile)
   - Decide: "Movements" (web) vs "Activities" (mobile)
   - Recommend: **Use web terminology** (more consistent with business language)

2. **Route Structure:**
   - Mobile should consider: Keep change-logs under administration or move to server?
   - Recommend: **Keep in administration** (more logical grouping)

3. **Missing Features:**
   - **Commissions:** Add to web or remove from mobile?
   - Recommend: Investigate if commissions feature is still needed

4. **Naming Consistency:**
   - Use English folder names with Portuguese URLs (like web)
   - Standardize file naming: `list.tsx`, `create.tsx`, `details/[id].tsx`, `edit/[id].tsx`

---

**End of Analysis**
