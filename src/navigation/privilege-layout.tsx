// Ultra-Optimized Navigation with Full Menu Structure and Privilege-Based Loading
// This version combines the privilege optimization with the original menu design

import React, { useMemo, Suspense, lazy, useEffect, useRef, useCallback } from "react";
import { Drawer } from "expo-router/drawer";
import { router } from "expo-router";
import { DrawerActions, useFocusEffect, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Platform, AppState } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { getStoredToken } from "@/utils/auth-storage";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { useNav } from "@/contexts/nav";
import { SECTOR_PRIVILEGES } from '@/constants/enums';
import { DrawerModeProvider, useDrawerMode } from "@/contexts/drawer-mode-context";
// `useNavigationLoading` is still imported for `isNavigatingRef` and
// `startNavigation` (synchronous double-click guard + manual overlay control).
// `useNav` doesn't expose either (foundation TODO).
import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { useUnreadNotificationsCount } from "@/hooks/use-unread-notifications-count";
import * as Haptics from 'expo-haptics';
import { authRoute } from "@/components/auth/auth-routes";
import { routes } from "@/constants/routes";

// Performance monitoring
const PERF_DEBUG = __DEV__;
const logPerformance = (action: string, startTime: number) => {
  if (PERF_DEBUG) {
    console.log(`[PERF] ${action}: ${Date.now() - startTime}ms`);
  }
};

// Lazy load combined drawer content (supports both menu and notifications)
const CombinedDrawerContent = lazy(() => import('./CombinedDrawerContent'));

