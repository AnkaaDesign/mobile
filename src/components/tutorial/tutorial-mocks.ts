import type { QueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TAG = "[TUTORIAL]";

const id = (n: number) =>
  `tut-${n.toString().padStart(8, "0")}-aaaa-bbbb-cccc-dddddddddddd`;

const offset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

export const mockCustomer = {
  id: id(101),
  fantasyName: "Cliente Demonstração Ltda",
  corporateName: "Cliente Demonstração Ltda",
};

export const mockSector = { id: id(201), name: "Produção", privileges: "PRODUCTION" };

export const mockTasks = [
  {
    id: id(1),
    name: `${TAG} Caminhão Demo - Lateral Direita`,
    status: "IN_PRODUCTION",
    statusOrder: 3,
    serialNumber: "DEMO-001",
    plate: "DEMO-1A23",
    entryDate: offset(-3),
    term: offset(7),
    forecastDate: offset(5),
    customer: mockCustomer,
    sector: mockSector,
    truck: { id: id(301), licensePlate: "DEMO-1A23", model: "Bitruck Demo" },
    paint: { id: id(401), name: "Vermelho Ankaa", hex: "#C62828" },
    services: [
      { id: id(501), description: "Pintura Geral", status: "IN_PROGRESS" },
      { id: id(502), description: "Aplicação de Logomarca", status: "PENDING" },
    ],
    createdAt: offset(-3),
    updatedAt: offset(0),
  },
  {
    id: id(2),
    name: `${TAG} Tarefa Aguardando - Lateral Esquerda`,
    status: "PENDING",
    statusOrder: 2,
    serialNumber: "DEMO-002",
    plate: "DEMO-2B45",
    entryDate: offset(-1),
    term: offset(10),
    forecastDate: offset(8),
    customer: { ...mockCustomer, id: id(102), fantasyName: "Frota Modelo S.A." },
    sector: mockSector,
    paint: { id: id(402), name: "Azul Tutorial", hex: "#1565C0" },
    services: [{ id: id(503), description: "Pintura Geral", status: "PENDING" }],
    createdAt: offset(-1),
    updatedAt: offset(0),
  },
  {
    id: id(3),
    name: `${TAG} Em Preparação - Tampa Traseira`,
    status: "PREPARATION",
    statusOrder: 1,
    serialNumber: "DEMO-003",
    plate: "DEMO-3C67",
    entryDate: offset(-2),
    term: offset(5),
    customer: { ...mockCustomer, id: id(103), fantasyName: "Transportadora Tour" },
    sector: mockSector,
    paint: { id: id(403), name: "Branco Demo", hex: "#FAFAFA" },
    services: [{ id: id(504), description: "Recorte de Letras", status: "PENDING" }],
    createdAt: offset(-2),
    updatedAt: offset(0),
  },
];

export const mockCompletedTasks = [
  {
    id: id(50),
    name: `${TAG} Tarefa Concluída - Demo`,
    status: "COMPLETED",
    statusOrder: 5,
    serialNumber: "DEMO-COMP-001",
    customer: mockCustomer,
    sector: mockSector,
    finishedAt: offset(-5),
    createdAt: offset(-15),
    updatedAt: offset(-5),
  },
  {
    id: id(51),
    name: `${TAG} Reforma de Frota - Concluída`,
    status: "COMPLETED",
    statusOrder: 5,
    serialNumber: "DEMO-COMP-002",
    customer: { ...mockCustomer, id: id(102), fantasyName: "Frota Modelo S.A." },
    sector: mockSector,
    finishedAt: offset(-12),
    createdAt: offset(-25),
    updatedAt: offset(-12),
  },
];

export const mockObservations = [
  {
    id: id(60),
    description: `${TAG} Cliente solicitou ajuste no posicionamento da logomarca.`,
    task: { id: mockTasks[0].id, name: mockTasks[0].name },
    createdAt: offset(-1),
    updatedAt: offset(0),
  },
  {
    id: id(61),
    description: `${TAG} Conferir tonalidade do azul antes da próxima demão.`,
    task: { id: mockTasks[1].id, name: mockTasks[1].name },
    createdAt: offset(-2),
    updatedAt: offset(-1),
  },
];

export const mockServiceOrders = [
  {
    id: id(70),
    description: `${TAG} Pintura Completa - Caminhão Demo`,
    status: "IN_PROGRESS",
    customer: mockCustomer,
    task: { id: mockTasks[0].id, name: mockTasks[0].name },
    startedAt: offset(-3),
    createdAt: offset(-3),
    updatedAt: offset(0),
  },
  {
    id: id(71),
    description: `${TAG} Aplicação de Logomarca - Lateral Direita`,
    status: "PENDING",
    customer: mockCustomer,
    task: { id: mockTasks[0].id, name: mockTasks[0].name },
    createdAt: offset(-2),
    updatedAt: offset(-1),
  },
];

export const mockCuts = [
  {
    id: id(11),
    type: "VINIL",
    status: "PENDING",
    quantity: 4,
    task: { id: mockTasks[0].id, name: mockTasks[0].name },
    createdAt: offset(-1),
    updatedAt: offset(0),
  },
  {
    id: id(12),
    type: "VINIL",
    status: "CUTTING",
    quantity: 2,
    task: { id: mockTasks[1].id, name: mockTasks[1].name },
    createdAt: offset(-1),
    updatedAt: offset(0),
  },
];

export const mockAirbrushings = [
  {
    id: id(80),
    status: "PENDING",
    price: 2500,
    task: { id: mockTasks[0].id, name: mockTasks[0].name, customer: mockCustomer },
    startDate: offset(-1),
    finishDate: null,
    createdAt: offset(-1),
    updatedAt: offset(0),
  },
];

export const mockNotifications = [
  {
    id: id(31),
    title: `${TAG} Nova tarefa atribuída`,
    body: "Você recebeu a tarefa Caminhão Demo - Lateral Direita.",
    read: false,
    isSeenByUser: false,
    createdAt: offset(0),
  },
  {
    id: id(32),
    title: `${TAG} Recorte pronto`,
    body: "O recorte para Tampa Traseira está pronto para retirada.",
    read: false,
    isSeenByUser: false,
    createdAt: offset(-1),
  },
  {
    id: id(33),
    title: `${TAG} Aviso da Liderança`,
    body: "Reunião rápida amanhã às 7h para alinhamento da semana.",
    read: true,
    isSeenByUser: true,
    createdAt: offset(-2),
  },
];

export const mockTrucks = mockTasks
  .map((t) => (t as any).truck)
  .filter(Boolean);

export const mockHolidays = [
  {
    id: id(91),
    name: `${TAG} Feriado Demonstração`,
    date: offset(7).toISOString().split("T")[0],
    type: "NATIONAL",
    createdAt: offset(-30),
    updatedAt: offset(-30),
  },
  {
    id: id(92),
    name: `${TAG} Recesso de Demo`,
    date: offset(30).toISOString().split("T")[0],
    type: "COMPANY",
    createdAt: offset(-30),
    updatedAt: offset(-30),
  },
];

export const mockPpeDeliveries = [
  {
    id: id(110),
    status: "DELIVERED",
    quantity: 1,
    deliveryDate: offset(-15),
    item: {
      id: id(111),
      name: "Bota de Segurança Cano Médio",
      brand: { id: id(112), name: "Marca Demo" },
      category: { id: id(113), name: "EPI - Calçados" },
    },
    ppeSchedule: null,
    reviewedByUser: null,
    createdAt: offset(-15),
    updatedAt: offset(-15),
  },
  {
    id: id(120),
    status: "PENDING",
    quantity: 1,
    item: {
      id: id(121),
      name: "Luva Nitrílica",
      brand: { id: id(122), name: "Marca Demo" },
      category: { id: id(123), name: "EPI - Mãos" },
    },
    ppeSchedule: null,
    reviewedByUser: null,
    createdAt: offset(-2),
    updatedAt: offset(-2),
  },
];

export const mockMyMessages = [
  {
    id: id(140),
    title: `${TAG} Comunicado da Diretoria`,
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Bem-vindo à Ankaa! Esta é uma mensagem de demonstração." }],
      },
    ],
    createdAt: offset(-1),
    publishedAt: offset(-1),
    viewedAt: null,
    dismissedAt: null,
  },
  {
    id: id(141),
    title: `${TAG} Lembrete de Segurança`,
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Não esqueça de usar todos os EPIs durante o turno." }],
      },
    ],
    createdAt: offset(-3),
    publishedAt: offset(-3),
    viewedAt: offset(-2),
    dismissedAt: null,
  },
];

