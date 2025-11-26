// Ultra-Optimized Navigation with Full Menu Structure and Privilege-Based Loading
// This version combines the privilege optimization with the original menu design

import { useMemo, Suspense, lazy } from "react";
import { Drawer } from "expo-router/drawer";
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { SECTOR_PRIVILEGES } from '@/constants/enums';
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Performance monitoring
const PERF_DEBUG = __DEV__;
const logPerformance = (action: string, startTime: number) => {
  if (PERF_DEBUG) {
    console.log(`[PERF] ${action}: ${Date.now() - startTime}ms`);
  }
};

// Lazy load drawer content with full menu
const DrawerContent = lazy(() => import('./OriginalMenuDrawer'));

// Complete route list with correct naming
const ALL_ROUTES = [
  // Core routes - Always loaded
  { name: "inicio", title: "Início" },
  { name: "pessoal/meu-perfil", title: "Meu Perfil" }, // Fixed: was meu-perfil
  { name: "configuracoes", title: "Configurações" },
  { name: "catalogo", title: "Catálogo" },

  // Administration
  { name: "administracao/index", title: "Administração" },
  { name: "administracao/clientes/index", title: "Clientes" },
  { name: "administracao/clientes/cadastrar", title: "Cadastrar Cliente" },
  { name: "administracao/clientes/editar-em-lote", title: "Editar Clientes em Lote" },
  { name: "administracao/clientes/listar", title: "Clientes" },
  { name: "administracao/clientes/detalhes/[id]", title: "Detalhes do Cliente" },
  { name: "administracao/clientes/editar/[id]", title: "Editar Cliente" },
  { name: "administracao/colaboradores/index", title: "Colaboradores" },
  { name: "administracao/colaboradores/cadastrar", title: "Cadastrar Colaborador" },
  { name: "administracao/colaboradores/editar-em-lote", title: "Editar Colaboradores em Lote" },
  { name: "administracao/colaboradores/listar", title: "Colaboradores" },
  { name: "administracao/colaboradores/detalhes/[id]", title: "Detalhes do Colaborador" },
  { name: "administracao/colaboradores/editar/[id]", title: "Editar Colaborador" },
  { name: "administracao/notificacoes/index", title: "Notificações" },
  { name: "administracao/notificacoes/cadastrar", title: "Cadastrar Notificação" },
  { name: "administracao/notificacoes/listar", title: "Notificações" },
  { name: "administracao/notificacoes/cadastrar/enviar", title: "Enviar Notificação" },
  { name: "administracao/notificacoes/detalhes/[id]", title: "Detalhes da Notificação" },
  { name: "administracao/notificacoes/editar/[id]", title: "Editar Notificação" },
  { name: "administracao/setores/index", title: "Setores" },
  { name: "administracao/setores/cadastrar", title: "Cadastrar Setor" },
  { name: "administracao/setores/editar-em-lote", title: "Editar Setores em Lote" },
  { name: "administracao/setores/listar", title: "Setores" },
  { name: "administracao/setores/detalhes/[id]", title: "Detalhes do Setor" },
  { name: "administracao/setores/editar/[id]", title: "Editar Setor" },

  // Inventory/Stock
  { name: "estoque/index", title: "Estoque" },
  { name: "estoque/produtos/index", title: "Produtos" },
  { name: "estoque/produtos/cadastrar", title: "Cadastrar Produto" },
  { name: "estoque/produtos/listar", title: "Produtos" },
  { name: "estoque/produtos/balanco-estoque", title: "Balanço de Estoque" },
  { name: "estoque/produtos/detalhes/[id]", title: "Detalhes do Produto" },
  { name: "estoque/produtos/editar/[id]", title: "Editar Produto" },
  { name: "estoque/produtos/categorias/index", title: "Categorias" },
  { name: "estoque/produtos/categorias/cadastrar", title: "Cadastrar Categoria" },
  { name: "estoque/produtos/categorias/listar", title: "Categorias" },
  { name: "estoque/produtos/categorias/detalhes/[id]", title: "Detalhes da Categoria" },
  { name: "estoque/produtos/categorias/editar/[id]", title: "Editar Categoria" },
  { name: "estoque/produtos/marcas/index", title: "Marcas" },
  { name: "estoque/produtos/marcas/cadastrar", title: "Cadastrar Marca" },
  { name: "estoque/produtos/marcas/listar", title: "Marcas" },
  { name: "estoque/produtos/marcas/detalhes/[id]", title: "Detalhes da Marca" },
  { name: "estoque/produtos/marcas/editar/[id]", title: "Editar Marca" },
  { name: "estoque/movimentacoes/index", title: "Movimentações" },
  { name: "estoque/movimentacoes/cadastrar", title: "Cadastrar Movimentação" },
  { name: "estoque/movimentacoes/listar", title: "Movimentações" },
  { name: "estoque/movimentacoes/detalhes/[id]", title: "Detalhes da Movimentação" },
  { name: "estoque/movimentacoes/editar/[id]", title: "Editar Movimentação" },
  { name: "estoque/fornecedores/index", title: "Fornecedores" },
  { name: "estoque/fornecedores/cadastrar", title: "Cadastrar Fornecedor" },
  { name: "estoque/fornecedores/listar", title: "Fornecedores" },
  { name: "estoque/fornecedores/detalhes/[id]", title: "Detalhes do Fornecedor" },
  { name: "estoque/fornecedores/editar/[id]", title: "Editar Fornecedor" },
  { name: "estoque/pedidos/index", title: "Pedidos" },
  { name: "estoque/pedidos/cadastrar", title: "Cadastrar Pedido" },
  { name: "estoque/pedidos/listar", title: "Pedidos" },
  { name: "estoque/pedidos/detalhes/[id]", title: "Detalhes do Pedido" },
  { name: "estoque/pedidos/editar/[id]", title: "Editar Pedido" },
  { name: "estoque/pedidos/[orderId]/items/adicionar", title: "Adicionar Item" },
  { name: "estoque/pedidos/[orderId]/items/listar", title: "Itens" },
  { name: "estoque/pedidos/[orderId]/items/detalhes/[id]", title: "Detalhes do Item" },
  { name: "estoque/pedidos/[orderId]/items/editar/[id]", title: "Editar Item" },
  { name: "estoque/pedidos/agendamentos/index", title: "Agendamentos" },
  { name: "estoque/pedidos/agendamentos/cadastrar", title: "Cadastrar Agendamento" },
  { name: "estoque/pedidos/agendamentos/listar", title: "Agendamentos" },
  { name: "estoque/pedidos/agendamentos/detalhes/[id]", title: "Detalhes do Agendamento" },
  { name: "estoque/pedidos/agendamentos/editar/[id]", title: "Editar Agendamento" },
  { name: "estoque/pedidos/automaticos/index", title: "Pedidos Automáticos" },
  { name: "estoque/pedidos/automaticos/cadastrar", title: "Cadastrar Pedido Automático" },
  { name: "estoque/pedidos/automaticos/configurar", title: "Configurar Pedidos Automáticos" },
  { name: "estoque/pedidos/automaticos/listar", title: "Pedidos Automáticos" },
  { name: "estoque/pedidos/automaticos/detalhes/[id]", title: "Detalhes do Pedido Automático" },
  { name: "estoque/pedidos/automaticos/editar/[id]", title: "Editar Pedido Automático" },
  { name: "estoque/manutencao/index", title: "Manutenção" },
  { name: "estoque/manutencao/cadastrar", title: "Cadastrar Manutenção" },
  { name: "estoque/manutencao/listar", title: "Manutenções" },
  { name: "estoque/manutencao/schedules", title: "Agendamentos de Manutenção" },
  { name: "estoque/manutencao/detalhes/[id]", title: "Detalhes da Manutenção" },
  { name: "estoque/manutencao/editar/[id]", title: "Editar Manutenção" },
  { name: "estoque/manutencao/agendamentos/index", title: "Agendamentos" },
  { name: "estoque/manutencao/agendamentos/cadastrar", title: "Cadastrar Agendamento" },
  { name: "estoque/manutencao/agendamentos/listar", title: "Agendamentos" },
  { name: "estoque/manutencao/agendamentos/detalhes/[id]", title: "Detalhes do Agendamento" },
  { name: "estoque/manutencao/agendamentos/editar/[id]", title: "Editar Agendamento" },
  { name: "estoque/emprestimos/index", title: "Empréstimos" },
  { name: "estoque/emprestimos/cadastrar", title: "Cadastrar Empréstimo" },
  { name: "estoque/emprestimos/listar", title: "Empréstimos" },
  { name: "estoque/emprestimos/detalhes/[id]", title: "Detalhes do Empréstimo" },
  { name: "estoque/emprestimos/editar/[id]", title: "Editar Empréstimo" },
  { name: "estoque/epi/index", title: "EPI" },
  { name: "estoque/epi/cadastrar", title: "Cadastrar EPI" },
  { name: "estoque/epi/listar", title: "EPIs" },
  { name: "estoque/epi/detalhes/[id]", title: "Detalhes do EPI" },
  { name: "estoque/epi/editar/[id]", title: "Editar EPI" },
  { name: "estoque/epi/agendamentos/index", title: "Agendamentos EPI" },
  { name: "estoque/epi/agendamentos/cadastrar", title: "Cadastrar Agendamento EPI" },
  { name: "estoque/epi/agendamentos/listar", title: "Agendamentos EPI" },
  { name: "estoque/epi/agendamentos/detalhes/[id]", title: "Detalhes do Agendamento EPI" },
  { name: "estoque/epi/agendamentos/editar/[id]", title: "Editar Agendamento EPI" },
  { name: "estoque/epi/entregas/index", title: "Entregas EPI" },
  { name: "estoque/epi/entregas/cadastrar", title: "Cadastrar Entrega EPI" },
  { name: "estoque/epi/entregas/listar", title: "Entregas EPI" },
  { name: "estoque/epi/entregas/detalhes/[id]", title: "Detalhes da Entrega EPI" },
  { name: "estoque/epi/entregas/editar/[id]", title: "Editar Entrega EPI" },
  { name: "estoque/retiradas-externas/index", title: "Retiradas Externas" },
  { name: "estoque/retiradas-externas/cadastrar", title: "Cadastrar Retirada Externa" },
  { name: "estoque/retiradas-externas/listar", title: "Retiradas Externas" },
  { name: "estoque/retiradas-externas/detalhes/[id]", title: "Detalhes da Retirada Externa" },
  { name: "estoque/retiradas-externas/editar/[id]", title: "Editar Retirada Externa" },

  // Production
  { name: "producao/index", title: "Produção" },
  { name: "producao/cronograma/index", title: "Cronograma" },
  { name: "producao/cronograma/cadastrar", title: "Cadastrar Cronograma" },
  { name: "producao/cronograma/em-espera", title: "Cronograma Em Espera" },
  { name: "producao/cronograma/listar", title: "Cronograma" },
  { name: "producao/cronograma/operacoes-em-lote", title: "Operações em Lote" },
  { name: "producao/cronograma/detalhes/[id]", title: "Detalhes do Cronograma" },
  { name: "producao/cronograma/editar/[id]", title: "Editar Cronograma" },
  { name: "producao/aerografia/index", title: "Aerografia" },
  { name: "producao/aerografia/cadastrar", title: "Cadastrar Aerografia" },
  { name: "producao/aerografia/listar", title: "Aerografias" },
  { name: "producao/aerografia/detalhes/[id]", title: "Detalhes da Aerografia" },
  { name: "producao/aerografia/editar/[id]", title: "Editar Aerografia" },
  { name: "producao/garagens/index", title: "Garagens" },
  { name: "producao/garagens/cadastrar", title: "Cadastrar Garagem" },
  { name: "producao/garagens/listar", title: "Garagens" },
  { name: "producao/garagens/detalhes/[id]", title: "Detalhes da Garagem" },
  { name: "producao/garagens/editar/[id]", title: "Editar Garagem" },
  { name: "producao/observacoes/index", title: "Observações" },
  { name: "producao/observacoes/cadastrar", title: "Cadastrar Observação" },
  { name: "producao/observacoes/listar", title: "Observações" },
  { name: "producao/observacoes/detalhes/[id]", title: "Detalhes da Observação" },
  { name: "producao/observacoes/editar/[id]", title: "Editar Observação" },
  { name: "producao/historico/index", title: "Histórico" },
  { name: "producao/ordens-de-servico/cadastrar", title: "Cadastrar Ordem de Serviço" },
  { name: "producao/ordens-de-servico/listar", title: "Ordens de Serviço" },
  { name: "producao/ordens-de-servico/detalhes/[id]", title: "Detalhes da Ordem de Serviço" },
  { name: "producao/ordens-de-servico/editar/[id]", title: "Editar Ordem de Serviço" },
  { name: "producao/servicos/cadastrar", title: "Cadastrar Serviço" },
  { name: "producao/servicos/listar", title: "Serviços" },
  { name: "producao/servicos/detalhes/[id]", title: "Detalhes do Serviço" },
  { name: "producao/servicos/editar/[id]", title: "Editar Serviço" },
  { name: "producao/caminhoes/cadastrar", title: "Cadastrar Caminhão" },
  { name: "producao/caminhoes/listar", title: "Caminhões" },
  { name: "producao/caminhoes/detalhes/[id]", title: "Detalhes do Caminhão" },
  { name: "producao/caminhoes/editar/[id]", title: "Editar Caminhão" },
  { name: "producao/recorte/listar", title: "Recortes" },
  { name: "producao/recorte/plano-de-recorte/cadastrar", title: "Cadastrar Plano de Recorte" },
  { name: "producao/recorte/plano-de-recorte/listar", title: "Planos de Recorte" },
  { name: "producao/recorte/plano-de-recorte/detalhes/[id]", title: "Detalhes do Plano de Recorte" },
  { name: "producao/recorte/plano-de-recorte/editar/[id]", title: "Editar Plano de Recorte" },
  { name: "producao/recorte/requisicao-de-recorte/cadastrar", title: "Cadastrar Requisição de Recorte" },
  { name: "producao/recorte/requisicao-de-recorte/listar", title: "Requisições de Recorte" },
  { name: "producao/recorte/requisicao-de-recorte/detalhes/[id]", title: "Detalhes da Requisição de Recorte" },
  { name: "producao/recorte/requisicao-de-recorte/editar/[id]", title: "Editar Requisição de Recorte" },
  { name: "producao/tintas/cadastrar", title: "Cadastrar Tinta" },
  { name: "producao/tintas/listar", title: "Tintas" },
  { name: "producao/tintas/detalhes/[id]", title: "Detalhes da Tinta" },
  { name: "producao/tintas/editar/[id]", title: "Editar Tinta" },

  // Human Resources
  { name: "recursos-humanos/index", title: "Recursos Humanos" },
  { name: "recursos-humanos/simulacao-bonus", title: "Simulação de Bônus" },
  { name: "recursos-humanos/calculos", title: "Cálculos de Ponto" },
  { name: "recursos-humanos/calculos/index", title: "Cálculos de Ponto" },
  { name: "recursos-humanos/calculos/listar", title: "Cálculos de Ponto" },
  { name: "recursos-humanos/requisicoes", title: "Requisições" },
  { name: "recursos-humanos/requisicoes/index", title: "Requisições" },
  { name: "recursos-humanos/requisicoes/listar", title: "Requisições" },
  { name: "recursos-humanos/controle-ponto", title: "Controle de Ponto" },
  { name: "recursos-humanos/controle-ponto/index", title: "Controle de Ponto" },
  { name: "recursos-humanos/controle-ponto/listar", title: "Controle de Ponto" },
  { name: "recursos-humanos/colaboradores/cadastrar", title: "Cadastrar Colaborador" },
  { name: "recursos-humanos/colaboradores/listar", title: "Colaboradores" },
  { name: "recursos-humanos/colaboradores/detalhes/[id]", title: "Detalhes do Colaborador" },
  { name: "recursos-humanos/colaboradores/editar/[id]", title: "Editar Colaborador" },
  { name: "recursos-humanos/advertencias/index", title: "Advertências" },
  { name: "recursos-humanos/advertencias/cadastrar", title: "Cadastrar Advertência" },
  { name: "recursos-humanos/advertencias/editar-em-lote", title: "Editar Advertências em Lote" },
  { name: "recursos-humanos/advertencias/listar", title: "Advertências" },
  { name: "recursos-humanos/advertencias/detalhes/[id]", title: "Detalhes da Advertência" },
  { name: "recursos-humanos/advertencias/editar/[id]", title: "Editar Advertência" },
  { name: "recursos-humanos/cargos/index", title: "Cargos" },
  { name: "recursos-humanos/cargos/cadastrar", title: "Cadastrar Cargo" },
  { name: "recursos-humanos/cargos/editar-em-lote", title: "Editar Cargos em Lote" },
  { name: "recursos-humanos/cargos/hierarchy", title: "Hierarquia de Cargos" },
  { name: "recursos-humanos/cargos/listar", title: "Cargos" },
  { name: "recursos-humanos/cargos/[positionId]/remuneracoes", title: "Remunerações" },
  { name: "recursos-humanos/cargos/detalhes/[id]", title: "Detalhes do Cargo" },
  { name: "recursos-humanos/cargos/editar/[id]", title: "Editar Cargo" },
  { name: "recursos-humanos/feriados/index", title: "Feriados" },
  { name: "recursos-humanos/feriados/cadastrar", title: "Cadastrar Feriado" },
  { name: "recursos-humanos/feriados/calendario", title: "Calendário de Feriados" },
  { name: "recursos-humanos/feriados/listar", title: "Feriados" },
  { name: "recursos-humanos/feriados/detalhes/[id]", title: "Detalhes do Feriado" },
  { name: "recursos-humanos/feriados/editar/[id]", title: "Editar Feriado" },
  { name: "recursos-humanos/ferias/index", title: "Férias" },
  { name: "recursos-humanos/ferias/cadastrar", title: "Cadastrar Férias" },
  { name: "recursos-humanos/ferias/calendario", title: "Calendário de Férias" },
  { name: "recursos-humanos/ferias/editar-em-lote", title: "Editar Férias em Lote" },
  { name: "recursos-humanos/ferias/listar", title: "Férias" },
  { name: "recursos-humanos/ferias/detalhes/[id]", title: "Detalhes das Férias" },
  { name: "recursos-humanos/ferias/editar/[id]", title: "Editar Férias" },
  { name: "recursos-humanos/folha-de-pagamento/index", title: "Folha de Pagamento" },
  { name: "recursos-humanos/folha-de-pagamento/[userId]", title: "Folha de Pagamento" },
  { name: "recursos-humanos/folha-de-pagamento/listar", title: "Folhas de Pagamento" },
  { name: "recursos-humanos/niveis-de-desempenho/index", title: "Níveis de Desempenho" },
  { name: "recursos-humanos/niveis-de-desempenho/listar", title: "Níveis de Desempenho" },
  { name: "recursos-humanos/setores/listar", title: "Setores" },
  { name: "recursos-humanos/epi/index", title: "EPIs" },
  { name: "recursos-humanos/epi/cadastrar", title: "Cadastrar EPI" },
  { name: "recursos-humanos/epi/listar", title: "EPIs" },
  { name: "recursos-humanos/epi/detalhes/[id]", title: "Detalhes do EPI" },
  { name: "recursos-humanos/epi/editar/[id]", title: "Editar EPI" },
  { name: "recursos-humanos/epi/agendamentos/index", title: "Agendamentos EPI" },
  { name: "recursos-humanos/epi/agendamentos/cadastrar", title: "Cadastrar Agendamento EPI" },
  { name: "recursos-humanos/epi/agendamentos/listar", title: "Agendamentos EPI" },
  { name: "recursos-humanos/epi/agendamentos/detalhes/[id]", title: "Detalhes do Agendamento EPI" },
  { name: "recursos-humanos/epi/agendamentos/editar/[id]", title: "Editar Agendamento EPI" },
  { name: "recursos-humanos/epi/entregas/index", title: "Entregas EPI" },
  { name: "recursos-humanos/epi/entregas/cadastrar", title: "Cadastrar Entrega EPI" },
  { name: "recursos-humanos/epi/entregas/listar", title: "Entregas EPI" },
  { name: "recursos-humanos/epi/entregas/detalhes/[id]", title: "Detalhes da Entrega EPI" },
  { name: "recursos-humanos/epi/entregas/editar/[id]", title: "Editar Entrega EPI" },
  { name: "recursos-humanos/epi/relatorios/index", title: "Relatórios EPI" },
  { name: "recursos-humanos/epi/tamanhos/index", title: "Tamanhos EPI" },
  { name: "recursos-humanos/epi/tamanhos/cadastrar", title: "Cadastrar Tamanho EPI" },
  { name: "recursos-humanos/epi/tamanhos/listar", title: "Tamanhos EPI" },
  { name: "recursos-humanos/epi/tamanhos/detalhes/[id]", title: "Detalhes do Tamanho EPI" },
  { name: "recursos-humanos/epi/tamanhos/editar/[id]", title: "Editar Tamanho EPI" },

  // My Team
  { name: "meu-pessoal/index", title: "Meu Pessoal" },
  { name: "meu-pessoal/advertencias", title: "Advertências" },
  { name: "meu-pessoal/emprestimos", title: "Empréstimos" },
  { name: "meu-pessoal/ferias", title: "Férias" },

  // Minha Equipe (My Team - for team leaders only)
  { name: "minha-equipe/index", title: "Minha Equipe" },
  { name: "minha-equipe/membros/listar", title: "Membros da Equipe" },
  { name: "minha-equipe/membros/detalhes/[id]", title: "Detalhes do Membro" },

  // Personal (User's own information only)
  { name: "pessoal/index", title: "Pessoal" },
  { name: "pessoal/meus-feriados/index", title: "Feriados" },
  { name: "pessoal/meus-feriados/detalhes/[id]", title: "Detalhes do Feriado" },
  { name: "pessoal/minhas-ferias/index", title: "Férias" },
  { name: "pessoal/minhas-ferias/detalhes/[id]", title: "Detalhes das Férias" },
  { name: "pessoal/meus-epis/index", title: "Meus EPIs" },
  { name: "pessoal/meus-epis/request", title: "Solicitar EPI" },
  { name: "pessoal/meus-epis/detalhes/[id]", title: "Detalhes do EPI" },
  { name: "pessoal/meus-emprestimos/index", title: "Meus Empréstimos" },
  { name: "pessoal/meus-emprestimos/detalhes/[id]", title: "Detalhes do Empréstimo" },
  { name: "pessoal/minhas-atividades/index", title: "Minhas Atividades" },
  { name: "pessoal/minhas-atividades/detalhes/[id]", title: "Detalhes da Atividade" },
  { name: "pessoal/minhas-advertencias/index", title: "Minhas Advertências" },
  { name: "pessoal/minhas-advertencias/detalhes/[id]", title: "Detalhes da Advertência" },
  { name: "pessoal/meus-bonus/index", title: "Meus Bônus" },
  { name: "pessoal/meus-bonus/detalhes/[id]", title: "Detalhes do Bônus" },
  { name: "pessoal/simulacao-bonus", title: "Simulação de Bônus" },
  { name: "pessoal/meu-bonus/index", title: "Meu Bônus" },
  { name: "pessoal/meu-bonus/atual", title: "Meu Bônus" },
  { name: "pessoal/meu-bonus/simulacao", title: "Simulação de Bônus" },
  { name: "pessoal/meu-bonus/historico", title: "Histórico de Bônus" },
  { name: "pessoal/meu-bonus/detalhes/[id]", title: "Detalhes do Bônus" },
  { name: "pessoal/meus-pontos/index", title: "Meus Pontos" },
  { name: "pessoal/minhas-notificacoes/index", title: "Notificações" },
  { name: "pessoal/minhas-notificacoes/configuracoes", title: "Configurações de Notificações" },
  { name: "pessoal/minhas-notificacoes/detalhes/[id]", title: "Detalhes da Notificação" },
  { name: "pessoal/colaboradores/index", title: "Colaboradores" },
  { name: "pessoal/colaboradores/listar", title: "Colaboradores" },
  { name: "pessoal/colaboradores/detalhes/[id]", title: "Detalhes do Colaborador" },
  { name: "pessoal/preferencias/index", title: "Preferências" },
  { name: "pessoal/preferencias/tema", title: "Tema" },
  { name: "pessoal/preferencias/notificacoes", title: "Preferências de Notificações" },
  { name: "pessoal/preferencias/privacidade", title: "Privacidade" },

  // Painting
  { name: "pintura/index", title: "Pintura" },
  { name: "pintura/catalogo-basico/index", title: "Catálogo Básico" },
  { name: "pintura/catalogo/index", title: "Catálogo" },
  { name: "pintura/catalogo/cadastrar", title: "Cadastrar Catálogo" },
  { name: "pintura/catalogo/listar", title: "Catálogos" },
  { name: "pintura/catalogo/detalhes/[id]", title: "Detalhes do Catálogo" },
  { name: "pintura/catalogo/editar/[id]", title: "Editar Catálogo" },
  { name: "pintura/formulas/listar", title: "Fórmulas" },
  { name: "pintura/formulas/detalhes/[id]", title: "Detalhes da Fórmula" },
  { name: "pintura/formulas/[formulaId]/componentes/cadastrar", title: "Cadastrar Componente" },
  { name: "pintura/formulas/[formulaId]/componentes/listar", title: "Componentes" },
  { name: "pintura/formulas/[formulaId]/componentes/detalhes/[id]", title: "Detalhes do Componente" },
  { name: "pintura/formulas/[formulaId]/componentes/editar/[id]", title: "Editar Componente" },
  { name: "pintura/marcas-de-tinta/index", title: "Marcas de Tinta" },
  { name: "pintura/marcas-de-tinta/cadastrar", title: "Cadastrar Marca de Tinta" },
  { name: "pintura/marcas-de-tinta/listar", title: "Marcas de Tinta" },
  { name: "pintura/marcas-de-tinta/detalhes/[id]", title: "Detalhes da Marca de Tinta" },
  { name: "pintura/marcas-de-tinta/editar/[id]", title: "Editar Marca de Tinta" },
  { name: "pintura/tipos-de-tinta/index", title: "Tipos de Tinta" },
  { name: "pintura/tipos-de-tinta/cadastrar", title: "Cadastrar Tipo de Tinta" },
  { name: "pintura/tipos-de-tinta/listar", title: "Tipos de Tinta" },
  { name: "pintura/tipos-de-tinta/detalhes/[id]", title: "Detalhes do Tipo de Tinta" },
  { name: "pintura/tipos-de-tinta/editar/[id]", title: "Editar Tipo de Tinta" },
  { name: "pintura/producoes/index", title: "Produções" },
  { name: "pintura/producoes/listar", title: "Produções" },
  { name: "pintura/producoes/detalhes/[id]", title: "Detalhes da Produção" },

  // Financial
  { name: "financeiro/index", title: "Financeiro" },
  { name: "financeiro/clientes/listar", title: "Clientes" },
  { name: "financeiro/clientes/detalhes/[id]", title: "Detalhes do Cliente" },
  { name: "financeiro/clientes/editar/[id]", title: "Editar Cliente" },

  // Integrations
  { name: "integracoes/index", title: "Integrações" },
  { name: "integracoes/secullum/index", title: "Secullum" },
  { name: "integracoes/secullum/status-sincronizacao", title: "Status de Sincronização" },
  { name: "integracoes/secullum/calculos/listar", title: "Cálculos" },
  { name: "integracoes/secullum/registros-ponto/index", title: "Registros de Ponto" },
  { name: "integracoes/secullum/registros-ponto/listar", title: "Registros de Ponto" },
  { name: "integracoes/secullum/registros-ponto/detalhes/[id]", title: "Detalhes do Registro de Ponto" },
  { name: "integracoes/secullum/requisicoes/listar", title: "Requisições" },

  // Maintenance
  { name: "manutencao/index", title: "Manutenção" },

  // Server
  { name: "servidor/index", title: "Servidor" },
  { name: "servidor/database-sync", title: "Sincronização de BD" },
  { name: "servidor/logs", title: "Logs" },
  { name: "servidor/maintenance", title: "Manutenção" },
  { name: "servidor/metricas", title: "Métricas do Sistema" },
  { name: "servidor/rate-limiting", title: "Rate Limiting" },
  { name: "servidor/resources", title: "Recursos" },
  { name: "servidor/services", title: "Serviços" },
  { name: "servidor/shared-folders", title: "Pastas Compartilhadas" },
  { name: "servidor/status", title: "Status" },
  { name: "servidor/system-users", title: "Usuários do Sistema" },
  { name: "servidor/backups/cadastrar", title: "Criar Backup" },
  { name: "servidor/backups/listar", title: "Backups" },
  { name: "servidor/backups/detalhes/[id]", title: "Detalhes do Backup" },
  { name: "servidor/implantacoes/index", title: "Implantações" },
  { name: "servidor/implantacoes/listar", title: "Implantações" },
  { name: "servidor/implantacoes/detalhes/[id]", title: "Detalhes da Implantação" },
  { name: "servidor/registros-de-alteracoes/index", title: "Registros de Alterações" },
  { name: "servidor/registros-de-alteracoes/listar", title: "Registros" },
  { name: "servidor/registros-de-alteracoes/detalhes/[id]", title: "Detalhes do Registro" },
  { name: "servidor/registros-de-alteracoes/entidade/[entityType]/[entityId]", title: "Registros por Entidade" },
  { name: "servidor/usuarios/index", title: "Usuários" },
];

