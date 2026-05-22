/**
 * Tutorial v5 fixtures — display-only mock data for fake scenes.
 *
 * Unlike v4 mocks (which were injected into React Query for real screens
 * to consume), these are plain TypeScript objects that scenes import
 * directly. No UUIDs required, no entity rewrites, no query keys.
 */

export const TUTORIAL_USER = {
  firstName: "Pedro",
  fullName: "Pedro Demo",
  role: "Pintor",
  sectorName: "Produção",
};

export const TUTORIAL_TASKS = [
  {
    id: "demo-task-0",
    name: "Caminhão Frota - Modelo A",
    customer: "Cliente Demonstração Ltda",
    customerCity: "Ibiporã, PR",
    serial: "FROTA-001",
    status: "IN_PRODUCTION",
    statusLabel: "Em Produção",
    statusColor: "#15803d",
    truckCategory: "Carreta",
    sectorName: "Produção",
    entryDate: "12/05/2026",
    term: "28/05/2026",
    forecast: "26/05/2026",
    daysOverdue: 0,
    deadlineState: "ok" as const,
    paintName: "Branco Geada",
    paintHex: "#EEF1EC",
  },
  {
    id: "demo-task-1",
    name: "Frota Modelo S.A.",
    customer: "Frota Modelo S.A.",
    customerCity: "Londrina, PR",
    serial: "FROTA-002",
    status: "WAITING_PRODUCTION",
    statusLabel: "Aguardando Produção",
    statusColor: "#f59e0b",
    truckCategory: "Truck",
    sectorName: "Produção",
    entryDate: "14/05/2026",
    term: "02/06/2026",
    forecast: "30/05/2026",
    daysOverdue: 0,
    deadlineState: "ok" as const,
    paintName: "Azul Frota",
    paintHex: "#2563EB",
  },
  {
    id: "demo-task-3",
    name: "Transportadora Tour",
    customer: "Transportadora Tour",
    customerCity: "Cambé, PR",
    serial: "FROTA-005",
    status: "IN_PRODUCTION",
    statusLabel: "Em Produção (Atrasado)",
    statusColor: "#bf4040",
    truckCategory: "Carreta",
    sectorName: "Produção",
    entryDate: "01/05/2026",
    term: "18/05/2026",
    forecast: "18/05/2026",
    daysOverdue: 3,
    deadlineState: "overdue" as const,
    paintName: "Verde Militar",
    paintHex: "#3D4D2E",
  },
  {
    id: "demo-task-7",
    name: "Frota Express",
    customer: "Frota Express LTDA",
    customerCity: "Apucarana, PR",
    serial: "FROTA-007",
    status: "IN_PRODUCTION",
    statusLabel: "Em Produção (Prazo Curto)",
    statusColor: "#f59e0b",
    truckCategory: "Truck",
    sectorName: "Produção",
    entryDate: "20/05/2026",
    term: "21/05/2026",
    forecast: "21/05/2026",
    daysOverdue: 0,
    deadlineState: "tight" as const,
    paintName: "Verde Militar",
    paintHex: "#3D4D2E",
  },
];

