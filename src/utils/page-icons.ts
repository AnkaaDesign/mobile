import {
  IconPackage,
  IconUsers,
  IconBriefcase,
  IconAlertTriangle,
  IconBuildingSkyscraper,
  IconClipboardList,
  IconTool,
  IconPaint,
  IconBrush,
  IconBeach,
  IconHistory,
  IconScissors,
  IconBuildingWarehouse,
  IconArchive,
  IconTruck,
  IconTag,
  IconShoppingCart,
  IconCalendarEvent,
  IconRepeat,
  IconBell,
  IconFile,
  IconFlask,
  IconPalette,
  IconCoins,
  IconFileInvoice,
  IconShield,
  IconNote,
  IconCalendar,
  IconTools,
  IconRuler,
  IconStar,
  IconHome,
  IconActivity,
  IconMessageCircle,
  IconChartBar,
} from "@tabler/icons-react-native";
import type { Icon } from "@tabler/icons-react-native";
import { FAVORITE_PAGES } from '../constants';

// Path prefix to icon mapping for dynamic routes
const PATH_PREFIX_ICON_MAP: Array<{ prefix: string; icon: Icon; color: string }> = [
  // Home
  { prefix: "/", icon: IconHome, color: "#3b82f6" },

  // Produção
  { prefix: "/producao/agenda", icon: IconClipboardList, color: "#f59e0b" },
  { prefix: "/producao/cronograma", icon: IconClipboardList, color: "#3b82f6" },
  { prefix: "/producao/barracoes", icon: IconBuildingWarehouse, color: "#64748b" },
  { prefix: "/producao/garagens", icon: IconBuildingWarehouse, color: "#64748b" },
  { prefix: "/producao/historico", icon: IconHistory, color: "#6b7280" },
  { prefix: "/producao/recorte", icon: IconScissors, color: "#a855f7" },
  { prefix: "/producao/observacoes", icon: IconNote, color: "#14b8a6" },
  { prefix: "/producao/aerografia", icon: IconBrush, color: "#ec4899" },
  { prefix: "/producao/servicos", icon: IconTools, color: "#f97316" },
  { prefix: "/producao/ordens-de-servico", icon: IconClipboardList, color: "#2563eb" },
  { prefix: "/producao/dashboard", icon: IconChartBar, color: "#3b82f6" },
  { prefix: "/producao", icon: IconClipboardList, color: "#3b82f6" },

  // Estoque
  { prefix: "/estoque/movimentacoes", icon: IconArchive, color: "#22c55e" },
  { prefix: "/estoque/produtos/categorias", icon: IconTag, color: "#10b981" },
  { prefix: "/estoque/produtos/marcas", icon: IconTag, color: "#10b981" },
  { prefix: "/estoque/produtos", icon: IconPackage, color: "#16a34a" },
  { prefix: "/estoque/fornecedores", icon: IconTruck, color: "#06b6d4" },
  { prefix: "/estoque/pedidos/agendamentos", icon: IconCalendarEvent, color: "#60a5fa" },
  { prefix: "/estoque/pedidos/automaticos", icon: IconRepeat, color: "#3b82f6" },
  { prefix: "/estoque/pedidos", icon: IconShoppingCart, color: "#3b82f6" },
  { prefix: "/estoque/manutencao/agendamentos", icon: IconCalendar, color: "#ef4444" },
  { prefix: "/estoque/manutencao", icon: IconTool, color: "#dc2626" },
  { prefix: "/estoque/retiradas-externas", icon: IconArchive, color: "#f97316" },
  { prefix: "/estoque/epi/entregas", icon: IconShield, color: "#fbbf24" },
  { prefix: "/estoque/epi/agendamentos", icon: IconCalendar, color: "#fbbf24" },
  { prefix: "/estoque/epi", icon: IconShield, color: "#eab308" },
  { prefix: "/estoque/emprestimos", icon: IconRepeat, color: "#a855f7" },
  { prefix: "/estoque", icon: IconPackage, color: "#22c55e" },

  // Pintura
  { prefix: "/pintura/catalogo", icon: IconPaint, color: "#6366f1" },
  { prefix: "/pintura/producoes", icon: IconFlask, color: "#818cf8" },
  { prefix: "/pintura/formulas", icon: IconFlask, color: "#6366f1" },
  { prefix: "/pintura/formulacoes", icon: IconFlask, color: "#6366f1" },
  { prefix: "/pintura/componentes", icon: IconFlask, color: "#6366f1" },
  { prefix: "/pintura/tipos-de-tinta", icon: IconPalette, color: "#818cf8" },
  { prefix: "/pintura/dashboard", icon: IconChartBar, color: "#6366f1" },
  { prefix: "/pintura", icon: IconPaint, color: "#6366f1" },

  // Administração
  { prefix: "/administracao/comissoes", icon: IconCoins, color: "#22c55e" },
  { prefix: "/administracao/clientes", icon: IconUsers, color: "#f97316" },
  { prefix: "/administracao/colaboradores", icon: IconUsers, color: "#a855f7" },
  { prefix: "/administracao/orcamentos", icon: IconFileInvoice, color: "#3b82f6" },
  { prefix: "/administracao/registros-de-alteracoes", icon: IconHistory, color: "#6b7280" },
  { prefix: "/administracao/arquivos", icon: IconFile, color: "#4b5563" },
  { prefix: "/administracao/setores", icon: IconBuildingSkyscraper, color: "#14b8a6" },
  { prefix: "/administracao/notificacoes", icon: IconBell, color: "#ef4444" },
  { prefix: "/administracao/mensagens", icon: IconMessageCircle, color: "#3b82f6" },
  { prefix: "/administracao", icon: IconBuildingSkyscraper, color: "#14b8a6" },

  // Recursos Humanos
  { prefix: "/recursos-humanos/cargos", icon: IconBriefcase, color: "#a855f7" },
  { prefix: "/recursos-humanos/ferias", icon: IconBeach, color: "#3b82f6" },
  { prefix: "/recursos-humanos/feriados", icon: IconCalendar, color: "#f97316" },
  { prefix: "/recursos-humanos/avisos", icon: IconAlertTriangle, color: "#ef4444" },
  { prefix: "/recursos-humanos/epi/entregas", icon: IconShield, color: "#fbbf24" },
  { prefix: "/recursos-humanos/epi/agendamentos", icon: IconCalendar, color: "#fbbf24" },
  { prefix: "/recursos-humanos/epi", icon: IconShield, color: "#eab308" },
  { prefix: "/recursos-humanos/setores", icon: IconBuildingSkyscraper, color: "#14b8a6" },
  { prefix: "/recursos-humanos", icon: IconUsers, color: "#a855f7" },

  // Pessoal
  { prefix: "/pessoal/feriados", icon: IconCalendar, color: "#f97316" },
  { prefix: "/pessoal/ferias", icon: IconBeach, color: "#3b82f6" },
  { prefix: "/pessoal/meus-epis", icon: IconShield, color: "#eab308" },
  { prefix: "/pessoal/meus-emprestimos", icon: IconRepeat, color: "#a855f7" },
  { prefix: "/pessoal/minhas-atividades", icon: IconActivity, color: "#22c55e" },
  { prefix: "/pessoal", icon: IconUsers, color: "#3b82f6" },

  // Estatísticas
  { prefix: "/estatisticas", icon: IconChartBar, color: "#3b82f6" },

  // Favoritos
  { prefix: "/favoritos", icon: IconStar, color: "#eab308" },
];

