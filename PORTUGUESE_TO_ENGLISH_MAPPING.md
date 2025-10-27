# Portuguese to English Path Mapping Reference

Complete mapping of all Portuguese paths in navigation.ts to their English equivalents in actual file structure.

---

## MAIN MODULES (Primary Navigation)

| Portuguese | English | Type | Status |
|---|---|---|---|
| administracao | administration | Module | BROKEN |
| estoque | inventory | Module | BROKEN |
| financeiro | financial | Module | BROKEN |
| integracoes | integrations | Module | BROKEN |
| manutencao | maintenance | Module | BROKEN |
| meu-pessoal | my-team | Module | BROKEN |
| pessoal | personal | Module | BROKEN |
| pintura | painting | Module | BROKEN |
| producao | production | Module | BROKEN |
| recursos-humanos | human-resources | Module | BROKEN |
| servidor | server | Module | BROKEN |

---

## ADMINISTRATION MODULE PATHS

| Portuguese | English |
|---|---|
| /administracao | /administration |
| /administracao/clientes | /administration/customers |
| /administracao/clientes/cadastrar | /administration/customers/create |
| /administracao/clientes/editar/:id | /administration/customers/edit/[id] |
| /administracao/clientes/detalhes/:id | /administration/customers/details/[id] |
| /administracao/clientes/listar | /administration/customers/list |
| /administracao/colaboradores | /administration/collaborators |
| /administracao/colaboradores/cadastrar | /administration/collaborators/create |
| /administracao/colaboradores/editar/:id | /administration/collaborators/edit/[id] |
| /administracao/colaboradores/detalhes/:id | /administration/collaborators/details/[id] |
| /administracao/colaboradores/listar | /administration/collaborators/list |
| /administracao/usuarios | /administration/users |
| /administracao/usuarios/listar | /administration/users/list |
| /administracao/notificacoes | /administration/notifications |
| /administracao/notificacoes/cadastrar | /administration/notifications/create |
| /administracao/notificacoes/cadastrar/enviar | /administration/notifications/create/send |
| /administracao/notificacoes/editar/:id | /administration/notifications/edit/[id] |
| /administracao/notificacoes/detalhes/:id | /administration/notifications/details/[id] |
| /administracao/notificacoes/listar | /administration/notifications/list |
| /administracao/setores | /administration/sectors |
| /administracao/setores/cadastrar | /administration/sectors/create |
| /administracao/setores/editar/:id | /administration/sectors/edit/[id] |
| /administracao/setores/detalhes/:id | /administration/sectors/details/[id] |
| /administracao/setores/listar | /administration/sectors/list |

---

## INVENTORY MODULE PATHS

