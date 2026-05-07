import type { QueryClient } from "@tanstack/react-query";

const TOUR_TAG = "[TOUR_DEMO]";

const makeId = (n: number) => `tour-mock-${n.toString().padStart(8, "0")}-aaaa-bbbb-cccc-dddddddddddd`;

const baseDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d;
};

const mockTasks = [
  {
    id: makeId(1),
    name: `${TOUR_TAG} Caminhão Demo - Lateral Direita`,
    status: "IN_PRODUCTION",
    serialNumber: "DEMO-001",
    entryDate: baseDate(-3),
    term: baseDate(7),
    forecastDate: baseDate(5),
    cleared: false,
    customer: { id: makeId(101), fantasyName: "Cliente Demonstração Ltda" },
    sector: { id: makeId(201), name: "Produção" },
    truck: { id: makeId(301), licensePlate: "DEMO-1A23" },
    paint: { id: makeId(401), name: "Vermelho Ankaa Tour", hex: "#C62828" },
    createdAt: baseDate(-3),
    updatedAt: baseDate(0),
  },
  {
    id: makeId(2),
    name: `${TOUR_TAG} Tarefa Aguardando - Lateral Esquerda`,
    status: "PENDING",
    serialNumber: "DEMO-002",
    entryDate: baseDate(-1),
    term: baseDate(10),
    forecastDate: baseDate(8),
    cleared: false,
    customer: { id: makeId(102), fantasyName: "Frota Modelo S.A." },
    sector: { id: makeId(201), name: "Produção" },
    paint: { id: makeId(402), name: "Azul Tutorial", hex: "#1565C0" },
    createdAt: baseDate(-1),
    updatedAt: baseDate(0),
  },
  {
    id: makeId(3),
    name: `${TOUR_TAG} Em Preparação - Tampa Traseira`,
    status: "PREPARATION",
    serialNumber: "DEMO-003",
    entryDate: baseDate(-2),
    term: baseDate(5),
    cleared: false,
    customer: { id: makeId(103), fantasyName: "Transportadora Tour" },
    sector: { id: makeId(201), name: "Produção" },
    paint: { id: makeId(403), name: "Branco Demo", hex: "#FAFAFA" },
    createdAt: baseDate(-2),
    updatedAt: baseDate(0),
  },
];

const mockCuts = [
  {
    id: makeId(11),
    type: "VINIL",
    status: "PENDING",
    quantity: 4,
    task: { id: mockTasks[0].id, name: mockTasks[0].name },
    createdAt: baseDate(-1),
    updatedAt: baseDate(0),
  },
  {
    id: makeId(12),
    type: "VINIL",
    status: "CUTTING",
    quantity: 2,
    task: { id: mockTasks[1].id, name: mockTasks[1].name },
    createdAt: baseDate(-1),
    updatedAt: baseDate(0),
  },
];

const mockPaints = [
  {
    id: makeId(21),
    name: "Vermelho Ankaa Tour",
    hex: "#C62828",
    finish: "GLOSS",
    paintType: { id: makeId(901), name: "Poliuretano" },
    paintBrand: { id: makeId(902), name: "Demonstração" },
    createdAt: baseDate(-30),
    updatedAt: baseDate(-10),
  },
  {
    id: makeId(22),
    name: "Azul Tutorial",
    hex: "#1565C0",
    finish: "MATTE",
    paintType: { id: makeId(901), name: "Poliuretano" },
    paintBrand: { id: makeId(902), name: "Demonstração" },
    createdAt: baseDate(-30),
    updatedAt: baseDate(-10),
  },
];

const mockTrucks = [
  {
    id: mockTasks[0].truck!.id,
    licensePlate: "DEMO-1A23",
    model: "Bitruck Modelo Demo",
    customer: mockTasks[0].customer,
    task: { id: mockTasks[0].id, name: mockTasks[0].name },
    xPosition: 0,
    yPosition: 0,
    createdAt: baseDate(-3),
    updatedAt: baseDate(0),
  },
];

const mockNotifications = [
  {
    id: makeId(31),
    title: `${TOUR_TAG} Nova tarefa atribuída`,
    body: "Você recebeu a tarefa Caminhão Demo - Lateral Direita.",
    read: false,
    createdAt: baseDate(0),
  },
  {
    id: makeId(32),
    title: `${TOUR_TAG} Recorte pronto`,
    body: "O recorte para Tampa Traseira está pronto para retirada.",
    read: false,
    createdAt: baseDate(0),
  },
];

const wrapList = (data: any[]) => ({
  success: true,
  data,
  meta: { page: 1, limit: 50, totalRecords: data.length, hasNextPage: false },
});

const injectionTargets: Array<{ root: string; payload: unknown }> = [
  { root: "tasks", payload: wrapList(mockTasks) },
  { root: "cuts", payload: wrapList(mockCuts) },
  { root: "paints", payload: wrapList(mockPaints) },
  { root: "trucks", payload: wrapList(mockTrucks) },
  { root: "notifications", payload: wrapList(mockNotifications) },
];

let savedSnapshot: Map<string, unknown> | null = null;

export function injectTourMocks(queryClient: QueryClient) {
  if (savedSnapshot) return;
  savedSnapshot = new Map();
  const cache = queryClient.getQueryCache();
  cache.getAll().forEach((q) => {
    savedSnapshot!.set(JSON.stringify(q.queryKey), q.state.data);
  });
  injectionTargets.forEach(({ root, payload }) => {
    cache.getAll().forEach((q) => {
      if (q.queryKey[0] === root) {
        queryClient.setQueryData(q.queryKey, payload);
      }
    });
    queryClient.setQueryData([root], payload);
    queryClient.setQueryData([root, { tourMode: true }], payload);
  });
}

export function clearTourMocks(queryClient: QueryClient) {
  if (!savedSnapshot) return;
  const cache = queryClient.getQueryCache();
  cache.getAll().forEach((q) => {
    const key = JSON.stringify(q.queryKey);
    if (savedSnapshot!.has(key)) {
      queryClient.setQueryData(q.queryKey, savedSnapshot!.get(key));
    }
  });
  savedSnapshot = null;
  queryClient.invalidateQueries();
}

export const tourMocks = {
  tasks: mockTasks,
  cuts: mockCuts,
  paints: mockPaints,
  trucks: mockTrucks,
  notifications: mockNotifications,
};