// Get icon and color for a page by path (supports dynamic routes)
export function getIconInfoByPath(path: string): { icon: Icon; color: string } {
  // Exact match for home
  if (path === "/" || path === "") {
    return { icon: IconHome, color: "#3b82f6" };
  }

  // Find the most specific matching prefix (longer prefix = more specific)
  let bestMatch: { icon: Icon; color: string } | null = null;
  let bestMatchLength = 0;

  for (const entry of PATH_PREFIX_ICON_MAP) {
    if (path.startsWith(entry.prefix) && entry.prefix.length > bestMatchLength) {
      bestMatch = { icon: entry.icon, color: entry.color };
      bestMatchLength = entry.prefix.length;
    }
  }

  if (bestMatch) {
    return bestMatch;
  }

  return { icon: IconFile, color: "#6b7280" };
}

// Map of page paths to icons and colors
export const PAGE_ICON_MAP: Record<string, { icon: Icon; color: string }> = {
  // Produção
  [FAVORITE_PAGES.PRODUCAO_CRONOGRAMA_LISTAR]: { icon: IconClipboardList, color: "bg-blue-500" },
  [FAVORITE_PAGES.PRODUCAO_CRONOGRAMA_CADASTRAR]: { icon: IconClipboardList, color: "bg-blue-600" },
  // [FAVORITE_PAGES.PRODUCAO_EM_ESPERA_LISTAR]: { icon: IconHourglass, color: "bg-yellow-500" },
  [FAVORITE_PAGES.PRODUCAO_HISTORICO_LISTAR]: { icon: IconHistory, color: "bg-gray-500" },
  [FAVORITE_PAGES.PRODUCAO_RECORTE_LISTAR]: { icon: IconScissors, color: "bg-purple-500" },
  [FAVORITE_PAGES.PRODUCAO_GARAGENS_LISTAR]: { icon: IconBuildingWarehouse, color: "bg-indigo-500" },
  [FAVORITE_PAGES.PRODUCAO_GARAGENS_CADASTRAR]: { icon: IconBuildingWarehouse, color: "bg-indigo-600" },
  [FAVORITE_PAGES.PRODUCAO_OBSERVACOES_LISTAR]: { icon: IconNote, color: "bg-teal-500" },
  [FAVORITE_PAGES.PRODUCAO_OBSERVACOES_CADASTRAR]: { icon: IconNote, color: "bg-teal-600" },
  [FAVORITE_PAGES.PRODUCAO_AEROGRAFIA_LISTAR]: { icon: IconBrush, color: "bg-pink-500" },
  [FAVORITE_PAGES.PRODUCAO_AEROGRAFIA_CADASTRAR]: { icon: IconBrush, color: "bg-pink-600" },
  [FAVORITE_PAGES.PRODUCAO_SERVICOS_LISTAR]: { icon: IconTools, color: "bg-orange-500" },
  [FAVORITE_PAGES.PRODUCAO_SERVICOS_CADASTRAR]: { icon: IconTools, color: "bg-orange-600" },

  // Estoque
  [FAVORITE_PAGES.ESTOQUE_MOVIMENTACOES_LISTAR]: { icon: IconArchive, color: "bg-green-500" },
  [FAVORITE_PAGES.ESTOQUE_MOVIMENTACOES_CADASTRAR]: { icon: IconArchive, color: "bg-green-600" },
  [FAVORITE_PAGES.ESTOQUE_PRODUTOS_LISTAR]: { icon: IconPackage, color: "bg-green-600" },
  [FAVORITE_PAGES.ESTOQUE_PRODUTOS_CADASTRAR]: { icon: IconPackage, color: "bg-green-700" },
  [FAVORITE_PAGES.ESTOQUE_PRODUTOS_CATEGORIAS_LISTAR]: { icon: IconTag, color: "bg-emerald-500" },
  [FAVORITE_PAGES.ESTOQUE_PRODUTOS_CATEGORIAS_CADASTRAR]: { icon: IconTag, color: "bg-emerald-600" },
  [FAVORITE_PAGES.ESTOQUE_PRODUTOS_MARCAS_LISTAR]: { icon: IconTag, color: "bg-emerald-500" },
  [FAVORITE_PAGES.ESTOQUE_PRODUTOS_MARCAS_CADASTRAR]: { icon: IconTag, color: "bg-emerald-600" },
  [FAVORITE_PAGES.ESTOQUE_FORNECEDORES_LISTAR]: { icon: IconTruck, color: "bg-cyan-500" },
  [FAVORITE_PAGES.ESTOQUE_FORNECEDORES_CADASTRAR]: { icon: IconTruck, color: "bg-cyan-600" },
  [FAVORITE_PAGES.ESTOQUE_PEDIDOS_LISTAR]: { icon: IconShoppingCart, color: "bg-blue-500" },
  [FAVORITE_PAGES.ESTOQUE_PEDIDOS_CADASTRAR]: { icon: IconShoppingCart, color: "bg-blue-600" },
  [FAVORITE_PAGES.ESTOQUE_PEDIDOS_AGENDAMENTOS_LISTAR]: { icon: IconCalendarEvent, color: "bg-blue-400" },
  [FAVORITE_PAGES.ESTOQUE_PEDIDOS_AGENDAMENTOS_CADASTRAR]: { icon: IconCalendarEvent, color: "bg-blue-500" },
  [FAVORITE_PAGES.ESTOQUE_MANUTENCAO_LISTAR]: { icon: IconTool, color: "bg-red-600" },
  [FAVORITE_PAGES.ESTOQUE_MANUTENCAO_CADASTRAR]: { icon: IconTool, color: "bg-red-700" },
  [FAVORITE_PAGES.ESTOQUE_MANUTENCAO_AGENDAMENTOS_LISTAR]: { icon: IconCalendar, color: "bg-red-500" },
  [FAVORITE_PAGES.ESTOQUE_MANUTENCAO_AGENDAMENTOS_CADASTRAR]: { icon: IconCalendar, color: "bg-red-600" },
  [FAVORITE_PAGES.ESTOQUE_RETIRADAS_EXTERNAS_LISTAR]: { icon: IconArchive, color: "bg-orange-500" },
  [FAVORITE_PAGES.ESTOQUE_RETIRADAS_EXTERNAS_CADASTRAR]: { icon: IconArchive, color: "bg-orange-600" },
  [FAVORITE_PAGES.ESTOQUE_EPI_LISTAR]: { icon: IconShield, color: "bg-yellow-500" },
  [FAVORITE_PAGES.ESTOQUE_EPI_CADASTRAR]: { icon: IconShield, color: "bg-yellow-600" },
  [FAVORITE_PAGES.ESTOQUE_EPI_ENTREGAS_LISTAR]: { icon: IconShield, color: "bg-yellow-400" },
  [FAVORITE_PAGES.ESTOQUE_EPI_ENTREGAS_CADASTRAR]: { icon: IconShield, color: "bg-yellow-500" },
  [FAVORITE_PAGES.ESTOQUE_EPI_AGENDAMENTOS_LISTAR]: { icon: IconCalendar, color: "bg-yellow-400" },
  [FAVORITE_PAGES.ESTOQUE_EPI_AGENDAMENTOS_CADASTRAR]: { icon: IconCalendar, color: "bg-yellow-500" },
  [FAVORITE_PAGES.ESTOQUE_EMPRESTIMOS_LISTAR]: { icon: IconRepeat, color: "bg-purple-500" },
  [FAVORITE_PAGES.ESTOQUE_EMPRESTIMOS_CADASTRAR]: { icon: IconRepeat, color: "bg-purple-600" },

  // Pintura
  [FAVORITE_PAGES.PINTURA_CATALOGO_LISTAR]: { icon: IconPaint, color: "bg-indigo-500" },
  [FAVORITE_PAGES.PINTURA_CATALOGO_CADASTRAR]: { icon: IconPaint, color: "bg-indigo-600" },
  [FAVORITE_PAGES.PINTURA_PRODUCOES_LISTAR]: { icon: IconFlask, color: "bg-indigo-400" },
  [FAVORITE_PAGES.PINTURA_FORMULAS_LISTAR]: { icon: IconFlask, color: "bg-indigo-500" },
  [FAVORITE_PAGES.PINTURA_FORMULAS_CADASTRAR]: { icon: IconFlask, color: "bg-indigo-600" },
  [FAVORITE_PAGES.PINTURA_TIPOS_TINTA_LISTAR]: { icon: IconPalette, color: "bg-indigo-400" },
  [FAVORITE_PAGES.PINTURA_TIPOS_TINTA_CADASTRAR]: { icon: IconPalette, color: "bg-indigo-500" },

  // Administração
  [FAVORITE_PAGES.ADMINISTRACAO_COMISSOES_LISTAR]: { icon: IconCoins, color: "bg-green-500" },
  [FAVORITE_PAGES.ADMINISTRACAO_CLIENTES_LISTAR]: { icon: IconUsers, color: "bg-orange-500" },
  [FAVORITE_PAGES.ADMINISTRACAO_CLIENTES_CADASTRAR]: { icon: IconUsers, color: "bg-orange-600" },
  [FAVORITE_PAGES.ADMINISTRACAO_COLABORADORES_LISTAR]: { icon: IconUsers, color: "bg-purple-500" },
  [FAVORITE_PAGES.ADMINISTRACAO_COLABORADORES_CADASTRAR]: { icon: IconUsers, color: "bg-purple-600" },
  [FAVORITE_PAGES.ADMINISTRACAO_ORCAMENTOS_LISTAR]: { icon: IconFileInvoice, color: "bg-blue-500" },
  [FAVORITE_PAGES.ADMINISTRACAO_ORCAMENTOS_CADASTRAR]: { icon: IconFileInvoice, color: "bg-blue-600" },
  [FAVORITE_PAGES.ADMINISTRACAO_REGISTROS_ALTERACOES_LISTAR]: { icon: IconHistory, color: "bg-gray-500" },
  [FAVORITE_PAGES.ADMINISTRACAO_ARQUIVOS_LISTAR]: { icon: IconFile, color: "bg-gray-600" },
  [FAVORITE_PAGES.ADMINISTRACAO_SETORES_LISTAR]: { icon: IconBuildingSkyscraper, color: "bg-teal-500" },
  [FAVORITE_PAGES.ADMINISTRACAO_SETORES_CADASTRAR]: { icon: IconBuildingSkyscraper, color: "bg-teal-600" },
  [FAVORITE_PAGES.ADMINISTRACAO_NOTIFICACOES_LISTAR]: { icon: IconBell, color: "bg-red-500" },
  //   [FAVORITE_PAGES.ADMINISTRACAO_NOTIFICACOES_ENVIAR]: { icon: IconBell, color: "bg-red-600" },

  // Recursos Humanos
  [FAVORITE_PAGES.RECURSOS_HUMANOS_CARGOS_LISTAR]: { icon: IconBriefcase, color: "bg-purple-500" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_CARGOS_CADASTRAR]: { icon: IconBriefcase, color: "bg-purple-600" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_FERIAS_LISTAR]: { icon: IconBeach, color: "bg-blue-500" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_FERIAS_CADASTRAR]: { icon: IconBeach, color: "bg-blue-600" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_FERIADOS_LISTAR]: { icon: IconCalendar, color: "bg-orange-500" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_FERIADOS_CADASTRAR]: { icon: IconCalendar, color: "bg-orange-600" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_AVISOS_LISTAR]: { icon: IconAlertTriangle, color: "bg-red-500" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_AVISOS_CADASTRAR]: { icon: IconAlertTriangle, color: "bg-red-600" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_EPI_LISTAR]: { icon: IconShield, color: "bg-yellow-500" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_EPI_CADASTRAR]: { icon: IconShield, color: "bg-yellow-600" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_EPI_ENTREGAS_LISTAR]: { icon: IconShield, color: "bg-yellow-400" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_EPI_ENTREGAS_CADASTRAR]: { icon: IconShield, color: "bg-yellow-500" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_EPI_AGENDAMENTOS_LISTAR]: { icon: IconCalendar, color: "bg-yellow-400" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_EPI_AGENDAMENTOS_CADASTRAR]: { icon: IconCalendar, color: "bg-yellow-500" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_SETORES_LISTAR]: { icon: IconBuildingSkyscraper, color: "bg-teal-500" },
  [FAVORITE_PAGES.RECURSOS_HUMANOS_SETORES_CADASTRAR]: { icon: IconBuildingSkyscraper, color: "bg-teal-600" },

  // Pessoal
  [FAVORITE_PAGES.PESSOAL_MINHAS_COMISSOES_LISTAR]: { icon: IconCoins, color: "bg-green-500" },
  [FAVORITE_PAGES.PESSOAL_MINHAS_FERIAS_LISTAR]: { icon: IconBeach, color: "bg-blue-500" },
  [FAVORITE_PAGES.PESSOAL_MEUS_FERIADOS_LISTAR]: { icon: IconCalendar, color: "bg-orange-500" },
  [FAVORITE_PAGES.PESSOAL_MEUS_EMPRESTIMOS_LISTAR]: { icon: IconRepeat, color: "bg-purple-500" },
  [FAVORITE_PAGES.PESSOAL_MEUS_EPIS_LISTAR]: { icon: IconShield, color: "bg-yellow-500" },
  //   [FAVORITE_PAGES.PESSOAL_MEUS_EPIS_SOLICITAR]: { icon: IconShield, color: "bg-yellow-600" },
  [FAVORITE_PAGES.PESSOAL_MEUS_AVISOS_LISTAR]: { icon: IconAlertTriangle, color: "bg-red-500" },
  [FAVORITE_PAGES.PESSOAL_MINHAS_NOTIFICACOES_LISTAR]: { icon: IconBell, color: "bg-red-500" },

  // Meu Pessoal
  //   [FAVORITE_PAGES.PESSOAL_MINHAS_COMISSOES_LISTAR]: { icon: IconCoins, color: "bg-green-500" },
  //   [FAVORITE_PAGES.MEU_PESSOAL_FERIAS_LISTAR]: { icon: IconBeach, color: "bg-blue-500" },
  //   [FAVORITE_PAGES.PESSOAL_MEUS_AVISOS_LISTAR]: { icon: IconAlertTriangle, color: "bg-red-500" },
  //   [FAVORITE_PAGES.PESSOAL_MEUS_EMPRESTIMOS_LISTAR]: { icon: IconRepeat, color: "bg-purple-500" },

  // Estatísticas
  //   [FAVORITE_PAGES.ESTATISTICAS_PRODUCAO_LISTAR]: { icon: IconChartBar, color: "bg-blue-500" },
  //   [FAVORITE_PAGES.ESTATISTICAS_ADMINISTRACAO_LISTAR]: { icon: IconChartBar, color: "bg-purple-500" },
  //   [FAVORITE_PAGES.ESTATISTICAS_RECURSOS_HUMANOS_LISTAR]: { icon: IconChartBar, color: "bg-orange-500" },
  //   [FAVORITE_PAGES.ESTATISTICAS_ESTOQUE_LISTAR]: { icon: IconChartBar, color: "bg-green-500" },

  // Other
  //   [FAVORITE_PAGES.PINTURA_CATALOGO_BASICO_LISTAR]: { icon: IconPaint, color: "bg-indigo-400" },
  //   [FAVORITE_PAGES.MANUTENCAO_LISTAR]: { icon: IconTool, color: "bg-red-500" },
  //   [FAVORITE_PAGES.MANUTENCAO_CADASTRAR]: { icon: IconTool, color: "bg-red-600" },

  // Default
  "/favoritos": { icon: IconStar, color: "bg-yellow-500" },
};

