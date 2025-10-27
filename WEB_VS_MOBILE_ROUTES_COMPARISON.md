# WEB VS MOBILE ROUTE PATTERNS - QUICK REFERENCE

## Route Pattern Comparison

### WEB VERSION PATTERNS (React Router)
```
/module/entity (list)
/module/entity/cadastrar (create)
/module/entity/detalhes/:id (details)
/module/entity/editar/:id (edit)
/module/entity/editar-em-lote (batch edit)
/module/entity/editar-lote (batch edit alternative)

Examples:
/estoque/emprestimos → List loans
/estoque/emprestimos/cadastrar → Create loan
/estoque/emprestimos/detalhes/123 → View loan details
/estoque/emprestimos/editar/123 → Edit loan
/estoque/emprestimos/editar-lote → Batch edit loans
```

### EXPECTED MOBILE PATTERNS (React Navigation)
```
Probably similar structure but might use:
- Screen names: LoansListScreen, CreateLoanScreen, LoanDetailsScreen, EditLoanScreen
- Stack navigation: production > cronograma > details
- Tab-based organization with nested stacks

Could align with:
/(tabs)/inventory/loans
/(tabs)/inventory/loans/[id]
/(tabs)/inventory/loans/create
/(tabs)/inventory/loans/[id]/edit
```

---

## COMPLETE MODULE MAPPING

### 1. ADMINISTRATION (Administração)

#### Web Paths:
```
/administracao/clientes               - List customers
/administracao/clientes/cadastrar     - Create customer
/administracao/clientes/detalhes/:id  - Customer details
/administracao/clientes/editar/:id    - Edit customer
/administracao/clientes/editar-em-lote - Batch edit customers

/administracao/colaboradores          - List employees
/administracao/colaboradores/cadastrar - Create employee
/administracao/colaboradores/detalhes/:id - Employee details
/administracao/colaboradores/editar/:id - Edit employee
/administracao/colaboradores/editar-em-lote - Batch edit

/administracao/setores               - List sectors
/administracao/setores/cadastrar      - Create sector
/administracao/setores/detalhes/:id   - Sector details
/administracao/setores/editar/:id     - Edit sector
/administracao/setores/editar-em-lote - Batch edit

/administracao/notificacoes           - List notifications
/administracao/notificacoes/cadastrar/enviar - Send notification
/administracao/notificacoes/detalhes/:id - Notification details
/administracao/notificacoes/editar/:id - Edit notification

/administracao/registros-de-alteracoes - Change logs
/administracao/registros-de-alteracoes/detalhes/:id - Log details
```

#### Mobile Alignment:
- Likely: `/(tabs)/administration/customers`
- Or: `/administration/(stack)/customers`
- Might split employees from customers

---

### 2. INVENTORY (Estoque)

#### Web Paths:

##### Loans (Empréstimos)
```
/estoque/emprestimos              - List loans
/estoque/emprestimos/cadastrar    - Create loan
/estoque/emprestimos/detalhes/:id - Loan details
/estoque/emprestimos/editar-lote  - Batch edit loans
```

##### PPE (EPI)
```
/estoque/epi                       - List PPE
/estoque/epi/cadastrar             - Create PPE
/estoque/epi/detalhes/:id          - PPE details
/estoque/epi/editar/:id            - Edit PPE

/estoque/epi/agendamentos          - PPE schedules list
/estoque/epi/agendamentos/cadastrar - Create schedule
/estoque/epi/agendamentos/detalhes/:id - Schedule details
/estoque/epi/agendamentos/editar/:id   - Edit schedule

/estoque/epi/entregas              - PPE deliveries list
/estoque/epi/entregas/cadastrar    - Create delivery
/estoque/epi/entregas/detalhes/:id - Delivery details
/estoque/epi/entregas/editar/:id   - Edit delivery
```

##### Suppliers (Fornecedores)
```
/estoque/fornecedores              - List suppliers
/estoque/fornecedores/cadastrar    - Create supplier
/estoque/fornecedores/detalhes/:id - Supplier details
/estoque/fornecedores/editar/:id   - Edit supplier
/estoque/fornecedores/editar-em-lote - Batch edit
```

