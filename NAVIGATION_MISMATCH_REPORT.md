# Navigation.ts Cross-Reference Mismatch Report

**Analysis Date:** 2025-10-26  
**Codebase:** Mobile App (React Native)  
**Focus Modules:** Painting, Inventory, Production, Human-Resources

---

## EXECUTIVE SUMMARY

**CRITICAL FINDING:** The `navigation.ts` file is completely out of sync with the actual file structure.

- **Navigation.ts Language:** Portuguese (e.g., `/pintura`, `/estoque`, `/recursos-humanos`)
- **Actual File Structure:** English (e.g., `/painting`, `/inventory`, `/human-resources`)
- **Root Cause:** A language/naming refactor was performed on the file system but NOT updated in navigation.ts
- **Scope:** ALL 4 focused modules are affected with systematic naming mismatches

---

## DETAILED FINDINGS BY MODULE

### 1. PAINTING MODULE

#### Navigation Paths (Portuguese in navigation.ts)
```
/pintura
  └─ /pintura/catalogo
     ├─ /pintura/catalogo/cadastrar
     ├─ /pintura/catalogo/listar
     ├─ /pintura/catalogo/detalhes/:id
     └─ /pintura/catalogo/detalhes/:paintId/formulas/...
  ├─ /pintura/marcas-de-tinta
  ├─ /pintura/tipos-de-tinta
  └─ /pintura/producoes
```

#### Actual Files (English in src/app/(tabs)/)
```
/painting (21 files)
  ├─ /catalog
  │  ├─ create.tsx
  │  ├─ list.tsx
  │  ├─ edit/[id].tsx
  │  └─ details/[id].tsx
  ├─ /formulas (NEW - not in navigation)
  │  ├─ [formulaId]/components/...
  │  └─ details/[id].tsx
  ├─ /paint-brands
  ├─ /paint-types
  └─ /productions
```

#### Mismatches
| Navigation Path | Actual File | Status |
|---|---|---|
| `/pintura` | `/painting` | Portuguese → English |
| `/pintura/catalogo` | `/painting/catalog` | Portuguese → English |
| `/pintura/marcas-de-tinta` | `/painting/paint-brands` | Portuguese → English |
| `/pintura/tipos-de-tinta` | `/painting/paint-types` | Portuguese → English |
| `/pintura/producoes` | `/painting/productions` | Portuguese → English |
| N/A | `/painting/formulas` | **ORPHANED FILE** - Not in navigation |

#### Summary
- **Navigation Paths:** 19
- **Actual Files:** 21
- **Missing from Navigation:** 2 (formulas and related)
- **Language Mismatch:** 100%

---

### 2. INVENTORY MODULE

#### Navigation Paths (Portuguese in navigation.ts)
```
/estoque (78 paths)
  ├─ /estoque/emprestimos
  ├─ /estoque/epi
  ├─ /estoque/fornecedores
  ├─ /estoque/manutencao
  ├─ /estoque/movimentacoes
  ├─ /estoque/pedidos
  ├─ /estoque/produtos
  └─ /estoque/retiradas-externas
```

#### Actual Files (English in src/app/(tabs)/)
```
/inventory (82 files)
  ├─ /borrows
  ├─ /ppe
  ├─ /suppliers
  ├─ /maintenance
  ├─ /movements (activity?)
  ├─ /orders
  ├─ /products
  ├─ /external-withdrawals
  ├─ /activities (NEW)
  ├─ /reports (NEW)
  └─ /statistics (NEW)
```

#### Mismatches
| Navigation Path | Actual File | Status |
|---|---|---|
| `/estoque` | `/inventory` | Portuguese → English |
| `/estoque/emprestimos` | `/inventory/borrows` | Portuguese → English |
| `/estoque/epi` | `/inventory/ppe` | Portuguese → English |
| `/estoque/fornecedores` | `/inventory/suppliers` | Portuguese → English |
| `/estoque/manutencao` | `/inventory/maintenance` | Portuguese → English |
| `/estoque/movimentacoes` | `/inventory/movements` | Portuguese → English |
| `/estoque/pedidos` | `/inventory/orders` | Portuguese → English |
| `/estoque/produtos` | `/inventory/products` | Portuguese → English |
| `/estoque/retiradas-externas` | `/inventory/external-withdrawals` | Portuguese → English |
| N/A | `/inventory/activities` | **ORPHANED FILE** - Not in navigation |
| N/A | `/inventory/reports` | **ORPHANED FILE** - Not in navigation |
| N/A | `/inventory/statistics` | **ORPHANED FILE** - Not in navigation |

#### Subcategory Mismatches
All CRUD operations follow Portuguese naming in navigation:
- `cadastrar` → `create`
- `listar` → `list`
- `editar` → `edit`
- `detalhes` → `details`

Example: `/estoque/produtos/cadastrar` → `/inventory/products/create`