// Home dashboard payload — renders the home cards for PRODUCTION users
export const mockHomeDashboardData = {
  sector: "PRODUCTION",
  tasksCloseDeadline: mockTasks.slice(0, 2).map((t) => ({
    id: t.id,
    name: t.name,
    serialNumber: t.serialNumber,
    plate: t.plate,
    status: t.status,
    paymentStatus: null,
    term: (t.term as Date)?.toISOString?.() ?? null,
    forecastDate: (t.forecastDate as Date | undefined)?.toISOString?.() ?? null,
    customerName: t.customer?.fantasyName ?? null,
    sectorName: t.sector?.name ?? null,
  })),
  tasksCloseForecast: [],
  openServiceOrders: mockServiceOrders.map((so) => ({
    id: so.id,
    description: so.description,
    type: "PAINTING",
    status: so.status,
    taskId: so.task?.id ?? "",
    taskName: so.task?.name ?? null,
    taskSerialNumber: null,
    taskForecastDate: null,
    assignedToName: null,
    createdAt: (so.createdAt as Date).toISOString(),
  })),
  lowStockItems: [],
  completedTasks: [],
  recentMessages: mockMyMessages.map((m) => ({
    id: m.id,
    title: m.title,
    content: m.content,
    createdAt: (m.createdAt as Date).toISOString(),
    publishedAt: (m.publishedAt as Date | null)?.toISOString?.() ?? null,
    viewedAt: (m.viewedAt as Date | null)?.toISOString?.() ?? null,
  })),
  counts: {
    tasksCloseDeadline: 2,
    tasksCloseForecast: 0,
    openServiceOrders: mockServiceOrders.length,
    lowStockItems: 0,
    completedTasks: 0,
    recentMessages: mockMyMessages.length,
    unreadMessages: mockMyMessages.filter((m) => !m.viewedAt).length,
  },
};