| Portuguese | English |
|---|---|
| /estoque | /inventory |
| /estoque/emprestimos | /inventory/borrows |
| /estoque/emprestimos/cadastrar | /inventory/borrows/create |
| /estoque/emprestimos/editar/:id | /inventory/borrows/edit/[id] |
| /estoque/emprestimos/detalhes/:id | /inventory/borrows/details/[id] |
| /estoque/emprestimos/editar-lote | /inventory/borrows/batch-edit |
| /estoque/emprestimos/listar | /inventory/borrows/list |
| /estoque/epi | /inventory/ppe |
| /estoque/epi/cadastrar | /inventory/ppe/create |
| /estoque/epi/editar/:id | /inventory/ppe/edit/[id] |
| /estoque/epi/detalhes/:id | /inventory/ppe/details/[id] |
| /estoque/epi/listar | /inventory/ppe/list |
| /estoque/epi/entregas | /inventory/ppe/deliveries |
| /estoque/epi/entregas/cadastrar | /inventory/ppe/deliveries/create |
| /estoque/epi/entregas/editar/:id | /inventory/ppe/deliveries/edit/[id] |
| /estoque/epi/entregas/detalhes/:id | /inventory/ppe/deliveries/details/[id] |
| /estoque/epi/entregas/listar | /inventory/ppe/deliveries/list |
| /estoque/epi/agendamentos | /inventory/ppe/schedules |
| /estoque/epi/agendamentos/cadastrar | /inventory/ppe/schedules/create |
| /estoque/epi/agendamentos/editar/:id | /inventory/ppe/schedules/edit/[id] |
| /estoque/epi/agendamentos/detalhes/:id | /inventory/ppe/schedules/details/[id] |
| /estoque/epi/agendamentos/listar | /inventory/ppe/schedules/list |
| /estoque/fornecedores | /inventory/suppliers |
| /estoque/fornecedores/cadastrar | /inventory/suppliers/create |
| /estoque/fornecedores/editar/:id | /inventory/suppliers/edit/[id] |
| /estoque/fornecedores/detalhes/:id | /inventory/suppliers/details/[id] |
| /estoque/fornecedores/listar | /inventory/suppliers/list |
| /estoque/manutencao | /inventory/maintenance |
| /estoque/manutencao/cadastrar | /inventory/maintenance/create |
| /estoque/manutencao/editar/:id | /inventory/maintenance/edit/[id] |
| /estoque/manutencao/detalhes/:id | /inventory/maintenance/details/[id] |
| /estoque/manutencao/listar | /inventory/maintenance/list |
| /estoque/manutencao/agendamentos | /inventory/maintenance/schedules |
| /estoque/manutencao/agendamentos/cadastrar | /inventory/maintenance/schedules/create |
| /estoque/manutencao/agendamentos/editar/:id | /inventory/maintenance/schedules/edit/[id] |
| /estoque/manutencao/agendamentos/detalhes/:id | /inventory/maintenance/schedules/details/[id] |
| /estoque/manutencao/agendamentos/listar | /inventory/maintenance/schedules/list |
| /estoque/movimentacoes | /inventory/movements |
| /estoque/movimentacoes/cadastrar | /inventory/movements/create |
| /estoque/movimentacoes/editar/:id | /inventory/movements/edit/[id] |
| /estoque/movimentacoes/detalhes/:id | /inventory/movements/details/[id] |
| /estoque/movimentacoes/editar-lote | /inventory/movements/batch-edit |
| /estoque/movimentacoes/listar | /inventory/movements/list |
| /estoque/pedidos | /inventory/orders |
| /estoque/pedidos/cadastrar | /inventory/orders/create |
| /estoque/pedidos/editar/:id | /inventory/orders/edit/[id] |
| /estoque/pedidos/detalhes/:id | /inventory/orders/details/[id] |
| /estoque/pedidos/listar | /inventory/orders/list |
| /estoque/pedidos/agendamentos | /inventory/orders/schedules |
| /estoque/pedidos/agendamentos/cadastrar | /inventory/orders/schedules/create |
| /estoque/pedidos/agendamentos/editar/:id | /inventory/orders/schedules/edit/[id] |
| /estoque/pedidos/agendamentos/detalhes/:id | /inventory/orders/schedules/details/[id] |
| /estoque/pedidos/agendamentos/listar | /inventory/orders/schedules/list |
| /estoque/pedidos/automaticos | /inventory/orders/automatic |
| /estoque/pedidos/automaticos/configurar | /inventory/orders/automatic/configure |
| /estoque/pedidos/automaticos/listar | /inventory/orders/automatic/list |
| /estoque/produtos | /inventory/products |
| /estoque/produtos/cadastrar | /inventory/products/create |
| /estoque/produtos/editar/:id | /inventory/products/edit/[id] |
| /estoque/produtos/detalhes/:id | /inventory/products/details/[id] |
| /estoque/produtos/editar-em-lote | /inventory/products/batch-edit |
| /estoque/produtos/listar | /inventory/products/list |
| /estoque/produtos/categorias | /inventory/products/categories |
| /estoque/produtos/categorias/cadastrar | /inventory/products/categories/create |
| /estoque/produtos/categorias/editar/:id | /inventory/products/categories/edit/[id] |
| /estoque/produtos/categorias/detalhes/:id | /inventory/products/categories/details/[id] |
| /estoque/produtos/categorias/editar-em-lote | /inventory/products/categories/batch-edit |
| /estoque/produtos/categorias/listar | /inventory/products/categories/list |
| /estoque/produtos/marcas | /inventory/products/brands |
| /estoque/produtos/marcas/cadastrar | /inventory/products/brands/create |
| /estoque/produtos/marcas/editar/:id | /inventory/products/brands/edit/[id] |
| /estoque/produtos/marcas/detalhes/:id | /inventory/products/brands/details/[id] |
| /estoque/produtos/marcas/editar-em-lote | /inventory/products/brands/batch-edit |
| /estoque/produtos/marcas/listar | /inventory/products/brands/list |
| /estoque/retiradas-externas | /inventory/external-withdrawals |
| /estoque/retiradas-externas/cadastrar | /inventory/external-withdrawals/create |
| /estoque/retiradas-externas/editar/:id | /inventory/external-withdrawals/edit/[id] |
| /estoque/retiradas-externas/detalhes/:id | /inventory/external-withdrawals/details/[id] |
| /estoque/retiradas-externas/listar | /inventory/external-withdrawals/list |

