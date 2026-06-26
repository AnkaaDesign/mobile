/**
 * Hand-tuned overrides on top of `route-privileges.generated.ts`.
 *
 * Use this file for routes whose privilege requirements are not derivable
 * from the directory structure alone. Examples:
 *   - "list = HR but create = ADMIN" (cargos/setores/funcionarios)
 *   - cross-domain reads (PLOTTING + COMMERCIAL on cronograma)
 *   - resource-scoped routes (file-manager allowing COMMERCIAL alongside ADMIN)
 *
 * Run-time merge in `route-privileges.ts`:
 *   final = { ...GENERATED_ROUTE_PRIVILEGES, ...ROUTE_PRIVILEGE_OVERRIDES }
 *
 * Keep this list small and audited. Anything that "feels generic" is a
 * sign the heuristic in scripts/generate-route-privileges.ts should grow
 * a rule rather than this map.
 */
import { SECTOR_PRIVILEGES } from "@/constants";

type Priv = keyof typeof SECTOR_PRIVILEGES | (keyof typeof SECTOR_PRIVILEGES)[];

export const ROUTE_PRIVILEGE_OVERRIDES: Record<string, Priv> = {
  // ---- Administração: customer pages opened to all ops & finance roles ----
  "/(tabs)/administracao/clientes": ["ADMIN", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "COMMERCIAL"],
  "/(tabs)/administracao/clientes/listar": ["ADMIN", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "COMMERCIAL"],
  "/(tabs)/administracao/clientes/cadastrar": ["ADMIN", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "COMMERCIAL"],
  "/(tabs)/administracao/clientes/detalhes/[id]": ["ADMIN", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "COMMERCIAL"],
  "/(tabs)/administracao/clientes/editar/[id]": ["ADMIN", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "COMMERCIAL"],
  "/(tabs)/administracao/clientes/editar-em-lote": ["ADMIN", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "COMMERCIAL"],

  // ---- Administração: collaborators are HR-readable ----
  "/(tabs)/administracao/colaboradores": "HUMAN_RESOURCES",
  "/(tabs)/administracao/colaboradores/listar": "HUMAN_RESOURCES",
  "/(tabs)/administracao/colaboradores/cadastrar": "ADMIN",
  "/(tabs)/administracao/colaboradores/detalhes/[id]": "HUMAN_RESOURCES",
  "/(tabs)/administracao/colaboradores/editar/[id]": "HUMAN_RESOURCES",

  // ---- Estoque manutenção: also accessible to MAINTENANCE ----
  "/(tabs)/estoque/manutencao": ["WAREHOUSE", "MAINTENANCE", "ADMIN"],
  "/(tabs)/estoque/manutencao/listar": ["WAREHOUSE", "MAINTENANCE", "ADMIN"],
  "/(tabs)/estoque/manutencao/cadastrar": ["WAREHOUSE", "MAINTENANCE", "ADMIN"],
  "/(tabs)/estoque/manutencao/detalhes/[id]": ["WAREHOUSE", "MAINTENANCE", "ADMIN"],
  "/(tabs)/estoque/manutencao/editar/[id]": ["WAREHOUSE", "MAINTENANCE", "ADMIN"],

  // ---- Produção: cronograma read open to PLOTTING + COMMERCIAL + DESIGNER + FINANCIAL + LOGISTIC + PRODUCTION_MANAGER + WAREHOUSE
  "/(tabs)/producao": ["PRODUCTION", "WAREHOUSE", "DESIGNER", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "PLOTTING", "COMMERCIAL"],
  "/(tabs)/producao/cronograma": ["PRODUCTION", "WAREHOUSE", "DESIGNER", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "PLOTTING", "COMMERCIAL"],
  "/(tabs)/producao/cronograma/listar": ["PRODUCTION", "WAREHOUSE", "DESIGNER", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "PLOTTING", "COMMERCIAL"],
  "/(tabs)/producao/cronograma/detalhes/[id]": ["PRODUCTION", "WAREHOUSE", "DESIGNER", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "PLOTTING", "COMMERCIAL", "ADMIN"],
  "/(tabs)/producao/cronograma/editar/[id]": ["PRODUCTION", "WAREHOUSE", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "COMMERCIAL", "ADMIN"],
  "/(tabs)/producao/cronograma/operacoes-em-lote": ["PRODUCTION", "WAREHOUSE"],
  "/(tabs)/producao/historico": ["PRODUCTION", "WAREHOUSE", "DESIGNER", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "PLOTTING", "COMMERCIAL"],
  "/(tabs)/producao/historico/detalhes/[id]": ["PRODUCTION", "WAREHOUSE", "DESIGNER", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "PLOTTING", "COMMERCIAL", "ADMIN"],

  // ---- Produção agenda: ADMIN-only writes, mixed reads ----
  "/(tabs)/producao/agenda": ["DESIGNER", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "COMMERCIAL", "ADMIN"],
  "/(tabs)/producao/agenda/cadastrar": ["ADMIN"],
  "/(tabs)/producao/agenda/detalhes/[id]": ["DESIGNER", "FINANCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "COMMERCIAL", "ADMIN"],

  // ---- Aerografia: COMMERCIAL reads, PRODUCTION/WAREHOUSE writes ----
  "/(tabs)/producao/aerografia": ["PRODUCTION", "WAREHOUSE", "FINANCIAL", "COMMERCIAL"],
  "/(tabs)/producao/aerografia/listar": ["PRODUCTION", "WAREHOUSE", "FINANCIAL", "COMMERCIAL"],
  "/(tabs)/producao/aerografia/cadastrar": ["PRODUCTION", "WAREHOUSE"],
  "/(tabs)/producao/aerografia/detalhes/[id]": ["PRODUCTION", "WAREHOUSE", "FINANCIAL", "COMMERCIAL"],
  "/(tabs)/producao/aerografia/editar/[id]": ["PRODUCTION", "WAREHOUSE"],

  // ---- Recorte: PLOTTING/DESIGNER also have access ----
  "/(tabs)/producao/recorte": ["PRODUCTION", "PLOTTING", "DESIGNER", "ADMIN"],
  "/(tabs)/producao/recorte/listar": ["PRODUCTION", "PLOTTING", "DESIGNER", "ADMIN"],
  "/(tabs)/producao/recorte/cadastrar": ["PRODUCTION", "PLOTTING"],
  "/(tabs)/producao/recorte/detalhes/[id]": ["PRODUCTION", "PLOTTING", "DESIGNER", "ADMIN"],

  // ---- Garagens: COMMERCIAL also has access ----
  "/(tabs)/producao/garagens": ["PRODUCTION", "LOGISTIC", "PRODUCTION_MANAGER", "COMMERCIAL", "ADMIN"],
  "/(tabs)/producao/garagens/listar": ["PRODUCTION", "LOGISTIC", "PRODUCTION_MANAGER", "COMMERCIAL", "ADMIN"],
  "/(tabs)/producao/garagens/cadastrar": ["PRODUCTION", "ADMIN"],
  "/(tabs)/producao/garagens/detalhes/[id]": ["PRODUCTION", "LOGISTIC", "PRODUCTION_MANAGER", "COMMERCIAL", "ADMIN"],
  "/(tabs)/producao/garagens/editar/[id]": ["PRODUCTION", "ADMIN"],

  // ---- Observações: cross-functional ----
  "/(tabs)/producao/observacoes": ["PRODUCTION", "WAREHOUSE", "FINANCIAL", "COMMERCIAL", "PRODUCTION_MANAGER", "ADMIN"],

  // ---- Pintura catálogo: cross-functional reads, ADMIN/WAREHOUSE writes ----
  "/(tabs)/pintura": ["WAREHOUSE", "DESIGNER", "COMMERCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "ADMIN"],
  "/(tabs)/pintura/catalogo": ["WAREHOUSE", "DESIGNER", "COMMERCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "ADMIN"],
  "/(tabs)/pintura/catalogo/listar": ["WAREHOUSE", "DESIGNER", "COMMERCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "ADMIN"],
  "/(tabs)/pintura/catalogo/cadastrar": ["WAREHOUSE", "ADMIN"],
  "/(tabs)/pintura/catalogo/detalhes/[id]": ["WAREHOUSE", "DESIGNER", "COMMERCIAL", "LOGISTIC", "PRODUCTION_MANAGER", "ADMIN"],
  "/(tabs)/pintura/catalogo/editar/[id]": ["WAREHOUSE", "ADMIN"],
  "/(tabs)/pintura/formulas": ["WAREHOUSE", "DESIGNER", "ADMIN"],
  "/(tabs)/pintura/formulas/cadastrar": ["WAREHOUSE", "ADMIN"],
  "/(tabs)/pintura/formulas/editar/[id]": ["WAREHOUSE", "ADMIN"],
  "/(tabs)/pintura/marcas-de-tinta": ["WAREHOUSE", "DESIGNER", "ADMIN"],
  "/(tabs)/pintura/marcas-de-tinta/cadastrar": ["WAREHOUSE", "ADMIN"],
  "/(tabs)/pintura/marcas-de-tinta/editar/[id]": ["WAREHOUSE", "ADMIN"],
  "/(tabs)/pintura/tipos-de-tinta": ["WAREHOUSE", "DESIGNER", "ADMIN"],
  "/(tabs)/pintura/tipos-de-tinta/cadastrar": ["WAREHOUSE", "ADMIN"],
  "/(tabs)/pintura/tipos-de-tinta/editar/[id]": ["WAREHOUSE", "ADMIN"],
  "/(tabs)/pintura/producoes": ["PRODUCTION", "WAREHOUSE", "ADMIN"],

  // ---- HR special cases: list = HR, create = ADMIN ----
  "/(tabs)/departamento-pessoal/funcionarios/cadastrar": "ADMIN",
  "/(tabs)/departamento-pessoal/cargos/cadastrar": "ADMIN",
  "/(tabs)/departamento-pessoal/setores/cadastrar": "ADMIN",

  // ---- Financeiro: FINANCIAL + COMMERCIAL + ADMIN (+ ACCOUNTING where granted) ----
  "/(tabs)/financeiro": ["FINANCIAL", "COMMERCIAL", "ADMIN", "ACCOUNTING"],
  "/(tabs)/financeiro/faturamento": ["FINANCIAL", "COMMERCIAL", "ADMIN"],
  "/(tabs)/financeiro/orcamento": ["FINANCIAL", "COMMERCIAL", "ADMIN"],
  "/(tabs)/financeiro/orcamento/cadastrar": ["COMMERCIAL", "ADMIN"],
  "/(tabs)/financeiro/notas-fiscais": ["FINANCIAL", "COMMERCIAL", "ADMIN", "ACCOUNTING"],
  "/(tabs)/financeiro/clientes": ["FINANCIAL", "COMMERCIAL", "ADMIN"],

  // ---- ACCOUNTING (Contabilidade): departamento-pessoal reads over RH routes ----
  // Create special-cases above (funcionarios/cargos/setores cadastrar) stay ADMIN-only.
  "/(tabs)/departamento-pessoal": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/funcionarios": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/funcionarios/listar": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/funcionarios/detalhes/[id]": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/funcionarios/editar/[id]": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/colaboradores": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/epi": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/feriados": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/advertencias": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/cargos": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/folha-de-pagamento": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/niveis-de-desempenho": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/bonus": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/calculos": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/controle-ponto": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],
  "/(tabs)/departamento-pessoal/requisicoes-ponto": ["HUMAN_RESOURCES", "ADMIN", "ACCOUNTING"],

  // ---- Servidor: file-manager open to COMMERCIAL alongside ADMIN ----
  "/(tabs)/servidor/file-manager": ["ADMIN", "COMMERCIAL"],

  // ---- Estoque operações externas: ADMIN-only (API restricts every endpoint to ADMIN; matches WEB) ----
  "/(tabs)/estoque/operacoes-externas": "ADMIN",
  "/(tabs)/estoque/operacoes-externas/listar": "ADMIN",
  "/(tabs)/estoque/operacoes-externas/cadastrar": "ADMIN",
  "/(tabs)/estoque/operacoes-externas/detalhes/[id]": "ADMIN",
  "/(tabs)/estoque/operacoes-externas/editar/[id]": "ADMIN",
};