// Filter routes based on user privileges
function getAccessibleRoutes(userPrivileges: SECTOR_PRIVILEGES[], user?: any): typeof ALL_ROUTES {
  const startTime = Date.now();

  // Check if user is admin - check both sector and sectors for compatibility
  // Also check string value directly in case of type mismatch
  const isAdmin = userPrivileges.includes(SECTOR_PRIVILEGES.ADMIN) ||
                  user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN ||
                  (user?.sector?.privileges as any) === 'ADMIN' ||
                  user?.sectors?.some((s: any) => s.privilege === SECTOR_PRIVILEGES.ADMIN);

  // If admin, return all routes without filtering
  if (isAdmin) {
    console.log(`[PRIVILEGE-NAV] Admin user detected - returning all ${ALL_ROUTES.length} routes`);
    logPerformance(`Admin route calculation (all routes)`, startTime);
    return ALL_ROUTES;
  }

  // Filter routes based on privileges
  const accessibleRoutes = ALL_ROUTES.filter(route => {
    const path = route.name;

    // Core routes always accessible
    if (['inicio', 'pessoal/meu-perfil', 'configuracoes', 'catalogo'].includes(path)) {
      return true;
    }

    // Check module-based access
    if (userPrivileges.includes(SECTOR_PRIVILEGES.HUMAN_RESOURCES) && path.startsWith('recursos-humanos/')) {
      return true;
    }
    if (userPrivileges.includes(SECTOR_PRIVILEGES.PRODUCTION) && path.startsWith('producao/')) {
      // Production sector has limited access - exclude aerografia, em espera, and garagens
      const restrictedPaths = ['producao/aerografia/', 'producao/cronograma/em-espera', 'producao/garagens/'];
      const isRestricted = restrictedPaths.some(restricted => path.startsWith(restricted) || path === restricted);
      if (!isRestricted) {
        return true;
      }
    }
    if (userPrivileges.includes(SECTOR_PRIVILEGES.WAREHOUSE) && path.startsWith('estoque/')) {
      return true;
    }
    if (userPrivileges.includes(SECTOR_PRIVILEGES.FINANCIAL) && path.startsWith('financeiro/')) {
      return true;
    }
    if (userPrivileges.includes(SECTOR_PRIVILEGES.LEADER) && (
      path.startsWith('meu-pessoal/') ||
      path.startsWith('producao/') ||
      path.startsWith('pintura/')
    )) {
      return true;
    }
    if (userPrivileges.includes(SECTOR_PRIVILEGES.DESIGNER) && path.startsWith('pintura/')) {
      return true;
    }
    if (userPrivileges.includes(SECTOR_PRIVILEGES.MAINTENANCE) && (
      path.startsWith('manutencao/') ||
      path.startsWith('estoque/manutencao/')
    )) {
      return true;
    }

    // Personal routes for all users
    if (path.startsWith('pessoal/')) {
      return true;
    }

    return false;
  });

  logPerformance(`Route filtering for ${accessibleRoutes.length} routes`, startTime);

  return accessibleRoutes;
}