#### Summary
- **Navigation Paths:** 78
- **Actual Files:** 82
- **Missing from Navigation:** 3+ (activities, reports, statistics)
- **Language Mismatch:** 100% at module level
- **Subcategory Mismatches:** 50+ (all CRUD operations)

---

### 3. PRODUCTION MODULE

#### Navigation Paths (Portuguese in navigation.ts)
```
/producao (40 paths)
  ├─ /producao/aerografia
  ├─ /producao/cronograma
  ├─ /producao/em-espera
  ├─ /producao/garagens
  ├─ /producao/historico
  ├─ /producao/observacoes
  └─ /producao/recorte
     ├─ /producao/recorte/plano-de-corte
     └─ /producao/recorte/requisicao-de-recorte

/financeiro/producao (5 paths - duplicate/financial view)
  ├─ /financeiro/producao/aerografia
  ├─ /financeiro/producao/cronograma
  ├─ /financeiro/producao/em-espera
  └─ /financeiro/producao/historico-tarefas
```

#### Actual Files (English in src/app/(tabs)/)
```
/production (45 files)
  ├─ /airbrushing
  ├─ /schedule
  ├─ /on-hold.tsx (single file)
  ├─ /garages
  ├─ /history
  ├─ /observations
  ├─ /paints
  ├─ /cutting
  │  ├─ /cutting-plan
  │  └─ /cutting-request
  ├─ /service-orders
  ├─ /services
  └─ /trucks
```

#### Mismatches
| Navigation Path | Actual File | Status |
|---|---|---|
| `/producao` | `/production` | Portuguese → English |
| `/producao/aerografia` | `/production/airbrushing` | Portuguese → English |
| `/producao/cronograma` | `/production/schedule` | Portuguese → English |
| `/producao/em-espera` | `/production/on-hold.tsx` | Portuguese → English (+ structure) |
| `/producao/garagens` | `/production/garages` | Portuguese → English |
| `/producao/historico` | `/production/history` | Portuguese → English |
| `/producao/observacoes` | `/production/observations` | Portuguese → English |
| `/producao/recorte/plano-de-corte` | `/production/cutting/cutting-plan` | Portuguese → English |
| `/producao/recorte/requisicao-de-recorte` | `/production/cutting/cutting-request` | Portuguese → English |
| N/A | `/production/paints` | **ORPHANED FILE** - Not in navigation |
| N/A | `/production/service-orders` | **ORPHANED FILE** - Not in navigation |
| N/A | `/production/services` | **ORPHANED FILE** - Not in navigation |
| N/A | `/production/trucks` | **ORPHANED FILE** - Not in navigation |

#### Summary
- **Navigation Paths:** 40 (main) + 5 (financial view)
- **Actual Files:** 45
- **Missing from Navigation:** 4 (paints, service-orders, services, trucks)
- **Language Mismatch:** 100% at module level
- **Structural Mismatches:** Cutting hierarchy issues

---

### 4. HUMAN-RESOURCES MODULE

#### Navigation Paths (Portuguese in navigation.ts)
```
/recursos-humanos (44 paths)
  ├─ /recursos-humanos/avisos
  ├─ /recursos-humanos/calculos
  ├─ /recursos-humanos/cargos
  ├─ /recursos-humanos/controle-ponto
  ├─ /recursos-humanos/epi
  ├─ /recursos-humanos/feriados
  ├─ /recursos-humanos/ferias
  ├─ /recursos-humanos/folha-de-pagamento
  ├─ /recursos-humanos/niveis-desempenho
  ├─ /recursos-humanos/requisicoes
  └─ /recursos-humanos/simulacao-bonus
```

#### Actual Files (English in src/app/(tabs)/)
```
/human-resources (56 files)
  ├─ /warnings
  ├─ /calculations.tsx
  ├─ /positions
  ├─ /time-clock.tsx
  ├─ /ppe
  ├─ /employees (NEW)
  ├─ /holidays
  ├─ /vacations
  ├─ /payroll
  ├─ /performance-levels
  ├─ /requisitions.tsx
  ├─ /bonus-simulation.tsx
  └─ /sectors
```

#### Mismatches
| Navigation Path | Actual File | Status |
|---|---|---|
| `/recursos-humanos` | `/human-resources` | Portuguese → English |
| `/recursos-humanos/avisos` | `/human-resources/warnings` | Portuguese → English |
| `/recursos-humanos/calculos` | `/human-resources/calculations.tsx` | Portuguese → English |
| `/recursos-humanos/cargos` | `/human-resources/positions` | Portuguese → English |
| `/recursos-humanos/controle-ponto` | `/human-resources/time-clock.tsx` | Portuguese → English |
| `/recursos-humanos/epi` | `/human-resources/ppe` | Portuguese → English |
| `/recursos-humanos/feriados` | `/human-resources/holidays` | Portuguese → English |
| `/recursos-humanos/ferias` | `/human-resources/vacations` | Portuguese → English |
| `/recursos-humanos/folha-de-pagamento` | `/human-resources/payroll` | Portuguese → English |
| `/recursos-humanos/niveis-desempenho` | `/human-resources/performance-levels` | Portuguese → English |
| `/recursos-humanos/requisicoes` | `/human-resources/requisitions.tsx` | Portuguese → English |
| `/recursos-humanos/simulacao-bonus` | `/human-resources/bonus-simulation.tsx` | Portuguese → English |
| N/A | `/human-resources/employees` | **ORPHANED FILE** - Not in navigation |
| N/A | `/human-resources/sectors` | **ORPHANED FILE** - Not in navigation (listed under admin) |