// Create a path-based mapping from the enum-based mapping
const PATH_TO_ICON_MAP: Record<string, { icon: Icon; color: string }> = {};
for (const [, enumValue] of Object.entries(FAVORITE_PAGES)) {
  const iconInfo = PAGE_ICON_MAP[enumValue as keyof typeof PAGE_ICON_MAP];
  if (iconInfo) {
    PATH_TO_ICON_MAP[enumValue] = iconInfo;
  }
}

// Get icon and color for a page
export function getPageIconInfo(page: string): { icon: Icon; color: string } {
  // Try path-based mapping first
  return PATH_TO_ICON_MAP[page] || PAGE_ICON_MAP[page] || { icon: IconFile, color: "bg-gray-500" };
}

// Check if a page is a cadastrar (create) page
export function isPageCadastrar(page: string): boolean {
  return page.includes("_CADASTRAR") || page.includes("/cadastrar") || page.includes("/enviar") || page.includes("/solicitar");
}

// Get icon name for sidebar - works with paths
export function getPageIconName(path: string): string {
  // Direct path to icon mapping
  const pathIconMap: Record<string, string> = {
    // Produção
    "/producao/cronograma": "clipboard-list",
    "/producao/cronograma/cadastrar": "clipboard-list",
    "/producao/agenda": "clipboard-list",
    "/producao/historico": "history",
    "/producao/recorte": "scissors",
    "/producao/garagens": "building-warehouse",
    "/producao/garagens/cadastrar": "building-warehouse",
    "/producao/observacoes": "note",
    "/producao/observacoes/cadastrar": "note",
    "/producao/aerografia": "brush",
    "/producao/aerografia/listar": "brush",
    "/producao/aerografia/cadastrar": "brush",
    "/producao/servicos": "tools",
    "/producao/servicos/cadastrar": "tools",

    // Estoque
    "/estoque/movimentacoes": "archive",
    "/estoque/movimentacoes/cadastrar": "archive",
    "/estoque/produtos": "package",
    "/estoque/produtos/cadastrar": "package",
    "/estoque/produtos/categorias": "tag",
    "/estoque/produtos/categorias/cadastrar": "tag",
    "/estoque/produtos/marcas": "tag",
    "/estoque/produtos/marcas/cadastrar": "tag",
    "/estoque/fornecedores": "truck",
    "/estoque/fornecedores/cadastrar": "truck",
    "/estoque/pedidos": "shopping-cart",
    "/estoque/pedidos/cadastrar": "shopping-cart",
    "/estoque/pedidos/agendamentos": "calendar-event",
    "/estoque/pedidos/agendamentos/cadastrar": "calendar-event",
    "/estoque/manutencao": "tool",
    "/estoque/manutencao/listar": "tool",
    "/estoque/manutencao/cadastrar": "tool",
    "/estoque/manutencao/agendamentos": "calendar",
    "/estoque/manutencao/agendamentos/cadastrar": "calendar",
    "/estoque/retiradas-externas": "archive",
    "/estoque/retiradas-externas/cadastrar": "archive",
    "/estoque/epi": "shield",
    "/estoque/epi/cadastrar": "shield",
    "/estoque/epi/entregas": "shield",
    "/estoque/epi/entregas/cadastrar": "shield",
    "/estoque/epi/agendamentos": "calendar",
    "/estoque/epi/agendamentos/cadastrar": "calendar",
    "/estoque/emprestimos": "repeat",
    "/estoque/emprestimos/cadastrar": "repeat",

    // Pintura
    "/pintura/catalogo": "paint",
    "/pintura/catalogo/cadastrar": "paint",
    "/pintura/producoes": "flask",
    "/pintura/formulas": "flask",
    "/pintura/formulas/listar": "flask",
    "/pintura/formulas/cadastrar": "flask",
    "/pintura/tipos-de-tinta": "palette",
    "/pintura/tipos-de-tinta/cadastrar": "palette",

    // Administração
    "/administracao/comissoes": "coins",
    "/administracao/clientes": "users",
    "/administracao/clientes/cadastrar": "users",
    "/administracao/colaboradores": "users",
    "/administracao/colaboradores/cadastrar": "users",
    "/administracao/orcamentos": "file-invoice",
    "/administracao/orcamentos/cadastrar": "file-invoice",
    "/administracao/registros-de-alteracoes": "history",
    "/administracao/arquivos": "file",
    "/administracao/setores": "building-skyscraper",
    "/administracao/setores/cadastrar": "building-skyscraper",
    "/administracao/notificacoes": "bell",
    "/administracao/notificacoes/cadastrar/enviar": "bell",

    // Recursos Humanos
    "/recursos-humanos/cargos": "briefcase",
    "/recursos-humanos/cargos/cadastrar": "briefcase",
    "/recursos-humanos/ferias": "beach",
    "/recursos-humanos/ferias/cadastrar": "beach",
    "/recursos-humanos/feriados": "calendar",
    "/recursos-humanos/feriados/cadastrar": "calendar",
    "/recursos-humanos/avisos": "alert-triangle",
    "/recursos-humanos/avisos/cadastrar": "alert-triangle",
    "/recursos-humanos/epi": "shield",
    "/recursos-humanos/epi/cadastrar": "shield",
    "/recursos-humanos/epi/entregas": "shield",
    "/recursos-humanos/epi/entregas/cadastrar": "shield",
    "/recursos-humanos/epi/tamanhos": "ruler",
    "/recursos-humanos/epi/tamanhos/cadastrar": "ruler",
    "/recursos-humanos/epi/agendamentos": "calendar",
    "/recursos-humanos/epi/agendamentos/cadastrar": "calendar",
    "/recursos-humanos/setores": "building-skyscraper",
    "/recursos-humanos/setores/cadastrar": "building-skyscraper",
    "/recursos-humanos/folha-de-pagamento": "receipt",

    // Pessoal
    "/pessoal/minhas-comissoes": "coins",
    "/pessoal/minhas-ferias": "beach",
    "/pessoal/meus-feriados": "calendar",
    "/pessoal/meus-emprestimos": "repeat",
    "/pessoal/meus-epis": "shield",
    "/pessoal/meus-epis/solicitar": "shield",
    "/pessoal/meus-avisos": "alert-triangle",
    "/pessoal/minhas-notificacoes": "bell",

    // Estatísticas
    "/estatisticas/producao": "chart-bar",
    "/estatisticas/administracao": "chart-bar",
    "/estatisticas/recursos-humanos": "chart-bar",
    "/estatisticas/estoque": "chart-bar",

    // Other
    "/favoritos": "star",
    "/manutencao": "tool",
    "/manutencao/cadastrar": "tool",
  };

  // Try exact match first
  if (pathIconMap[path]) {
    return pathIconMap[path];
  }

  // Try to find a partial match
  for (const [key, value] of Object.entries(pathIconMap)) {
    if (path.includes(key) || key.includes(path)) {
      return value;
    }
  }

  // Legacy enum-based mapping
  const iconMap: Record<string, string> = {
    // Produção
    [FAVORITE_PAGES.PRODUCAO_CRONOGRAMA_LISTAR]: "clipboard-list",
    [FAVORITE_PAGES.PRODUCAO_CRONOGRAMA_CADASTRAR]: "clipboard-list",
    // [FAVORITE_PAGES.PRODUCAO_EM_ESPERA_LISTAR]: "hourglass",
    [FAVORITE_PAGES.PRODUCAO_HISTORICO_LISTAR]: "history",
    [FAVORITE_PAGES.PRODUCAO_RECORTE_LISTAR]: "scissors",
    [FAVORITE_PAGES.PRODUCAO_GARAGENS_LISTAR]: "building-warehouse",
    [FAVORITE_PAGES.PRODUCAO_GARAGENS_CADASTRAR]: "building-warehouse",
    [FAVORITE_PAGES.PRODUCAO_OBSERVACOES_LISTAR]: "note",
    [FAVORITE_PAGES.PRODUCAO_OBSERVACOES_CADASTRAR]: "note",
    [FAVORITE_PAGES.PRODUCAO_AEROGRAFIA_LISTAR]: "brush",
    [FAVORITE_PAGES.PRODUCAO_AEROGRAFIA_CADASTRAR]: "brush",
    [FAVORITE_PAGES.PRODUCAO_SERVICOS_LISTAR]: "tools",
    [FAVORITE_PAGES.PRODUCAO_SERVICOS_CADASTRAR]: "tools",

    // Estoque
    [FAVORITE_PAGES.ESTOQUE_MOVIMENTACOES_LISTAR]: "archive",
    [FAVORITE_PAGES.ESTOQUE_MOVIMENTACOES_CADASTRAR]: "archive",
    [FAVORITE_PAGES.ESTOQUE_PRODUTOS_LISTAR]: "package",
    [FAVORITE_PAGES.ESTOQUE_PRODUTOS_CADASTRAR]: "package",
    [FAVORITE_PAGES.ESTOQUE_PRODUTOS_CATEGORIAS_LISTAR]: "tag",
    [FAVORITE_PAGES.ESTOQUE_PRODUTOS_CATEGORIAS_CADASTRAR]: "tag",
    [FAVORITE_PAGES.ESTOQUE_PRODUTOS_MARCAS_LISTAR]: "tag",
    [FAVORITE_PAGES.ESTOQUE_PRODUTOS_MARCAS_CADASTRAR]: "tag",
    [FAVORITE_PAGES.ESTOQUE_FORNECEDORES_LISTAR]: "truck",
    [FAVORITE_PAGES.ESTOQUE_FORNECEDORES_CADASTRAR]: "truck",
    [FAVORITE_PAGES.ESTOQUE_PEDIDOS_LISTAR]: "shopping-cart",
    [FAVORITE_PAGES.ESTOQUE_PEDIDOS_CADASTRAR]: "shopping-cart",
    [FAVORITE_PAGES.ESTOQUE_PEDIDOS_AGENDAMENTOS_LISTAR]: "calendar-event",
    [FAVORITE_PAGES.ESTOQUE_PEDIDOS_AGENDAMENTOS_CADASTRAR]: "calendar-event",
    [FAVORITE_PAGES.ESTOQUE_MANUTENCAO_LISTAR]: "tool",
    [FAVORITE_PAGES.ESTOQUE_MANUTENCAO_CADASTRAR]: "tool",
    [FAVORITE_PAGES.ESTOQUE_MANUTENCAO_AGENDAMENTOS_LISTAR]: "calendar",
    [FAVORITE_PAGES.ESTOQUE_MANUTENCAO_AGENDAMENTOS_CADASTRAR]: "calendar",
    [FAVORITE_PAGES.ESTOQUE_RETIRADAS_EXTERNAS_LISTAR]: "archive",
    [FAVORITE_PAGES.ESTOQUE_RETIRADAS_EXTERNAS_CADASTRAR]: "archive",
    [FAVORITE_PAGES.ESTOQUE_EPI_LISTAR]: "shield",
    [FAVORITE_PAGES.ESTOQUE_EPI_CADASTRAR]: "shield",
    [FAVORITE_PAGES.ESTOQUE_EPI_ENTREGAS_LISTAR]: "shield",
    [FAVORITE_PAGES.ESTOQUE_EPI_ENTREGAS_CADASTRAR]: "shield",
    [FAVORITE_PAGES.ESTOQUE_EPI_AGENDAMENTOS_LISTAR]: "calendar",
    [FAVORITE_PAGES.ESTOQUE_EPI_AGENDAMENTOS_CADASTRAR]: "calendar",
    [FAVORITE_PAGES.ESTOQUE_EMPRESTIMOS_LISTAR]: "repeat",
    [FAVORITE_PAGES.ESTOQUE_EMPRESTIMOS_CADASTRAR]: "repeat",

    // Pintura
    [FAVORITE_PAGES.PINTURA_CATALOGO_LISTAR]: "paint",
    [FAVORITE_PAGES.PINTURA_CATALOGO_CADASTRAR]: "paint",
    [FAVORITE_PAGES.PINTURA_PRODUCOES_LISTAR]: "flask",
    [FAVORITE_PAGES.PINTURA_FORMULAS_LISTAR]: "flask",
    [FAVORITE_PAGES.PINTURA_FORMULAS_CADASTRAR]: "flask",
    [FAVORITE_PAGES.PINTURA_TIPOS_TINTA_LISTAR]: "palette",
    [FAVORITE_PAGES.PINTURA_TIPOS_TINTA_CADASTRAR]: "palette",

    // Administração
    [FAVORITE_PAGES.ADMINISTRACAO_COMISSOES_LISTAR]: "coins",
    [FAVORITE_PAGES.ADMINISTRACAO_CLIENTES_LISTAR]: "users",
    [FAVORITE_PAGES.ADMINISTRACAO_CLIENTES_CADASTRAR]: "users",
    [FAVORITE_PAGES.ADMINISTRACAO_COLABORADORES_LISTAR]: "users",
    [FAVORITE_PAGES.ADMINISTRACAO_COLABORADORES_CADASTRAR]: "users",
    [FAVORITE_PAGES.ADMINISTRACAO_ORCAMENTOS_LISTAR]: "file-invoice",
    [FAVORITE_PAGES.ADMINISTRACAO_ORCAMENTOS_CADASTRAR]: "file-invoice",
    [FAVORITE_PAGES.ADMINISTRACAO_REGISTROS_ALTERACOES_LISTAR]: "history",
    [FAVORITE_PAGES.ADMINISTRACAO_ARQUIVOS_LISTAR]: "file",
    [FAVORITE_PAGES.ADMINISTRACAO_SETORES_LISTAR]: "building-skyscraper",
    [FAVORITE_PAGES.ADMINISTRACAO_SETORES_CADASTRAR]: "building-skyscraper",
    [FAVORITE_PAGES.ADMINISTRACAO_NOTIFICACOES_LISTAR]: "bell",
    // [FAVORITE_PAGES.ADMINISTRACAO_NOTIFICACOES_ENVIAR]: "bell",

    // Recursos Humanos
    [FAVORITE_PAGES.RECURSOS_HUMANOS_CARGOS_LISTAR]: "briefcase",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_CARGOS_CADASTRAR]: "briefcase",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_FERIAS_LISTAR]: "beach",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_FERIAS_CADASTRAR]: "beach",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_FERIADOS_LISTAR]: "calendar",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_FERIADOS_CADASTRAR]: "calendar",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_AVISOS_LISTAR]: "alert-triangle",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_AVISOS_CADASTRAR]: "alert-triangle",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_EPI_LISTAR]: "shield",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_EPI_CADASTRAR]: "shield",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_EPI_ENTREGAS_LISTAR]: "shield",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_EPI_ENTREGAS_CADASTRAR]: "shield",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_EPI_AGENDAMENTOS_LISTAR]: "calendar",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_EPI_AGENDAMENTOS_CADASTRAR]: "calendar",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_SETORES_LISTAR]: "building-skyscraper",
    [FAVORITE_PAGES.RECURSOS_HUMANOS_SETORES_CADASTRAR]: "building-skyscraper",

    // Default
    "/favoritos": "star",
  };

  return iconMap[path] || "file";
}