export const TUTORIAL_TASK_DETAIL = {
  ...TUTORIAL_TASKS[0],
  isCommissionable: true,
  commissionPercent: 5,
  services: [
    { id: "so-0", label: "Pintura completa", status: "IN_PROGRESS", statusLabel: "Em andamento", hasObservation: true },
    { id: "so-1", label: "Logo Ankaa", status: "PENDING", statusLabel: "Pendente", hasObservation: false },
    { id: "so-2", label: "Orientação técnica", status: "COMPLETED", statusLabel: "Concluído", hasObservation: false },
    { id: "so-3", label: "Aprovação artwork", status: "WAITING_APPROVE", statusLabel: "Aguardando aprovação", hasObservation: false },
  ],
  generalPaint: { name: "Branco Geada", hex: "#EEF1EC", brand: "Suvinil", type: "Poliéster" },
  groundPaints: [{ name: "Fundo Cinza Médio", hex: "#9CA3AF" }],
  logoPaints: [
    { name: "Verde Ankaa", hex: "#15803D" },
    { name: "Verde Floresta", hex: "#0F4D2D" },
    { name: "Verde Limão", hex: "#65A30D" },
  ],
  observations: [
    { id: "obs-0", text: "Vazamento de tinta na lateral direita", createdAt: "12/05" },
    { id: "obs-1", text: "Casca de laranja na tampa", createdAt: "14/05" },
    { id: "obs-2", text: "Logo desalinhado", createdAt: "16/05" },
  ],
  artworks: [
    { id: "art-0", thumbnail: null, label: "Layout Lateral D" },
    { id: "art-1", thumbnail: null, label: "Layout Frente" },
    { id: "art-2", thumbnail: null, label: "Layout Tampa" },
  ],
  cuts: [
    { id: "cut-0", label: "Estrela lateral", type: "VINYL", status: "PENDING" },
    { id: "cut-1", label: "Logo costas", type: "VINYL", status: "CUTTING" },
    { id: "cut-2", label: "Número de frota", type: "STENCIL", status: "COMPLETED" },
  ],
  airbrushings: [
    { id: "air-0", label: "Detalhe lateral", status: "IN_PRODUCTION" },
    { id: "air-1", label: "Acabamento", status: "PENDING" },
  ],
};

export const TUTORIAL_NOTIFICATIONS = [
  { id: "n-0", title: "Tarefa atribuída", body: "Você foi designado para Frota Modelo S.A.", time: "agora", unread: true },
  { id: "n-1", title: "Recorte pronto", body: "Estrela lateral disponível para retirada.", time: "1 h", unread: true },
  { id: "n-2", title: "Manutenção programada", body: "Sistema offline dia 23/06 22h-23h.", time: "ontem", unread: false },
  { id: "n-3", title: "Tarefa em atraso", body: "Transportadora Tour com prazo vencido.", time: "ontem", unread: false },
];

export const TUTORIAL_OBSERVATIONS_LIST = [
  { id: "o-0", taskName: "Caminhão Frota - Modelo A", text: "Vazamento na lateral direita", status: "pending", createdAt: "12/05" },
  { id: "o-1", taskName: "Frota Modelo S.A.", text: "Bolha no adesivo da porta", status: "pending", createdAt: "14/05" },
  { id: "o-2", taskName: "Transportadora Tour", text: "Adesivo torto", status: "resolved", createdAt: "15/05" },
];

export const TUTORIAL_CUTS_LIST = [
  { id: "c-0", label: "Estrela lateral", taskName: "Caminhão Frota - Modelo A", type: "VINYL", status: "PENDING", statusLabel: "Pendente", origin: "PLAN" },
  { id: "c-1", label: "Logo Ankaa costas", taskName: "Caminhão Frota - Modelo A", type: "VINYL", status: "CUTTING", statusLabel: "Cortando", origin: "PLAN" },
  { id: "c-2", label: "Número de frota", taskName: "Caminhão Frota - Modelo A", type: "STENCIL", status: "COMPLETED", statusLabel: "Concluído", origin: "PLAN" },
  { id: "c-3", label: "Faixa curva", taskName: "Frota Modelo S.A.", type: "VINYL", status: "PENDING", statusLabel: "Pendente", origin: "REQUEST" },
];

export const TUTORIAL_HISTORICO = [
  { id: "h-0", taskName: "Caminhão Antigo - Modelo X", customer: "Cliente Antigo", completedAt: "02/05/2026" },
  { id: "h-1", taskName: "Frota 2023", customer: "Velho Cliente", completedAt: "28/04/2026" },
  { id: "h-2", taskName: "Express LTDA", customer: "Express Old", completedAt: "20/04/2026" },
];

// ─── Pessoal / Time tracking ──────────────────────────────────────────────