// Secullum "my-calculations" mock — TimeEntriesCard reads
// data.data.{Colunas, Linhas}. Linhas has rows that map columns by index.
export const mockSecullumMyCalculations = {
  data: {
    success: true,
    data: {
      Colunas: [
        { Nome: "Data" },
        { Nome: "Entrada 1" },
        { Nome: "Saída 1" },
        { Nome: "Entrada 2" },
        { Nome: "Saída 2" },
      ],
      Linhas: [
        [
          `${(() => {
            const d = new Date();
            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} - Hoje`;
          })()}`,
          "07:30",
          "12:00",
          "13:00",
          "17:30",
        ],
        [
          `${(() => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} - Ontem`;
          })()}`,
          "07:28",
          "12:02",
          "12:58",
          "17:33",
        ],
      ],
    },
  },
};

// Demo favorites for the home screen — match three routes the tutorial visits.
const TUTORIAL_FAVORITES_BASE = [
  { path: "/producao/cronograma", title: "Cronograma" },
  { path: "/producao/recorte", title: "Recorte" },
  { path: "/producao/observacoes", title: "Observações" },
] as const;

const TUTORIAL_FAVORITES_PAYLOAD = TUTORIAL_FAVORITES_BASE.map((entry, i) => ({
  id: `tutorial-favorite-${i}`,
  path: entry.path,
  title: entry.title,
  addedAt: new Date().toISOString(),
}));

const FAVORITES_STORAGE_PREFIX = "@ankaa_favorites";

// ---------------------------------------------------------------------------
// Wrapping helpers
// ---------------------------------------------------------------------------

const wrap = (data: any[]) => ({
  success: true,
  message: "ok",
  data,
  meta: {
    page: 1,
    limit: 50,
    totalRecords: data.length,
    hasNextPage: false,
    totalPages: 1,
  },
});