##### Maintenance (Manutenção)
```
/estoque/manutencao                - List maintenance
/estoque/manutencao/cadastrar      - Create maintenance
/estoque/manutencao/detalhes/:id   - Maintenance details
/estoque/manutencao/editar/:id     - Edit maintenance

/estoque/manutencao/agendamentos   - Maintenance schedules
/estoque/manutencao/agendamentos/cadastrar - Create schedule
/estoque/manutencao/agendamentos/detalhes/:id
/estoque/manutencao/agendamentos/editar/:id
```

##### Movements (Movimentações)
```
/estoque/movimentacoes             - List movements
/estoque/movimentacoes/cadastrar   - Create movement
/estoque/movimentacoes/detalhes/:id - Movement details
/estoque/movimentacoes/editar/:id  - Edit movement
/estoque/movimentacoes/editar-lote - Batch edit
```

##### Orders (Pedidos)
```
/estoque/pedidos                   - List orders
/estoque/pedidos/cadastrar         - Create order
/estoque/pedidos/detalhes/:id      - Order details
/estoque/pedidos/editar/:id        - Edit order

/estoque/pedidos/agendamentos      - Order schedules
/estoque/pedidos/agendamentos/cadastrar
/estoque/pedidos/agendamentos/detalhes/:id
/estoque/pedidos/agendamentos/editar/:id

/estoque/pedidos/automaticos       - Automatic orders
/estoque/pedidos/automaticos/configurar - Configure
```

##### Products (Produtos)
```
/estoque/produtos                  - List products
/estoque/produtos/cadastrar        - Create product
/estoque/produtos/detalhes/:id     - Product details
/estoque/produtos/editar/:id       - Edit product
/estoque/produtos/editar-em-lote   - Batch edit
/estoque/produtos/balanco-estoque  - Stock balance

/estoque/produtos/categorias       - Categories list
/estoque/produtos/categorias/cadastrar
/estoque/produtos/categorias/detalhes/:id
/estoque/produtos/categorias/editar/:id
/estoque/produtos/categorias/editar-em-lote

/estoque/produtos/marcas           - Brands list
/estoque/produtos/marcas/cadastrar
/estoque/produtos/marcas/detalhes/:id
/estoque/produtos/marcas/editar/:id
/estoque/produtos/marcas/editar-em-lote
```

##### External Withdrawals (Retiradas Externas)
```
/estoque/retiradas-externas        - List external withdrawals
/estoque/retiradas-externas/cadastrar
/estoque/retiradas-externas/detalhes/:id
/estoque/retiradas-externas/editar/:id
```

---

### 3. PAINTING (Pintura)

#### Web Paths:
```
/pintura/catalogo                  - Paint catalog (full)
/pintura/catalogo/cadastrar        - Create paint
/pintura/catalogo/detalhes/:id     - Paint details
/pintura/catalogo/editar/:id       - Edit paint
/pintura/catalogo-basico           - Basic catalog (LEADER only)

/pintura/producoes                 - Paint productions
/pintura/producoes/detalhes/:id    - Production details

/pintura/marcas-de-tinta           - Paint brands
/pintura/marcas-de-tinta/cadastrar
/pintura/marcas-de-tinta/editar/:id

/pintura/tipos-de-tinta            - Paint types
/pintura/tipos-de-tinta/cadastrar
/pintura/tipos-de-tinta/editar/:id
```

---

### 4. PRODUCTION (Produção)

#### Web Paths:

##### Schedule/Tasks (Cronograma)
```
/producao/cronograma               - Schedule list
/producao/cronograma/cadastrar     - Create task
/producao/cronograma/detalhes/:id  - Task details
/producao/cronograma/editar/:id    - Edit task
/producao/cronograma/editar-em-lote - Batch edit

/producao/em-espera                - Tasks on hold
/producao/em-espera/detalhes/:id   - Task details

/producao/historico                - Task history
/producao/historico/detalhes/:id   - History details
/producao/historico/cancelados     - Cancelled tasks
/producao/historico/concluidos     - Completed tasks
```