// Complete route list with correct naming
const ALL_ROUTES = [
  // Core routes - Always loaded
  { name: "inicio", title: "Início" },
  { name: "perfil", title: "Meu Perfil" },
  { name: "perfil/index", title: "Meu Perfil" },
  { name: "perfil/notification-preferences", title: "Preferências de Notificações" },
  { name: "configuracoes", title: "Configurações" },

  // Catalogo - View-only for Leaders (separate from Pintura module)
  { name: "catalogo", title: "Catálogo" },
  { name: "catalogo/index", title: "Catálogo" },
  { name: "catalogo/listar", title: "Catálogo de Tintas" },
  { name: "catalogo/detalhes/[id]", title: "Detalhes da Tinta" },

  // Administration
  { name: "administracao/index", title: "Administração" },
  { name: "administracao/clientes/index", title: "Clientes" },
  { name: "administracao/clientes/cadastrar", title: "Cadastrar Cliente" },
  { name: "administracao/clientes/editar-em-lote", title: "Editar Clientes em Lote" },
  { name: "administracao/clientes/listar", title: "Clientes" },
  { name: "administracao/clientes/detalhes/[id]", title: "Detalhes do Cliente" },
  { name: "administracao/clientes/editar/[id]", title: "Editar Cliente" },
  { name: "administracao/responsaveis/index", title: "Responsáveis" },
  { name: "administracao/responsaveis/listar", title: "Responsáveis" },
  { name: "administracao/responsaveis/cadastrar", title: "Cadastrar Responsável" },
  { name: "administracao/responsaveis/detalhes/[id]", title: "Detalhes do Responsável" },
  { name: "administracao/responsaveis/editar/[id]", title: "Editar Responsável" },
  { name: "departamento-pessoal/colaboradores/index", title: "Colaboradores" },
  { name: "departamento-pessoal/colaboradores/cadastrar", title: "Cadastrar Colaborador" },
  { name: "departamento-pessoal/colaboradores/editar-em-lote", title: "Editar Colaboradores em Lote" },
  { name: "departamento-pessoal/colaboradores/listar", title: "Colaboradores" },
  { name: "departamento-pessoal/colaboradores/detalhes/[id]", title: "Detalhes do Colaborador" },
  { name: "departamento-pessoal/colaboradores/editar/[id]", title: "Editar Colaborador" },
  { name: "administracao/notificacoes/index", title: "Notificações" },
  { name: "administracao/notificacoes/cadastrar", title: "Cadastrar Notificação" },
  { name: "administracao/notificacoes/listar", title: "Notificações" },
  { name: "administracao/notificacoes/cadastrar/enviar", title: "Enviar Notificação" },
  { name: "administracao/notificacoes/detalhes/[id]", title: "Detalhes da Notificação" },
  { name: "administracao/notificacoes/editar/[id]", title: "Editar Notificação" },
  { name: "administracao/mensagens/index", title: "Mensagens" },
  { name: "administracao/mensagens/listar", title: "Mensagens" },
  { name: "administracao/mensagens/cadastrar", title: "Criar Mensagem" },
  { name: "administracao/mensagens/detalhes/[id]", title: "Detalhes da Mensagem" },
  { name: "administracao/mensagens/editar/[id]", title: "Editar Mensagem" },
  { name: "administracao/setores/index", title: "Setores" },
  { name: "administracao/setores/cadastrar", title: "Cadastrar Setor" },
  { name: "administracao/setores/editar-em-lote", title: "Editar Setores em Lote" },
  { name: "administracao/setores/listar", title: "Setores" },
  { name: "administracao/setores/detalhes/[id]", title: "Detalhes do Setor" },
  { name: "administracao/setores/editar/[id]", title: "Editar Setor" },

  // Inventory/Stock
  { name: "estoque/index", title: "Estoque" },
  { name: "estoque/localizacoes/index", title: "Localizações" },
  { name: "estoque/localizacoes/listar", title: "Localizações" },
  { name: "estoque/produtos/index", title: "Produtos" },
  { name: "estoque/produtos/cadastrar", title: "Cadastrar Produto" },
  { name: "estoque/produtos/listar", title: "Produtos" },
  { name: "estoque/balanco/index", title: "Balanço de Estoque" },
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
  { name: "estoque/manutencao/index", title: "Manutenção" },
  { name: "estoque/manutencao/cadastrar", title: "Cadastrar Manutenção" },
  { name: "estoque/manutencao/listar", title: "Manutenções" },
  { name: "estoque/manutencao/detalhes/[id]", title: "Detalhes da Manutenção" },
  { name: "estoque/manutencao/editar/[id]", title: "Editar Manutenção" },
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
  { name: "estoque/epi/entregas/index", title: "Entregas EPI" },
  { name: "estoque/epi/entregas/cadastrar", title: "Cadastrar Entrega EPI" },
  { name: "estoque/epi/entregas/listar", title: "Entregas EPI" },
  { name: "estoque/epi/entregas/detalhes/[id]", title: "Detalhes da Entrega EPI" },
  { name: "estoque/epi/entregas/editar/[id]", title: "Editar Entrega EPI" },
  { name: "estoque/operacoes-externas/index", title: "Operações Externas" },
  { name: "estoque/operacoes-externas/cadastrar", title: "Cadastrar Operação Externa" },
  { name: "estoque/operacoes-externas/listar", title: "Operações Externas" },
  { name: "estoque/operacoes-externas/detalhes/[id]", title: "Detalhes da Operação Externa" },
  { name: "estoque/operacoes-externas/editar/[id]", title: "Editar Operação Externa" },

  // Production
  { name: "producao/index", title: "Produção" },
  { name: "producao/cronograma/index", title: "Cronograma" },
  { name: "producao/cronograma/cadastrar", title: "Cadastrar Cronograma" },
  { name: "producao/agenda/index", title: "Agenda" },
  { name: "producao/agenda/cadastrar", title: "Cadastrar Tarefa" },
  { name: "producao/agenda/detalhes/[id]", title: "Detalhes da Tarefa" },
  { name: "producao/agenda/precificacao/[id]", title: "Or\u00e7amento" },
  { name: "producao/agenda/copiar-de/[id]", title: "Copiar de Outra Tarefa" },
  { name: "producao/tarefa/[id]", title: "Detalhes da Tarefa" },
  { name: "producao/cronograma/listar", title: "Cronograma" },
  { name: "producao/cronograma/operacoes-em-lote", title: "Operações em Lote" },
  { name: "producao/cronograma/detalhes/[id]", title: "Detalhes do Cronograma" },
  { name: "producao/cronograma/editar/[id]", title: "Editar Cronograma" },
  { name: "producao/cronograma/layout/[id]", title: "Layout do Caminhao" },
  { name: "producao/cronograma/checkin-checkout/[id]", title: "Check-in / Check-out" },
  { name: "producao/agenda/checkin-checkout/[id]", title: "Check-in / Check-out" },
  { name: "producao/historico/checkin-checkout/[id]", title: "Check-in / Check-out" },
  { name: "producao/aerografia/index", title: "Aerografia" },
  { name: "producao/aerografia/cadastrar", title: "Cadastrar Aerografia" },
  { name: "producao/aerografia/listar", title: "Aerografias" },
  { name: "producao/aerografia/detalhes/[id]", title: "Detalhes da Aerografia" },
  { name: "producao/aerografia/editar/[id]", title: "Editar Aerografia" },
  { name: "producao/garagens/index", title: "Barracões" },
  { name: "producao/garagens/cadastrar", title: "Cadastrar Barracão" },
  { name: "producao/garagens/listar", title: "Barracões" },
  { name: "producao/garagens/detalhes/[id]", title: "Detalhes do Barracão" },
  { name: "producao/garagens/editar/[id]", title: "Editar Barracão" },
  { name: "producao/observacoes/index", title: "Observações" },
  { name: "producao/observacoes/cadastrar", title: "Cadastrar Observação" },
  { name: "producao/observacoes/listar", title: "Observações" },
  { name: "producao/observacoes/detalhes/[id]", title: "Detalhes da Observação" },
  { name: "producao/observacoes/editar/[id]", title: "Editar Observação" },
  { name: "producao/historico/index", title: "Histórico" },
  { name: "producao/historico/concluidos", title: "Histórico - Concluídos" },
  { name: "producao/historico/cancelados", title: "Histórico de Cancelados" },
  { name: "producao/historico/detalhes/[id]", title: "Detalhes da Tarefa" },
  { name: "producao/ordens-de-servico/cadastrar", title: "Cadastrar Ordem de Serviço" },
  { name: "producao/ordens-de-servico/listar", title: "Ordens de Serviço" },
  { name: "producao/ordens-de-servico/detalhes/[id]", title: "Detalhes da Ordem de Serviço" },
  { name: "producao/ordens-de-servico/editar/[id]", title: "Editar Ordem de Serviço" },
  { name: "producao/caminhoes/cadastrar", title: "Cadastrar Caminhão" },
  { name: "producao/caminhoes/listar", title: "Caminhões" },
  { name: "producao/caminhoes/detalhes/[id]", title: "Detalhes do Caminhão" },
  { name: "producao/caminhoes/editar/[id]", title: "Editar Caminhão" },
  { name: "producao/recorte/listar", title: "Recortes" },
  { name: "producao/recorte/cadastrar", title: "Novo Recorte" },
  { name: "producao/recorte/detalhes/[id]", title: "Detalhes do Recorte" },
  { name: "producao/tintas/cadastrar", title: "Cadastrar Tinta" },
  { name: "producao/tintas/listar", title: "Tintas" },
  { name: "producao/tintas/detalhes/[id]", title: "Detalhes da Tinta" },
  { name: "producao/tintas/editar/[id]", title: "Editar Tinta" },

  // Personnel Department
  { name: "departamento-pessoal/index", title: "Departamento Pessoal" },
  { name: "departamento-pessoal/simulacao-bonus", title: "Simulação de Bônus" },
  { name: "departamento-pessoal/bonus", title: "Bônus" },
  { name: "departamento-pessoal/bonus/index", title: "Bônus" },
  { name: "departamento-pessoal/bonus/listar", title: "Bônus" },
  { name: "departamento-pessoal/bonus/cadastrar", title: "Cadastrar Bônus" },
  { name: "departamento-pessoal/bonus/detalhes/[id]", title: "Detalhes do Bônus" },
  { name: "departamento-pessoal/bonus/editar/[id]", title: "Editar Bônus" },
  { name: "departamento-pessoal/bonus/nivel-de-performance", title: "Níveis de Performance" },
  { name: "departamento-pessoal/bonus/nivel-de-performance/index", title: "Níveis de Performance" },
  { name: "departamento-pessoal/bonus/simulacao", title: "Simulação de Bônus" },
  { name: "departamento-pessoal/bonus/simulacao/index", title: "Simulação de Bônus" },
  { name: "departamento-pessoal/calculos", title: "Cálculos de Ponto" },
  { name: "departamento-pessoal/calculos/index", title: "Cálculos de Ponto" },
  { name: "departamento-pessoal/calculos/listar", title: "Cálculos de Ponto" },
  { name: "departamento-pessoal/requisicoes", title: "Requisições" },
  { name: "departamento-pessoal/requisicoes/index", title: "Requisições" },
  { name: "departamento-pessoal/requisicoes/listar", title: "Requisições" },
  { name: "departamento-pessoal/controle-ponto", title: "Controle de Ponto" },
  { name: "departamento-pessoal/controle-ponto/index", title: "Controle de Ponto" },
  { name: "departamento-pessoal/controle-ponto/listar", title: "Controle de Ponto" },
  { name: "departamento-pessoal/controle-ponto/colaborador", title: "Visualização Colaborador" },
  { name: "departamento-pessoal/controle-ponto/dia", title: "Visualização Dia" },
  { name: "departamento-pessoal/controle-ponto/edicao", title: "Edição de Ponto" },
  { name: "departamento-pessoal/controle-ponto/ausencias", title: "Ausências" },
  { name: "departamento-pessoal/controle-ponto/fechamento/index", title: "Fechamento" },
  { name: "departamento-pessoal/controle-ponto/fechamento/[id]", title: "Fechamento" },
  { name: "departamento-pessoal/controle-ponto/detalhes/[id]", title: "Registro de Ponto" },
  { name: "departamento-pessoal/colaboradores/cadastrar", title: "Cadastrar Colaborador" },
  { name: "departamento-pessoal/colaboradores/listar", title: "Colaboradores" },
  { name: "departamento-pessoal/colaboradores/detalhes/[id]", title: "Detalhes do Colaborador" },
  { name: "departamento-pessoal/colaboradores/editar/[id]", title: "Editar Colaborador" },
  { name: "departamento-pessoal/advertencias/index", title: "Advertências" },
  { name: "departamento-pessoal/advertencias/cadastrar", title: "Cadastrar Advertência" },
  { name: "departamento-pessoal/advertencias/editar-em-lote", title: "Editar Advertências em Lote" },
  { name: "departamento-pessoal/advertencias/listar", title: "Advertências" },
  { name: "departamento-pessoal/advertencias/detalhes/[id]", title: "Detalhes da Advertência" },
  { name: "departamento-pessoal/advertencias/editar/[id]", title: "Editar Advertência" },
  { name: "departamento-pessoal/feriados/index", title: "Feriados" },
  { name: "departamento-pessoal/feriados/cadastrar", title: "Cadastrar Feriado" },
  { name: "departamento-pessoal/feriados/calendario", title: "Calendário de Feriados" },
  { name: "departamento-pessoal/feriados/listar", title: "Feriados" },
  { name: "departamento-pessoal/feriados/detalhes/[id]", title: "Detalhes do Feriado" },
  { name: "departamento-pessoal/feriados/editar/[id]", title: "Editar Feriado" },
  { name: "departamento-pessoal/ferias/index", title: "Férias" },
  { name: "departamento-pessoal/ferias/listar", title: "Férias" },
  { name: "departamento-pessoal/ferias/detalhes/[id]", title: "Detalhes das Férias" },
  { name: "departamento-pessoal/ferias/editar/[id]", title: "Editar Férias" },
  // { name: "departamento-pessoal/folha-de-pagamento/index", title: "Folha de Pagamento" }, // Temporarily hidden for testing
  // { name: "departamento-pessoal/folha-de-pagamento/[userId]", title: "Folha de Pagamento" }, // Temporarily hidden for testing
  // { name: "departamento-pessoal/folha-de-pagamento/listar", title: "Folhas de Pagamento" }, // Temporarily hidden for testing
  { name: "departamento-pessoal/niveis-de-desempenho/index", title: "Níveis de Desempenho" },
  { name: "departamento-pessoal/niveis-de-desempenho/listar", title: "Níveis de Desempenho" },
  { name: "departamento-pessoal/setores/listar", title: "Setores" },
  { name: "departamento-pessoal/epi/entregas/index", title: "Entregas EPI" },
  { name: "departamento-pessoal/epi/entregas/cadastrar", title: "Cadastrar Entrega EPI" },
  { name: "departamento-pessoal/epi/entregas/listar", title: "Entregas EPI" },
  { name: "departamento-pessoal/epi/entregas/detalhes/[id]", title: "Detalhes da Entrega EPI" },
  { name: "departamento-pessoal/epi/entregas/editar/[id]", title: "Editar Entrega EPI" },

  // My Team
  { name: "meu-pessoal/index", title: "Meu Pessoal" },
  { name: "meu-pessoal/movimentacoes", title: "Movimentações da Equipe" },
  { name: "meu-pessoal/advertencias", title: "Advertências da Equipe" },
  { name: "meu-pessoal/emprestimos", title: "Empréstimos da Equipe" },
  { name: "meu-pessoal/epis", title: "EPIs da Equipe" },
  { name: "meu-pessoal/epis/detalhes/[id]", title: "Detalhes do EPI" },
  { name: "meu-pessoal/usuarios", title: "Membros da Equipe" },
  { name: "meu-pessoal/calculos", title: "Controle de Ponto" },

  // Minha Equipe (My Team - for team leaders only)
  { name: "minha-equipe/index", title: "Minha Equipe" },
  { name: "minha-equipe/membros/listar", title: "Membros da Equipe" },
  { name: "minha-equipe/membros/detalhes/[id]", title: "Detalhes do Membro" },

  // Personal (User's own information only)
  { name: "pessoal/index", title: "Pessoal" },
  { name: "pessoal/meus-feriados/index", title: "Feriados" },
  { name: "pessoal/meus-feriados/detalhes/[id]", title: "Detalhes do Feriado" },
  { name: "pessoal/meus-epis/index", title: "Meus EPIs" },
  { name: "pessoal/meus-epis/request", title: "Solicitar EPI" },
  { name: "pessoal/meus-epis/detalhes/[id]", title: "Detalhes do EPI" },
  { name: "pessoal/meus-emprestimos/index", title: "Meus Empréstimos" },
  { name: "pessoal/meus-emprestimos/detalhes/[id]", title: "Detalhes do Empréstimo" },
  { name: "pessoal/minhas-movimentacoes/index", title: "Minhas Movimentações" },
  { name: "pessoal/minhas-movimentacoes/listar", title: "Minhas Movimentações" },
  { name: "pessoal/questionarios/index", title: "Questionários" },
  { name: "pessoal/questionarios/preencher/[id]", title: "Questionário" },
  { name: "pessoal/minhas-movimentacoes/detalhes/[id]", title: "Detalhes da Movimentação" },
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
  { name: "pessoal/minhas-mensagens/index", title: "Minhas Mensagens" },
  { name: "pessoal/meus-pontos/index", title: "Meus Pontos" },
  { name: "pessoal/meus-pontos/justificar-ausencia/index", title: "Justificar Ausência" },
  { name: "pessoal/meus-pontos/justificar-ausencia/[date]", title: "Justificar Ausência" },
  { name: "pessoal/meus-pontos/ajustar-ponto/index", title: "Ajustar Ponto" },
  { name: "pessoal/meus-pontos/incluir-ponto/index", title: "Incluir Ponto" },
  { name: "pessoal/meus-pontos/incluir-ponto/capture", title: "Incluir Ponto" },
  { name: "pessoal/meus-pontos/assinaturas/index", title: "Assinatura de Ponto" },
  { name: "pessoal/meus-pontos/assinaturas/[id]", title: "Detalhes da Apuração" },
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
  { name: "financeiro/clientes", title: "Clientes" },
  { name: "financeiro/clientes/index", title: "Clientes" },
  { name: "financeiro/clientes/listar", title: "Clientes" },
  { name: "financeiro/clientes/cadastrar", title: "Cadastrar Cliente" },
  { name: "financeiro/clientes/detalhes/[id]", title: "Detalhes do Cliente" },
  { name: "financeiro/clientes/editar/[id]", title: "Editar Cliente" },
  { name: "financeiro/faturamento", title: "Faturamento" },
  { name: "financeiro/faturamento/index", title: "Faturamento" },
  { name: "financeiro/faturamento/listar", title: "Faturamento" },
  { name: "financeiro/faturamento/detalhes/[id]", title: "Detalhes da Fatura" },
  { name: "financeiro/orcamento", title: "Orçamentos" },
  { name: "financeiro/orcamento/index", title: "Orçamentos" },
  { name: "financeiro/orcamento/listar", title: "Orçamentos" },
  { name: "financeiro/orcamento/detalhes/[taskId]", title: "Detalhes do Orçamento" },
  { name: "financeiro/notas-fiscais", title: "Notas Fiscais" },
  { name: "financeiro/notas-fiscais/index", title: "Notas Fiscais" },
  { name: "financeiro/notas-fiscais/listar", title: "Notas Fiscais" },
  { name: "financeiro/notas-fiscais/detalhes/[id]", title: "Detalhes da NFS-e" },

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
  { name: "servidor/maintenance", title: "Manutenção" },
  { name: "servidor/metricas", title: "Métricas do Sistema" },
  { name: "servidor/resources", title: "Recursos" },
  { name: "servidor/services", title: "Serviços" },
  { name: "servidor/file-manager", title: "Gerenciador de Arquivos" },
  { name: "servidor/status", title: "Status" },
  { name: "servidor/backups/cadastrar", title: "Criar Backup" },
  { name: "servidor/backups/listar", title: "Backups" },
  { name: "servidor/backups/agendamentos", title: "Agendamentos" },
  { name: "servidor/backups/detalhes/[id]", title: "Detalhes do Backup" },

];