// Loading screen component
function LoadingScreen() {
  const { isDark } = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: isDark ? "#1c1c1c" : "#e8e8e8" }]}>
      <ActivityIndicator size="large" color="#15803d" />
      <Text style={[styles.loadingText, { color: isDark ? "#a3a3a3" : "#737373" }]}>Carregando...</Text>
    </View>
  );
}

// Extended User type to handle API structure
interface ExtendedUser {
  sector?: { privileges: SECTOR_PRIVILEGES; name: string }; // Note: API uses 'privileges' not 'privilege'
  sectors?: Array<{ privilege: SECTOR_PRIVILEGES }>; // Keep for backward compatibility
  [key: string]: any;
}

// Main optimized drawer layout with full menu structure
export function PrivilegeOptimizedFullLayout() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { canGoBack, goBack } = useNavigationHistory();
  const insets = useSafeAreaInsets();

  // Cast user to ExtendedUser for type safety
  const extUser = user as ExtendedUser | null;

  // Get user privileges - check both sector and sectors for compatibility
  const userPrivileges = useMemo(() => {
    if (extUser?.sector?.privileges) {
      return [extUser.sector.privileges];
    }
    if (extUser?.sectors) {
      return extUser.sectors.map((s: { privilege: SECTOR_PRIVILEGES }) => s.privilege);
    }
    return [SECTOR_PRIVILEGES.BASIC];
  }, [extUser]);

  // Get accessible routes based on privileges
  const accessibleRoutes = useMemo(() => {
    const routes = getAccessibleRoutes(userPrivileges, extUser);
    console.log(`[PRIVILEGE-NAV] User has access to ${routes.length} routes out of ${ALL_ROUTES.length}`);
    return routes;
  }, [userPrivileges, extUser]);

  // Memoized drawer colors - matching theme palette
  const drawerColors = useMemo(() => ({
    background: isDark ? "#212121" : "#fafafa", // Drawer uses slightly different shade
    text: isDark ? "#d9d9d9" : "#404040", // foreground colors
    activeText: "#ffffff",
    active: "#15803d", // primary color (green-700)
  }), [isDark]);

  return (
    <Drawer
      drawerContent={(props) => (
        <Suspense fallback={<LoadingScreen />}>
          <DrawerContent {...props} />
        </Suspense>
      )}
      screenOptions={({ navigation, route }) => {
        // Find the route config to get the proper title from ALL_ROUTES
        // This works with file-based routing by mapping route names to titles
        // Handle both with and without (tabs) prefix
        const normalizedRouteName = route.name.replace(/^\(tabs\)\//, '');
        const routeConfig = ALL_ROUTES.find(r =>
          r.name === route.name ||
          r.name === normalizedRouteName ||
          route.name.endsWith(r.name)
        );
        const title = routeConfig?.title || normalizedRouteName;

        // Header theme colors - matching your app's theme palette
        const headerBackground = isDark ? "#262626" : "#fafafa"; // card/surface colors
        const headerText = isDark ? "#d9d9d9" : "#404040"; // foreground colors
        const headerBorder = isDark ? "#3a3a3a" : "#e3e3e3"; // border colors
        const buttonPressed = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)";

        return {
          headerTitle: title, // Use the proper title, not the route name
          headerTitleStyle: {
            color: headerText,
            fontSize: 18,
            fontWeight: "600",
          },
          headerStyle: {
            backgroundColor: headerBackground,
            borderBottomWidth: 1,
            borderBottomColor: headerBorder,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerLeft: () => (
            canGoBack ? (
              <View style={{ paddingLeft: Platform.OS === 'ios' ? 12 : 8 }}>
                <Pressable
                  onPress={goBack}
                  style={({ pressed }) => [
                    styles.headerButton,
                    pressed && { backgroundColor: buttonPressed }
                  ]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon
                    name="arrow-left"
                    size="md"
                    variant={isDark ? "default" : "default"}
                    color={headerText}
                  />
                </Pressable>
              </View>
            ) : (
              // Add spacing even when there's no back button for consistency
              <View style={{ width: Platform.OS === 'ios' ? 24 : 20 }} />
            )
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <Pressable
                onPress={() => navigation.openDrawer()}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && { backgroundColor: buttonPressed }
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon
                  name="menu"
                  size="md"
                  variant={isDark ? "default" : "default"}
                  color={headerText}
                />
              </Pressable>
            </View>
          ),
          drawerPosition: "right",
          drawerStyle: {
            backgroundColor: drawerColors.background,
            width: 280,
          },
          drawerActiveTintColor: drawerColors.activeText,
          drawerActiveBackgroundColor: drawerColors.active,
          drawerInactiveTintColor: drawerColors.text,
          // Content insets to add padding from screen edges
          contentStyle: {
            backgroundColor: isDark ? "#1c1c1c" : "#e8e8e8", // background colors
          },
          sceneContainerStyle: {
            backgroundColor: isDark ? "#1c1c1c" : "#e8e8e8", // background colors
            paddingHorizontal: Platform.OS === 'ios' ? 16 : 12,
          },
        };
      }}
    >
      {/* Let Expo Router auto-discover routes from file system */}
      {/* Don't manually register routes - this causes "property is not configurable" error */}
    </Drawer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  headerButton: {
    padding: 12, // Increased from 8 for better touch target
    marginHorizontal: 4, // Add horizontal margin for spacing from edges
    borderRadius: 8, // Slightly larger border radius
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12, // Increased gap between buttons
    paddingRight: Platform.OS === 'ios' ? 16 : 12, // More padding from edge
  },
});

export default PrivilegeOptimizedFullLayout;