// Each entry: a list-style entity (uses { success, data, meta } envelope).
// `keys` are the queryKey roots react-query uses for that entity.
const listEntities: Array<{ root: string; payload: ReturnType<typeof wrap> }> = [
  { root: "tasks", payload: wrap(mockTasks) },
  { root: "cuts", payload: wrap(mockCuts) },
  { root: "airbrushings", payload: wrap(mockAirbrushings) },
  { root: "observations", payload: wrap(mockObservations) },
  { root: "serviceOrders", payload: wrap(mockServiceOrders) },
  { root: "notifications", payload: wrap(mockNotifications) },
  { root: "trucks", payload: wrap(mockTrucks) },
  { root: "holidays", payload: wrap(mockHolidays) },
  { root: "ppeDeliveries", payload: wrap(mockPpeDeliveries) },
  { root: "ppeSizes", payload: wrap([]) },
  { root: "ppeDeliverySchedules", payload: wrap([]) },
  { root: "warnings", payload: wrap([]) },
  { root: "bonuses", payload: wrap([]) },
  { root: "borrows", payload: wrap([]) },
  { root: "messages", payload: wrap([]) },
];

// Custom-shape entries (queryFn returns a different shape than `wrap`).
const customEntries: Array<{ key: ReadonlyArray<unknown>; payload: unknown }> = [
  // Home dashboard — full envelope { success, message, data }
  {
    key: ["dashboards", "home"],
    payload: { success: true, message: "ok", data: mockHomeDashboardData },
  },
  // Production dashboard, in case it's hit
  {
    key: ["dashboards", "production"],
    payload: { success: true, message: "ok", data: mockHomeDashboardData },
  },
  // useMyMessages → returns plain array
  { key: ["my-messages"], payload: mockMyMessages },
  // useNotificationsInfiniteMobile uses notification keys, but unread/recent counts:
  { key: ["notifications", "unread"], payload: { success: true, data: mockNotifications, meta: { totalRecords: mockNotifications.length } } },
];

// ---------------------------------------------------------------------------
// State for restore on cleanup
// ---------------------------------------------------------------------------

interface SavedState {
  /** Snapshot of cache values keyed by JSON.stringify(queryKey) */
  cacheSnapshot: Map<string, unknown>;
  /** queryKey roots whose defaults we registered, so we can clear them */
  registeredRoots: string[];
  /** Previous AsyncStorage favorites value (or null if it didn't exist) */
  previousFavoritesByUser: Map<string, string | null>;
  /** AsyncStorage keys we wrote demo data to, so we can clean them up */
  writtenFavoritesKeys: string[];
}

let savedState: SavedState | null = null;

// ---------------------------------------------------------------------------
// Mock injection: setQueryDefaults intercepts ALL future fetches per root,
// regardless of the filter shape used in the queryKey.
// ---------------------------------------------------------------------------

function isInfinitePageContext(arg: unknown): arg is { pageParam?: unknown } {
  return (
    typeof arg === "object" &&
    arg !== null &&
    "pageParam" in (arg as Record<string, unknown>)
  );
}

function buildMockQueryFn(payload: unknown) {
  // The same queryFn must satisfy both useQuery and useInfiniteQuery.
  //
  // - For useQuery, react-query just returns whatever this resolves to.
  // - For useInfiniteQuery, react-query wraps the result into pages[]; our
  //   payload's `meta.hasNextPage = false` ensures `getNextPageParam` returns
  //   undefined and pagination stops at one page.
  return async (ctx: any) => {
    // We accept (and ignore) the queryFnContext so the same function works
    // for both query types.
    void ctx;
    if (isInfinitePageContext(ctx) && (ctx.pageParam ?? 1) !== 1) {
      // Defensive: if a page beyond 1 is somehow requested, return an empty
      // page so the list stops gracefully.
      return {
        success: true,
        message: "ok",
        data: [],
        meta: {
          page: ctx.pageParam,
          limit: 50,
          totalRecords: 0,
          hasNextPage: false,
          totalPages: 1,
        },
      };
    }
    return payload;
  };
}

