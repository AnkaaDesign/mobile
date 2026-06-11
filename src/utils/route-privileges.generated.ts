/* eslint-disable */
// HAND-SEEDED for v1 — `scripts/generate-route-privileges.ts` will regenerate
// this file from the on-disk (tabs) tree post-Phase-3, once area agents have
// finished consolidating route files. Until then, treat as the canonical
// generated baseline; hand-tuned exceptions live in route-privileges.overrides.ts.
//
// Lookup order (in route-privileges.ts):
//   final = { ...GENERATED_ROUTE_PRIVILEGES, ...ROUTE_PRIVILEGE_OVERRIDES }
//
// Heuristic mapping (top-level directory → default privilege):
//   administracao → ADMIN
//   estoque       → WAREHOUSE
//   producao      → PRODUCTION
//   pintura       → WAREHOUSE
//   recursos-humanos → HUMAN_RESOURCES
//   pessoal | meu-pessoal → BASIC
//   financeiro    → FINANCIAL
//   servidor      → ADMIN
//   manutencao    → MAINTENANCE
//   integracoes   → ADMIN
//   inicio | favorites | catalogo | perfil | configuracoes | minha-equipe | notifications → BASIC

import { SECTOR_PRIVILEGES } from "@/constants";

export type GeneratedPrivilege = keyof typeof SECTOR_PRIVILEGES;