---

## PAINTING MODULE PATHS

| Portuguese | English |
|---|---|
| /pintura | /painting |
| /pintura/catalogo | /painting/catalog |
| /pintura/catalogo/cadastrar | /painting/catalog/create |
| /pintura/catalogo/editar/:id | /painting/catalog/edit/[id] |
| /pintura/catalogo/detalhes/:id | /painting/catalog/details/[id] |
| /pintura/catalogo/listar | /painting/catalog/list |
| /pintura/catalogo/detalhes/:paintId/formulas | /painting/formulas/[formulaId] |
| /pintura/catalogo/detalhes/:paintId/formulas/detalhes/:formulaId | /painting/formulas/details/[id] |
| /pintura/marcas-de-tinta | /painting/paint-brands |
| /pintura/marcas-de-tinta/cadastrar | /painting/paint-brands/create |
| /pintura/marcas-de-tinta/editar/:id | /painting/paint-brands/edit/[id] |
| /pintura/marcas-de-tinta/listar | /painting/paint-brands/list |
| /pintura/tipos-de-tinta | /painting/paint-types |
| /pintura/tipos-de-tinta/cadastrar | /painting/paint-types/create |
| /pintura/tipos-de-tinta/editar/:id | /painting/paint-types/edit/[id] |
| /pintura/tipos-de-tinta/listar | /painting/paint-types/list |
| /pintura/producoes | /painting/productions |
| /pintura/producoes/detalhes/:id | /painting/productions/details/[id] |
| /pintura/producoes/listar | /painting/productions/list |

---

## PRODUCTION MODULE PATHS