async function injectFavoritesIntoStorage(): Promise<{
  previousByKey: Map<string, string | null>;
  writtenKeys: string[];
}> {
  const previousByKey = new Map<string, string | null>();
  const writtenKeys: string[] = [];
  try {
    // We don't know the user-id at injection time without coupling to
    // useAuth, so we mirror the favorites-context strategy and write under
    // BOTH the legacy non-scoped key AND every per-user key currently in
    // AsyncStorage. That way whichever path FavoritesProvider reads from on
    // its next mount/user-change, it will see demo favorites.
    const allKeys = await AsyncStorage.getAllKeys();
    const favoriteKeys = allKeys.filter((k) =>
      k.startsWith(FAVORITES_STORAGE_PREFIX) && !k.includes("show_favorites")
    );

    // Always write the legacy/non-scoped key as a fallback.
    if (!favoriteKeys.includes(FAVORITES_STORAGE_PREFIX)) {
      favoriteKeys.push(FAVORITES_STORAGE_PREFIX);
    }

    const newValue = JSON.stringify(TUTORIAL_FAVORITES_PAYLOAD);
    for (const key of favoriteKeys) {
      const prev = await AsyncStorage.getItem(key);
      previousByKey.set(key, prev);
      await AsyncStorage.setItem(key, newValue);
      writtenKeys.push(key);
    }
  } catch (err) {
    // Best-effort — never throw out of a tutorial side-effect.
    console.warn("[tutorial-mocks] failed to inject demo favorites", err);
  }
  return { previousByKey, writtenKeys };
}

async function restoreFavoritesFromStorage(saved: SavedState): Promise<void> {
  try {
    for (const key of saved.writtenFavoritesKeys) {
      const prev = saved.previousFavoritesByUser.get(key) ?? null;
      if (prev === null) {
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.setItem(key, prev);
      }
    }
  } catch (err) {
    console.warn("[tutorial-mocks] failed to restore favorites", err);
  }
}

export function injectTutorialMocks(queryClient: QueryClient): void {
  if (savedState) return;

  const cacheSnapshot = new Map<string, unknown>();
  const registeredRoots: string[] = [];

  const cache = queryClient.getQueryCache();

  // 1) Snapshot every cache value so we can restore it later.
  cache.getAll().forEach((q) => {
    cacheSnapshot.set(JSON.stringify(q.queryKey), q.state.data);
  });

  // 2) Register a queryDefaults override per root key so any FUTURE query
  //    (including fresh-mount screens with new filter params) gets the mock
  //    payload from its queryFn instead of hitting the network.
  listEntities.forEach(({ root, payload }) => {
    queryClient.setQueryDefaults([root], {
      queryFn: buildMockQueryFn(payload) as any,
      // Encourage immediate use of the mocked data and avoid live refetches
      // sneaking in while the tutorial is showing.
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    } as any);
    registeredRoots.push(root);

    // 3) Pre-seed common shapes so already-rendered screens flip immediately
    //    without waiting for a refetch.
    queryClient.setQueryData([root], payload);
    queryClient.setQueryData([root, "list"], payload);
    queryClient.setQueryData([root, { tutorialMode: true }], payload);

    // Also overwrite every cached query that already exists for this root
    // with the mock — covers screens currently mounted at start().
    cache.getAll().forEach((q) => {
      if (q.queryKey[0] === root) {
        // Detect infinite query by inspecting current state shape.
        const existing: any = q.state.data;
        if (existing && Array.isArray(existing.pages)) {
          queryClient.setQueryData(q.queryKey, {
            pages: [payload],
            pageParams: [1],
          });
        } else {
          queryClient.setQueryData(q.queryKey, payload);
        }
      }
    });
  });

  // 4) Custom-shape queries (different envelope than the `wrap` helper).
  customEntries.forEach(({ key, payload }) => {
    const root = key[0] as string;
    queryClient.setQueryDefaults(key as readonly unknown[], {
      queryFn: buildMockQueryFn(payload) as any,
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    } as any);
    if (!registeredRoots.includes(root)) registeredRoots.push(root);

    queryClient.setQueryData(key, payload);
    cache.getAll().forEach((q) => {
      // Match all queries whose key starts with this prefix.
      const matches = key.every((seg, i) => q.queryKey[i] === seg);
      if (matches) {
        queryClient.setQueryData(q.queryKey, payload);
      }
    });
  });

  // 5) Secullum "my-calculations" — keyed under [...secullumKeys.all,
  //    "my-calculations", params]. Set defaults on the prefix.
  const secullumPrefix = ["secullum", "my-calculations"] as const;
  queryClient.setQueryDefaults(secullumPrefix, {
    queryFn: buildMockQueryFn(mockSecullumMyCalculations) as any,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  } as any);
  if (!registeredRoots.includes("secullum")) registeredRoots.push("secullum");
  cache.getAll().forEach((q) => {
    if (q.queryKey[0] === "secullum" && q.queryKey[1] === "my-calculations") {
      queryClient.setQueryData(q.queryKey, mockSecullumMyCalculations);
    }
  });

  // 6) Inject AsyncStorage favorites in the background. Don't await — the
  //    tutorial start path is synchronous; we restore state on cleanup.
  const initial: SavedState = {
    cacheSnapshot,
    registeredRoots,
    previousFavoritesByUser: new Map(),
    writtenFavoritesKeys: [],
  };
  savedState = initial;

  injectFavoritesIntoStorage()
    .then(({ previousByKey, writtenKeys }) => {
      // savedState may have been cleared meanwhile — guard.
      if (savedState === initial) {
        savedState.previousFavoritesByUser = previousByKey;
        savedState.writtenFavoritesKeys = writtenKeys;
      }
    })
    .catch(() => {});
}