export const GENERATED_ROUTE_PRIVILEGES: Record<string, GeneratedPrivilege> = {
  // Auth (public)
  "/(autenticacao)/entrar": "BASIC",
  "/(autenticacao)/registrar": "BASIC",
  "/(autenticacao)/recuperar-senha": "BASIC",
  "/(autenticacao)/verificar-codigo": "BASIC",
  "/(autenticacao)/redefinir-senha/[token]": "BASIC",

  // Top-level / home / personal-shaped
  "/(tabs)/inicio": "BASIC",
  "/(tabs)/favoritos": "BASIC",
  "/(tabs)/perfil": "BASIC",
  "/(tabs)/configuracoes": "BASIC",
  "/(tabs)/notifications": "BASIC",
  "/(tabs)/catalogo": "BASIC",
  "/(tabs)/minha-equipe": "BASIC",

  // Pessoal — user-scoped, BASIC default
  "/(tabs)/pessoal": "BASIC",
  "/(tabs)/pessoal/meus-feriados": "BASIC",
  "/(tabs)/pessoal/meus-emprestimos": "BASIC",
  "/(tabs)/pessoal/meus-emprestimos/detalhes/[id]": "BASIC",
  "/(tabs)/pessoal/meus-epis": "BASIC",
  "/(tabs)/pessoal/meus-epis/detalhes/[id]": "BASIC",
  "/(tabs)/pessoal/minhas-movimentacoes": "BASIC",
  "/(tabs)/pessoal/minhas-movimentacoes/detalhes/[id]": "BASIC",
  "/(tabs)/pessoal/meu-bonus": "BASIC",
  "/(tabs)/pessoal/meu-bonus/detalhes/[id]": "BASIC",
  "/(tabs)/pessoal/meu-bonus/historico": "BASIC",
  "/(tabs)/pessoal/meu-bonus/simulacao": "BASIC",
  "/(tabs)/pessoal/minhas-mensagens": "BASIC",
  "/(tabs)/pessoal/minhas-advertencias": "BASIC",
  "/(tabs)/pessoal/meus-pontos": "BASIC",
  "/(tabs)/pessoal/preferencias": "BASIC",

  // Meu Pessoal — leader-only (gated by isTeamLeader at runtime, default BASIC)
  "/(tabs)/meu-pessoal": "BASIC",
  "/(tabs)/meu-pessoal/emprestimos": "BASIC",
  "/(tabs)/meu-pessoal/advertencias": "BASIC",

  // Administração
  "/(tabs)/administracao": "ADMIN",
  "/(tabs)/administracao/clientes": "ADMIN",
  "/(tabs)/administracao/clientes/listar": "ADMIN",
  "/(tabs)/administracao/clientes/cadastrar": "ADMIN",
  "/(tabs)/administracao/clientes/detalhes/[id]": "ADMIN",
  "/(tabs)/administracao/clientes/editar/[id]": "ADMIN",
  "/(tabs)/administracao/colaboradores": "ADMIN",
  "/(tabs)/administracao/colaboradores/listar": "ADMIN",
  "/(tabs)/administracao/colaboradores/cadastrar": "ADMIN",
  "/(tabs)/administracao/colaboradores/detalhes/[id]": "ADMIN",
  "/(tabs)/administracao/colaboradores/editar/[id]": "ADMIN",
  "/(tabs)/administracao/setores": "ADMIN",
  "/(tabs)/administracao/notificacoes": "ADMIN",
  "/(tabs)/administracao/registros-de-alteracoes": "ADMIN",
  "/(tabs)/administracao/arquivos": "ADMIN",
  "/(tabs)/administracao/mensagens": "ADMIN",
  "/(tabs)/administracao/usuarios": "ADMIN",
  "/(tabs)/administracao/responsaveis": "ADMIN",
  "/(tabs)/administracao/monitoramento": "ADMIN",

  // Estoque (Inventory)
  "/(tabs)/estoque": "WAREHOUSE",
  "/(tabs)/estoque/produtos": "WAREHOUSE",
  "/(tabs)/estoque/produtos/listar": "WAREHOUSE",
  "/(tabs)/estoque/produtos/cadastrar": "WAREHOUSE",
  "/(tabs)/estoque/produtos/detalhes/[id]": "WAREHOUSE",
  "/(tabs)/estoque/produtos/editar/[id]": "WAREHOUSE",
  "/(tabs)/estoque/produtos/categorias": "WAREHOUSE",
  "/(tabs)/estoque/produtos/marcas": "WAREHOUSE",
  "/(tabs)/estoque/fornecedores": "WAREHOUSE",
  "/(tabs)/estoque/pedidos": "WAREHOUSE",
  "/(tabs)/estoque/manutencao": "WAREHOUSE",
  "/(tabs)/estoque/epi": "WAREHOUSE",
  "/(tabs)/estoque/emprestimos": "WAREHOUSE",
  "/(tabs)/estoque/operacoes-externas": "WAREHOUSE",
  "/(tabs)/estoque/movimentacoes": "WAREHOUSE",
  "/(tabs)/estoque/balanco": "WAREHOUSE",

  // Produção
  "/(tabs)/producao": "PRODUCTION",
  "/(tabs)/producao/cronograma": "PRODUCTION",
  "/(tabs)/producao/historico": "PRODUCTION",
  "/(tabs)/producao/agenda": "PRODUCTION",
  "/(tabs)/producao/aerografia": "PRODUCTION",
  "/(tabs)/producao/recorte": "PRODUCTION",
  "/(tabs)/producao/garagens": "PRODUCTION",
  "/(tabs)/producao/observacoes": "PRODUCTION",
  "/(tabs)/producao/caminhoes": "PRODUCTION",
  "/(tabs)/producao/ordens-de-servico": "PRODUCTION",
  "/(tabs)/producao/servicos": "PRODUCTION",
  "/(tabs)/producao/tintas": "PRODUCTION",

  // Pintura
  "/(tabs)/pintura": "WAREHOUSE",
  "/(tabs)/pintura/catalogo": "WAREHOUSE",
  "/(tabs)/pintura/catalogo-basico": "BASIC",
  "/(tabs)/pintura/formulas": "WAREHOUSE",
  "/(tabs)/pintura/marcas-de-tinta": "WAREHOUSE",
  "/(tabs)/pintura/tipos-de-tinta": "WAREHOUSE",
  "/(tabs)/pintura/producoes": "WAREHOUSE",
  "/(tabs)/pintura/componentes": "WAREHOUSE",
  "/(tabs)/pintura/formulacoes": "WAREHOUSE",
  "/(tabs)/pintura/formulas/cadastrar": "WAREHOUSE",
  "/(tabs)/pintura/formulas/editar/[id]": "WAREHOUSE",

  // Recursos Humanos
  "/(tabs)/recursos-humanos": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/funcionarios": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/funcionarios/listar": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/funcionarios/detalhes/[id]": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/funcionarios/editar/[id]": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/colaboradores": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/epi": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/feriados": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/advertencias": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/cargos": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/setores": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/folha-de-pagamento": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/niveis-de-desempenho": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/bonus": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/calculos": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/controle-ponto": "HUMAN_RESOURCES",
  "/(tabs)/recursos-humanos/requisicoes-ponto": "HUMAN_RESOURCES",

  // Financeiro
  "/(tabs)/financeiro": "FINANCIAL",
  "/(tabs)/financeiro/faturamento": "FINANCIAL",
  "/(tabs)/financeiro/orcamento": "FINANCIAL",
  "/(tabs)/financeiro/notas-fiscais": "FINANCIAL",
  "/(tabs)/financeiro/clientes": "FINANCIAL",

  // Servidor
  "/(tabs)/servidor": "ADMIN",
  "/(tabs)/servidor/backups": "ADMIN",
  "/(tabs)/servidor/registros-de-alteracoes": "ADMIN",
  "/(tabs)/servidor/implantacoes": "ADMIN",
  "/(tabs)/servidor/logs": "ADMIN",
  "/(tabs)/servidor/database-sync": "ADMIN",
  "/(tabs)/servidor/rate-limiting": "ADMIN",
  "/(tabs)/servidor/usuarios": "ADMIN",
  "/(tabs)/servidor/services": "ADMIN",
  "/(tabs)/servidor/file-manager": "ADMIN",

  // Integrações
  "/(tabs)/integracoes": "ADMIN",
  "/(tabs)/integracoes/secullum": "ADMIN",
};