##### Other Production Areas
```
/producao/aerografia               - Airbrushing
/producao/aerografia/cadastrar
/producao/aerografia/detalhes/:id
/producao/aerografia/editar/:id

/producao/recorte                  - Cutting
/producao/recorte/detalhes/:id

/producao/garagens                 - Garages
/producao/garagens/cadastrar
/producao/garagens/detalhes/:id
/producao/garagens/editar/:id

/producao/observacoes              - Observations
/producao/observacoes/cadastrar
/producao/observacoes/detalhes/:id
/producao/observacoes/editar/:id

/producao/ordens-de-servico        - Service orders
/producao/ordens-de-servico/cadastrar
/producao/ordens-de-servico/detalhes/:id

/producao/servicos                 - Services
/producao/servicos/cadastrar
/producao/servicos/detalhes/:id
/producao/servicos/editar/:id

/producao/caminhoes                - Trucks
/producao/caminhoes/cadastrar
/producao/caminhoes/detalhes/:id
/producao/caminhoes/editar/:id
```

---

### 5. HUMAN RESOURCES (Recursos Humanos)

#### Web Paths:

##### Core HR Areas
```
/recursos-humanos/avisos           - Warnings list
/recursos-humanos/avisos/cadastrar
/recursos-humanos/avisos/detalhes/:id
/recursos-humanos/avisos/editar/:id
/recursos-humanos/avisos/editar-em-lote

/recursos-humanos/cargos           - Positions list
/recursos-humanos/cargos/cadastrar
/recursos-humanos/cargos/detalhes/:id
/recursos-humanos/cargos/editar/:id
/recursos-humanos/cargos/editar-em-lote
/recursos-humanos/cargos/hierarquia - Position hierarchy

/recursos-humanos/calculos         - Calculations
/recursos-humanos/controle-ponto   - Time clock

/recursos-humanos/feriados         - Holidays
/recursos-humanos/feriados/cadastrar
/recursos-humanos/feriados/editar/:id
/recursos-humanos/feriados/calendario - Holiday calendar

/recursos-humanos/ferias           - Vacations
/recursos-humanos/ferias/cadastrar
/recursos-humanos/ferias/detalhes/:id
/recursos-humanos/ferias/editar/:id
/recursos-humanos/ferias/editar-em-lote
/recursos-humanos/ferias/calendario - Vacation calendar
```

##### EPI/PPE (from HR perspective)
```
/recursos-humanos/epi              - EPI list
/recursos-humanos/epi/cadastrar
/recursos-humanos/epi/detalhes/:id
/recursos-humanos/epi/editar/:id

/recursos-humanos/epi/agendamentos - EPI schedules
/recursos-humanos/epi/agendamentos/cadastrar
/recursos-humanos/epi/agendamentos/detalhes/:id
/recursos-humanos/epi/agendamentos/editar/:id

/recursos-humanos/epi/entregas     - EPI deliveries
/recursos-humanos/epi/entregas/cadastrar
/recursos-humanos/epi/entregas/detalhes/:id
/recursos-humanos/epi/entregas/editar/:id

/recursos-humanos/epi/tamanhos     - EPI sizes
/recursos-humanos/epi/tamanhos/cadastrar
/recursos-humanos/epi/tamanhos/editar/:id
```

##### Financial HR
```
/recursos-humanos/folha-de-pagamento - Payroll
/recursos-humanos/folha-de-pagamento/detalhe/:id
/recursos-humanos/folha-de-pagamento/criar
/recursos-humanos/folha-de-pagamento/editar/:id

/recursos-humanos/bonificacoes     - Bonuses
/recursos-humanos/bonificacoes/cadastrar
/recursos-humanos/bonificacoes/detalhes/:id
/recursos-humanos/bonificacoes/editar/:id

/recursos-humanos/bonificacoes-desconto - Bonus discounts
/recursos-humanos/bonificacoes-desconto/cadastrar
/recursos-humanos/bonificacoes-desconto/detalhes/:id
/recursos-humanos/bonificacoes-desconto/editar/:id

/recursos-humanos/simulacao-bonus  - Bonus simulation

/recursos-humanos/niveis-desempenho - Performance levels
/recursos-humanos/requisicoes      - Requests
```

---

### 6. PERSONAL (Pessoal) - User's Own Data

#### Web Paths:
```
/pessoal/meu-perfil                - My profile
/pessoal/meus-emprestimos          - My loans
/pessoal/meus-emprestimos/detalhes/:id

/pessoal/meus-epis                 - My PPE
/pessoal/meus-epis/solicitar       - Request PPE

/pessoal/meus-feriados             - My holidays
/pessoal/minhas-ferias             - My vacations
/pessoal/minhas-ferias/detalhes/:id

/pessoal/minhas-notificacoes       - My notifications
/pessoal/minhas-notificacoes/detalhes/:id

/pessoal/meus-avisos               - My warnings
/pessoal/meus-avisos/detalhes/:id

/pessoal/preferencias              - My preferences
```