export function clearTutorialMocks(queryClient: QueryClient): void {
  if (!savedState) return;
  const saved = savedState;
  savedState = null;

  // 1) Drop the queryDefaults overrides so live queryFns are used again.
  saved.registeredRoots.forEach((root) => {
    try {
      // Passing an empty object effectively resets defaults.
      queryClient.setQueryDefaults([root], {} as any);
    } catch {}
  });
  // Also reset more specific prefixes we set.
  try {
    queryClient.setQueryDefaults(["dashboards", "home"], {} as any);
    queryClient.setQueryDefaults(["dashboards", "production"], {} as any);
    queryClient.setQueryDefaults(["my-messages"], {} as any);
    queryClient.setQueryDefaults(["notifications", "unread"], {} as any);
    queryClient.setQueryDefaults(["secullum", "my-calculations"], {} as any);
  } catch {}

  // 2) Restore previously-cached values.
  const cache = queryClient.getQueryCache();
  cache.getAll().forEach((q) => {
    const key = JSON.stringify(q.queryKey);
    if (saved.cacheSnapshot.has(key)) {
      queryClient.setQueryData(q.queryKey, saved.cacheSnapshot.get(key));
    } else {
      // Query didn't exist before tutorial — remove our mocked entry so the
      // next consumer triggers a real fetch instead of seeing demo data.
      try {
        queryClient.removeQueries({ queryKey: q.queryKey, exact: true });
      } catch {}
    }
  });

  // 3) Restore AsyncStorage favorites.
  restoreFavoritesFromStorage(saved).catch(() => {});

  // 4) Trigger a background refetch so screens repaint with real data.
  queryClient.invalidateQueries();
}

// Public bag for other tutorial-time consumers (e.g. agent 3's task picker).
export const tutorialMocks = {
  tasks: mockTasks,
  completedTasks: mockCompletedTasks,
  cuts: mockCuts,
  airbrushings: mockAirbrushings,
  observations: mockObservations,
  serviceOrders: mockServiceOrders,
  notifications: mockNotifications,
  trucks: mockTrucks,
  holidays: mockHolidays,
  ppeDeliveries: mockPpeDeliveries,
  myMessages: mockMyMessages,
  homeDashboard: mockHomeDashboardData,
  secullumMyCalculations: mockSecullumMyCalculations,
  favorites: TUTORIAL_FAVORITES_PAYLOAD,
};