| Portuguese | English |
|---|---|
| /producao | /production |
| /producao/aerografia | /production/airbrushing |
| /producao/aerografia/cadastrar | /production/airbrushing/create |
| /producao/aerografia/editar/:id | /production/airbrushing/edit/[id] |
| /producao/aerografia/detalhes/:id | /production/airbrushing/details/[id] |
| /producao/aerografia/listar | /production/airbrushing/list |
| /producao/cronograma | /production/schedule |
| /producao/cronograma/cadastrar | /production/schedule/create |
| /producao/cronograma/editar/:id | /production/schedule/edit/[id] |
| /producao/cronograma/detalhes/:id | /production/schedule/details/[id] |
| /producao/cronograma/listar | /production/schedule/list |
| /producao/em-espera | /production/on-hold |
| /producao/garagens | /production/garages |
| /producao/garagens/cadastrar | /production/garages/create |
| /producao/garagens/editar/:id | /production/garages/edit/[id] |
| /producao/garagens/detalhes/:id | /production/garages/details/[id] |
| /producao/garagens/listar | /production/garages/list |
| /producao/historico | /production/history |
| /producao/observacoes | /production/observations |
| /producao/observacoes/cadastrar | /production/observations/create |
| /producao/observacoes/editar/:id | /production/observations/edit/[id] |
| /producao/observacoes/detalhes/:id | /production/observations/details/[id] |
| /producao/observacoes/listar | /production/observations/list |
| /producao/recorte | /production/cutting |
| /producao/recorte/listar | /production/cutting/list |
| /producao/recorte/plano-de-corte | /production/cutting/cutting-plan |
| /producao/recorte/plano-de-corte/cadastrar | /production/cutting/cutting-plan/create |
| /producao/recorte/plano-de-corte/editar/:id | /production/cutting/cutting-plan/edit/[id] |
| /producao/recorte/plano-de-corte/detalhes/:id | /production/cutting/cutting-plan/details/[id] |
| /producao/recorte/plano-de-corte/listar | /production/cutting/cutting-plan/list |
| /producao/recorte/requisicao-de-recorte | /production/cutting/cutting-request |
| /producao/recorte/requisicao-de-recorte/cadastrar | /production/cutting/cutting-request/create |
| /producao/recorte/requisicao-de-recorte/editar/:id | /production/cutting/cutting-request/edit/[id] |
| /producao/recorte/requisicao-de-recorte/detalhes/:id | /production/cutting/cutting-request/details/[id] |
| /producao/recorte/requisicao-de-recorte/listar | /production/cutting/cutting-request/list |

---

## HUMAN-RESOURCES MODULE PATHS

| Portuguese | English |
|---|---|
| /recursos-humanos | /human-resources |
| /recursos-humanos/avisos | /human-resources/warnings |
| /recursos-humanos/avisos/cadastrar | /human-resources/warnings/create |
| /recursos-humanos/avisos/editar/:id | /human-resources/warnings/edit/[id] |
| /recursos-humanos/avisos/detalhes/:id | /human-resources/warnings/details/[id] |
| /recursos-humanos/avisos/listar | /human-resources/warnings/list |
| /recursos-humanos/calculos | /human-resources/calculations |
| /recursos-humanos/cargos | /human-resources/positions |
| /recursos-humanos/cargos/cadastrar | /human-resources/positions/create |
| /recursos-humanos/cargos/editar/:id | /human-resources/positions/edit/[id] |
| /recursos-humanos/cargos/detalhes/:id | /human-resources/positions/details/[id] |
| /recursos-humanos/cargos/listar | /human-resources/positions/list |
| /recursos-humanos/controle-ponto | /human-resources/time-clock |
| /recursos-humanos/epi | /human-resources/ppe |
| /recursos-humanos/epi/cadastrar | /human-resources/ppe/create |
| /recursos-humanos/epi/editar/:id | /human-resources/ppe/edit/[id] |
| /recursos-humanos/epi/detalhes/:id | /human-resources/ppe/details/[id] |
| /recursos-humanos/epi/listar | /human-resources/ppe/list |
| /recursos-humanos/epi/entregas | /human-resources/ppe/deliveries |
| /recursos-humanos/epi/entregas/cadastrar | /human-resources/ppe/deliveries/create |
| /recursos-humanos/epi/entregas/editar/:id | /human-resources/ppe/deliveries/edit/[id] |
| /recursos-humanos/epi/entregas/detalhes/:id | /human-resources/ppe/deliveries/details/[id] |
| /recursos-humanos/epi/entregas/listar | /human-resources/ppe/deliveries/list |
| /recursos-humanos/epi/agendamentos | /human-resources/ppe/schedules |
| /recursos-humanos/epi/agendamentos/cadastrar | /human-resources/ppe/schedules/create |
| /recursos-humanos/epi/agendamentos/editar/:id | /human-resources/ppe/schedules/edit/[id] |
| /recursos-humanos/epi/agendamentos/detalhes/:id | /human-resources/ppe/schedules/details/[id] |
| /recursos-humanos/epi/agendamentos/listar | /human-resources/ppe/schedules/list |
| /recursos-humanos/epi/tamanhos | /human-resources/ppe/sizes |
| /recursos-humanos/epi/tamanhos/cadastrar | /human-resources/ppe/sizes/create |
| /recursos-humanos/epi/tamanhos/editar/:id | /human-resources/ppe/sizes/edit/[id] |
| /recursos-humanos/epi/tamanhos/listar | /human-resources/ppe/sizes/list |
| /recursos-humanos/feriados | /human-resources/holidays |
| /recursos-humanos/feriados/cadastrar | /human-resources/holidays/create |
| /recursos-humanos/feriados/editar/:id | /human-resources/holidays/edit/[id] |
| /recursos-humanos/feriados/listar | /human-resources/holidays/list |
| /recursos-humanos/ferias | /human-resources/vacations |
| /recursos-humanos/ferias/cadastrar | /human-resources/vacations/create |
| /recursos-humanos/ferias/editar/:id | /human-resources/vacations/edit/[id] |
| /recursos-humanos/ferias/detalhes/:id | /human-resources/vacations/details/[id] |
| /recursos-humanos/ferias/listar | /human-resources/vacations/list |
| /recursos-humanos/folha-de-pagamento | /human-resources/payroll |
| /recursos-humanos/niveis-desempenho | /human-resources/performance-levels |
| /recursos-humanos/requisicoes | /human-resources/requisitions |
| /recursos-humanos/simulacao-bonus | /human-resources/bonus-simulation |