// Pre-computed route lookup map for O(1) title lookups instead of O(n) array.find()
// This significantly improves navigation performance, especially on Android
const ROUTE_TITLE_MAP = new Map<string, string>();
ALL_ROUTES.forEach(route => {
  ROUTE_TITLE_MAP.set(route.name, route.title);
});

// Per-route resolution cache. The fallback suffix walk is O(n) over ~400 routes;
// each route is hit many times during navigation, so caching the resolution turns
// the worst case from O(n) per render into O(1) after the first resolution.
const ROUTE_TITLE_CACHE = new Map<string, string>();

/**
 * Fast O(1) route title lookup - replaces O(n) array.find() in screenOptions
 * Handles both normalized route names and (tabs) prefixed routes
 */
function getRouteTitle(routeName: string): string {
  const cached = ROUTE_TITLE_CACHE.get(routeName);
  if (cached !== undefined) return cached;

  // Try direct lookup first (most common case)
  const directTitle = ROUTE_TITLE_MAP.get(routeName);
  if (directTitle) {
    ROUTE_TITLE_CACHE.set(routeName, directTitle);
    return directTitle;
  }

  // Try without (tabs) prefix
  const normalizedName = routeName.replace(/^\(tabs\)\//, '');
  const normalizedTitle = ROUTE_TITLE_MAP.get(normalizedName);
  if (normalizedTitle) {
    ROUTE_TITLE_CACHE.set(routeName, normalizedTitle);
    return normalizedTitle;
  }

  // Try to find by suffix match (for deeply nested dynamic routes)
  for (const [name, title] of ROUTE_TITLE_MAP) {
    if (routeName.endsWith(name)) {
      ROUTE_TITLE_CACHE.set(routeName, title);
      return title;
    }
  }

  // Fallback to normalized name if no title found
  ROUTE_TITLE_CACHE.set(routeName, normalizedName);
  return normalizedName;
}

/**
 * Resolves the header title for a drawer route, descending into nested
 * navigators (e.g. the controle-ponto Stack group) so each sub-screen shows
 * its own title instead of the static group title. Falls back to the group's
 * own title when no nested route is focused or the combined name isn't mapped.
 */
function getHeaderTitleForRoute(route: { name: string }): string {
  const focused = getFocusedRouteNameFromRoute(route as any);
  if (focused) {
    const nested = ROUTE_TITLE_MAP.get(`${route.name}/${focused}`);
    if (nested) return nested;
  }
  return getRouteTitle(route.name);
}

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
    if (['inicio', 'perfil', 'perfil/index', 'configuracoes', 'notifications', 'notifications/index'].includes(path)) {
      return true;
    }

    // Catalogo routes - accessible for team leaders and DESIGNER users (view-only catalog)
    // NOTE: Team leadership is now checked via user.ledSector, not privilege
    if (path === 'catalogo' || path.startsWith('catalogo/')) {
      // Designers get access to the view-only catalog
      if (userPrivileges.includes(SECTOR_PRIVILEGES.DESIGNER)) {
        return true;
      }
      // Team leaders (users who manage a sector) also get access - check at component level
      // For navigation filtering, we allow access and let component verify team leadership
      return false;
    }

    // Check module-based access
    if (userPrivileges.includes(SECTOR_PRIVILEGES.HUMAN_RESOURCES) && path.startsWith('departamento-pessoal/')) {
      return true;
    }
    // PRODUCTION_MANAGER gets read access to specific HR sections
    if (userPrivileges.includes(SECTOR_PRIVILEGES.PRODUCTION_MANAGER)) {
      const pmAllowedHRPaths = [
        'departamento-pessoal/advertencias/',
        'departamento-pessoal/calculos',
        'departamento-pessoal/feriados/',
        // PM gains DP férias (mirrors web PM route access).
        'departamento-pessoal/ferias/',
      ];
      if (pmAllowedHRPaths.some(allowed => path.startsWith(allowed) || path === allowed.replace(/\/$/, ''))) {
        return true;
      }
    }
    if (userPrivileges.includes(SECTOR_PRIVILEGES.PRODUCTION) && path.startsWith('producao/')) {
      // Production sector has limited access - exclude aerografia and garagens
      const restrictedPaths = ['producao/aerografia/', 'producao/garagens/'];
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
    // ACCOUNTING users get financial + personnel-department routes (pessoal/ is already global)
    if (userPrivileges.includes(SECTOR_PRIVILEGES.ACCOUNTING) && (
      path.startsWith('financeiro/') ||
      path.startsWith('departamento-pessoal/')
    )) {
      return true;
    }
    // COMMERCIAL users can access financial routes and responsible/customer routes
    if (userPrivileges.includes(SECTOR_PRIVILEGES.COMMERCIAL) && path.startsWith('financeiro/')) {
      return true;
    }
    if (userPrivileges.includes(SECTOR_PRIVILEGES.COMMERCIAL) && (
      path.startsWith('administracao/responsaveis/') ||
      path.startsWith('administracao/clientes/')
    )) {
      return true;
    }
    // PRODUCTION_MANAGER can manage messages in mobile
    if (userPrivileges.includes(SECTOR_PRIVILEGES.PRODUCTION_MANAGER) && path.startsWith('administracao/mensagens')) {
      return true;
    }
    // NOTE: Team leader routes (meu-pessoal/) are now filtered at component level
    // via isTeamLeader() check, not by privilege. Remove privilege-based filter.
    // Note: DESIGNER users should use /catalogo (view-only) instead of /pintura
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

// Notification Bell component for header - opens notification drawer
const NotificationBell = React.memo(function NotificationBell({ color, onPress }: { color: string; onPress: () => void }) {
  const { count, isLoading } = useUnreadNotificationsCount();
  const { isDark } = useTheme();

  const handlePress = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.headerButton,
        pressed && { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }
      ]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View>
        <Icon name="bell" size="md" color={color} />
        {!isLoading && count > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText} numberOfLines={1}>
              {count > 99 ? '99+' : String(count)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

// Extracted HeaderBackButton component to prevent unmount/remount on every render
interface HeaderBackButtonProps {
  routeName: string;
  goBack: () => void;
  isNavigatingRef: React.RefObject<boolean>;
  startNavigation: () => void;
  isDark: boolean;
  headerText: string;
  buttonPressed: string;
}

const HeaderBackButton = React.memo(function HeaderBackButton({
  routeName,
  goBack,
  isNavigatingRef,
  startNavigation,
  isDark,
  headerText,
  buttonPressed,
}: HeaderBackButtonProps) {
  // Use route.name from screenOptions — synchronously correct, not stale like pathname
  const showBackButton = routeName !== 'inicio';

  if (!showBackButton) {
    // Add spacing even when there's no back button for consistency
    return <View style={{ width: Platform.OS === 'ios' ? 24 : 20 }} />;
  }

  return (
    <View
      style={{ paddingLeft: Platform.OS === 'ios' ? 12 : 8 }}
    >
      <Pressable
        onPress={() => {
          // Haptic feedback for immediate tactile response
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

          // Show loading overlay for visual feedback
          if (!isNavigatingRef.current) {
            startNavigation();
          }

          // Run goBack() SYNCHRONOUSLY — do NOT defer (rAF or setTimeout). On
          // RN 0.81 New Architecture an idle run loop pauses timers, so a
          // deferred goBack is stranded until a native event wakes the thread —
          // the stuck overlay. This onPress is an active native event, so the
          // back navigation flushes here.
          // Delegate to NavigationHistoryContext.goBack() which uses history
          // when available, or computes the parent route from the current pathname
          goBack();
        }}
        style={({ pressed }) => [
          styles.headerButton,
          pressed && { backgroundColor: buttonPressed },
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
  );
});

// Extracted HeaderRightButtons component to prevent unmount/remount on every render
interface HeaderRightButtonsProps {
  headerText: string;
  buttonPressed: string;
  isDark: boolean;
  openNotificationsDrawer: (navigation: any) => void;
  openMenuDrawer: (navigation: any) => void;
  navigation: any;
}

const HeaderRightButtons = React.memo(function HeaderRightButtons({
  headerText,
  buttonPressed,
  isDark,
  openNotificationsDrawer,
  openMenuDrawer,
  navigation,
}: HeaderRightButtonsProps) {
  return (
    <View style={styles.headerRight}>
      <View>
        <NotificationBell
          color={headerText}
          onPress={() => {
            openNotificationsDrawer(navigation);
          }}
        />
      </View>
      <View>
        <Pressable
          onPress={() => {
            openMenuDrawer(navigation);
          }}
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
    </View>
  );
});

// Inner layout component that uses drawer mode context
function InnerLayout() {
  const { user, isAuthReady, isLoading, isLoggingOut, silentRefreshUserData } = useAuth();
  const { theme, isDark } = useTheme();
  const nav = useNav();
  const { canGoBack, goBack } = nav;
  const { startNavigation, isNavigatingRef } = useNavigationLoading();
  const insets = useSafeAreaInsets();
  const hasRedirectedToLogin = useRef(false);
  const hasRedirectedToPasswordChange = useRef(false);
  const { setDrawerMode } = useDrawerMode();
  const lastSeenUserIdRef = useRef<string | null>(null);
  const hasRefreshedOnMountRef = useRef(false);

  // CRITICAL: Refresh user data when this screen gains focus.
  // After login, state updates from login() may not propagate to this
  // screen due to React Navigation's screen caching/restoration behavior
  // across await boundaries. This replicates the AppState "active" →
  // validateSession flow that makes minimize/maximize work.
  useFocusEffect(
    useCallback(() => {
      const currentUserId = user?.id ?? null;
      if (!currentUserId) return;

      const isNewUser = lastSeenUserIdRef.current !== currentUserId;
      lastSeenUserIdRef.current = currentUserId;

      if (isNewUser || !hasRefreshedOnMountRef.current) {
        // Either: first focus after mount, OR user switched accounts.
        // Fire a silent refresh to guarantee the component tree has the
        // very latest user data — this is the same mechanism that makes
        // minimize/maximize fix stale data.
        hasRefreshedOnMountRef.current = true;
        console.log('[InnerLayout] Refreshing user data on focus (newUser:', isNewUser, ')');
        silentRefreshUserData();
      }
    }, [user?.id, silentRefreshUserData])
  );

  // Cast user to ExtendedUser for type safety
  const extUser = user as ExtendedUser | null;

  // Use primitive deps to prevent recomputation when user object reference changes
  const sectorPrivilege = extUser?.sector?.privileges;
  const userSectorsKey = extUser?.sectors?.map((s: any) => s.privilege).join(',');

  // Get user privileges - check both sector and sectors for compatibility
  // Must be called before any conditional returns (React hooks rules)
  const userPrivileges = useMemo(() => {
    if (sectorPrivilege) {
      return [sectorPrivilege];
    }
    if (userSectorsKey) {
      return userSectorsKey.split(',') as SECTOR_PRIVILEGES[];
    }
    return [SECTOR_PRIVILEGES.BASIC];
  }, [sectorPrivilege, userSectorsKey]);

  // Get accessible routes based on privileges
  // Must be called before any conditional returns (React hooks rules)
  const hasUser = !!user;
  const accessibleRoutes = useMemo(() => {
    if (!hasUser) return []; // Return empty if no user
    const routes = getAccessibleRoutes(userPrivileges, extUser);
    console.log(`[PRIVILEGE-NAV] User has access to ${routes.length} routes out of ${ALL_ROUTES.length}`);
    return routes;
    // extUser is intentionally excluded from deps — userPrivileges already captures privilege changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPrivileges, hasUser]);

  // Memoized drawer colors - matching theme palette
  // Must be called before any conditional returns (React hooks rules)
  const drawerColors = useMemo(() => ({
    background: isDark ? "#212121" : "#fafafa", // Drawer uses slightly different shade
    text: isDark ? "#d9d9d9" : "#404040", // foreground colors
    activeText: "#ffffff",
    active: "#15803d", // primary color (green-700)
  }), [isDark]);

  // Pre-compute all header style primitives. Keeping these as stable refs by isDark
  // means screenOptions doesn't allocate new objects/strings per call per route.
  const headerStyles = useMemo(() => {
    const headerBackground = isDark ? "#262626" : "#fafafa";
    const headerText = isDark ? "#d9d9d9" : "#404040";
    const headerBorder = isDark ? "#3a3a3a" : "#e3e3e3";
    const buttonPressed = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)";
    const sceneBackground = isDark ? "#1c1c1c" : "#e8e8e8";

    return {
      headerBackground,
      headerText,
      headerBorder,
      buttonPressed,
      sceneBackground,
      headerTitleStyle: {
        color: headerText,
        fontSize: 18,
        fontWeight: "600" as const,
      },
      headerStyle: {
        backgroundColor: headerBackground,
        borderBottomWidth: 1,
        borderBottomColor: headerBorder,
        elevation: 0,
        shadowOpacity: 0,
      },
      drawerStyle: {
        backgroundColor: drawerColors.background,
        width: 280,
      },
      contentStyle: {
        backgroundColor: sceneBackground,
      },
      sceneContainerStyle: {
        backgroundColor: sceneBackground,
        paddingHorizontal: Platform.OS === 'ios' ? 16 : 12,
      },
    };
  }, [isDark, drawerColors.background]);

  // Handle authentication redirect at the root level
  //
  // CRITICAL: these forced auth redirects use the RAW expo-router `router.replace`
  // instead of `nav.replace`. `nav.replace` routes through `navigateWithLoading`,
  // which silently drops a navigation when `isNavigatingRef` is already true
  // (its anti-double-tap guard). On a stale-token cold start the root `index`
  // screen fires `nav.replace('/inicio')` first (optimistic, from cached user) and
  // leaves that guard set; the /me 401 then clears the session, this layout mounts
  // with user=null, and its `nav.replace(login)` was being swallowed by that guard
  // — while `hasRedirectedToLogin` latched true, so it never retried. The result
  // was a permanent "Carregando..." hang. A security redirect must never be
  // dropped, so it bypasses the double-tap guard. The destination's pathname
  // change auto-hides any overlay index left up.
  useEffect(() => {
    // Don't redirect if we already did
    if (hasRedirectedToLogin.current) return;

    // Wait for auth to be ready
    if (!isAuthReady || isLoading) return;

    // Forced password change backstop: the API guard 403s every protected
    // request while `requirePasswordChange` is set. Covers restored sessions
    // (the login screen handles the fresh-login case directly). Once the flag
    // clears (after a successful change + user refresh), the reset effect below
    // re-arms this so it can fire again on a future requirement.
    if (user) {
      if ((user as any).requirePasswordChange) {
        if (!hasRedirectedToPasswordChange.current) {
          hasRedirectedToPasswordChange.current = true;
          router.replace(authRoute(routes.authentication.changePassword) as any);
        }
      } else {
        hasRedirectedToPasswordChange.current = false;
      }
      return;
    }

    // An explicit/forced logout is definitive — redirect immediately WITHOUT
    // reading the stored token. The async token read races the logout's own
    // async storage-clear: it usually still sees the token, takes the
    // "waiting for session restore" branch, and then never re-runs (token
    // clearing is not a React dep), leaving the gate stuck on "Carregando...".
    if (isLoggingOut) {
      hasRedirectedToLogin.current = true;
      console.log("[PrivilegeLayout] Logout in progress, redirecting to login");
      router.replace(authRoute(routes.authentication.login) as any);
      return;
    }

    // user is null without an explicit logout. Before redirecting, confirm there
    // is no stored token: a transient null user with a valid token (background
    // re-validation / recovery) must NOT be bounced to login — only a genuinely
    // tokenless state is a real logout.
    let cancelled = false;
    (async () => {
      const token = await getStoredToken();
      if (cancelled || hasRedirectedToLogin.current) return;
      if (!token) {
        hasRedirectedToLogin.current = true;
        console.log("[PrivilegeLayout] No user and no token, redirecting to login");
        // Use replace to prevent back navigation to protected screens
        router.replace(authRoute(routes.authentication.login) as any);
      } else {
        console.log("[PrivilegeLayout] No user but token present — waiting for session restore");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isAuthReady, isLoading, isLoggingOut, nav]);

  // Reset redirect flag when user logs in (so we can redirect again on next logout)
  useEffect(() => {
    if (user && hasRedirectedToLogin.current) {
      hasRedirectedToLogin.current = false;
    }
  }, [user]);

  // Timestamp-based debounce for drawer operations (100ms)
  const lastDrawerOpenRef = useRef(0);
  // Set true on AppState 'active' to force the next openDrawer call to first
  // dispatch a close. After backgrounding, React Navigation's drawer state
  // sometimes desynchronizes from the rendered UI (state believes the drawer
  // is already open, so an `openDrawer` dispatch becomes a no-op — which is
  // exactly the "menu button doesn't open the drawer after resume" symptom).
  // Dispatching close first puts the reducer back into the known-closed
  // branch so the subsequent open reliably triggers the animation.
  const needsDrawerResetRef = useRef(false);

  // Robustly dispatch open-drawer. If we just came back from background, do
  // a close→RAF→open dance to reset state. Swipe-to-open never had this bug
  // because the gesture interpolates progress directly; only the imperative
  // dispatch hits the desync.
  const robustOpenDrawer = useCallback((navigation: any) => {
    if (needsDrawerResetRef.current) {
      needsDrawerResetRef.current = false;
      try {
        navigation.dispatch(DrawerActions.closeDrawer());
      } catch {}
      requestAnimationFrame(() => {
        try {
          navigation.dispatch(DrawerActions.openDrawer());
        } catch {}
      });
      return;
    }
    navigation.dispatch(DrawerActions.openDrawer());
  }, []);

  // Handler to open notifications drawer
  // IMPORTANT: These hooks must be called BEFORE any conditional returns to avoid
  // "Rendered fewer hooks than expected" error when user logs out
  const openNotificationsDrawer = useCallback((navigation: any) => {
    const now = Date.now();
    if (now - lastDrawerOpenRef.current < 100) return;
    lastDrawerOpenRef.current = now;
    setDrawerMode('notifications');
    robustOpenDrawer(navigation);
  }, [setDrawerMode, robustOpenDrawer]);

  // Handler to open menu drawer
  const openMenuDrawer = useCallback((navigation: any) => {
    const now = Date.now();
    if (now - lastDrawerOpenRef.current < 100) return;
    lastDrawerOpenRef.current = now;
    setDrawerMode('menu');
    robustOpenDrawer(navigation);
  }, [setDrawerMode, robustOpenDrawer]);

  // Reset stale state when app returns from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Reset debounce so drawer can open immediately after returning,
        // and arm the close-then-open reset for the next user-initiated tap.
        lastDrawerOpenRef.current = 0;
        needsDrawerResetRef.current = true;
      }
    });
    return () => subscription.remove();
  }, []);

  // Stable screenOptions factory. Memoized so React Navigation receives the same
  // function reference across renders, and the returned option objects reuse the
  // same memoized style objects. This is the single biggest fix for transition
  // jank: previously every render of InnerLayout rebuilt headerStyle/drawerStyle/
  // headerLeft/headerRight for every screen.
  const screenOptions = useCallback(
    ({ navigation, route }: { navigation: any; route: any }) => ({
      headerTitle: getHeaderTitleForRoute(route),
      headerTitleAlign: 'center' as const,
      headerTitleStyle: headerStyles.headerTitleStyle,
      headerStyle: headerStyles.headerStyle,
      // Disable drawer swipe on notifications screen to allow notification item swipes
      swipeEnabled: !route.name.includes('notifications'),
      headerLeft: () => {
        // Back-navigation strategy:
        // Use the custom-history goBack first — it tracks every pathname
        // change via usePathname and pops the most-recent entry, falling
        // back to `computeParentRoute(current)` when the history is shallow.
        // For deep drawer routes like
        //   /pessoal/meus-pontos/justificar-ausencia
        // react-navigation's `navigation.goBack()` sometimes dismisses the
        // entire chain back to the initial drawer route (inicio), which
        // leaves the tutorial flow stranded. The custom history reliably
        // returns to /pessoal/meus-pontos in that case. We still fall back
        // to `navigation.goBack()` when the custom history has no idea —
        // but only when canGoBack is true *and* we're at a fresh route.
        const onBack = () => {
          if (canGoBack()) {
            goBack();
            return;
          }
          if (navigation.canGoBack && navigation.canGoBack()) {
            navigation.goBack();
          } else {
            goBack();
          }
        };
        return (
          <HeaderBackButton
            routeName={route.name}
            goBack={onBack}
            isNavigatingRef={isNavigatingRef}
            startNavigation={startNavigation}
            isDark={isDark}
            headerText={headerStyles.headerText}
            buttonPressed={headerStyles.buttonPressed}
          />
        );
      },
      headerRight: () => (
        <HeaderRightButtons
          headerText={headerStyles.headerText}
          buttonPressed={headerStyles.buttonPressed}
          isDark={isDark}
          openNotificationsDrawer={openNotificationsDrawer}
          openMenuDrawer={openMenuDrawer}
          navigation={navigation}
        />
      ),
      drawerPosition: 'right' as const,
      drawerStyle: headerStyles.drawerStyle,
      drawerActiveTintColor: drawerColors.activeText,
      drawerActiveBackgroundColor: drawerColors.active,
      drawerInactiveTintColor: drawerColors.text,
      contentStyle: headerStyles.contentStyle,
      sceneContainerStyle: headerStyles.sceneContainerStyle,
      unmountOnBlur: false,
      // BLANK-SCREEN FIX: on RN 0.81 New Architecture, detaching/freezing
      // inactive drawer screens makes react-native-screens fail to re-attach /
      // re-render the target screen on focus — you land on a section but see the
      // PREVIOUS section's header over a blank body. Keeping inactive screens
      // attached and live (no detach, no freeze) makes the native screen stack
      // stay in sync with the router, eliminating the stale/blank presentation.
      // The KeepAlivePump already keeps the JS thread ticking, so the off-screen
      // render work this re-enables no longer causes the animation jank that the
      // freeze was originally added to avoid.
      detachInactiveScreens: false,
      freezeOnBlur: false,
    }),
    [
      headerStyles,
      drawerColors.activeText,
      drawerColors.active,
      drawerColors.text,
      goBack,
      isNavigatingRef,
      startNavigation,
      isDark,
      openNotificationsDrawer,
      openMenuDrawer,
    ],
  );

  const renderDrawerContent = useCallback(
    (props: any) => (
      <Suspense fallback={<LoadingScreen />}>
        <CombinedDrawerContent {...props} />
      </Suspense>
    ),
    [],
  );

  // Show loading screen while auth is being determined or during logout redirect.
  // MUST come after all hooks above — early-returning before any hook causes
  // "Rendered fewer hooks than expected" on the next render that takes the
  // happy path (e.g. user logs back in).
  if (!isAuthReady || isLoading || !user) {
    return <LoadingScreen />;
  }

  return (
    // CRITICAL: Key the entire Drawer by user ID to force complete destruction and
    // recreation when switching accounts. React Navigation caches drawer content
    // internally (via the render prop and detachInactiveScreens), so keying just
    // the child component inside drawerContent is insufficient — the render prop
    // itself may not be re-invoked. Keying the Drawer ensures the entire navigator
    // (all screens, drawer content, internal state) is rebuilt from scratch.
    <Drawer
      key={`drawer-${user?.id}`}
      drawerContent={renderDrawerContent}
      screenOptions={screenOptions}
    >
      {/* Let Expo Router auto-discover routes from file system */}
      {/* Don't manually register routes - this causes "property is not configurable" error */}
    </Drawer>
  );
}

// Main optimized drawer layout with full menu structure
// Wraps InnerLayout with DrawerModeProvider
export function PrivilegeLayout() {
  return (
    <DrawerModeProvider>
      <InnerLayout />
    </DrawerModeProvider>
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
    gap: 8, // Gap between notification bell and menu
    paddingRight: Platform.OS === 'ios' ? 16 : 12, // More padding from edge
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -6,
    backgroundColor: '#dc2626',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 11,
  },
});

export default PrivilegeLayout;