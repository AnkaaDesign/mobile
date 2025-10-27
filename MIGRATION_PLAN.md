# Mobile App Migration Plan - Align with Web Version

## Overview
This document outlines the complete migration plan to align the mobile app's navigation, routing, and file structure with the web version.

## Key Differences to Address

### 1. Path Language
- **Current Mobile**: English paths (`/inventory`, `/administration`, `/production`)
- **Web Version**: Portuguese paths (`/estoque`, `/administracao`, `/producao`)
- **Action**: Rename all folders and update all references

### 2. Route Patterns
- **Web Pattern**: `/module/entity/action` (e.g., `/estoque/emprestimos/cadastrar`)
- **Mobile Current**: `/module/entity/action` but in English
- **Action**: Keep pattern, change to Portuguese

### 3. Folder Structure Mapping

#### Administration Module
```bash
# Current Mobile → Web Aligned
administration/ → administracao/
├── collaborators/ → colaboradores/
├── customers/ → clientes/
├── sectors/ → setores/
├── notifications/ → notificacoes/
├── files/ → arquivos/ (NOT IN WEB - REMOVE)
└── change-logs/ → registros-de-alteracoes/ (MOVE TO SERVER)
```

#### Inventory Module
```bash
# Current Mobile → Web Aligned
inventory/ → estoque/
├── borrows/ → emprestimos/
├── ppe/ → epi/
├── suppliers/ → fornecedores/
├── maintenance/ → manutencao/
├── activities/ → movimentacoes/
├── orders/ → pedidos/
├── products/ → produtos/
├── external-withdrawals/ → retiradas-externas/
├── reports/ → (NOT IN WEB - REMOVE)
└── statistics/ → (NOT IN WEB - REMOVE)
```

#### Production Module
```bash
# Current Mobile → Web Aligned
production/ → producao/
├── airbrushing/ → aerografia/
├── schedule/ → cronograma/
├── cutting/ → recorte/
├── garages/ → garagens/
├── observations/ → observacoes/
├── paints/ → tintas/
├── service-orders/ → ordens-de-servico/
├── services/ → servicos/
├── trucks/ → caminhoes/
└── history/ → historico/
```

#### Human Resources Module
```bash
# Current Mobile → Web Aligned
human-resources/ → recursos-humanos/
├── employees/ → funcionarios/
├── holidays/ → feriados/
├── payroll/ → folha-de-pagamento/
├── performance-levels/ → niveis-de-desempenho/
├── positions/ → cargos/
├── ppe/ → epi/
├── sectors/ → setores/
├── vacations/ → ferias/
└── warnings/ → advertencias/
```

#### Painting Module
```bash
# Current Mobile → Web Aligned
painting/ → pintura/
├── catalog/ → catalogo/
├── formulas/ → formulas/
├── paint-brands/ → marcas-de-tinta/
├── paint-types/ → tipos-de-tinta/
└── productions/ → producoes/
```

#### Personal Module
```bash
# Current Mobile → Web Aligned
personal/ → pessoal/
├── my-borrows/ → meus-emprestimos/
├── my-holidays/ → meus-feriados/
├── my-notifications/ → minhas-notificacoes/
├── my-ppes/ → meus-epis/
├── my-vacations/ → minhas-ferias/
├── my-warnings/ → minhas-advertencias/
└── preferences/ → preferencias/
```

#### Server Module
```bash
# Current Mobile → Web Aligned
server/ → servidor/
├── backups/ → backups/
├── change-logs/ → registros-de-alteracoes/
├── deployments/ → implantacoes/
└── (add missing items from web)
```

#### My Team Module
```bash
# Current Mobile → Web Aligned
my-team/ → meu-pessoal/
├── borrows/ → emprestimos/
├── vacations/ → ferias/
└── warnings/ → advertencias/
```

### 4. Action Names
```bash
# Current Mobile → Web Aligned
create → cadastrar
details/[id] → detalhes/[id]
edit/[id] → editar/[id]
list → (no suffix, just entity name)
batch-edit → editar-lote or editar-em-lote
```

### 5. Modules to Remove (Not in Web)
- `admin/` folder (only has backup.tsx)
- `dashboard/` (handled differently in web)
- `integrations/` (not in main navigation)
- `maintenance/` as standalone (it's under inventory)
- `profile/` (part of personal)
- `inventory/reports/`
- `inventory/statistics/`

### 6. Modules to Add (From Web)
- `financeiro/` (Financial)
- `estatisticas/` (Statistics)
- Server module items missing

## Migration Steps

### Step 1: Create Backup
```bash
cp -r src/app/\(tabs\) src/app/\(tabs\).backup
```

### Step 2: Restructure Folders
Execute the folder renaming script to convert all English folder names to Portuguese.

### Step 3: Update Navigation Configuration
- Update `src/constants/navigation.ts` to match web exactly
- Use Portuguese paths throughout
- Ensure privileges match web version

### Step 4: Update Route Mapper
- Update `src/lib/route-mapper.ts` to handle Portuguese paths
- Remove English path mappings

### Step 5: Update Screen Registration
- Update `getScreensToRegister()` in `_layout.tsx`
- Use Portuguese paths for screen names

### Step 6: Update All Imports
- Search and replace all import paths
- Update all navigation references

### Step 7: Testing
- Test each navigation item
- Verify privileges work correctly
- Ensure all screens load

## Files to Update
1. `/src/constants/navigation.ts` - Main navigation config
2. `/src/app/(tabs)/_layout.tsx` - Screen registration
3. `/src/lib/route-mapper.ts` - Route mapping
4. All individual screen files - Update imports and paths
5. `/src/constants/routes.ts` - Route constants

## Privilege Alignment
Ensure these match web exactly:
- ADMIN
- WAREHOUSE
- PRODUCTION
- HUMAN_RESOURCES
- LEADER
- FINANCIAL
- USER
- EXTERNAL
- MAINTENANCE

## Expected Outcome
After migration:
- Mobile app uses Portuguese paths like web
- Navigation structure matches web exactly
- No extra modules not present in web
- Privileges work identically to web
- User experience consistent across platforms