---

## OTHER MODULES

### Server Module
| Portuguese | English |
|---|---|
| /servidor | /server |
| /servidor/backup | /server/backups |
| /servidor/logs | /server/logs |
| /servidor/metricas | /server/resources |
| /servidor/pastas-compartilhadas | /server/shared-folders |
| /servidor/servicos | /server/services |
| /servidor/usuarios | /server/system-users |
| /servidor/usuarios/cadastrar | /server/system-users/create |
| /servidor/implantacoes | /server/deployments |
| /servidor/registros-de-alteracoes/listar | /server/change-logs/list |

### Personal Module  
| Portuguese | English |
|---|---|
| /pessoal | /personal |
| /pessoal/meus-avisos | /personal/my-warnings |
| /pessoal/meus-emprestimos | /personal/my-borrows |
| /pessoal/meus-epis | /personal/my-ppes |
| /pessoal/meus-feriados | /personal/my-holidays |
| /pessoal/minhas-ferias | /personal/my-vacations |
| /pessoal/minhas-notificacoes | /personal/my-notifications |

### My Team Module
| Portuguese | English |
|---|---|
| /meu-pessoal | /my-team |
| /meu-pessoal/avisos | /my-team/warnings |
| /meu-pessoal/emprestimos | /my-team/borrows |
| /meu-pessoal/atividades | /my-team/activities |
| /meu-pessoal/entregas-epi | /my-team/ppe-deliveries |
| /meu-pessoal/usuarios | /my-team/users |
| /meu-pessoal/recortes | /my-team/cuttings |
| /meu-pessoal/calculos-ponto | /my-team/calculations |

### Integrations Module
| Portuguese | English |
|---|---|
| /integracoes | /integrations |
| /integracoes/secullum | /integrations/secullum |
| /integracoes/secullum/calculos | /integrations/secullum/calculations |
| /integracoes/secullum/registros-ponto | /integrations/secullum/time-entries |
| /integracoes/secullum/status-sincronizacao | /integrations/secullum/sync-status |

---

## NOTES

- All paths with `:id` in Portuguese should map to `[id]` in English (Expo/Next.js routing)
- Routes marked "BROKEN" are not functioning due to path mismatch
- Some files exist in the actual structure but are not referenced in navigation (orphaned)
- All CRUD operations (cadastrar, editar, listar, detalhes) must be updated systematically