export const TUTORIAL_PONTOS = {
  month: "Maio",
  year: 2026,
  periodStart: "25/04",
  periodEnd: "25/05",
  columns: ["Data", "E1", "S1", "E2", "S2", "Normais", "Faltas", "Ex50%", "Ex100%", "DSR"],
  rows: [
    { date: "01/05", e1: "08:00", s1: "12:00", e2: "13:00", s2: "17:00", normais: "8:00", faltas: "0:00", ex50: "0:00", ex100: "0:00", dsr: "1:30" },
    { date: "02/05", e1: "08:05", s1: "12:00", e2: "13:00", s2: "17:00", normais: "7:55", faltas: "0:05", ex50: "0:00", ex100: "0:00", dsr: "1:30" },
    { date: "03/05", e1: "—", s1: "—", e2: "—", s2: "—", normais: "0:00", faltas: "8:00", ex50: "0:00", ex100: "0:00", dsr: "0:00" },
    { date: "04/05", e1: "08:00", s1: "12:00", e2: "13:00", s2: "18:00", normais: "8:00", faltas: "0:00", ex50: "1:00", ex100: "0:00", dsr: "1:30" },
    { date: "05/05", e1: "08:00", s1: "12:00", e2: "13:00", s2: "17:00", normais: "8:00", faltas: "0:00", ex50: "0:00", ex100: "0:00", dsr: "1:30" },
  ],
};

export const TUTORIAL_INCLUIR_PENDENCIAS = [
  { id: "ip-0", dateTime: "20/05 - 14:32", status: "PROCESSING", statusLabel: "Processando", color: "#f59e0b", lat: -23.4567, lon: -51.1234, accuracy: 8, address: "Rua das Flores, 123 - Ibiporã, PR", hasComprovante: false },
  { id: "ip-1", dateTime: "19/05 - 08:01", status: "ACCEPTED", statusLabel: "Aceita", color: "#16a34a", lat: -23.4565, lon: -51.1230, accuracy: 5, address: "Rua das Flores, 123 - Ibiporã, PR", hasComprovante: true },
  { id: "ip-2", dateTime: "18/05 - 17:45", status: "REJECTED", statusLabel: "Rejeitada", color: "#bf4040", lat: -23.4590, lon: -51.1290, accuracy: 25, address: "Fora do perímetro", hasComprovante: false, rejectionReason: "Local fora da área permitida" },
];

export const TUTORIAL_JUSTIFICATIVAS = [
  { id: "j-0", label: "Atestado médico", icon: "stethoscope" },
  { id: "j-1", label: "Licença paternidade", icon: "baby" },
  { id: "j-2", label: "Licença maternidade", icon: "baby" },
  { id: "j-3", label: "Falta justificada", icon: "check" },
  { id: "j-4", label: "Banco de horas", icon: "clock" },
];

export const TUTORIAL_MISSING_DAYS = [
  { date: "18/05/2026", saldo: "8h", faltas: "8h", weekday: "Segunda-feira", status: "open" as const },
  { date: "11/05/2026", saldo: "4h", faltas: "4h", weekday: "Segunda-feira", status: "open" as const },
  { date: "04/05/2026", saldo: "2h", faltas: "2h", weekday: "Segunda-feira", status: "closed" as const },
];

// ─── Holidays, PPE, Messages, Warnings, Loans, Movements ──────────────────

export const TUTORIAL_HOLIDAYS = [
  { id: "f-0", date: "Hoje", weekday: "21/05", name: "Aniversário da empresa", type: "COMPANY" },
  { id: "f-1", date: "Em 7 dias", weekday: "28/05", name: "Corpus Christi", type: "NATIONAL" },
  { id: "f-2", date: "Em 30 dias", weekday: "20/06", name: "Confraternização", type: "COMPANY" },
];