---

### 7. MY TEAM (Meu Pessoal) - Leader's Team Management

#### Web Paths:
```
/meu-pessoal/avisos                - Team warnings
/meu-pessoal/avisos/:sectorId      - Warnings by sector
/meu-pessoal/avisos/:sectorId/detalhes/:id

/meu-pessoal/emprestimos           - Team loans
/meu-pessoal/emprestimos/:sectorId
/meu-pessoal/emprestimos/:sectorId/detalhes/:id

/meu-pessoal/ferias                - Team vacations
/meu-pessoal/ferias/:sectorId
/meu-pessoal/ferias/:sectorId/detalhes/:id
```

---

### 8. SERVER (Servidor) - Admin Only

#### Web Paths:
```
/servidor/backup                   - System backup
/servidor/sincronizacao-bd         - Database sync (staging only)
/servidor/implantacoes             - Deployments
/servidor/implantacoes/cadastrar
/servidor/implantacoes/detalhes/:id

/servidor/logs                     - System logs
/servidor/metricas                 - System metrics
/servidor/pastas-compartilhadas    - Shared folders
/servidor/servicos                 - System services
/servidor/usuarios                 - System users
/servidor/usuarios/cadastrar       - Create system user
/servidor/rate-limiting            - Rate limiting

/servidor/registros-de-alteracoes  - Change logs
/servidor/registros-de-alteracoes/detalhes/:id
```

---

### 9. INTEGRATIONS (Integrações)

#### Web Paths:
```
/integracoes/secullum              - Secullum root
/integracoes/secullum/calculos     - Time calculations
/integracoes/secullum/registros-ponto - Time entries
/integracoes/secullum/registros-ponto/detalhes/:id
/integracoes/secullum/status-sincronizacao - Sync status
```

---

### 10. STATISTICS (Estatísticas) - Admin Only

#### Web Paths:
```
/estatisticas                      - Root
/estatisticas/administracao        - Administration stats
/estatisticas/estoque              - Inventory stats
/estatisticas/estoque/consumo      - Consumption analysis
/estatisticas/estoque/movimentacao - Movement analysis
/estatisticas/estoque/tendencias   - Trends
/estatisticas/estoque/top-itens    - Top items

/estatisticas/producao             - Production stats
/estatisticas/recursos-humanos     - HR stats
```

---

### 11. OTHER ROUTES

#### Web Paths:
```
/                                  - Home/Dashboard
/perfil                            - User profile
/favoritos                         - Favorites
/financeiro/clientes               - Finance customers
/manutencao                        - Standalone maintenance
/catalogo                          - Basic catalog
```

---

## PRIVILEGE-BASED VISIBILITY

### Privilege Enum:
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

### Menu Item Visibility Examples:

```typescript
{
  id: "estoque",
  title: "Estoque",
  path: "/estoque",
  requiredPrivilege: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]
  // Only visible to WAREHOUSE or ADMIN users
}

{
  id: "cronograma-direct",
  title: "Cronograma",
  path: "/producao/cronograma",
  requiredPrivilege: [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.LOGISTIC]
  // Top-level direct access for these three privilege types
}

{
  id: "recuros-humanos",
  title: "Recursos Humanos",
  path: "/recursos-humanos",
  requiredPrivilege: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.HUMAN_RESOURCES]
  // Only ADMIN and HR users see this module
}
```

---

## KEY TAKEAWAYS FOR MOBILE

1. **Path naming is consistently Portuguese** - Don't change to English
2. **Action pattern is consistent**: list → cadastrar → detalhes/:id → editar/:id
3. **Some modules nest deeply** (estoque/epi/agendamentos/detalhes/:id)
4. **Privilege system is rich** with 9 different privilege types
5. **Some items appear at top-level** based on privilege (special flattening for specialists)
6. **Batch operations are important** (editar-em-lote)
7. **Schedules and deliveries are nested** under main entities
8. **Admin-only modules** should not appear in navigation for non-admins