#### Summary
- **Navigation Paths:** 44
- **Actual Files:** 56
- **Missing from Navigation:** 2+ (employees, sectors)
- **Language Mismatch:** 100% at module level
- **Subcategory Mismatches:** 20+ (all CRUD operations)

---

## SUMMARY TABLE

| Module | Nav Paths | Actual Files | Language Mismatch | Orphaned Files | Critical |
|---|---|---|---|---|---|
| Painting | 19 | 21 | 100% | 2+ | HIGH |
| Inventory | 78 | 82 | 100% | 3+ | CRITICAL |
| Production | 40 | 45 | 100% | 4 | CRITICAL |
| Human-Resources | 44 | 56 | 100% | 2+ | HIGH |
| **TOTAL** | **181** | **204** | **100%** | **11+** | **CRITICAL** |

---

## ROOT CAUSE ANALYSIS

The codebase underwent a language/naming refactor from Portuguese to English:

1. **File Structure:** Renamed from Portuguese (`pintura`, `estoque`, etc.) to English (`painting`, `inventory`, etc.)
2. **Navigation.ts:** NOT updated to reflect new English naming
3. **Result:** All navigation paths still use Portuguese while routing references English paths
4. **Impact:** Navigation menu will fail to resolve routes correctly

---

## RECOMMENDATIONS

### Priority 1: Critical (IMMEDIATE)
1. Update ALL paths in `navigation.ts` to match English naming convention
2. Rebuild complete mapping of Portuguese → English for all 247 paths
3. Test all navigation routes after updates

### Priority 2: Important (NEXT SPRINT)
1. Create automated test to sync navigation.ts with actual file structure
2. Add validation in CI/CD to catch future mismatches
3. Document routing strategy (English naming convention)

### Priority 3: Enhancement (FOLLOW-UP)
1. Consider moving common path mappings to a constants file
2. Implement type-safe route definitions
3. Add route generation from file structure

---

## FILES AFFECTED

### Navigation.ts (to be updated)
- Location: `/Users/kennedycampos/Documents/repositories/mobile/src/constants/navigation.ts`
- Lines: Entire NAVIGATION_MENU array (440-1511)
- Changes Required: Complete rename of Portuguese paths to English

### Example Corrections Needed
```typescript
// BEFORE (Portuguese)
{
  id: "pintura",
  title: "Pintura",
  path: "/pintura",
  children: [
    { id: "catalogo", path: "/pintura/catalogo" },
    { id: "marcas-de-tinta", path: "/pintura/marcas-de-tinta" },
  ]
}

// AFTER (English)
{
  id: "painting",
  title: "Pintura",
  path: "/painting",
  children: [
    { id: "catalog", path: "/painting/catalog" },
    { id: "paint-brands", path: "/painting/paint-brands" },
  ]
}
```

---

## MAPPING REFERENCE

### Main Modules
```
administracao → administration
estoque → inventory
financeiro → financial
integracoes → integrations
manutencao → maintenance
meu-pessoal → my-team
pessoal → personal
pintura → painting
producao → production
recursos-humanos → human-resources
servidor → server
```

### Common Operations
```
cadastrar → create
editar → edit
editar-em-lote → batch-edit
listar → list
detalhes → details
configurar → configure
enviar → send
solicitar → request
```

### Sub-Items
```
avisos → warnings
calculos → calculations
cargos → positions
catalogo → catalog
controle-ponto → time-clock
epi → ppe
emprestimos → borrows
entregas → deliveries
feriados → holidays
ferias → vacations
folha-de-pagamento → payroll
fornecedores → suppliers
manutencao → maintenance
marcas-de-tinta → paint-brands
movimentacoes → movements
niveis-desempenho → performance-levels
observacoes → observations
pedidos → orders
produtos → products
recorte → cutting
retiradas-externas → external-withdrawals
requisicoes → requisitions
setores → sectors
simulacao-bonus → bonus-simulation
tipos-de-tinta → paint-types
usuarios → users
```

---

## CONCLUSION

The navigation.ts file requires immediate updates to align with the actual English-named file structure. All 247 navigation paths need verification and correction. Without these updates, the navigation menu will not properly route to the actual pages, causing application navigation to fail.