export const TUTORIAL_PPE_DELIVERIES = [
  { id: "ppe-0", item: "Botas de segurança", deliveredAt: "10/05/2026", status: "DELIVERED", statusLabel: "Entregue", color: "#16a34a" },
  { id: "ppe-1", item: "Luvas nitrílicas", deliveredAt: "—", status: "PENDING", statusLabel: "Pendente", color: "#f59e0b" },
  { id: "ppe-2", item: "Óculos de proteção", deliveredAt: "15/05/2026", status: "WAITING_SIGNATURE", statusLabel: "Aguardando assinatura", color: "#2563EB" },
  { id: "ppe-3", item: "Avental", deliveredAt: "08/05/2026", status: "APPROVED", statusLabel: "Aprovado", color: "#16a34a" },
];

export const TUTORIAL_MESSAGES = [
  { id: "m-0", title: "Procedimento de inspeção", excerpt: "Atenção colaboradores: novo procedimento de inspeção entra em vigor...", time: "2 dias atrás", unread: true },
  { id: "m-1", title: "Aniversários do mês", excerpt: "Parabéns aos aniversariantes deste mês!", time: "5 dias atrás", unread: false },
  { id: "m-2", title: "Treinamento obrigatório", excerpt: "O treinamento de NR-35 será realizado dia...", time: "1 sem atrás", unread: false },
];

export const TUTORIAL_WARNINGS = [
  { id: "w-0", type: "Atraso", category: "VERBAL", date: "12/05/2026", description: "Atraso de 35 min" },
  { id: "w-1", type: "Uso inadequado de EPI", category: "WRITTEN", date: "05/05/2026", description: "Não uso de óculos de segurança" },
];

export const TUTORIAL_LOANS = [
  { id: "l-0", item: "Furadeira Bosch", status: "ACTIVE", statusLabel: "Ativa", borrowedAt: "10/05/2026" },
  { id: "l-1", item: "Pistola de pintura", status: "RETURNED", statusLabel: "Devolvido", borrowedAt: "20/04/2026" },
];

export const TUTORIAL_MOVEMENTS = [
  { id: "mv-0", item: "Lixa P-150", quantity: 5, type: "OUTBOUND", at: "20/05/2026" },
  { id: "mv-1", item: "Fita crepe", quantity: 3, type: "OUTBOUND", at: "19/05/2026" },
  { id: "mv-2", item: "Filtro cabine", quantity: 1, type: "OUTBOUND", at: "18/05/2026" },
];

// ─── Bonus ────────────────────────────────────────────────────────────────

export const TUTORIAL_BONUS_CURRENT = {
  period: "Maio 2026",
  status: "DRAFT",
  statusLabel: "Em apuração",
  base: 1500,
  net: 1425,
  discountTotal: 75,
  discountPercent: 5,
  performance: 92,
  commission: 320,
  rules: ["Assiduidade: até R$ 200", "Performance individual: até R$ 800", "Comissão: 5% sobre tarefas finalizadas"],
};

export const TUTORIAL_BONUS_HISTORY = [
  { id: "b-0", period: "Abril 2026", status: "PAID", value: 1380 },
  { id: "b-1", period: "Março 2026", status: "PAID", value: 1450 },
  { id: "b-2", period: "Fevereiro 2026", status: "PAID", value: 1290 },
  { id: "b-3", period: "Janeiro 2026", status: "PAID", value: 1510 },
];

// ─── Home dashboard ───────────────────────────────────────────────────────

export const TUTORIAL_HOME_FAVORITES = [
  { id: "fav-0", label: "Cronograma", icon: "Briefcase" },
  { id: "fav-1", label: "Meus Pontos", icon: "Clock" },
  { id: "fav-2", label: "Meus EPIs", icon: "Shield" },
];

export const TUTORIAL_HOME_WIDGETS_AVAILABLE = [
  { id: "table.tasks", label: "Tarefas", description: "Lista de tarefas atribuídas a você" },
  { id: "low-stock", label: "Estoque crítico", description: "Itens com estoque baixo" },
  { id: "metrics", label: "Métricas", description: "Indicadores chave" },
];
